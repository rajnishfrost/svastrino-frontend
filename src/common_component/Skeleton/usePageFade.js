import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Eases the incoming page in on every route change instead of letting it snap
 * into place. Animates the container in place (Web Animations API), so the
 * page is NOT remounted — dashboard tabs, blog pagination and the like keep
 * their state. Opacity only: a transform on <main> would re-anchor any
 * position:fixed child for the length of the animation.
 *
 * Skipped on the first render (the prerendered page is already there) and for
 * visitors who ask for reduced motion.
 */
export function usePageFade() {
  const ref = useRef(null)
  const { pathname } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    ref.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' })
  }, [pathname])

  return ref
}
