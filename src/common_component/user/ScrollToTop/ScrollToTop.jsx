import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On route change: if the URL has a #hash, scroll to that element (e.g.
 * /skill-build/nirmaan#packages or /services/breakthrough#talk-to-an-expert);
 * otherwise scroll to the top.
 *
 * The target often mounts a while AFTER navigation — many pages render the
 * anchored section only once their data has loaded from the API. So instead of
 * a single retry we poll for a short window until the element appears, then
 * re-align once more after layout settles (async hero images can shift it).
 */
/**
 * Bring an anchored section into the middle of what the visitor can see — the
 * space between the sticky navbar and the bottom of the screen — so the eye
 * lands on it. A section taller than that space can't be centred; it lines up
 * just under the navbar instead, so its beginning is never hidden.
 */
function centerOnScreen(el) {
  const nav = document.querySelector('.nav')
  const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0
  const visible = window.innerHeight - navBottom
  const r = el.getBoundingClientRect()
  const gap = r.height < visible ? (visible - r.height) / 2 : 12
  window.scrollTo({ top: window.scrollY + r.top - navBottom - gap, behavior: 'instant' })
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    const id = hash.slice(1)
    let cancelled = false
    let timer
    let tries = 0
    let observer
    let settleTimer

    // Once the target is placed, sections above it are often still loading
    // (prices, images, FAQs) and grow, pushing the target down — the visitor
    // saw it land and then jump. So for a short while every layout change
    // re-centres it immediately, and the moment the visitor scrolls or taps
    // we let go and never fight them.
    const SETTLE_MS = 2500
    const stopFollowing = () => {
      observer?.disconnect(); observer = null
      clearTimeout(settleTimer)
      window.removeEventListener('wheel', stopFollowing)
      window.removeEventListener('touchstart', stopFollowing)
      window.removeEventListener('keydown', stopFollowing)
    }
    const follow = () => {
      if (typeof ResizeObserver === 'undefined') return
      observer = new ResizeObserver(() => {
        const el = document.getElementById(id)
        if (!cancelled && el) centerOnScreen(el)
      })
      observer.observe(document.body)
      settleTimer = setTimeout(stopFollowing, SETTLE_MS)
      window.addEventListener('wheel', stopFollowing, { passive: true })
      window.addEventListener('touchstart', stopFollowing, { passive: true })
      window.addEventListener('keydown', stopFollowing)
    }

    const scrollToEl = () => {
      if (cancelled) return
      // While the page-change skeleton is up the real page is hidden, so an
      // anchor in it can't be scrolled to yet — keep polling until it shows.
      const el = document.querySelector('[data-route-hold]') ? null : document.getElementById(id)
      if (el) {
        centerOnScreen(el)
        follow()
        return
      }
      // Target (or its async content) may still be loading — keep trying briefly
      // (~40 × 70ms ≈ 2.8s) before giving up.
      if (tries++ < 40) timer = setTimeout(scrollToEl, 70)
    }

    scrollToEl()
    return () => { cancelled = true; clearTimeout(timer); stopFollowing() }
  }, [pathname, hash])

  return null
}
