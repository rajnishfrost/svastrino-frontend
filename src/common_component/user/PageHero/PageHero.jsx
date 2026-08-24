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
 */
export default function PageHero({ eyebrow, title, subtitle, children, bgImage }) {
  const style = bgImage
    ? {
        backgroundImage: `linear-gradient(115deg, rgba(10,31,67,0.94) 0%, rgba(15,44,92,0.78) 60%, rgba(15,44,92,0.62) 100%), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  return (
    <header className={`page-hero${bgImage ? ' page-hero--image' : ''}`} style={style}>
      <div className="container">
        {eyebrow && <p className="page-hero-eyebrow">{eyebrow}</p>}
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        {children && <div className="page-hero-actions">{children}</div>}
      </div>
    </header>
  )
}
