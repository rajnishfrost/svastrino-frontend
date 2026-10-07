import { useEffect, useRef, useState } from 'react'

/** How long a deliberate loading skeleton stays up on a page or tab change. */
export const HOLD_MS = 1000

/**
 * True for HOLD_MS after `key` changes (a dashboard tab, say) — never on the
 * first render, and not when the key first arrives from nothing (a redirect
 * like /dashboard → /dashboard/services is not a visitor's choice).
 * Decided during render, so the first frame after the change is already held.
 */
export function useKeyHold(key, ms = HOLD_MS) {
  const [s, setS] = useState({ key, holding: false })
  let { holding } = s
  if (s.key !== key) {
    holding = s.key !== undefined
    setS({ key, holding })
  }
  useEffect(() => {
    if (!s.holding) return
    const k = s.key
    const t = setTimeout(() => setS((x) => (x.key === k ? { ...x, holding: false } : x)), ms)
    return () => clearTimeout(t)
  }, [s, ms])
  return holding
}

/** Ref for the real content: eases it in at the moment a hold ends. */
export function useRevealFade(holding) {
  const ref = useRef(null)
  const was = useRef(false)
  useEffect(() => {
    if (was.current && !holding && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      ref.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' })
    }
    was.current = holding
  }, [holding])
  return ref
}
