// CloudFront Function — viewer request. GENERATED, do not edit by hand.
//   cd server && npm run build:redirects
//
// Every address here answers with a 301, which is what tells a search engine to
// move a page's ranking across rather than treat the new address as a stranger.
//
// Articles and career pages that kept their original address are NOT here —
// all 274 of them still answer where they always did. This list is the pages
// that moved when the site left WordPress, plus anything renamed in the admin
// panel since, which is why it stays short enough to fit a CloudFront Function.
//
// Deploy:
//   aws cloudfront create-function --name svastrino-legacy-redirects \
//     --function-config Comment="301s for pages that moved",Runtime=cloudfront-js-2.0 \
//     --function-code fileb://legacy-redirects.js
//   aws cloudfront publish-function --name svastrino-legacy-redirects --if-match <ETag>
// then attach it to the default cache behaviour as a viewer-request function.
// Updating an existing one is `update-function` with the same arguments.
//
// This function assumes the distribution answers 403 and 404 with /404.html at
// a 404 status. Pointed at /index.html with a 200 instead — which is how it
// shipped — every address that misses answers with the home page, and the app
// routes below are the only thing that keeps working.

var MOVED = {
  "/blogs": "/blog",
  "/bloom": "/services/bloom",
  "/breakthrough": "/services/breakthrough",
  "/bulls-eye": "/services/bulls-eye",
  "/cancellations-and-refunds": "/legal/cancellations-and-refunds",
  "/careertest1": "/skill-build/psychometric-testing",
  "/careertest2": "/skill-build/psychometric-testing",
  "/careertest3": "/skill-build/psychometric-testing",
  "/careertest4": "/skill-build/psychometric-testing",
  "/compare-programs": "/services/compare",
  "/contact-us": "/contact",
  "/course2": "/resources/career-library",
  "/courselist": "/resources/career-library",
  "/customer-portal": "/dashboard",
  "/faqs": "/resources/faqs",
  "/model-session": "/services/bulls-eye",
  "/newsletter": "/contact",
  "/our-approach": "/our-ideology",
  "/our-programs": "/services",
  "/privacy-policy": "/legal/privacy-policy",
  "/sign-up": "/login?mode=signup",
  "/success-stories": "/resources/success-stories",
  "/svastrino": "/about",
  "/tc-terms-of-use": "/legal/terms-of-use",
  "/test": "/skill-build/psychometric-testing",
}

// Addresses that belong to the app rather than to a page: nothing prerenders a
// dashboard, so none of these has a file behind it. Matched a whole segment at
// a time, because /learn-how-to-be-successful-by-cultivating-a-growth-mindset
// is an article and not the /learn area.
var APP_ROUTES = [
  '/admin', '/checkout', '/dashboard', '/downloads', '/learn', '/login',
  '/organisation', '/reset-password', '/settings', '/support', '/verify-email',
  '/welcome',
]

function handler(event) {
  var request = event.request
  var uri = request.uri
  var host = request.headers.host ? request.headers.host.value : ''

  // Carried onto every redirect below. Dropping it would throw away the
  // ?utm_source on a campaign link at the moment the click is counted.
  var qs = ''
  for (var name in request.querystring) {
    var value = request.querystring[name].value
    qs += (qs ? '&' : '?') + name + (value ? '=' + value : '')
  }

  function moved(to) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: to } },
    }
  }

  // WordPress served every page with a trailing slash. Match without it, so
  // both /bulls-eye and /bulls-eye/ are recognised.
  var key = uri.length > 1 && uri.charAt(uri.length - 1) === '/'
    ? uri.substring(0, uri.length - 1)
    : uri
  var lower = key.toLowerCase()

  // www and the apex are aliases of one distribution, so both answer
  // everything, and a page reachable at two addresses splits its own ranking.
  // Written as a prefix rather than a redirect of its own so that www, a
  // trailing slash and a moved address together still cost a single hop.
  var isWww = host.indexOf('www.') === 0
  var prefix = isWww ? 'https://' + host.substring(4) : ''

  // WordPress's default permalink put the date in the address:
  // /2023/11/20/the-transformative-power-of-positive-role-models/. The article
  // is alive at /the-transformative-power-of-positive-role-models — only the
  // date in front of it is gone — so the date is dropped and the reader, and
  // whatever ranking the address still holds, is sent to the article.
  //
  // Search Console found these under "not found (404)" and "soft 404". They
  // were not in MOVED because there is no list of them: the dates make each one
  // different, there are years of them, and Google has surfaced five so far out
  // of however many it remembers. A rule costs nothing and catches all of them.
  // The backslashes are doubled because this whole function is written inside a
  // template literal: a single one would be eaten before it reached the file.
  var dated = key.match(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)$/)
  if (dated) {
    return moved(prefix + '/' + dated[1] + qs)
  }

  var target = MOVED[lower]
  if (target) {
    return moved(prefix + target + (target.indexOf('?') === -1 ? qs : ''))
  }

  if (isWww || key !== uri) {
    return moved(prefix + key + qs)
  }

  // Anything carrying a file extension is left alone, so a genuinely missing
  // asset still fails as one.
  var last = key.substring(key.lastIndexOf('/') + 1)
  if (last.indexOf('.') !== -1) {
    return request
  }

  // An app route is pointed at the shell by name. These used to arrive here,
  // miss, and be rescued by the distribution's 403/404 rule — which now
  // answers a real 404, because a miss has to mean missing.
  for (var i = 0; i < APP_ROUTES.length; i++) {
    if (lower === APP_ROUTES[i] || lower.indexOf(APP_ROUTES[i] + '/') === 0) {
      request.uri = '/app.html'
      return request
    }
  }

  // Point an address at the file that holds it.
  //
  // Prerendering writes each page as <path>/index.html, and an S3 REST origin
  // has no notion of a directory index: asked for /law it looks for an object
  // named "law" and finds nothing.
  //
  // An address with no file behind it misses, and the 403/404 rule answers
  // /404.html with a 404 status. That rule is the whole point: while it
  // returned the home page at 200, every typo and every retired WordPress
  // address was another copy of the home page, and Google filed a few hundred
  // of them under "crawled, currently not indexed".
  request.uri = key === '/' ? '/index.html' : key + '/index.html'

  return request
}
