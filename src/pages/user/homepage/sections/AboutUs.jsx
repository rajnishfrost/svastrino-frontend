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

        <div className="mt-8 flex flex-col items-center gap-5">
          <Link
            to="/about"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-crimson-dark"
          >
            Learn More About Svastrino <ArrowRight className="size-4" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3 text-brand-slate">
            <span>If you want to know our pillars, check</span>
            <Link
              to="/our-ideology"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-navy/15 bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-crimson hover:text-brand-crimson"
            >
              Our Ideology <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
