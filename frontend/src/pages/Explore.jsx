import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Users, MagnifyingGlass, CrownSimple } from 'phosphor-react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../context/AuthContext.jsx'
import { motion } from 'framer-motion'
import { toast } from '../lib/toast.js'

export default function Explore() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchRandomProfiles()
  }, [])

  const fetchRandomProfiles = async () => {
    setLoading(true)
    try {
      // Fetch some random profiles (excluding current user)
      // Since supabase doesn't have a built-in RAND() without a custom RPC, 
      // we just fetch latest updated or limit.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .limit(20)
      
      if (error) throw error
      // Shuffle locally for a "random" feel
      setProfiles(data.sort(() => 0.5 - Math.random()))
    } catch (err) {
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter(p => p.username?.toLowerCase().includes(search.toLowerCase()))

  return (
    <section className="px-6 pt-10 pb-20 max-w-5xl mx-auto h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="label-eyebrow mb-2">Discover</p>
          <h1 className="font-display text-4xl tracking-tight flex items-center gap-3">
            <Compass weight="fill" className="text-violet" />
            Explore
          </h1>
        </div>
      </div>

      <div className="relative mb-8">
        <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
        <input 
          type="text" 
          placeholder="Search users..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-line rounded-xl py-3 pl-12 pr-4 text-ink placeholder:text-mute focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all"
        />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-violet border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto min-h-0 pb-10">
          {filteredProfiles.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/profile/${p.id}`} className="glass-card p-5 flex items-center gap-4 hover:border-violet/50 hover:shadow-[0_4px_20px_rgba(124,92,255,0.15)] transition-all group">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-xl font-display text-white overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                  ) : (
                    p.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-display text-lg truncate group-hover:text-violet transition-colors">{p.username}</h3>
                    {p.premium_plan !== 'free' && <CrownSimple weight="fill" size={14} className="text-cyan shrink-0" />}
                  </div>
                  <p className="text-sm text-mute truncate">{p.bio || 'No bio yet'}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-surface border border-line flex items-center justify-center group-hover:bg-violet group-hover:text-white transition-colors shrink-0">
                  <Users size={16} />
                </div>
              </Link>
            </motion.div>
          ))}
          {filteredProfiles.length === 0 && (
            <div className="col-span-full py-12 text-center text-mute">
              No users found.
            </div>
          )}
        </div>
      )}
    </section>
  )
}
