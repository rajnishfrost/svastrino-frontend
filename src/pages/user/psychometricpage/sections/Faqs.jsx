import { useEffect, useState } from 'react'
import FaqAccordion from '../../../../common_component/user/FaqAccordion/FaqAccordion.jsx'
import { fetchFaqs } from '../../../../api/content.js'

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

  if (!items.length) return null

  // The bundle band above sits on cream, so this one takes white.
  return (
    <section id="faqs" className="bg-white py-16 md:py-20">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
          FAQs
        </h2>
        <div className="mx-auto mt-12 max-w-3xl">
          <FaqAccordion items={items} tone="nirmaan" />
        </div>
      </div>
    </section>
  )
}
