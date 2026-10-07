import { useEffect, useState } from 'react'
import { fetchFaqs } from '../../../../api/content.js'
import FaqSection from '../../../../common_component/user/FaqAccordion/FaqSection.jsx'

/**
 * Psychometric · the test's questions, straight from the FAQs doc — the
 * "Psychometric Testing" section of the Skill-Build group, the same entries
 * /resources/faqs and the Nirmaan page show.
 *
 * The whole Skill-Build group is fetched and the one section picked out of it:
 * the Nirmaan page asks for the same URL, so a visitor arriving from there is
 * served by the browser cache rather than a second round trip.
 *
 * Renders nothing if the fetch fails — the page sells fine without it.
 */
const SECTION = 'Psychometric Testing'

export default function Faqs() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchFaqs('skill-build')
      .then((res) => {
        if (cancelled) return
        const section = (res.faqs || [])
          .flatMap((g) => g.sections)
          .find((s) => s.section === SECTION)
        setItems(section ? section.items : [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return <FaqSection items={items} title={SECTION} about="psychometric testing" tone="nirmaan" className="bg-white" />
}
