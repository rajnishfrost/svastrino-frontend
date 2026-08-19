import { useState } from 'react'

/**
 * Nirmaan · "Your Transformative Journey" — the whole 24-week course laid out
 * as six phases. Phases open and close on click so the page stays scannable.
 *
 * These six phases are the SAME six the pay-as-you-use plan sells one at a
 * time, so a student can see exactly what each payment opens.
 */
const PHASES = [
  {
    n: 1, name: 'Self Awareness',
    weeks: [
      'Start ≠ End',
      'Your Life Project Begins Now (Discover Your Strengths)',
      'The Identity Shift (Your Inner Voice)',
      'Design Your Personal Success Story (Understanding Your Value)',
    ],
  },
  {
    n: 2, name: 'Building the Success Engine',
    weeks: [
      'Confidence Is Built, Not Born (Daily 1% Improvement Formula: Being Disciplined Without Motivation)',
      'Overcoming Fear Of Any Kind',
      'Communicate With Confidence',
      'Discipline Is More Powerful Than Motivation',
    ],
  },
  {
    n: 3, name: 'Inner Growth Through Winning',
    weeks: [
      'Fail To Train Well (Why Trying Matters More Than Winning)',
      'Being Courageous To Trust Yourself',
      'Building Resilience (Inner Strength)',
      'Risk Taking For Growth',
    ],
  },
  {
    n: 4, name: 'Building Self',
    weeks: [
      'Fixed Mindset Vs Growth Mindset',
      'Learning How To Unlearn & Relearn',
      'Hard Work + Smart Work',
      'Learning Beyond School',
    ],
  },
  {
    n: 5, name: 'Being Emotionally and Mentally Grounded',
    weeks: [
      'Handling Stress',
      'Respond Wisely (Emotional Intelligence)',
      'Adaptability In A Changing World',
      'The Power Of Consistency',
    ],
  },
  {
    n: 6, name: 'Building the Success Blueprint',
    weeks: [
      'Designing Your Career Roadmap',
      'Your 5-Year Growth Plan',
      'Becoming Successful Anywhere',
      'The Personal Success Blueprint',
    ],
  },
]

export default function Journey() {
  const [open, setOpen] = useState(1) // first phase open, so the shape is obvious

  return (
    <section id="journey" className="section">
      <div className="container">
        <div className="text-center">
          <p className="section-eyebrow">Your journey</p>
          <h2 className="section-title">Your Transformative Journey through the course</h2>
          <p className="section-sub">
            A commitment of at most 15 minutes a day for the next 24 weeks — one weekly
            video, then one short task on each of the next six days.
          </p>
        </div>

        <div className="nirmaan-phases">
          {PHASES.map((p) => {
            const isOpen = open === p.n
            const firstWeek = (p.n - 1) * 4 + 1
            return (
              <div key={p.n} className={`nirmaan-phase${isOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  className="nirmaan-phase-head"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : p.n)}
                >
                  <span className="nirmaan-phase-n">Phase {p.n}</span>
                  <span className="nirmaan-phase-name">{p.name}</span>
                  <span className="nirmaan-phase-weeks">
                    Weeks {firstWeek}–{firstWeek + 3}
                  </span>
                  <span className="nirmaan-phase-icon" aria-hidden>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <ol className="nirmaan-phase-list" start={firstWeek}>
                    {p.weeks.map((w) => <li key={w}>{w}</li>)}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
