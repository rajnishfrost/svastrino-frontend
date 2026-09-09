import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ProgramHeroArt from '../servicespage/sections/ProgramHeroArt.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import SearchSuggest from '../../../common_component/user/SearchSuggest/SearchSuggest.jsx'
import FaqAccordion from '../../../common_component/user/FaqAccordion/FaqAccordion.jsx'
import { fetchFaqs, fetchTestimonials, fetchCareerLibrary, fetchCourses } from '../../../api/content.js'
import { fetchLatestBlogs } from '../../../api/blogs.js'
import PageSeo from '../../../seo/PageSeo.jsx'

/**
 * Resources hub. Each sub-category is now its OWN page:
 *   /resources                    → landing (links to the three)
 *   /resources/career-library     → career streams + courses
 *   /resources/faqs               → FAQs
 *   /resources/success-stories    → client stories
 * One component drives them all via the `view` prop (set by the route).
 */
// The Career Library reads like the blog: a stream filter, a search box and
// twelve courses to a page — three full rows on a desktop grid.
const PER_PAGE = 12

const SUBPAGES = [
  { key: 'career-library', to: '/resources/career-library', label: 'Career Library', blurb: 'Explore career streams and the courses under each.' },
  { key: 'faqs', to: '/resources/faqs', label: 'FAQs', blurb: 'Answers to common questions about mentoring & counselling.' },
  { key: 'success-stories', to: '/resources/success-stories', label: 'Success Stories', blurb: 'Real results from students and parents we’ve guided.' },
]

// One component answers four addresses, so each needs its own title and
// description — otherwise all four compete in search results as the same page.
const VIEW_SEO = {
  all: {
    title: 'Resources — career library, blogs, FAQs and success stories',
    description:
      'Explore careers and courses at your own pace: a library of 52 career fields, articles on mentoring and studying abroad, answers to common questions, and stories from students we have guided.',
  },
  'career-library': {
    title: 'Career Library — explore 52 careers and the courses that lead to them',
    description:
      'Browse careers by stream — science, commerce, arts, engineering and more — with what each field involves, the roles it leads to, where to study, and how salaries progress.',
  },
  faqs: {
    title: "FAQs — how Svastrino's mentoring and courses work",
    description:
      'Answers to what people ask before starting: how sessions are booked, what each program covers, how the course is paced, and how payments and refunds work.',
  },
  'success-stories': {
    title: 'Success stories — students we have guided, in their words',
    description:
      'Read what students and parents say after working with Svastrino: the confusion they arrived with, what changed, and where they went next.',
  },
}

export default function Resources({ view = 'all' }) {
  // The Career Library's stream, page and search live in the URL, so a filtered
  // view is shareable and survives a refresh — the same as /blog.
  const [params, setParams] = useSearchParams()
  const field = params.get('field') || ''
  const page = Number(params.get('page')) || 1
  const q = params.get('q') || ''

  const [fields, setFields] = useState([])
  const [faqs, setFaqs] = useState([])
  const [stories, setStories] = useState([])
  const [latest, setLatest] = useState([])
  const [search, setSearch] = useState(q) // what is typed, before it is applied
  const [courses, setCourses] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [coursesLoading, setCoursesLoading] = useState(true)
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

  // A page of courses. Separate from the effect above so paging or switching
  // stream re-fetches one page, not the whole stream list behind the chips.
  useEffect(() => {
    if (view !== 'career-library') return
    let cancelled = false
    setCoursesLoading(true)

    fetchCourses({ page, limit: PER_PAGE, field, q })
      .then((d) => {
        if (cancelled) return
        setCourses(d.courses)
        setPagination(d.pagination)
      })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setCoursesLoading(false) })

    return () => { cancelled = true }
  }, [view, page, field, q, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)

  // Changing a filter returns to page one — staying on page four of a list that
  // now has two shows an empty grid and reads as broken.
  const update = (next) => {
    const merged = { field, q, ...next }
    const clean = {}
    Object.entries(merged).forEach(([k, v]) => { if (v) clean[k] = v })
    setParams(clean)
  }

  const goToPage = (n) => {
    const clean = { page: String(n) }
    if (field) clean.field = field
    if (q) clean.q = q
    setParams(clean)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // The five closest courses, offered under the box while the reader types.
  const suggestCourses = useCallback(
    (query) =>
      fetchCourses({ limit: 5, q: query }).then((d) =>
        d.courses.map((c) => ({
          key: c.slug,
          label: c.name,
          sub: c.fields.map((f) => f.name).join(' · '),
          to: `/${c.slug}`,
        }))
      ),
    []
  )

  // Emptying the box drops the filter with it. The applied search lives in the
  // URL and used to change only on submit, so clearing the field with its ✕ left
  // the box looking empty over a list that was still filtered by what had been
  // in it.
  const onSearchChange = (next) => {
    setSearch(next)
    if (!next.trim() && q) update({ q: '' })
  }

  const onSearch = (e) => {
    e.preventDefault()
    update({ q: search.trim() })
  }

  const filterBtn = (active) =>
    `cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'border-brand-crimson bg-brand-crimson text-white'
        : 'border-brand-navy/15 bg-white text-brand-navy hover:border-brand-crimson hover:text-brand-crimson'
    }`

  const meta = SUBPAGES.find((s) => s.key === view)
  // Themed hero illustration per resources sub-view.
  const heroArt = {
    all: '/assets/images/all-resources-t.png',
    'career-library': '/assets/images/library.png',
    faqs: '/assets/images/faqs-t.png',
    'success-stories': '/assets/images/success-t.png',
  }[view] || '/assets/images/all-resources-t.png'

  const cardClass =
    'rounded-xl border border-brand-navy/5 bg-white p-6 shadow-sm'

  return (
    <>
      <PageSeo {...VIEW_SEO[view] || VIEW_SEO.all} />
      <PageHero
        eyebrow="Resources"
        title={meta ? meta.label : 'Resources'}
        subtitle={meta ? meta.blurb : "Career library, FAQs and success stories — everything we've learned, in one place."}
        illustration={<ProgramHeroArt src={heroArt} alt="" />}
      />

      <section className="bg-white py-10 md:py-14">
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

              <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button className={filterBtn(!field)} onClick={() => update({ field: '' })}>
                    All{!field && !q ? ` (${pagination.total})` : ''}
                  </button>
                  {fields.map((f) => (
                    <button
                      key={f.slug}
                      className={filterBtn(field === f.slug)}
                      onClick={() => update({ field: f.slug })}
                    >
                      {f.name} ({f.courseCount})
                    </button>
                  ))}
                </div>

                <form className="flex shrink-0 items-center gap-2" onSubmit={onSearch}>
                  <SearchSuggest
                    className="flex-1 md:w-56"
                    value={search}
                    onChange={onSearchChange}
                    suggest={suggestCourses}
                    icon={Search}
                    placeholder="Search careers…"
                    ariaLabel="Search the career library"
                    emptyLabel="No matching careers"
                  />
                  <button
                    type="submit"
                    className="h-10 shrink-0 cursor-pointer rounded-lg border border-brand-navy/15 bg-white px-4 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
                  >
                    Search
                  </button>
                </form>
              </div>

              {(field || q) && (
                <p className="mt-5 text-sm text-brand-slate">
                  {pagination.total} {pagination.total === 1 ? 'career' : 'careers'}
                  {field && <> in <strong className="text-brand-navy">{fields.find((f) => f.slug === field)?.name || field}</strong></>}
                  {q && <> matching <strong className="text-brand-navy">“{q}”</strong></>}
                  {' · '}
                  <button
                    className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm font-semibold text-brand-crimson hover:underline"
                    onClick={() => { setSearch(''); setParams({}) }}
                  >
                    Clear filters
                  </button>
                </p>
              )}

              {coursesLoading && <p className="mt-10 text-center text-brand-slate">Loading careers…</p>}
              {!coursesLoading && courses.length === 0 && (
                <p className="mt-10 text-center text-brand-slate">
                  Nothing matched that search. Try a different word or another stream.
                </p>
              )}

              {!coursesLoading && courses.length > 0 && (
                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((c) => (
                    <article
                      key={c.slug}
                      className={`group flex flex-col ${cardClass} transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5`}
                    >
                      <h3 className="font-display text-lg font-bold leading-snug text-brand-navy">
                        <Link to={`/${c.slug}`} className="hover:text-brand-crimson">{c.name}</Link>
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-slate">{c.overview}</p>
                      {c.fields.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {c.fields.map((f) => (
                            <button
                              key={f.slug}
                              onClick={() => update({ field: f.slug })}
                              className="cursor-pointer rounded-full border-0 bg-brand-rose px-2.5 py-0.5 font-sans text-xs font-semibold text-brand-crimson hover:underline"
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {!coursesLoading && pagination.pages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Career library pagination">
                  <button
                    className="h-10 cursor-pointer rounded-lg border border-brand-navy/15 bg-white px-5 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-brand-navy"
                    disabled={pagination.page <= 1}
                    onClick={() => goToPage(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-brand-slate">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    className="h-10 cursor-pointer rounded-lg border border-brand-navy/15 bg-white px-5 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-brand-navy"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => goToPage(pagination.page + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          )}

          {/* ---- FAQs ---- */}
          {!loading && !error && view === 'faqs' && (
            <div id="faqs" className="mx-auto max-w-3xl space-y-10">
              {faqs.map((group) => (
                <div key={group.section}>
                  <h3 className="mb-4 font-display text-lg font-bold text-brand-navy">{group.section}</h3>
                  <FaqAccordion items={group.items} />
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
        <section className="bg-soft py-12 md:py-16">
          <div className="container">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-crimson">From the blog</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-brand-navy">
                Latest reading
              </h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {latest.map((p) => (
                <article
                  key={p.slug}
                  className="group flex flex-col overflow-hidden rounded-xl border border-brand-navy/5 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
                >
                  {p.coverImage && (
                    <Link to={`/${p.slug}`} className="block aspect-[16/9] overflow-hidden">
                      <img
                        src={p.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold leading-snug text-brand-navy">
                      <Link to={`/${p.slug}`} className="hover:text-brand-crimson">{p.title}</Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-slate">{p.excerpt}</p>
                  </div>
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
