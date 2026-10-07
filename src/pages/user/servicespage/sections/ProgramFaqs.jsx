import FaqSection from '../../../../common_component/user/FaqAccordion/FaqSection.jsx'

/**
 * Program page · the questions people ask about THIS programme, in the same
 * FAQ block as every other programme page. Hidden when none are written yet.
 */
export default function ProgramFaqs({ faqs = [], name }) {
  // Program FAQs come through as { q, a }; normalise to the shared shape.
  const items = faqs.map((f, i) => ({ id: i, question: f.q, answer: f.a }))
  return <FaqSection items={items} title={name} about={name ? `the ${name}` : 'this programme'} className="bg-soft" />
}
