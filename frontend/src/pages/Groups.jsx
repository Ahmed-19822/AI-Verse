import { useEffect, useState, useCallback, useRef } from 'react'
import { UsersThree, Plus, Crown, X, PaperPlaneRight } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'

export default function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [friends, setFriends] = useState([])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selected, setSelected] = useState([])
  const [active, setActive] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const channelRef = useRef(null)

  const loadGroups = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase.from('chat_members')
      .select('chat_id, role, chats:chat_id(id, is_group, groups(name, description))')
      .eq('user_id', user.id)
    if (error) { console.error(error); return }
    setGroups((data || []).filter((r) => r.chats?.is_group))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadGroups()
    supabase.from('friends').select('friend_id, profiles:friend_id(id, username)').eq('user_id', user.id)
      .then(({ data }) => setFriends((data || []).map((r) => r.profiles).filter(Boolean)))
  }, [user?.id, loadGroups])

  const loadGroupData = async (g) => {
    setActive(g)
    const [{ data: mems }, { data: msgs }] = await Promise.all([
      supabase.from('chat_members').select('user_id, role, profiles:user_id(username)').eq('chat_id', g.chat_id),
      supabase.from('messages').select('*, profiles:sender_id(username)').eq('chat_id', g.chat_id).eq('deleted', false).order('created_at').limit(50)
    ])
    setMembers(mems || [])
    setMessages(msgs || [])

    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`group-chat:${g.chat_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `chat_id=eq.${g.chat_id}`
      }, (payload) => {
        setMessages((m) => {
          if (m.some((msg) => msg.id === payload.new.id)) return m
          const sender = (mems || []).find((mem) => mem.user_id === payload.new.sender_id)
          return [...m, { ...payload.new, profiles: sender?.profiles }]
        })
      })
      .subscribe()
  }

  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const createGroup = async () => {
    if (!name.trim()) { toast.error('Group name is required'); return }
    setSaving(true)
    const { data: chat, error: chatErr } = await supabase
      .from('chats').insert({ is_group: true, created_by: user.id }).select().single()
    if (chatErr) { toast.error('Failed to create group'); setSaving(false); return }

    const { error: groupErr } = await supabase.from('groups').insert({ id: chat.id, name, description: desc })
    if (groupErr) { toast.error('Failed to set group info'); setSaving(false); return }

    // Add creator as admin
    await supabase.from('chat_members').insert({ chat_id: chat.id, user_id: user.id, role: 'admin' })
    // Add selected members one by one
    for (const memberId of selected) {
      await supabase.from('chat_members').insert({ chat_id: chat.id, user_id: memberId, role: 'member' })
    }

    toast.success(`Group "${name}" created!`)
    setName(''); setDesc(''); setSelected([]); setCreating(false)
    setSaving(false)
    loadGroups()
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!draft.trim() || !active) return
    const content = draft.trim()
    setDraft('')
    const { error } = await supabase.from('messages').insert({
      chat_id: active.chat_id, sender_id: user.id, content, message_type: 'text'
    })
    if (error) { toast.error('Failed to send'); setDraft(content) }
  }

  const toggleAdmin = async (chatId, userId, currentRole) => {
    await supabase.from('chat_members').update({ role: currentRole === 'admin' ? 'member' : 'admin' }).eq('chat_id', chatId).eq('user_id', userId)
    loadGroupData(active)
  }

  const removeMember = async (chatId, userId) => {
    await supabase.from('chat_members').delete().eq('chat_id', chatId).eq('user_id', userId)
    setMembers((m) => m.filter((mem) => mem.user_id !== userId))
    toast.info('Member removed')
  }

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><p className="label-eyebrow mb-2">Communities</p><h1 className="font-display text-4xl tracking-tight">Groups</h1></div>
        <button onClick={() => setCreating(!creating)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> New group</button>
      </div>

      {creating && (
        <div className="glass-card p-6 mb-8 space-y-4">
          <h3 className="font-display text-lg">Create a group</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name *"
            className="glass rounded-xl px-4 py-3 text-sm outline-none w-full placeholder:text-mute/60" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)"
            className="glass rounded-xl px-4 py-3 text-sm outline-none w-full placeholder:text-mute/60" />
          {friends.length > 0 && (
            <div>
              <p className="text-xs text-mute mb-2">Add friends to group:</p>
              <div className="flex flex-wrap gap-2">
                {friends.map((f) => (
                  <button key={f.id} onClick={() => setSelected((s) => s.includes(f.id) ? s.filter((id) => id !== f.id) : [...s, f.id])}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${selected.includes(f.id) ? 'bg-violet/30 border-violet/50 text-cyan' : 'glass border-line'}`}>
                    {f.username}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={createGroup} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
              {saving ? 'Creating…' : 'Create group'}
            </button>
            <button onClick={() => setCreating(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="space-y-3">
          <h3 className="text-xs text-mute font-mono uppercase">Your groups</h3>
          {groups.map((g) => (
            <button key={g.chat_id} onClick={() => loadGroupData(g)}
              className={`glass-card p-4 w-full text-left flex items-center gap-3 transition-colors ${active?.chat_id === g.chat_id ? 'border-violet/50' : ''}`}>
              <UsersThree size={20} className="text-cyan shrink-0" />
              <div>
                <p className="text-sm font-medium">{g.chats?.groups?.name}</p>
                <p className="text-xs text-mute capitalize">{g.role}</p>
              </div>
            </button>
          ))}
          {groups.length === 0 && <p className="text-mute text-sm">No groups yet.</p>}
        </div>

        {active && (
          <>
            <div className="glass-card flex flex-col" style={{ height: '500px' }}>
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-medium">{active.chats?.groups?.name}</p>
                <p className="text-xs text-mute">{members.length} members</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${m.sender_id === user.id ? 'bg-violet/30 border border-violet/40' : 'glass'}`}>
                      {m.sender_id !== user.id && <p className="text-xs text-cyan mb-1">{m.profiles?.username}</p>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center text-mute text-sm mt-8">No messages yet</p>}
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-line">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message the group…"
                  className="flex-1 glass rounded-xl px-3 py-2 text-sm outline-none placeholder:text-mute/60" />
                <button type="submit" className="h-9 w-9 flex items-center justify-center rounded-xl bg-violet hover:bg-violet-bright transition-colors">
                  <PaperPlaneRight size={16} weight="fill" />
                </button>
              </form>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-display text-base mb-4">Members ({members.length})</h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                    <span className="text-sm flex items-center gap-2">
                      {m.profiles?.username}
                      {m.role === 'admin' && <Crown size={12} weight="fill" className="text-cyan" />}
                    </span>
                    {m.user_id !== user.id && (
                      <div className="flex gap-1">
                        <button onClick={() => toggleAdmin(active.chat_id, m.user_id, m.role)} className="text-xs text-cyan hover:underline">
                          {m.role === 'admin' ? 'Demote' : 'Admin'}
                        </button>
                        <button onClick={() => removeMember(active.chat_id, m.user_id)} className="text-mute hover:text-magenta ml-2"><X size={12} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
