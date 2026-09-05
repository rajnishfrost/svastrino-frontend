import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useGoogleAuth } from '../../../hooks/useGoogleAuth.js'
import { validatePassword } from '../../../utils/password.js'
import { TRIAL_INTENT, LEARN_PATH } from '../nirmaanpage/trialIntent.js'
import { hasPortalAccess } from '../../../utils/portalAccess.js'
import StrengthMeter from '../../../common_component/user/StrengthMeter/StrengthMeter.jsx'
import './Login.css'

/**
 * Login + Signup page.
 * - Email + Password (with show/hide eye toggle)
 * - Signup adds name, country-code + phone, and confirm-password
 * - Password strength meter (weak → fair → good → strong)
 * - All fields client-validated (regex + length caps) and sanitised (strip <, >)
 *   as a defence-in-depth layer. Backend MUST still validate independently.
 * - Google button sits at the bottom of both modes.
 * - Fully mobile-optimised (touch targets, inputmode hints, responsive layout).
 */

/* ---------- Input caps (belt-and-braces DoS + XSS surface) ---------- */
const CAP = { name: 60, email: 254, phone: 15, password: 128 }

/* ---------- Validation helpers ---------- */
const RE_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const RE_NAME  = /^[a-zA-ZÀ-ſ][a-zA-ZÀ-ſ\s'.-]{1,59}$/

// Strip characters that can smuggle HTML or scripts. Real defence lives on the
// server, but pruning at the input keeps the payload clean.
const sanitise = (s) => (s ?? '').replace(/[<>]/g, '').slice(0, 500)
const cleanDigits = (s) => (s ?? '').replace(/\D+/g, '')

export default function Login() {
  // ?mode=signup opens straight on the sign-up form (the footer's
  // "Students Registration" link uses it); anything else opens on log in.
  const [mode, setMode] = useState(
    () => (new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login')
  )                                              // 'login' | 'signup'
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')       // success/info banner
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [forgotBusy, setForgotBusy] = useState(false) // separate so it doesn't flip the Log in button
  // When set, the "check your email to verify" panel replaces the form.
  const [pendingEmail, setPendingEmail] = useState('')
  const [resent, setResent] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [name, setName] = useState('')
  // Full E.164 number incl. dial code, e.g. "+919876543210". PhoneInput manages
  // the country picker itself — every country is available out of the box.
  const [phone, setPhone] = useState('+91')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { ready: googleReady, configured: googleConfigured, signIn: googleSignIn } = useGoogleAuth()
  // Where to land afterwards. Somewhere specific if they were sent here from
  // it — /checkout?pkg=…, a course — otherwise the home page rather than the
  // dashboard: signing in is not the same as asking to see your dashboard, and
  // /dashboard immediately redirects on to its default tab, so a plain login
  // used to end on /dashboard/skill-build without anyone having asked for it.
  const from = location.state?.from || '/'

  // The flag the Nirmaan page leaves behind when a visitor pressed "Start the
  // free trial" before they had an account.
  const trialIntent = () => {
    try { return localStorage.getItem(TRIAL_INTENT) } catch { return null } // private mode
  }

  /**
   * Someone who came here to start the Nirmaan free trial.
   *
   * Sign-up does not log anyone in: it emails a verification link, and clicking
   * that link lands on a brand-new /login with none of the router state that
   * sent them here — often on a different day. So the Nirmaan page leaves a
   * flag in localStorage and this picks it up on the next successful login,
   * grants the trial, and drops them into the course instead of the dashboard.
   *
   * The grant is best-effort on purpose: if it fails (a trial already spent,
   * the network) the student still gets signed in, and the Nirmaan page will
   * tell them where they actually stand.
   */
  const landAfterLogin = async (user) => {
    if (user?.panel) return navigate('/admin', { replace: true })

    // A panel-only account cannot open anything inside the portal, so honouring
    // a `from` that points there — or starting a trial — would only walk them
    // into "no access with this account". The public site is what they have.
    if (!hasPortalAccess(user)) return navigate('/', { replace: true })

    if (!trialIntent()) return navigate(from, { replace: true })

    try { localStorage.removeItem(TRIAL_INTENT) } catch { /* already gone */ }
    try { await api('/user/learn/trial', { method: 'POST', auth: 'user' }) } catch { /* see note above */ }
    return navigate(LEARN_PATH, { replace: true })
  }


  // Surface the email-verification result the backend redirects back with
  // (…/login?verified=1|0), then strip the param so it doesn't stick around.
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === null) return
    if (verified === '1') setNotice('Email verified — you can sign in now.')
    else setError('That verification link is invalid or has expired.')
    searchParams.delete('verified')
    setSearchParams(searchParams, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- Validation ---------- */
  const validateLogin = () => {
    const errs = {}
    if (!email) errs.email = 'Email required'
    else if (!RE_EMAIL.test(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateSignup = () => {
    const errs = {}
    if (!name) errs.name = 'Name required'
    else if (!RE_NAME.test(name)) errs.name = 'Only letters, spaces, hyphens, apostrophes'

    if (!email) errs.email = 'Email required'
    else if (!RE_EMAIL.test(email)) errs.email = 'Enter a valid email address'

    // PhoneInput gives the full E.164 value (dial code + national number).
    // A valid entry needs at least ~7 national digits on top of the dial code.
    const phoneDigits = cleanDigits(phone)
    if (phoneDigits.length <= 4) errs.phone = 'Phone required'
    else if (phoneDigits.length < 8) errs.phone = 'Enter a valid phone number'

    const pwErr = validatePassword(password, name)
    if (pwErr) errs.password = pwErr

    if (!confirmPw) errs.confirmPw = 'Please confirm your password'
    else if (confirmPw !== password) errs.confirmPw = 'Passwords do not match'

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ---------- Submit handlers ---------- */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateLogin()) return
    setBusy(true)
    try {
      const data = await api('/user/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password },
      })
      login(data.token, data.user)
      // One login for everyone: panel accounts land in the admin panel, the
      // rest go to their user dashboard (or wherever they were headed).
      await landAfterLogin(data.user)
    } catch (err) {
      // Account exists but the email isn't confirmed yet — send them to the
      // "verify your email" panel with a resend option instead of a dead-end.
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setResent(false)
        setPendingEmail(email.trim().toLowerCase())
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateSignup()) return
    setBusy(true)
    try {
      await api('/user/auth/signup', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone,                                       // full E.164, e.g. "+919876543210"
          password,
        },
      })
      // No auto-login — the account is locked until the emailed link is used.
      setResent(false)
      setPendingEmail(email.trim().toLowerCase())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Re-send the verification email for the pending address.
  const handleResend = async () => {
    setError('')
    setBusy(true)
    try {
      await api('/user/auth/resend-verification', {
        method: 'POST',
        body: { email: pendingEmail },
      })
      setResent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Leave the verify panel and return to a clean login form.
  const backToLogin = () => {
    setPendingEmail('')
    setResent(false)
    setError('')
    setNotice('')
    setMode('login')
    setPassword('')
    setConfirmPw('')
  }

  const handleGoogle = async () => {
    setError('')
    setNotice('')
    if (!googleConfigured) {
      setError('Google sign-in is not configured.')
      return
    }
    setBusy(true)
    try {
      const accessToken = await googleSignIn()
      const data = await api('/user/auth/google', {
        method: 'POST',
        body: { accessToken },
      })
      login(data.token, data.user)
      // Signing up with Google skips the verification link, and with it the
      // free week that page offers. So a student who has just finished signing
      // up is handed to /welcome to be offered it — a page outside GuestRoute,
      // which would otherwise bounce them to the dashboard the moment the
      // session landed, before anything shown HERE could be seen. Not for one
      // who already said yes on the Nirmaan page: landAfterLogin grants it for
      // them, and asking again would be asking twice.
      if (data.firstSignIn && !trialIntent() && !data.user?.panel && hasPortalAccess(data.user)) {
        return navigate('/welcome', { replace: true, state: { offerTrial: true, from } })
      }
      await landAfterLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Forgot password — request a reset link. Response is intentionally generic
  // (the server never reveals whether the email exists).
  const handleForgot = async () => {
    setError('')
    setNotice('')
    setFieldErrors({}) // drop any stale login errors (e.g. a prior "Password required")
    if (!RE_EMAIL.test(email)) {
      setFieldErrors({ email: 'Enter your email first, then tap “Forgot password”' })
      return
    }
    setForgotBusy(true)
    try {
      await api('/user/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      })
      setNotice('If that account exists, a password-reset link is on its way.')
    } catch (err) {
      setError(err.message)
    } finally {
      setForgotBusy(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setNotice('')
    setFieldErrors({})
    setShowPw(false)
    setShowPw2(false)
    setConfirmPw('')
    setPendingEmail('')
    setResent(false)
  }

  return (
    <section className="login-wrap">
      <div className="card login-card">
        <h1>
          {pendingEmail
            ? 'Verify your email'
            : mode === 'login'
              ? 'Welcome back'
              : 'Create your account'}
        </h1>
        <p className="login-sub">
          {pendingEmail
            ? 'One last step to activate your account.'
            : 'One account for mentoring and courses.'}
        </p>

        {error && <p className="login-error" role="alert">{error}</p>}
        {notice && <p className="login-notice" role="status">{notice}</p>}

        {pendingEmail ? (
          <VerifyPanel
            email={pendingEmail}
            resent={resent}
            busy={busy}
            onResend={handleResend}
            onBack={backToLogin}
          />
        ) : (
        <>
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="login-form" noValidate>
            <Field label="Email" error={fieldErrors.email}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck="false"
                autoCapitalize="none"
                maxLength={CAP.email}
                value={email}
                onChange={(e) => setEmail(sanitise(e.target.value))}
                onBlur={() =>
                  // Validate ONLY the email field here — validating the whole
                  // form on blur would flash "Password required" when the user
                  // tabs/clicks away (e.g. onto "Forgot password?").
                  setFieldErrors((p) => ({
                    ...p,
                    email: !email || RE_EMAIL.test(email) ? undefined : 'Enter a valid email address',
                  }))
                }
                placeholder="you@example.com"
                aria-invalid={!!fieldErrors.email}
              />
            </Field>

            <Field label="Password" error={fieldErrors.password}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                show={showPw}
                onToggle={() => setShowPw((v) => !v)}
                autoComplete="current-password"
                maxLength={CAP.password}
                aria-invalid={!!fieldErrors.password}
              />
            </Field>

            <div className="login-forgot">
              <button type="button" className="login-link" onClick={handleForgot} disabled={busy || forgotBusy}>
                {forgotBusy ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>

            <button className="btn btn-primary" disabled={busy || forgotBusy}>
              {busy ? 'Signing in…' : 'Log in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="login-form" noValidate>
            <Field label="Full name" error={fieldErrors.name}>
              <input
                type="text"
                autoComplete="name"
                maxLength={CAP.name}
                value={name}
                onChange={(e) => setName(sanitise(e.target.value))}
                onBlur={() => setFieldErrors((p) => ({ ...p, name: undefined }))}
                placeholder="e.g. Rajnish Yadav"
                aria-invalid={!!fieldErrors.name}
              />
            </Field>

            <Field label="Email" error={fieldErrors.email}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck="false"
                autoCapitalize="none"
                maxLength={CAP.email}
                value={email}
                onChange={(e) => setEmail(sanitise(e.target.value))}
                placeholder="you@example.com"
                aria-invalid={!!fieldErrors.email}
              />
            </Field>

            <Field label="Phone" error={fieldErrors.phone}>
              <PhoneInput
                defaultCountry="in"
                value={phone}
                onChange={(value) => setPhone(value)}
                className="phone-intl"
                inputClassName="phone-intl-input"
                countrySelectorStyleProps={{ buttonClassName: 'phone-intl-btn' }}
                inputProps={{ 'aria-label': 'Phone number', 'aria-invalid': !!fieldErrors.phone }}
              />
            </Field>

            <Field label="Password" error={fieldErrors.password}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                show={showPw}
                onToggle={() => setShowPw((v) => !v)}
                autoComplete="new-password"
                maxLength={CAP.password}
                aria-invalid={!!fieldErrors.password}
              />
              <StrengthMeter pw={password} name={name} />
            </Field>

            <Field label="Confirm password" error={fieldErrors.confirmPw}>
              <PasswordInput
                value={confirmPw}
                onChange={setConfirmPw}
                show={showPw2}
                onToggle={() => setShowPw2((v) => !v)}
                autoComplete="new-password"
                maxLength={CAP.password}
                aria-invalid={!!fieldErrors.confirmPw}
              />
              {confirmPw && (
                <small className={`pw-match${confirmPw === password ? ' ok' : ''}`}>
                  {confirmPw === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                </small>
              )}
            </Field>

            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        {/* --- OR / Google button (bottom) --- */}
        <div className="login-divider"><span>or</span></div>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogle}
          disabled={busy || (googleConfigured && !googleReady)}
          title={googleConfigured ? undefined : 'Google sign-in is not configured'}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="login-foot">
          {mode === 'login' ? (
            <>
              New to Svastrino?{' '}
              <button type="button" className="login-link" onClick={() => switchMode('signup')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="login-link" onClick={() => switchMode('login')}>
                Log in
              </button>
            </>
          )}
        </p>
        </>
        )}
      </div>
    </section>
  )
}

/* ---------- Small building blocks ---------- */

// Shown after signup (or when logging into an unverified account): asks the
// user to open the verification link we emailed, with a resend fallback.
function VerifyPanel({ email, resent, busy, onResend, onBack }) {
  return (
    <div className="verify-panel">
      <div className="verify-icon" aria-hidden>
        <MailIcon />
      </div>
      <p className="verify-lead">
        We've sent a verification link to<br />
        <strong>{email}</strong>
      </p>
      <p className="verify-hint">
        Open your inbox and click the link to activate your account, then come back to log in.
      </p>

      {resent && (
        <p className="login-notice" role="status">Verification email re-sent — check your inbox.</p>
      )}

      <button type="button" className="btn btn-primary" onClick={onResend} disabled={busy}>
        {busy ? 'Sending…' : 'Resend email'}
      </button>
      <button type="button" className="login-link verify-back" onClick={onBack}>
        Back to login
      </button>

      <p className="verify-foot">
        Didn't get it? Check your spam folder, or make sure the address is correct.
      </p>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

function PasswordInput({ value, onChange, show, onToggle, autoComplete, maxLength, ...rest }) {
  return (
    <span className="password-wrap">
      <input
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        {...rest}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        onClick={onToggle}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  )
}

/* ---------- Inline SVG icons ---------- */
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M3 6.5l9 6 9-6" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.55 20.55 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.44 20.44 0 0 1-2.16 3.19"/>
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
