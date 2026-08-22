/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'

const AppAuthContext = createContext(null)

/**
 * Site-wide Admin / Researcher / Student login, backed by the main
 * Supabase project (src/supabase.js — the same one `specimens` and
 * `sites` live in). Separate from context/AuthContext.jsx, which signs
 * users into a different teammate's Supabase project for the Skeletal
 * Knowledge Course only — the two are intentionally independent.
 *
 * Role and approval status are read from the `profiles` table (see
 * role_based_access_setup.sql + approval_workflow_setup.sql). New
 * sign-ups default to role = 'student' and status = 'pending' — an
 * Admin must approve the account (from the Approvals page) before it
 * can be used, regardless of role.
 */
export function AppAuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setRole(null)
      setStatus(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('user_id', userId)
      .single()
    setRole(data?.role ?? 'student')
    setStatus(data?.status ?? 'pending')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      await loadProfile(newSession?.user?.id)
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setRole(null)
    setStatus(null)
  }, [])

  const user = session?.user ?? null

  return (
    <AppAuthContext.Provider value={{ user, role, status, loading, signIn, signUp, signOut }}>
      {children}
    </AppAuthContext.Provider>
  )
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext)
  if (!ctx) throw new Error('useAppAuth must be used within <AppAuthProvider>')
  return ctx
}
