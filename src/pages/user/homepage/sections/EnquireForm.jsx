import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'

/**
 * Home · section 1 (inside the banner) — "Enquire With Us!".
 * A low-commitment way in for a visitor who is not ready to pick a service.
 * Posts to /user/enquiry, the same endpoint the Contact page uses; `source`
 * tells the team which form it came from.
 */
const CLASSES = ['1st Year Undergraduate', '1st Year Undergraduate', '1st Year Undergraduate', '1st Year Undergraduate', '1st Year Undergraduate', 'Other']

const inputClass =
  'h-11 w-full rounded-lg border border-brand-navy/15 bg-white px-3.5 font-sans text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15'

export default function EnquireForm() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // Phone is the one controlled field — the country-code dropdown needs it.
  const [phone, setPhone] = useState('')

  // Prefill the phone from the signed-in account once it loads, only if the
  // visitor hasn't started typing their own.
  useEffect(() => {
    if (user?.phone) setPhone((p) => p || user.phone)
  }, [user])

  // The other fields are uncontrolled (read off the form on submit); the phone
  // (controlled, from the dropdown) is merged in and lightly validated.
  const submit = async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    if (phone.replace(/\D/g, '').length < 8) {
      setErr('Please enter a valid phone number.')
      return
    }
    setErr(''); setBusy(true)
    try {
      await api('/user/enquiry', {
        method: 'POST',
        body: { ...data, phone, email: user?.email || '', source: 'home' },
      })
      setSent(true)
    } catch (ex) {
      setErr(ex.message || 'Could not send that just now — please try again.')
    } finally {
      setBusy(false)
    }
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
        <label className="text-xs font-semibold text-brand-navy">Name</label>
        <input className={inputClass} name="name" autoComplete="name" placeholder="Full name"
               defaultValue={user?.name || ''} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-brand-navy">Phone number</label>
        <PhoneInput
          defaultCountry="in"
          value={phone}
          onChange={(value) => setPhone(value)}
          placeholder="Phone number"
          inputStyle={{ fontFamily: 'inherit' }}
          style={{
            width: '100%',
            '--react-international-phone-height': '44px',
            '--react-international-phone-border-radius': '8px',
            '--react-international-phone-border-color': 'rgba(15, 44, 92, 0.15)',
            '--react-international-phone-font-size': '14px',
            '--react-international-phone-text-color': '#0f2c5c',
            '--react-international-phone-country-selector-background-color-hover': '#f6f9fc',
            '--react-international-phone-dropdown-item-font-size': '14px',
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-navy">Class</label>
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
          <label className="text-xs font-semibold text-brand-navy">Location</label>
          <input className={inputClass} name="city" placeholder="City / Town / Village Name" required />
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

      {err && (
        <p className="text-sm text-brand-crimson" role="alert">
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-brand-crimson px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Sending…' : <>Enquire Now <ArrowRight className="size-4" /></>}
      </button>
    </form>
  )
}
