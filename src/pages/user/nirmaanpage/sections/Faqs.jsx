import { useEffect, useState } from 'react'
import FaqAccordion from '../../../../common_component/user/FaqAccordion/FaqAccordion.jsx'
import { fetchFaqs } from '../../../../api/content.js'

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
export default function Faqs() {
  const [sections, setSections] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchFaqs('skill-build')
      .then((res) => {
        if (cancelled) return
        setSections((res.faqs || []).flatMap((g) => g.sections))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!sections.length) return null

  // Packages above sits on cream, so this one takes white — the page alternates
  // the two the whole way down.
  return (
    <section id="faqs" className="bg-white py-16 md:py-20">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-nirmaan-brown sm:text-4xl">
          FAQs
        </h2>

        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          {sections.map((s) => (
            <div key={s.section}>
              {/* One section reads as a plain list; two need telling apart. */}
              {sections.length > 1 && (
                <h3 className="mb-4 font-display text-lg font-bold text-nirmaan-green">{s.section}</h3>
              )}
              <FaqAccordion items={s.items} tone="nirmaan" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
