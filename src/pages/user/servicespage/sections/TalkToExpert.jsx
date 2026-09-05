import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'
import {
  useEnquiryForm, EnquiryField, EnquiryContactField,
} from '../../../../common_component/user/EnquiryFields/EnquiryFields.jsx'

/**
 * Program page · the buying step for programs sold after a conversation rather
 * than from a checkout page (Breakthrough). A two-year commitment needs
 * reassurance before money changes hands, so the visitor asks for a call; the
 * team calls back and sends a payment link afterwards.
 *
 * This is NOT only a lead form — it is one step of a state machine the checkout
 * enforces (payments.service refuses the program until the enquiry is
 * 'approved'):
 *
 *   nothing → new → contacted → approved → they may enrol
 *
 * So a signed-in visitor who has already asked is shown WHERE THEY STAND rather
 * than another empty form. Showing the form again has them send the same request
 * twice — the team then holds duplicate rows for one person with no way to tell
 * which to approve — and, worse, someone already cleared to pay would be reading
 * a form instead of being shown the way in.
 *
 * Signed-out visitors still get the form. There is no dependable way to know what
 * a signed-out browser sent before, and guessing wrong would shut a genuine new
 * caller out of the only route this program has.
 */
const EXTRA = { preferredTime: 'when we should call' }

const onDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function TalkToExpert({ program }) {
  const { user } = useAuth()
  const { values, errors, set, check, masked, hideable, toggle, formRef } = useEnquiryForm(user, {
    preferredTime: '',
  })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // undefined = not looked up yet; null = nothing on file, show the form. The
  // form is held back while this is unknown so a returning caller never sees a
  // blank form flash before their status replaces it.
  const [standing, setStanding] = useState(undefined)

  useEffect(() => {
    if (!user) { setStanding(null); return undefined }
    let live = true
    api(`/user/enquiry/mine?source=expert-call&program=${encodeURIComponent(program.slug)}`, { auth: 'user' })
      .then((d) => { if (live) setStanding(d.enquiry || null) })
      .catch(() => { if (live) setStanding(null) }) // show the form; the server still decides
    return () => { live = false }
  }, [user, program.slug])

  const submit = async (e) => {
    e.preventDefault()
    if (!check(EXTRA)) return
    setErr(''); setBusy(true)
    try {
      await api('/user/enquiry', {
        method: 'POST',
        auth: user ? 'user' : false,
        body: { ...values, program: program.slug, source: 'expert-call' },
      })
      setSent(true)
    } catch (ex) {
      setErr(ex.message || 'Could not send that just now — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const bookHref = program.bookingSku ? `/book-online?program=${program.bookingSku}` : '/book-online'
  const approved = standing?.status === 'approved'
  const waiting = !!standing && !approved

  /**
   * The status card. Tinted and marked rather than plain, because this replaces
   * a form: someone who filled one in and came back needs to SEE that it landed
   * and that an answer is coming, not read a paragraph and wonder.
   */
  const Panel = ({ children }) => (
    <div className="mt-6 rounded-xl border border-brand-crimson/20 bg-brand-rose p-5">{children}</div>
  )

  /**
   * Where they are along a process they cannot otherwise see. The three steps
   * are the enquiry's own states (new -> contacted -> approved), so the card can
   * never claim progress the checkout would disagree with.
   */
  const Steps = ({ status }) => {
    const done = [true, status === 'contacted' || status === 'approved', status === 'approved']
    const labels = ['Request sent', 'Mentor calls you', 'Enrol']
    return (
      <ol className="mt-4 flex items-center gap-2">
        {labels.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 ${i < labels.length - 1 ? 'flex-1' : ''}`}>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                done[i] ? 'bg-brand-crimson text-white' : 'border border-brand-navy/20 bg-white text-brand-slate'
              }`}
            >
              {done[i] ? '\u2713' : i + 1}
            </span>
            <span className={`whitespace-nowrap text-xs ${done[i] ? 'font-semibold text-brand-navy' : 'text-brand-slate'}`}>
              {label}
            </span>
            {i < labels.length - 1 && (
              <span className={`h-px flex-1 ${done[i + 1] ? 'bg-brand-crimson' : 'bg-brand-navy/15'}`} />
            )}
          </li>
        ))}
      </ol>
    )
  }

  const Submitted = ({ heading, when }) => (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-crimson" />
      <div>
        <strong className="block font-display text-base font-bold text-brand-navy">{heading}</strong>
        {when && <span className="text-xs text-brand-slate">Sent on {when}</span>}
      </div>
    </div>
  )

  return (
    <section
      id="talk-to-an-expert"
      // Jumping to this anchor (from the All Services card or the hero CTA) aligns
      // the section top to y=0 — but the sticky navbar would then cover the
      // heading. Offset the scroll by the nav height (+ the offline bar when shown)
      // and a little breathing room, so the heading lands just below the navbar.
      style={{ scrollMarginTop: 'calc(var(--nav-height, 68px) + var(--offline-h, 0px) + 1.25rem)' }}
      className="bg-soft py-14 md:py-16"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <h2 className="font-display text-xl font-bold text-brand-navy">
        {approved ? `You're cleared to start ${program.name}` : 'Talk to an expert first'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-slate">
        {approved
          ? 'Your call is done and our team has cleared you to enrol. Pick a slot whenever you are ready — nothing is pending at your end.'
          : `${program.name} runs for ${program.duration || 'a long time'}, so we do not ask anyone to pay for it from a checkout page. Leave your number, talk to one of our mentors about where you are and what you want, and only then decide. If you go ahead, we send you a payment link after the call.`}
      </p>

      {/* Just sent, this visit. */}
      {sent && (
        <Panel>
          <Submitted heading="Request submitted" when={onDate(new Date())} />
          <Steps status="new" />
          <p className="mt-4 text-sm leading-relaxed text-brand-slate">
            One of our mentors will call you within one working day. We have emailed you a
            confirmation too — there is nothing more to do at your end.
          </p>
        </Panel>
      )}

      {/* Cleared to buy — the thing they came back for. */}
      {!sent && approved && (
        <Panel>
          <Submitted heading="Approved after your call" when={onDate(standing.createdAt)} />
          <Steps status="approved" />
          <Link
            to={bookHref}
            className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white no-underline transition-colors hover:bg-brand-crimson-dark"
          >
            Enrol in {program.name}
          </Link>
        </Panel>
      )}

      {/* Already asked, still in the queue. */}
      {!sent && waiting && (
        <Panel>
          <Submitted
            heading={standing.status === 'contacted'
              ? 'We have spoken — your request is with our team'
              : 'Request submitted'}
            when={onDate(standing.createdAt)}
          />
          <Steps status={standing.status} />
          <p className="mt-4 text-sm leading-relaxed text-brand-slate">
            {standing.status === 'contacted'
              ? 'Once the team confirms, enrolling opens up right here on this page — we will email you as soon as it does.'
              : 'A mentor will call you within one working day. There is nothing more to do at your end.'}
          </p>
          <p className="mt-3 text-xs text-brand-slate">
            Need to change something, or not heard from us?{' '}
            <Link to="/contact" className="font-semibold text-brand-crimson">Tell us here</Link>{' '}
            rather than sending the request again.
          </p>
        </Panel>
      )}

      {/* Nothing on file → the form. */}
      {!sent && standing === null && (
        // noValidate: our own per-field messages, not the browser's one-at-a-time bubbles.
        <form ref={formRef} onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <EnquiryField
            className="sm:col-span-2"
            name="name" label="Name" placeholder="Full name" autoComplete="name" maxLength={80}
            value={values.name} onChange={set('name')} error={errors.name}
          />

          {/* Email and phone share a row here exactly as they do on the home
              banner, so the two forms read as the same form. */}
          <EnquiryContactField
            className="min-w-0"
            kind="email" label="Email" value={values.email} onChange={set('email')}
            error={errors.email} masked={masked.email}
            hideable={hideable.email} onToggle={() => toggle('email')}
          />
          <EnquiryContactField
            className="min-w-0"
            kind="phone" label="Phone number" value={values.phone} onChange={set('phone')}
            error={errors.phone} masked={masked.phone}
            hideable={hideable.phone} onToggle={() => toggle('phone')}
          />

          <EnquiryField
            className="sm:col-span-2"
            name="city" label="Location" placeholder="City / Town / Village Name"
            autoComplete="address-level2" maxLength={80}
            value={values.city} onChange={set('city')} error={errors.city}
          />

          <EnquiryField
            className="sm:col-span-2"
            name="preferredTime" label="Best time to call" maxLength={80}
            placeholder="e.g. weekdays after 6 pm"
            value={values.preferredTime} onChange={set('preferredTime')} error={errors.preferredTime}
          />

          <EnquiryField
            className="sm:col-span-2"
            name="message" label="What would you like to discuss?" rows={3} maxLength={2000}
            placeholder="Anything that would help us prepare for the call"
            value={values.message} onChange={set('message')} error={errors.message}
          />

          {err && <p className="text-sm text-brand-crimson sm:col-span-2" role="alert">{err}</p>}

          <div className="flex flex-col items-start gap-2 sm:col-span-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-lg border-0 bg-brand-crimson px-8 text-base font-semibold text-white transition-colors hover:bg-brand-crimson-dark disabled:opacity-60"
            >
              {busy ? 'Sending…' : 'Request a call back'}
            </button>
            <span className="text-xs text-brand-slate">No payment now. We call you within one working day.</span>
          </div>
        </form>
      )}
        </div>
      </div>
    </section>
  )
}
