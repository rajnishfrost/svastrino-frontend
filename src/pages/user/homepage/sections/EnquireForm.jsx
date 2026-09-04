import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../../../context/AuthContext.jsx'
import { api } from '../../../../api/client.js'
import {
  useEnquiryForm, EnquiryField, EnquiryContactField,
} from '../../../../common_component/user/EnquiryFields/EnquiryFields.jsx'

/**
 * Home · section 1 (inside the banner) — "Enquire With Us!".
 * A low-commitment way in for a visitor who is not ready to pick a service.
 * Posts to /user/enquiry, the same endpoint the Contact page uses; `source`
 * tells the team which form it came from.
 *
 * The fields, their validation and the masked prefill all come from
 * EnquiryFields, so this form and the "talk to an expert" panel ask for exactly
 * the same things in exactly the same way.
 *
 * The request is sent WITH the account token when there is one. The endpoint is
 * public and works fine without it; sending it is what lets the team open the
 * enquiry and the account side by side instead of matching them up by hand.
 *
 * A signed-in visitor who has already written in gets the form COLLAPSED rather
 * than removed. Removed would be wrong twice over: this is the hero's whole
 * right-hand column and taking it away leaves a hole, and unlike the program
 * pages there is no queue here to wait in — asking a second, different question
 * a week later is perfectly reasonable. So the collapsed state says we heard
 * them and offers the form back on one click.
 */
export default function EnquireForm() {
  const { user } = useAuth()
  const { values, errors, set, check, masked, hideable, toggle, formRef } = useEnquiryForm(user)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // undefined = not looked up yet; null = nothing on file. Only known for a
  // signed-in visitor — a signed-out browser cannot be recognised, and guessing
  // would greet a stranger with someone else's receipt.
  const [standing, setStanding] = useState(undefined)
  const [reopened, setReopened] = useState(false)

  useEffect(() => {
    if (!user) { setStanding(null); return undefined }
    let live = true
    api('/user/enquiry/mine?source=home', { auth: 'user' })
      .then((d) => { if (live) setStanding(d.enquiry || null) })
      .catch(() => { if (live) setStanding(null) }) // show the form rather than nothing
    return () => { live = false }
  }, [user])

  const submit = async (e) => {
    e.preventDefault()
    if (!check()) return
    setErr(''); setBusy(true)
    try {
      await api('/user/enquiry', {
        method: 'POST',
        auth: user ? 'user' : false,
        body: { ...values, source: 'home' },
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

  // Already written in, and not asking for the form back.
  if (standing && !reopened) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12 text-brand-crimson" />
        <h3 className="font-display text-xl font-bold text-brand-navy">We have your enquiry</h3>
        <p className="text-sm text-brand-slate">
          You wrote to us on{' '}
          {new Date(standing.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
          . Someone from our team will connect with you shortly — there is nothing more to do.
        </p>
        <button
          type="button"
          onClick={() => setReopened(true)}
          className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-brand-crimson underline-offset-4 hover:underline"
        >
          Ask something else
        </button>
      </div>
    )
  }

  return (
    // noValidate: the browser's own bubbles would pre-empt our messages, and it
    // only ever complains about one field at a time.
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold text-brand-navy">Enquire With Us!</h3>
        <p className="mt-1 text-sm text-brand-slate">
          Not sure what to do next? Tell us a little about where you are, and we&rsquo;ll help you
          figure out the right next step.
        </p>
      </div>

      <EnquiryField
        name="name" label="Name" placeholder="Full name" autoComplete="name" maxLength={80}
        value={values.name} onChange={set('name')} error={errors.name}
      />

      {/* Side by side, and min-w-0 so a long address shrinks its column instead
          of pushing the grid wider than the card. */}
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <EnquiryField
        name="city" label="Location" placeholder="City / Town / Village Name"
        autoComplete="address-level2" maxLength={80}
        value={values.city} onChange={set('city')} error={errors.city}
      />

      <EnquiryField
        name="message" label="What do you need help with?" rows={2} maxLength={2000}
        placeholder="Tell us in a line or two"
        value={values.message} onChange={set('message')} error={errors.message}
      />

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
