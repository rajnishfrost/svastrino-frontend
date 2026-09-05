import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Rocket } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { TRIAL_INTENT, LEARN_PATH } from '../trialIntent.js'
import { useEffect, useState } from 'react'
import { api, tokenStore } from '../../../../api/client.js'

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

/**
 * Shown in place of the wording while a signed-in visitor's standing is on its
 * way. The card, its ribbon and the tree stay put, so nothing moves when the
 * real words arrive — only this quiet block is replaced.
 */
function Waiting() {
  return (
    <div className="animate-pulse" aria-hidden>
      <span className="mt-5 inline-block h-6 w-40 rounded-full bg-nirmaan-cream" />
      <div className="mx-auto mt-4 h-9 w-4/5 max-w-md rounded-lg bg-nirmaan-cream sm:h-10" />
      <div className="mx-auto mt-4 h-4 w-full max-w-xl rounded bg-nirmaan-cream/80" />
      <div className="mx-auto mt-2 h-4 w-2/3 max-w-lg rounded bg-nirmaan-cream/80" />
      <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-2.5">
        <span className="h-7 w-24 rounded-full bg-nirmaan-cream" />
        <span className="h-7 w-32 rounded-full bg-nirmaan-cream" />
        <span className="h-7 w-28 rounded-full bg-nirmaan-cream" />
      </div>
      <div className="mx-auto mt-7 h-12 w-64 rounded-lg bg-nirmaan-cream" />
    </div>
  )
}

export default function FreeTrial() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // undefined = not looked up yet; null = nothing on file, offer the trial.
  // The two must stay apart. While they were both `null`, a signed-in student
  // was shown "Register for 1 week Free Trial" for as long as the request took
  // — the wrong answer, on screen, to someone who had already paid.
  const [standing, setStanding] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // No session at all: nobody to have a standing, and the offer is the right
    // answer. Decided on the token because it is in storage — `user` alone
    // cannot tell "signed out" from "profile still on its way", and reading it
    // as the former is what put the trial offer in front of paying students.
    if (!tokenStore.get()) { setStanding(null); return undefined }
    setStanding(undefined) // signed in, or still finding out — unknown until it answers
    if (!user) return undefined // wait for the profile; this effect re-runs with it
    let live = true
    api('/user/learn/trial', { auth: 'user' })
      .then((d) => { if (live) setStanding(d) })
      .catch(() => { if (live) setStanding({ state: 'none' }) }) // offer it; the server decides
    return () => { live = false }
  }, [user])

  const startTrial = async () => {
    setError(''); setBusy(true)
    try {
      // Idempotent on the server: a student who already has a standing gets
      // that standing back rather than a second week. Only a live course is
      // worth walking into; anything else is shown here instead.
      const r = await api('/user/learn/trial', { method: 'POST', auth: 'user' })
      if (r.state === 'trial' || r.state === 'owned') return navigate(LEARN_PATH)
      setStanding(r)
      setBusy(false)
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

  // A visitor with a session whose standing has not come back yet. We do not
  // know which of four things to say, so we say none of them.
  //
  // Keyed on the TOKEN, not on `user`: the profile is fetched, so on a fresh
  // load (or after site data is cleared) `user` is null for a moment even
  // though a session exists — long enough to show a paying student the
  // trial offer. The token is in storage, so it is known on the first frame.
  const unknown = !!tokenStore.get() && standing === undefined

  const state = standing?.state || null
  const daysLeft = standing?.daysLeft ?? null
  const learning = state === 'trial' || state === 'owned'
  const spent = state === 'used' || state === 'expired'

  // No '→' in any cta: the button renders its own ArrowRight, and two of these
  // strings used to carry one as well — which read as "Continue your course → →".
  const copy = learning
    ? {
        head: 'Your course is waiting',
        body: 'Pick up where you left off — the next video and today’s tasks are ready for you.',
        cta: 'Continue your course',
        onClick: () => navigate(LEARN_PATH),
      }
    : spent
      ? {
          head: 'Your free week is over',
          body: 'Everything you wrote is saved. Pick a package and you carry on from Week 2, with the other 23 weeks and all their tasks.',
          cta: 'See the packages',
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

  // The ribbon and the chips change with the person too. "Free · 1-week trial"
  // over a paying student's card would be a lie, and "No payment now" over a
  // spent trial is the one thing that is no longer true.
  const ribbon = state === 'trial'
    ? `Free trial · ${daysLeft == null ? 'this week' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}`
    : state === 'owned' ? 'Your course'
      : spent ? 'Free week over'
        : 'Free · 1-week trial'
  const chips = state === 'trial'
    ? ['Introduction + Week 1 open', 'Real videos & tasks', 'Everything you write is saved']
    : state === 'owned' ? ['Your progress is saved', 'Pick up any time']
      : spent ? ['Your answers are kept', 'Carry on from Week 2', 'Every package has all 24 weeks']
        : ['1 full week', 'Real videos & tasks', 'No payment now']

  return (
    <section id="free-trial" className="bg-nirmaan-cream/50 py-16 md:py-20">
      <div className="container">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-nirmaan-cream-dark bg-white p-8 text-center shadow-[0_18px_44px_-16px_rgba(59,40,34,0.28)] md:p-12">
          {/* Branded accent ribbon along the top edge. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-nirmaan-green via-nirmaan-green-light to-nirmaan-olive" />
          {/* Soft brand glows for depth (kept behind the content). */}
          <span aria-hidden className="pointer-events-none absolute -left-24 top-6 size-64 rounded-full bg-nirmaan-green/25 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 size-64 rounded-full bg-nirmaan-olive/25 blur-3xl" />

          <div className="relative">
            {/* Nirmaan mark */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-nirmaan-cream shadow-inner ring-1 ring-nirmaan-sand">
              <img src="/nirmaan-tree.png" alt="" aria-hidden className="h-full w-full object-contain p-2" />
            </div>

            {unknown ? <Waiting /> : (
              <>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-nirmaan-brown px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              <Rocket className="size-3.5" /> {ribbon}
            </span>

            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
              {copy.head}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-nirmaan-brown-soft">{copy.body}</p>

            {/* Quick value chips */}
            <ul className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2.5">
              {chips.map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-nirmaan-sand bg-nirmaan-cream/60 px-3 py-1.5 text-xs font-medium text-nirmaan-brown"
                >
                  <Check className="size-3.5 text-nirmaan-green" /> {t}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={copy.onClick}
              disabled={busy}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-nirmaan-green-dark disabled:cursor-wait disabled:opacity-70"
            >
              {copy.cta} <ArrowRight className="size-4" />
            </button>
            {error && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
            {!user && (
              <p className="mt-3 text-sm text-nirmaan-brown-soft">
                You’ll create your account first — the trial starts straight after.
              </p>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
