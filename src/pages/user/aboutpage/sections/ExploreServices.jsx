import { Link } from 'react-router-dom'

/**
 * About · the closing strip. Having read who we are, the visitor is handed
 * straight to the service that matches what they came for.
 */
const ROUTES = [
  { need: 'For immediate career counselling', label: "Bull's Eye Program", to: '/services/bulls-eye' },
  { need: 'Choosing a career through deep self-reflection', label: 'Bloom Program', to: '/services/bloom' },
  { need: 'To transform completely through long-term mentoring', label: 'Breakthrough Program', to: '/services/breakthrough' },
  { need: 'To build skills and yourself', label: 'Nirmaan', to: '/skill-build/nirmaan' },
  { need: 'To verify your potential & career scientifically', label: 'Psychometric Testing', to: '/skill-build/psychometric-testing' },
]

export default function ExploreServices() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">
            Now that you know us, let us assist in exploring our services
          </h2>
        </div>
        <ul className="about-routes">
          {ROUTES.map((r) => (
            <li key={r.to}>
              <span className="about-route-need">{r.need}</span>
              <Link to={r.to} className="about-route-link">{r.label} →</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
