/**
 * May this signed-in account use the STUDENT portal?
 *
 * One account, one login: the site and the admin panel share a token, so every
 * panel account has always arrived on the site signed in and seeing a student's
 * menus. That suits a mentor who is also learning and not a content editor, and
 * `siteAccess` (admin panel → Users → Student portal) is where that is decided.
 *
 * A student is never judged by the flag — their account IS the portal — so this
 * only ever says no to someone whose role is something else.
 *
 * Used in two places for one reason: the navbar hides what such an account
 * cannot open, and the route guard answers if they reach it anyway (a
 * bookmark, a typed URL, a link someone sent them). The server refuses the
 * data as well; none of this is the real gate.
 */
export function hasPortalAccess(user) {
  if (!user) return false
  if ((user.role || 'student') === 'student') return true
  return user.siteAccess !== false
}

/** Signed in, but not into the student side of the site. */
export function isPanelOnly(user) {
  return !!user && !hasPortalAccess(user)
}

export const NO_PORTAL_MESSAGE =
  'This account cannot do that. Sign in with your student account, or talk to the Svastrino team.'
