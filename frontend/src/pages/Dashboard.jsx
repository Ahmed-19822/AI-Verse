import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChatCircleDots, UsersThree, Bell, Brain, Circle, Sparkle, ArrowRight } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [friends, setFriends] = useState([])
  const [notifications, setNotifications] = useState([])
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const [{ data: fr }, { data: no }, { data: ch }] = await Promise.all([
      supabase.from('friends').select('friend_id, profiles:friend_id(id, username, status)').eq('user_id', user.id).limit(10),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('chat_members').select('chat_id, chats:chat_id(id, is_group, created_at, groups(name), chat_members(user_id, profiles:user_id(username, avatar_url)))').eq('user_id', user.id).limit(5),
    ])
    setFriends((fr || []).map((r) => r.profiles).filter(Boolean))
    setNotifications(no || [])
    setChats((ch || []).map((r) => r.chats).filter(Boolean))
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const onlineCount = friends.filter((f) => f?.status === 'online').length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-mute text-sm flex items-center gap-2">
        <Sparkle size={16} className="text-cyan animate-glow" weight="duotone" /> Loading your dashboard…
      </div>
    </div>
  )

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <p className="label-eyebrow mb-2">Welcome back</p>
      <h1 className="font-display text-4xl tracking-tight mb-2">{profile?.username || 'Dashboard'}</h1>
      <p className="text-mute text-sm mb-10 capitalize">{profile?.premium_plan || 'free'} plan · <Link to="/premium" className="text-cyan hover:underline">Manage</Link></p>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={UsersThree} label="Friends" value={friends.length} sub={`${onlineCount} online now`} to="/friends" />
        <StatCard icon={ChatCircleDots} label="Active chats" value={chats.length} to="/chat" />
        <StatCard icon={Brain} label="AI characters" to="/ai-hub" value="6+" />
        <StatCard icon={Bell} label="Notifications" value={notifications.filter(n => !n.read).length} sub="unread" to="/dashboard" />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[['Chat', '/chat'], ['Friends', '/friends'], ['AI Hub', '/ai-hub'], ['Groups', '/groups'], ['Status', '/status'], ['Feed', '/feed'], ['Settings', '/settings']].map(([label, to]) => (
          <Link key={to} to={to} className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5">
            {label} <ArrowRight size={12} />
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent chats */}
        <div className="md:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Recent chats</h2>
            <Link to="/chat" className="text-xs text-cyan hover:underline">Open chat →</Link>
          </div>
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-mute text-sm">No conversations yet.</p>
              <Link to="/friends" className="text-cyan text-xs hover:underline mt-1 block">Add friends to start chatting</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((c) => {
                const other = !c.is_group
                  ? (c.chat_members || []).find((m) => m.user_id !== user.id)?.profiles
                  : null
                return (
                  <Link key={c.id} to="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet to-cyan shrink-0 overflow-hidden flex items-center justify-center text-xs font-display text-white">
                      {other?.avatar_url ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" /> : (other?.username?.[0]?.toUpperCase() || '')}
                    </div>
                    <div>
                      <p className="text-sm">{c.is_group ? (c.groups?.name || 'Group chat') : `Message from ${other?.username || 'a friend'}`}</p>
                      <p className="text-xs text-mute">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <h2 className="font-display text-lg mb-4 flex items-center gap-2"><Bell size={16} /> Activity</h2>
          {notifications.length === 0 ? (
            <p className="text-mute text-sm">You're all caught up.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className={`text-sm border-b border-line last:border-0 pb-3 ${!n.read ? 'opacity-100' : 'opacity-60'}`}>
                  <span className="capitalize text-xs text-cyan">{n.type?.replaceAll('_', ' ')}</span>
                  <p className="text-xs text-mute mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Online friends */}
      {friends.length > 0 && (
        <div className="glass-card p-6 mt-6">
          <h2 className="font-display text-lg mb-4">Online now</h2>
          <div className="flex flex-wrap gap-4">
            {friends.filter((f) => f?.status === 'online').map((f) => (
              <div key={f.id} className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-sm">
                <Circle weight="fill" size={8} className="text-cyan" /> {f.username}
              </div>
            ))}
            {onlineCount === 0 && <p className="text-mute text-sm">No friends online right now.</p>}
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ icon: Icon, label, value, sub, to }) {
  return (
    <Link to={to} className="glass-card p-5 hover:border-violet/40 transition-colors">
      <Icon size={20} weight="duotone" className="text-violet-bright mb-3" />
      <p className="text-xs text-mute font-mono uppercase">{label}</p>
      <p className="font-display text-3xl mt-1">{value}</p>
      {sub && <p className="text-xs text-cyan mt-1">{sub}</p>}
    </Link>
  )
}
