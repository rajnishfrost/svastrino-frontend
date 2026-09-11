/**
 * Client-side week-resource generator. Builds a self-contained, print-ready
 * HTML document of ONE week's written resource — the companion reading to that
 * week's video — and opens it in a new window so the student can save it as a
 * PDF. Falls back to an .html download when the popup is blocked.
 *
 * The third of its kind, and deliberately so: invoice.js, courseRecord.js and
 * this file are the only documents we hand a student, they share the same
 * brand block and the same no-library, no-round-trip approach, and they should
 * read as coming from one company.
 *
 * One week per document, never the whole course. The blocks arrive from the
 * server one session at a time — it will not send a week whose video has not
 * been watched — so a document holding all 24 would be a shape the server
 * refuses to produce anyway.
 */

// The same block as invoice.js and courseRecord.js, on purpose. If the
// registered details change, change them in all three.
const COMPANY = {
  name: 'Svastrino Consultancy Services',
  tagline: 'Soch Se Vikas',
  address: 'Thane · Dharamshala, India',
  email: 'support@svastrino.com',
  website: 'svastrino.com',
}

// Everything below the line comes out of the database. It is escaped before it
// goes anywhere near HTML.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

// Anchored to IST, exactly as the course page anchors its dates.
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
  })

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

function resourceHtml(doc) {
  const title = `Week ${doc.week} Resource`
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — ${esc(doc.courseName || '')}</title>
<style>
  /* Printed on its own, outside the app, so it cannot reach theme.css — the
     brand colours are written out here exactly as courseRecord.js writes them. */
  :root { --navy:#0f2c5c; --ink:#1f2733; --muted:#6b7280; --line:#e5e7eb; --accent:#2f7ae5; --green:#3f7932; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
         color: var(--ink); background:#f3f4f6; padding:32px; }
  .sheet { max-width:820px; margin:0 auto; background:#fff; border:1px solid var(--line);
           border-radius:12px; overflow:hidden; }
  .head { display:flex; justify-content:space-between; align-items:flex-start;
          padding:28px 32px; border-bottom:3px solid var(--navy); }
  .brand-name { font-size:22px; font-weight:800; color:var(--navy); letter-spacing:.3px; }
  .brand-tag { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--muted); margin-top:4px; }
  .brand-meta { font-size:12px; color:var(--muted); margin-top:10px; line-height:1.6; }
  .doc h1 { margin:0; font-size:26px; color:var(--navy); letter-spacing:1px; text-align:right; }
  .doc .sub { margin-top:6px; font-size:12px; color:var(--muted); text-align:right; max-width:280px; }
  .body { padding:26px 32px 8px; }
  .body p { margin:0 0 12px; font-size:14.5px; line-height:1.75; }
  .sec { margin:26px 0 10px; font-size:15px; color:var(--navy); letter-spacing:.2px;
         padding-bottom:6px; border-bottom:1px solid var(--line); }
  .body ul { margin:0 0 14px; padding-left:22px; }
  .body li { margin:0 0 7px; font-size:14.5px; line-height:1.7; }
  table { width:100%; border-collapse:collapse; margin:6px 0 18px; font-size:13.5px; }
  th, td { border:1px solid var(--line); padding:9px 12px; text-align:left; vertical-align:top;
           line-height:1.6; white-space:pre-wrap; }
  th { background:#fafbfc; color:var(--navy); font-weight:700; }
  .foot { padding:20px 32px 30px; color:var(--muted); font-size:12px; line-height:1.7;
          border-top:1px solid var(--line); margin-top:14px; }
  .actions { max-width:820px; margin:18px auto 0; text-align:center; }
  .actions button { font:inherit; cursor:pointer; background:var(--navy); color:#fff; border:0;
                    padding:11px 22px; border-radius:8px; font-weight:600; }
  @media print {
    body { background:#fff; padding:0; } .sheet{ border:0; border-radius:0; } .actions{ display:none; }
    /* A heading stranded at the foot of a page, or a comparison table split
       down the middle, makes the reading harder than the paper is worth. */
    .sec { page-break-after: avoid; break-after: avoid; }
    table, tr { page-break-inside: avoid; break-inside: avoid; }
  }
</style></head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand-name">${esc(COMPANY.name)}</div>
        <div class="brand-tag">${esc(COMPANY.tagline)}</div>
        <div class="brand-meta">
          ${esc(COMPANY.address)}<br/>
          ${esc(COMPANY.email)} · ${esc(COMPANY.website)}
        </div>
      </div>
      <div class="doc">
        <h1>WEEK ${esc(doc.week)} RESOURCE</h1>
        <div class="sub">${esc(doc.sessionTitle || '')}</div>
      </div>
    </div>

    <div class="body">
      ${bodyHtml(doc.blocks)}
    </div>

    <div class="foot">
      This is the written companion to Week ${esc(doc.week)} of ${esc(doc.courseName || 'your course')} —
      read it alongside the video, and again whenever the week's tasks need it.
      <br/>Downloaded from ${esc(COMPANY.name)} on ${esc(fmtDate(new Date().toISOString()))}.
    </div>
  </div>

  <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 350); });</script>
</body></html>`
}

/** Open one week's resource in a new window (auto-prints). Falls back to HTML download. */
export function openWeekResource(doc) {
  const html = resourceHtml(doc)
  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    return
  }
  // Popup blocked → download a standalone file the student can open + print.
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Week-${doc.week}-Resource.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
