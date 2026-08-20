import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchProgram } from '../../../api/content.js'
import './Services.css'

/**
 * A single program's own page (Bull's Eye / Bloom / Breakthrough). Pulls the
 * marketing detail from the content module and offers a "Book now" CTA that
 * opens the booking wizard pre-selected to this program's SKU.
 */
export default function ServiceProgram() {
  const { slug } = useParams()
  const [program, setProgram] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setProgram(null); setError(null)
    fetchProgram(slug)
      .then((d) => { if (!cancelled) setProgram(d.program) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [slug, reloadKey])

  const bookHref = program?.bookingSku ? `/book-online?program=${program.bookingSku}` : '/book-online'

  if (error) {
    return (
      <>
        <PageHero eyebrow="Services" title="Program" />
        <section className="section"><div className="container">
          <ConnectionState error={error} onRetry={() => setReloadKey((k) => k + 1)} label="this program" />
        </div></section>
      </>
    )
  }

  if (!program) {
    return (
      <>
        <PageHero eyebrow="Services" title="Loading…" />
        <section className="section"><div className="container"><p className="svc-state">Loading…</p></div></section>
      </>
    )
  }

  return (
    <>
      <PageHero
        eyebrow={program.category?.name || 'Services'}
        title={program.name}
        subtitle={program.tagline}
      >
        <Link to={bookHref} className="btn btn-accent btn-large">Book now</Link>
        <Link to="/services" className="btn btn-secondary btn-large">All services</Link>
      </PageHero>

      <section className="section">
        <div className="container svc-detail-wrap">
          {/* Overview facts */}
          <div className="card svc-panel">
            <p className="svc-summary-lg">{program.summary}</p>
            <ul className="svc-facts svc-facts-row">
              {program.duration && <li><strong>Duration:</strong> {program.duration}</li>}
              {program.sessions && <li><strong>Sessions:</strong> {program.sessions}</li>}
              {program.mode && <li><strong>Mode:</strong> {program.mode}</li>}
            </ul>
          </div>

          {program.chooseIf?.length > 0 && (
            <div className="card svc-panel">
              <h2 className="svc-h2">Choose this program if…</h2>
              <ul className="svc-list">{program.chooseIf.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}

          {program.journey?.length > 0 && (
            <div className="card svc-panel">
              <h2 className="svc-h2">Program journey</h2>
              <ol className="svc-journey">
                {program.journey.map((s, i) => (
                  <li key={i}>
                    {s.label && <span className="svc-stage">{s.label}</span>}
                    <strong>{s.title}</strong>
                    {s.description && <p>{s.description}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {program.benefits?.length > 0 && (
            <div className="card svc-panel">
              <h2 className="svc-h2">Benefits</h2>
              <ul className="svc-list">{program.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="card svc-panel svc-cta">
            <h2 className="svc-h2">Ready to begin {program.name}?</h2>
            <div className="svc-actions">
              <Link to={bookHref} className="btn btn-primary btn-large">Book now</Link>
              {program.brochureUrl && (
                <a className="btn btn-secondary btn-large" href={program.brochureUrl} target="_blank" rel="noopener noreferrer">
                  Download brochure (PDF)
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
