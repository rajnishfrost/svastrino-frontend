import './PageHero.css'

/**
 * Reusable page header band used at the top of inner pages.
 * @param {string}  eyebrow  small uppercase label above the title
 * @param {string}  title    main heading
 * @param {string}  subtitle supporting line
 * @param {node}    children optional CTA buttons / extra content
 * @param {string}  bgImage  optional themed background photo. A dark navy
 *                           overlay is layered on top so the white text stays
 *                           readable; falls back to the plain navy band.
 * @param {node}    illustration optional side visual (a flat vector illustration).
 *                           When present the band becomes a left-aligned two-column
 *                           split (copy left, art right); ignored together with
 *                           bgImage — a split hero keeps the plain navy band.
 */
export default function PageHero({ eyebrow, title, subtitle, children, bgImage, illustration }) {
  const style = bgImage && !illustration
    ? {
        backgroundImage: `linear-gradient(115deg, rgba(10,31,67,0.94) 0%, rgba(15,44,92,0.80) 55%, rgba(15,44,92,0.60) 100%), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  const cls = [
    'page-hero',
    bgImage && !illustration ? 'page-hero--image' : '',
    illustration ? 'page-hero--split' : '',
  ].filter(Boolean).join(' ')

  return (
    <header className={cls} style={style}>
      <div className="container">
        <div className="page-hero-copy">
          {eyebrow && <p className="page-hero-eyebrow">{eyebrow}</p>}
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-sub">{subtitle}</p>}
          {children && <div className="page-hero-actions">{children}</div>}
        </div>
        {illustration && <div className="page-hero-figure">{illustration}</div>}
      </div>

      {/* Curved divider into the white section below (light split hero only). */}
      {illustration && (
        <div className="page-hero-wave" aria-hidden>
          <svg viewBox="0 0 1440 110" preserveAspectRatio="none">
            <path
              fill="#ffffff"
              d="M0,64 C240,110 480,110 720,80 C960,50 1200,20 1440,48 L1440,110 L0,110 Z"
            />
          </svg>
        </div>
      )}
    </header>
  )
}
