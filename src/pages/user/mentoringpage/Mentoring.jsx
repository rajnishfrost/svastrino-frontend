import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchPrograms, fetchProgram, fetchTestimonials } from '../../../api/content.js'
import './Mentoring.css'

export default function Mentoring() {
  const [programs, setPrograms] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Slug of the program whose detail panel is expanded, plus a cache of the
  // details we've already fetched so re-opening is instant.
  const [openSlug, setOpenSlug] = useState(null)
  const [details, setDetails] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([fetchPrograms(), fetchTestimonials(true)])
      .then(([p, t]) => {
        if (cancelled) return
        setPrograms(p.programs)
        setTestimonials(t.testimonials)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [reloadKey])

  const retry = () => setReloadKey((k) => k + 1)

  const toggle = async (slug) => {
    if (openSlug === slug) {
      setOpenSlug(null)
      return
    }
    setOpenSlug(slug)
    if (details[slug]) return

    try {
      const { program } = await fetchProgram(slug)
      setDetails((d) => ({ ...d, [slug]: program }))
    } catch {
      // Leave the panel showing its loading line; the summary is still useful.
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Mentoring"
        title="1-on-1 Career Mentoring"
        subtitle="Personalised career mentoring programs — choose the depth of guidance that fits your moment."
      >
        <Link to="/book-online" className="btn btn-accent btn-large">Book Online</Link>
      </PageHero>

      <section className="section">
        <div className="container mentoring-list">
          {loading && <p className="mentoring-state">Loading programs…</p>}
          {error && !loading && (
            <ConnectionState error={error} onRetry={retry} label="the programs" />
          )}

          {!loading && !error && programs.map((p) => {
            const open = openSlug === p.slug
            const detail = details[p.slug]

            return (
              <article key={p.slug} id={p.slug} className="card mentoring-card">
                <div className="mentoring-card-main">
                  <div className="mentoring-card-head">
                    <div>
                      <span className="mentoring-duration">{p.duration}</span>
                      <h3>{p.name}</h3>
                      {p.tagline && <p className="mentoring-tagline">{p.tagline}</p>}
                      <p>{p.summary}</p>
                      <ul className="mentoring-facts">
                        {p.sessions && <li><strong>Sessions:</strong> {p.sessions}</li>}
                        {p.mode && <li><strong>Mode:</strong> {p.mode}</li>}
                      </ul>
                    </div>

                    <div className="mentoring-actions">
                      <Link to="/book-online" className="btn btn-secondary">Enquire</Link>
                      <button
                        className="mentoring-toggle"
                        onClick={() => toggle(p.slug)}
                        aria-expanded={open}
                      >
                        {open ? 'Hide details' : 'View details'}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="mentoring-detail">
                      {!detail && <p className="mentoring-state">Loading details…</p>}

                      {detail && (
                        <>
                          {detail.chooseIf?.length > 0 && (
                            <div className="mentoring-detail-block">
                              <h4>Choose this program if…</h4>
                              <ul>
                                {detail.chooseIf.map((c, i) => <li key={i}>{c}</li>)}
                              </ul>
                            </div>
                          )}

                          {detail.journey?.length > 0 && (
                            <div className="mentoring-detail-block">
                              <h4>Program journey</h4>
                              <ol className="mentoring-journey">
                                {detail.journey.map((s, i) => (
                                  <li key={i}>
                                    {s.label && <span className="mentoring-stage">{s.label}</span>}
                                    <strong>{s.title}</strong>
                                    {s.description && <p>{s.description}</p>}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {detail.benefits?.length > 0 && (
                            <div className="mentoring-detail-block">
                              <h4>Benefits</h4>
                              <ul>
                                {detail.benefits.map((b, i) => <li key={i}>{b}</li>)}
                              </ul>
                            </div>
                          )}

                          {detail.brochureUrl && (
                            <a
                              className="btn btn-secondary"
                              href={detail.brochureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download brochure (PDF)
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}

          <div id="program-finder" className="mentoring-finder">
            <h3>Not sure which to pick?</h3>
            <p>
              Start with the 15-minute <strong>Model Session</strong> — we’ll identify what you need
              and point you to the right program.
            </p>
            <Link to="/book-online" className="btn btn-primary">Book a Model Session</Link>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="text-center">
              <p className="section-eyebrow">Success stories</p>
              <h2 className="section-title">What mentees say</h2>
            </div>
            <div className="grid grid-3">
              {testimonials.map((t) => (
                <figure key={t.id} className="card mentoring-quote">
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
              <Link to="/resources#success-stories" className="btn btn-secondary">
                Read all success stories
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
