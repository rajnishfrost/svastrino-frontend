import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, tokenStore } from '../api/client.js'
import { flush as flushOutbox } from '../utils/outbox.js'

const AuthContext = createContext(null)
const USER_KEY = 'svastrino_user' // last known profile — lets the app work offline

/* The profile DTO is plain JSON, so we can safely keep a copy locally. */
const readCachedUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}
const writeCachedUser = (u) => {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(USER_KEY)
  } catch { /* private mode / quota */ }
}

/**
 * Unified user auth (mentoring + courses share one account).
 *
 * Offline-safe: the session lives in localStorage (token + last profile), so a
 * student with no internet stays logged in and can reach their downloaded
 * videos. We only sign someone out when the SERVER says the token is invalid
 * (401/403) — never because the network was unreachable.
 */
export function AuthProvider({ children }) {
  // Seed synchronously from cache so ProtectedRoute passes on the first paint,
  // before any request resolves.
  const [user, setUser] = useState(() => (tokenStore.get() ? readCachedUser() : null))
  const [loading, setLoading] = useState(true)

  const applyUser = useCallback((u) => {
    setUser(u)
    writeCachedUser(u)
  }, [])

  const loadProfile = useCallback(async () => {
    if (!tokenStore.get()) {
      applyUser(null)
      setLoading(false)
      return
    }
    try {
      const data = await api('/user/profile', { auth: 'user' })
      applyUser(data?.user || data || null)
    } catch (e) {
      // `api()` sets `.status` only for real HTTP errors. A network failure
      // (offline) throws a bare TypeError with no status — keep the session.
      if (e?.status === 401 || e?.status === 403) {
        tokenStore.clear()
        applyUser(null)
      } else {
        setUser(readCachedUser()) // offline or 5xx → stay signed in
      }
    } finally {
      setLoading(false)
    }
  }, [applyUser])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const login = useCallback((token, userData) => {
    tokenStore.set(token)
    if (userData) applyUser(userData)
    // Anything queued while signed out (e.g. an offline video-watch) syncs now.
    flushOutbox().catch(() => {})
  }, [applyUser])

  const logout = useCallback(() => {
    tokenStore.clear()
    applyUser(null)
  }, [applyUser])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh: loadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
