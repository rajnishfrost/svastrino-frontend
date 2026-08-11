import { Link } from 'react-router-dom'

// Two sub-categories → their programs, each linking to its own page.
const GROUPS = [
  {
    category: 'Career Counselling',
    programs: [
      { name: "Bull's Eye Program", desc: 'Focused sessions for immediate clarity.', tag: '3 sessions', to: '/services/bulls-eye' },
    ],
  },
  {
    category: 'Personalised Mentoring',
    programs: [
      { name: 'Bloom Program', desc: 'A journey ending in a 5-year career plan.', tag: '5 sessions', to: '/services/bloom' },
      { name: 'Breakthrough Program', desc: 'Long-term mentoring for leadership & entrepreneurship.', tag: '22 sessions', to: '/services/breakthrough' },
    ],
  },
]

export default function ProgramsPreview() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <p className="section-eyebrow">Services</p>
          <h2 className="section-title">Career Counselling & Mentoring</h2>
          <p className="section-sub">
            One-on-one guidance tailored to where you are in your journey.
          </p>
        </div>
        <div className="grid grid-3">
          {GROUPS.flatMap((g) => g.programs.map((p) => (
            <Link key={p.name} to={p.to} className="card home-program-card">
              <span className="home-program-tag">{p.tag}</span>
              <h3>{p.name}</h3>
              <p className="home-program-cat">{g.category}</p>
              <p>{p.desc}</p>
            </Link>
          )))}
        </div>
        <div className="text-center" style={{ marginTop: 'var(--space-5)' }}>
          <Link to="/services" className="btn btn-secondary">
            View all services
          </Link>
        </div>
      </div>
    </section>
  )
}
