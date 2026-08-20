import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import IdeologyStrip from './sections/IdeologyStrip.jsx'
import MediaRecognition from './sections/MediaRecognition.jsx'
import MeetRohit from './sections/MeetRohit.jsx'
import OurTeam from './sections/OurTeam.jsx'
import ExploreServices from './sections/ExploreServices.jsx'
import './About.css'

// Static page copy (story, approach, milestones) — it changes rarely, so it
// lives here rather than in the DB. Programs, FAQs and success stories are
// dynamic and come from /api/user/content.


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
      <section id="our-story" className="section">
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

      {/* ---- Milestones ---- */}
      <section id="milestones" className="section">
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

      </section>

      <IdeologyStrip />
      <MediaRecognition />
      <MeetRohit />
      <OurTeam />
      <ExploreServices />
    </>
  )
}
