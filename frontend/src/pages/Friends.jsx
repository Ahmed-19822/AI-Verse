import { useEffect, useState, useCallback } from 'react'
import { MagnifyingGlass, UserPlus, Check, X, Prohibit, Circle, UserMinus } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'

const TABS = ['Friends', 'Requests', 'Find people']

export default function Friends() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFriends = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase.from('friends')
      .select('friend_id, profiles:friend_id(id, username, status, avatar_url)')
      .eq('user_id', user.id)
    if (error) { console.error('friends error', error); return }
    setFriends((data || []).map((r) => r.profiles).filter(Boolean))
    setLoading(false)
  }, [user?.id])

  const loadRequests = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase.from('friend_requests')
      .select('id, sender_id, profiles:sender_id(id, username, avatar_url)')
      .eq('receiver_id', user.id).eq('status', 'pending')
    setRequests(data || [])
  }, [user?.id])

  const loadSent = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase.from('friend_requests')
      .select('receiver_id').eq('sender_id', user.id).eq('status', 'pending')
    setSentRequests((data || []).map((r) => r.receiver_id))
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadFriends(); loadRequests(); loadSent()
  }, [user?.id, loadFriends, loadRequests, loadSent])

  const runSearch = async (e) => {
    e?.preventDefault()
    if (!search.trim()) return setResults([])
    const { data, error } = await supabase.from('profiles')
      .select('id, username, avatar_url, status')
      .ilike('username', `%${search}%`)
      .neq('id', user.id)
      .limit(20)
    if (error) toast.error(error.message)
    setResults(data || [])
  }

  const sendRequest = async (receiverId, username) => {
    const { error } = await supabase.from('friend_requests')
      .insert({ sender_id: user.id, receiver_id: receiverId })
    if (error) {
      if (error.code === '23505') toast.error('Request already sent')
      else toast.error(error.message)
      return
    }
    setSentRequests((s) => [...s, receiverId])
    toast.success(`Friend request sent to ${username}!`)
  }

  const respond = async (req, accept) => {
    const { error: updateErr } = await supabase.from('friend_requests')
      .update({ status: accept ? 'accepted' : 'rejected' }).eq('id', req.id)
    if (updateErr) { toast.error('Failed to respond'); return }

    if (accept) {
      const { error: e1 } = await supabase.from('friends')
        .insert({ user_id: user.id, friend_id: req.sender_id })
      if (e1 && e1.code !== '23505') console.warn('friends insert 1', e1)

      const { error: e2 } = await supabase.from('friends')
        .insert({ user_id: req.sender_id, friend_id: user.id })
      if (e2 && e2.code !== '23505') console.warn('friends insert 2', e2)

      toast.success(`You and ${req.profiles?.username} are now friends!`)
    } else {
      toast.info('Request declined')
    }
    loadRequests(); loadFriends()
  }

  const removeFriend = async (friendId, username) => {
    await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId)
    await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', user.id)
    setFriends((f) => f.filter((fr) => fr.id !== friendId))
    toast.info(`Removed ${username}`)
  }

  const blockUser = async (id, username) => {
    await supabase.from('blocked_users').insert({ user_id: user.id, blocked_id: id })
    await removeFriend(id, username)
    toast.info(`Blocked ${username}`)
  }

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-4xl mx-auto">
      <p className="label-eyebrow mb-2">Your circle</p>
      <h1 className="font-display text-4xl tracking-tight mb-8">Friends</h1>

      <div className="flex gap-2 mb-8 glass rounded-2xl p-1.5 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${tab === t ? 'bg-violet/25 text-ink border border-violet/40' : 'text-mute hover:text-ink'}`}>
            {t}
            {t === 'Requests' && requests.length > 0 && (
              <span className="bg-magenta text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Friends' && (
        <div className="space-y-3">
          {loading && <div className="glass-card p-8 text-center text-mute text-sm">Loading…</div>}
          {!loading && friends.length === 0 && <Empty text="No friends yet — find people in the Find people tab." />}
          {friends.map((f) => (
            <div key={f.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-cyan" />
                  <Circle weight="fill" size={10} className={`absolute -bottom-0.5 -right-0.5 ${f.status === 'online' ? 'text-cyan' : 'text-mute'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.username}</p>
                  <p className="text-xs text-mute capitalize">{f.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => removeFriend(f.id, f.username)} className="text-mute hover:text-ink p-2 rounded-lg glass hover:border-line" title="Remove friend"><UserMinus size={16} /></button>
                <button onClick={() => blockUser(f.id, f.username)} className="text-mute hover:text-magenta p-2 rounded-lg glass hover:border-magenta/30" title="Block"><Prohibit size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Requests' && (
        <div className="space-y-3">
          {requests.length === 0 && <Empty text="No pending friend requests." />}
          {requests.map((r) => (
            <div key={r.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-cyan" />
                <div>
                  <p className="text-sm font-medium">{r.profiles?.username}</p>
                  <p className="text-xs text-mute">Wants to connect</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respond(r, true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan/20 text-cyan text-xs hover:bg-cyan/30 transition-colors"><Check size={14} /> Accept</button>
                <button onClick={() => respond(r, false)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-magenta text-xs hover:border-magenta/40 transition-colors"><X size={14} /> Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Find people' && (
        <div>
          <form onSubmit={runSearch} className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 mb-6 max-w-sm">
            <MagnifyingGlass size={16} className="text-mute" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
            <button type="submit" className="text-xs text-cyan hover:underline shrink-0">Search</button>
          </form>
          <div className="space-y-3">
            {results.map((r) => {
              const isFriend = friends.some((f) => f.id === r.id)
              const isPending = sentRequests.includes(r.id)
              return (
                <div key={r.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-cyan" />
                    <div>
                      <p className="text-sm font-medium">{r.username}</p>
                      <p className="text-xs text-mute capitalize">{r.status}</p>
                    </div>
                  </div>
                  {isFriend ? (
                    <span className="text-xs text-cyan">Already friends</span>
                  ) : isPending ? (
                    <span className="text-xs text-mute">Request sent</span>
                  ) : (
                    <button onClick={() => sendRequest(r.id, r.username)}
                      className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5">
                      <UserPlus size={14} /> Add
                    </button>
                  )}
                </div>
              )
            })}
            {results.length === 0 && search && <Empty text="No users found." />}
          </div>
        </div>
      )}
    </section>
  )
}

function Empty({ text }) {
  return <div className="glass-card p-10 text-center text-mute text-sm">{text}</div>
}
