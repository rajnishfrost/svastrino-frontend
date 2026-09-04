import { useEffect, useState } from 'react'
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ProgramHeroArt from '../servicespage/sections/ProgramHeroArt.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import { api } from '../../../api/client.js'
import PageSeo from '../../../seo/PageSeo.jsx'

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

const inputClass =
  'h-11 w-full rounded-lg border border-brand-navy/15 bg-white px-3.5 font-sans text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15'

export default function Contact() {
  const { user } = useAuth()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
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
                      <strong className="font-semibold text-brand-navy">{form.email}</strong>{' '}
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
                        setForm({
                          name: user?.name || '', email: user?.email || '',
                          phone: user?.phone || '', message: '',
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
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-brand-navy">Name</label>
                    <input
                      className={inputClass}
                      type="text"
                      required
                      placeholder="Full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={set('name')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-brand-navy">Email</label>
                    <input
                      className={inputClass}
                      type="email"
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={set('email')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-brand-navy">
                      Phone number <span className="font-normal text-brand-slate">(optional)</span>
                    </label>
                    <input
                      className={inputClass}
                      type="tel"
                      placeholder="+91 …"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={set('phone')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-brand-navy">Message</label>
                    <textarea
                      className={`${inputClass} h-auto py-2.5`}
                      rows={5}
                      required
                      placeholder="How can we help?"
                      value={form.message}
                      onChange={set('message')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-brand-crimson px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? 'Sending…' : 'Send message'}
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
