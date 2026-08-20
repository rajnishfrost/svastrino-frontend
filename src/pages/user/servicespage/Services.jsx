import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchPrograms, fetchTestimonials } from '../../../api/content.js'
import './Services.css'

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
      <PageHero
        eyebrow="Services"
        title="Career Counselling & Mentoring"
        subtitle="One-on-one guidance for every stage — from a focused counselling session to long-term personalised mentoring."
      >
        <Link to="/book-online" className="btn btn-accent btn-large">Book Online</Link>
        <Link to="/services/compare" className="btn btn-secondary btn-large">Compare programs</Link>
      </PageHero>

      <section className="section">
        <div className="container">
          {loading && <p className="svc-state">Loading services…</p>}
          {error && !loading && <ConnectionState error={error} onRetry={() => setReloadKey((k) => k + 1)} label="the services" />}

          {!loading && !error && groups.map((g) => (
            <div key={g.slug} id={g.slug} className="svc-group">
              <div className="svc-group-head">
                <h2 className="section-title">{g.name}</h2>
                {CATEGORY_BLURB[g.slug] && <p className="section-sub">{CATEGORY_BLURB[g.slug]}</p>}
              </div>
              <div className="svc-grid">
                {g.programs.map((p) => (
                  <article key={p.slug} className="card svc-card">
                    {p.duration && <span className="svc-duration">{p.duration}</span>}
                    <h3>{p.name}</h3>
                    {p.tagline && <p className="svc-tagline">{p.tagline}</p>}
                    <p className="svc-summary">{p.summary}</p>
                    <ul className="svc-facts">
                      {p.sessions && <li><strong>Sessions:</strong> {p.sessions}</li>}
                      {p.mode && <li><strong>Mode:</strong> {p.mode}</li>}
                    </ul>
                    <div className="svc-actions">
                      <Link to={`/services/${p.slug}`} className="btn btn-primary">View details</Link>
                      {/* Programmes sold after a call (Breakthrough) send you to
                          their own page's call-back form, not to the checkout. */}
                      <Link
                        to={
                          p.buyMode === 'expert-call'
                            ? `/services/${p.slug}#talk-to-an-expert`
                            : p.bookingSku ? `/book-online?program=${p.bookingSku}` : '/book-online'
                        }
                        className="btn btn-secondary"
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
        <section className="section section--alt">
          <div className="container">
            <div className="text-center">
              <p className="section-eyebrow">Success stories</p>
              <h2 className="section-title">What clients say</h2>
            </div>
            <div className="grid grid-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="card svc-quote">
                  <blockquote>“{t.quote}”</blockquote>
                  <figcaption>
                    {t.photo && <img src={t.photo} alt="" loading="lazy" />}
                    <div>
                      <strong>{t.name}</strong>
                      {t.role && <span>{t.role}</span>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="text-center" style={{ marginTop: 'var(--space-5)' }}>
              <Link to="/resources/success-stories" className="btn btn-secondary">Read all success stories</Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
