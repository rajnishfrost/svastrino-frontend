import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import Markdown from '../../../common_component/user/Markdown/Markdown.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchSitePage } from '../../../api/content.js'
import './LegalPage.css'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/** Renders a policy page (/legal/:slug) served by /api/user/content/pages. */
export default function LegalPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)
    setPage(null)

    fetchSitePage(slug)
      .then((d) => { if (!cancelled) setPage(d.page) })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 404) setNotFound(true)
        else setError(err)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [slug, reloadKey])

  const retry = () => setReloadKey((k) => k + 1)

  if (loading) {
    return (
      <section className="section">
        <div className="container"><p className="legal-state">Loading…</p></div>
      </section>
    )
  }

  if (notFound) {
    return (
      <section className="section">
        <div className="container legal-missing">
          <h1>Page not found</h1>
          <p>That page may have been moved or removed.</p>
          <Link to="/" className="btn btn-primary">Back to home</Link>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <ConnectionState error={error} onRetry={retry} label="this page" />
        </div>
      </section>
    )
  }

  return (
    <>
      <PageHero eyebrow="Legal" title={page.title} />
      <section className="section">
        <div className="container legal-body">
          <p className="legal-updated">Last updated: {formatDate(page.updatedAt)}</p>
          <Markdown>{page.body}</Markdown>
        </div>
      </section>
    </>
  )
}
