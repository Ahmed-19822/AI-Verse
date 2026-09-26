import { motion } from 'framer-motion'
import { ChatCircleDots, UsersThree, Brain, ShieldCheck, Broadcast, MagicWand } from 'phosphor-react'

const features = [
  {
    icon: ChatCircleDots,
    title: 'Realtime chat',
    desc: 'Typing indicators, read receipts, and instant delivery — built on Supabase Realtime.',
    span: 'md:col-span-2',
  },
  {
    icon: Brain,
    title: 'AI with memory',
    desc: 'Your AI minds remember what matters between conversations.',
    span: '',
  },
  {
    icon: UsersThree,
    title: 'Groups, with AI inside',
    desc: 'Invite an AI assistant into any group to brainstorm, summarize, or settle debates.',
    span: '',
  },
  {
    icon: MagicWand,
    title: 'Build your own AI',
    desc: 'Name it, give it a personality and a voice. It\'s yours.',
    span: '',
  },
  {
    icon: Broadcast,
    title: '24-hour status',
    desc: 'Share a moment that fades — text, image, or video.',
    span: '',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    desc: 'Row-level security on every table. Nothing is ever public unless you choose it.',
    span: 'md:col-span-2',
  },
]

export default function Features() {
  return (
    <section id="features" className="px-6 py-28 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="label-eyebrow mb-3">What's inside</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tight">
          One app. Every signal you send.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className={`glass-card p-7 hover:border-violet/50 transition-colors duration-300 ${f.span}`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/15 border border-violet/30 mb-5">
              <f.icon size={20} weight="duotone" className="text-violet-bright" />
            </span>
            <h3 className="font-display text-xl mb-2">{f.title}</h3>
            <p className="text-sm text-mute leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
