// Turn the built single-page app into real HTML pages.
//   npm run prerender          (after npm run build)
//
// Why this exists
// ---------------
// A single-page app answers every address with the same empty index.html and
// fills it in with JavaScript. Google will run that JavaScript, eventually. The
// crawlers behind WhatsApp, LinkedIn, Facebook and X will not — they read the
// HTML as it arrives and nothing more. Without this step every link anyone
// shares previews as the same site name, whichever of the 290-odd pages it is.
//
// So each page is opened in a real browser, given a moment to finish, and its
// finished HTML written to disk. The result is ordinary static files: no server
// renders anything at request time, and CloudFront serves them as it always did.
//
// The pages are read from sitemap.xml, which the server generates from the
// database — so this never needs its own list to fall out of date.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { extname } from 'node:path'
import puppeteer from 'puppeteer-core'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PRERENDER_PORT || 4179)
const ORIGIN = `http://127.0.0.1:${PORT}`

// Where the app's own API lives while pages are being rendered. On a developer's
// machine that is the local server; in CI there is none, so it points at the
// deployed one — the pages need real content, and the content only exists there.
//
// Written as 127.0.0.1 rather than localhost on purpose: Node resolves
// localhost to ::1 first, and a server listening only on IPv4 refuses the
// connection — every page then prerenders empty for no visible reason.
const API_TARGET = process.env.PRERENDER_API || 'http://127.0.0.1:5060'

// The untouched build output, kept aside on the first run.
//
// Prerendering writes the home page over dist/index.html, so a second run would
// otherwise read an already-rendered page as its shell and hand every other
// page the home page's title and markup to start from. The pristine copy is
// saved next to it and reused; a fresh build replaces both.
const SHELL_FILE = join(DIST, '__shell.html')
if (!existsSync(SHELL_FILE)) {
  writeFileSync(SHELL_FILE, readFileSync(join(DIST, 'index.html')))
}
const SHELL = readFileSync(SHELL_FILE, 'utf8')
const SHELL_TITLE = (SHELL.match(/<title>([^<]*)<\/title>/) || [])[1] || ''

// Chrome is expected on the machine doing the build. CI sets PUPPETEER_EXECUTABLE_PATH.
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** Every path in the sitemap, as site-relative paths. */
function pathsFromSitemap() {
  const file = join(DIST, 'sitemap.xml')
  if (!existsSync(file)) {
    throw new Error('dist/sitemap.xml is missing — run the server\'s build:sitemap first')
  }
  const xml = readFileSync(file, 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''))
    .map((p) => p || '/')
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
}

/**
 * Serve the build, and pass /api through to a real backend.
 *
 * Written by hand rather than reaching for `vite preview` because the pages
 * being rendered need real content: a static server alone would answer every
 * API call with the app shell and every article would prerender empty.
 */
let apiFailures = 0

/**
 * Pass one API call through to the backend.
 *
 * Uses node:http rather than fetch because fetch refuses a set of "unsafe"
 * ports outright — 5060 is SIP's, and the app's dev server happens to sit on
 * it, so fetch answers `bad port` before a connection is ever attempted. curl
 * has no such list, which is why the backend looks perfectly reachable from a
 * terminal while every prerendered article comes out empty.
 */
function proxyApi(req, res) {
  const target = new URL(API_TARGET + req.url)
  const send = target.protocol === 'https:' ? httpsRequest : httpRequest
  return new Promise((resolve) => {
    const up = send(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: target.pathname + target.search,
        method: 'GET',
        headers: { accept: 'application/json', host: target.host },
      },
      (upstream) => {
        res.writeHead(upstream.statusCode || 502, {
          'content-type': upstream.headers['content-type'] || 'application/json',
        })
        upstream.pipe(res)
        upstream.on('end', resolve)
      },
    )
    up.on('error', (err) => {
      apiFailures += 1
      if (apiFailures <= 3) console.log(`  \u2717 API unreachable (${API_TARGET}): ${err.message}`)
      res.writeHead(502, { 'content-type': 'application/json' })
      res.end('{}')
      resolve()
    })
    up.end()
  })
}

function serveDist() {
  const server = createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/api/')) return proxyApi(req, res)

      const path = req.url.split('?')[0]
      const ext = extname(path)
      // A route gets the ORIGINAL shell, captured before any page was written.
      // Serving a page already prerendered would hand the next one somebody
      // else's title and content to start from, and a page that failed to load
      // would quietly ship them.
      if (!ext) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        return res.end(SHELL)
      }
      const file = join(DIST, path)
      if (!existsSync(file)) { res.writeHead(404); return res.end('') }
      res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' })
      res.end(readFileSync(file))
    } catch {
      res.writeHead(500); res.end('')
    }
  })

  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(PORT, '127.0.0.1', () => resolve(server))
  })
}

/** Where a path's HTML file belongs. '/law' → dist/law/index.html */
function outFile(path) {
  if (path === '/') return join(DIST, 'index.html')
  return join(DIST, path.replace(/^\//, '').replace(/\/$/, ''), 'index.html')
}

async function run() {
  let paths = pathsFromSitemap()
  // Narrow the run to a few pages while working on this script itself:
  //   PRERENDER_ONLY=/law,/about npm run prerender
  if (process.env.PRERENDER_ONLY) {
    const only = process.env.PRERENDER_ONLY.split(',').map((s) => s.trim())
    paths = paths.filter((p) => only.includes(p))
  }
  const DEBUG = !!process.env.PRERENDER_DEBUG
  console.log(`Prerendering ${paths.length} pages…`)

  const server = await serveDist()
  console.log(`  API → ${API_TARGET}`)
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })

  let done = 0
  const failed = []
  const noMeta = []

  try {
    for (const path of paths) {
      const page = await browser.newPage()
      if (DEBUG) {
        page.on('console', (m) => { if (m.type() === 'error') console.log(`    [console] ${m.text().slice(0, 160)}`) })
        page.on('pageerror', (e) => console.log(`    [error] ${e.message.slice(0, 160)}`))
        page.on('requestfailed', (r) => console.log(`    [net] ${r.url().slice(0, 90)} — ${r.failure()?.errorText}`))
        page.on('response', (r) => { if (r.url().includes('/api/')) console.log(`    [api] ${r.status()} ${r.url().slice(-70)}`) })
      }
      try {
        await page.goto(ORIGIN + path, { waitUntil: 'domcontentloaded', timeout: 45000 })

        // Wait for the page to actually be finished rather than for a fixed
        // number of milliseconds: content arrives from the API after mount, so
        // network-idle fires long before a page is ready. A page is done when
        // its title is no longer the shell's and something has rendered between
        // the header and the footer.
        // A page is finished when its own metadata has been applied AND real
        // content sits between the header and the footer. Either signal alone
        // is not enough: the title is set before the body finishes, and a
        // loading skeleton is already a few hundred bytes of markup.
        await page.waitForFunction(
          (shellTitle) => {
            if (!document.title || document.title === shellTitle) return false
            const root = document.getElementById('root')
            if (!root) return false
            const inner = root.innerHTML
              .replace(/<nav[\s\S]*?<\/nav>/g, '')
              .replace(/<footer[\s\S]*?<\/footer>/g, '')
            return inner.trim().length > 1200
          },
          { timeout: 15000, polling: 200 },
          SHELL_TITLE,
        ).catch(() => {}) // written anyway, and named in the report below

        const title = await page.title()

        // A page that never applied its own title never finished loading, and
        // writing it would replace a working app route with a half-rendered
        // snapshot of it. Left unwritten instead: the address still answers,
        // from the app shell, exactly as it does today.
        if (!title || title === SHELL_TITLE) {
          noMeta.push(path)
        } else {
          const file = outFile(path)
          mkdirSync(dirname(file), { recursive: true })
          writeFileSync(file, await page.content())
          done += 1
        }
      } catch (err) {
        failed.push(`${path} (${err.message.split('\n')[0].slice(0, 60)})`)
      }
      await page.close()

      if (done % 25 === 0 && done) process.stdout.write(`  …${done}\n`)
    }
  } finally {
    await browser.close()
    server.close()
  }

  console.log(`\n✓ ${done} pages written`)
  if (noMeta.length) {
    console.log(`⚠ ${noMeta.length} left as app routes — no metadata of their own:`)
    noMeta.slice(0, 15).forEach((p) => console.log(`    ${p}`))
    if (noMeta.length > 15) console.log(`    …and ${noMeta.length - 15} more`)
  }
  if (failed.length) {
    console.log(`✗ ${failed.length} could not be rendered:`)
    failed.slice(0, 10).forEach((f) => console.log(`    ${f}`))
  }
}

run().catch((err) => {
  console.error('✗ Prerender failed:', err.message)
  process.exit(1)
})
