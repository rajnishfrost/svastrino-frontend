import { useState } from 'react'

/**
 * Home · section 1 (inside the banner) — "Enquire With Us!".
 * A low-commitment way in for a visitor who is not ready to pick a service.
 * NOTE: there is no enquiry endpoint yet, so the form only shows a thank-you.
 * Wire it to the backend before launch — see Contact.jsx, which has the same gap.
 */
const CLASSES = ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduate', 'Other']

export default function EnquireForm() {
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setSent(true) // Scaffold: wire to /api/user/enquiry later.
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
            <input type="text" name="name" required autoComplete="name" placeholder="Your name" />
          </label>

          <label>
            <span>Phone number</span>
            <div className="home-enquire-phone">
              <span className="home-enquire-cc">+91</span>
              <input
                type="tel" name="phone" required inputMode="numeric"
                pattern="[0-9]{10}" maxLength={10} placeholder="10-digit number"
              />
            </div>
          </label>

          <div className="home-enquire-row">
            <label>
              <span>Your class</span>
              <select name="studentClass" required defaultValue="">
                <option value="" disabled>Select</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label>
              <span>City</span>
              <input type="text" name="city" required placeholder="Your city" />
            </label>
          </div>

          <label>
            <span>What do you need help with?</span>
            <textarea name="message" rows="2" placeholder="Tell us in a line or two" />
          </label>

          <button type="submit" className="btn btn-accent home-enquire-submit">
            Enquire Now →
          </button>
        </form>
      )}
    </div>
  )
}
