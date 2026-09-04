import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Rocket } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { TRIAL_INTENT, LEARN_PATH } from '../trialIntent.js'
import { useEffect, useState } from 'react'
import { api } from '../../../../api/client.js'

/**
 * Nirmaan · the 1-week free trial — the step between watching a preview and
 * paying. What a visitor gets is the real course for a week: the introduction
 * and Week 1, the real videos, the real daily tasks, on the real schedule.
 *
 * The section answers differently to three different people, because "Register
 * for 1 week Free Trial" is only true for one of them:
 *
 *   signed out          → register; the trial starts once they are in.
 *   signed in, no trial → start it here and land straight in the course.
 *   already learning    → nothing to sell; take them back to where they were.
 *
 * The signed-out path cannot simply pass a redirect along, because sign-up does
 * not log anyone in — see trialIntent.js for how the wish survives that gap.
 */

export default function FreeTrial() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // null = not asked yet (signed out, or still loading). Everything renders the
  // signed-out wording until we know better, so the section never flickers
  // through a state that is wrong for the person reading it.
  const [standing, setStanding] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { setStanding(null); return undefined }
    let live = true
    api('/user/learn/trial', { auth: 'user' })
      .then((d) => { if (live) setStanding(d.state) })
      .catch(() => { if (live) setStanding('none') }) // offer it; the server decides
    return () => { live = false }
  }, [user])

  const startTrial = async () => {
    setError(''); setBusy(true)
    try {
      await api('/user/learn/trial', { method: 'POST', auth: 'user' })
      navigate(LEARN_PATH)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const goRegister = () => {
    // Remembered rather than passed: see trialIntent.js.
    try { localStorage.setItem(TRIAL_INTENT, '1') } catch { /* private mode — they can still start it from here */ }
    navigate('/login?mode=signup', { state: { from: LEARN_PATH } })
  }

  const learning = standing === 'trial' || standing === 'owned'
  const spent = standing === 'used' || standing === 'expired'

  const copy = learning
    ? {
        head: 'Your course is waiting',
        body: 'Pick up where you left off — the next video and today’s tasks are ready for you.',
        cta: 'Continue your course →',
        onClick: () => navigate(LEARN_PATH),
      }
    : spent
      ? {
          head: 'Your free week is over',
          body: 'Everything you wrote is saved. Pick a package and you carry on from Week 2, with the other 23 weeks and all their tasks.',
          cta: 'See the packages →',
          onClick: () => navigate('/skill-build/nirmaan#packages'),
        }
      : user
        ? {
            head: 'Liked the Glimpse but Still Unsure?',
            body: 'Start your 1-week free trial and experience the journey for yourself — the real videos, the real daily tasks, and the actual feel of the course.',
            cta: busy ? 'Starting…' : 'Start your 1 week Free Trial',
            onClick: startTrial,
          }
        : {
            head: 'Liked the Glimpse but Still Unsure?',
            body: 'Start your 1-week free trial and experience the journey for yourself — the real videos, the real daily tasks, and the actual feel of the course.',
            cta: 'Register for 1 week Free Trial',
            onClick: goRegister,
          }

  return (
    <section id="free-trial" className="bg-nirmaan-cream/50 py-16 md:py-20">
      <div className="container">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-white p-8 text-center shadow-sm md:p-12">
          {/* Branded accent ribbon along the top edge. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-nirmaan-green via-nirmaan-green-light to-nirmaan-olive" />
          {/* Soft brand glows for depth (kept behind the content). */}
          <span aria-hidden className="pointer-events-none absolute -left-24 top-6 size-56 rounded-full bg-nirmaan-green/10 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full bg-nirmaan-olive/10 blur-3xl" />

          <div className="relative">
            {/* Nirmaan mark */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-nirmaan-cream shadow-inner ring-1 ring-nirmaan-sand">
              <img src="/nirmaan-tree.png" alt="" aria-hidden className="h-full w-full object-contain p-2" />
            </div>

            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-nirmaan-brown px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              <Rocket className="size-3.5" /> Free · 1-week trial
            </span>

            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
              Liked the Glimpse but Still Unsure?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-nirmaan-brown-soft">
              Start your 1-week free trial and experience the journey for yourself — the real videos,
              the real daily tasks, and the actual feel of the course.
            </p>

            {/* Quick value chips */}
            <ul className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2.5">
              {['1 full week', 'Real videos & tasks', 'No payment now'].map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-nirmaan-sand bg-nirmaan-cream/60 px-3 py-1.5 text-xs font-medium text-nirmaan-brown"
                >
                  <Check className="size-3.5 text-nirmaan-green" /> {t}
                </li>
              ))}
            </ul>

            <Link
              to={user ? '/checkout?pkg=nirmaan-payu&trial=1' : '/login?mode=signup'}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark"
            >
              Register for 1 week Free Trial <ArrowRight className="size-4" />
            </Link>
            {!user && (
              <p className="mt-3 text-sm text-nirmaan-brown-soft">
                You’ll create your account first — the trial starts straight after.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
