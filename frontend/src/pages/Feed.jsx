import { useEffect, useState, useCallback } from 'react'
import { Heart, ChatCircle, PaperPlaneTilt, Trash } from 'phosphor-react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { toast } from '../lib/toast.js'
import { Link } from 'react-router-dom'

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [draft, setDraft] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [openComments, setOpenComments] = useState(null)
  const [comments, setComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('posts')
      .select('*, profiles:user_id(username, avatar_url), likes(user_id), comments(id)')
      .order('created_at', { ascending: false }).limit(30)
    if (error) console.error('feed error', error)
    setPosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user?.id) load() }, [user?.id, load])

  const publish = async () => {
    if (!draft.trim()) return
    setPublishing(true)
    const { error } = await supabase.from('posts').insert({ user_id: user.id, content: draft.trim() })
    if (error) toast.error(error.message)
    else { setDraft(''); load(); toast.success('Posted!') }
    setPublishing(false)
  }

  const deletePost = async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) toast.error(error.message)
    else { setPosts((p) => p.filter((post) => post.id !== postId)); toast.info('Post deleted') }
  }

  const toggleLike = async (post) => {
    const liked = post.likes?.some((l) => l.user_id === user.id)
    if (liked) await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    else await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
    load()
  }

  const fetchComments = async (postId) => {
    const { data } = await supabase.from('comments').select('*, profiles:user_id(username, avatar_url)').eq('post_id', postId).order('created_at')
    setComments((c) => ({ ...c, [postId]: data || [] }))
  }

  const loadComments = async (postId) => {
    if (openComments === postId) { setOpenComments(null); return }
    setOpenComments(postId)
    fetchComments(postId)
  }

  const addComment = async (postId) => {
    const text = commentDrafts[postId]?.trim()
    if (!text) return
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: text })
    if (error) { toast.error(error.message); return }
    setCommentDrafts((d) => ({ ...d, [postId]: '' }))
    fetchComments(postId)
    load()
  }

  return (
    <section className="min-h-screen px-6 pt-28 pb-20 max-w-2xl mx-auto">
      <p className="label-eyebrow mb-2">The network</p>
      <h1 className="font-display text-4xl tracking-tight mb-8">Feed</h1>

      {/* Compose */}
      <div className="glass-card p-5 mb-8">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
          placeholder="Share something with your circle…"
          className="bg-transparent outline-none text-sm w-full resize-none placeholder:text-mute/60 mb-3" />
        <div className="flex justify-between items-center">
          <p className="text-xs text-mute">{draft.length}/500</p>
          <button onClick={publish} disabled={!draft.trim() || publishing} className="btn-primary text-sm py-2 disabled:opacity-60">
            {publishing ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>

      {loading && <div className="text-center text-mute text-sm py-10">Loading feed…</div>}

      <div className="space-y-5">
        {!loading && posts.length === 0 && (
          <div className="glass-card p-10 text-center">
            <p className="text-mute text-sm">No posts yet — be the first to share.</p>
          </div>
        )}
        {posts.map((p) => {
          const liked = p.likes?.some((l) => l.user_id === user.id)
          const isOwn = p.user_id === user.id
          return (
            <div key={p.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${p.user_id}`} className="h-9 w-9 rounded-full bg-gradient-to-br from-violet to-cyan shrink-0 overflow-hidden flex items-center justify-center text-xs font-display text-white">
                    {p.profiles?.avatar_url ? (
                      <img src={p.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      p.profiles?.username?.[0]?.toUpperCase()
                    )}
                  </Link>
                  <div>
                    <Link to={`/profile/${p.user_id}`} className="text-sm font-medium hover:text-violet transition-colors">{p.profiles?.username}</Link>
                    <p className="text-xs text-mute">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {isOwn && (
                  <button onClick={() => deletePost(p.id)} className="text-mute hover:text-magenta p-1.5 rounded-lg glass hover:border-magenta/30 transition-colors">
                    <Trash size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-ink/90 mb-4 leading-relaxed">{p.content}</p>
              <div className="flex items-center gap-5 text-mute text-sm">
                <button onClick={() => toggleLike(p)} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-magenta' : 'hover:text-magenta'}`}>
                  <Heart size={16} weight={liked ? 'fill' : 'regular'} /> {p.likes?.length || 0}
                </button>
                <button onClick={() => loadComments(p.id)} className="flex items-center gap-1.5 hover:text-cyan transition-colors">
                  <ChatCircle size={16} /> {p.comments?.length || 0}
                </button>
              </div>

              {openComments === p.id && (
                <div className="mt-4 pt-4 border-t border-line space-y-3">
                  {(comments[p.id] || []).map((c) => (
                    <div key={c.id} className="text-sm flex gap-2">
                      <Link to={`/profile/${c.user_id}`} className="h-6 w-6 rounded-full bg-gradient-to-br from-violet to-cyan shrink-0 mt-0.5 overflow-hidden flex items-center justify-center text-[10px] font-display text-white">
                        {c.profiles?.avatar_url ? (
                          <img src={c.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          c.profiles?.username?.[0]?.toUpperCase()
                        )}
                      </Link>
                      <div>
                        <Link to={`/profile/${c.user_id}`} className="text-cyan text-xs hover:text-violet transition-colors">{c.profiles?.username} </Link>
                        <span className="text-ink/85">{c.content}</span>
                      </div>
                    </div>
                  ))}
                  {(comments[p.id] || []).length === 0 && <p className="text-xs text-mute">No comments yet.</p>}
                  <div className="flex gap-2 items-center mt-2">
                    <input value={commentDrafts[p.id] || ''} onChange={(e) => setCommentDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      placeholder="Add a comment…" onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)}
                      className="glass rounded-lg px-3 py-2 text-sm outline-none flex-1 placeholder:text-mute/60" />
                    <button onClick={() => addComment(p.id)} className="text-cyan hover:text-violet transition-colors">
                      <PaperPlaneTilt size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
