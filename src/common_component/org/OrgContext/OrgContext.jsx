import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { api } from '../../../api/client.js'

const OrgContext = createContext(null)

/**
 * The signed-in organisation's own record: profile, granted modules, headline
 * stats and its live scholarship cycle.
 *
 * One shared session powers the whole app, so there's no separate org login —
 * `/org/me` simply 403s for anyone who doesn't own an approved organisation,
 * and OrgProtectedRoute turns that into a redirect. Loaded once here so the
 * sidebar, dashboard and every page read the same modules list.
 */
export function OrgProvider({ children }) {
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading') // 'loading' | 'ok' | 'denied'
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const d = await api('/org/me', { auth: 'user' })
      setData(d)
      setState('ok')
      return d
    } catch (e) {
      setError(e.message)
      setState('denied')
      return null
    }
  }, [])

  useEffect(() => { load() }, [load])

  const can = useCallback((mod) => (data?.modules || []).includes(mod), [data])

  return (
    <OrgContext.Provider value={{ ...(data || {}), state, error, refresh: load, can }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within <OrgProvider>')
  return ctx
}
