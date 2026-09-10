import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ProgramHeroArt from './sections/ProgramHeroArt.jsx'
import { fetchServiceCategories, fetchTestimonials } from '../../../api/content.js'
import PageSeo from '../../../seo/PageSeo.jsx'
import ProgramEmblem from '../../../common_component/user/ProgramEmblem/ProgramEmblem.jsx'
import Testimonials from '../../../common_component/user/Testimonials/Testimonials.jsx'
import { ArrowRight } from 'lucide-react'

/**
 * Services landing — our consultancy offering, grouped into sub-categories:
 *   Career Counselling   → Bull's Eye Program
 *   Personalised Mentoring → Bloom Program, Breakthrough Program
 * Each program links to its own detail page (/services/:slug).
 */
// Sub-category display order (matches the catalog). Programs are shown in a
// single row, ordered by this sequence, with each card labelled by its category.
const CATEGORY_ORDER = ['career-counselling', 'personalised-mentoring']

/**
 * One program as this page reads it. The catalogue is the only owner now: the
 * copy used to sit in journeyStages.js while the price and the buy rule sat in
 * the database, and the two drifted — Breakthrough said "Talk to an expert"
 * here while the server was still willing to sell it straight from checkout.
 */
const toCard = (p, category) => ({
  slug: p.slug,
  name: p.name,
  tagline: p.tagline,
  summary: p.summary,
  duration: p.durationLabel,
  sessions: p.sessionsLabel,
  mode: p.deliveryMode,
  buyMode: p.buyMode || 'self-serve',
  bookingSku: p.sku,
  category: { slug: category.slug, name: category.name },
})

export default function Services() {
  // undefined = still loading; [] = loaded empty, or the request failed.
  const [programs, setPrograms] = useState(undefined)
  const [testimonials, setTestimonials] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchServiceCategories()
      .then((d) => {
        if (cancelled) return
        setPrograms((d.categories || []).flatMap((c) => (c.programs || []).map((p) => toCard(p, c))))
      })
      .catch(() => { if (!cancelled) setPrograms([]) })
    fetchTestimonials()
      .then((t) => { if (!cancelled) setTestimonials(t.testimonials) })
      .catch(() => {}) // optional — the testimonials section hides itself when empty
    return () => { cancelled = true }
  }, [])

  const loading = programs === undefined
  const list = programs || []

  // Group programs by their sub-category, in the defined order.
  const groups = CATEGORY_ORDER
    .map((slug) => {
      const items = list.filter((p) => p.category?.slug === slug)
      return items.length ? { slug, name: items[0].category.name, programs: items } : null
    })
    .filter(Boolean)
  // Any program without a known category still shows, under "Other".
  const uncategorised = list.filter((p) => !CATEGORY_ORDER.includes(p.category?.slug))
  if (uncategorised.length) groups.push({ slug: 'other', name: 'Other services', programs: uncategorised })

  return (
    <>
      <PageSeo />
      <PageHero
        eyebrow="Services"
        title="Career Counselling & Mentoring"
        subtitle="One-on-one guidance for every stage — from a focused counselling session to long-term personalised mentoring."
        illustration={<ProgramHeroArt src="/assets/images/all-services-t.png" alt="" />}
      >
        <Link to="/book-online" className="btn btn-accent btn-large">Book Online</Link>
        <Link to="/services/compare" className="btn btn-secondary btn-large">Compare programs</Link>
      </PageHero>

      <section className="bg-white py-16">
        <div className="container">
          {loading && (
            // Three card-shaped blocks, so the page keeps its height and the
            // testimonials below it do not jump when the programs land.
            <div className="grid gap-6 md:grid-cols-3" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
                  <div className="size-12 rounded-xl bg-brand-navy/5" />
                  <div className="mt-4 h-3 w-28 rounded bg-brand-navy/5" />
                  <div className="mt-2 h-5 w-44 rounded bg-brand-navy/10" />
                  <div className="mt-3 h-3.5 w-full rounded bg-brand-navy/5" />
                  <div className="mt-5 space-y-2">
                    {[0, 1, 2, 3].map((j) => <div key={j} className="h-3 w-full rounded bg-brand-navy/5" />)}
                  </div>
                  <div className="mt-6 h-10 rounded-lg bg-brand-navy/5" />
                </div>
              ))}
            </div>
          )}

          {!loading && list.length === 0 && (
            <p className="text-center text-sm text-brand-slate">
              The programs could not be loaded just now.{' '}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-brand-crimson underline"
              >
                Try again
              </button>
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            {groups.flatMap((g) => g.programs).map((p) => {
                // Breakthrough is the flagship long-term program — give it a
                // crimson frame + elevated, scaled-up card so it stands out
                // (matches the featured treatment on the Book Online page).
                const featured = p.slug === 'breakthrough'
                return (
                  <article
                    key={p.slug}
                    className={
                      featured
                        ? 'relative z-10 flex flex-col rounded-xl border-2 border-brand-crimson bg-white p-6 shadow-2xl shadow-brand-crimson/20 transition-all md:-translate-y-2 md:scale-[1.03] hover:shadow-brand-crimson/25'
                        : 'relative flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5'
                    }
                  >
                    <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-crimson/10 p-2.5 text-brand-crimson">
                      <ProgramEmblem variant={p.slug} />
                    </span>
                    {p.category?.name && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-slate">{p.category.name}</p>
                    )}
                    <h3 className="mt-1 font-display text-lg font-bold text-brand-navy">{p.name}</h3>
                    {p.tagline && <p className="mt-1 text-sm font-semibold text-brand-crimson">{p.tagline}</p>}
                    <p className="mt-2 text-sm leading-relaxed text-brand-slate">{p.summary}</p>
                    <ul className="mt-4 space-y-1 text-sm text-brand-slate flex-1">
                      {p.duration && <li><strong className="font-semibold text-brand-navy">Duration:</strong> {p.duration}</li>}
                      {p.sessions && <li><strong className="font-semibold text-brand-navy">Sessions:</strong> {p.sessions}</li>}
                      {p.mode && <li><strong className="font-semibold text-brand-navy">Mode:</strong> {p.mode}</li>}
                    </ul>
                    <div className="mt-6 flex flex-col justify-end gap-2.5 sm:flex-row">
                      <Link
                        to={`/services/${p.slug}`}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-brand-crimson px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
                      >
                        View details
                      </Link>
                      {/* Programs sold after a call (Breakthrough) send you to
                          their own page's call-back form, not to the checkout. */}
                      <Link
                        to={
                          p.buyMode === 'expert-call'
                            ? `/services/${p.slug}#talk-to-an-expert`
                            : p.bookingSku ? `/book-online?program=${p.bookingSku}` : '/book-online'
                        }
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-4 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
                      >
                        {p.buyMode === 'expert-call' ? 'Talk to an expert' : 'Book now'}
                      </Link>
                    </div>
                  </article>
                )
            })}
          </div>
        </div>
      </section>

      <Testimonials
        items={testimonials}
        eyebrow="Success stories"
        title="What People Say About Us !"
        className="bg-soft py-16 md:py-20"
        footer={
          <Link
            to="/resources/success-stories"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-6 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
          >
            Read all success stories&nbsp;&nbsp;<ArrowRight className="size-4" />
          </Link>
        }
      />
    </>
  )
}
