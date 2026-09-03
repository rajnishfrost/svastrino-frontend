import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ProgramHeroArt from '../servicespage/sections/ProgramHeroArt.jsx'
import PageSeo from '../../../seo/PageSeo.jsx'

/**
 * Book Online — the mentoring programs as a static pricing component.
 *
 * NOTE: this page previously ran a live booking/payment wizard driven by the
 * backend. It has been switched to STATIC pricing for now (content below);
 * the old wizard is preserved in git history and can be re-wired to the backend
 * when online booking is ready.
 */
const PROGRAMS = [
  {
    slug: '/book-online?program=mentoring-bullseye',
    name: "Bull's Eye Program",
    tagline: 'Get a quick yet accurate solution for your career confusion',
    price: '₹7,990',
    features: [
      '10 Days',
      'Pre-session 90 minutes',
      '2 sessions of ~2.5 hours each',
      'Follow-ups in between sessions',
    ],
    buttonText: "Book Now"
  },
  {
    slug: '/book-online?program=mentoring-bloom',
    name: 'Bloom Program',
    tagline: 'Cultivate a visionary mindset and set goals for a bright future',
    price: '₹27,900',
    features: [
      '45–60 Days',
      'Pre-session 90 minutes',
      '3 sessions of ~2.5 hours each',
      'Weekly follow-ups & support throughout the program',
    ],
    buttonText: "Book Now"
  },
  {
    slug: '/services/breakthrough#talk-to-an-expert',
    name: 'Breakthrough Program',
    tagline: 'Ace the art of self-discipline and evolve into an enterprising leader',
    price: '₹1,39,000',
    featured: true,
    features: [
      '2 years with at least 2,200 minutes',
      'Pre-session 90 minutes',
      '10 sessions of 2 hours each, or 20 sessions of 1 hour each (depending on the student’s speed, availability & comfort)',
      'Spread over 2 years',
      'Regular follow-ups and support in between sessions',
    ],
    buttonText: "Book Now"
  },
]

export default function BookOnline() {
  return (
    <>
      <PageSeo />
      <PageHero
        eyebrow=""
        title="Book a Preferred Program, Now!"
        subtitle="Select a program that you would want to get personalised session in"
        illustration={<ProgramHeroArt src="/assets/images/book-t.png" alt="" />}
      />

      <section className="bg-white py-16">
        <div className="container">
          {/* items-stretch keeps all cards equal height; the featured card uses a
              relative z-10 + md:scale so it visually lifts above its neighbours. */}
          <div className="grid items-stretch gap-6 md:grid-cols-3">
            {PROGRAMS.map((p) => (
              <div
                key={p.slug}
                className={
                  p.featured
                    ? 'relative z-10 flex flex-col rounded-2xl border-2 border-brand-crimson bg-white p-7 shadow-2xl shadow-brand-crimson/20 transition-all md:-translate-y-2 md:scale-[1.03] hover:shadow-brand-crimson/25'
                    : 'flex flex-col rounded-2xl border-2 border-transparent bg-white p-7 shadow-lg shadow-brand-navy/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-navy/[0.18]'
                }
              >
                <h2 className="font-display text-xl font-bold text-brand-navy">{p.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-crimson font-semibold">{p.tagline}</p>

                <div className="mt-5 border-y border-brand-navy/10 py-4">
                  <span className="font-display text-3xl font-extrabold text-brand-navy">{p.price}</span>
                  <span className="ml-1 text-sm text-brand-slate">one-time</span>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-brand-navy/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-crimson" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  // to="/contact"
                  to={`${p.slug}`}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-crimson px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
                >
                  {p.buttonText} <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-sell to the Nirmaan skill-build course — kept in its own green
          Nirmaan theme so it reads as a distinct, related offering. */}
      <section className="bg-nirmaan-cream/50 py-14 md:py-16">
        <div className="container">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-5 rounded-2xl border border-nirmaan-sand bg-white p-8 text-center sm:flex-row sm:text-left">
            <p className="text-lg font-medium text-nirmaan-brown">
              Want to build your mindset, confidence, and skills to succeed in life and career?
            </p>
            <Link
              to="/skill-build/nirmaan"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-nirmaan-green px-7 text-base font-semibold text-white transition-colors hover:bg-nirmaan-green-dark"
            >
              Explore Nirmaan <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
