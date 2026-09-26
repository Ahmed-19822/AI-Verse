import { motion } from 'framer-motion'
import { MagnifyingGlass, Backpack, Briefcase, Heart, Clock, SmileyWink } from 'phosphor-react'

const characters = [
  { icon: MagnifyingGlass, name: 'AI Detective', role: 'Solves mysteries, asks the right questions', color: 'from-violet/30 to-violet/0' },
  { icon: Backpack, name: 'Study Buddy', role: 'Quizzes you until it sticks', color: 'from-cyan/30 to-cyan/0' },
  { icon: Briefcase, name: 'Career Mentor', role: 'Reviews your moves, calls the next one', color: 'from-magenta/30 to-magenta/0' },
  { icon: Heart, name: 'Life Coach', role: 'Keeps you honest about your habits', color: 'from-violet/30 to-violet/0' },
  { icon: Clock, name: 'Future You', role: 'Talks like the version of you in 10 years', color: 'from-cyan/30 to-cyan/0' },
  { icon: SmileyWink, name: 'Funny Friend', role: 'No agenda. Just good company.', color: 'from-magenta/30 to-magenta/0' },
]

export default function Characters() {
  return (
    <section id="characters" className="px-6 py-28 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="label-eyebrow mb-3">Meet the minds</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tight">
          Six AI personalities. Infinite custom ones.
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {characters.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="relative glass-card p-6 overflow-hidden group cursor-default"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full glass mb-4">
                <c.icon size={22} weight="duotone" className="text-cyan" />
              </span>
              <h3 className="font-display text-lg">{c.name}</h3>
              <p className="text-sm text-mute mt-1">{c.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
