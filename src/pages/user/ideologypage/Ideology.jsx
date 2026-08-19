import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import './Ideology.css'

/**
 * Our Ideology — the five beliefs the mentoring is built on. Deliberately a
 * page of its own rather than a section of About: a visitor who wants to know
 * WHY we work this way is asking a different question from one who wants to
 * know who we are.
 */
const PILLARS = [
  {
    title: 'Understand Before You Choose',
    text: 'We believe informed career choices begin with truly understanding the individual first.',
  },
  {
    title: 'Develop Beyond Academics',
    text: 'We develop mindset, confidence, skills, and character alongside academic growth.',
  },
  {
    title: 'Learning Leads to Action',
    text: 'We turn knowledge into real experiences, purposeful habits and measurable growth.',
  },
  {
    title: 'Every Student Can Grow',
    text: 'With the right guidance, opportunities, effort and continuous learning, every student can grow.',
  },
  {
    title: 'Prepare for Life, Not Just Careers',
    text: 'We prepare students for the uncertainty and challenges that come with any path they choose.',
  },
]

const ROUTES = [
  { need: 'For immediate career counselling', label: "Bull's Eye Program", to: '/services/bulls-eye' },
  { need: 'Choosing a career through deep self-reflection', label: 'Bloom Program', to: '/services/bloom' },
  { need: 'To transform completely through long-term mentoring', label: 'Breakthrough Program', to: '/services/breakthrough' },
  { need: 'To build skills and yourself', label: 'Nirmaan', to: '/skill-build/nirmaan' },
  { need: 'To verify your potential & career scientifically', label: 'Psychometric Testing', to: '/skill-build/psychometric-testing' },
]

export default function Ideology() {
  return (
    <>
      <PageHero
        eyebrow="Our Ideology"
        title="The pillars our mentoring is built on"
        subtitle="Five beliefs that decide how every session, every task and every plan is shaped."
      />

      <section className="section">
        <div className="container">
          <ol className="ideology-pillars">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="card ideology-pillar">
                <span className="ideology-pillar-n" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2>{p.title}</h2>
                <p>{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">
              Now that you relate to our ideologies, let us help you explore our services
            </h2>
          </div>
          <ul className="ideology-routes">
            {ROUTES.map((r) => (
              <li key={r.to}>
                <span className="ideology-route-need">{r.need}</span>
                <Link to={r.to} className="ideology-route-link">{r.label} →</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
