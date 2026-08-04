import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, adminTokenStore } from '../../../api/client.js'
import './AdminLogin.css'

/**
 * Admin login — email + password. Talks to the admin credentials module:
 * POST /admin/auth/login -> { token }.
 */
export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      adminTokenStore.set(data.token)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <div className="admin-login-brand">
          <img src="/logo.png" alt="Svastrino Consultancy Services" />
        </div>

        {error && <p className="admin-login-error">{error}</p>}

        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
