import { useState, useEffect } from 'react'
import { Lock, Bell, PaintBrush, UserGear, SignOut, Check } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { useNavigate } from 'react-router-dom'
import { toast } from '../lib/toast.js'

const TABS = [
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'theme', label: 'Theme', icon: PaintBrush },
  { id: 'account', label: 'Account', icon: UserGear },
]

export default function Settings() {
  const [tab, setTab] = useState('privacy')
  const { profile, user, signOut, refreshProfile } = useAuth()
  const [prefs, setPrefs] = useState({ show_online: true, show_last_seen: true, allow_friend_requests: true, notify_messages: true, notify_friends: true, notify_likes: true })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      setPrefs({
        show_online: profile.show_online ?? true,
        show_last_seen: profile.show_last_seen ?? true,
        allow_friend_requests: profile.allow_friend_requests ?? true,
        notify_messages: profile.notify_messages ?? true,
        notify_friends: profile.notify_friends ?? true,
        notify_likes: profile.notify_likes ?? true,
      })
    }
  }, [profile])

  const handleLogout = async () => { await signOut(); navigate('/') }

  const savePrefs = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      ...prefs,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    
    if (error) { toast.error(error.message) }
    else { toast.success('Settings saved!'); await refreshProfile() }
    setSaving(false)
  }

  const changeTheme = async (newTheme) => {
    if (profile.theme === newTheme) return;
    
    // Check premium locks
    const plan = profile.premium_plan || 'free';
    if (newTheme === 'cyberpunk' && plan === 'free') {
      toast.error('Cyberpunk theme requires Premium plan.');
      return;
    }
    if ((newTheme === 'sunset' || newTheme === 'emerald') && plan !== 'pro') {
      toast.error('This theme requires Pro plan.');
      return;
    }

    const { error } = await supabase.from('profiles').update({ theme: newTheme, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Theme updated!');
      await refreshProfile()
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return
    await signOut()
    toast.info('Account deletion requested. Contact support to complete.')
    navigate('/')
  }

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-4xl mx-auto">
      <p className="label-eyebrow mb-2">Configure</p>
      <h1 className="font-display text-4xl tracking-tight mb-8">Settings</h1>

      <div className="flex gap-2 mb-8 glass rounded-2xl p-1.5 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${tab === t.id ? 'bg-violet/25 text-ink border border-violet/40' : 'text-mute hover:text-ink'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'privacy' && (
        <div className="glass-card p-8 space-y-5">
          <h2 className="font-display text-lg mb-2">Privacy</h2>
          <ToggleRow label="Show online status" desc="Let friends see when you're online" value={prefs.show_online} onChange={(v) => setPrefs({ ...prefs, show_online: v })} />
          <ToggleRow label="Show last seen" desc="Let friends see when you were last active" value={prefs.show_last_seen} onChange={(v) => setPrefs({ ...prefs, show_last_seen: v })} />
          <ToggleRow label="Allow friend requests" desc="Anyone can send you a friend request" value={prefs.allow_friend_requests} onChange={(v) => setPrefs({ ...prefs, allow_friend_requests: v })} />
          <button onClick={savePrefs} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
            <Check size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="glass-card p-8 space-y-5">
          <h2 className="font-display text-lg mb-2">Notifications</h2>
          <ToggleRow label="New messages" desc="Get notified when you receive a message" value={prefs.notify_messages} onChange={(v) => setPrefs({ ...prefs, notify_messages: v })} />
          <ToggleRow label="Friend requests" desc="Get notified when someone adds you" value={prefs.notify_friends} onChange={(v) => setPrefs({ ...prefs, notify_friends: v })} />
          <ToggleRow label="Likes & comments" desc="Get notified on your posts" value={prefs.notify_likes} onChange={(v) => setPrefs({ ...prefs, notify_likes: v })} />
          <button onClick={savePrefs} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
            <Check size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      {tab === 'theme' && (
        <div className="glass-card p-8">
          <h2 className="font-display text-lg mb-4">Theme</h2>
          <p className="text-sm text-mute mb-6">Personalize your AIverse experience.</p>
          <div className="flex flex-wrap gap-4">
            <ThemeCard label="Dark" id="dark" current={profile?.theme || 'dark'} onSelect={changeTheme} />
            <ThemeCard label="Light" id="light" current={profile?.theme || 'dark'} onSelect={changeTheme} />
            <ThemeCard label="Cyberpunk" id="cyberpunk" current={profile?.theme || 'dark'} onSelect={changeTheme} badge="Premium" />
            <ThemeCard label="Sunset" id="sunset" current={profile?.theme || 'dark'} onSelect={changeTheme} badge="Pro" />
            <ThemeCard label="Emerald" id="emerald" current={profile?.theme || 'dark'} onSelect={changeTheme} badge="Pro" />
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="glass-card p-8 space-y-5">
          <h2 className="font-display text-lg mb-2">Account</h2>
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Username" value={profile?.username} />
          <InfoRow label="Plan" value={profile?.premium_plan} className="capitalize" />
          <InfoRow label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'} />
          <hr className="border-line" />
          <button onClick={handleLogout} className="flex items-center gap-2 text-mute hover:text-ink text-sm transition-colors">
            <SignOut size={16} /> Log out
          </button>
          <button onClick={deleteAccount} className="flex items-center gap-2 text-magenta/60 hover:text-magenta text-sm transition-colors">
            Delete account
          </button>
        </div>
      )}
    </section>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-mute">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${value ? 'bg-violet' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-200 ${value ? 'left-5.5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className="glass rounded-xl px-4 py-3">
      <span className="text-xs text-mute block mb-1">{label}</span>
      <span className={`text-sm ${className}`}>{value || '—'}</span>
    </div>
  )
}

function ThemeCard({ label, id, current, onSelect, badge }) {
  const isActive = current === id;
  const isPremium = badge === 'Premium';
  const isPro = badge === 'Pro';
  
  return (
    <button onClick={() => onSelect(id)} className={`glass-card p-5 w-36 text-center transition-colors ${isActive ? 'border-violet shadow-[0_0_20px_rgba(124,92,255,0.3)] scale-105' : 'hover:border-line hover:bg-white/5'}`}>
      <div className={`h-12 rounded-lg border mb-3 flex items-center justify-center
        ${id === 'dark' ? 'bg-[#0A0118] border-[#7C5CFF]/30' : ''}
        ${id === 'light' ? 'bg-[#F8F9FA] border-[#6C47FF]/30' : ''}
        ${id === 'cyberpunk' ? 'bg-[#090014] border-[#FF00E6]/30' : ''}
        ${id === 'sunset' ? 'bg-[#1F0D15] border-[#FF5E3A]/30' : ''}
        ${id === 'emerald' ? 'bg-[#061A12] border-[#00E676]/30' : ''}
      `} />
      <p className="text-sm flex items-center justify-center gap-1">
        {label}
      </p>
      {badge && <p className={`text-[10px] mt-1 font-mono uppercase ${isPro ? 'text-magenta' : 'text-cyan'}`}>{badge}</p>}
      {!badge && <p className="text-[10px] mt-1 font-mono text-mute uppercase">Free</p>}
      {isActive && <p className="text-xs text-violet-bright mt-2 font-medium">Active</p>}
    </button>
  )
}
