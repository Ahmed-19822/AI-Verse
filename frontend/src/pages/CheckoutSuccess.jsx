import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CrownSimple } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function CheckoutSuccess() {
  const { refreshProfile } = useAuth()

  useEffect(() => {
    // The Stripe webhook that flips profile.premium_plan runs async, so it may
    // not have landed the instant Stripe redirects back here. Poll a few times.
    let attempts = 0
    const interval = setInterval(() => {
      attempts += 1
      refreshProfile()
      if (attempts >= 5) clearInterval(interval)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen flex items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-w-md w-full p-10">
        <CrownSimple size={48} weight="fill" className="text-cyan mx-auto mb-4" />
        <h1 className="font-display text-2xl mb-2">You're upgraded!</h1>
        <p className="text-mute text-sm mb-6">Your plan is now active. Enjoy unlimited AI, memory, and everything else that comes with it.</p>
        <Link to="/premium" className="btn-primary">Go to Premium Dashboard</Link>
      </motion.div>
    </section>
  )
}
