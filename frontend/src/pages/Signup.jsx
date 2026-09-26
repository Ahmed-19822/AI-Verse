import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeSimple, LockKey, User, WarningCircle } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sentConfirmation, setSentConfirmation] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    if (!form.username.trim()) return setError('Username is required')
    setLoading(true)
    try {
      const data = await signUp(form)
      // If session exists immediately (email confirm disabled), go to onboarding
      if (data.session) {
        navigate('/onboarding')
      } else {
        setSentConfirmation(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sentConfirmation) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="glass-card w-full max-w-md p-8 text-center">
          <h1 className="font-display text-2xl mb-2">Check your inbox</h1>
          <p className="text-sm text-mute mb-2">We sent a confirmation link to <span className="text-cyan">{form.email}</span></p>
          <p className="text-xs text-mute mb-6">Click it to activate your account, then log in here.</p>
          <Link to="/login" className="btn-primary inline-block">Go to login</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl mb-1">Join AIverse</h1>
        <p className="text-sm text-mute mb-8">Free forever on the basics. Upgrade anytime.</p>

        {error && (
          <div className="flex items-start gap-2 text-sm text-magenta bg-magenta/10 border border-magenta/30 rounded-xl px-4 py-3 mb-4">
            <WarningCircle size={16} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs text-mute mb-1.5 block">Username</span>
            <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
              <User size={16} className="text-mute" />
              <input required type="text" value={form.username} onChange={update('username')} placeholder="yourname" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1.5 block">Email</span>
            <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
              <EnvelopeSimple size={16} className="text-mute" />
              <input required type="email" value={form.email} onChange={update('email')} placeholder="you@aiverse.app" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-mute mb-1.5 block">Password</span>
            <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
              <LockKey size={16} className="text-mute" />
              <input required type="password" minLength={8} value={form.password} onChange={update('password')} placeholder="At least 8 characters" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
            </div>
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-mute mt-6">
          Already on AIverse? <Link to="/login" className="text-cyan hover:underline">Log in</Link>
        </p>
      </motion.div>
    </section>
  )
}
