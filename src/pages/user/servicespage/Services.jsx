import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchPrograms, fetchTestimonials } from '../../../api/content.js'
import PageSeo from '../../../seo/PageSeo.jsx'
import ProgramEmblem from '../../../common_component/user/ProgramEmblem/ProgramEmblem.jsx'

/**
 * Services landing — our consultancy offering, grouped into sub-categories:
 *   Career Counselling   → Bull's Eye Program
 *   Personalised Mentoring → Bloom Program, Breakthrough Program
 * Each program links to its own detail page (/services/:slug).
 */
// Sub-category display order (matches the catalog).
const CATEGORY_ORDER = ['career-counselling', 'personalised-mentoring']
const CATEGORY_BLURB = {
  'career-counselling': 'Focused guidance to get unstuck and choose your path with clarity.',
  'personalised-mentoring': 'Ongoing one-on-one mentoring that grows you over the long journey.',
}

export default function Services() {
  const [programs, setPrograms] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    Promise.all([fetchPrograms(), fetchTestimonials(true)])
      .then(([p, t]) => { if (!cancelled) { setPrograms(p.programs); setTestimonials(t.testimonials) } })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reloadKey])

  // Group programs by their sub-category, in the defined order.
  const groups = CATEGORY_ORDER
    .map((slug) => {
      const items = programs.filter((p) => p.category?.slug === slug)
      return items.length ? { slug, name: items[0].category.name, programs: items } : null
    })
    .filter(Boolean)
  // Any program without a known category still shows, under "Other".
  const uncategorised = programs.filter((p) => !CATEGORY_ORDER.includes(p.category?.slug))
  if (uncategorised.length) groups.push({ slug: 'other', name: 'Other services', programs: uncategorised })

  return (
    <>
      <PageSeo />
      <PageHero
        eyebrow="Services"
        title="Career Counselling & Mentoring"
        subtitle="One-on-one guidance for every stage — from a focused counselling session to long-term personalised mentoring."
      >
        <Link to="/book-online" className="btn btn-accent btn-large">Book Online</Link>
        <Link to="/services/compare" className="btn btn-secondary btn-large">Compare programs</Link>
      </PageHero>

      <section className="bg-white py-16 md:py-20">
        <div className="container">
          {loading && <p className="text-center text-brand-slate">Loading services…</p>}
          {error && !loading && <ConnectionState error={error} onRetry={() => setReloadKey((k) => k + 1)} label="the services" />}

          {!loading && !error && groups.map((g) => (
            <div key={g.slug} id={g.slug} className="mb-14 last:mb-0">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">{g.name}</h2>
                {CATEGORY_BLURB[g.slug] && <p className="mt-2 text-brand-slate">{CATEGORY_BLURB[g.slug]}</p>}
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {g.programs.map((p) => (
                  <article
                    key={p.slug}
                    className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
                  >
                    <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-crimson/10 p-2.5 text-brand-crimson">
                      <ProgramEmblem variant={p.slug} />
                    </span>
                    <h3 className="font-display text-lg font-bold text-brand-navy">{p.name}</h3>
                    {p.tagline && <p className="mt-1 text-sm font-semibold text-brand-crimson">{p.tagline}</p>}
                    <p className="mt-2 text-sm leading-relaxed text-brand-slate">{p.summary}</p>
                    <ul className="mt-4 space-y-1 text-sm text-brand-slate">
                      {p.duration && <li><strong className="font-semibold text-brand-navy">Duration:</strong> {p.duration}</li>}
                      {p.sessions && <li><strong className="font-semibold text-brand-navy">Sessions:</strong> {p.sessions}</li>}
                      {p.mode && <li><strong className="font-semibold text-brand-navy">Mode:</strong> {p.mode}</li>}
                    </ul>
                    <div className="mt-6 flex flex-1 flex-col justify-end gap-2.5 sm:flex-row">
                      <Link
                        to={`/services/${p.slug}`}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-brand-crimson px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
                      >
                        View details
                      </Link>
                      {/* Programmes sold after a call (Breakthrough) send you to
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="bg-soft py-16 md:py-20">
          <div className="container">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">Success stories</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">What clients say</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="flex flex-col rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm">
                  <blockquote className="flex-1 leading-relaxed text-brand-navy/80">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 border-t border-brand-navy/10 pt-4">
                    {t.photo && <img src={t.photo} alt="" loading="lazy" className="size-11 rounded-full object-cover" />}
                    <div className="leading-tight">
                      <strong className="block text-sm font-bold text-brand-navy">{t.name}</strong>
                      {t.role && <span className="text-xs font-semibold text-brand-slate">{t.role}</span>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                to="/resources/success-stories"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-6 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
              >
                Read all success stories
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
