import { useState } from 'react'
import { Plus } from 'lucide-react'
import FaqAccordion from './FaqAccordion.jsx'

/**
 * FAQ sections as collapsible headings, each holding its own FaqAccordion of
 * questions. Shared by /resources/faqs and every programme page (Bull's Eye,
 * Bloom, Breakthrough, Nirmaan, Psychometric Testing) so they all read the same.
 *
 * Closed by default and one open at a time: a long list of questions buries
 * the thing someone came for, so the block opens as a short menu of topics.
 *
 * `sections`: [{ section, items: [{ id, question, answer }] }]
 * `tone`: 'brand' (crimson/navy) or 'nirmaan' (green/brown) — same as FaqAccordion.
 *
 * The button reset and chip are inline for the same reasons FaqAccordion gives
 * (Preflight is off; the pinned lucide build wants explicit size/colour).
 */
const TONES = {
  brand: {
    title: 'text-brand-navy',
    count: 'text-brand-slate',
    open: 'border-brand-crimson/40',
    closed: 'border-brand-navy/10 hover:border-brand-crimson/30',
    chipOn: '#c8102e',
    chipOff: '#fdeef1',
  },
  nirmaan: {
    title: 'text-nirmaan-brown',
    count: 'text-nirmaan-brown-soft',
    open: 'border-nirmaan-green/40',
    closed: 'border-nirmaan-sand hover:border-nirmaan-green/40',
    chipOn: '#3f7932',
    chipOff: '#eef3ea',
  },
}

export default function FaqGroups({ sections = [], tone = 'brand' }) {
  const [openSection, setOpenSection] = useState(null)
  const t = TONES[tone] || TONES.brand
  const list = sections.filter((s) => s.items?.length)
  if (!list.length) return null

  // A section name left over from a previous list (e.g. after switching group
  // on the Resources page) simply matches nothing, so everything shows closed.
  return (
    <div className="space-y-4">
      {list.map((s) => {
        const isOpen = s.section === openSection
        return (
          <div key={s.section}>
            {/* Same chip and reveal as the questions inside, one size up — a
                heading has to read as the heavier row. */}
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenSection(isOpen ? null : s.section)}
              style={{ background: 'transparent', border: 'none' }}
              className={`flex w-full cursor-pointer items-center justify-between gap-4 border-0 border-b border-solid px-1 py-3 text-left transition-colors ${
                isOpen ? t.open : t.closed
              }`}
            >
              <span className={`font-display text-lg font-bold ${t.title}`}>
                {s.section}
                <span className={`ml-2 text-sm font-medium ${t.count}`}>{s.items.length}</span>
              </span>
              <span
                aria-hidden
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: isOpen ? t.chipOn : t.chipOff,
                  transition: 'transform .2s ease, background .2s ease',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              >
                <Plus size={18} color={isOpen ? '#ffffff' : t.chipOn} strokeWidth={2.5} />
              </span>
            </button>

            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows .25s ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div className="pt-4">
                  <FaqAccordion items={s.items} tone={tone} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
