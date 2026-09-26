function resolveApiBaseUrl() {
  const fromEnv =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL
  if (fromEnv != null && String(fromEnv).trim() !== '') {
    return String(fromEnv).replace(/\/+$/, '')
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:4000'
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

const BASE_URL = resolveApiBaseUrl()

export async function apiFetch(path, options = {}) {
  // Import supabase client and get the current session token
  const { supabase } = await import('./supabaseClient.js')
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (networkErr) {
    // fetch() throws a bare "Failed to fetch" TypeError when it can't reach the
    // server at all (server down, wrong port, CORS block) — turn that into a
    // message that actually tells the person what to check.
    const hint = import.meta.env.DEV
      ? ' Make sure the backend is running (cd backend && npm run dev).'
      : ' Check VITE_API_URL on your hosting provider matches your deployed backend.'
    throw new Error(`Can't reach the AIverse server at ${BASE_URL}.${hint}`)
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
  return body
}
