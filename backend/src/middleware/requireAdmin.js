import { supabaseAdmin } from '../lib/supabaseAdmin.js'

// Must run after requireAuth. Re-checks is_admin from the database every request —
// admin status is never cached client-side or trusted from a token claim.
export async function requireAdmin(req, res, next) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('is_admin, is_suspended')
    .eq('id', req.user.id)
    .single()

  if (error || !data?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  if (data.is_suspended) {
    return res.status(403).json({ error: 'Account suspended' })
  }

  next()
}
