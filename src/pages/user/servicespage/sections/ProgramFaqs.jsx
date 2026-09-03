import FaqAccordion from '../../../../common_component/user/FaqAccordion/FaqAccordion.jsx'

/**
 * Program page · the questions people ask about THIS program. One answer
 * open at a time. Hidden when the program has no questions written yet.
 */
export default function ProgramFaqs({ faqs = [] }) {
  if (!faqs.length) return null

  // Program FAQs come through as { q, a }; normalise to the shared shape.
  const items = faqs.map((f, i) => ({ id: i, question: f.q, answer: f.a }))

  return (
    <div className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <h2 className="font-display text-xl font-bold text-brand-navy">Questions about this program</h2>
      <div className="mt-5">
        <FaqAccordion items={items} />
      </div>
    </div>
  )
}
