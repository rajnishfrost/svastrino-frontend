import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api, adminTokenStore } from '../../../api/client.js'

/**
 * Guards the /admin area. There's one shared session now, so simply having a
 * token isn't enough — a signed-in student carries the same token. We confirm
 * the account actually has panel access (superadmin or a module-granting role)
 * by calling /admin/auth/me; anyone else is bounced to the panel login.
 */
export default function AdminProtectedRoute({ children }) {
  const [state, setState] = useState('checking') // 'checking' | 'ok' | 'denied'

  useEffect(() => {
    if (!adminTokenStore.get()) { setState('denied'); return }
    let alive = true
    api('/admin/auth/me', { auth: 'admin' })
      .then(() => alive && setState('ok'))
      .catch(() => alive && setState('denied'))
    return () => { alive = false }
  }, [])

  if (state === 'checking') {
    return <div style={{ padding: 40, fontSize: 15, color: '#5b6677' }}>Loading…</div>
  }
  if (state === 'denied') return <Navigate to="/login" replace />
  return children
}
