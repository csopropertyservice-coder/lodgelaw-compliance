import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  displayName?: string
}

function mapUser(u: SupabaseUser): User {
  return {
    id: u.id,
    email: u.email ?? '',
    displayName: u.user_metadata?.full_name ?? u.email ?? '',
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapUser(session.user) : null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

  const logout = () => supabase.auth.signOut()

  return { user, isLoading, isAuthenticated: !!user, login, logout }
}
