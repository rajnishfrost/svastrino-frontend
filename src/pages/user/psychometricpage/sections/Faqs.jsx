import { useState } from 'react'

/**
 * Psychometric · section 9 — the objections that stop a parent or student
 * from booking. One answer open at a time.
 */
const FAQS = [
  { q: 'Is there a right or wrong answer?',
    a: 'No. The test measures what you are like, not what you know. Answer honestly — that is what makes the report accurate.' },
  { q: 'Which test should I take?',
    a: 'Stream Selector if you are in Class 7th, 8th or 9th and choosing between Science, Commerce and Humanities/Arts. Career Selector if you are in Class 10th, 11th or 12th and looking for careers that match you.' },
  { q: 'How much does it cost?',
    a: 'INR 900 for each test. If you take it along with the Nirmaan course you get a flat 25% discount.' },
  { q: 'What do I actually get at the end?',
    a: 'A clear report with insights into your interests, strengths, personality and abilities, plus the careers and directions that suit you.' },
]

export default function Faqs() {
  const [open, setOpen] = useState(null)

  return (
    <section className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">FAQ’s</h2>
        </div>
        <div className="psy-faqs">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`psy-faq${isOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  className="psy-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{f.q}</span>
                  <span className="psy-faq-icon" aria-hidden>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="psy-faq-a">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
