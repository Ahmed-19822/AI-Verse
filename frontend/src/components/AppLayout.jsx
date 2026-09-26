import { Link, useLocation } from 'react-router-dom'
import { ChatCircle, Users, UsersThree, CircleDashed, Newspaper, Brain, Sparkle, Camera, User, Gear, Crown, Compass, Storefront, ChartBar } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppLayout({ children }) {
  const { profile } = useAuth()
  const location = useLocation()
  const path = location.pathname

  const navs = [
    { to: '/dashboard', icon: Sparkle, label: 'Dashboard' },
    { to: '/chat', icon: ChatCircle, label: 'Chats' },
    { to: '/friends', icon: Users, label: 'Friends' },
    { to: '/groups', icon: UsersThree, label: 'Groups' },
    { to: '/status', icon: CircleDashed, label: 'Status' },
    { to: '/feed', icon: Newspaper, label: 'Feed' },
    { to: '/explore', icon: Compass, label: 'Explore' },
    { to: '/ai-hub', icon: Brain, label: 'AI Hub' },
  ]
  if (profile?.premium_plan === 'pro') {
    navs.push({ to: '/ai-generator', icon: Camera, label: 'Imagine' })
    navs.push({ to: '/marketplace', icon: Storefront, label: 'Marketplace' })
    navs.push({ to: '/ai-analytics', icon: ChartBar, label: 'Analytics' })
  }

  const isActive = (to) => path.startsWith(to)

  return (
    <div className="flex h-screen overflow-hidden bg-void transition-colors duration-500">
      {/* PC Sidebar */}
      <aside className="hidden md:flex w-20 flex-col items-center py-4 glass border-r border-line z-10 shrink-0 min-h-0">
        <Link to="/dashboard" className="h-10 w-10 flex items-center justify-center rounded-2xl bg-violet/20 border border-violet/40 mb-6 hover:shadow-[0_0_15px_rgba(124,92,255,0.4)] hover:scale-105 active:scale-95 transition-all">
          <Sparkle weight="fill" size={24} className="text-cyan" />
        </Link>
        
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto w-full px-3 scrollbar-hide py-1 min-h-0">
          {navs.map((n) => (
            <Link key={n.to} to={n.to} title={n.label} className={`relative h-10 w-full flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group ${isActive(n.to) ? 'bg-violet/10 text-cyan shadow-[inset_0_0_12px_rgba(124,92,255,0.2)]' : 'text-mute hover:bg-white/5 hover:text-ink'}`}>
              <n.icon size={22} weight={isActive(n.to) ? 'fill' : 'regular'} className="drop-shadow-sm" />
              <span className="absolute left-[4rem] bg-surface/90 backdrop-blur-sm border border-line text-ink text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
                {n.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 mt-4 px-3 w-full">
          <Link to="/premium" title="Premium" className={`relative h-10 w-full flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group ${isActive('/premium') ? 'bg-magenta/10 text-magenta shadow-[inset_0_0_12px_rgba(255,60,172,0.2)]' : 'text-mute hover:bg-white/5 hover:text-ink'}`}>
            <Crown size={22} weight={isActive('/premium') ? 'fill' : 'regular'} className="drop-shadow-sm" />
            <span className="absolute left-[4rem] bg-surface/90 backdrop-blur-sm border border-line text-ink text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
              Premium
            </span>
          </Link>
          <Link to="/settings" title="Settings" className={`relative h-10 w-full flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group ${isActive('/settings') ? 'bg-violet/10 text-cyan shadow-[inset_0_0_12px_rgba(124,92,255,0.2)]' : 'text-mute hover:bg-white/5 hover:text-ink'}`}>
            <Gear size={22} weight={isActive('/settings') ? 'fill' : 'regular'} className="drop-shadow-sm" />
            <span className="absolute left-[4rem] bg-surface/90 backdrop-blur-sm border border-line text-ink text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
              Settings
            </span>
          </Link>
          <Link to="/profile" title="Profile" className={`relative h-10 w-full flex items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden mx-auto max-w-[40px] group ${isActive('/profile') ? 'border-cyan shadow-[0_0_15px_rgba(0,240,216,0.3)]' : 'border-transparent hover:border-violet/50 hover:shadow-[0_0_10px_rgba(124,92,255,0.2)]'}`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center font-display text-white">
                {profile?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute left-[4rem] bg-surface/90 backdrop-blur-sm border border-line text-ink text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-50">
              Profile
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-void transition-colors duration-500 flex flex-col">
        {/* Mobile Header (replaces Navbar for auth users) */}
        <div className="md:hidden fixed top-0 inset-x-0 h-16 glass border-b border-line z-40 flex items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/20 border border-violet/40">
              <Sparkle weight="fill" size={20} className="text-cyan" />
            </span>
            <span className="font-display text-lg tracking-tight">AIverse</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/settings" className="text-mute hover:text-ink"><Gear size={22} /></Link>
            <Link to="/profile" className="h-8 w-8 rounded-full overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-xs font-display text-white">
                  {profile?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Framer motion for WhatsApp like transitions */}
        <div className="flex-1 w-full flex flex-col pt-16 md:pt-0 pb-20 md:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-20 pb-2 glass border-t border-line z-50 flex items-center justify-around px-4">
        {navs.slice(0, 5).map((n) => (
          <Link key={n.to} to={n.to} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive(n.to) ? 'text-cyan' : 'text-mute hover:text-ink'}`}>
            <n.icon size={26} weight={isActive(n.to) ? 'fill' : 'regular'} />
            <span className="text-[11px]">{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
