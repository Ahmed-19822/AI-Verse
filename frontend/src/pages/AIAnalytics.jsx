import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChartBar, Sparkle } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

export default function AIAnalytics() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [byCharacter, setByCharacter] = useState([])
  const [byDay, setByDay] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (profile?.premium_plan !== 'pro' || !user?.id) { setLoading(false); return }

    supabase.from('ai_messages')
      .select('character_id, created_at, role, ai_characters:character_id(name)')
      .eq('user_id', user.id)
      .eq('role', 'user')
      .then(({ data, error }) => {
        if (error) { console.error('analytics error', error); setLoading(false); return }
        const rows = data || []
        setTotal(rows.length)

        const byChar = {}
        for (const r of rows) {
          const name = r.ai_characters?.name || 'Unknown'
          byChar[name] = (byChar[name] || 0) + 1
        }
        setByCharacter(Object.entries(byChar).sort((a, b) => b[1] - a[1]).slice(0, 8))

        const since = new Date(); since.setDate(since.getDate() - 6); since.setHours(0, 0, 0, 0)
        const days = {}
        for (let i = 0; i < 7; i++) {
          const d = new Date(since); d.setDate(d.getDate() + i)
          days[d.toLocaleDateString(undefined, { weekday: 'short' })] = 0
        }
        for (const r of rows) {
          const d = new Date(r.created_at)
          if (d >= since) {
            const key = d.toLocaleDateString(undefined, { weekday: 'short' })
            if (key in days) days[key] += 1
          }
        }
        setByDay(Object.entries(days))
        setLoading(false)
      })
  }, [user?.id, profile?.premium_plan])

  if (profile?.premium_plan !== 'pro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <ChartBar size={48} className="text-magenta mb-4 opacity-50" />
        <h2 className="text-2xl font-display mb-2">AI Analytics</h2>
        <p className="text-mute mb-6 max-w-sm">Usage insights across your AI characters are exclusive to the Pro plan.</p>
        <Link to="/premium" className="btn-primary">Upgrade to Pro</Link>
      </div>
    )
  }

  const maxDay = Math.max(1, ...byDay.map(([, v]) => v))
  const maxChar = Math.max(1, ...byCharacter.map(([, v]) => v))

  return (
    <section className="px-6 pt-10 pb-20 max-w-5xl mx-auto">
      <p className="label-eyebrow mb-2 text-magenta">Pro Feature</p>
      <h1 className="font-display text-4xl tracking-tight flex items-center gap-3 mb-8">
        <ChartBar weight="fill" className="text-magenta" /> AI Analytics
      </h1>

      {loading ? (
        <p className="text-mute text-sm">Crunching numbers…</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 md:col-span-1">
            <p className="text-xs text-mute mb-1">Total messages sent</p>
            <p className="font-display text-4xl">{total}</p>
          </div>

          <div className="glass-card p-6 md:col-span-2">
            <h2 className="font-display text-lg mb-4">Last 7 days</h2>
            <div className="flex items-end gap-3 h-32">
              {byDay.map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-violet/30 border border-violet/40 rounded-t-md" style={{ height: `${Math.max(4, (count / maxDay) * 100)}%` }} />
                  <span className="text-[10px] text-mute">{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 md:col-span-3">
            <h2 className="font-display text-lg mb-4">Messages by character</h2>
            {byCharacter.length === 0 ? (
              <p className="text-mute text-sm">No AI conversations yet.</p>
            ) : (
              <div className="space-y-3">
                {byCharacter.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-3">
                    <Sparkle size={14} className="text-cyan shrink-0" weight="duotone" />
                    <span className="text-sm w-32 truncate">{name}</span>
                    <div className="flex-1 bg-line rounded-full h-2 overflow-hidden">
                      <div className="bg-cyan h-full rounded-full" style={{ width: `${(count / maxChar) * 100}%` }} />
                    </div>
                    <span className="text-xs text-mute w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
