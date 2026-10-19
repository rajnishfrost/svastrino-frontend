import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * On route change: if the URL has a #hash, bring that section into view (e.g.
 * /skill-build/nirmaan#packages or /services/breakthrough#talk-to-an-expert);
 * otherwise scroll to the top.
 *
 * Arriving from another page, the section is usually not ready at once: the
 * page-change skeleton hides the page for a second, and the section may still
 * be loading its data. Snapping to it and re-snapping as things grew looked
 * like a glitch, so instead the page starts at the top, waits until the
 * section is there and done loading (no aria-busy) and the page has stopped
 * changing size, then glides down to it once.
 */

/**
 * Where to scroll so an anchored section sits in the middle of the SCREEN —
 * equal space above and below it within the whole window, navbar included
 * (user's call, 2026-10-19). If that would tuck the section's top under the
 * sticky navbar (a section nearly as tall as the screen, or taller), it lines
 * up just under the navbar instead, so its beginning is never hidden.
 */
function topFor(el) {
  const nav = document.querySelector('.nav')
  const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0
  const r = el.getBoundingClientRect()
  const centred = (window.innerHeight - r.height) / 2
  const offset = centred >= navBottom + 12 ? centred : navBottom + 12
  return window.scrollY + r.top - offset
}

const glideTo = (el) => window.scrollTo({ top: topFor(el), behavior: 'smooth' })

// How often to check, how many unchanged checks count as "settled", and the
// longest we wait before going anyway.
const TICK_MS = 100
const SETTLED_TICKS = 3
const MAX_WAIT_MS = 6000
// How long after the glide a late shift is still corrected.
const KEEP_MS = 3000

/**
 * Glide to a section and hold it there for KEEP_MS against late layout shifts,
 * letting go the moment the visitor scrolls. Used for a section link clicked
 * when the address already names that section (the router sees no change).
 */
function glideAndHold(el) {
  glideTo(el)
  if (typeof ResizeObserver === 'undefined') return
  let t
  const ro = new ResizeObserver(() => {
    clearTimeout(t)
    t = setTimeout(() => { if (Math.abs(topFor(el) - window.scrollY) > 24) glideTo(el) }, 150)
  })
  const stop = () => {
    ro.disconnect(); clearTimeout(t)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
  }
  ro.observe(document.body)
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchstart', stop, { passive: true })
  window.addEventListener('keydown', stop)
  setTimeout(stop, KEEP_MS)
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  // Links to a section of THIS page (<a href="#which-test">, or a Link to the
  // same path with a #hash). Left to the browser they jump the section to the
  // very top — under the sticky navbar — and when the address already names
  // that section (a second click) the router sees no change, so nothing below
  // ever centres it. Caught first (capture phase), they always glide to the
  // middle: a new #hash goes through the router as usual, the same one glides
  // here.
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!el) return
      e.preventDefault()
      if (url.hash === window.location.hash) glideAndHold(el)
      else navigate({ pathname: url.pathname, search: url.search, hash: url.hash })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate])

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    const id = hash.slice(1)
    // The section, once it can be scrolled to: the page-change skeleton is
    // gone and the section is not marked as still loading.
    const ready = () => {
      if (document.querySelector('[data-route-hold]')) return null
      const el = document.getElementById(id)
      return el && el.getAttribute('aria-busy') !== 'true' ? el : null
    }

    // Already on screen (a link to a section of this same page): glide now —
    // and, below, keep on it while pictures above load in as the glide passes
    // them (lazy images grow the page and used to leave the section low).
    const now = ready()

    // Coming from another page: start at the top while it loads, rather than
    // wherever the previous page was scrolled to (often its footer).
    if (!now) window.scrollTo({ top: 0, behavior: 'instant' })

    let timer
    let cancelled = false
    const started = Date.now()
    let lastHeight = -1
    let settled = 0

    // The visitor takes over the moment they scroll or press a key.
    const letGo = () => { cancelled = true; clearTimeout(timer); unlisten() }
    const unlisten = () => {
      window.removeEventListener('wheel', letGo)
      window.removeEventListener('touchstart', letGo)
      window.removeEventListener('keydown', letGo)
    }
    window.addEventListener('wheel', letGo, { passive: true })
    window.addEventListener('touchstart', letGo, { passive: true })
    window.addEventListener('keydown', letGo)

    // After the glide, something above may still load late (testimonials, an
    // image) and push the section down. For a short while, glide back to it —
    // gently, never a snap — unless the visitor has started scrolling.
    let observer
    let keepTimer
    let reglideTimer
    const keepOnTarget = (el) => {
      if (typeof ResizeObserver === 'undefined') { unlisten(); return }
      observer = new ResizeObserver(() => {
        clearTimeout(reglideTimer)
        reglideTimer = setTimeout(() => {
          if (!cancelled && Math.abs(topFor(el) - window.scrollY) > 24) glideTo(el)
        }, 150)
      })
      observer.observe(document.body)
      keepTimer = setTimeout(() => { observer?.disconnect(); unlisten() }, KEEP_MS)
    }

    const tick = () => {
      if (cancelled) return
      const el = ready()
      const late = Date.now() - started > MAX_WAIT_MS
      if (el) {
        // Sections above may still be growing (prices, images); wait until the
        // page height holds still for a few checks so the glide ends on target.
        const height = document.body.scrollHeight
        settled = height === lastHeight ? settled + 1 : 0
        lastHeight = height
        if (settled >= SETTLED_TICKS || late) {
          glideTo(el)
          keepOnTarget(el)
          return
        }
      } else if (late) {
        unlisten()
        return
      }
      timer = setTimeout(tick, TICK_MS)
    }
    if (now) {
      glideTo(now)
      keepOnTarget(now)
    } else {
      tick()
    }

    return () => {
      letGo()
      observer?.disconnect()
      clearTimeout(keepTimer)
      clearTimeout(reglideTimer)
    }
  }, [pathname, hash])

  return null
}
