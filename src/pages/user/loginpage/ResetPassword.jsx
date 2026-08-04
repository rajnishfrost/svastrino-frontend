import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { validatePassword } from '../../../utils/password.js'
import StrengthMeter from '../../../common_component/user/StrengthMeter/StrengthMeter.jsx'
import './Login.css'

/**
 * Password-reset completion page. Reached via the emailed link:
 *   /reset-password?token=<raw-token>
 * The token is verified server-side; on success the user is logged straight in.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  // Whose account this token resets — used to show the email and to feed the
  // name/email into the strength check so "1@Rajnish"-style passwords read weak.
  const [account, setAccount] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Look up the account for this token (name + email) so the meter can flag
  // name/email-based passwords. Silent failure — the server re-validates anyway.
  useEffect(() => {
    if (!token) return
    api(`/user/auth/reset-info?token=${encodeURIComponent(token)}`)
      .then((info) => setAccount(info))
      .catch(() => setAccount(null))
  }, [token])

  // Personal terms the password must not contain (name + email local part).
  const personal = account ? `${account.name || ''} ${(account.email || '').split('@')[0]}` : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // Same policy as signup / settings, including the name/email check.
    const pwErr = validatePassword(password, personal)
    if (pwErr) return setError(pwErr)
    if (password !== confirm) return setError('Passwords do not match')

    setBusy(true)
    try {
      const data = await api('/user/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      })
      login(data.token, data.user)
      setDone(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="login-wrap">
      <div className="card login-card">
        <h1 className="login-title">Reset password</h1>
        <p className="login-sub">
          {account?.email ? <>Choose a new password for <strong>{account.email}</strong>.</> : 'Choose a new password for your account.'}
        </p>

        {error && <p className="login-error" role="alert">{error}</p>}
        {done && <p className="login-notice" role="status">Password updated — taking you to your dashboard…</p>}

        {!token ? (
          <p className="login-error" role="alert">
            This reset link is missing its token. Please request a new one from the{' '}
            <Link to="/login" className="login-link">login page</Link>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="field">
              <label className="field-label">New password</label>
              <div className="password-wrap">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button type="button" className="password-toggle" onClick={() => setShow((v) => !v)}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
              <StrengthMeter pw={password} name={personal} />
            </div>

            <div className="field">
              <label className="field-label">Confirm new password</label>
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
              />
              {confirm && (
                <small className={`pw-match${confirm === password ? ' ok' : ''}`}>
                  {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                </small>
              )}
            </div>

            <button className="btn btn-primary" disabled={busy || done}>
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <p className="login-foot">
          <Link to="/login" className="login-link">Back to login</Link>
        </p>
      </div>
    </section>
  )
}
