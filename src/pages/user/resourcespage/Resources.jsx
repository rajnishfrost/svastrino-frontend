import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchFaqs, fetchTestimonials, fetchCareerLibrary } from '../../../api/content.js'
import { fetchLatestBlogs } from '../../../api/blogs.js'
import './Resources.css'

/**
 * Resources hub. Each sub-category is now its OWN page:
 *   /resources                    → landing (links to the three)
 *   /resources/career-library     → career streams + courses
 *   /resources/faqs               → FAQs
 *   /resources/success-stories    → client stories
 * One component drives them all via the `view` prop (set by the route).
 */
const SUBPAGES = [
  { key: 'career-library', to: '/resources/career-library', label: 'Career Library', blurb: 'Explore career streams and the courses under each.' },
  { key: 'faqs', to: '/resources/faqs', label: "FAQ's", blurb: 'Answers to common questions about mentoring & counselling.' },
  { key: 'success-stories', to: '/resources/success-stories', label: 'Success Stories', blurb: 'Real results from students and parents we’ve guided.' },
]

export default function Resources({ view = 'all' }) {
  const [fields, setFields] = useState([])
  const [faqs, setFaqs] = useState([])
  const [stories, setStories] = useState([])
  const [latest, setLatest] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [q, setQ] = useState('') // Career Library search box
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    // Only fetch what the current view needs.
    const jobs = {
      'career-library': () => fetchCareerLibrary().then((c) => setFields(c.fields)),
      faqs: () => fetchFaqs().then((f) => setFaqs(f.faqs)),
      'success-stories': () => fetchTestimonials().then((t) => setStories(t.testimonials)),
    }
    const run = view === 'all'
      ? fetchLatestBlogs(3).then((b) => setLatest(b.posts))
      : Promise.all([jobs[view]?.(), fetchLatestBlogs(3).then((b) => setLatest(b.posts))])

    Promise.resolve(run)
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [view, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)
  const meta = SUBPAGES.find((s) => s.key === view)

  // Career Library search. Matching a STREAM keeps all of its courses; matching
  // only a course narrows that stream down to the courses that matched, so the
  // visitor sees exactly what they searched for and nothing else.
  const term = q.trim().toLowerCase()
  const shownFields = !term
    ? fields
    : fields
        .map((f) => {
          if (f.name.toLowerCase().includes(term)) return f
          const courses = f.courses.filter((c) => c.name.toLowerCase().includes(term))
          return courses.length ? { ...f, courses } : null
        })
        .filter(Boolean)
  const matchCount = shownFields.reduce((n, f) => n + f.courses.length, 0)

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={meta ? meta.label : 'Resources'}
        subtitle={meta ? meta.blurb : "Career library, FAQs and success stories — everything we've learned, in one place."}
      />

      <section className="section">
        <div className="container">
          {/* ---- Landing ---- */}
          {view === 'all' && (
            <div className="grid grid-3">
              {SUBPAGES.map((s) => (
                <Link key={s.key} to={s.to} className="card resource-card resource-hub-card">
                  <h3>{s.label}</h3>
                  <p>{s.blurb}</p>
                  <span className="resource-hub-go">Open →</span>
                </Link>
              ))}
            </div>
          )}

          {loading && view !== 'all' && <p className="resource-state">Loading…</p>}
          {error && !loading && <ConnectionState error={error} onRetry={retry} label="the resources" />}

          {/* ---- Career library ---- */}
          {!loading && !error && view === 'career-library' && (
            <div id="career-library">
              <p className="resource-intro">
                Explore career streams and the courses that sit under each. Not sure where you fit?
                A <Link to="/services">counselling session</Link> will help you narrow it down.
              </p>

              <div className="resource-search">
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search a career or a stream — try “design” or “commerce”"
                  aria-label="Search the career library"
                />
                {term && (
                  <button type="button" className="resource-search-clear" onClick={() => setQ('')}>
                    Clear
                  </button>
                )}
              </div>
              {term && (
                <p className="resource-search-count">
                  {matchCount
                    ? `${matchCount} career${matchCount === 1 ? '' : 's'} across ${shownFields.length} stream${shownFields.length === 1 ? '' : 's'}`
                    : 'Nothing matched that search.'}
                </p>
              )}

              <div className="grid grid-3">
                {shownFields.map((f) => (
                  <article key={f.slug} className="card resource-card">
                    <h3>{f.name}<span className="resource-count">{term ? f.courses.length : f.courseCount}</span></h3>
                    {f.courses.length > 0 ? (
                      <ul className="resource-courses">
                        {f.courses.map((c) => (
                          <li key={c.slug}><Link to={`/career-library/${c.slug}`}>{c.name}</Link></li>
                        ))}
                      </ul>
                    ) : <p className="resource-muted">Courses coming soon.</p>}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ---- FAQs ---- */}
          {!loading && !error && view === 'faqs' && (
            <div id="faqs" className="resource-faqs">
              {faqs.map((group) => (
                <div key={group.section} className="resource-faq-group">
                  <h3>{group.section}</h3>
                  {group.items.map((item) => {
                    const open = openFaq === item.id
                    return (
                      <div key={item.id} className={`resource-faq${open ? ' open' : ''}`}>
                        <button className="resource-faq-q" onClick={() => setOpenFaq(open ? null : item.id)} aria-expanded={open}>
                          <span>{item.question}</span>
                          <span className="resource-faq-icon">{open ? '−' : '+'}</span>
                        </button>
                        {open && <p className="resource-faq-a">{item.answer}</p>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ---- Success stories ---- */}
          {!loading && !error && view === 'success-stories' && (
            <div id="success-stories" className="grid grid-2">
              {stories.map((s) => (
                <figure key={s.id} className="card resource-story">
                  <blockquote>“{s.quote}”</blockquote>
                  <figcaption>
                    {s.photo && <img src={s.photo} alt="" loading="lazy" />}
                    <div>
                      <strong>{s.name}</strong>
                      {s.role && <span>{s.role}</span>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="text-center">
              <p className="section-eyebrow">From the blog</p>
              <h2 className="section-title">Latest reading</h2>
            </div>
            <div className="grid grid-3">
              {latest.map((p) => (
                <article key={p.slug} className="card resource-card">
                  <h3><Link to={`/blog/${p.slug}`}>{p.title}</Link></h3>
                  <p>{p.excerpt}</p>
                </article>
              ))}
            </div>
            <div className="text-center" style={{ marginTop: 'var(--space-5)' }}>
              <Link to="/blog" className="btn btn-secondary">Browse all posts</Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
