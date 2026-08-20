import { useState } from 'react'

/**
 * Programme page · the questions people ask about THIS programme. One answer
 * open at a time. Hidden when the programme has no questions written yet.
 */
export default function ProgramFaqs({ faqs = [] }) {
  const [open, setOpen] = useState(null)
  if (!faqs.length) return null

  return (
    <div className="card svc-panel">
      <h2 className="svc-h2">Questions about this programme</h2>
      <div className="svc-faqs">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className={`svc-faq${isOpen ? ' open' : ''}`}>
              <button type="button" className="svc-faq-q" aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : i)}>
                <span>{f.q}</span>
                <span className="svc-faq-icon" aria-hidden>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="svc-faq-a">{f.a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
