import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Markdown from '../../../common_component/user/Markdown/Markdown.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchBlog } from '../../../api/blogs.js'
import './Blog.css'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)
    setPost(null)

    fetchBlog(slug)
      .then((d) => {
        if (cancelled) return
        setPost(d.post)
        setRelated(d.related)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 404) setNotFound(true)
        else setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [slug, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)

  if (loading) {
    return (
      <section className="section">
        <div className="container"><p className="blog-state">Loading article…</p></div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="section">
        <div className="container blog-article-missing">
          <h1>Post not found</h1>
          <p>That article may have been moved or removed.</p>
          <Link to="/blog" className="btn btn-primary">Back to all posts</Link>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <ConnectionState error={error} onRetry={retry} label="this article" />
          <p style={{ textAlign: 'center' }}>
            <Link to="/blog" className="btn btn-secondary">Back to all posts</Link>
          </p>
        </div>
      </section>
    )
  }

  return (
    <article className="blog-article">
      <header className="blog-article-head">
        <div className="container">
          <Link to="/blog" className="blog-back">← All posts</Link>

          <div className="blog-article-cats">
            <span className={`badge badge--${post.owner}`}>
              {post.owner === 'nirmaan' ? 'Nirmaan' : 'Svastrino'}
            </span>
            {post.categories.map((c) => (
              <Link key={c} to={`/blog?category=${encodeURIComponent(c)}`} className="blog-cat-chip">
                {c}
              </Link>
            ))}
          </div>

          <h1>{post.title}</h1>

          <p className="blog-article-meta">
            By {post.author} · {formatDate(post.publishedAt)} · {post.readingMins} min read
          </p>
        </div>
      </header>

      {post.coverImage && (
        <div className="container">
          <img className="blog-article-cover" src={post.coverImage} alt="" />
        </div>
      )}

      <div className="container blog-article-body">
        <Markdown>{post.body}</Markdown>

        <div className="blog-article-cta card">
          <h3>Want guidance on your own path?</h3>
          <p>
            Start with a 15-minute Model Session — we’ll help you identify what you need and which
            program fits you.
          </p>
          <Link to="/book-online" className="btn btn-accent">Book a session</Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <h2 className="section-title" style={{ fontSize: 28 }}>Related reading</h2>
            <div className="grid grid-3">
              {related.map((r) => (
                <article key={r.slug} className="card blog-card">
                  {r.coverImage && (
                    <Link to={`/blog/${r.slug}`} className="blog-card-media">
                      <img src={r.coverImage} alt="" loading="lazy" />
                    </Link>
                  )}
                  <h3><Link to={`/blog/${r.slug}`}>{r.title}</Link></h3>
                  <p>{r.excerpt}</p>
                  <div className="blog-card-meta">
                    <span>{formatDate(r.publishedAt)}</span>
                    <span>·</span>
                    <span>{r.readingMins} min read</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
