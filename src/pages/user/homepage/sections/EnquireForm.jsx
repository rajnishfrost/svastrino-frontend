import { useEffect, useState } from 'react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'

/**
 * Home · section 1 (inside the banner) — "Enquire With Us!".
 * A low-commitment way in for a visitor who is not ready to pick a service.
 * Posts to /user/enquiry, the same endpoint the Contact page uses; `source`
 * tells the team which form it came from.
 */
const CLASSES = ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduate', 'Other']

export default function EnquireForm() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', studentClass: '', city: '', message: '' })

  // Fill in what we already know about a signed-in visitor, without touching
  // anything they have started typing.
  useEffect(() => {
    if (!user) return
    setForm((f) => ({ ...f, name: f.name || user.name || '', phone: f.phone || user.phone || '' }))
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api('/user/enquiry', {
        method: 'POST',
        body: { ...form, email: user?.email || form.email || '', source: 'home' },
      })
      setSent(true)
    } catch (ex) {
      setErr(ex.message || 'Could not send that just now — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="home-hero-card">
      <h2 className="home-enquire-title">Enquire With Us!</h2>
      <p className="home-enquire-sub">
        Not sure what to do next? Tell us a little about where you are, and we’ll help you
        figure out the right next step.
      </p>

      {sent ? (
        <p className="home-enquire-done">
          Thank you — we have your details and will get back to you shortly.
        </p>
      ) : (
        <form className="home-enquire-form" onSubmit={submit}>
          <label>
            <span>Your name</span>
            <input type="text" name="name" required autoComplete="name" placeholder="Your name"
                   value={form.name} onChange={set('name')} />
          </label>

          <label>
            <span>Phone number</span>
            <div className="home-enquire-phone">
              <span className="home-enquire-cc">+91</span>
              <input
                type="tel" name="phone" required inputMode="numeric" autoComplete="tel"
                pattern="[0-9]{10}" maxLength={10} placeholder="10-digit number"
                value={form.phone} onChange={set('phone')}
              />
            </div>
          </label>

          <div className="home-enquire-row">
            <label>
              <span>Your class</span>
              <select name="studentClass" required value={form.studentClass} onChange={set('studentClass')}>
                <option value="" disabled>Select</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label>
              <span>City</span>
              <input type="text" name="city" required placeholder="Your city"
                     value={form.city} onChange={set('city')} />
            </label>
          </div>

          <label>
            <span>What do you need help with?</span>
            <textarea name="message" rows="2" placeholder="Tell us in a line or two"
                      value={form.message} onChange={set('message')} />
          </label>

          {err && <p className="home-enquire-error">{err}</p>}
          <button type="submit" className="btn btn-accent home-enquire-submit" disabled={busy}>
            {busy ? 'Sending…' : 'Enquire Now →'}
          </button>
        </form>
      )}
    </div>
  )
}
