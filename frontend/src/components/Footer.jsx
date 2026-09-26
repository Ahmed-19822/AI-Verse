import { Link } from 'react-router-dom'
import { Sparkle, TwitterLogo, DiscordLogo, GithubLogo } from 'phosphor-react'

export default function Footer() {
  return (
    <footer className="border-t border-line mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkle weight="fill" size={18} className="text-cyan" />
            <span className="font-display text-lg">AIverse</span>
          </div>
          <p className="text-sm text-mute max-w-xs">
            A private circle for you, your people, and the AI minds you build together.
          </p>
          <div className="flex gap-4 mt-6 text-mute">
            <TwitterLogo size={18} className="hover:text-cyan transition-colors cursor-pointer" />
            <DiscordLogo size={18} className="hover:text-cyan transition-colors cursor-pointer" />
            <GithubLogo size={18} className="hover:text-cyan transition-colors cursor-pointer" />
          </div>
        </div>

        {[
          { title: 'Product', items: ['Chat', 'Groups', 'AI Hub', 'Pricing'] },
          { title: 'Company', items: ['About', 'Careers', 'Blog'] },
          { title: 'Resources', items: ['Docs', 'Support', 'Status'] },
        ].map((col) => (
          <div key={col.title}>
            <p className="label-eyebrow mb-4">{col.title}</p>
            <ul className="space-y-3">
              {col.items.map((i) => (
                <li key={i}>
                  <a href="#" className="text-sm text-mute hover:text-ink transition-colors">{i}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-mute font-mono">
        © {new Date().getFullYear()} AIverse. All signals encrypted.
      </div>
    </footer>
  )
}
