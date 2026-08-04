import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On route change: if the URL has a #hash, scroll to that element (e.g.
 * /skill-build/nirmaan#packages); otherwise scroll to the top. A short retry
 * covers the case where the target section mounts a tick after navigation.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const scrollToEl = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' })
          return true
        }
        return false
      }
      // Try now, then once more after the next paint (target may still be mounting).
      if (!scrollToEl()) {
        const t = setTimeout(scrollToEl, 60)
        return () => clearTimeout(t)
      }
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
