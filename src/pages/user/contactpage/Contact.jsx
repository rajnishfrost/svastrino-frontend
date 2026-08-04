import { useState } from 'react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
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
    label: 'Mumbai',
    lines: ['205, Mangal Bhavan, Plot 614/615', 'Junction of 14th Road, Khar (W), Linking Rd', 'Mumbai, Maharashtra 400052'],
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
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    // Scaffold: wire to /api/user/contact later.
    setSent(true)
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
            {sent ? (
              <p className="contact-success">Thanks! We’ll get back to you soon.</p>
            ) : (
              <>
                <label>
                  Name
                  <input type="text" required placeholder="Your name" />
                </label>
                <label>
                  Email
                  <input type="email" required placeholder="you@example.com" />
                </label>
                <label>
                  Contact number
                  <input type="tel" placeholder="+91 …" />
                </label>
                <label>
                  Message
                  <textarea rows="4" required placeholder="How can we help?" />
                </label>
                <button type="submit" className="btn btn-primary">Send message</button>
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
