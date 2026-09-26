import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeSimple, WarningCircle } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <h1 className="font-display text-2xl mb-1">Reset your password</h1>
        <p className="text-sm text-mute mb-8">We'll email you a link to set a new one.</p>

        {sent ? (
          <p className="text-sm text-cyan">Check {email} for a reset link.</p>
        ) : (
          <>
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
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@aiverse.app"
                    className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60"
                  />
                </div>
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-mute mt-6">
          <Link to="/login" className="text-cyan hover:underline">Back to login</Link>
        </p>
      </motion.div>
    </section>
  )
}
