import { supabaseAdmin } from '../lib/supabaseAdmin.js'

// Verifies the Supabase access token sent from the frontend (Authorization: Bearer <token>).
// Never trust a user_id sent in the request body — always derive it from the verified token.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  req.user = data.user
  next()
}
