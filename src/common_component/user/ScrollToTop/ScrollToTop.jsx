import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'

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
 *
 * Back and Forward are different: they return to exactly where the visitor
 * was on that page. Every page visit's scroll position is remembered (by its
 * history entry) and restored once the page has loaded enough to reach it —
 * instead of the top, or re-gliding to a section they had scrolled away from.
 */

/**
 * Where to scroll so an anchored section sits in the middle of the SCREEN —
 * equal space above and below it within the whole window, navbar included
 * (user's call, 2026-10-19). If that would tuck the section's top under the
 * sticky navbar (a section nearly as tall as the screen, or taller), it lines
 * up just under the navbar instead, so its beginning is never hidden.
 */
function topFor(el) {
  // A section may name the part that matters (data-scroll-focus) — e.g. the
  // free-trial card inside its tall green band — and that part is centred.
  const target = el.querySelector?.('[data-scroll-focus]') || el
  const nav = document.querySelector('.nav')
  const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0
  const r = target.getBoundingClientRect()
  const h = window.innerHeight
  const centred = (h - r.height) / 2
  const offset = centred >= navBottom + 8
    ? centred // the middle of the whole screen
    : r.height <= h - navBottom
      ? navBottom + (h - navBottom - r.height) / 2 // too tall for that: the middle of the space under the navbar
      : navBottom + 12 // taller than the screen: its top just under the navbar
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

// Remembered scroll positions, by history entry (location.key). Session
// storage, so they survive a reload of the tab too.
const posKey = (key) => `scroll:${key}`
// True while a Back/Forward restore is waiting for the page: the scroll events
// it causes on the way (a short page clamping to its end) are not the visitor's.
let restoring = false
const pageHeight = () => document.documentElement.scrollHeight
// The page's height is kept with the position: restoring before the page is
// back to that height (sections above still loading) lands on the wrong part
// of it — and when they grow in, the browser's scroll anchoring carries the
// view along, so the wrong spot then gets remembered too.
const savePos = (key, y) => {
  if (restoring) return
  try { sessionStorage.setItem(posKey(key), JSON.stringify({ y: Math.round(y), h: pageHeight() })) } catch { /* private mode */ }
}
const readPos = (key) => {
  try {
    const v = JSON.parse(sessionStorage.getItem(posKey(key)))
    if (typeof v === 'number') return { y: v, h: 0 } // saved before heights were kept
    return v && typeof v.y === 'number' ? v : null
  } catch { return null }
}

/**
 * Back/Forward: put the page back at `y` once it is as it was — the page-change
 * skeleton is gone and the page has grown back to the height it had (its
 * sections have loaded). Instant, as a browser restores. If it never gets
 * there, after a few seconds it goes as close as it can. Returns a cancel
 * function.
 */
function restorePos({ y, h }) {
  let cancelled = false
  let timer
  const started = Date.now()
  restoring = true
  const done = () => { restoring = false }
  const go = () => {
    if (cancelled) return
    const held = document.querySelector('[data-route-hold]')
    const max = pageHeight() - window.innerHeight
    if (!held && max >= y - 2 && pageHeight() >= h - 2) {
      done()
      window.scrollTo({ top: y, behavior: 'instant' })
      return
    }
    if (Date.now() - started > MAX_WAIT_MS) {
      done()
      if (!held) window.scrollTo({ top: Math.min(y, Math.max(0, max)), behavior: 'instant' })
      return
    }
    timer = setTimeout(go, TICK_MS)
  }
  go()
  return () => { cancelled = true; clearTimeout(timer); done() }
}

export default function ScrollToTop() {
  const location = useLocation()
  const { pathname, hash, key } = location
  const navType = useNavigationType()
  const navigate = useNavigate()
  const keyRef = useRef(key)
  keyRef.current = key
  // The page the tab opened on (or was reloaded on) is not a Back/Forward
  // return, even though the router reports it as POP — only once the visitor
  // has moved on from it is a POP a return.
  const firstKey = useRef(key)
  const moved = useRef(false)
  if (key !== firstKey.current) moved.current = true
  const lastLoc = useRef(null)

  // We restore positions ourselves; the browser's own attempt (on a page that
  // is still loading) would only fight it.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // Remember where this page is scrolled to, as the visitor scrolls — and at
  // the moment they click a link away, before anything moves.
  useEffect(() => {
    let t
    const onScroll = () => { clearTimeout(t); t = setTimeout(() => savePos(key, window.scrollY), 120) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t) }
  }, [key])
  useEffect(() => {
    const onDown = () => savePos(keyRef.current, window.scrollY)
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onDown, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onDown, true)
    }
  }, [])

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
    // A page noting a choice in its own address (the booking wizard writes the
    // picked date and time as ?date=&start=) is not a new page: stay put.
    const prev = lastLoc.current
    lastLoc.current = { pathname, hash }
    if (navType === 'REPLACE' && prev && prev.pathname === pathname && prev.hash === hash) {
      savePos(key, window.scrollY)
      return
    }

    // Back / Forward to a page we have been on: exactly where the visitor was.
    // (Not on the first load — an outside link to a #section still glides.)
    if (navType === 'POP' && moved.current) {
      const saved = readPos(key)
      if (saved) return restorePos(saved)
    }

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
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
