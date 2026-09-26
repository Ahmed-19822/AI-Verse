import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { PencilSimple, Check, CrownSimple, X, Camera, UserPlus, ChatCircle } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'
import { Link, useParams, useNavigate } from 'react-router-dom'

export default function Profile() {
  const { profile: currentUserProfile, user: currentUser, refreshProfile } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  
  const isOwnProfile = !userId || userId === currentUser?.id
  const displayId = isOwnProfile ? currentUser?.id : userId

  const [profileData, setProfileData] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '', status: 'online' })
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ friends: 0, posts: 0, messages: 0 })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Friendship state
  const [friendStatus, setFriendStatus] = useState('none') // none, pending_sent, pending_received, friends

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOwnProfile) {
      setProfileData(currentUserProfile)
      if (currentUserProfile) {
        setForm({ username: currentUserProfile.username || '', bio: currentUserProfile.bio || '', status: currentUserProfile.status || 'online' })
      }
    } else {
      fetchUserProfile()
      checkFriendship()
    }
  }, [userId, isOwnProfile, currentUserProfile])

  useEffect(() => {
    if (!displayId) return
    Promise.all([
      supabase.from('friends').select('id', { count: 'exact', head: true }).eq('user_id', displayId),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', displayId),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', displayId),
    ]).then(([fr, po, ms]) => setStats({ friends: fr.count || 0, posts: po.count || 0, messages: ms.count || 0 }))
  }, [displayId])

  const fetchUserProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) { toast.error('User not found'); navigate('/dashboard'); return; }
    setProfileData(data)
  }

  const checkFriendship = async () => {
    if (!currentUser?.id || !userId) return;
    const { data: request, error: reqError } = await supabase.from('friend_requests')
      .select('sender_id, receiver_id, status')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
      .single()
    
    if (request) {
      if (request.status === 'accepted') setFriendStatus('friends')
      else if (request.sender_id === currentUser.id) setFriendStatus('pending_sent')
      else setFriendStatus('pending_received')
    } else {
      setFriendStatus('none')
    }
  }

  const sendFriendRequest = async () => {
    const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: userId })
    if (error) toast.error(error.message)
    else { toast.success('Friend request sent'); setFriendStatus('pending_sent') }
  }

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
      
      setUploadingAvatar(true);
      const ext = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${ext}`;
      
      const { data, error: uploadError } = await supabase.storage.from('media').upload(`avatars/${fileName}`, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(`avatars/${fileName}`);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', currentUser.id);
      if (updateError) throw updateError;
      
      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
      toast.success('Avatar updated!');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      e.target.value = ''; // Reset input
    }
  }

  const save = async () => {
    if (!form.username.trim()) { toast.error('Username cannot be empty'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', currentUser.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else { await refreshProfile(); setEditing(false); toast.success('Profile updated!') }
  }

  if (!profileData) return <div className="min-h-screen flex items-center justify-center text-mute text-sm">Loading…</div>

  return (
    <section className="min-h-screen px-6 pt-10 pb-20 max-w-3xl mx-auto">
      <p className="label-eyebrow mb-2">{isOwnProfile ? 'Your identity' : 'User Profile'}</p>
      <h1 className="font-display text-4xl tracking-tight mb-8">Profile</h1>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 mb-6">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-3xl font-display text-white overflow-hidden border-2 border-transparent group-hover:border-violet/50 transition-all relative">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt={profileData.username} className={`w-full h-full object-cover transition-opacity duration-300 ${uploadingAvatar ? 'opacity-50' : 'opacity-100'}`} />
                ) : (
                  profileData.username?.[0]?.toUpperCase()
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button onClick={() => !uploadingAvatar && fileInputRef.current?.click()} className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-surface border border-line flex items-center justify-center text-white hover:bg-violet transition-colors shadow-lg z-10 cursor-pointer disabled:opacity-50" disabled={uploadingAvatar}>
                  <Camera size={14} />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </button>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-2xl">{profileData.username}</h2>
                {profileData.premium_plan !== 'free' && <CrownSimple size={20} weight="fill" className="text-cyan" title="Premium User" />}
              </div>
              {isOwnProfile && <p className="text-sm text-mute">{currentUser?.email}</p>}
              <div className="flex gap-2 mt-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full glass capitalize">{profileData.premium_plan} plan</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full glass capitalize ${profileData.status === 'online' ? 'text-cyan' : 'text-mute'}`}>{profileData.status}</span>
              </div>
            </div>
          </div>
          
          {isOwnProfile ? (
            <button onClick={() => editing ? save() : setEditing(true)} disabled={saving} className="btn-ghost flex items-center gap-2 text-sm">
              {editing ? <><Check size={16} /> {saving ? 'Saving…' : 'Save'}</> : <><PencilSimple size={16} /> Edit</>}
            </button>
          ) : (
            <div className="flex gap-2">
              {friendStatus === 'none' && <button onClick={sendFriendRequest} className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><UserPlus size={16} /> Add Friend</button>}
              {friendStatus === 'pending_sent' && <button disabled className="btn-ghost py-2 px-4 text-sm text-mute border-mute/20">Request Sent</button>}
              {friendStatus === 'pending_received' && <button disabled className="btn-primary py-2 px-4 text-sm text-cyan">Respond in Friends tab</button>}
              {friendStatus === 'friends' && <Link to={`/chat?user=${userId}`} className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><ChatCircle size={16} /> Message</Link>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 p-4 glass rounded-xl">
          {[['Friends', stats.friends], ['Posts', stats.posts], ['Messages', stats.messages]].map(([label, val]) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl">{val}</p>
              <p className="text-xs text-mute">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {editing ? (
            <>
              <Field label="Username">
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-transparent outline-none text-sm w-full" />
              </Field>
              <Field label="Bio">
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="bg-transparent outline-none text-sm w-full resize-none" placeholder="Tell people who you are…" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-void outline-none text-sm w-full">
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </Field>
              <button onClick={() => setEditing(false)} className="text-mute text-xs flex items-center gap-1 hover:text-magenta"><X size={12} /> Cancel</button>
            </>
          ) : (
            <>
              <Field label="Bio"><p className="text-sm text-ink/90">{profileData.bio || 'No bio yet.'}</p></Field>
              <Field label="Member since"><p className="text-sm text-mute">{new Date(profileData.created_at).toLocaleDateString()}</p></Field>
            </>
          )}
        </div>
      </motion.div>

      {isOwnProfile && (
        <div className="flex gap-3 flex-wrap">
          <Link to="/settings" className="btn-ghost text-sm">Settings</Link>
          <Link to="/premium" className="btn-ghost text-sm">Upgrade plan</Link>
        </div>
      )}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div className="glass rounded-xl px-4 py-3">
      <span className="text-xs text-mute block mb-1">{label}</span>
      {children}
    </div>
  )
}
