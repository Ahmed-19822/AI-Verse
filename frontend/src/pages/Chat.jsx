import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PaperPlaneRight, UsersThree, Plus, Circle, DotsThree, Trash } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'

export default function Chat() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [chats, setChats] = useState([])
  const [friends, setFriends] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [activeChatName, setActiveChatName] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const autoOpenedRef = useRef(false)

  const otherMember = (c) => (c.chat_members || []).find((m) => m.user_id !== user.id)?.profiles

  const loadChats = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('chat_members')
      .select('chat_id, role, chats:chat_id(id, is_group, created_at, groups(name), chat_members(user_id, profiles:user_id(username, avatar_url)))')
      .eq('user_id', user.id)
    if (error) { console.error('load chats error', error); return }
    setChats((data || []).map((r) => r.chats).filter(Boolean))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadChats()
    supabase.from('friends')
      .select('friend_id, profiles:friend_id(id, username, status, avatar_url)')
      .eq('user_id', user.id)
      .then(({ data }) => setFriends((data || []).map((r) => r.profiles).filter(Boolean)))
  }, [user?.id, loadChats])

  // Deep-link support: /chat?user=<id> (e.g. the "Message" button on someone's profile)
  useEffect(() => {
    const targetUserId = searchParams.get('user')
    if (!targetUserId || autoOpenedRef.current || friends.length === 0) return
    const friend = friends.find((f) => f.id === targetUserId)
    if (friend) {
      autoOpenedRef.current = true
      startDirectChat(friend)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, friends])

  useEffect(() => {
    if (!activeChat) return
    // Load message history
    supabase.from('messages')
      .select('*, profiles:sender_id(username, avatar_url)')
      .eq('chat_id', activeChat.id)
      .eq('deleted', false)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) console.error('load messages error', error)
        setMessages(data || [])
      })

    // Realtime subscription
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`chat:${activeChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `chat_id=eq.${activeChat.id}`
      }, (payload) => {
        setMessages((m) => [...m, payload.new])
      })
      .subscribe()

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [activeChat?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const startDirectChat = async (friend) => {
    // Check if a 1:1 chat already exists
    const { data: mine } = await supabase.from('chat_members').select('chat_id').eq('user_id', user.id)
    const { data: theirs } = await supabase.from('chat_members').select('chat_id').eq('user_id', friend.id)
    const myIds = (mine || []).map((m) => m.chat_id)
    const theirIds = (theirs || []).map((t) => t.chat_id)
    const shared = myIds.find((id) => theirIds.includes(id))

    if (shared) {
      setActiveChat({ id: shared, is_group: false })
      setActiveChatName(friend.username)
      setShowNewChat(false)
      return
    }

    // Create new chat
    const { data: chat, error: chatErr } = await supabase
      .from('chats').insert({ is_group: false, created_by: user.id }).select().single()
    if (chatErr) { toast.error('Could not create chat'); return }

    const { error: m1 } = await supabase.from('chat_members').insert({ chat_id: chat.id, user_id: user.id })
    if (m1) { toast.error('Could not join chat'); return }
    const { error: m2 } = await supabase.from('chat_members').insert({ chat_id: chat.id, user_id: friend.id })
    if (m2) console.warn('Could not add friend to chat', m2)

    await loadChats()
    setActiveChat(chat)
    setActiveChatName(friend.username)
    setShowNewChat(false)
    toast.success(`Chat with ${friend.username} started!`)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!draft.trim() || !activeChat || sending) return
    setSending(true)
    const content = draft.trim()
    setDraft('')
    const { error } = await supabase.from('messages').insert({
      chat_id: activeChat.id, sender_id: user.id, content, message_type: 'text'
    })
    if (error) { toast.error('Failed to send message'); setDraft(content) }
    setSending(false)
  }

  const deleteMessage = async (msgId) => {
    await supabase.from('messages').update({ deleted: true }).eq('id', msgId)
    setMessages((m) => m.filter((msg) => msg.id !== msgId))
  }

  return (
    <section className="pt-6 md:pt-10 px-4 pb-4 max-w-7xl mx-auto flex-1 flex flex-col w-full min-h-0">
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 glass-card p-3 flex flex-col">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <h2 className="font-display text-lg">Chats</h2>
            <button onClick={() => setShowNewChat(!showNewChat)} className="h-8 w-8 flex items-center justify-center rounded-lg glass hover:border-cyan/50 transition-colors">
              <Plus size={16} />
            </button>
          </div>

          {showNewChat && (
            <div className="mb-3 border-b border-line pb-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-mute px-2 mb-2">Start a chat with:</p>
              {friends.length === 0 && <p className="text-xs text-mute px-2">Add friends first.</p>}
              {friends.map((f) => (
                <button key={f.id} onClick={() => startDirectChat(f)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm flex items-center gap-2">
                  <div className="relative">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet to-cyan overflow-hidden flex items-center justify-center text-[10px] font-display text-white">
                      {f.avatar_url ? <img src={f.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : f.username?.[0]?.toUpperCase()}
                    </div>
                    <Circle weight="fill" size={8} className={`absolute -bottom-0.5 -right-0.5 ${f.status === 'online' ? 'text-cyan' : 'text-mute'}`} />
                  </div>
                  {f.username}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1">
            {chats.map((c) => {
              const other = !c.is_group ? otherMember(c) : null
              return (
                <button key={c.id} onClick={() => { setActiveChat(c); setActiveChatName(c.is_group ? (c.groups?.name || 'Group') : (other?.username || 'Direct message')) }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors ${activeChat?.id === c.id ? 'bg-violet/20 border border-violet/40' : 'hover:bg-white/5'}`}>
                  {c.is_group
                    ? <UsersThree size={18} className="text-cyan shrink-0" />
                    : (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet to-cyan shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-display text-white">
                        {other?.avatar_url ? <img src={other.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : other?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  <span className="truncate">{c.is_group ? (c.groups?.name || 'Group') : (other?.username || 'Direct message')}</span>
                </button>
              )
            })}
            {chats.length === 0 && <p className="text-xs text-mute px-3 py-4 text-center">No chats yet.<br />Click + to start one.</p>}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 glass-card flex flex-col min-h-0">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-mute gap-2">
              <UsersThree size={40} className="opacity-30" />
              <p className="text-sm">Select a chat to start messaging</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-line flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet to-cyan" />
                <div>
                  <p className="text-sm font-medium">{activeChatName}</p>
                  <p className="text-xs text-cyan">{activeChat.is_group ? 'Group' : 'Direct message'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-mute text-sm mt-10">No messages yet. Say something!</div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex items-end gap-2 ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    {m.sender_id !== user.id && (
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet to-cyan shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-display text-white">
                        {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : m.profiles?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="group relative">
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user.id ? 'bg-violet/30 border border-violet/40 rounded-br-sm' : 'glass rounded-bl-sm'}`}>
                        {m.content}
                      </div>
                      {m.sender_id === user.id && (
                        <button onClick={() => deleteMessage(m.id)} className="absolute -top-2 -left-6 opacity-0 group-hover:opacity-100 transition-opacity text-mute hover:text-magenta">
                          <Trash size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sending && <div className="flex justify-end"><div className="text-xs text-mute">Sending…</div></div>}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className="flex items-center gap-2 p-4 border-t border-line">
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                  className="flex-1 glass rounded-xl px-4 py-3 text-sm outline-none placeholder:text-mute/60" />
                <button type="submit" disabled={!draft.trim() || sending}
                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet hover:bg-violet-bright transition-colors disabled:opacity-40">
                  <PaperPlaneRight size={18} weight="fill" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
