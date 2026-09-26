import { motion } from 'framer-motion'
import PricingTable from '../components/PricingTable.jsx'

export default function Pricing() {
  return (
    <section className="px-6 pt-40 pb-28 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <p className="label-eyebrow mb-3">Pricing</p>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
          Pick your signal strength
        </h1>
        <p className="text-mute">
          Start free. Upgrade the moment your AI minds need to remember more than your last message.
        </p>
      </motion.div>
      <PricingTable />

      <div className="max-w-2xl mx-auto mt-20 text-center text-sm text-mute">
        Cancel anytime from your Premium Dashboard. Plan changes apply immediately —
        downgrades take effect at the end of your billing period.
      </div>
    </section>
  )
}
