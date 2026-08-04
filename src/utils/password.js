// Single source of truth for password rules — used by Signup, Reset password and
// the Settings "change/set password" form so every place enforces the SAME
// policy (min length + strength score + no name). The server re-validates too.

export const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

// True if the password embeds any 3+ char part of the user's name/surname.
// Guards against "Rajnish@123" style passwords that are trivially guessable.
export function passwordContainsName(pw, name) {
  if (!pw || !name) return false
  const lower = pw.toLowerCase()
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length >= 3)
    .some((part) => lower.includes(part))
}

// 0–4 strength score. A name-based password is capped at "Weak".
export function scorePassword(pw, name = '') {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score += 1
  if (pw.length >= 12) score += 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1
  if (/\d/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  score = Math.min(score, 4)
  if (passwordContainsName(pw, name)) score = Math.min(score, 1)
  return score
}

/**
 * Returns an error string if the password is unacceptable, else null.
 * This is the exact rule set applied everywhere a password is chosen.
 */
export function validatePassword(pw, name = '') {
  if (!pw) return 'Password required'
  if (pw.length < 8) return 'Minimum 8 characters'
  if (passwordContainsName(pw, name)) return 'Don’t use your name in the password'
  if (scorePassword(pw, name) < 2) return 'Use letters, numbers & a symbol'
  return null
}
