import { useState } from 'react'
import { Plus } from 'lucide-react'

/**
 * Styled FAQ accordion shared by the programme pages (/services/:slug) and the
 * Resources hub (/resources/faqs), so both read the same. One answer opens at a
 * time; the crimson "+" chip rotates into an "×" and the answer reveals with a
 * smooth height animation (the grid-rows 0fr→1fr trick).
 *
 * `items`: [{ id, question, answer }].
 *
 * A few things are styled inline rather than with Tailwind utilities on purpose:
 * Preflight (Tailwind's reset) is OFF in this project, so a bare <button> keeps
 * the browser's grey background and border — we zero those out here. The chip +
 * icon are inline too because this repo pins an old lucide build, so explicit
 * size/color is the reliable way to keep a crisp, on-theme circle.
 */
export default function FaqAccordion({ items = [] }) {
  const [openId, setOpenId] = useState(null)
  if (!items.length) return null

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className={`overflow-hidden rounded-xl border shadow-sm transition-colors duration-200 ${
              isOpen
                ? 'border-brand-crimson/40 bg-brand-rose/40'
                : 'border-brand-navy/10 bg-white hover:border-brand-crimson/30'
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              style={{ background: 'transparent', border: 'none' }}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-base font-semibold text-brand-navy">{item.question}</span>
              <span
                aria-hidden
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: isOpen ? '#c8102e' : '#fdeef1',
                  transition: 'transform .2s ease, background .2s ease',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              >
                <Plus size={16} color={isOpen ? '#ffffff' : '#c8102e'} strokeWidth={2.5} />
              </span>
            </button>

            {/* Smooth height reveal — inner wrapper is clipped while collapsed. */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows .25s ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <p className="px-5 pb-5 text-sm leading-relaxed text-brand-slate">{item.answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
