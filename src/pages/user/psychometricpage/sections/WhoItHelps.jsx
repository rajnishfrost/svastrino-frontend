/**
 * Psychometric · section 5 — the same offer read twice, once for the student
 * and once for the parent, because they buy for different reasons.
 */
const STUDENTS = [
  'Get clarity on what genuinely interests you',
  'Discover strengths you may not have recognised',
  'Choose subjects, stream and careers with confidence',
  'Explore paths you are made for but haven’t considered',
  'Make decisions through confidence and clarity',
]
const PARENTS = [
  'See your child’s interests beyond their marks',
  'Have better, more informed conversations about their future',
  'Avoid choices driven by trends, society, or peer pressure',
  'Start career conversations from a place of clarity, not confusion',
]

export default function WhoItHelps() {
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">How Can This Test Help You?</h2>
        </div>
        <div className="grid grid-2">
          {[{ who: 'For Students', points: STUDENTS }, { who: 'For Parents', points: PARENTS }].map((g) => (
            <div key={g.who} className="card psy-help">
              <h3>{g.who}</h3>
              <ul>{g.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
