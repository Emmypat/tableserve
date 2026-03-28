import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [organizer, setOrganizer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchOrganizer(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchOrganizer(session.user.id)
      else { setOrganizer(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchOrganizer(userId) {
    const { data } = await supabase
      .from('organizers')
      .select('*')
      .eq('id', userId)
      .single()
    setOrganizer(data)
    setLoading(false)
  }

  async function signup({ email, password, name, phone }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone: phone || '' } },
    })
    if (error) throw error
    return data
  }

  async function login({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, organizer, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
