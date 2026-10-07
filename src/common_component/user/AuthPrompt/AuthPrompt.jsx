import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { hasPortalAccess, homeFor } from '../../../utils/portalAccess.js'
import { clearReturn } from '../../../utils/afterAuth.js'
import AuthForm from '../AuthForm/AuthForm.jsx'
import './AuthPrompt.css'

/**
 * The sign-in pop-up. A signed-out visitor who goes to buy something — a
 * Nirmaan plan, the psychometric test, a mentoring programme — is asked to sign
 * up or log in right where they are, instead of being sent off to /login and
 * having to find their way back.
 *
 *   const prompt = useAuthPrompt()
 *   prompt({ returnTo: '/checkout?pkg=…', reason: 'to buy Nirmaan' })
 *   prompt({ onDone: () => setStep('details') })   // stay on the page
 *
 * Signed in with a password or Google, it closes and carries on: `onDone` if
 * given, else to `returnTo`. An email sign-up has to wait for its verification
 * link; `returnTo` is remembered for that (afterAuth.js), so the first sign-in
 * after verifying lands there.
 */
const AuthPromptContext = createContext(() => {})

export const useAuthPrompt = () => useContext(AuthPromptContext)

export function AuthPromptProvider({ children }) {
  const [req, setReq] = useState(null) // { returnTo, onDone, reason, mode }
  const navigate = useNavigate()
  const { user } = useAuth()

  const prompt = useCallback((opts = {}) => setReq({ mode: 'signup', ...opts }), [])
  const close = useCallback(() => setReq(null), [])

  // Escape closes it; the page behind does not scroll while it is open.
  useEffect(() => {
    if (!req) return undefined
    const onKey = (e) => { if (e.key === 'Escape') close() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [req, close])

  // Signed in some other way while it was open (another tab): nothing to ask.
  useEffect(() => { if (req && user) setReq(null) }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const onAuthed = async (data) => {
    const r = req
    setReq(null)
    clearReturn() // signed in now; nothing left to come back to later
    // A panel or institution account has no business in the student checkout.
    const home = homeFor(data.user)
    if (home) return navigate(home)
    if (!hasPortalAccess(data.user)) return navigate('/')
    if (r?.onDone) return r.onDone(data.user)
    if (r?.returnTo) return navigate(r.returnTo)
    return undefined
  }

  return (
    <AuthPromptContext.Provider value={prompt}>
      {children}
      {req && createPortal(
        <div className="authp" role="dialog" aria-modal="true" aria-label="Sign in to continue" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="authp-card">
            <button type="button" className="authp-close" onClick={close} aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
            <p className="authp-reason">
              {req.reason ? `Sign in ${req.reason}` : 'Sign in to continue'}
            </p>
            <AuthForm
              key={req.mode}
              initialMode={req.mode}
              titleAs="h2"
              compact
              returnTo={req.returnTo}
              onAuthed={onAuthed}
            />
          </div>
        </div>,
        document.body,
      )}
    </AuthPromptContext.Provider>
  )
}

/**
 * A link that needs an account. Signed in, it is an ordinary link. Signed
 * out, it opens the sign-in pop-up and goes on to `to` once they are in.
 */
export function AuthLink({ to, reason, onClick, ...rest }) {
  const { user } = useAuth()
  const prompt = useAuthPrompt()
  return (
    <Link
      to={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || user) return
        e.preventDefault()
        prompt({ returnTo: to, reason })
      }}
      {...rest}
    />
  )
}
