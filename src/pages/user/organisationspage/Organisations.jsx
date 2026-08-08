import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import { api } from '../../../api/client.js'
import './Organisations.css'

/**
 * Public directory of every partner organisation — schools, colleges, villages,
 * NGOs, coaching centres, companies.
 *
 * Listing is opt-in: an organisation that unticks "list us publicly" in its
 * portal simply never appears here, which is why this is a separate page rather
 * than a slice of the scholarship page.
 */
export default function Organisations() {
  const [orgs, setOrgs] = useState(null)
  const [filters, setFilters] = useState({ types: [], states: [] })
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  useEffect(() => {
    api('/user/organisations/filters').then(setFilters).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (type) params.set('type', type)
    if (state) params.set('state', state)
    const qs = params.toString()
    // Debounced so typing doesn't fire a request per keystroke.
    const t = setTimeout(() => {
      api(`/user/organisations${qs ? `?${qs}` : ''}`)
        .then((d) => setOrgs(d.organisations))
        .catch((e) => setError(e.message))
    }, 250)
    return () => clearTimeout(t)
  }, [q, type, state])

  const typeLabel = useMemo(
    () => Object.fromEntries(filters.types.map((t) => [t.key, t.label])),
    [filters.types]
  )

  return (
    <div className="orgs-page">
      <PageHero
        eyebrow="Our partners"
        title="Organisations running the Nirmaan scholarship"
        subtitle="Schools, colleges, villages, NGOs and more — every one of them giving a deserving student their entire Nirmaan package, free."
      >
        <Link to="/nirmaan-scholarship#partner" className="btn btn-primary btn-large">Partner your organisation</Link>
      </PageHero>

      <section className="section">
        <div className="container">
          <div className="orgs-filters">
            <input
              className="orgs-search"
              placeholder="Search by name, city or state…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search organisations"
            />
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type">
              <option value="">All types</option>
              {filters.types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <select value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by state">
              <option value="">All states</option>
              {filters.states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && <p className="orgs-error">{error}</p>}

          {!orgs ? (
            <p className="orgs-empty">Loading…</p>
          ) : orgs.length === 0 ? (
            <p className="orgs-empty">
              No organisations match that. {q || type || state ? 'Try clearing the filters.' : 'Check back soon.'}
            </p>
          ) : (
            <>
              <p className="orgs-count">{orgs.length} partner{orgs.length === 1 ? '' : 's'}</p>
              <div className="orgs-grid">
                {orgs.map((o) => (
                  <article key={o.id} className="card orgs-card">
                    <span className="orgs-type">{typeLabel[o.type] || o.type}</span>
                    <h3>{o.name}</h3>
                    {(o.branch || o.city || o.state) && (
                      <p className="orgs-place">{[o.branch, o.city, o.state].filter(Boolean).join(' · ')}</p>
                    )}
                    {o.description && <p className="orgs-desc">{o.description}</p>}
                    {o.website && (
                      <a className="orgs-link" href={o.website} target="_blank" rel="noreferrer noopener">
                        Visit website ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section section--alt">
        <div className="container text-center orgs-cta">
          <p className="section-eyebrow">For organisations</p>
          <h2 className="section-title">Bring the scholarship to your students</h2>
          <p className="section-sub">
            Any school, college, village body, NGO or company can partner with us. You get your own
            portal to add students, set your test and pick your winner.
          </p>
          <Link to="/nirmaan-scholarship#partner" className="btn btn-primary btn-large">Apply to partner</Link>
        </div>
      </section>
    </div>
  )
}
