import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { TRIAL_INTENT, LEARN_PATH } from '../nirmaanpage/trialIntent.js'
import { hasPortalAccess, homeFor } from '../../../utils/portalAccess.js'
import { takeReturn } from '../../../utils/afterAuth.js'
import AuthForm from '../../../common_component/user/AuthForm/AuthForm.jsx'
import './Login.css'

/**
 * Login + Signup page. The form itself is AuthForm (shared with the sign-in
 * pop-up); this page decides where a visitor goes once they are in.
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // ?mode=signup opens straight on the sign-up form (the footer's
  // "Students Registration" link uses it); anything else opens on log in.
  const [initialMode] = useState(() => (searchParams.get('mode') === 'signup' ? 'signup' : 'login'))

  // The email-verification result the backend redirects back with
  // (…/login?verified=1|0). Read once, then stripped so it doesn't stick around.
  const [verified] = useState(() => searchParams.get('verified'))
  useEffect(() => {
    if (verified === null) return
    searchParams.delete('verified')
    setSearchParams(searchParams, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Where to land afterwards. Somewhere specific if they were sent here from
  // it — /checkout?pkg=…, a course — otherwise the dashboard, which opens on
  // the section for what they own (Skill-Build for Nirmaan or a free trial,
  // Services for a Svastrino programme). See the no-tab rule in Dashboard.jsx.
  const sentFrom = location.state?.from || null

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
   * The same goes for a visitor who began signing up on the way to buying
   * something (afterAuth.js): they are taken back to it.
   *
   * The grant is best-effort on purpose: if it fails (a trial already spent,
   * the network) the student still gets signed in, and the Nirmaan page will
   * tell them where they actually stand.
   */
  const landAfterLogin = async (user, from) => {
    // Admin panel, or an institution's own portal — never the student side.
    const home = homeFor(user)
    if (home) return navigate(home, { replace: true })

    // A panel-only account cannot open anything inside the portal, so honouring
    // a `from` that points there — or starting a trial — would only walk them
    // into "no access with this account". The public site is what they have.
    if (!hasPortalAccess(user)) return navigate('/', { replace: true })

    if (!trialIntent()) return navigate(from, { replace: true })

    try { localStorage.removeItem(TRIAL_INTENT) } catch { /* already gone */ }
    try { await api('/user/learn/trial', { method: 'POST', auth: 'user' }) } catch { /* see note above */ }
    return navigate(LEARN_PATH, { replace: true })
  }

  const onAuthed = async (data, { method }) => {
    const from = sentFrom || takeReturn() || '/dashboard'
    // Signing up with Google skips the verification link, and with it the
    // free week that page offers. So a student who has just finished signing
    // up is handed to /welcome to be offered it — a page outside GuestRoute,
    // which would otherwise bounce them to the dashboard the moment the
    // session landed, before anything shown HERE could be seen. Not for one
    // who already said yes on the Nirmaan page: landAfterLogin grants it for
    // them, and asking again would be asking twice.
    if (method === 'google' && data.firstSignIn && !trialIntent() && !data.user?.panel && hasPortalAccess(data.user)) {
      return navigate('/welcome', { replace: true, state: { offerTrial: true, from } })
    }
    // One login for everyone: panel accounts land in the admin panel, the
    // rest go to their user dashboard (or wherever they were headed).
    return landAfterLogin(data.user, from)
  }

  return (
    <section className="login-wrap">
      <div className="card login-card">
        <AuthForm
          initialMode={initialMode}
          initialNotice={verified === '1' ? 'Email verified — you can sign in now.' : ''}
          initialError={verified !== null && verified !== '1' ? 'That verification link is invalid or has expired.' : ''}
          returnTo={sentFrom || undefined}
          onAuthed={onAuthed}
        />
      </div>
    </section>
  )
}
