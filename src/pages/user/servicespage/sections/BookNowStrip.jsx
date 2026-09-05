import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Program page · a conversion band placed mid-page, once the visitor has
 * read the journey and the benefits but before the questions. Someone who is
 * already convinced should not have to scroll to the bottom to act.
 */
export default function BookNowStrip({ program, bookHref }) {
  return (
    <section className="bg-brand-gradient py-14 md:py-16">
      <div className="container mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Ready to begin {program.name}?</h2>
        </div>
        <Link
          to={bookHref}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
        >
          Book now <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
