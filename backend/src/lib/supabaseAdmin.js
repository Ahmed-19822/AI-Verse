import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Service-role client — full DB access, bypasses RLS.
// ONLY ever used on the backend. Never send this key to the frontend.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
