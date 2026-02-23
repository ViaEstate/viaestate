import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { Profile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: 'broker' | 'private_user') => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const profileCache = useRef<{ [key: string]: Profile }>({})
  const isFetchingProfile = useRef(false)
  const hasInitialized = useRef(false)

  // Fetch profile - NOT in useCallback to avoid dependency issues
  const fetchProfile = async (userId: string) => {
    // Check cache
    if (profileCache.current[userId]) {
      setProfile(profileCache.current[userId])
      return
    }

    // Prevent duplicate fetches
    if (isFetchingProfile.current) {
      return
    }

    isFetchingProfile.current = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        setProfile(null)
        return
      }

      if (data) {
        profileCache.current[userId] = data
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (err) {
      setProfile(null)
    } finally {
      isFetchingProfile.current = false
    }
  }

  // Single useEffect with NO dependencies to prevent re-initialization
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      return
    }
    hasInitialized.current = true

    let mounted = true

    // Initialize auth
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          setLoading(false)
          return
        }

        if (session?.user && session.expires_at && session.expires_at > Date.now() / 1000) {
          // Session is not expired, refresh to extend lifetime and set user
          await supabase.auth.refreshSession()
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        // Silent error handling for initialization
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchProfile(session.user.id)
            }
            break

          case 'SIGNED_OUT':
            // Attempt to refresh session before signing out
            try {
              const { data: { session }, error } = await supabase.auth.refreshSession()
              if (session?.user && !error) {
                // Session refreshed successfully, stay logged in
                setUser(session.user)
                if (!profile || profile.id !== session.user.id) {
                  await fetchProfile(session.user.id)
                }
                break
              }
            } catch (refreshError) {
              // Refresh failed, proceed with sign out
            }
            // Sign out
            setUser(null)
            setProfile(null)
            profileCache.current = {}
            break

          case 'TOKEN_REFRESHED':
            setUser(session?.user ?? null)
            // Don't refetch profile on token refresh
            break

          case 'USER_UPDATED':
            setUser(session?.user ?? null)
            if (session?.user) {
              delete profileCache.current[session.user.id]
              await fetchProfile(session.user.id)
            }
            break
        }
      }
    )

    // Cleanup
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // EMPTY dependency array - this is critical!

  // Periodic session refresh for logged in users
  useEffect(() => {
    if (!user) return

    const refreshInterval = setInterval(async () => {
      try {
        await supabase.auth.refreshSession()
      } catch (err) {
        // Silent error handling for periodic refresh
      }
    }, 5 * 60 * 1000) // Refresh every 5 minutes

    return () => clearInterval(refreshInterval)
  }, [user])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) throw error
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'broker' | 'private_user'
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })

    if (error) throw error

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        status: 'pending'
      })
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      profileCache.current = {}
    } catch (error) {
      setUser(null)
      setProfile(null)
      profileCache.current = {}
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}