import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle } from 'phosphor-react'

export default function EmailVerified() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-w-md w-full p-10">
        <CheckCircle size={48} weight="fill" className="text-cyan mx-auto mb-4" />
        <h1 className="font-display text-2xl mb-2">Email verified</h1>
        <p className="text-mute text-sm mb-6">Your account is confirmed. You're on the frequency.</p>
        <Link to="/login" className="btn-primary">Log in to AIverse</Link>
      </motion.div>
    </section>
  )
}
