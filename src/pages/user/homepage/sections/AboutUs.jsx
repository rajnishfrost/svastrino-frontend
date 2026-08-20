import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 8 — "Get To Know Us And Our Roots".
 * The trust close: who we are, and the two ways to read more about us.
 */
export default function AboutUs() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container">
        <SectionHeading title="Get To Know Us And Our Roots" />

        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-brand-slate">
          <p className="text-balance leading-relaxed">
            With 17+ years of experience, we&rsquo;ve helped thousands of students discover who they
            are, choose the right path, and build the confidence to lead their future.
          </p>
          <p className="text-balance leading-relaxed">
            Through personalized guidance, expert mentoring, and skill-building, we equip students
            with the support and tools they need to make informed decisions and reach their potential.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/about"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark"
          >
            Learn More About Svastrino <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/our-ideology"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-brand-navy/15 bg-white px-8 text-base font-semibold text-brand-navy shadow-sm transition-colors hover:text-brand-crimson"
          >
            Check Our Ideology <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
