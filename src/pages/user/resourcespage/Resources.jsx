import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Minus, Plus, Search } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchFaqs, fetchTestimonials, fetchCareerLibrary } from '../../../api/content.js'
import { fetchLatestBlogs } from '../../../api/blogs.js'

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

  const cardClass =
    'rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm'

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={meta ? meta.label : 'Resources'}
        subtitle={meta ? meta.blurb : "Career library, FAQs and success stories — everything we've learned, in one place."}
      />

      <section className="bg-white py-16 md:py-20">
        <div className="container">
          {/* ---- Landing ---- */}
          {view === 'all' && (
            <div className="grid gap-6 md:grid-cols-3">
              {SUBPAGES.map((s) => (
                <Link
                  key={s.key}
                  to={s.to}
                  className={`group flex flex-col ${cardClass} transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5`}
                >
                  <h3 className="font-display text-xl font-bold text-brand-navy">{s.label}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-slate">{s.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-crimson">
                    Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          )}

          {loading && view !== 'all' && <p className="text-center text-brand-slate">Loading…</p>}
          {error && !loading && <ConnectionState error={error} onRetry={retry} label="the resources" />}

          {/* ---- Career library ---- */}
          {!loading && !error && view === 'career-library' && (
            <div id="career-library">
              <p className="mx-auto max-w-2xl text-center text-brand-slate">
                Explore career streams and the courses that sit under each. Not sure where you fit? A{' '}
                <Link to="/services" className="font-semibold text-brand-crimson hover:underline">
                  counselling session
                </Link>{' '}
                will help you narrow it down.
              </p>

              <div className="mx-auto mt-8 flex max-w-xl items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-slate" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search a career or a stream — try “design” or “commerce”"
                    aria-label="Search the career library"
                    className="h-11 w-full rounded-lg border border-brand-navy/15 bg-white pl-9 pr-3 text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15"
                  />
                </div>
                {term && (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="h-11 shrink-0 cursor-pointer rounded-lg border border-brand-navy/15 bg-white px-4 text-sm font-medium text-brand-navy hover:text-brand-crimson"
                  >
                    Clear
                  </button>
                )}
              </div>
              {term && (
                <p className="mt-3 text-center text-sm text-brand-slate">
                  {matchCount
                    ? `${matchCount} career${matchCount === 1 ? '' : 's'} across ${shownFields.length} stream${shownFields.length === 1 ? '' : 's'}`
                    : 'Nothing matched that search.'}
                </p>
              )}

              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shownFields.map((f) => (
                  <article key={f.slug} className={cardClass}>
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-brand-navy">
                      {f.name}
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand-rose px-2 text-xs font-semibold text-brand-crimson">
                        {term ? f.courses.length : f.courseCount}
                      </span>
                    </h3>
                    {f.courses.length > 0 ? (
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {f.courses.map((c) => (
                          <li key={c.slug}>
                            <Link to={`/${c.slug}`} className="text-brand-slate hover:text-brand-crimson hover:underline">
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-brand-slate">Courses coming soon.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ---- FAQs ---- */}
          {!loading && !error && view === 'faqs' && (
            <div id="faqs" className="mx-auto max-w-3xl space-y-8">
              {faqs.map((group) => (
                <div key={group.section}>
                  <h3 className="font-display text-lg font-bold text-brand-navy">{group.section}</h3>
                  <div className="mt-3 divide-y divide-brand-navy/10 border-y border-brand-navy/10">
                    {group.items.map((item) => {
                      const open = openFaq === item.id
                      return (
                        <div key={item.id}>
                          <button
                            className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
                            onClick={() => setOpenFaq(open ? null : item.id)}
                            aria-expanded={open}
                          >
                            <span className="font-medium text-brand-navy">{item.question}</span>
                            <span className="text-brand-crimson">
                              {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
                            </span>
                          </button>
                          {open && <p className="pb-4 text-sm leading-relaxed text-brand-slate">{item.answer}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---- Success stories ---- */}
          {!loading && !error && view === 'success-stories' && (
            <div id="success-stories" className="grid gap-6 md:grid-cols-2">
              {stories.map((s) => (
                <figure key={s.id} className={`flex flex-col ${cardClass}`}>
                  <blockquote className="flex-1 leading-relaxed text-brand-navy/80">“{s.quote}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 border-t border-brand-navy/10 pt-4">
                    {s.photo && <img src={s.photo} alt="" loading="lazy" className="size-11 rounded-full object-cover" />}
                    <div className="leading-tight">
                      <strong className="block text-sm font-bold text-brand-navy">{s.name}</strong>
                      {s.role && <span className="text-xs font-semibold text-brand-slate">{s.role}</span>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="bg-soft py-16 md:py-20">
          <div className="container">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">From the blog</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">
                Latest reading
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {latest.map((p) => (
                <article key={p.slug} className={cardClass}>
                  <h3 className="font-display text-lg font-bold text-brand-navy">
                    <Link to={`/${p.slug}`} className="hover:text-brand-crimson">{p.title}</Link>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-slate">{p.excerpt}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                to="/blog"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-6 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
              >
                Browse all posts
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
