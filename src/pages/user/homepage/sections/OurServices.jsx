import { Link } from 'react-router-dom'

/**
 * Home · section 3 — "Our Services".
 * The routing block. Rather than listing products, it lists what the visitor
 * might be feeling and sends each one to the service that answers it. The last
 * two cards are Skill-Build products and carry the Nirmaan green.
 */
const SERVICES = [
  {
    need: 'I need Immediate Career Counselling and clarity',
    who: 'For individuals who want to make a confident stream & career choice',
    points: [
      'Resolve Last-Minute Career Confusion',
      'Verify Your Career Choice Before Committing',
      'Explore Relevant Career Paths & Opportunities',
      'Make a Confident & Informed Career Decision',
    ],
    duration: '10 Days',
    cta: "Explore Bull's Eye Program →",
    to: '/services/bulls-eye',
  },
  {
    need: 'I want to choose my career through Deep Self-Reflection',
    who: 'For individuals who want career clarity through self-reflection',
    points: [
      'Explore your Potentials & Talents',
      'Create & Better your Vision',
      'Experiment Unique yet Futuristic Careers',
      'Decide what suits your personality & needs',
      'Build a clear 5-year Career Plan',
    ],
    duration: '2 Months',
    cta: 'Explore Bloom Program →',
    to: '/services/bloom',
  },
  {
    need: 'I want Long-Term Mentoring and Complete Transformation',
    who: 'For individuals who want to grow into Visionary Leaders',
    points: [
      'Discover Natural & Hidden Talents',
      'Build Stronger Personality, Mindsets & Charisma',
      'Tailored Personalised Mentoring & Support',
      'Overall Life & Career Mentoring',
    ],
    duration: '2 Years',
    cta: 'Explore Breakthrough Program →',
    to: '/services/breakthrough',
  },
  {
    need: 'I want to build my Skills and Myself',
    who: 'For teens, freshers & young professionals who want to become future-ready',
    points: [
      'Build Deep Self-Awareness & Self-Control',
      'Strengthen Discipline, Confidence & Communication',
      'Develop Mindsets & Skills for Life and Career',
      'Turn Learning Into Real-World Experience',
    ],
    duration: '6 months',
    cta: 'Explore Nirmaan →',
    to: '/skill-build/nirmaan',
    skillBuild: true,
  },
  {
    need: 'I want a Scientific Analysis to decide my Career',
    who: 'For individuals who want to verify their potential & career options scientifically',
    points: [
      'Know yourself like never before',
      'Discover Suitable Streams, Careers & Directions',
      'Reduce confusion, pressure & assumption',
      'Decide your personal journey confidently',
    ],
    duration: '1 day',
    cta: 'Explore Psychometric Testing →',
    to: '/skill-build/psychometric-testing',
    skillBuild: true,
  },
]

export default function OurServices() {
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Let’s first understand why you are here!</h2>
          <p className="section-sub">
            We know that not every student needs the same kind of career guidance. Whatever
            stage you’re at, we have a solution for it.
          </p>
        </div>

        <div className="home-services">
          {SERVICES.map((s) => (
            <article
              key={s.to}
              className={`card home-service${s.skillBuild ? ' home-service--skill' : ''}`}
            >
              <span className="home-service-duration">{s.duration}</span>
              <h3 className="home-service-need">{s.need}</h3>
              <p className="home-service-who">{s.who}</p>
              <ul className="home-service-points">
                {s.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <Link to={s.to} className="home-service-cta">{s.cta}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
