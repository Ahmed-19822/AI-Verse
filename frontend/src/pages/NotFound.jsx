import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SignalLine from '../components/SignalLine.jsx'

export default function NotFound() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="label-eyebrow mb-4">Signal lost</p>
        <h1 className="font-display text-8xl text-violet mb-4">404</h1>
        <p className="text-mute max-w-sm mx-auto mb-8">This frequency doesn't exist. The page you're looking for has gone dark.</p>
        <SignalLine className="w-64 mx-auto mb-8" height={50} />
        <Link to="/" className="btn-primary">Back to AIverse</Link>
      </motion.div>
    </section>
  )
}
