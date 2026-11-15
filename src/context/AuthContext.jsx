import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { auth } from '@/data/backend'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    auth
      .getCurrentUser()
      .then((current) => {
        if (active) setUser(current)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = auth.onAuthChange((next) => setUser(next))

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signIn: async (credentials) => {
        const next = await auth.signIn(credentials)
        setUser(next)
        return next
      },
      signUp: async (payload) => {
        const next = await auth.signUp(payload)
        setUser(next)
        return next
      },
      signOut: async () => {
        await auth.signOut()
        setUser(null)
      },
      requestPasswordReset: (email) => auth.requestPasswordReset(email),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.')
  return context
}
