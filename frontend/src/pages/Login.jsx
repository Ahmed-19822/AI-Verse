import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeSimple, LockKey, WarningCircle } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(form)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Wrong email or password.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8"
      >
        <h1 className="font-display text-2xl mb-1">Welcome back</h1>
        <p className="text-sm text-mute mb-8">Reconnect to your frequency.</p>

        {error && (
          <div className="flex items-start gap-2 text-sm text-magenta bg-magenta/10 border border-magenta/30 rounded-xl px-4 py-3 mb-4">
            <WarningCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              <input required type="password" value={form.password} onChange={update('password')} placeholder="••••••••" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
            </div>
          </label>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-cyan hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-mute mt-6">
          New here? <Link to="/signup" className="text-cyan hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </section>
  )
}
