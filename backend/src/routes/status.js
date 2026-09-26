import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const FREE_DAILY_STATUS_LIMIT = 1

// POST /api/status — create a status post.
// Free plan: 1 status per rolling 24h. Premium/Pro: unlimited.
router.post('/', requireAuth, async (req, res) => {
  const { caption, content_type = 'text', content_url } = req.body
  if (!caption && !content_url) {
    return res.status(400).json({ error: 'Status needs a caption or media' })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', req.user.id)
    .single()
  const plan = sub?.status === 'active' ? sub.plan : 'free'

  if (plan === 'free') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('statuses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('created_at', since)

    if ((count ?? 0) >= FREE_DAILY_STATUS_LIMIT) {
      return res.status(403).json({
        error: `Free plan is limited to ${FREE_DAILY_STATUS_LIMIT} status update every 24 hours. Upgrade to Premium for unlimited status uploads.`,
      })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('statuses')
    .insert({ user_id: req.user.id, caption, content_type, content_url })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ status: data })
})

export default router
