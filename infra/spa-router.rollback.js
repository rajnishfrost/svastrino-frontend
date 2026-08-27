function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Anything with a file extension is a real asset (/assets/app-a1b2.js,
  // /favicon.ico). Leave it alone so a genuine miss returns a genuine 404.
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') !== -1) {
    return request;
  }

  // Everything else is a client-side route (/login, /courses/abc) - serve
  // the SPA shell and let React Router take over.
  request.uri = '/index.html';
  return request;
}
