import { Link } from 'react-router-dom'

/**
 * Home · section 5 — the way out for a visitor who is not ready to choose a
 * service yet. Two free, no-commitment routes instead of a dead end.
 */
const WAYS = [
  {
    need: 'I Want to Explore Various Careers & Courses',
    text: 'Check out different careers, courses and pathways to see what could be a good fit for you.',
    cta: 'Browse Career Library →',
    to: '/resources/career-library',
  },
  {
    need: 'I Want to Learn & Grow',
    text: 'Get practical tips on careers, skills, mindset and personal growth to help you move forward.',
    cta: 'Read Our Blogs →',
    to: '/blog',
  },
]

export default function OtherResources() {
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Not Ready To Choose from Services Yet?</h2>
          <p className="section-sub">
            Explore other ways we can help — career details, courses and practical guidance
            at your own pace.
          </p>
        </div>
        <div className="grid grid-2">
          {WAYS.map((w) => (
            <article key={w.to} className="card home-way">
              <h3>{w.need}</h3>
              <p>{w.text}</p>
              <Link to={w.to} className="btn btn-secondary">{w.cta}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
