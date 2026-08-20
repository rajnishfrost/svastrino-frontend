import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

/**
 * Home · section 1 (inside the banner) — "Enquire With Us!".
 * A low-commitment way in for a visitor who is not ready to pick a service.
 * NOTE: there is no enquiry endpoint yet, so the form only shows a thank-you.
 * Wire it to the backend before launch — see Contact.jsx, which has the same gap.
 */
const CLASSES = ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduate', 'Other']

const inputClass =
  'h-11 w-full rounded-lg border border-brand-navy/15 bg-white px-3.5 text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15'

export default function EnquireForm() {
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setSent(true) // Scaffold: wire to /api/user/enquiry later.
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12 text-brand-crimson" />
        <h3 className="font-display text-xl font-bold text-brand-navy">Thank you!</h3>
        <p className="text-sm text-brand-slate">
          We have your details and will get back to you shortly to help plan your next step.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold text-brand-navy">Enquire With Us!</h3>
        <p className="mt-1 text-sm text-brand-slate">
          Not sure what to do next? Tell us a little about where you are, and we&rsquo;ll help you
          figure out the right next step.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-brand-navy">Your name</label>
        <input className={inputClass} name="name" autoComplete="name" placeholder="Your name" required />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-brand-navy">Phone number</label>
        <div className="flex gap-2">
          <span className="inline-flex h-11 items-center rounded-lg border border-brand-navy/15 bg-brand-cream px-3 text-sm font-medium text-brand-navy">
            +91
          </span>
          <input
            className={inputClass}
            type="tel"
            name="phone"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit number"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-navy">Your class</label>
          <select className={inputClass} name="studentClass" defaultValue="" required>
            <option value="" disabled>
              Select
            </option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-navy">City</label>
          <input className={inputClass} name="city" placeholder="Your city" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-brand-navy">What do you need help with?</label>
        <textarea
          className={`${inputClass} h-auto py-2.5`}
          name="message"
          rows={2}
          placeholder="Tell us in a line or two"
        />
      </div>

      <button
        type="submit"
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-brand-crimson px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark"
      >
        Enquire Now →
      </button>
    </form>
  )
}
