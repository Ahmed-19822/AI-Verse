import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkle, ArrowRight, WarningCircle } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

const STEPS = ['Welcome', 'Your identity', 'Pick your AI']
const DEFAULT_CHARS = ['AI Detective', 'Study Buddy', 'Career Mentor', 'Life Coach', 'Future You', 'Funny Friend']

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const next = async () => {
    setError(null)
    if (step === 1) {
      if (!username.trim()) { setError('Username is required'); return }
      setSaving(true)
      const { error: updateErr } = await supabase.from('profiles').update({ username: username.trim(), bio }).eq('id', user.id)
      setSaving(false)
      if (updateErr) {
        setError(updateErr.code === '23505' ? 'That username is taken.' : updateErr.message)
        return
      }
      await refreshProfile()
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else navigate('/dashboard')
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-violet' : 'bg-line'}`} />
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8">
          {step === 0 && (
            <div className="text-center">
              <Sparkle size={40} weight="fill" className="text-cyan mx-auto mb-4" />
              <h1 className="font-display text-3xl mb-3">Welcome to AIverse</h1>
              <p className="text-mute mb-6">Set up your profile and meet your first AI mind in under a minute.</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl mb-6">Your identity</h2>
              {error && (
                <div className="flex items-start gap-2 text-sm text-magenta bg-magenta/10 border border-magenta/30 rounded-xl px-4 py-3 mb-4">
                  <WarningCircle size={16} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
              <div className="space-y-4">
                <label className="block glass rounded-xl px-4 py-3">
                  <span className="text-xs text-mute block mb-1">Username</span>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourname" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
                </label>
                <label className="block glass rounded-xl px-4 py-3">
                  <span className="text-xs text-mute block mb-1">Bio (optional)</span>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Tell people who you are" className="bg-transparent outline-none text-sm w-full resize-none placeholder:text-mute/60" />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl mb-2">Meet your AI minds</h2>
              <p className="text-mute text-sm mb-6">6 characters are ready to talk. You can create your own any time.</p>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_CHARS.map((c) => (
                  <div key={c} className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm">
                    <Sparkle size={14} weight="duotone" className="text-cyan" /> {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={next} disabled={saving} className="btn-primary w-full mt-8 flex items-center justify-center gap-2 disabled:opacity-60">
            {step === STEPS.length - 1 ? 'Enter AIverse' : 'Continue'} <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
