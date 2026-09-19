import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { PhoneInput, defaultCountries, guessCountryByPartialPhoneNumber } from 'react-international-phone'
import 'react-international-phone/style.css'
import {
  LIMITS, MINIMUMS, checkEmail, checkLine, checkName, checkPhone, checkPlace, checkText,
} from '../../../utils/validate.js'

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

/**
 * How long each field may be. Re-exported from the one place the whole site
 * agrees on so a form can put the same number on its `maxLength` that the
 * validator and the server will hold it to — three copies of "80" in three
 * files is how they came to disagree in the first place.
 */
export { LIMITS } from '../../../utils/validate.js'

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
 * The rules themselves live in utils/validate.js, which the server mirrors — so
 * a message this form accepts is one the API accepts, and a phone number this
 * form passes is one with a country code on it.
 *
 * `extra` names further required fields the caller adds (the expert-call form
 * asks when to ring). Their label is used in the message.
 *
 * `options` lets a form that asks for less say so, rather than forcing every
 * form to ask for everything:
 *   skip     — fields this form does not show at all (the Contact page has no city)
 *   optional — fields it shows but does not insist on; a value that IS typed is
 *              still checked, because half a phone number is worse than none
 */
export function validateEnquiry(values, extra = {}, { skip = [], optional = [] } = {}) {
  const errors = {}
  const wanted = (k) => !skip.includes(k)
  const need = (k) => !optional.includes(k)
  const put = (k, error) => { if (error) errors[k] = error }

  if (wanted('name')) put('name', checkName(values.name))
  if (wanted('email')) put('email', checkEmail(values.email, { required: need('email') }))
  // A phone holding nothing but its dial code is PhoneInput seeding itself on
  // mount, not a number someone entered — see the note on the prefill below.
  // Passed through as-is it would tell a visitor who has typed nothing that
  // their number is "too short", and on a form where the phone is optional it
  // would refuse a submission over a field they never touched.
  if (wanted('phone')) {
    const national = splitPhone(values.phone).national
    put('phone', checkPhone(national ? values.phone : '', { required: need('phone') }))
  }
  if (wanted('city')) put('city', checkPlace(values.city, { required: need('city'), label: 'city' }))
  if (wanted('message')) {
    put('message', checkText(values.message, {
      required: need('message'),
      min: MINIMUMS.message,
      max: LIMITS.message,
      label: 'your message',
    }))
  }

  for (const [key, label] of Object.entries(extra)) {
    put(key, checkLine(values[key], { label: label.toLowerCase(), max: LIMITS.shortText }))
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
  const check = (extra = {}, options = {}) => {
    setSubmitted(true)
    const found = validateEnquiry(values, extra, options)
    setErrors(found)
    return !mark(Object.keys(found)[0])
  }

  /**
   * Put a message on one field and the cursor in it. Returns true when there was
   * a field to mark.
   *
   * Shared by `check` and `showServerError` so a rejection looks the same
   * whichever side it came from. The two can differ legitimately — the browser
   * cannot know an email is already registered — and when they do, the visitor
   * should still see the message on the box it is about rather than as a line
   * under the button.
   */
  const mark = (field, message) => {
    if (!field) return false
    if (message) setErrors((e) => ({ ...e, [field]: message }))
    const el = formRef.current?.querySelector(`[name="${field}"]`)
    el?.focus?.()
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    return true
  }

  /**
   * Show a rejection the API sent. Returns true when it landed on a field, so the
   * caller knows whether it still needs to show the message itself.
   */
  const showServerError = (err) => {
    setSubmitted(true)
    return mark(err?.field, err?.message)
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

  return { values, setValues, errors, set, check, showServerError, masked, hideable, toggle, formRef }
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

function FieldShell({ label, error, htmlFor, className = '', hint, children }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold text-brand-navy" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {/* The error replaces the hint rather than stacking under it: two lines of
          small print below a field is where people stop reading either. */}
      {error ? (
        <p className="text-xs font-medium text-brand-crimson" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-brand-slate/70">{hint}</p>
      )}
    </div>
  )
}

/**
 * A plain required text field (or textarea when `rows` is given).
 *
 * A textarea with a cap gets a counter, and only once the visitor is near it.
 * `maxLength` alone stops the typing dead at the limit with no explanation —
 * which reads as a broken keyboard — so the remaining count appears in the last
 * quarter and turns red at zero.
 */
export function EnquiryField({
  id, name, label, value, onChange, error, placeholder, rows, autoComplete, maxLength, className,
}) {
  const invalid = !!error
  const used = String(value ?? '').length
  // A cap by default, not only when the caller remembers one. A field is either a
  // paragraph or a line, and each has a sensible ceiling — leaving `maxLength`
  // undefined would quietly reintroduce the unbounded box this whole component
  // exists to prevent.
  const cap = maxLength ?? (rows ? LIMITS.message : LIMITS.shortText)
  const near = rows ? used >= cap * 0.75 : false
  const shared = {
    id: id || name,
    name,
    value,
    onChange,
    placeholder,
    autoComplete,
    maxLength: cap,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? `${name}-error` : undefined,
  }
  return (
    <FieldShell
      label={label}
      error={error}
      htmlFor={id || name}
      className={className}
      hint={near ? `${cap - used} characters left of ${cap}` : undefined}
    >
      {rows ? (
        <textarea {...shared} rows={rows} className={`${base} h-auto py-2.5 ${invalid ? bad : ok}`} />
      ) : (
        <input {...shared} className={inputClass(invalid)} />
      )}
    </FieldShell>
  )
}

/**
 * A required dropdown, built on the same shell as EnquiryField so a select and a
 * text field sitting beside it share one label style, one error style and one
 * height rather than being talked into looking alike.
 *
 * The prompt option is disabled. "Select" is a question, not an answer, and
 * leaving it selectable lets someone reopen the list and put the form back into
 * the one state submission has to refuse.
 */
export function EnquirySelect({ id, name, label, value, onChange, error, options, placeholder = 'Select', className }) {
  const invalid = !!error
  return (
    <FieldShell label={label} error={error} htmlFor={id || name} className={className}>
      <select
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${name}-error` : undefined}
        className={inputClass(invalid)}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
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
/**
 * `dropdownAlign` picks which edge of the field the country list hangs from.
 * 'left' is the default and the one that reads right — the list opens under the
 * flag that was clicked. A form in a column narrower than the 300px list has to
 * pass 'right', or the list runs off the side of the screen.
 */
export function EnquiryContactField({
  kind, label, value, onChange, error, masked, hideable, onToggle, placeholder, className,
  dropdownAlign = 'left',
}) {
  const invalid = !!error
  const isPhone = kind === 'phone'
  const what = isPhone ? 'phone number' : 'email address'
  const bare = 'h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 font-sans text-sm text-brand-navy placeholder:text-brand-slate/60 focus:outline-none'

  const emailInput = (cls) => (
    <input
      id="email" name="email" type="email" value={value} onChange={onChange}
      maxLength={LIMITS.email} autoComplete="email" placeholder={placeholder || 'you@example.com'}
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
      // The library lays the country selector and the number out as flex
      // siblings and lets both shrink. In a narrow column the number's natural
      // width wins, the selector is squeezed to about 22px, and its centred
      // flag spills out either side — where the row's rounded edge clips it.
      // Pin the selector to its own width; the number absorbs what is left.
      countrySelectorStyleProps={{
        // position:static hands the dropdown's containing block to the row, so
        // the offsets below are measured from the field rather than from the
        // flag button. Left to the library the list starts at the flag and runs
        // 300px right, which puts most of it outside the card.
        style: { flex: '0 0 auto', position: 'static' },
        buttonStyle: { flexShrink: 0 },
        flagStyle: { flexShrink: 0 },
        dropdownStyleProps: {
          style: {
            // Hangs from whichever edge the caller asked for; see the note on
            // `dropdownAlign` above.
            left: dropdownAlign === 'right' ? 'auto' : 0,
            right: dropdownAlign === 'right' ? 0 : 'auto',
            top: '48px',
            width: 'min(300px, calc(100vw - 24px))',
            border: '1px solid rgba(15, 44, 92, 0.15)',
            borderRadius: '8px',
            // The library lets the browser draw its default focus ring on the
            // list; every other control here suppresses it.
            outline: 'none',
            boxShadow: '0 12px 28px rgba(15, 44, 92, 0.14)',
          },
          listItemStyle: { fontFamily: 'inherit' },
        },
      }}
      inputStyle={{ fontFamily: 'inherit', flex: '1 1 0%', minWidth: 0 }}
      style={style}
    />
  )

  // No eye to place — render the plain control and be done.
  if (!hideable) {
    return (
      <FieldShell label={label} error={error} htmlFor={kind} className={className}>
        {isPhone ? (
          // Left to itself the library draws a border around the country button
          // AND another around the number, so the field reads as two boxes
          // joined by a seam — nothing else on the form looks like that. The
          // row owns the single border instead, exactly as the masked variant
          // below already does, and the parts inside draw none. No clipping
          // here: the country dropdown is absolutely positioned inside the row,
          // so overflow-hidden would cut the country list down to a sliver.
          <div className={`relative flex h-11 w-full items-center rounded-lg border border-solid bg-white ${invalid ? bad : ok}`}>
            {phoneInput({
              ...phoneVars(invalid),
              flex: '1 1 0%',
              minWidth: 0,
              '--react-international-phone-border-color': 'transparent',
              '--react-international-phone-border-radius': '7px',
              '--react-international-phone-height': '42px',
            })}
          </div>
        ) : emailInput(inputClass(invalid))}
      </FieldShell>
    )
  }

  return (
    <FieldShell label={label} error={error} htmlFor={kind} className={className}>
      {/* border-solid because Preflight is off: Tailwind's `border` sets the
          width, and a <div> has no border style of its own to show it with.
          A phone brings an absolutely positioned country dropdown with it, so
          this row must not clip; nothing else in here overflows. */}
      <div className={`relative flex h-11 w-full items-center rounded-lg border border-solid bg-white ${isPhone ? '' : 'overflow-hidden'} ${invalid ? bad : ok}`}>
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
            '--react-international-phone-border-radius': '7px',
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
