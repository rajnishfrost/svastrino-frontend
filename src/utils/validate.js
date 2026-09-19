/**
 * One validation contract for every box a visitor can type into.
 *
 * Before this existed each form carried its own rules: four different email
 * regexes, three different name regexes, a phone capped at 15 characters on the
 * sign-up page and 20 in the enquiry form, and several textareas with no cap at
 * all. The same person typing the same thing was accepted on one page and
 * refused on another, and a form with no cap let one visitor post an essay into
 * a field the team reads in a list.
 *
 * The server mirrors this file at server/src/utils/validate.js — same limits,
 * same regexes, same signatures. Keep the two in step; the server is the one
 * that actually decides, because anything can post to the API without ever
 * loading the page.
 */

/* ---------------------------------------------------------------- limits ---- */

/**
 * The longest each kind of field may be, in characters.
 *
 * These are not guesses: each one is what the database field and the screen that
 * displays it can carry. `message` is two thousand because the panel shows an
 * enquiry in a table cell; `ticketMessage` is longer because a support thread is
 * read on its own page and a stuck student needs room to explain.
 */
export const LIMITS = {
  name: 60,
  email: 254,        // the longest address RFC 5321 allows
  phone: 20,         // "+91 99877 77016" with room to spare
  city: 80,
  state: 80,
  address: 240,
  pincode: 10,
  studentClass: 40,
  subject: 120,
  message: 2000,
  ticketMessage: 4000,
  answer: 4000,
  notes: 2000,
  couponCode: 24,
  search: 80,
  password: 128,
  url: 300,
  slug: 80,
  title: 160,
  shortText: 200,
  description: 1200,
  longText: 20000,   // admin body copy: a course write-up, a page section
  /*
   * A whole article. Set above what the JSON body parser will accept (100 kB)
   * on purpose: the point of a cap on a field an admin writes over several
   * sittings is to be a backstop, not a guillotine. The longest post we already
   * hold is just under 20,000 characters, and silently clipping somebody's work
   * on save is worse than any request this would have turned away — the parser
   * refuses the oversized request first, with an error, before we see it.
   */
  article: 100000,
}

/** The shortest a field may be before it carries no information. */
export const MINIMUMS = {
  name: 2,
  subject: 3,
  message: 10,
  answer: 2,
  phoneDigits: 8,    // dial code + national number, the shortest real E.164
}

/* --------------------------------------------------------------- patterns --- */

// One email rule for the whole site. Deliberately not the full RFC: an address
// we cannot send to is worse than one we wrongly refuse, and every real address
// has a dot in its domain.
export const EMAIL_RE = /^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/

// A name in any script (Devanagari, Latin, anything \p{L} covers) plus the
// punctuation real names carry. Starts with a letter, so " -Raj" is refused.
export const NAME_RE = /^\p{L}[\p{L}\p{M}\s'.-]*$/u

// A place name: the same idea as a name, with digits allowed for "Sector 15".
export const PLACE_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}\s'.,()/-]*$/u

// E.164 exactly as the country picker produces it: a +, then 8 to 15 digits.
export const PHONE_E164_RE = /^\+[1-9]\d{7,14}$/

// Coupons are printed on flyers and read aloud, so they are upper-case letters,
// digits and dashes only.
export const COUPON_RE = /^[A-Z0-9][A-Z0-9-]{2,23}$/

export const PINCODE_RE = /^\d{4,10}$/

export const URL_RE = /^https?:\/\/[^\s<>"']+$/i

/* ------------------------------------------------------------ sanitising --- */

// Everything below space except newline and tab, plus the invisible formatting
// marks: zero-width spaces and the bidi overrides. Those last ones are how a
// sender makes one string render as another, and they are never typed by hand.
const CONTROL_SOURCE =
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]'
const CONTROL_RE = new RegExp(CONTROL_SOURCE, 'g')

/**
 * Strip the characters that let text act as markup, then the invisible ones.
 *
 * Escaping at render time is the real defence and React already does it. This is
 * the layer in front of it, so nothing tag-shaped is ever stored, which matters
 * most for the places that are NOT React: the emails we send the team and the
 * CSV exports they open in Excel.
 */
export const stripMarkup = (v) => String(v ?? '').replace(/[<>]/g, '').replace(CONTROL_RE, '')

/** A single-line value: markup gone, every run of whitespace collapsed to one space. */
export const sanitiseLine = (v, max = LIMITS.shortText) =>
  stripMarkup(v).replace(/\s+/g, ' ').trim().slice(0, max)

/**
 * What to run on a value as it is being TYPED.
 *
 * Markup and the cap, and nothing else — deliberately not sanitiseLine, which
 * trims. Trimming on every keystroke means the trailing space a person types
 * between two words is deleted before they reach the second one, so the field
 * silently refuses to accept a space at all. Normalising whitespace is a thing to
 * do on submit, not on input.
 */
export const sanitiseTyping = (v, max = LIMITS.shortText) => stripMarkup(v).slice(0, max)

/**
 * A multi-line value: paragraph breaks survive, but a wall of blank lines does
 * not. Three or more newlines become two, which is one empty line.
 */
export const sanitiseText = (v, max = LIMITS.message) =>
  stripMarkup(v)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)

/** Digits only, with a leading + kept: what a phone field should hold. */
export const sanitisePhone = (v) => {
  const s = String(v ?? '').trim()
  const plus = s.startsWith('+') ? '+' : ''
  return `${plus}${s.replace(/\D+/g, '')}`.slice(0, LIMITS.phone)
}

export const sanitiseCoupon = (v) =>
  String(v ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, LIMITS.couponCode)

/* ------------------------------------------------- what is not human text --- */

/**
 * Signatures of input that is trying to be executed rather than read.
 *
 * Kept short on purpose. A long list of clever patterns catches more attacks and
 * also more real sentences, and a contact form that refuses a genuine message
 * costs us a student. Markup is stripped before any of this is stored, so these
 * are the payloads that would survive that: a scheme, an event handler, a
 * template expression, a SQL clause, a PHP tag.
 */
const CODE_SIGNATURES = [
  /*
   * A markup tag, by name.
   *
   * Named, and with no space allowed after the bracket.
   *
   * The obvious pattern for "a tag" is <something>, and that also matches "if 5 <
   * 10 and 10 > 3" in a perfectly ordinary sentence — a contact form that refuses
   * that is a contact form that loses a real enquiry. Requiring the name to follow
   * the bracket immediately rules out every "x < y" comparison, and naming the
   * tags rules out the rest of prose: nobody writes "I scored <img" by accident.
   */
  /<\/?(?:script|iframe|object|embed|svg|img|a|div|span|p|style|link|meta|form|input|textarea|button|body|html|base|frame|frameset|applet|audio|video|source|math|marquee)\b/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon(?:error|load|click|focus|mouseover|submit|toggle)\s*=/i,
  /\$\{[\s\S]*\}/,
  /\{\{[\s\S]*\}\}/,
  /<\?(?:php|=)/i,
  /\b(?:union\s+all\s+select|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\S+\s+set)\b/i,
  /\bselect\b[\s\S]{1,80}\bfrom\b[\s\S]{1,40}\bwhere\b/i,
  /\b(?:document|window)\s*\.\s*(?:cookie|location|write)\b/i,
  /\beval\s*\(|\bnew\s+Function\s*\(/,
]

/** True when the value carries one of the signatures above. */
export const looksLikeCode = (v) => {
  const s = String(v ?? '')
  return CODE_SIGNATURES.some((re) => re.test(s))
}

/**
 * True when the value is mostly not words.
 *
 * A message has to be readable by the person who answers it. "!!!!!!!!!!" and
 * "()()()()()()" pass a length check and a markup strip and still say nothing,
 * so anything under `ratio` letters-and-digits is refused. Short values are
 * exempt: "Rs." would fail a ratio test on three characters, and a three
 * character field is not how anyone floods us.
 */
export const isMostlySymbols = (v, ratio = 0.4) => {
  const s = String(v ?? '').trim()
  if (s.length < 8) return false
  const words = (s.match(/[\p{L}\p{N}]/gu) || []).length
  return words / s.length < ratio
}

/* ------------------------------------------------------- field validators --- */
// Each returns a message to show the visitor, or '' when the value is fine.
// They take the RAW value: a validator that only saw sanitised input would
// silently accept "<script>hello</script>" as the word "hello".

const CODE_MSG = 'Please write this as plain text — code and script are not allowed here.'

export function checkName(value, { required = true, label = 'name' } = {}) {
  const v = sanitiseLine(value, LIMITS.name)
  if (!v) return required ? `Please enter your ${label}.` : ''
  if (v.length < MINIMUMS.name) return `That ${label} is too short.`
  if (!NAME_RE.test(v)) return `Please use letters only in your ${label} — spaces, . - and ' are fine.`
  return ''
}

export function checkEmail(value, { required = true } = {}) {
  const v = sanitiseLine(value, LIMITS.email + 1).toLowerCase()
  if (!v) return required ? 'Please enter your email address.' : ''
  if (v.length > LIMITS.email) return 'That email address is too long.'
  if (!EMAIL_RE.test(v)) return 'That does not look like an email address.'
  return ''
}

/**
 * A phone number as the country picker gives it: a dial code and a national
 * number. `required: false` still checks a number that WAS typed, because half a
 * phone number is worse than none — the team will try to ring it.
 */
export function checkPhone(value, { required = true } = {}) {
  const v = sanitisePhone(value)
  const digits = v.replace(/\D/g, '')
  if (!digits) return required ? 'Please enter your phone number.' : ''
  if (!v.startsWith('+')) return 'Please choose your country, then type the number.'
  if (digits.length < MINIMUMS.phoneDigits) return 'That phone number is too short.'
  if (digits.length > 15) return 'That phone number is too long.'
  if (!PHONE_E164_RE.test(v)) return 'Please enter digits only, after choosing your country.'
  return ''
}

/** A one-line free-text field: a subject, a city, a job title. */
export function checkLine(value, { required = true, min = 0, max = LIMITS.shortText, label = 'this' } = {}) {
  const v = sanitiseLine(value, max + 1)
  if (!v) return required ? `Please fill in ${label}.` : ''
  if (looksLikeCode(value)) return CODE_MSG
  if (v.length < min) return `Please write a little more in ${label}.`
  if (v.length > max) return `Please keep ${label} under ${max} characters.`
  return ''
}

/** A paragraph field: a message, an answer, a description. */
export function checkText(value, { required = true, min = 0, max = LIMITS.message, label = 'this' } = {}) {
  const v = sanitiseText(value, max + 1)
  if (!v) return required ? `Please fill in ${label}.` : ''
  if (looksLikeCode(value)) return CODE_MSG
  if (v.length < min) return `Please write at least ${min} characters in ${label}.`
  if (v.length > max) return `Please keep ${label} under ${max} characters — you have ${v.length}.`
  if (isMostlySymbols(v)) return 'Please write this in words so we can read it.'
  return ''
}

export function checkPlace(value, { required = true, max = LIMITS.city, label = 'city' } = {}) {
  const v = sanitiseLine(value, max)
  if (!v) return required ? `Please tell us your ${label}.` : ''
  if (!PLACE_RE.test(v)) return `Please use letters and digits only in your ${label}.`
  return ''
}

export function checkUrl(value, { required = false } = {}) {
  const v = sanitiseLine(value, LIMITS.url + 1)
  if (!v) return required ? 'Please enter a link.' : ''
  if (v.length > LIMITS.url) return 'That link is too long.'
  if (!URL_RE.test(v)) return 'Please enter a full link, starting with https://'
  return ''
}

export function checkPincode(value, { required = false } = {}) {
  const v = String(value ?? '').replace(/\D/g, '')
  if (!v) return required ? 'Please enter a PIN code.' : ''
  if (!PINCODE_RE.test(v)) return 'That PIN code does not look right.'
  return ''
}

export function checkCoupon(value, { required = true } = {}) {
  const v = sanitiseCoupon(value)
  if (!v) return required ? 'Please enter a coupon code.' : ''
  if (!COUPON_RE.test(v)) return 'A coupon code is letters, digits and dashes only.'
  return ''
}

/**
 * Run a whole form in one call.
 *
 * `spec` maps each field name to a checker and its options:
 *   { name: [checkName, {}], message: [checkText, { min: 10, label: 'your message' }] }
 *
 * Every field is checked, not just the first bad one. Someone who fixes one
 * problem, resubmits, and is told about the next gives up around the third round
 * trip.
 */
export function checkForm(values, spec) {
  const errors = {}
  for (const [field, [check, opts]] of Object.entries(spec)) {
    const error = check(values[field], opts)
    if (error) errors[field] = error
  }
  return errors
}

/**
 * Put a form's values into the shape the API should receive: every string
 * sanitised to the limit its kind allows.
 *
 * `kinds` maps a field to 'line' | 'text' | 'email' | 'phone' | 'coupon', and
 * anything not named is passed through untouched — numbers, booleans, and
 * selects whose options we wrote ourselves.
 */
export function cleanForm(values, kinds) {
  const out = { ...values }
  for (const [field, kind] of Object.entries(kinds)) {
    if (out[field] == null) continue
    if (kind === 'email') out[field] = sanitiseLine(out[field], LIMITS.email).toLowerCase()
    else if (kind === 'phone') out[field] = sanitisePhone(out[field])
    else if (kind === 'coupon') out[field] = sanitiseCoupon(out[field])
    else if (kind === 'text') out[field] = sanitiseText(out[field], LIMITS.ticketMessage)
    else out[field] = sanitiseLine(out[field], LIMITS.shortText)
  }
  return out
}
