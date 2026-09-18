import { useEffect } from 'react'

/**
 * Structured data — the block of JSON that tells a search engine what a page
 * *is*, rather than leaving it to read the words and guess.
 *
 * It is what turns a plain blue link into a result with a breadcrumb trail
 * above it and a date beside it. Google has never promised to show any of it,
 * but it cannot show what was never described, and describing an article as an
 * article costs one script tag.
 *
 * Written the same way as useSeo: a tag per page, removed on unmount, so a page
 * that describes nothing does not inherit the last page's description. The
 * prerenderer captures the finished DOM, so whatever this writes ends up in the
 * HTML that ships — which matters here more than for a meta tag, because a
 * crawler reading structured data is usually reading it without running any
 * JavaScript at all.
 *
 * `ready` exists for the same reason it does in useSeo: an article's schema is
 * assembled from content that arrives after mount, and half of one is worse
 * than none — a headline with no date reads as an incomplete description of the
 * page rather than a page still loading.
 */
export function useJsonLd(data, ready = true) {
  // The dependency is the rendered JSON rather than the object, so a caller may
  // build the object inline without re-running this on every render.
  const json = ready && data ? JSON.stringify(data) : null

  useEffect(() => {
    if (!json || typeof document === 'undefined') return undefined

    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.textContent = json
    document.head.appendChild(el)
    return () => el.remove()
  }, [json])
}

const ORIGIN = 'https://svastrino.com'

/**
 * The trail shown above a result: Home › Blog › this article.
 *
 * Worth having on every page that sits under something, because it replaces the
 * raw URL in the search result with words a reader recognises. `trail` is
 * [{ name, path }] from the top down; the last entry is the page itself.
 */
export function breadcrumbs(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: `${ORIGIN}${step.path}`,
    })),
  }
}

/**
 * Who runs this site.
 *
 * The one description that is not about a page. `sameAs` is the list of
 * profiles that are also this organisation, and it is the whole point of the
 * block: it is how a search engine ties svastrino.com, the Instagram account
 * and the LinkedIn company page together as one entity rather than four
 * unrelated results. Kept on the home page alone — repeating it under every
 * article says nothing new.
 */
export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Svastrino',
    url: ORIGIN,
    logo: `${ORIGIN}/logo.png`,
    description: 'Career mentoring and counselling for students — personalised guidance, mentoring programs and the Nirmaan course.',
    email: 'admin@svastrino.com',
    telephone: '+919987777016',
    sameAs: [
      'https://www.instagram.com/svastrino/',
      'https://in.linkedin.com/company/svastrino',
      'https://www.facebook.com/svastrino',
      'https://twitter.com/svastrino/',
    ],
  }
}

/**
 * An article, described as one.
 *
 * `dateModified` falls back to `datePublished` rather than being left out: a
 * missing date is a gap in the description, and an article that has never been
 * edited was last modified when it was written.
 */
export function article({ title, description, path, image, publishedAt, updatedAt, author }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}${path}` },
    ...(image ? { image: [image] } : null),
    ...(publishedAt ? { datePublished: new Date(publishedAt).toISOString() } : null),
    ...(publishedAt || updatedAt
      ? { dateModified: new Date(updatedAt || publishedAt).toISOString() }
      : null),
    // The model's author defaults to the site's own name, so an article nobody
    // put their name to is published by the organisation rather than by a
    // person who happens to be called Svastrino.
    author:
      author && author !== 'Svastrino'
        ? { '@type': 'Person', name: author }
        : { '@type': 'Organization', name: 'Svastrino' },
    publisher: {
      '@type': 'Organization',
      name: 'Svastrino',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/logo.png` },
    },
  }
}
