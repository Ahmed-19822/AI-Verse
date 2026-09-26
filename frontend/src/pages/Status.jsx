import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Eye, X, Clock, Image as ImageIcon } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'
import { apiFetch } from '../lib/api.js'

export default function Status() {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState([])
  const [creating, setCreating] = useState(false)
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [posting, setPosting] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(true)

  const fileInputRef = useRef(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('statuses')
      .select('*, profiles:user_id(username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) console.error('status error', error)
    setStatuses(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user?.id) load() }, [user?.id, load])

  const post = async () => {
    if (!caption.trim() && !imageFile) return
    setPosting(true)
    let finalUrl = null

    try {
      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
        const ext = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage.from('media').upload(`status/${fileName}`, imageFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(`status/${fileName}`);
        finalUrl = publicUrlData.publicUrl;
      }

      // We call the backend to respect the free/premium daily limit
      const res = await apiFetch('/api/status', {
        method: 'POST',
        body: JSON.stringify({ 
          caption: caption.trim(), 
          content_url: finalUrl, 
          content_type: finalUrl ? 'image' : 'text' 
        })
      })

      if (res.error) throw new Error(res.error)
      
      setCaption(''); setImageFile(null); setCreating(false); load(); toast.success('Status posted! Expires in 24h')
    } catch (err) {
      toast.error(err.message || 'Failed to post status')
    } finally {
      setPosting(false)
    }
  }

  const openStatus = async (s) => {
    setViewing(s)
    if (s.user_id !== user.id) {
      await supabase.from('status_views').upsert({ status_id: s.id, viewer_id: user.id }, { onConflict: 'status_id,viewer_id' })
    }
    const { data } = await supabase.from('status_views').select('viewer_id, profiles:viewer_id(username)').eq('status_id', s.id)
    setViews(data || [])
  }

  const deleteStatus = async (id) => {
    await supabase.from('statuses').delete().eq('id', id)
    setStatuses((s) => s.filter((st) => st.id !== id))
    setViewing(null)
    toast.info('Status deleted')
  }

  const grouped = statuses.reduce((acc, s) => { acc[s.user_id] = acc[s.user_id] || []; acc[s.user_id].push(s); return acc }, {})

  const timeLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date()
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return hours > 0 ? `${hours}h left` : `${mins}m left`
  }

  return (
    <section className="px-6 pt-10 pb-20 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><p className="label-eyebrow mb-2">Fading signals</p><h1 className="font-display text-4xl tracking-tight">Status</h1></div>
        <button onClick={() => setCreating(!creating)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> New status</button>
      </div>

      {creating && (
        <div className="glass-card p-6 mb-8">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3}
            placeholder="What's happening? Disappears in 24 hours…"
            className="glass rounded-xl px-4 py-3 text-sm outline-none w-full resize-none placeholder:text-mute/60 mb-4" />
          
          {imageFile && (
            <div className="relative w-24 h-24 mb-4 rounded-xl overflow-hidden border border-line">
              <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => setImageFile(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-magenta transition-colors">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button onClick={post} disabled={(!caption.trim() && !imageFile) || posting} className="btn-primary text-sm disabled:opacity-60">
                {posting ? 'Posting…' : 'Post status'}
              </button>
              <button onClick={() => { setCreating(false); setImageFile(null); }} className="btn-ghost text-sm">Cancel</button>
            </div>
            
            <button onClick={() => fileInputRef.current?.click()} className="h-10 w-10 flex items-center justify-center rounded-xl glass text-mute hover:text-cyan transition-colors" title="Attach Image">
              <ImageIcon size={20} />
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])} />
            </button>
          </div>
        </div>
      )}

      {loading && <div className="text-center text-mute text-sm py-10">Loading statuses…</div>}

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([uid, items]) => (
          <button key={uid} onClick={() => openStatus(items[0])} className="glass-card p-5 text-left hover:border-violet/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-cyan overflow-hidden flex items-center justify-center text-xs font-display text-white">
                {items[0].profiles?.avatar_url ? <img src={items[0].profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : items[0].profiles?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{items[0].profiles?.username}</p>
                <p className="text-xs text-mute flex items-center gap-1"><Clock size={10} /> {timeLeft(items[0].expires_at)}</p>
              </div>
            </div>
            {items[0].content_type === 'image' && (
               <div className="w-full h-32 rounded-lg bg-surface mb-3 overflow-hidden">
                 <img src={items[0].content_url} alt="Status" className="w-full h-full object-cover opacity-80" />
               </div>
            )}
            <p className="text-xs text-ink/80 line-clamp-2">{items[0].caption}</p>
            {items.length > 1 && <p className="text-xs text-cyan mt-2">+{items.length - 1} more</p>}
          </button>
        ))}
        {!loading && statuses.length === 0 && (
          <div className="glass-card p-10 text-center text-mute text-sm col-span-full">No active statuses — be the first.</div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setViewing(null)}>
          <div className="glass-card max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet to-cyan overflow-hidden flex items-center justify-center text-xs font-display text-white">
                  {viewing.profiles?.avatar_url ? <img src={viewing.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : viewing.profiles?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{viewing.profiles?.username}</p>
                  <p className="text-xs text-mute flex items-center gap-1"><Clock size={10} /> {timeLeft(viewing.expires_at)}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="text-mute hover:text-ink"><X size={18} /></button>
            </div>
            {viewing.content_type === 'image' && viewing.content_url && (
              <img src={viewing.content_url} alt="Status content" className="w-full rounded-xl mb-4 max-h-[60vh] object-contain" />
            )}
            <p className="text-base leading-relaxed mb-6">{viewing.caption}</p>
            <div className="flex items-center justify-between">
              {viewing.user_id === user.id ? (
                <>
                  <div className="text-xs text-mute flex items-center gap-1.5">
                    <Eye size={14} /> {views.length} view{views.length !== 1 ? 's' : ''}
                    {views.length > 0 && `: ${views.map((v) => v.profiles?.username).join(', ')}`}
                  </div>
                  <button onClick={() => deleteStatus(viewing.id)} className="text-magenta text-xs hover:underline">Delete</button>
                </>
              ) : (
                <p className="text-xs text-mute">Seen by you</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
