import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SkeletonSplitHero, SkeletonBody, SkeletonDashboard } from './Skeleton.jsx'
import { HOLD_MS, useRevealFade } from './useHold.js'

// The Skill-Build pages (Nirmaan, Psychometric Testing) wear a cream→white
// wash on their hero, so the skeleton matches it — the white hero wave then
// reads as a curve against the cream, same as the real page. Everything else
// keeps the blue hero wash. (Mirrors Tailwind `bg-gradient-to-br
// from-nirmaan-cream to-white`.)
const SKILL_BUILD_BG = 'linear-gradient(to bottom right, #faf6ec, #ffffff)'

/** Same "page" for hold purposes: pagination and tab-style sibling routes. */
function family(path) {
  const p = path.replace(/\/page\/\d+\/?$/, '').replace(/\/$/, '') || '/'
  if (p.startsWith('/dashboard')) return '/dashboard' // tabs hold their own panel (Dashboard.jsx)
  if (p.startsWith('/resources')) return '/resources' // Career Library / FAQs / Stories tabs
  return p
}

/**
 * One consistent page-to-page transition for the whole public site.
 *
 * When the visitor clicks through to a different page, the whole screen shows
 * a page skeleton for a second and then the page appears — the same on every
 * page, instead of each one flickering in its own way. The incoming page is
 * mounted (hidden) from the first moment, so its data loads during the hold;
 * if it still isn't ready afterwards, the page's own skeleton takes over.
 *
 * Not held: a direct visit (typed address, Google, prerender — location.key is
 * 'default'), #anchors on the same page, pagination, and tab-style siblings
 * (the Resources tabs), where a pause would only feel slow. Dashboard tabs
 * hold just their panel instead (useKeyHold in Dashboard.jsx), and arriving
 * at the dashboard shows a skeleton shaped like it.
 */
export default function RouteHold({ children }) {
  const location = useLocation()
  const [state, setState] = useState({ path: location.pathname, holding: false })

  // Decide during render, so the very first frame of the new page is already
  // the skeleton (an effect would let the real page flash for one frame).
  let { holding } = state
  if (state.path !== location.pathname) {
    if (location.key !== 'default' && family(state.path) !== family(location.pathname)) {
      holding = true
      setState({ path: location.pathname, holding, since: Date.now() })
    } else {
      // Same page family (e.g. /dashboard redirecting to /dashboard/services
      // mid-hold): keep any hold already running, on its original clock.
      setState({ ...state, path: location.pathname })
    }
  }

  useEffect(() => {
    if (!state.holding) return
    const since = state.since
    const t = setTimeout(
      () => setState((s) => (s.since === since ? { ...s, holding: false } : s)),
      Math.max(0, HOLD_MS - (Date.now() - since)),
    )
    return () => clearTimeout(t)
  }, [state.holding, state.since])

  // Ease the real page in when the hold ends.
  const pageRef = useRevealFade(holding)

  return (
    <>
      {holding && (
        <div data-route-hold>
          {location.pathname.startsWith('/dashboard') ? (
            // The dashboard has no hero — its skeleton is shaped like it.
            <SkeletonDashboard />
          ) : (
            <>
              <SkeletonSplitHero background={location.pathname.startsWith('/skill-build') ? SKILL_BUILD_BG : undefined} />
              <SkeletonBody label="Loading the page" />
            </>
          )}
        </div>
      )}
      <div ref={pageRef} style={holding ? { display: 'none' } : undefined}>
        {children}
      </div>
    </>
  )
}
