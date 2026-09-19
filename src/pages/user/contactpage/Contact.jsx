import { useState } from 'react'
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ProgramHeroArt from '../servicespage/sections/ProgramHeroArt.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import { api } from '../../../api/client.js'
import PageSeo from '../../../seo/PageSeo.jsx'
import {
  BLANK, LIMITS, EnquiryContactField, EnquiryField, splitPhone, useEnquiryForm,
} from '../../../common_component/user/EnquiryFields/EnquiryFields.jsx'

// Real contact details from the Svastrino site. Static on purpose — offices and
// handles change rarely, so there's no value in a DB round-trip for them.
const PHONE = '+91 99877 77016'
const PHONE_HREF = '+919987777016'
const EMAIL = 'admin@svastrino.com'

const OFFICES = [
  {
    label: 'Registered Office',
    address:
      '401, Oasis Heritage Soc., Near TMC, Panchpakhadi, Thane, Maharashtra 400602, INDIA',
  },
  {
    label: 'Branch Office',
    address:
      'House No. 1, Kailash Colony, Tapovan Road, Near Vidhan Sabha, Sidhbadi, Dharamshala, Himachal Pradesh 176057, INDIA',
  },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/svastrino/' },
  { label: 'LinkedIn', href: 'https://in.linkedin.com/company/svastrino' },
  { label: 'Facebook', href: 'https://www.facebook.com/svastrino' },
  { label: 'YouTube', href: 'https://www.youtube.com/@svastrino' },
  { label: 'Twitter', href: 'https://twitter.com/svastrino/' },
]

/**
 * This page asks for less than the home banner does — no city, and the phone is
 * still the visitor's choice, because someone writing in about a policy question
 * does not need to hand over their number to get an answer.
 *
 * A number that IS given is checked in full, country code and all. A half-typed
 * phone is worse than no phone: the team dials it, fails, and the person is left
 * waiting for a call that was never going to come.
 */
const VALIDATION = { skip: ['city'], optional: ['phone'] }

export default function Contact() {
  const { user } = useAuth()
  // The same fields, prefill, masking and rules as the home banner and the
  // "talk to an expert" panel. Before this the page had its own form with no
  // length caps and a bare text box for the phone, so the one visitor who
  // happened to land here was asked for their number in a different way — and
  // could paste ten thousand words into the message.
  const { values, setValues, errors, set, check, showServerError, masked, hideable, toggle, formRef } =
    useEnquiryForm(user)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!check({}, VALIDATION)) return
    setErr(''); setBusy(true)
    try {
      // PhoneInput seeds its own dial code, so an untouched optional phone holds
      // "+91". Send that and the server would reject a number nobody typed.
      const phone = splitPhone(values.phone).national ? values.phone : ''
      await api('/user/enquiry', {
        method: 'POST',
        auth: user ? 'user' : false,
        body: { ...values, phone, source: 'contact' },
      })
      setSent(true)
    } catch (ex) {
      // When the server named a field, the message belongs on that box. Only the
      // rest — a rate limit, a network failure — goes under the button.
      if (!showServerError(ex)) {
        setErr(ex.message || 'Could not send that just now — please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageSeo />
      <PageHero
        eyebrow="Contact us"
        title="Get in Touch"
        subtitle="Questions about a program, the psychometric test, or booking a session? Reach out — we're happy to help."
        illustration={<ProgramHeroArt src="/assets/images/contact-us-t.png" alt="" />}
      />

      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <div className="grid items-start gap-10 lg:grid-cols-[1.6fr_1fr]">
            {/* Enquiry form (wider, left) */}
            <div className="rounded-2xl border border-brand-navy/5 bg-white p-6 shadow-xl shadow-brand-navy/5 md:p-8">
              {sent ? (
                /* The same shape the other forms use when they are done: a mark,
                   a heading, and what happens next — not one green line in an
                   otherwise empty card. It names the address the confirmation
                   went to, because that is the question someone asks next. */
                <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-brand-rose">
                    <CheckCircle2 className="size-8 text-brand-crimson" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-extrabold text-brand-navy">
                      Thank you &mdash; your message is with us
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-slate">
                      Someone from our team will get back to you shortly. We have sent a
                      confirmation to{' '}
                      <strong className="font-semibold text-brand-navy">{values.email}</strong>{' '}
                      so you have it on record.
                    </p>
                  </div>
                  <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
                    <a
                      href={`tel:${PHONE_HREF}`}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-crimson px-6 text-sm font-semibold text-white no-underline transition-colors hover:bg-brand-crimson-dark"
                    >
                      Call us instead
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        // A fresh sheet, minus what the account already tells us.
                        setValues({
                          ...BLANK,
                          name: user?.name || '', email: user?.email || '',
                          phone: user?.phone || '',
                        })
                        setErr('')
                        setSent(false)
                      }}
                      className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-brand-crimson underline-offset-4 hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                /* noValidate: the browser's own bubbles would pre-empt our
                   messages, and it only ever complains about one field at a time. */
                <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
                  <EnquiryField
                    name="name" label="Name" placeholder="Full name" autoComplete="name"
                    maxLength={LIMITS.name}
                    value={values.name} onChange={set('name')} error={errors.name}
                  />

                  <EnquiryContactField
                    kind="email" label="Email" value={values.email} onChange={set('email')}
                    error={errors.email} masked={masked.email}
                    hideable={hideable.email} onToggle={() => toggle('email')}
                  />

                  {/* The same country picker the sign-up page and the home banner
                      use. It was a bare text box here, which is how we ended up
                      with numbers on file that nobody could dial. */}
                  <EnquiryContactField
                    kind="phone"
                    label={
                      <>
                        Phone number{' '}
                        <span className="font-normal text-brand-slate">(optional)</span>
                      </>
                    }
                    value={values.phone} onChange={set('phone')}
                    error={errors.phone} masked={masked.phone}
                    hideable={hideable.phone} onToggle={() => toggle('phone')}
                  />

                  <EnquiryField
                    name="message" label="Message" rows={5} maxLength={LIMITS.message}
                    placeholder="How can we help?"
                    value={values.message} onChange={set('message')} error={errors.message}
                  />

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-brand-crimson px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Sending…' : 'Send Message'}
                  </button>

                  {err && (
                    <p className="text-sm text-brand-crimson" role="alert">
                      {err}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Contact details (narrower, right) */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-lg font-bold text-brand-navy">Reach Us</h2>
                <div className="mt-3 space-y-2 text-sm">
                  <a
                    href={`tel:${PHONE_HREF}`}
                    className="flex items-center gap-2.5 text-brand-slate hover:text-brand-crimson hover:underline"
                  >
                    <Phone className="size-4 text-brand-crimson" /> {PHONE}
                  </a>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-center gap-2.5 text-brand-slate hover:text-brand-crimson hover:underline"
                  >
                    <Mail className="size-4 text-brand-crimson" /> {EMAIL}
                  </a>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-brand-navy">Meet Us At</h2>
                <div className="mt-3 space-y-5">
                  {OFFICES.map((o) => (
                    <div key={o.label} className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-crimson" />
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-navy">
                          {o.label}
                        </span>
                        <p className="mt-1 text-sm leading-relaxed text-brand-slate">{o.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-brand-navy">Follow</h2>
                <ul className="mt-3 flex flex-wrap gap-2.5">
                  {SOCIALS.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full border border-brand-navy/15 px-4 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:border-brand-crimson hover:text-brand-crimson"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
