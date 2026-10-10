import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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
 * Where to scroll so an anchored section sits in the middle of what the
 * visitor can see — the space between the sticky navbar and the bottom of the
 * screen. A section taller than that space lines up just under the navbar
 * instead, so its beginning is never hidden.
 */
function topFor(el) {
  const nav = document.querySelector('.nav')
  const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0
  const visible = window.innerHeight - navBottom
  const r = el.getBoundingClientRect()
  const gap = r.height < visible ? (visible - r.height) / 2 : 12
  return window.scrollY + r.top - navBottom - gap
}

const glideTo = (el) => window.scrollTo({ top: topFor(el), behavior: 'smooth' })

// How often to check, how many unchanged checks count as "settled", and the
// longest we wait before going anyway.
const TICK_MS = 100
const SETTLED_TICKS = 3
const MAX_WAIT_MS = 6000

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

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

    // Already on screen (a link to a section of this same page): glide now.
    const now = ready()
    if (now) {
      glideTo(now)
      return
    }

    // Coming from another page: start at the top while it loads, rather than
    // wherever the previous page was scrolled to (often its footer).
    window.scrollTo({ top: 0, behavior: 'instant' })

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
          unlisten()
          glideTo(el)
          return
        }
      } else if (late) {
        unlisten()
        return
      }
      timer = setTimeout(tick, TICK_MS)
    }
    tick()

    return letGo
  }, [pathname, hash])

  return null
}
