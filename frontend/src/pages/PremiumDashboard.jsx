import { useEffect, useState } from 'react'
import { CrownSimple, Brain, UsersThree, HardDrive, ArrowUp, CreditCard, Check } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { apiFetch } from '../lib/api.js'
import { Link } from 'react-router-dom'

const PLANS = {
  free:    { label: 'Free',    price: '$0',     features: ['20 AI messages/day', '3 AI characters', 'Basic chat & groups'] },
  premium: { label: 'Premium', price: '$5.99',  features: ['Unlimited AI chat', 'AI memory', 'Unlimited characters', 'Premium badge'] },
  pro:     { label: 'Pro',     price: '$12.99', features: ['Everything in Premium', 'Voice AI', 'AI image gen', 'AI Marketplace', 'AI Analytics', 'Unlimited storage'] },
}

export default function PremiumDashboard() {
  const { user, profile } = useAuth()
  const [usage, setUsage] = useState({ aiToday: 0, characters: 0, friends: 0, messages: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const plan = profile?.premium_plan || 'free'

  useEffect(() => {
    if (!user?.id) return
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    Promise.all([
      supabase.from('ai_messages').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfDay.toISOString()),
      supabase.from('ai_characters').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      supabase.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', user.id),
    ]).then(([ai, chars, friends, msgs]) => {
      setUsage({ aiToday: ai.count ?? 0, characters: chars.count ?? 0, friends: friends.count ?? 0, messages: msgs.count ?? 0 })
    })
  }, [user?.id])

  const upgrade = async (targetPlan) => {
    setLoading(true); setError(null)
    try {
      const res = await apiFetch('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ plan: targetPlan }) })
      window.location.href = res.url
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  const openPortal = async () => {
    setLoading(true); setError(null)
    try {
      const res = await apiFetch('/api/billing/portal', { method: 'POST' })
      window.location.href = res.url
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="label-eyebrow mb-2">Your plan</p>
          <h1 className="font-display text-4xl tracking-tight flex items-center gap-3">
            Premium Dashboard {plan !== 'free' && <CrownSimple size={28} weight="fill" className="text-cyan" />}
          </h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          {plan === 'free' && <button onClick={() => upgrade('premium')} disabled={loading} className="btn-primary flex items-center gap-2 text-sm"><ArrowUp size={16} /> Upgrade to Premium</button>}
          {plan !== 'pro' && <button onClick={() => upgrade('pro')} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm"><ArrowUp size={16} /> Go Pro</button>}
          {plan !== 'free' && <button onClick={openPortal} disabled={loading} className="btn-ghost flex items-center gap-2 text-sm"><CreditCard size={16} /> Manage billing</button>}
        </div>
      </div>

      {error && <p className="text-magenta text-sm mb-4 glass-card p-3">{error}</p>}

      {plan === 'pro' && (
        <div className="flex gap-3 flex-wrap mb-8">
          <Link to="/ai-generator" className="btn-ghost text-xs py-2 px-4">🎨 AI Imagine</Link>
          <Link to="/marketplace" className="btn-ghost text-xs py-2 px-4">🛍 Marketplace</Link>
          <Link to="/ai-analytics" className="btn-ghost text-xs py-2 px-4">📊 AI Analytics</Link>
        </div>
      )}

      <div className="glass-card p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div><p className="text-xs text-mute font-mono uppercase mb-1">Current plan</p><p className="font-display text-2xl capitalize">{plan}</p></div>
        <div><p className="text-xs text-mute font-mono uppercase mb-1">Status</p><p className="text-cyan text-sm">Active</p></div>
        <div><p className="text-xs text-mute font-mono uppercase mb-1">User</p><p className="text-sm">{profile?.username}</p></div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <UsageCard icon={Brain} label="AI today" value={usage.aiToday} limit={plan === 'free' ? 20 : null} />
        <UsageCard icon={Brain} label="My AI characters" value={usage.characters} limit={plan === 'free' ? 3 : null} />
        <UsageCard icon={UsersThree} label="Friends" value={usage.friends} />
        <UsageCard icon={HardDrive} label="Messages sent" value={usage.messages} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {Object.entries(PLANS).map(([key, p]) => (
          <div key={key} className={`rounded-2xl p-6 flex flex-col ${plan === key ? 'glass border-violet shadow-[0_0_30px_rgba(124,92,255,0.2)]' : 'glass-card'}`}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-lg">{p.label}</h3>
              {plan === key && <span className="text-xs text-cyan font-mono">Current</span>}
            </div>
            <p className="font-display text-2xl mb-4">{p.price}<span className="text-mute text-sm">/mo</span></p>
            <ul className="space-y-2 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-ink/80"><Check size={12} className="text-cyan" />{f}</li>
              ))}
            </ul>
            {plan !== key && key !== 'free' && (
              <button onClick={() => upgrade(key)} disabled={loading} className="btn-primary text-sm mt-4 disabled:opacity-60">
                Upgrade to {p.label}
              </button>
            )}
            {key === 'free' && plan !== 'free' && (
              <button onClick={openPortal} disabled={loading} className="btn-ghost text-sm mt-4">Manage subscription</button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function UsageCard({ icon: Icon, label, value, limit }) {
  const pct = limit ? Math.min(100, (value / limit) * 100) : null
  return (
    <div className="glass-card p-5">
      <Icon size={18} weight="duotone" className="text-violet-bright mb-2" />
      <p className="text-xs text-mute font-mono uppercase">{label}</p>
      <p className="font-display text-2xl mt-1">{value}{limit ? <span className="text-mute text-sm"> / {limit}</span> : ''}</p>
      {pct !== null && <div className="h-1.5 rounded-full bg-line mt-2 overflow-hidden"><div className="h-full bg-cyan transition-all" style={{ width: `${pct}%` }} /></div>}
    </div>
  )
}
