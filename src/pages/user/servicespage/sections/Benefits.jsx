import { Check } from 'lucide-react'

/**
 * Program page · "Why choose this program" — what the client walks away
 * with, as opposed to what happens during it. Hidden when empty.
 */
export default function Benefits({ items = [], programName }) {
  if (!items.length) return null
  return (
    <div className="rounded-2xl border border-brand-navy/5 bg-white p-7 shadow-sm">
      <h2 className="font-display text-xl font-bold text-brand-navy">Why choose {programName}</h2>
      <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {items.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-brand-navy">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-rose">
              <Check className="size-3 text-brand-crimson" />
            </span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}
