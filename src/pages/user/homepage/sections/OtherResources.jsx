import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Library } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'

/**
 * Home · section 5 — the way out for a visitor who is not ready to choose a
 * service yet. Two free, no-commitment routes instead of a dead end.
 */
const WAYS = [
  {
    icon: Library,
    need: 'I Want to Explore Various Careers & Courses',
    text: 'Check out different careers, courses and pathways to see what could be a good fit for you.',
    cta: 'Browse Career Library',
    to: '/resources/career-library',
  },
  {
    icon: BookOpen,
    need: 'I Want to Learn & Grow',
    text: 'Get practical tips on careers, skills, mindset and personal growth to help you move forward.',
    cta: 'Read Our Blogs',
    to: '/blog',
  },
]

export default function OtherResources() {
  return (
    <section className="bg-soft py-20 md:py-24">
      <div className="container">
        <SectionHeading
          title="Not Ready To Choose from Services Yet?"
          subtitle="Explore Other Ways, We Can Help. Explore career details, courses and practical guidance at your own pace."
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {WAYS.map((w) => (
            <Link key={w.to} to={w.to} className="group">
              <div className="flex h-full items-start gap-5 rounded-xl border border-brand-navy/5 bg-white p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-rose text-brand-crimson">
                  <w.icon className="size-7" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-brand-navy">{w.need}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-slate">{w.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-crimson">
                    {w.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
