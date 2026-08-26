import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { api } from '../../api/client.js'
import BlogPost from './blogpage/BlogPost.jsx'
import CourseDetail from './careerlibrarypage/CourseDetail.jsx'
import NotFound from './notfoundpage/NotFound.jsx'

/**
 * Whatever the old site published at the root of the domain.
 *
 * svastrino.com ran on WordPress, which served every article and every career
 * page straight off the root — svastrino.com/law/, svastrino.com/finding-
 * meaning-and-purpose-in-your-professional-life/. Those addresses carry years
 * of search ranking, so the new site answers on them rather than moving
 * everything under /blog/ and /career-library/ and asking Google to follow a
 * few hundred redirects.
 *
 * One address has to serve two kinds of page and only the server knows which,
 * so this asks, then hands over to the page that already knew how to render it.
 * Nothing was duplicated: BlogPost and CourseDetail read the slug from the
 * route themselves, and the route parameter is named the same either way.
 *
 * This route is declared LAST, so every real route wins first. An address that
 * belongs to neither falls through to the same Not Found page it always did.
 */
export default function RootSlug() {
  const { slug } = useParams()
  const [type, setType] = useState(undefined) // undefined = still asking

  useEffect(() => {
    let cancelled = false
    setType(undefined)
    api(`/user/content/resolve/${encodeURIComponent(slug)}`)
      .then((d) => { if (!cancelled) setType(d?.type || null) })
      .catch(() => { if (!cancelled) setType(null) })
    return () => { cancelled = true }
  }, [slug])

  // Nothing is drawn while the question is out. Showing a Not Found first and
  // then replacing it would flash the wrong page at every visitor.
  if (type === undefined) return null

  if (type === 'course') return <CourseDetail />
  if (type === 'blog') return <BlogPost />
  return <NotFound />
}

/**
 * Send a prefixed address on to the root one.
 *
 * /blog/<slug> and /career-library/<slug> were the shapes this app used before
 * the legacy URLs were adopted. They are kept so an old bookmark or a link
 * that was missed still lands somewhere, but they do not stay: one page having
 * two addresses is how a site ends up competing with itself in search results.
 *
 * `replace` so the prefixed form does not sit in the visitor's history and send
 * them back to it on the way out.
 */
export function ToRootSlug() {
  const { slug } = useParams()
  return <Navigate to={`/${slug}`} replace />
}
