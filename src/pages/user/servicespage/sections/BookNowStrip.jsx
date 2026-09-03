import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Program page · a conversion band placed mid-page, once the visitor has
 * read the journey and the benefits but before the questions. Someone who is
 * already convinced should not have to scroll to the bottom to act.
 */
export default function BookNowStrip({ program, bookHref }) {
  return (
    <section className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-gradient px-6 py-6 text-center sm:flex-row sm:text-left md:px-10">
      <div>
        <h2 className="font-display text-xl font-bold text-white">Ready to begin {program.name}?</h2>
        <p className="mt-1 text-sm text-white/75">
          {program.duration && <>{program.duration} · </>}
          {program.mode || 'Online'} · guided one to one
        </p>
      </div>
      <Link
        to={bookHref}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
      >
        Book now <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}
