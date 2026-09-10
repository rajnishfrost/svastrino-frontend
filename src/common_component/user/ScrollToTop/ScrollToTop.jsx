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

    const scrollToEl = () => {
      if (cancelled) return
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' })
        // Re-align once the page has settled (late images can shift the target).
        timer = setTimeout(() => {
          if (!cancelled) document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' })
        }, 350)
        return
      }
      // Target (or its async content) may still be loading — keep trying briefly
      // (~40 × 70ms ≈ 2.8s) before giving up.
      if (tries++ < 40) timer = setTimeout(scrollToEl, 70)
    }

    scrollToEl()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [pathname, hash])

  return null
}
