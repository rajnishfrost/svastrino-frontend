import { useEffect, useState } from 'react'
import { fetchFaqs } from '../../../../api/content.js'
import FaqSection from '../../../../common_component/user/FaqAccordion/FaqSection.jsx'

/**
 * Nirmaan · the Skill-Build questions, straight from the FAQs doc — the same
 * set /resources/faqs lists under "Skill-Build", so the two cannot drift. Both
 * of the group's sections are shown (Nirmaan and Psychometric Testing), each
 * under its own heading.
 *
 * Only this group is fetched (?group=skill-build): pulling all 143 to show 48
 * would be most of a hundred kilobytes on a landing page.
 *
 * Renders nothing if the fetch fails — a FAQ block is not worth an error panel
 * on a page that still sells fine without it.
 */
// Only the Nirmaan course's own questions — the Psychometric Testing set lives
// on its own page, and showing it here read as if it belonged to this course.
const SECTION = 'Nirmaan'

export default function Faqs() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchFaqs('skill-build')
      .then((res) => {
        if (cancelled) return
        const section = (res.faqs || []).flatMap((g) => g.sections).find((x) => x.section === SECTION)
        setItems(section ? section.items : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return <FaqSection items={items} title={SECTION} about="Nirmaan" tone="nirmaan" className="bg-white" />
}
