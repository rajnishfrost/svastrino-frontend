// CloudFront Function — viewer request.
//
// The WordPress site's page addresses do not survive the move: /bulls-eye/
// became /services/bulls-eye, /our-approach/ became /our-ideology, and so on.
// Those pages carry the brand's search results, so each one answers with a 301
// to where it now lives — a permanent redirect is what tells a search engine to
// move the ranking across rather than treat the new page as a stranger.
//
// Articles and career pages are NOT here. All 322 of them kept the addresses
// they already had, which is why this list is 25 lines instead of 350 — and why
// it fits inside a CloudFront Function's 10 KB limit at all.
//
// Deploy:
//   aws cloudfront create-function --name svastrino-legacy-redirects \
//     --function-config Comment="301s for pages that moved",Runtime=cloudfront-js-2.0 \
//     --function-code fileb://legacy-redirects.js
//   aws cloudfront publish-function --name svastrino-legacy-redirects --if-match <ETag>
// then attach it to the default cache behaviour as a viewer-request function.

var MOVED = {
  '/bulls-eye': '/services/bulls-eye',
  '/bloom': '/services/bloom',
  '/breakthrough': '/services/breakthrough',
  '/our-programs': '/services',
  '/compare-programs': '/services/compare',
  '/svastrino': '/about',
  '/our-approach': '/our-ideology',
  '/contact-us': '/contact',
  '/faqs': '/resources/faqs',
  '/success-stories': '/resources/success-stories',
  '/courselist': '/resources/career-library',
  '/blogs': '/blog',
  '/sign-up': '/login?mode=signup',
  '/customer-portal': '/dashboard',
  '/newsletter': '/contact',
  '/tc-terms-of-use': '/legal/terms-of-use',
  '/privacy-policy': '/legal/privacy-policy',
  '/cancellations-and-refunds': '/legal/cancellations-and-refunds',

  // Retired. Model Session is no longer sold, and the career tests were one-off
  // landing pages; both are sent somewhere that answers the same need rather
  // than to a 404, which would throw away whatever ranking they hold.
  '/model-session': '/services/bulls-eye',
  '/test': '/skill-build/psychometric-testing',
  '/careertest1': '/skill-build/psychometric-testing',
  '/careertest2': '/skill-build/psychometric-testing',
  '/careertest3': '/skill-build/psychometric-testing',
  '/careertest4': '/skill-build/psychometric-testing',
  '/course2': '/resources/career-library',
}

function handler(event) {
  var request = event.request
  var uri = request.uri

  // WordPress served every page with a trailing slash. Match without it, so
  // both /bulls-eye and /bulls-eye/ are recognised.
  var key = uri.length > 1 && uri.charAt(uri.length - 1) === '/'
    ? uri.substring(0, uri.length - 1)
    : uri

  var target = MOVED[key.toLowerCase()]
  if (target) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: target } },
    }
  }

  return request
}
