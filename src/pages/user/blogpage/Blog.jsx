import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchBlogs, fetchBlogCategories } from '../../../api/blogs.js'
import './Blog.css'

const PER_PAGE = 12

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

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

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="From the Svastrino blog"
        subtitle="Insights on careers, mentoring, study abroad and building the skills that matter."
      />

      <section className="section">
        <div className="container">
          <div className="blog-toolbar">
            <div className="blog-filters">
              <button
                className={`blog-filter${!category ? ' active' : ''}`}
                onClick={() => update({ category: '' })}
              >
                All{pagination.total && !category && !q ? ` (${pagination.total})` : ''}
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  className={`blog-filter${category === c.name ? ' active' : ''}`}
                  onClick={() => update({ category: c.name })}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>

            <form className="blog-search" onSubmit={onSearch}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts…"
                aria-label="Search blog posts"
              />
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>
          </div>

          {(category || q) && (
            <p className="blog-result-line">
              {pagination.total} {pagination.total === 1 ? 'post' : 'posts'}
              {category && <> in <strong>{category}</strong></>}
              {q && <> matching <strong>“{q}”</strong></>}
              {' · '}
              <button className="blog-clear" onClick={() => setParams({})}>Clear filters</button>
            </p>
          )}

          {loading && <p className="blog-state">Loading posts…</p>}
          {error && !loading && (
            <ConnectionState error={error} onRetry={retry} label="posts" />
          )}
          {!loading && !error && posts.length === 0 && (
            <p className="blog-state">No posts found. Try a different search or category.</p>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="grid grid-3">
              {posts.map((p) => (
                <article key={p.slug} className="card blog-card">
                  {p.coverImage && (
                    <Link to={`/blog/${p.slug}`} className="blog-card-media">
                      <img src={p.coverImage} alt="" loading="lazy" />
                    </Link>
                  )}
                  <span className={`badge badge--${p.owner}`}>
                    {p.owner === 'nirmaan' ? 'Nirmaan' : 'Svastrino'}
                  </span>
                  <h3>
                    <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <p>{p.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>{formatDate(p.publishedAt)}</span>
                    <span>·</span>
                    <span>{p.readingMins} min read</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && pagination.pages > 1 && (
            <nav className="blog-pagination" aria-label="Blog pagination">
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="blog-page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary"
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
