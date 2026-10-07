/**
 * Where to go after signing in, when the sign-in cannot happen in one sitting.
 *
 * Signing up with an email does not sign anyone in: it emails a verification
 * link, and that link opens a fresh /login with none of the state that led there
 * — often later, sometimes on another tab. So a visitor who started signing up
 * on the way to buying something leaves the address here, and the first
 * successful sign-in afterwards takes them back to it.
 *
 * Kept two days; after that, a sign-in goes to the dashboard as usual.
 */
const KEY = 'svastrino:after-auth'
const TTL = 2 * 24 * 3600 * 1000

export function rememberReturn(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return
  try { localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() })) } catch { /* private mode */ }
}

/** The remembered address, once — it is cleared as it is read. */
export function takeReturn() {
  try {
    const raw = localStorage.getItem(KEY)
    localStorage.removeItem(KEY)
    const v = raw && JSON.parse(raw)
    return v && Date.now() - v.at < TTL ? v.path : null
  } catch {
    return null
  }
}

export function clearReturn() {
  try { localStorage.removeItem(KEY) } catch { /* nothing stored */ }
}
