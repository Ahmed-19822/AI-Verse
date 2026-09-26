import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'phosphor-react'

export default function CheckoutCancelled() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card max-w-md w-full p-10">
        <h1 className="font-display text-2xl mb-2">No worries</h1>
        <p className="text-mute text-sm mb-6">You cancelled the upgrade. Your free plan is still active.</p>
        <Link to="/pricing" className="btn-ghost flex items-center gap-2 justify-center"><ArrowLeft size={16} /> Back to pricing</Link>
      </motion.div>
    </section>
  )
}
