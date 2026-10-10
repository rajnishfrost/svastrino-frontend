import FaqGroups from './FaqGroups.jsx'

/**
 * The FAQ block every program page uses — Bull's Eye, Bloom, Breakthrough,
 * Nirmaan and Psychometric Testing — so the heading, width and accordion look
 * the same wherever a visitor meets them. Only the colours follow the page:
 * `tone="nirmaan"` for the green/brown Skill-Build pages, navy otherwise.
 *
 * The questions sit under a collapsible `title` heading (with a count), the
 * same pattern /resources/faqs uses for its sections.
 */
export default function FaqSection({ items = [], title, about, tone, id = 'faqs', className = 'bg-white' }) {
  if (!items.length) return null
  const nirmaan = tone === 'nirmaan'
  return (
    <section id={id} className={`${className} py-16 md:py-20`}>
      <div className="container">
        <div className="text-center">
          <h2 className={`font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${nirmaan ? 'text-nirmaan-brown' : 'text-brand-navy'}`}>
            FAQs
          </h2>
          {about && (
            <p className={`mx-auto mt-3 max-w-2xl text-base ${nirmaan ? 'text-nirmaan-brown-soft' : 'text-brand-slate'}`}>
              Common questions about {about}
            </p>
          )}
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqGroups sections={[{ section: title || 'Frequently asked questions', items }]} tone={tone} />
        </div>
      </div>
    </section>
  )
}
