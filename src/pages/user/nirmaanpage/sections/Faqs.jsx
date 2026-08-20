import { useState } from 'react'

/**
 * Nirmaan · the questions that stop a parent or student from enrolling.
 * One answer open at a time.
 */
const FAQS = [
  { q: 'Who is Nirmaan for?',
    a: 'Students from Grade 7 onwards, plus freshers and young professionals who want to understand themselves better and handle life and its choices with self-belief and confidence.' },
  { q: 'How much time does it take?',
    a: 'At most 15 minutes a day for 24 weeks — one video a week, then one short task on each of the next six days.' },
  { q: 'Can I try it before paying?',
    a: 'Yes. Watch the free preview lessons, and if you like them start the 1-week free trial to experience the real course.' },
  { q: 'Do I have to pay for everything at once?',
    a: 'No. You can pay once and save 25%, or use the pay-as-you-use plan and pay for one phase at a time — six equal payments, without interest.' },
  { q: 'How long do I have access?',
    a: 'The course is valid for one year from the date of enrolment. Each video can be played five times, and after the year is up your tasks stay viewable for three more years.' },
  { q: 'Is the psychometric test included?',
    a: 'Only on the plans that say so. Nirmaan + Psychometric Testing bundles the test with the course; on the other plans you can buy the test separately.' },
]

export default function Faqs() {
  const [open, setOpen] = useState(null)

  return (
    <section id="faqs" className="section">
      <div className="container">
        <div className="text-center">
          <h2 className="section-title">FAQ’s</h2>
        </div>
        <div className="nirmaan-faqs">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`nirmaan-faq${isOpen ? ' open' : ''}`}>
                <button type="button" className="nirmaan-faq-q" aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : i)}>
                  <span>{f.q}</span>
                  <span className="nirmaan-faq-icon" aria-hidden>{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="nirmaan-faq-a">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
