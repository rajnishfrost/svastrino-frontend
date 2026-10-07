import './Skeleton.css'

/**
 * Skeleton loaders — the one "waiting for data" look for the whole site.
 *
 * Every preset is wrapped in `.skel`, which keeps it invisible for the first
 * ~200ms and then fades it in (see Skeleton.css). A response that lands sooner
 * never shows a placeholder at all, so quick navigations don't flash.
 *
 * Pick the preset shaped like the page it stands in for, so the real content
 * replaces it without the layout jumping.
 */

const LINE_WIDTHS = ['100%', '94%', '88%', '97%', '72%']

/** One placeholder block. */
export function Bone({ w = '100%', h = 12, round, circle, style, className = '' }) {
  const cls = ['skel-bone', round && 'skel-bone--round', circle && 'skel-bone--circle', className]
    .filter(Boolean).join(' ')
  return <span className={cls} style={{ width: w, height: h, ...style }} />
}

/** Lines of body text; the last one is shorter, like a real paragraph. */
export function SkeletonLines({ lines = 3 }) {
  return (
    <div className="skel-text">
      {Array.from({ length: lines }, (_, i) => (
        <Bone key={i} w={i === lines - 1 && lines > 1 ? '62%' : LINE_WIDTHS[i % LINE_WIDTHS.length]} />
      ))}
    </div>
  )
}

/** Screen-reader announcement + the fade-in wrapper every preset shares. */
function Wrap({ label = 'Loading', className = '', style, children }) {
  return (
    <div className={`skel ${className}`} style={style}>
      <span className="skel-sr" role="status">{label}…</span>
      <div aria-hidden>{children}</div>
    </div>
  )
}

/** Stand-in for <PageHero>: same navy band, so the page doesn't change height. */
export function SkeletonHero({ subtitle = true }) {
  return (
    <header className="page-hero">
      <div className="container">
        <Wrap className="skel--on-dark" label="Loading page">
          <div className="skel-hero">
            <Bone w={90} h={12} round />
            <Bone w={420} h={34} />
            {subtitle && <Bone w={520} h={14} />}
            {subtitle && <Bone w={360} h={14} />}
          </div>
        </Wrap>
      </div>
    </header>
  )
}

/** A grid of cards (blog posts, programs, offers…). Responsive by itself. */
export function SkeletonCards({ count = 3, media = true, minWidth = 280, label }) {
  return (
    <Wrap label={label}>
      <div className="skel-cards" style={{ '--skel-card-min': `${minWidth}px` }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skel-card">
            {media && <Bone h={160} style={{ borderRadius: 0 }} />}
            <div className="skel-card-body">
              <Bone w={80} h={18} round />
              <Bone w="85%" h={18} />
              <SkeletonLines lines={3} />
              <Bone w={120} h={36} round style={{ marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </Wrap>
  )
}

/** Stacked rows (tickets, sessions, notifications…). */
export function SkeletonList({ rows = 4, avatar = false, label }) {
  return (
    <Wrap label={label}>
      <div className="skel-list">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skel-row">
            {avatar && <Bone w={40} h={40} circle />}
            <div className="skel-row-main">
              <Bone w={i % 2 ? '55%' : '70%'} h={14} />
              <Bone w="40%" h={11} />
            </div>
            <Bone w={72} h={26} round />
          </div>
        ))}
      </div>
    </Wrap>
  )
}

/** A data table (admin lists, orders). Collapses to two columns on phones. */
export function SkeletonTable({ rows = 6, cols = 4, label }) {
  return (
    <Wrap label={label}>
      <div className="skel-table" style={{ '--skel-cols': cols }}>
        {Array.from({ length: rows + 1 }, (_, r) => (
          <div key={r} className="skel-table-row">
            {Array.from({ length: cols }, (_, c) => (
              <Bone key={c} w={r === 0 ? '50%' : `${60 + ((r * 7 + c * 13) % 35)}%`} />
            ))}
          </div>
        ))}
      </div>
    </Wrap>
  )
}

/** A long-form page body (blog post, career-library course). */
export function SkeletonArticle({ label }) {
  return (
    <Wrap label={label}>
      <div className="skel-article">
        <Bone h={300} style={{ borderRadius: 14 }} />
        <Bone w="80%" h={28} style={{ marginTop: 10 }} />
        <Bone w={180} h={12} />
        <div style={{ height: 8 }} />
        <SkeletonLines lines={5} />
        <div style={{ height: 8 }} />
        <SkeletonLines lines={4} />
      </div>
    </Wrap>
  )
}

/** A settings / checkout style form. */
export function SkeletonForm({ fields = 4, label }) {
  return (
    <Wrap label={label}>
      <div className="skel-form">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="skel-field">
            <Bone w={110} h={11} />
            <Bone h={42} style={{ borderRadius: 10 }} />
          </div>
        ))}
        <Bone w={150} h={44} round />
      </div>
    </Wrap>
  )
}

/** Whole page with nothing known yet: hero band + a section of cards. */
export function SkeletonPage({ cards = 3 }) {
  return (
    <>
      <SkeletonHero />
      <section className="skel-section">
        <div className="container"><SkeletonCards count={cards} media={false} /></div>
      </section>
    </>
  )
}

/** A section-sized block inside a page that has already rendered its chrome.
 *  `now` shows it at once (a deliberate hold) instead of after the delay. */
export function SkeletonSection({ children, now = false }) {
  return (
    <section className={`skel-section${now ? ' skel--now' : ''}`}>
      <div className="container">{children}</div>
    </section>
  )
}

/** Body of a page held on arrival: intro lines + a row of cards, shown at once. */
export function SkeletonBody({ label = 'Loading' }) {
  return (
    <SkeletonSection now>
      <div className="skel"><SkeletonLines lines={4} /></div>
      <div style={{ height: 32 }} />
      <SkeletonCards count={3} media={false} label={label} />
    </SkeletonSection>
  )
}

/**
 * Stand-in for a light split hero (programs, Nirmaan, psychometric): same
 * band and height as the real one, with the title, text, buttons and
 * illustration as bones — so the whole first screen visibly loads.
 * `background` lets a themed page (Nirmaan cream) keep its own wash.
 */
export function SkeletonSplitHero({ background }) {
  return (
    <header className="page-hero page-hero--split" style={background ? { background } : undefined}>
      <div className="container">
        <div className="skel skel--now">
          <span className="skel-sr" role="status">Loading page…</span>
          <div className="skel-split-copy" aria-hidden>
            <Bone w={150} h={12} round />
            <Bone w="90%" h={40} />
            <Bone w="65%" h={40} />
            <div style={{ height: 4 }} />
            <Bone w="85%" h={14} />
            <Bone w="70%" h={14} />
            <div className="skel-split-actions">
              <Bone w={150} h={52} round />
              <Bone w={150} h={52} round />
            </div>
          </div>
        </div>
        <div className="skel skel--now skel-split-figure" aria-hidden>
          <Bone w="min(100%, 400px)" h={340} style={{ borderRadius: 32 }} />
        </div>
      </div>
      <div className="page-hero-wave" aria-hidden>
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none">
          <path fill="#ffffff" d="M0,64 C240,110 480,110 720,80 C960,50 1200,20 1440,48 L1440,110 L0,110 Z" />
        </svg>
      </div>
    </header>
  )
}

/** The content panel of a dashboard tab: heading + a few rows. */
export function SkeletonDashPanel({ label = 'Loading' }) {
  return (
    <div className="skel skel--now">
      <span className="skel-sr" role="status">{label}…</span>
      <div aria-hidden>
        <Bone w={160} h={24} />
        <div style={{ height: 18 }} />
        <div className="skel-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skel-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 12 }}>
                <Bone w="45%" h={16} />
                <Bone w={80} h={24} round />
              </div>
              <div style={{ width: '100%' }}><SkeletonLines lines={2} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Whole dashboard: page title, sidebar tabs and a panel — same grid as the real one. */
export function SkeletonDashboard() {
  return (
    <section className="skel-section">
      <div className="container skel skel--now">
        <span className="skel-sr" role="status">Loading your dashboard…</span>
        <div aria-hidden>
          <div className="skel-dash-head">
            <Bone w={200} h={32} />
            <Bone w={180} h={14} style={{ marginTop: 12 }} />
          </div>
          <div className="skel-dash-grid">
            <div className="skel-dash-nav">
              {[0, 1, 2, 3].map((i) => <Bone key={i} w="100%" h={42} style={{ borderRadius: 10, minWidth: 120 }} />)}
            </div>
            <SkeletonDashPanel label="Loading your dashboard" />
          </div>
        </div>
      </div>
    </section>
  )
}
