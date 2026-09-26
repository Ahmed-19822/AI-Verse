import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MagicWand, WarningCircle, Sparkle, Storefront } from 'phosphor-react'
import { apiFetch } from '../lib/api.js'
import { toast } from '../lib/toast.js'
import { useAuth } from '../context/AuthContext.jsx'

const EXAMPLES = [
  { name: 'Alex', role: 'Best Friend', personality: 'Funny, supportive, honest', speaking_style: 'Casual, uses humor, never lectures' },
  { name: 'Dr. Nova', role: 'Science Explainer', personality: 'Curious, enthusiastic about knowledge', speaking_style: 'Clear analogies, makes complex things simple' },
  { name: 'Coach Sam', role: 'Fitness Coach', personality: 'Motivating, no-nonsense', speaking_style: 'Direct, action-oriented, celebrates wins' },
]

export default function AICreator() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isPro = profile?.premium_plan === 'pro'
  const [form, setForm] = useState({ name: '', role: '', personality: '', speaking_style: '', is_public: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const fillExample = (ex) => setForm((f) => ({ ...ex, is_public: f.is_public }))

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/api/ai/characters', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      toast.success(`${form.name} is ready to talk!`)
      navigate('/ai-hub')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-3xl mx-auto">
      <p className="label-eyebrow mb-2">Build a mind</p>
      <h1 className="font-display text-4xl tracking-tight mb-2">AI Creator</h1>
      <p className="text-mute text-sm mb-8">Give it a name, a role, and a personality. It's yours.</p>

      {/* Examples */}
      <div className="mb-8">
        <p className="text-xs text-mute mb-3">Quick start with an example:</p>
        <div className="flex gap-2 flex-wrap">
          {EXAMPLES.map((ex) => (
            <button key={ex.name} onClick={() => fillExample(ex)} className="glass rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 hover:border-violet/50 transition-colors">
              <Sparkle size={12} className="text-cyan" weight="duotone" /> {ex.name} — {ex.role}
            </button>
          ))}
        </div>
      </div>

      <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={create} className="glass-card p-8 space-y-5">
        {error && (
          <div className="flex items-start gap-2 text-sm text-magenta bg-magenta/10 border border-magenta/30 rounded-xl px-4 py-3">
            <WarningCircle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <Field label="Name *" placeholder="e.g. Alex">
          <input required value={form.name} onChange={update('name')} className="bg-transparent outline-none text-sm w-full" />
        </Field>
        <Field label="Role *" placeholder="e.g. Best Friend, Career Coach, Study Buddy">
          <input required value={form.role} onChange={update('role')} className="bg-transparent outline-none text-sm w-full" />
        </Field>
        <Field label="Personality *" placeholder="e.g. Funny, supportive, honest, direct">
          <textarea required rows={3} value={form.personality} onChange={update('personality')} className="bg-transparent outline-none text-sm w-full resize-none" />
        </Field>
        <Field label="Speaking style *" placeholder="e.g. Casual, uses humor, asks questions, gives examples">
          <textarea required rows={2} value={form.speaking_style} onChange={update('speaking_style')} className="bg-transparent outline-none text-sm w-full resize-none" />
        </Field>

        <label className={`flex items-center justify-between glass rounded-xl px-4 py-3 ${!isPro ? 'opacity-50' : ''}`}>
          <span className="flex items-center gap-2 text-sm">
            <Storefront size={16} className="text-magenta" />
            Publish to the AI Marketplace
            {!isPro && <span className="text-[10px] font-mono uppercase text-magenta">Pro</span>}
          </span>
          <button type="button" disabled={!isPro}
            onClick={() => setForm((f) => ({ ...f, is_public: !f.is_public }))}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 disabled:cursor-not-allowed ${form.is_public ? 'bg-violet' : 'bg-line'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-200 ${form.is_public ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </label>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <MagicWand size={16} /> {saving ? 'Creating…' : 'Bring it to life'}
          </button>
          <button type="button" onClick={() => navigate('/ai-hub')} className="btn-ghost">Cancel</button>
        </div>
      </motion.form>
    </section>
  )
}

function Field({ label, placeholder, children }) {
  return (
    <label className="block glass rounded-xl px-4 py-3">
      <span className="text-xs text-mute block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
