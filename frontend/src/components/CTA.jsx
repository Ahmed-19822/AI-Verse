import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'phosphor-react'
import SignalLine from './SignalLine'

export default function CTA() {
  return (
    <section className="px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto glass-card text-center p-12 md:p-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-cyan/10" />
        <div className="relative z-10">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-4">
            Your frequency is open.
          </h2>
          <p className="text-mute max-w-md mx-auto mb-8">
            Join free. Bring your people. Build your first AI in under a minute.
          </p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2">
            Enter AIverse <ArrowRight size={16} />
          </Link>
          <SignalLine className="w-full max-w-xs mx-auto mt-10" height={50} />
        </div>
      </motion.div>
    </section>
  )
}
