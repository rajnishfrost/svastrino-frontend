import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 8 — "Get To Know Us And Our Roots".
 * The trust close: who we are, and the two ways to read more about us.
 */
export default function AboutUs() {
  return (
    // Dark "trust close" band — same navy as the footer, so this section stands
    // out clearly from the white sections around it.
    <section className="relative overflow-hidden bg-brand-navy-dark py-20 md:py-24">
      {/* faint brand glows for a bit of depth on the dark band */}
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand-blue/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-brand-crimson/10 blur-3xl" aria-hidden />

      <div className="container relative">
        <SectionHeading title="Get To Know Us And Our Roots" invert />

        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-white/70">
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

          <div className="flex flex-wrap items-center justify-center gap-3 text-white/70">
            <span>If you want to know our pillars, check</span>
            <Link
              to="/our-ideology"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-brand-navy"
            >
              Our Ideology <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
