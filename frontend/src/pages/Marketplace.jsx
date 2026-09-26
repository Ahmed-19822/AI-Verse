import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Storefront, Sparkle, Plus } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { apiFetch } from '../lib/api.js'
import { toast } from '../lib/toast.js'

export default function Marketplace() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    supabase.from('ai_characters')
      .select('*, profiles:owner_id(username)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('marketplace error', error)
        setCharacters(data || [])
        setLoading(false)
      })
  }, [])

  const addToHub = async (character) => {
    setAddingId(character.id)
    try {
      await apiFetch(`/api/ai/characters/${character.id}/clone`, { method: 'POST' })
      toast.success(`${character.name} added to your AI Hub!`)
      navigate('/ai-hub')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAddingId(null)
    }
  }

  if (profile?.premium_plan !== 'pro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Storefront size={48} className="text-magenta mb-4 opacity-50" />
        <h2 className="text-2xl font-display mb-2">AI Marketplace</h2>
        <p className="text-mute mb-6 max-w-sm">Browsing and adding community-made AI characters is exclusive to the Pro plan.</p>
        <Link to="/premium" className="btn-primary">Upgrade to Pro</Link>
      </div>
    )
  }

  return (
    <section className="px-6 pt-10 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="label-eyebrow mb-2 text-magenta">Pro Feature</p>
          <h1 className="font-display text-4xl tracking-tight flex items-center gap-3">
            <Storefront weight="fill" className="text-magenta" />
            Marketplace
          </h1>
          <p className="text-mute text-sm mt-2">Custom AI characters published by the community.</p>
        </div>
        <Link to="/ai-creator" className="btn-ghost text-sm flex items-center gap-2"><Plus size={14} /> Publish yours</Link>
      </div>

      {loading && <p className="text-mute text-sm text-center py-10">Loading marketplace…</p>}

      {!loading && characters.length === 0 && (
        <div className="glass-card p-10 text-center text-mute text-sm">
          No public characters yet. Be the first — create one and toggle "Publish to the AI Marketplace".
        </div>
      )}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {characters.map((c) => (
          <div key={c.id} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center shrink-0">
                <Sparkle size={16} weight="fill" className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-mute truncate">by {c.profiles?.username || 'someone'}</p>
              </div>
            </div>
            <p className="text-xs text-cyan mb-1">{c.role}</p>
            <p className="text-xs text-mute line-clamp-3 mb-4">{c.personality}</p>
            <button onClick={() => addToHub(c)} disabled={addingId === c.id}
              className="btn-ghost text-xs w-full flex items-center justify-center gap-1.5 disabled:opacity-60">
              <Plus size={12} /> {addingId === c.id ? 'Adding…' : 'Add to my hub'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
