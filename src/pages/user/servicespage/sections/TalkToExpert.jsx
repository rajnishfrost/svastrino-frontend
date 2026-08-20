import { useEffect, useState } from 'react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'

/**
 * Programme page · the buying step for programmes sold after a conversation
 * rather than from a checkout page (Breakthrough). A two-year commitment needs
 * reassurance before money changes hands, so the visitor asks for a call; the
 * team calls back and sends a payment link afterwards.
 *
 * Posts to the same /user/enquiry endpoint the contact and home forms use, with
 * `source: 'expert-call'` and the programme slug attached.
 */
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

  return (
    <div className="card svc-panel svc-expert" id="talk-to-an-expert">
      <h2 className="svc-h2">Talk to an expert first</h2>
      <p className="svc-expert-lead">
        {program.name} runs for {program.duration || 'a long time'}, so we do not
        ask anyone to pay for it from a checkout page. Leave your number, talk to
        one of our mentors about where you are and what you want, and only then
        decide. If you go ahead, we send you a payment link after the call.
      </p>

      {sent ? (
        <div className="svc-expert-done">
          <strong>Thank you — we have your request.</strong>
          <p>
            One of our mentors will call you within one working day. If you would
            rather reach us first, write to us from the Contact page.
          </p>
        </div>
      ) : (
        <form className="svc-expert-form" onSubmit={submit}>
          <label>
            <span>Your name</span>
            <input value={form.name} onChange={set('name')} required maxLength={80}
                   autoComplete="name" placeholder="Full name" />
          </label>
          <label>
            <span>Phone number</span>
            <input value={form.phone} onChange={set('phone')} required maxLength={20}
                   autoComplete="tel" inputMode="tel" placeholder="10-digit mobile" />
          </label>
          <label>
            <span>Email <em>(optional)</em></span>
            <input type="email" value={form.email} onChange={set('email')} maxLength={160}
                   autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            <span>City <em>(optional)</em></span>
            <input value={form.city} onChange={set('city')} maxLength={80}
                   autoComplete="address-level2" placeholder="Where you are based" />
          </label>
          <label>
            <span>Best time to call <em>(optional)</em></span>
            <input value={form.preferredTime} onChange={set('preferredTime')} maxLength={80}
                   placeholder="e.g. weekdays after 6 pm" />
          </label>
          <label className="svc-expert-wide">
            <span>What would you like to discuss? <em>(optional)</em></span>
            <textarea value={form.message} onChange={set('message')} rows={3} maxLength={2000}
                      placeholder="Anything that would help us prepare for the call" />
          </label>

          {err && <p className="svc-expert-err" role="alert">{err}</p>}

          <div className="svc-expert-actions">
            <button type="submit" className="btn btn-accent btn-large" disabled={busy}>
              {busy ? 'Sending…' : 'Request a call back'}
            </button>
            <span className="svc-expert-note">
              No payment now. We call you within one working day.
            </span>
          </div>
        </form>
      )}
    </div>
  )
}
