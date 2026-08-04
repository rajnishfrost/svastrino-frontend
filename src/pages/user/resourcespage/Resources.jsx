import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchFaqs, fetchTestimonials, fetchCareerLibrary, fetchNews } from '../../../api/content.js'
import { fetchLatestBlogs } from '../../../api/blogs.js'
import './Resources.css'

// Resources = renamed "Library". Holds the Career Library (was "Courselist"),
// FAQs, Quick News and Success Stories — all served from /api/user/content.
const TABS = [
  { key: 'career-library', label: 'Career Library' },
  { key: 'faqs', label: "FAQ's" },
  { key: 'quick-news', label: 'Quick News' },
  { key: 'success-stories', label: 'Success Stories' },
]

const NEWS_PER_PAGE = 30

const formatNewsDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Resources() {
  // Deep links like /resources#faqs open straight onto that tab.
  const initial = TABS.find((t) => t.key === window.location.hash.slice(1))?.key || 'career-library'
  const [tab, setTab] = useState(initial)

  const [fields, setFields] = useState([])
  const [faqs, setFaqs] = useState([])
  const [stories, setStories] = useState([])
  const [latest, setLatest] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Quick News loads lazily on first visit to its tab and appends page by page.
  const [news, setNews] = useState([])
  const [newsPages, setNewsPages] = useState({ page: 0, pages: 1, total: 0 })
  const [newsBusy, setNewsBusy] = useState(false)

  const loadMoreNews = () => {
    if (newsBusy || (newsPages.page > 0 && newsPages.page >= newsPages.pages)) return
    setNewsBusy(true)
    fetchNews(newsPages.page + 1, NEWS_PER_PAGE)
      .then((d) => {
        setNews((prev) => [...prev, ...d.news])
        setNewsPages(d.pagination)
      })
      .catch(() => { /* the main error state covers connectivity; ignore here */ })
      .finally(() => setNewsBusy(false))
  }

  useEffect(() => {
    if (tab === 'quick-news' && news.length === 0) loadMoreNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([fetchCareerLibrary(), fetchFaqs(), fetchTestimonials(), fetchLatestBlogs(3)])
      .then(([c, f, t, b]) => {
        if (cancelled) return
        setFields(c.fields)
        setFaqs(f.faqs)
        setStories(t.testimonials)
        setLatest(b.posts)
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

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Resources"
        subtitle="Career library, FAQs and success stories — everything we've learned, in one place."
      />

      <section className="section">
        <div className="container">
          <div className="resource-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`resource-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && <p className="resource-state">Loading…</p>}
          {error && !loading && (
            <ConnectionState error={error} onRetry={retry} label="the resources" />
          )}

          {/* ---- Career library ---- */}
          {!loading && !error && tab === 'career-library' && (
            <div id="career-library">
              <p className="resource-intro">
                Explore career streams and the courses that sit under each. Not sure where you fit?
                A <Link to="/mentoring">mentoring session</Link> will help you narrow it down.
              </p>
              <div className="grid grid-3">
                {fields.map((f) => (
                  <article key={f.slug} className="card resource-card">
                    <h3>
                      {f.name}
                      <span className="resource-count">{f.courseCount}</span>
                    </h3>
                    {f.courses.length > 0 ? (
                      <ul className="resource-courses">
                        {f.courses.map((c) => (
                          <li key={c.slug}>
                            <Link to={`/career-library/${c.slug}`}>{c.name}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="resource-muted">Courses coming soon.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ---- FAQs ---- */}
          {!loading && !error && tab === 'faqs' && (
            <div id="faqs" className="resource-faqs">
              {faqs.map((group) => (
                <div key={group.section} className="resource-faq-group">
                  <h3>{group.section}</h3>
                  {group.items.map((item) => {
                    const open = openFaq === item.id
                    return (
                      <div key={item.id} className={`resource-faq${open ? ' open' : ''}`}>
                        <button
                          className="resource-faq-q"
                          onClick={() => setOpenFaq(open ? null : item.id)}
                          aria-expanded={open}
                        >
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

          {/* ---- Quick News ---- */}
          {!loading && !error && tab === 'quick-news' && (
            <div id="quick-news" className="resource-news">
              <p className="resource-intro">
                Short education &amp; career headlines curated by the Svastrino team
                {newsPages.total ? ` — ${newsPages.total} entries.` : '.'}
              </p>

              <ul className="resource-news-list">
                {news.map((n) => (
                  <li key={n.id}>
                    <span className="resource-news-date">{formatNewsDate(n.date)}</span>
                    <p>{n.text}</p>
                  </li>
                ))}
              </ul>

              {news.length === 0 && newsBusy && <p className="resource-state">Loading news…</p>}

              {newsPages.page < newsPages.pages && news.length > 0 && (
                <div className="text-center" style={{ marginTop: 'var(--space-4)' }}>
                  <button className="btn btn-secondary" onClick={loadMoreNews} disabled={newsBusy}>
                    {newsBusy ? 'Loading…' : `Load more (${newsPages.total - news.length} left)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---- Success stories ---- */}
          {!loading && !error && tab === 'success-stories' && (
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
