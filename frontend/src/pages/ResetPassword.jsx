import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LockKey, WarningCircle, Check } from 'phosphor-react'
import { supabase } from '../lib/supabaseClient.js'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else { setDone(true); setTimeout(() => navigate('/dashboard'), 2000) }
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl mb-1">Set new password</h1>
        <p className="text-sm text-mute mb-8">Choose a strong password for your account.</p>

        {done ? (
          <div className="flex items-center gap-2 text-cyan"><Check size={18} /> Password updated! Redirecting…</div>
        ) : (
          <>
            {error && <div className="flex items-start gap-2 text-sm text-magenta bg-magenta/10 border border-magenta/30 rounded-xl px-4 py-3 mb-4"><WarningCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-xs text-mute mb-1.5 block">New password</span>
                <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
                  <LockKey size={16} className="text-mute" />
                  <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs text-mute mb-1.5 block">Confirm password</span>
                <div className="flex items-center gap-2 glass rounded-xl px-4 py-3">
                  <LockKey size={16} className="text-mute" />
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="bg-transparent outline-none text-sm w-full placeholder:text-mute/60" />
                </div>
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </section>
  )
}
