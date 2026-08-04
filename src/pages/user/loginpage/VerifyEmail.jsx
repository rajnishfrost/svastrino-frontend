import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import './Login.css'

/**
 * Email-verification landing page. Reached via the emailed link:
 *   /verify-email?token=<raw-token>
 * It posts the token to the backend, then shows the result. On success the user
 * is bounced to /login with the verified banner so they can sign in.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    // StrictMode mounts effects twice in dev; guard so we verify only once.
    if (ran.current) return
    ran.current = true

    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }

    api('/user/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('/login?verified=1', { replace: true }), 1400)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'This link is invalid or has expired.')
      })
  }, [token, navigate])

  return (
    <section className="login-wrap">
      <div className="card login-card">
        {status === 'verifying' && (
          <>
            <h1>Verifying your email…</h1>
            <p className="login-sub">Hang tight, this only takes a second.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>Email verified ✓</h1>
            <p className="login-sub">Your account is active. Taking you to login…</p>
            <p className="login-notice" role="status">All set — you can now sign in.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Verification failed</h1>
            <p className="login-error" role="alert">{message}</p>
            <p className="login-sub">
              The link may have expired. Try logging in and re-sending the verification email.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>
              Go to login
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
