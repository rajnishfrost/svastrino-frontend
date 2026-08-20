/**
 * Home · section 2 — "Problems We Solve".
 * A hard statistic paired with what we do about it, three times over. The
 * numbers do the persuading; the second line answers them.
 */
const POINTS = [
  {
    stat: 'Only 10.4% of Indian students ever receive professional career guidance',
    answer:
      'We help you understand yourself by identifying your natural strengths, talents, and values so you can make choices that feel right for you',
  },
  {
    stat: 'Approximately 86% of Indian students regret their career choices or lack clarity about their professional paths',
    answer:
      'We help you explore diverse career paths early, build confidence, and make informed choices beyond peer pressure and expectations',
  },
  {
    stat: '77% of students admit that they would engage more deeply with education if they understood practical career options',
    answer:
      'We provide you with regular personal and career development support to turn career awareness into practical skills and action.',
  },
]

export default function ProblemsWeSolve() {
  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">Problems We Solve</h2>
        </div>
        <div className="grid grid-3">
          {POINTS.map((p) => (
            <div key={p.stat} className="home-problem">
              <span className="home-problem-glyph" aria-hidden>◈</span>
              <p className="home-problem-stat">{p.stat}</p>
              <p className="home-problem-answer">{p.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
