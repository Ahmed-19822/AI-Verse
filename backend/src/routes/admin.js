import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()
router.use(requireAuth, requireAdmin)

async function logAction(adminId, action, targetId, details = {}) {
  await supabaseAdmin.from('admin_logs').insert({ admin_id: adminId, action, target_id: targetId, details })
}

// GET /api/admin/stats — platform-wide numbers for the dashboard cards
router.get('/stats', async (req, res) => {
  const [{ count: totalUsers }, { count: premiumUsers }, { count: proUsers }, { count: suspended }, { count: postsCount }, { count: messagesToday }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'premium').eq('status', 'active'),
    supabaseAdmin.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'pro').eq('status', 'active'),
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
    supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  res.json({
    totalUsers: totalUsers ?? 0,
    premiumUsers: premiumUsers ?? 0,
    proUsers: proUsers ?? 0,
    suspendedUsers: suspended ?? 0,
    totalPosts: postsCount ?? 0,
    messagesToday: messagesToday ?? 0,
    estimatedMRR: (premiumUsers ?? 0) * 5.99 + (proUsers ?? 0) * 12.99,
  })
})

// GET /api/admin/users?search=&page=1&limit=25
router.get('/users', async (req, res) => {
  const { search = '', page = 1, limit = 25 } = req.query
  const from = (Number(page) - 1) * Number(limit)
  const to = from + Number(limit) - 1

  let query = supabaseAdmin
    .from('profiles')
    .select('id, username, avatar_url, premium_plan, is_admin, is_suspended, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) query = query.ilike('username', `%${search}%`)

  const { data, count, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ users: data, total: count })
})

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('profiles').update({ is_suspended: true }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  await logAction(req.user.id, 'suspend_user', id)
  res.json({ ok: true })
})

// POST /api/admin/users/:id/unsuspend
router.post('/users/:id/unsuspend', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('profiles').update({ is_suspended: false }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  await logAction(req.user.id, 'unsuspend_user', id)
  res.json({ ok: true })
})

// POST /api/admin/users/:id/override-plan  { plan: 'free' | 'premium' | 'pro' }
// For support cases (refunds, manual comps) — bypasses Stripe entirely. Use sparingly;
// if the user later has a real Stripe event fire, the webhook will overwrite this.
router.post('/users/:id/override-plan', async (req, res) => {
  const { id } = req.params
  const { plan } = req.body
  if (!['free', 'premium', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' })
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({ user_id: id, plan, status: 'active', start_date: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return res.status(500).json({ error: error.message })

  await supabaseAdmin.from('profiles').update({ premium_plan: plan, is_premium: plan !== 'free' }).eq('id', id)
  await logAction(req.user.id, 'override_plan', id, { plan })
  res.json({ ok: true })
})

// GET /api/admin/posts/flagged — moderation queue (extend with a real `flagged` column/table)
router.get('/posts', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, content, media_url, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ posts: data })
})

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  await logAction(req.user.id, 'delete_post', id)
  res.json({ ok: true })
})

// GET /api/admin/logs — recent admin actions, newest first
router.get('/logs', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('admin_logs')
    .select('*, admin:admin_id(username)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ logs: data })
})

export default router
