import { motion } from 'framer-motion'
import { Quotes } from 'phosphor-react'

const quotes = [
  { name: 'Marina T.', role: 'Product designer', text: 'My Future You character has become the most honest person in my life. Genuinely useful, not a gimmick.' },
  { name: 'Jordan K.', role: 'Grad student', text: 'Study Buddy with memory means it actually knows where I left off last week. That alone is worth Premium.' },
  { name: 'Sam R.', role: 'Indie founder', text: 'We run our whole side-project group chat with an AI mentor pinned in. It settles more arguments than I do.' },
]

export default function Testimonials() {
  return (
    <section className="px-6 py-28 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="label-eyebrow mb-3">From the network</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tight">People on the frequency</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {quotes.map((q, i) => (
          <motion.div
            key={q.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass-card p-7"
          >
            <Quotes size={24} weight="fill" className="text-violet/60 mb-4" />
            <p className="text-ink/90 leading-relaxed mb-6">{q.text}</p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet to-cyan" />
              <div>
                <p className="text-sm font-medium">{q.name}</p>
                <p className="text-xs text-mute">{q.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
