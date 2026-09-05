import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { LEARN_PATH } from '../nirmaanpage/trialIntent.js'
import TrialWelcome from './TrialWelcome.jsx'
import './Login.css'

/**
 * The free-week offer for a student who has just signed up through Google.
 *
 * It cannot be shown on /login: that route sits inside GuestRoute, which sends
 * anyone signed in to the dashboard the moment the session lands — before a
 * modal rendered there is ever seen. So Login signs them in and comes here
 * instead, the way the emailed link lands on /verify-email: a page with no
 * guest guard, where the account is already signed in and the offer is the
 * only thing left to answer.
 *
 * Reached only by that hand-off (router state). A typed URL or a refresh just
 * goes home, so nobody is offered a free week at random — and the server
 * would refuse a second one anyway.
 */
export default function Welcome() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const offered = !!state?.offerTrial
  const from = state?.from || '/'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) navigate('/login', { replace: true })
    else if (!offered) navigate('/', { replace: true })
  }, [loading, user, offered, navigate])

  const startTrial = async () => {
    setError('')
    setBusy(true)
    try {
      // Idempotent and one-per-student on the server, so a second click cannot
      // buy a second free week.
      await api('/user/learn/trial', { method: 'POST', auth: 'user' })
      navigate(LEARN_PATH, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (loading || !user || !offered) return null

  return (
    <section className="login-wrap">
      <TrialWelcome
        busy={busy}
        error={error}
        lead="Your Google account is all set and you are signed in."
        onTakeIt={startTrial}
        onSkip={() => navigate(from, { replace: true })}
      />
      <div className="card login-card">
        <h1>You're in ✓</h1>
        <p className="login-sub">Your account is ready.</p>
      </div>
    </section>
  )
}
