import { useEffect, useState } from 'react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import { api } from '../../../api/client.js'
import './Contact.css'

// Real contact details from the Svastrino site. Static on purpose — offices and
// handles change rarely, so there's no value in a DB round-trip for them.
const PHONE = '+91 99877 77016'
const PHONE_HREF = '+919987777016'
const EMAIL = 'contact@svastrino.com'

const OFFICES = [
  {
    label: 'Registered office',
    lines: ['401, Oasis Heritage Soc., near TMC', 'Panchpakhadi, Thane', 'Maharashtra 400602'],
  },
  {
    label: 'Dharamshala',
    lines: ['House No. 1, Kailash Colony, Tapovan Road', 'Near Vidhan Sabha, Sidhbadi', 'Dharamshala, Himachal Pradesh 176057'],
  },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/svastrino/' },
  { label: 'LinkedIn', href: 'https://in.linkedin.com/company/svastrino' },
  { label: 'Facebook', href: 'https://www.facebook.com/svastrino' },
  { label: 'YouTube', href: 'https://www.youtube.com/@svastrino' },
  { label: 'Twitter', href: 'https://twitter.com/svastrino/' },
]

export default function Contact() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  // Prefill from the signed-in account so a student never retypes what we
  // already hold. Runs when the profile arrives (it loads a tick after mount)
  // and only fills fields the visitor has not already typed into.
  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      email: f.email || user.email || '',
      phone: f.phone || user.phone || '',
    }))
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await api('/user/enquiry', { method: 'POST', body: { ...form, source: 'contact' } })
      setSent(true)
    } catch (ex) {
      setErr(ex.message || 'Could not send that just now — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Questions about a program or a course? We'd love to help."
      />
      <section className="section">
        <div className="container contact-grid">
          <form className="card contact-form" onSubmit={onSubmit}>
            {!sent && user && (
              <p className="contact-prefill">
                We’ve filled in your details from your account — change anything you like.
              </p>
            )}
            {sent ? (
              <p className="contact-success">Thanks! We’ll get back to you soon.</p>
            ) : (
              <>
                <label>
                  Name
                  <input type="text" required placeholder="Your name" autoComplete="name"
                         value={form.name} onChange={set('name')} />
                </label>
                <label>
                  Email
                  <input type="email" required placeholder="you@example.com" autoComplete="email"
                         value={form.email} onChange={set('email')} />
                </label>
                <label>
                  Contact number
                  <input type="tel" placeholder="+91 …" autoComplete="tel"
                         value={form.phone} onChange={set('phone')} />
                </label>
                <label>
                  Message
                  <textarea rows="4" required placeholder="How can we help?"
                            value={form.message} onChange={set('message')} />
                </label>
                {err && <p className="contact-error">{err}</p>}
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Sending…' : 'Send message'}
                </button>
              </>
            )}
          </form>

          <div className="contact-info">
            <h3>Talk to us</h3>
            <p>
              <a href={`tel:${PHONE_HREF}`}>{PHONE}</a>
              <br />
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>

            <h3>Offices</h3>
            {OFFICES.map((o) => (
              <div key={o.label} className="contact-office">
                <span className="contact-office-label">{o.label}</span>
                <p>
                  {o.lines.map((l, i) => (
                    <span key={i}>{l}<br /></span>
                  ))}
                </p>
              </div>
            ))}

            <h3>Follow</h3>
            <ul className="contact-socials">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
