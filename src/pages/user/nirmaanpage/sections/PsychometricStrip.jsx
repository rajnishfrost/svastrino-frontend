import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Nirmaan · a dark strip pointing at the other Skill-Build product, for a
 * visitor who wants to know WHICH career to build towards before they start
 * building themselves.
 */
export default function PsychometricStrip() {
  return (
    <section className="bg-nirmaan-brown py-10">
      <div className="container flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-lg font-medium text-nirmaan-cream">
          Want to explore career options before starting Nirmaan?
        </p>
        <Link
          to="/skill-build/psychometric-testing"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white transition-colors hover:bg-nirmaan-green-light"
        >
          Start Psychometric Testing <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
