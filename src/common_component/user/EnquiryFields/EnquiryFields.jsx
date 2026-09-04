import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { PhoneInput, defaultCountries, guessCountryByPartialPhoneNumber } from 'react-international-phone'
import 'react-international-phone/style.css'

/**
 * The enquiry fields, shared by every form that asks a visitor how to reach them
 * — the home banner and the "talk to an expert" panel on a program page.
 *
 * They live together because they had drifted apart: one asked for a class and
 * no email, the other marked half its fields "(optional)", and the two validated
 * differently, so the same visitor was asked for different things depending on
 * which page they happened to be reading. One component means one answer.
 *
 * Everything here is required. A form that collects an address it will not check
 * and a city it will not insist on produces enquiries the team cannot act on,
 * which is worse than a slightly longer form.
 *
 * What a signed-in visitor sees is different, and deliberately so. We already
 * hold their email and phone, so the fields arrive filled and MASKED — there is
 * no reason to put someone's own contact details back on screen in a public
 * page they may be sharing or presenting. The eye reveals them, and revealing
 * is also what makes them editable, so "look at it" and "change it" are the
 * same gesture rather than two.
 */

/** Empty values for every shared field. */
export const BLANK = { name: '', email: '', phone: '', city: '', message: '' }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Show the first three characters and hide the rest to the right. Enough for the
 * owner to recognise their own value at a glance without putting it on screen
 * for whoever else is looking. `keep` never exceeds the value itself, so a
 * two-character local part is not revealed whole.
 */
const head = (v, keep = 3) => {
  const s = String(v || '')
  const n = Math.min(keep, Math.max(0, s.length - 1))
  return `${s.slice(0, n)}${'•'.repeat(s.length - n)}`
}

/**
 * Split a stored E.164 number into its country code and the national number.
 * The country table is the phone input's own, so the two always agree about
 * where a dial code ends — +91, +1 and +44 are one, one and two digits, and
 * hard-coding "the first three" would have cut a different number every time.
 */
export function splitPhone(v) {
  const digits = String(v || '').replace(/\D/g, '')
  const guess = guessCountryByPartialPhoneNumber({ phone: digits, countries: defaultCountries })
  const dial = guess?.fullDialCodeMatch ? guess.country?.dialCode || '' : ''
  return { dial, national: digits.slice(dial.length) }
}

// The country code is not the private half — it is the same for everyone in the
// country — so it stays readable and the three revealed digits come out of the
// number that actually identifies someone.
const maskPhone = (v) => {
  const { dial, national } = splitPhone(v)
  if (!national) return head(String(v || '').replace(/\s+/g, ''))
  return `+${dial} ${head(national)}`
}

// The domain stays readable for the same reason: it is what tells someone WHICH
// of their addresses this is.
const maskEmail = (v) => {
  const [local, domain] = String(v || '').split('@')
  return domain ? `${head(local)}@${domain}` : head(v)
}

/**
 * Check every field and say what is wrong with each, rather than stopping at the
 * first. A visitor who fixes one thing, resubmits and is told about the next one
 * gives up somewhere around the third round trip.
 *
 * `extra` names further required fields the caller adds (the expert-call form
 * asks when to ring). Their label is used in the message.
 */
export function validateEnquiry(values, extra = {}) {
  const errors = {}
  const v = (k) => String(values[k] ?? '').trim()

  if (v('name').length < 2) errors.name = 'Please tell us your name.'
  if (!v('email')) errors.email = 'Please add your email address.'
  else if (!EMAIL_RE.test(v('email'))) errors.email = 'That email does not look right.'

  const digits = v('phone').replace(/\D/g, '')
  if (!digits) errors.phone = 'Please add a phone number.'
  else if (digits.length < 8) errors.phone = 'That phone number looks too short.'

  if (!v('city')) errors.city = 'Please tell us where you are based.'
  if (v('message').length < 3) errors.message = 'A line or two is enough — tell us how we can help.'

  for (const [key, label] of Object.entries(extra)) {
    if (!v(key)) errors[key] = `Please fill in ${label.toLowerCase()}.`
  }
  return errors
}

/**
 * Shared form state: values, per-field errors, the prefill, and which prefilled
 * fields are still masked.
 *
 * Errors clear as a field is corrected, but only AFTER the first submit. Telling
 * someone their email is invalid while they are still on the third character of
 * it is noise, not help.
 */
export function useEnquiryForm(user, initial = {}) {
  const [values, setValues] = useState({ ...BLANK, ...initial })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  // Which fields we filled in from the account — those are the masked ones.
  const [fromAccount, setFromAccount] = useState({})
  const [revealed, setRevealed] = useState({})
  const formRef = useRef(null)

  // Fill from the account, and keep it filled until the visitor edits it.
  //
  // "Whatever is already in the field wins" was the obvious rule and the wrong
  // one: PhoneInput writes its dial code into its own field on mount, so the
  // phone already held "+91" by the time the account arrived, that counted as
  // something the visitor had typed, and the real number never landed — the
  // masked field showed three dots of a country code. Only a real edit counts
  // now, and the dial-code seed is not one.
  //
  // Keyed on the values rather than the user object: the object is replaced on
  // every profile refresh while what it carries usually has not changed.
  const touched = useRef({})
  useEffect(() => {
    if (!user) return
    const mine = (key, fromUser) => (touched.current[key] ? null : fromUser || null)
    setValues((f) => ({
      ...f,
      name: mine('name', user.name) ?? f.name,
      email: mine('email', user.email) ?? f.email,
      phone: mine('phone', user.phone) ?? f.phone,
    }))
    // Masked only while the value is still ours. Once they have edited it, it is
    // theirs, and hiding what someone just typed would be nonsense.
    setFromAccount({
      email: !!user.email && !touched.current.email,
      phone: !!user.phone && !touched.current.phone,
    })
  }, [user, user?.name, user?.email, user?.phone])

  const set = (key) => (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue
    // A phone that is nothing but a dial code is PhoneInput initialising itself,
    // not a person typing — see the note on the prefill above.
    if (!(key === 'phone' && !splitPhone(value).national)) touched.current[key] = true
    setValues((f) => ({ ...f, [key]: value }))
    if (submitted) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // Both ways: what can be revealed can be put back. Someone who unhid their
  // number to check it should not have to reload the page to cover it again.
  const toggle = (key) => setRevealed((r) => ({ ...r, [key]: !r[key] }))

  /**
   * Validate everything and, when something is wrong, put the cursor in the
   * first bad field. Returns true when the caller may submit.
   */
  const check = (extra = {}) => {
    setSubmitted(true)
    const found = validateEnquiry(values, extra)
    setErrors(found)
    const firstBad = Object.keys(found)[0]
    if (firstBad) {
      const el = formRef.current?.querySelector(`[name="${firstBad}"]`)
      el?.focus?.()
      el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
      return false
    }
    return true
  }

  const masked = useMemo(
    () => ({
      email: !!fromAccount.email && !revealed.email,
      phone: !!fromAccount.phone && !revealed.phone,
    }),
    [fromAccount, revealed]
  )

  // Which fields carry an eye at all. Only the ones we filled in: a visitor who
  // typed their own address has nothing to hide from themselves, and an eye on
  // an empty field is a control that does nothing.
  const hideable = useMemo(
    () => ({ email: !!fromAccount.email, phone: !!fromAccount.phone }),
    [fromAccount]
  )

  return { values, setValues, errors, set, check, masked, hideable, toggle, formRef }
}

// ---- presentation ----------------------------------------------------------

const base =
  'block w-full rounded-lg border bg-white px-3.5 font-sans text-sm text-brand-navy placeholder:text-brand-slate/60 focus:outline-none focus:ring-2'
const ok = 'border-brand-navy/15 focus:border-brand-crimson focus:ring-brand-crimson/15'
const bad = 'border-brand-crimson focus:border-brand-crimson focus:ring-brand-crimson/25'

const inputClass = (invalid) => `${base} h-11 ${invalid ? bad : ok}`

/** The phone input is themed through its own CSS variables, not class names. */
const phoneVars = (invalid) => ({
  width: '100%',
  '--react-international-phone-height': '44px',
  '--react-international-phone-border-radius': '8px',
  '--react-international-phone-border-color': invalid ? '#b3122b' : 'rgba(15, 44, 92, 0.15)',
  '--react-international-phone-font-size': '14px',
  '--react-international-phone-text-color': '#0f2c5c',
  '--react-international-phone-country-selector-background-color-hover': '#f6f9fc',
  '--react-international-phone-dropdown-item-font-size': '14px',
})

function FieldShell({ label, error, htmlFor, className = '', children }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold text-brand-navy" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs font-medium text-brand-crimson" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/** A plain required text field (or textarea when `rows` is given). */
export function EnquiryField({ id, name, label, value, onChange, error, placeholder, rows, autoComplete, maxLength, className }) {
  const invalid = !!error
  const shared = {
    id: id || name,
    name,
    value,
    onChange,
    placeholder,
    autoComplete,
    maxLength,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? `${name}-error` : undefined,
  }
  return (
    <FieldShell label={label} error={error} htmlFor={id || name} className={className}>
      {rows ? (
        <textarea {...shared} rows={rows} className={`${base} h-auto py-2.5 ${invalid ? bad : ok}`} />
      ) : (
        <input {...shared} className={inputClass(invalid)} />
      )}
    </FieldShell>
  )
}

/**
 * Email or phone that we already know.
 *
 * One bordered row serves every state, laid out with flex: the field grows, the
 * eye sits at the end of it. Overlaying the button is the usual way to put a
 * control inside a field and it is avoided on purpose — this page's CSS reset is
 * off and the vanilla-CSS pages next door style bare elements, so a layout built
 * from ordinary flow survives all of that. The eye is at the end because it is
 * LAST in the row, not because a positioning rule says so.
 *
 * The phone input brings its own bordered box; its border is switched off
 * through its own CSS variable so this row draws the single border, and the
 * country dropdown goes on working inside it.
 *
 * Masked, the value is shown but not editable: a field you cannot read is a
 * field you cannot safely change, so the eye does both at once. Pressing it
 * again puts the value back behind the dots.
 */
export function EnquiryContactField({
  kind, label, value, onChange, error, masked, hideable, onToggle, placeholder, className,
}) {
  const invalid = !!error
  const isPhone = kind === 'phone'
  const what = isPhone ? 'phone number' : 'email address'
  const bare = 'h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 font-sans text-sm text-brand-navy placeholder:text-brand-slate/60 focus:outline-none'

  const emailInput = (cls) => (
    <input
      id="email" name="email" type="email" value={value} onChange={onChange}
      maxLength={160} autoComplete="email" placeholder={placeholder || 'you@example.com'}
      aria-invalid={invalid || undefined} className={cls}
    />
  )
  const phoneInput = (style) => (
    <PhoneInput
      inputProps={{ name: 'phone', id: 'phone', 'aria-invalid': invalid || undefined }}
      defaultCountry="in"
      value={value}
      onChange={onChange}
      placeholder={placeholder || 'Phone number'}
      inputStyle={{ fontFamily: 'inherit' }}
      style={style}
    />
  )

  // No eye to place — render the plain control and be done.
  if (!hideable) {
    return (
      <FieldShell label={label} error={error} htmlFor={kind} className={className}>
        {isPhone ? phoneInput(phoneVars(invalid)) : emailInput(inputClass(invalid))}
      </FieldShell>
    )
  }

  return (
    <FieldShell label={label} error={error} htmlFor={kind} className={className}>
      <div className={`flex h-11 w-full items-center overflow-hidden rounded-lg border bg-white ${invalid ? bad : ok}`}>
        {masked ? (
          <input
            id={kind}
            name={kind}
            readOnly
            value={isPhone ? maskPhone(value) : maskEmail(value)}
            className={`${bare} text-brand-slate`}
          />
        ) : isPhone ? (
          // The row owns the border now, so the input must not draw its own.
          phoneInput({
            ...phoneVars(invalid),
            flex: '1 1 0%',
            minWidth: 0,
            '--react-international-phone-border-color': 'transparent',
            '--react-international-phone-height': '42px',
          })
        ) : (
          emailInput(bare)
        )}

        <button
          type="button"
          onClick={onToggle}
          title={masked ? `Show and edit your ${what}` : `Hide your ${what}`}
          aria-label={masked ? `Show and edit your ${what}` : `Hide your ${what}`}
          aria-pressed={!masked}
          className="flex h-full w-10 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-brand-slate hover:text-brand-navy"
        >
          {masked ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>
    </FieldShell>
  )
}
