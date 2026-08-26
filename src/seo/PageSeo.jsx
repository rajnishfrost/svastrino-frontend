import { useLocation } from 'react-router-dom'
import { useSeo } from './useSeo.js'
import { seoFor } from './legacySeo.js'

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
