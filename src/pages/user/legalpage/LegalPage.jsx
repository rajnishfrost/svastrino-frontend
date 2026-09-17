import { Link, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import Markdown from '../../../common_component/user/Markdown/Markdown.jsx'
import { LEGAL_PAGES } from '../../../content/legal/index.js'
import { usePageSeo } from '../../../seo/PageSeo.jsx'
import { excerptFor } from '../../../seo/useSeo.js'
import './LegalPage.css'

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/** Renders a policy page (/legal/:slug) from local content in src/content/legal. */
export default function LegalPage() {
  const { slug } = useParams()
  const page = LEGAL_PAGES[slug] || null

  // The policy's own name and opening lines, so a terms page is not indexed
  // under the site's generic title.
  usePageSeo({
    title: page?.title,
    description: excerptFor(page?.body),
    ready: !!page,
  })

  if (!page) {
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
