import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Gauge, UsersThree, ShieldWarning, ClipboardText, MagnifyingGlass,
  Prohibit, CheckCircle, CrownSimple, Trash, WarningCircle,
} from 'phosphor-react'
import { apiFetch } from '../lib/api.js'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'users', label: 'Users', icon: UsersThree },
  { id: 'moderation', label: 'Moderation', icon: ShieldWarning },
  { id: 'logs', label: 'Audit log', icon: ClipboardText },
]

export default function AdminPanel() {
  const [tab, setTab] = useState('overview')

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="label-eyebrow mb-2">Restricted area</p>
          <h1 className="font-display text-4xl tracking-tight">Admin panel</h1>
        </div>
        <span className="flex items-center gap-2 text-xs font-mono text-magenta glass rounded-full px-3 py-1.5">
          <WarningCircle size={14} /> Admin-only — actions are logged
        </span>
      </div>

      <div className="flex gap-2 mb-10 glass rounded-2xl p-1.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
              tab === t.id ? 'bg-violet/25 text-ink border border-violet/40' : 'text-mute hover:text-ink'
            }`}
          >
            <t.icon size={16} weight={tab === t.id ? 'duotone' : 'regular'} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <Users />}
      {tab === 'moderation' && <Moderation />}
      {tab === 'logs' && <Logs />}
    </section>
  )
}

function Overview() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/api/admin/stats').then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorBox message={error} />
  if (!stats) return <LoadingBox />

  const cards = [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Premium', value: stats.premiumUsers },
    { label: 'Pro', value: stats.proUsers },
    { label: 'Suspended', value: stats.suspendedUsers },
    { label: 'Posts', value: stats.totalPosts },
    { label: 'Messages today', value: stats.messagesToday },
    { label: 'Estimated MRR', value: `$${stats.estimatedMRR.toFixed(2)}` },
  ]

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card p-6"
        >
          <p className="text-xs text-mute mb-2 font-mono uppercase tracking-wide">{c.label}</p>
          <p className="font-display text-3xl">{c.value}</p>
        </motion.div>
      ))}
    </div>
  )
}

function Users() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/admin/users?search=${encodeURIComponent(q)}`)
      setUsers(res.users)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const act = async (id, action, body) => {
    try {
      await apiFetch(`/api/admin/users/${id}/${action}`, { method: 'POST', body: body && JSON.stringify(body) })
      load(search)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); load(search) }}
        className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 mb-6 max-w-sm"
      >
        <MagnifyingGlass size={16} className="text-mute" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username..."
          className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60"
        />
      </form>

      {error && <ErrorBox message={error} />}
      {loading ? (
        <LoadingBox />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mute border-b border-line">
                <th className="px-5 py-3 font-normal">User</th>
                <th className="px-5 py-3 font-normal">Plan</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Joined</th>
                <th className="px-5 py-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet to-cyan shrink-0" />
                    {u.username}
                    {u.is_admin && <CrownSimple size={14} weight="fill" className="text-cyan" />}
                  </td>
                  <td className="px-5 py-3 capitalize">{u.premium_plan}</td>
                  <td className="px-5 py-3">
                    {u.is_suspended ? (
                      <span className="text-magenta text-xs">Suspended</span>
                    ) : (
                      <span className="text-cyan text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-mute text-xs font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {u.is_suspended ? (
                        <IconButton title="Unsuspend" onClick={() => act(u.id, 'unsuspend')}><CheckCircle size={16} /></IconButton>
                      ) : (
                        <IconButton title="Suspend" onClick={() => act(u.id, 'suspend')}><Prohibit size={16} /></IconButton>
                      )}
                      <IconButton title="Comp Premium" onClick={() => act(u.id, 'override-plan', { plan: 'premium' })}>
                        <CrownSimple size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Moderation() {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState(null)

  const load = () => apiFetch('/api/admin/posts').then((r) => setPosts(r.posts)).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const remove = async (id) => {
    try {
      await apiFetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) return <ErrorBox message={error} />

  return (
    <div className="space-y-3">
      {posts.length === 0 && <p className="text-mute text-sm">No posts to review.</p>}
      {posts.map((p) => (
        <div key={p.id} className="glass-card p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink/90">{p.content}</p>
            <p className="text-xs text-mute mt-1 font-mono">{new Date(p.created_at).toLocaleString()}</p>
          </div>
          <IconButton title="Delete post" onClick={() => remove(p.id)}><Trash size={16} className="text-magenta" /></IconButton>
        </div>
      ))}
    </div>
  )
}

function Logs() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/api/admin/logs').then((r) => setLogs(r.logs)).catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorBox message={error} />

  return (
    <div className="glass-card divide-y divide-line">
      {logs.length === 0 && <p className="text-mute text-sm p-5">No actions logged yet.</p>}
      {logs.map((l) => (
        <div key={l.id} className="px-5 py-3 flex items-center justify-between text-sm">
          <span>
            <span className="text-cyan">{l.admin?.username || 'admin'}</span>{' '}
            <span className="text-mute">{l.action.replaceAll('_', ' ')}</span>
          </span>
          <span className="text-xs text-mute font-mono">{new Date(l.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function IconButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="h-8 w-8 flex items-center justify-center rounded-lg glass hover:border-cyan/50 transition-colors"
    >
      {children}
    </button>
  )
}

function LoadingBox() {
  return <div className="glass-card p-10 text-center text-mute text-sm">Loading…</div>
}

function ErrorBox({ message }) {
  return (
    <div className="glass-card p-5 text-sm text-magenta border-magenta/30">
      {message}
    </div>
  )
}
