import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (!session?.user) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }

  useEffect(() => {
    refreshProfile()
  }, [session?.user?.id])

  useEffect(() => {
    if (profile?.theme) {
      const root = document.documentElement
      root.className = ''
      root.classList.add(`theme-${profile.theme}`)
    }
  }, [profile?.theme])

  const signUp = async ({ email, password, username }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    if (error) throw error
    // Profile is created automatically by the DB trigger handle_new_user()
    // No manual insert needed here
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => { await supabase.auth.signOut() }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signUp, signIn, signOut, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
