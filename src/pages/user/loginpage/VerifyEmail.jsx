import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { LEARN_PATH } from '../nirmaanpage/trialIntent.js'
import TrialWelcome from './TrialWelcome.jsx'
import './Login.css'

/**
 * Email-verification landing page. Reached via the emailed link:
 *   /verify-email?token=<raw-token>
 *
 * On success the account is not only verified, it is SIGNED IN: the server
 * returns a session alongside the result, because clicking a link sent to that
 * address already proves it. The student then meets the free-week offer right
 * here, once, with nothing left to type — and either starts the trial or goes
 * to their dashboard.
 *
 * A failed verification is untouched: expired or bad links show the same
 * message and the same way back to login as before.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [offerTrial, setOfferTrial] = useState(false)
  const [busy, setBusy] = useState(false)
  const [trialErr, setTrialErr] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
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
      .then((data) => {
        setStatus('success')
        // Older servers answer without a session. Then there is nobody signed
        // in to offer anything to, so fall back to the way this always worked.
        if (!data?.token) {
          setTimeout(() => navigate('/login?verified=1', { replace: true }), 1400)
          return
        }
        login(data.token, data.user)
        setOfferTrial(true)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'This link is invalid or has expired.')
      })
  }, [token, navigate, login])

  const startTrial = async () => {
    setTrialErr(''); setBusy(true)
    try {
      // Idempotent and one-per-student on the server, so a second click — or a
      // student who somehow already has a standing — cannot buy a second week.
      await api('/user/learn/trial', { method: 'POST', auth: 'user' })
      navigate(LEARN_PATH, { replace: true })
    } catch (err) {
      setTrialErr(err.message)
      setBusy(false)
    }
  }

  return (
    <section className="login-wrap">
      {offerTrial && (
        <TrialWelcome
          busy={busy}
          error={trialErr}
          onTakeIt={startTrial}
          onSkip={() => navigate('/dashboard', { replace: true })}
        />
      )}

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
            <p className="login-sub">
              {offerTrial ? 'You are signed in.' : 'Your account is active. Taking you to login…'}
            </p>
            <p className="login-notice" role="status">All set.</p>
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
