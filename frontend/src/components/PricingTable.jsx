import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, Sparkle, Rocket } from 'phosphor-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    cadence: '/month',
    desc: 'Friends, groups, and a taste of AI.',
    features: ['Friend chat & groups', '20 AI messages / day', '3 AI characters', 'Limited storage'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '$5.99',
    cadence: '/month',
    desc: 'Unlimited AI, with memory.',
    features: [
      'Unlimited AI chat & memory',
      'Unlimited AI characters',
      'Custom AI creation',
      'Bigger storage + premium badge',
      'Unlimited status uploads',
      'Priority AI responses',
    ],
    cta: 'Go Premium',
    highlight: true,
    icon: Sparkle,
  },
  {
    name: 'Pro',
    price: '$12.99',
    cadence: '/month',
    desc: 'Everything, plus creator tools.',
    features: [
      'Everything in Premium',
      'Voice AI chat',
      'AI image generation',
      'Unlimited storage & groups',
      'AI analytics',
      'Custom AI marketplace',
      'Early access features',
    ],
    cta: 'Go Pro',
    highlight: false,
    icon: Rocket,
  },
]

export default function PricingTable({ compact = false }) {
  return (
    <div className={`grid md:grid-cols-3 gap-6 ${compact ? '' : 'max-w-6xl mx-auto'}`}>
      {plans.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className={`relative rounded-2xl p-8 flex flex-col ${
            p.highlight
              ? 'glass border-violet shadow-[0_0_50px_rgba(124,92,255,0.25)] scale-[1.02]'
              : 'glass-card'
          }`}
        >
          {p.highlight && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 label-eyebrow bg-void px-3 py-1 rounded-full border border-violet/50">
              Most popular
            </span>
          )}

          <div className="flex items-center gap-2 mb-1">
            {p.icon && <p.icon size={18} weight="fill" className="text-cyan" />}
            <h3 className="font-display text-xl">{p.name}</h3>
          </div>
          <p className="text-sm text-mute mb-6">{p.desc}</p>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="font-display text-4xl">{p.price}</span>
            <span className="text-mute text-sm">{p.cadence}</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink/85">
                <Check size={16} weight="bold" className="text-cyan mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            to="/signup"
            className={p.highlight ? 'btn-primary text-center' : 'btn-ghost text-center'}
          >
            {p.cta}
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
