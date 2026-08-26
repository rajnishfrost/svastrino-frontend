import { useLocation } from 'react-router-dom'
import { useSeo } from './useSeo.js'
import { seoFor } from './legacySeo.js'
import { legacyRootSeo } from './legacyRootSeo.js'

/**
 * Metadata for a page whose wording is fixed rather than loaded.
 *
 * Drop it into any page with a settled address and it applies the title and
 * description that address already ranks with — see legacySeo.js for why those
 * are copied rather than rewritten. A page can override either, which is what
 * the ones with no legacy entry do.
 */
export default function PageSeo({ title, description, image, type, ready }) {
  const { pathname } = useLocation()
  const legacy = seoFor(pathname) || {}
  useSeo({
    title: title || legacy.title,
    description: description || legacy.description,
    path: pathname,
    image,
    type,
    // Pages that load their own wording pass `ready`, so a placeholder title is
    // never the one a crawler happens to read. Pages with fixed wording omit it.
    ready: ready !== false,
    // A title carried over from the old site is used word for word: search
    // engines have matched these pages to these words for years.
    exact: !title && !!legacy.title,
  })
  return null
}

/**
 * The same thing as <PageSeo />, for a page whose render is not shaped to take
 * an extra element. Call it at the top of the component.
 */
export function usePageSeo({ title, description, image, type, ready } = {}) {
  const { pathname } = useLocation()
  const legacy = seoFor(pathname) || {}
  useSeo({
    title: title || legacy.title,
    description: description || legacy.description,
    path: pathname,
    image,
    type,
    ready: ready !== false,
    exact: !title && !!legacy.title,
  })
}

/**
 * Metadata for an article or career page — the pages served at the root.
 *
 * These addresses were the old site's, and so was their wording: hand-written
 * titles and descriptions that search engines have matched to them for years.
 * Deriving a title from the article body instead would rewrite all 270-odd of
 * them at once, so what the old site published wins, and what this app derives
 * is the fallback for anything published since.
 *
 * The captured title is used verbatim — no site name appended — because that
 * is the string already sitting in the search results.
 */
export function useRootSeo({ slug, title, description, image, type, ready }) {
  const legacy = legacyRootSeo(slug)
  useSeo({
    title: legacy?.title || title,
    description: legacy?.description || description,
    path: slug ? `/${slug}` : undefined,
    image,
    type,
    ready: ready !== false,
    exact: !!legacy?.title,
  })
}
