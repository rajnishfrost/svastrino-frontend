import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import './About.css'

// Static page copy (story, approach, milestones) — it changes rarely, so it
// lives here rather than in the DB. Programs, FAQs and success stories are
// dynamic and come from /api/user/content.

const APPROACH = [
  {
    step: '01',
    title: 'Understanding the core issues',
    desc: 'We take the time to carefully listen to your concerns and help you identify the core issues standing in the way of your success.',
  },
  {
    step: '02',
    title: 'Formulating a unique career plan',
    desc: 'Our team works with you to create a personalised career mentoring program that focuses your energy on achieving your vision.',
  },
  {
    step: '03',
    title: 'Initiating the developmental process',
    desc: 'We guide you through the implementation of the planned strategy, turning intent into steady action.',
  },
  {
    step: '04',
    title: 'Balancing and aligning',
    desc: 'We help you find equilibrium between your career aspirations and personal life through self-evaluative and introspective realisations.',
  },
  {
    step: '05',
    title: 'Realising the planned results',
    desc: 'We support you all the way to your milestones and long-term objectives.',
  },
]

const MILESTONES = [
  { year: '2009', text: 'Svastrino is founded by Rohit M. Gala, starting with 20 students in Mumbai — guidance delivered through home visits.' },
  { year: '2016', text: 'Featured in The Economic Times for a commitment to guiding students towards their dream careers. Online mentoring begins.' },
  { year: '2017', text: 'Reach expands beyond India to the Middle East and the African continent.' },
  { year: 'Today', text: 'A nationwide and international practice offering four mentoring programs, plus Skill-Build courses.' },
]

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="About Svastrino"
        subtitle="Futuristic career guidance — helping people build career plans aligned to who they actually are."
      />

      {/* ---- Story ---- */}
      <section className="section">
        <div className="container about-narrow">
          <h2 className="section-title" style={{ textAlign: 'left' }}>Our story</h2>
          <p>
            Svastrino began in <strong>2009</strong>, when founder <strong>Rohit M. Gala</strong> went
            looking for career guidance himself and found nothing that treated him as an individual.
            He started with 20 students in Mumbai, visiting them at home. What began as a
            frustration became a practice built on a simple idea: no student should have to guess
            their way into a career.
          </p>
          <p>
            Today Svastrino is a career mentoring consultancy serving students and professionals
            across India and abroad — from 8th grade through post-graduation and into mid-career
            transitions. Every session is one-on-one. Every plan is built around one person.
          </p>

          <div className="about-founder card">
            {/* Served by the API (see `npm run fetch:media`), proxied in dev. */}
            <img
              src="/uploads/content/2023/04/meet-rohit.jpg"
              alt="Rohit M. Gala, founder of Svastrino"
              loading="lazy"
            />
            <div>
              <h3>Rohit M. Gala</h3>
              <p className="about-founder-role">Founder &amp; Lead Mentor</p>
              <p>
                Diploma in Counseling Psychology and a Master’s in Sociology, with a psychology
                diploma from Yale University completed at 97.05%. Rohit has mentored students and
                professionals for over 15 years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Approach ---- */}
      <section className="section section--alt">
        <div className="container">
          <div className="text-center">
            <p className="section-eyebrow">Our approach</p>
            <h2 className="section-title">How mentoring actually works here</h2>
            <p className="section-sub">
              Five steps, run individually — never a template, never a group session.
            </p>
          </div>

          <ol className="about-approach">
            {APPROACH.map((a) => (
              <li key={a.step} className="card about-step">
                <span className="about-step-num">{a.step}</span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Milestones ---- */}
      <section className="section">
        <div className="container about-narrow">
          <h2 className="section-title" style={{ textAlign: 'left' }}>Milestones</h2>
          <ul className="about-timeline">
            {MILESTONES.map((m) => (
              <li key={m.year}>
                <span className="about-year">{m.year}</span>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Mission / vision ---- */}
      <section className="section section--alt">
        <div className="container grid grid-2">
          <article className="card">
            <h3>Our vision</h3>
            <p className="about-muted">
              To become the leading online career mentoring platform.
            </p>
          </article>
          <article className="card">
            <h3>Our mission</h3>
            <p className="about-muted">
              To empower individuals to explore and discover their life’s purpose.
            </p>
          </article>
        </div>

        <div className="container text-center" style={{ marginTop: 'var(--space-6)' }}>
          <Link to="/mentoring" className="btn btn-primary btn-large">Explore our programs</Link>
        </div>
      </section>
    </>
  )
}
