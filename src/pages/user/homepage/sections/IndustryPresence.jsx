/**
 * Home · "Institutions That Trust Us" — a logo wall that scrolls on its own.
 *
 * STATIC PLACEHOLDERS for now. These eight logos live in /public/partners and
 * are stand-ins so the band reads as a real logo wall while the partner list is
 * still being built. To switch to real partners later, fetch
 * GET /user/organisations and map its `logo` + `name` onto the same shape —
 * nothing else in this component needs to change.
 */
const PARTNERS = [
  { name: 'Greenwood High', logo: '/partners/greenwood.svg' },
  { name: "St. Mary's Academy", logo: '/partners/stmarys.svg' },
  { name: 'Nova International', logo: '/partners/nova.svg' },
  { name: 'Cambridge Public', logo: '/partners/cambridge.svg' },
  { name: 'Horizon Academy', logo: '/partners/horizon.svg' },
  { name: 'Sunrise Vidyalaya', logo: '/partners/sunrise.svg' },
  { name: 'Pinnacle Institute', logo: '/partners/pinnacle.svg' },
  { name: 'Everest Global School', logo: '/partners/everest.svg' },
]

export default function IndustryPresence() {
  // Doubled so the marquee loops without a visible seam.
  const reel = [...PARTNERS, ...PARTNERS]

  return (
    <section className="section home-partners-section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Institutions That Trust Us</h2>
        </div>
      </div>

      <div className="home-partner-rail">
        <ul className="home-partner-reel">
          {reel.map((p, i) => (
            <li key={`${p.name}-${i}`} className="home-partner" aria-hidden={i >= PARTNERS.length}>
              <img src={p.logo} alt={p.name} loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
