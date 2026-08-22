import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

/**
 * Programme page · the questions people ask about THIS programme. One answer
 * open at a time. Hidden when the programme has no questions written yet.
 */
export default function ProgramFaqs({ faqs = [] }) {
  const [open, setOpen] = useState(null)
  if (!faqs.length) return null

  return (
    <div className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <h2 className="font-display text-xl font-bold text-brand-navy">Questions about this programme</h2>
      <div className="mt-4 divide-y divide-brand-navy/10 border-t border-brand-navy/10">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="font-medium text-brand-navy">{f.q}</span>
                <span className="text-brand-crimson">
                  {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
              {isOpen && <p className="pb-4 text-sm leading-relaxed text-brand-slate">{f.a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
