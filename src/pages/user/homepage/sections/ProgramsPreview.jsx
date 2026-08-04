import { Link } from 'react-router-dom'

const PROGRAMS = [
  { name: 'Model Session', desc: '15-min exploratory call to identify your needs.', tag: '15 min' },
  { name: "Bull's Eye", desc: 'Focused 2-hour session for immediate clarity.', tag: '2 hours' },
  { name: 'Bloom', desc: '2-month journey ending in a 5-year career plan.', tag: '2 months' },
  { name: 'Breakthrough', desc: '2-year mentoring for leadership & entrepreneurship.', tag: '2 years' },
]

export default function ProgramsPreview() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <p className="section-eyebrow">Mentoring</p>
          <h2 className="section-title">1-on-1 guidance, your pace</h2>
          <p className="section-sub">
            Consultancy programs tailored to where you are in your journey.
          </p>
        </div>
        <div className="grid grid-4">
          {PROGRAMS.map((p) => (
            <div key={p.name} className="card home-program-card">
              <span className="home-program-tag">{p.tag}</span>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center" style={{ marginTop: 'var(--space-5)' }}>
          <Link to="/mentoring" className="btn btn-secondary">
            View all mentoring programs
          </Link>
        </div>
      </div>
    </section>
  )
}
