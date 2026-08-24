import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchBlogs, fetchBlogCategories } from '../../../api/blogs.js'

const PER_PAGE = 12

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// Ownership badge — Nirmaan posts carry the green sub-brand, everything else Svastrino navy.
function OwnerBadge({ owner }) {
  const nirmaan = owner === 'nirmaan'
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        nirmaan ? 'bg-nirmaan-green/10 text-nirmaan-green' : 'bg-brand-navy/10 text-brand-navy'
      }`}
    >
      {nirmaan ? 'Nirmaan' : 'Svastrino'}
    </span>
  )
}

export default function Blog() {
  // URL is the source of truth so filters/pages are shareable and survive a refresh.
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const page = Number(params.get('page')) || 1
  const q = params.get('q') || ''

  const [search, setSearch] = useState(q)
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    fetchBlogCategories()
      .then((d) => setCategories(d.categories))
      .catch(() => setCategories([]))
  }, [reloadKey])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchBlogs({ page, limit: PER_PAGE, category, q })
      .then((d) => {
        if (cancelled) return
        setPosts(d.posts)
        setPagination(d.pagination)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, category, q, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)

  // Any filter change resets to page 1.
  const update = (next) => {
    const merged = { category, q, ...next }
    const clean = {}
    Object.entries(merged).forEach(([k, v]) => { if (v) clean[k] = v })
    setParams(clean)
  }

  const goToPage = (n) => {
    const clean = { page: String(n) }
    if (category) clean.category = category
    if (q) clean.q = q
    setParams(clean)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="From the Svastrino blog"
        subtitle="Insights on careers, mentoring, study abroad and building the skills that matter."
      />

      <section className="bg-white py-16 md:py-20">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <button className={filterBtn(!category)} onClick={() => update({ category: '' })}>
                All{pagination.total && !category && !q ? ` (${pagination.total})` : ''}
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  className={filterBtn(category === c.name)}
                  onClick={() => update({ category: c.name })}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>

            <form className="flex shrink-0 items-center gap-2" onSubmit={onSearch}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                aria-label="Search blog posts"
                className="h-10 w-full rounded-lg border border-brand-navy/15 bg-white px-3.5 text-sm text-brand-navy placeholder:text-brand-slate/60 focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/15 md:w-56"
              />
              <button
                type="submit"
                className="h-10 shrink-0 cursor-pointer rounded-lg border border-brand-navy/15 bg-white px-4 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
              >
                Search
              </button>
            </form>
          </div>

          {(category || q) && (
            <p className="mt-5 text-sm text-brand-slate">
              {pagination.total} {pagination.total === 1 ? 'post' : 'posts'}
              {category && <> in <strong className="text-brand-navy">{category}</strong></>}
              {q && <> matching <strong className="text-brand-navy">“{q}”</strong></>}
              {' · '}
              <button className="cursor-pointer font-semibold text-brand-crimson hover:underline" onClick={() => setParams({})}>
                Clear filters
              </button>
            </p>
          )}

          {loading && <p className="mt-10 text-center text-brand-slate">Loading posts…</p>}
          {error && !loading && <div className="mt-10"><ConnectionState error={error} onRetry={retry} label="posts" /></div>}
          {!loading && !error && posts.length === 0 && (
            <p className="mt-10 text-center text-brand-slate">No posts found. Try a different search or category.</p>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <article
                  key={p.slug}
                  className="group flex flex-col overflow-hidden rounded-xl border border-brand-navy/5 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
                >
                  {p.coverImage && (
                    <Link to={`/blog/${p.slug}`} className="block aspect-[16/9] overflow-hidden">
                      <img
                        src={p.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <OwnerBadge owner={p.owner} />
                    <h3 className="mt-3 font-display text-lg font-bold leading-snug text-brand-navy">
                      <Link to={`/blog/${p.slug}`} className="hover:text-brand-crimson">{p.title}</Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-slate">{p.excerpt}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-brand-slate">
                      <span>{formatDate(p.publishedAt)}</span>
                      <span>·</span>
                      <span>{p.readingMins} min read</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && pagination.pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Blog pagination">
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
      </section>
    </>
  )
}
