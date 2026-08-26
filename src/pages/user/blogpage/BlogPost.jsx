import { useEffect, useState } from 'react'
import { excerptFor } from '../../../seo/useSeo.js'
import { useRootSeo } from '../../../seo/PageSeo.jsx'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Markdown from '../../../common_component/user/Markdown/Markdown.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchBlog } from '../../../api/blogs.js'

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

  // The article keeps the address the old site ranked for, so that is the
  // canonical one — see RootSlug.
  useRootSeo({
    slug,
    ready: !!post,
    title: post?.title,
    description: post?.excerpt || excerptFor(post?.body),
    image: post?.coverImage || undefined,
    type: 'article',
  })

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
      <section className="py-20">
        <div className="container"><p className="text-center text-brand-slate">Loading article…</p></div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="py-24">
        <div className="container mx-auto max-w-xl text-center">
          <h1 className="font-display text-3xl font-extrabold text-brand-navy">Post not found</h1>
          <p className="mt-3 text-brand-slate">That article may have been moved or removed.</p>
          <Link
            to="/blog"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-crimson px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
          >
            Back to all posts
          </Link>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20">
        <div className="container">
          <ConnectionState error={error} onRetry={retry} label="this article" />
          <p className="mt-6 text-center">
            <Link
              to="/blog"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-6 text-sm font-semibold text-brand-navy transition-colors hover:text-brand-crimson"
            >
              Back to all posts
            </Link>
          </p>
        </div>
      </section>
    )
  }

  const nirmaan = post.owner === 'nirmaan'

  return (
    <article>
      <header className="bg-white pt-12 md:pt-16">
        <div className="container mx-auto max-w-3xl">
          <Link to="/blog" className="text-sm font-semibold text-brand-slate hover:text-brand-crimson">
            ← All posts
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                nirmaan ? 'bg-nirmaan-green/10 text-nirmaan-green' : 'bg-brand-navy/10 text-brand-navy'
              }`}
            >
              {nirmaan ? 'Nirmaan' : 'Svastrino'}
            </span>
            {post.categories.map((c) => (
              <Link
                key={c}
                to={`/blog?category=${encodeURIComponent(c)}`}
                className="rounded-full border border-brand-navy/15 px-3 py-0.5 text-xs font-semibold text-brand-slate transition-colors hover:border-brand-crimson hover:text-brand-crimson"
              >
                {c}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-brand-navy md:text-[2.5rem]">
            {post.title}
          </h1>

          <p className="mt-3 text-sm text-brand-slate">
            By {post.author} · {formatDate(post.publishedAt)} · {post.readingMins} min read
          </p>
        </div>
      </header>

      {post.coverImage && (
        <div className="container mx-auto mt-8 max-w-3xl">
          <img className="w-full rounded-2xl" src={post.coverImage} alt="" />
        </div>
      )}

      <div className="container mx-auto max-w-3xl py-10">
        <Markdown>{post.body}</Markdown>

        <div className="mt-10 rounded-2xl border border-brand-navy/5 bg-brand-cream p-8 text-center">
          <h3 className="font-display text-2xl font-extrabold text-brand-navy">
            Want guidance on your own path?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-brand-slate">
            Start with a 15-minute Model Session — we’ll help you identify what you need and which
            program fits you.
          </p>
          <Link
            to="/book-online"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-crimson px-8 text-base font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
          >
            Book a session <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-soft py-16 md:py-20">
          <div className="container">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-navy">
              Related reading
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((r) => (
                <article
                  key={r.slug}
                  className="group flex flex-col overflow-hidden rounded-xl border border-brand-navy/5 bg-white shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-navy/5"
                >
                  {r.coverImage && (
                    <Link to={`/${r.slug}`} className="block aspect-[16/9] overflow-hidden">
                      <img
                        src={r.coverImage}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold leading-snug text-brand-navy">
                      <Link to={`/${r.slug}`} className="hover:text-brand-crimson">{r.title}</Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-slate">{r.excerpt}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-brand-slate">
                      <span>{formatDate(r.publishedAt)}</span>
                      <span>·</span>
                      <span>{r.readingMins} min read</span>
                    </div>
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
