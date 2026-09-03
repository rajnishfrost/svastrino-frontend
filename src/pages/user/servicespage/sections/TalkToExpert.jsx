import { useEffect, useState } from 'react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'

/**
 * Program page · the buying step for programs sold after a conversation
 * rather than from a checkout page (Breakthrough). A two-year commitment needs
 * reassurance before money changes hands, so the visitor asks for a call; the
 * team calls back and sends a payment link afterwards.
 *
 * Posts to the same /user/enquiry endpoint the contact and home forms use, with
 * `source: 'expert-call'` and the program slug attached.
 */
const inputClass =
  'mt-1 block h-11 w-full rounded-lg border border-brand-navy/15 bg-white px-3.5 text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15'

export default function TalkToExpert({ program }) {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', preferredTime: '', message: '',
  })

  // Fill in what we already know, without touching anything already typed.
  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      phone: f.phone || user.phone || '',
      email: f.email || user.email || '',
    }))
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api('/user/enquiry', {
        method: 'POST',
        body: { ...form, program: program.slug, source: 'expert-call' },
      })
      setSent(true)
    } catch (ex) {
      setErr(ex.message || 'Could not send that just now — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const Label = ({ children }) => (
    <span className="text-xs font-semibold text-brand-navy">{children}</span>
  )

  return (
    <div id="talk-to-an-expert" className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <h2 className="font-display text-xl font-bold text-brand-navy">Talk to an expert first</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-slate">
        {program.name} runs for {program.duration || 'a long time'}, so we do not ask anyone to pay
        for it from a checkout page. Leave your number, talk to one of our mentors about where you
        are and what you want, and only then decide. If you go ahead, we send you a payment link
        after the call.
      </p>

      {sent ? (
        <div className="mt-6 rounded-xl border border-brand-navy/10 bg-brand-cream p-5">
          <strong className="font-semibold text-brand-navy">Thank you — we have your request.</strong>
          <p className="mt-1 text-sm text-brand-slate">
            One of our mentors will call you within one working day. If you would rather reach us
            first, write to us from the Contact page.
          </p>
        </div>
      ) : (
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label>
            <Label>Your name</Label>
            <input className={inputClass} value={form.name} onChange={set('name')} required maxLength={80} autoComplete="name" placeholder="Full name" />
          </label>
          <label>
            <Label>Phone number</Label>
            <input className={inputClass} value={form.phone} onChange={set('phone')} required maxLength={20} autoComplete="tel" inputMode="tel" placeholder="10-digit mobile" />
          </label>
          <label>
            <Label>Email <em className="font-normal not-italic text-brand-slate">(optional)</em></Label>
            <input className={inputClass} type="email" value={form.email} onChange={set('email')} maxLength={160} autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            <Label>City <em className="font-normal not-italic text-brand-slate">(optional)</em></Label>
            <input className={inputClass} value={form.city} onChange={set('city')} maxLength={80} autoComplete="address-level2" placeholder="Where you are based" />
          </label>
          <label className="sm:col-span-2">
            <Label>Best time to call <em className="font-normal not-italic text-brand-slate">(optional)</em></Label>
            <input className={inputClass} value={form.preferredTime} onChange={set('preferredTime')} maxLength={80} placeholder="e.g. weekdays after 6 pm" />
          </label>
          <label className="sm:col-span-2">
            <Label>What would you like to discuss? <em className="font-normal not-italic text-brand-slate">(optional)</em></Label>
            <textarea className={`${inputClass} h-auto py-2.5`} value={form.message} onChange={set('message')} rows={3} maxLength={2000} placeholder="Anything that would help us prepare for the call" />
          </label>

          {err && <p className="text-sm text-red-600 sm:col-span-2" role="alert">{err}</p>}

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
  )
}
