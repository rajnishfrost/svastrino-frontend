import { useEffect } from 'react'

/**
 * Per-page metadata for a single-page app.
 *
 * Every route in this app is served the same index.html, so without this every
 * page — 219 articles, 52 career pages, every program — would share one title
 * and one description. Search engines would see a site with no per-page
 * metadata, and anything shared on WhatsApp or LinkedIn would preview as the
 * generic site name, because those crawlers do not run JavaScript at all.
 *
 * Written as a hook rather than pulled from a library: React 18 has no built-in
 * metadata hoisting and the alternatives are heavier than the sixty lines this
 * needs. The prerender step runs the app in a real browser and captures the
 * finished DOM, so whatever this writes ends up in the HTML that ships.
 *
 * Values are restored on unmount so a page that sets nothing does not inherit
 * the last page's description.
 */

const SITE = 'Svastrino'
const ORIGIN = 'https://svastrino.com'
const DEFAULT_IMAGE = `${ORIGIN}/logo.png`

/** Set (or create) a meta tag, and return how to put it back. */
function setMeta(attr, key, value) {
  if (!value) return null
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  const created = !el
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  const previous = el.getAttribute('content')
  el.setAttribute('content', value)
  return () => {
    if (created) el.remove()
    else if (previous != null) el.setAttribute('content', previous)
  }
}

function setCanonical(href) {
  if (!href) return null
  let el = document.head.querySelector('link[rel="canonical"]')
  const created = !el
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  const previous = el.getAttribute('href')
  el.setAttribute('href', href)
  return () => {
    if (created) el.remove()
    else if (previous != null) el.setAttribute('href', previous)
  }
}

/**
 * @param {object}  seo
 * @param {string}  seo.title        page title; the site name is appended
 * @param {string}  seo.description  one or two sentences, ~155 characters
 * @param {string}  seo.path         the canonical path, e.g. '/law'
 * @param {string}  seo.image        absolute URL of the share image
 * @param {string}  seo.type         'website' (default) or 'article'
 * @param {boolean} seo.ready        false while the content is still loading,
 *                                   so a real title is never replaced by a
 *                                   placeholder one for a crawler mid-render
 * @param {boolean} seo.exact        use the title verbatim, without appending
 *                                   the site name — for titles carried over
 *                                   from the old site, which search engines
 *                                   have already matched to these pages
 */
export function useSeo({ title, description, path, image, type = 'website', ready = true, exact = false } = {}) {
  useEffect(() => {
    if (!ready || typeof document === 'undefined') return undefined

    const fullTitle = !title ? SITE
      : (exact || title.includes(SITE)) ? title
      : `${title} — ${SITE}`
    const url = path ? `${ORIGIN}${path}` : undefined
    const img = image || DEFAULT_IMAGE

    const previousTitle = document.title
    document.title = fullTitle

    const undo = [
      setMeta('name', 'description', description),
      setCanonical(url),
      setMeta('property', 'og:title', fullTitle),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:url', url),
      setMeta('property', 'og:image', img),
      setMeta('property', 'og:type', type),
      setMeta('property', 'og:site_name', SITE),
      setMeta('name', 'twitter:card', 'summary_large_image'),
      setMeta('name', 'twitter:title', fullTitle),
      setMeta('name', 'twitter:description', description),
      setMeta('name', 'twitter:image', img),
    ].filter(Boolean)

    return () => {
      document.title = previousTitle
      undo.forEach((fn) => fn())
    }
  }, [title, description, path, image, type, ready, exact])
}

/** Trim a body of text down to something that reads as a description. */
export function excerptFor(text, max = 155) {
  const plain = String(text || '')
    .replace(/[#*_`>|\-]{1,}/g, ' ')     // markdown marks
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their label
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')) || cut}…`
}
