/**
 * Client-side week-resource generator. Builds a self-contained, print-ready
 * HTML document of ONE week's written resource — the companion reading to that
 * week's video — and opens it in a new window so the student can save it as a
 * PDF. Falls back to an .html download when the popup is blocked.
 *
 * Kin to invoice.js and courseRecord.js — the only three documents we hand a
 * student, all built the same no-library, no-round-trip way. This one wears
 * Nirmaan's own dress instead of the Svastrino letterhead: the course's mark
 * already reads "powered by Svastrino", so the company is named once, inside
 * the logo, and nowhere else. The contact details sit at the foot, where a
 * reader looks for them on a printed page.
 *
 * One week per document, never the whole course. The blocks arrive from the
 * server one session at a time — it will not send a week whose video has not
 * been watched — so a document holding all 24 would be a shape the server
 * refuses to produce anyway.
 */

// Both marks travel inside the HTML as data URIs — see nirmaanMark.js for why
// they cannot be URLs. The wordmark is the letterhead; the vertical lockup, the
// one the site shows, is the watermark.
import { NIRMAAN_MARK, NIRMAAN_WATERMARK } from './nirmaanMark.js'

// The same details as the contact page, and the only place the document says
// where we are. The reader gets them once, at the foot.
const CONTACT = {
  phone: '+91 99877 77016',
  phoneHref: '+919987777016',
  email: 'admin@svastrino.com',
  website: 'svastrino.com',
  cities: 'Thane, Maharashtra · Dharamshala, Himachal Pradesh',
}

// Hand-written paths, because an icon font or a sprite would be a request this
// document cannot make. On paper an icon alone is useless, so each one keeps
// its name next to it.
const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/svastrino/',
    svg: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="currentColor" stroke-width="1.9"/>'
       + '<circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.9"/>'
       + '<circle cx="17.3" cy="6.7" r="1.3"/>',
  },
  {
    label: 'LinkedIn',
    href: 'https://in.linkedin.com/company/svastrino',
    svg: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3.1 9.2h3.8V21H3.1zm6.2 0h3.6v1.6h.05c.5-.95 1.74-1.95 3.58-1.95 3.83 0 4.54 2.52 4.54 5.8V21h-3.8v-5.2c0-1.24-.02-2.84-1.73-2.84-1.74 0-2.01 1.36-2.01 2.76V21H9.3z"/>',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/svastrino',
    svg: '<path d="M13.4 21v-7.9h2.7l.4-3.1h-3.1V8.1c0-.9.25-1.5 1.55-1.5h1.65V3.8c-.29-.04-1.27-.12-2.4-.12-2.38 0-4.01 1.45-4.01 4.12v2.3H7.5v3.1h2.68V21z"/>',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@svastrino',
    svg: '<path d="M21.6 7.9a2.53 2.53 0 0 0-1.78-1.79C18.24 5.7 12 5.7 12 5.7s-6.24 0-7.82.41A2.53 2.53 0 0 0 2.4 7.9C2 9.5 2 12 2 12s0 2.5.4 4.1a2.53 2.53 0 0 0 1.78 1.79c1.58.41 7.82.41 7.82.41s6.24 0 7.82-.41a2.53 2.53 0 0 0 1.78-1.79c.4-1.6.4-4.1.4-4.1s0-2.5-.4-4.1zM10.1 15.1V8.9L15.5 12z"/>',
  },
  {
    // wa.me, not a tel: link — it hands off to the WhatsApp app where there is
    // one (phone or desktop) and falls back to WhatsApp Web where there is not.
    label: CONTACT.phone,
    href: `https://wa.me/${CONTACT.phoneHref.replace('+', '')}`,
    svg: '<path d="M12.04 2.2C6.7 2.2 2.36 6.54 2.36 11.88c0 1.85.52 3.58 1.42 5.06L2.3 21.8l4.98-1.44a9.6 9.6 0 0 0 4.76 1.22c5.34 0 9.68-4.34 9.68-9.68S17.38 2.2 12.04 2.2zm0 17.54c-1.57 0-3.03-.45-4.26-1.22l-.3-.19-2.95.85.87-2.87-.2-.31a7.75 7.75 0 0 1-1.22-4.12c0-4.3 3.5-7.8 7.81-7.8 4.3 0 7.8 3.5 7.8 7.8 0 4.31-3.5 7.81-7.8 7.81zm4.4-5.79c-.24-.12-1.42-.7-1.63-.78-.22-.08-.38-.12-.53.12-.16.24-.61.78-.75.94-.14.16-.27.18-.51.06-.24-.12-1.01-.37-1.92-1.19-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.23-.27.35-.41.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.28-.73-1.75-.19-.46-.39-.4-.53-.4h-.46c-.16 0-.41.06-.63.3-.22.24-.83.8-.83 1.96 0 1.16.85 2.28.96 2.44.12.16 1.66 2.66 4.03 3.62 1.97.81 2.38.65 2.81.61.43-.04 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28z"/>',
  },
]

// Everything below the line comes out of the database. It is escaped before it
// goes anywhere near HTML.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

/**
 * One block of the document. The four shapes are all the source document has:
 * a section heading, a paragraph, a bullet, and a comparison table — the tables
 * carry most of the teaching ("what students think" against "what is true"), so
 * they are rendered as tables rather than flattened into prose.
 */
function blockHtml(b) {
  if (b?.t === 'h') return `<h2 class="sec">${esc(b.text)}</h2>`
  if (b?.t === 'li') return `<li>${esc(b.text)}</li>`
  if (b?.t === 'p') return `<p>${esc(b.text)}</p>`
  if (b?.t === 'table' && Array.isArray(b.rows) && b.rows.length) {
    const [head, ...body] = b.rows
    return `<table>
      <thead><tr>${head.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`
  }
  return ''
}

/**
 * Bullets only mean anything as a group, so consecutive 'li' blocks are wrapped
 * in one <ul> rather than each becoming a stray list of one.
 */
function bodyHtml(blocks) {
  const out = []
  let bullets = []
  const flush = () => {
    if (bullets.length) { out.push(`<ul>${bullets.join('')}</ul>`); bullets = [] }
  }
  for (const b of blocks || []) {
    if (b?.t === 'li') { bullets.push(blockHtml(b)); continue }
    flush()
    out.push(blockHtml(b))
  }
  flush()
  return out.join('\n')
}

/** One social link: the mark, then the name — the name is what survives print. */
const socialHtml = (s) =>
  `<a href="${esc(s.href)}" title="${esc(s.label)}">` +
  `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${s.svg}</svg>${esc(s.label)}</a>`

function resourceHtml(doc) {
  const title = `Week ${doc.week} Resource`
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — ${esc(doc.courseName || '')}</title>
<style>
  /* Printed on its own, outside the app, so it cannot reach theme.css: the
     Nirmaan palette (document/NIRMAAN_COLOR_SYSTEM.md) is written out here —
     cream canvas, brown body, green headings. Every colour that carries text
     is dark-on-light, so the page reads the same whether or not the print
     dialog was asked to include background graphics. */
  :root { --brown:#3b2822; --brown-soft:#5a3f33; --green:#3f7932; --green-dark:#2d5723;
          --cream:#faf6ec; --line:#e7dfcb; --olive:#90743c; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
         color: var(--brown); background:#efe9dc; padding:32px; }
  /* A column with the band last: on a document that ends short of the page the
     band drops to the foot of it, and on a longer one it closes the reading. */
  .sheet { position:relative; display:flex; flex-direction:column; min-height:100vh;
           max-width:820px; margin:0 auto; background:#fff;
           border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  /* The logo, centred on the page as the watermark. The fixed position is doing
     the work: a fixed element is painted onto EVERY sheet the browser prints,
     each time against that page's own box — so one element gives one centred
     mark per page, with no cloning and no guessing where the page breaks fall.
     It sits over the sheet's white but under the three bands (z-index 1).
     (No backticks in here: this stylesheet lives inside a template literal.) */
  .wm { position:fixed; top:50%; left:50%; width:520px; transform:translate(-50%,-50%);
        opacity:.18; pointer-events:none; }
  .head, .body, .foot { position:relative; z-index:1; }
  .head { display:flex; justify-content:space-between; align-items:center; gap:24px;
          padding:24px 32px; border-bottom:3px solid var(--green); }
  .mark { flex:none; width:200px; height:auto; }
  /* The week is the label and the week's name is the headline — the name is
     what a reader looking through a folder of these needs to see first. */
  .doc .eyebrow { font-size:11px; letter-spacing:1.8px; text-transform:uppercase;
                  color:var(--brown-soft); text-align:right; }
  .doc h1 { margin:6px 0 0; font-size:23px; line-height:1.25; color:var(--green-dark);
            text-align:right; max-width:340px; }
  .body { padding:26px 32px 8px; }
  .body p { margin:0 0 12px; font-size:14.5px; line-height:1.75; }
  .sec { margin:26px 0 10px; font-size:15px; color:var(--green-dark); letter-spacing:.2px;
         padding-bottom:6px; border-bottom:1px solid var(--line); }
  .body ul { margin:0 0 14px; padding-left:22px; }
  .body li { margin:0 0 7px; font-size:14.5px; line-height:1.7; }
  /* Scoped to .body: the page grid below is a table too, and it must stay
     borderless and padding-free. */
  .body table { width:100%; border-collapse:collapse; margin:6px 0 18px; font-size:13.5px; }
  .body th, .body td { border:1px solid var(--line); padding:9px 12px; text-align:left;
           vertical-align:top; line-height:1.6; white-space:pre-wrap; }
  .body th { background:var(--cream); color:var(--green-dark); font-weight:700; }
  /* Everything a reader needs to reach us, in the one place they look for it —
     with the mark filling the space the details leave on the right. */
  .foot { margin-top:auto; display:flex; align-items:center; justify-content:space-between;
          gap:28px; padding:18px 32px 26px; border-top:1px solid var(--line);
          background:var(--cream); font-size:12px; line-height:1.6; }
  .foot-main { flex:1; min-width:0; }
  .foot-mark { flex:none; width:170px; height:auto; }
  .foot-info { display:flex; flex-wrap:wrap; gap:12px 28px; }
  .fi { min-width:150px; }
  .fl { display:block; font-size:9.5px; letter-spacing:1.4px; text-transform:uppercase;
        color:var(--olive); margin-bottom:2px; }
  .foot a { color:var(--green-dark); text-decoration:none; }
  .foot-social { margin-top:14px; }
  .socials { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:4px; }
  /* No colour of its own: a social link reads the same as the phone, the email
     and the website above it. */
  .socials a { display:inline-flex; align-items:center; gap:5px; }
  .ico { width:14px; height:14px; fill:currentColor; }
  .actions { max-width:820px; margin:18px auto 0; text-align:center; }
  .actions button { font:inherit; cursor:pointer; background:var(--green); color:#fff; border:0;
                    padding:11px 22px; border-radius:8px; font-weight:600; }
  /* The browser stamps the date, the page title, "about:blank" and a page
     number into the margin of every sheet it prints, and no property turns that
     off. But it is drawn INSIDE the page margin, and Chrome needs about 0.4in
     of it: measured here, a 12mm margin still carries the stamps and an 8mm one
     does not. 6mm keeps a safe distance from that line and still gives every
     page — not only the first — a little room at the edges. */
  @page { margin: 6mm; }
  @media print {
    body { background:#fff; padding:0; }
    .sheet { min-height:100vh; border:0; border-radius:0; padding:4mm 0; }
    .actions { display:none; }
    /* A heading stranded at the foot of a page, a row torn in half, or contact
       details split in two make the reading harder than the paper is worth. A
       long table may break across pages — holding one together would leave
       half a page empty — but it takes its header row with it. */
    .sec { page-break-after: avoid; break-after: avoid; }
    .body tr, .foot { page-break-inside: avoid; break-inside: avoid; }
    .body thead { display: table-header-group; }
  }
</style></head>
<body>
  <div class="sheet">
    <img class="wm" src="${NIRMAAN_WATERMARK}" alt="" aria-hidden="true" />

    <div class="head">
      <img class="mark" src="${NIRMAAN_MARK}" alt="Nirmaan" />
      <div class="doc">
        <div class="eyebrow">Week ${esc(doc.week)} Resource</div>
        <h1>${esc(doc.sessionTitle || `Week ${doc.week}`)}</h1>
      </div>
    </div>

    <div class="body">
      ${bodyHtml(doc.blocks)}
    </div>

    <div class="foot">
      <div class="foot-main">
        <div class="foot-info">
          <div class="fi"><span class="fl">Contact</span><a href="tel:${esc(CONTACT.phoneHref)}">${esc(CONTACT.phone)}</a></div>
          <div class="fi"><span class="fl">Email</span><a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></div>
          <div class="fi"><span class="fl">Visit us</span><a href="https://${esc(CONTACT.website)}">${esc(CONTACT.website)}</a></div>
          <div class="fi"><span class="fl">Location</span>${esc(CONTACT.cities)}</div>
        </div>

        <div class="foot-social">
          <span class="fl">Follow us on</span>
          <span class="socials">${SOCIALS.map(socialHtml).join('')}</span>
        </div>
      </div>

      <img class="foot-mark" src="${NIRMAAN_MARK}" alt="Nirmaan" />
    </div>
  </div>

  <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 350); });</script>
</body></html>`
}

/**
 * The window is opened in the SAME tick as the click, before the resource is
 * fetched, and holds a "preparing" note until the document arrives. Opening it
 * after the fetch is what used to drop students onto an .html download: a popup
 * is only allowed while the click's user activation lasts, and a round trip to
 * the server can outlive it — the browser then blocks the window and the code
 * took its fallback path.
 *
 * Returns null if the popup was blocked anyway (blocked by setting, not by
 * timing); writeWeekResource prints from a hidden frame in that case.
 */
export function openResourceWindow(week) {
  const win = window.open('', '_blank')
  if (!win) return null
  win.document.open()
  win.document.write(
    `<!doctype html><html lang="en"><head><meta charset="utf-8" />` +
    `<title>Week ${esc(week)} Resource</title></head>` +
    `<body style="margin:0;padding:48px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;` +
    `color:#3b2822;background:#efe9dc"><p>Preparing your Week ${esc(week)} resource…</p></body></html>`
  )
  return win
}

/** The window is no longer wanted — the fetch failed, so nothing will fill it. */
export function closeResourceWindow(win) {
  if (win && !win.closed) win.close()
}

/** Put one week's resource in the window opened at click time (it auto-prints). */
export function writeWeekResource(win, doc) {
  const html = resourceHtml(doc)
  if (win && !win.closed) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    return
  }
  printFromFrame(html, doc.week)
}

/**
 * No window to write into, so the document is printed from a frame on this
 * page instead: the print dialog opens over the app, which is what the student
 * wanted from the button. The document's own load handler calls print(), and in
 * a frame that prints the frame. Downloading the .html is the last resort — it
 * leaves the student holding a file and no PDF.
 */
function printFromFrame(html, week) {
  try {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(frame)
    const fdoc = frame.contentDocument
    if (!fdoc) throw new Error('no frame document')
    fdoc.open()
    fdoc.write(html)
    fdoc.close()
    // Once the dialog is dealt with the frame has done its job. The timer is
    // for the browsers that never fire afterprint.
    const drop = () => setTimeout(() => frame.remove(), 1000)
    frame.contentWindow.addEventListener('afterprint', drop)
    setTimeout(drop, 60000)
  } catch {
    downloadHtml(html, week)
  }
}

function downloadHtml(html, week) {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Week-${week}-Resource.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
