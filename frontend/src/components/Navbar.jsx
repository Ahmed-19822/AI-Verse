import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkle, List, X, SignOut } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/#features', label: 'Features' },
  { to: '/#characters', label: 'AI Characters' },
  { to: '/pricing', label: 'Pricing' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 flex items-center justify-between rounded-2xl transition-all duration-300 ${
          scrolled ? 'glass py-2.5 px-4 mx-4' : ''
        }`}
      >
        <Link to="/" className="flex items-center gap-2 group">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-violet/20 border border-violet/40">
            <Sparkle weight="fill" size={16} className="text-cyan group-hover:animate-glow" />
          </span>
          <span className="font-display text-lg tracking-tight">AIverse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              className="text-sm text-mute hover:text-ink transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Dashboard</Link>
              <Link to="/chat" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Chat</Link>
              <Link to="/friends" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Friends</Link>
              <Link to="/groups" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Groups</Link>
              <Link to="/status" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Status</Link>
              <Link to="/ai-hub" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">AI Hub</Link>
              <Link to="/feed" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Feed</Link>
              <Link to="/premium" className="text-sm text-mute hover:text-ink transition-colors px-3 py-2">Premium</Link>
              <Link to="/profile" className="flex items-center gap-2 glass rounded-full pl-1 pr-3 py-1 ml-1">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet to-cyan" />
                <span className="text-sm">{profile?.username || 'You'}</span>
              </Link>
              <button onClick={handleLogout} className="text-mute hover:text-magenta transition-colors p-2" title="Log out">
                <SignOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-mute hover:text-ink transition-colors px-4 py-2">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary text-sm py-2.5">
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-ink" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass mx-4 mt-2 rounded-2xl p-6 flex flex-col gap-4"
        >
          {links.map((l) => (
            <a key={l.label} href={l.to} className="text-ink/90" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <hr className="border-line" />
          {user ? (
            <>
              <Link to="/dashboard" className="text-ink/90" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link to="/chat" className="text-ink/90" onClick={() => setOpen(false)}>Chat</Link>
              <Link to="/friends" className="text-ink/90" onClick={() => setOpen(false)}>Friends</Link>
              <Link to="/groups" className="text-ink/90" onClick={() => setOpen(false)}>Groups</Link>
              <Link to="/status" className="text-ink/90" onClick={() => setOpen(false)}>Status</Link>
              <Link to="/ai-hub" className="text-ink/90" onClick={() => setOpen(false)}>AI Hub</Link>
              <Link to="/feed" className="text-ink/90" onClick={() => setOpen(false)}>Feed</Link>
              <Link to="/premium" className="text-ink/90" onClick={() => setOpen(false)}>Premium</Link>
              <Link to="/profile" className="text-ink/90" onClick={() => setOpen(false)}>Profile</Link>
              <Link to="/settings" className="text-ink/90" onClick={() => setOpen(false)}>Settings</Link>
              <button onClick={() => { setOpen(false); handleLogout() }} className="text-magenta text-left">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-ink/90" onClick={() => setOpen(false)}>Log in</Link>
              <Link to="/signup" className="btn-primary text-center" onClick={() => setOpen(false)}>Get started</Link>
            </>
          )}
        </motion.div>
      )}
    </header>
  )
}
