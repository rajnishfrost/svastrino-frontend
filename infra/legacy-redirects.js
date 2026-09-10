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

  // Point an address at the file that holds it.
  //
  // Prerendering writes each page as <path>/index.html, and an S3 REST origin
  // has no notion of a directory index: asked for /law it looks for an object
  // named "law" and finds nothing. This function used to answer that by sending
  // every address to /index.html, which worked — and meant all 292 prerendered
  // pages were never served, every one of them answering with the home page's
  // title.
  //
  // So each address is pointed at its own file instead. An address with no file
  // behind it — an app route like /dashboard, or a typo — misses, and the
  // distribution's 403/404 rule returns the app shell, exactly as before. That
  // rule is what makes this safe; without it a missed address would return S3's
  // XML error rather than the site.
  //
  // Anything carrying a file extension is left alone, so a genuinely missing
  // asset still fails as one.
  var last = key.substring(key.lastIndexOf('/') + 1)
  if (last.indexOf('.') === -1) {
    request.uri = key === '/' ? '/index.html' : key + '/index.html'
  }

  return request
}
