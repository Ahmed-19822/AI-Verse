import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const PLAN_RANK = { free: 0, premium: 1, pro: 2 }

// Use on any route that requires a minimum plan, e.g. requirePlan('premium')
// The frontend's view of the user's plan is for UI only — this is the real check.
export function requirePlan(minPlan) {
  return async (req, res, next) => {
    const { data: sub, error } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, end_date')
      .eq('user_id', req.user.id)
      .single()

    const plan = !error && sub && sub.status === 'active' ? sub.plan : 'free'

    if (PLAN_RANK[plan] < PLAN_RANK[minPlan]) {
      return res.status(403).json({
        error: `This feature requires the ${minPlan} plan`,
        currentPlan: plan,
      })
    }

    req.plan = plan
    next()
  }
}
