import './PageHero.css'

/**
 * Reusable page header band used at the top of inner pages.
 * @param {string}  eyebrow  small uppercase label above the title
 * @param {string}  title    main heading
 * @param {string}  subtitle supporting line
 * @param {node}    children optional CTA buttons / extra content
 */
export default function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-hero">
      <div className="container">
        {eyebrow && <p className="page-hero-eyebrow">{eyebrow}</p>}
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        {children && <div className="page-hero-actions">{children}</div>}
      </div>
    </header>
  )
}
