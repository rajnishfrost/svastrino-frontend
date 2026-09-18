import { useState } from 'react'
import { Plus } from 'lucide-react'
import Markdown from '../Markdown/Markdown.jsx'

/**
 * Styled FAQ accordion shared by the program pages (/services/:slug) and the
 * Resources hub (/resources/faqs), so both read the same. One answer opens at a
 * time; the crimson "+" chip rotates into an "×" and the answer reveals with a
 * smooth height animation (the grid-rows 0fr→1fr trick).
 *
 * `items`: [{ id, question, answer }] — `answer` is markdown.
 * `tone`: 'brand' (default, crimson/navy) or 'nirmaan' (green/brown/cream) for
 * the Skill-Build pages, which wear the other palette.
 *
 * A few things are styled inline rather than with Tailwind utilities on purpose:
 * Preflight (Tailwind's reset) is OFF in this project, so a bare <button> keeps
 * the browser's grey background and border — we zero those out here. The chip +
 * icon are inline too because this repo pins an old lucide build, so explicit
 * size/color is the reliable way to keep a crisp, on-theme circle.
 */
// Per-tone colours. The chip is inline-styled (see above), so its two colours
// live here as hex rather than as classes.
const TONES = {
  brand: {
    open: 'border-brand-crimson/40 bg-brand-rose/40',
    closed: 'border-brand-navy/10 bg-white hover:border-brand-crimson/30',
    question: 'text-brand-navy',
    chipOn: '#c8102e',
    chipOff: '#fdeef1',
    markdown: 'markdown-compact',
  },
  nirmaan: {
    open: 'border-nirmaan-green/40 bg-nirmaan-cream',
    closed: 'border-nirmaan-sand bg-white hover:border-nirmaan-green/40',
    question: 'text-nirmaan-brown',
    chipOn: '#3f7932',
    chipOff: '#eef3ea',
    markdown: 'markdown-compact markdown-nirmaan',
  },
}

export default function FaqAccordion({ items = [], tone = 'brand' }) {
  const [openId, setOpenId] = useState(null)
  const t = TONES[tone] || TONES.brand
  if (!items.length) return null

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className={`overflow-hidden rounded-xl border shadow-sm transition-colors duration-200 ${
              isOpen ? t.open : t.closed
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              style={{ background: 'transparent', border: 'none' }}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className={`font-display text-base font-semibold ${t.question}`}>{item.question}</span>
              <span
                aria-hidden
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: isOpen ? t.chipOn : t.chipOff,
                  transition: 'transform .2s ease, background .2s ease',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              >
                <Plus size={16} color={isOpen ? '#ffffff' : t.chipOn} strokeWidth={2.5} />
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
                {/* Answers come from the FAQs doc, so several carry bullet
                    lists and bold runs — rendered rather than printed raw. */}
                <div className="px-5 pb-5">
                  <Markdown className={t.markdown}>{item.answer}</Markdown>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
