import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, WaveSine } from 'phosphor-react'
import SignalLine from './SignalLine'

export default function Hero() {
  return (
    <section className="relative pt-44 pb-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8"
        >
          <WaveSine size={14} className="text-cyan" />
          <span className="label-eyebrow">Now reading every signal in real time</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight"
        >
          Your people.
          <br />
          <span className="bg-gradient-to-r from-violet-bright via-cyan to-magenta bg-clip-text text-transparent">
            Your minds.
          </span>{' '}
          One frequency.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg text-mute max-w-xl mx-auto"
        >
          AIverse is the private network where friends, groups, and AI minds you build
          yourself share the same conversation — remembered, organized, and always on signal.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2">
            Enter AIverse <ArrowRight size={16} />
          </Link>
          <a href="#features" className="btn-ghost">See how it works</a>
        </motion.div>
      </div>

      {/* Signature waveform bisecting the hero — represents a live conversation pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative mt-20 max-w-4xl mx-auto"
      >
        <SignalLine className="w-full" height={100} />
      </motion.div>

      {/* Ambient floating glass orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-violet/20 blur-[120px] animate-floatY" />
      <div className="absolute top-40 -right-20 w-96 h-96 rounded-full bg-cyan/10 blur-[120px] animate-floatY" style={{ animationDelay: '1.5s' }} />
    </section>
  )
}
