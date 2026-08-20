/**
 * Client-side course-record generator. Builds a self-contained, print-ready
 * HTML document of everything a student did in a course — the questions they
 * were asked and the answers they wrote in their own words — and opens it in a
 * new window so they can save it as a PDF. Falls back to an .html download when
 * the popup is blocked.
 *
 * This is the twin of invoice.js and follows it deliberately: no PDF library,
 * no server round trip, one string of HTML. A course closes one year after
 * enrolment; this document is the part the student keeps, so it has to work
 * long after the course page has stopped letting them in.
 */

// The same block as invoice.js, on purpose. A receipt and a course record are
// the only two documents we hand a student, and they should read as coming from
// one company — so if the registered details change, change them in both files.
const COMPANY = {
  name: 'Svastrino Consultancy Services',
  tagline: 'Soch Se Vikas Tak',
  address: 'Thane · Dharamshala, India',
  email: 'support@svastrino.com',
  website: 'svastrino.com',
}

// Everything below the line comes out of the database, which means it can hold
// anything the student typed. It is escaped before it goes anywhere near HTML.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

// Every date here is anchored to IST, exactly as the course page anchors its
// own dates. The student downloads this document from that page, so the two
// have to agree — without the zone, a student reading from outside India would
// see one date on screen and a different one in the record they kept.
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

/** One line of the facts block. */
const fact = (label, value) =>
  `<div class="fact"><span class="fact-label">${esc(label)}</span><span class="fact-value">${esc(value)}</span></div>`

/**
 * A session the student never opened is still printed, marked "Not attempted".
 * Leaving it out would quietly turn a half-finished course into a finished one,
 * and this document is meant to be the honest version of the story.
 */
const wasAttempted = (s) =>
  !!(s.videoWatchedAt || s.completedAt || (s.questions || []).some((q) => q.answer))

/**
 * A session can come back with no questions for three different reasons, and
 * saying the wrong one to a parent would be worse than saying nothing: the part
 * of the course was never bought, the student has not answered anything in it
 * yet, or the session genuinely had no tasks. `phaseLocked` and `questionsTotal`
 * come from the server for exactly this, so each case is said plainly.
 */
function sessionHtml(s) {
  const attempted = wasAttempted(s)
  const meta = attempted
    ? `Video watched: ${esc(s.videoWatchedAt ? fmtDate(s.videoWatchedAt) : 'Not watched')} · ` +
      `Session completed: ${esc(s.completedAt ? fmtDate(s.completedAt) : 'Not completed')}`
    : 'Not attempted'

  const questions = (s.questions || []).map((q) => `
      <div class="qa">
        <p class="q"><span class="q-num">Q${esc(q.order)}</span>${esc(q.question)}</p>
        ${q.answer
          ? `<p class="a">${esc(q.answer)}</p>
             <p class="a-when">Answered on ${esc(fmtDate(q.answeredAt))}</p>`
          : '<p class="a a-none">Not answered</p>'}
      </div>`).join('')

  return `
    <section class="sess">
      <div class="sess-head">
        <h2>Session ${esc(s.index)} — ${esc(s.title)}</h2>
        <p class="sess-meta${attempted ? '' : ' sess-meta-none'}">${meta}</p>
      </div>
      ${questions || `<p class="a a-none">${
        s.phaseLocked
          ? 'These tasks are in a later part of the course, which you have not taken yet.'
          : s.questionsTotal
            ? 'You have not answered any tasks in this session yet.'
            : 'No questions were set for this session.'
      }</p>`}
    </section>`
}

function recordHtml(record, student) {
  const finished = !!record.completedAt
  const sessions = record.sessions || []
  const sessionsTotal = record.sessionsTotal ?? sessions.length
  const sessionsDone = record.sessionsCompleted ?? sessions.filter((s) => s.completedAt).length

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Course Record — ${esc(record.course?.name || '')}</title>
<style>
  /* This document is printed on its own, outside the app, so it cannot reach
     theme.css — the brand colours are written out here exactly as invoice.js
     writes them, which is what keeps the two documents looking alike. */
  :root { --navy:#0f2c5c; --ink:#1f2733; --muted:#6b7280; --line:#e5e7eb; --accent:#2f7ae5; --ok:#1b7a43; }
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
  .badge { display:inline-block; margin-top:8px; padding:4px 12px; border-radius:100px;
           font-size:12px; font-weight:700; letter-spacing:.5px; float:right; }
  .badge.ok { background:#e9f7ef; color:var(--ok); } .badge.muted{ background:#eef0f3; color:var(--muted); }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:24px 32px; border-bottom:1px solid var(--line); }
  .meta h3 { margin:0 0 8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); }
  .meta p { margin:2px 0; font-size:14px; }
  .facts { padding:20px 32px; border-bottom:1px solid var(--line); background:#fafbfc; }
  .facts h3 { margin:0 0 12px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); }
  .fact { display:flex; justify-content:space-between; gap:16px; padding:7px 0; font-size:14px;
          border-bottom:1px dashed var(--line); }
  .fact:last-child { border-bottom:0; }
  .fact-label { color:var(--muted); }
  .fact-value { font-weight:600; text-align:right; }
  .work { padding:8px 32px 4px; }
  .work > h3 { margin:20px 0 4px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); }
  .sess { padding:18px 0; border-bottom:1px solid var(--line); }
  .sess:last-child { border-bottom:0; }
  .sess-head h2 { margin:0; font-size:16px; color:var(--navy); }
  .sess-meta { margin:4px 0 12px; font-size:12px; color:var(--muted); }
  .sess-meta-none { font-style:italic; }
  .qa { padding:10px 0; }
  .q { margin:0 0 6px; font-size:14px; font-weight:600; }
  .q-num { display:inline-block; min-width:34px; color:var(--accent); font-weight:700; }
  .a { margin:0; font-size:14px; line-height:1.7; white-space:pre-wrap;
       padding:10px 14px; background:#fafbfc; border-left:3px solid var(--line); border-radius:0 6px 6px 0; }
  .a-none { color:var(--muted); font-style:italic; background:none; border-left:0; padding-left:34px; }
  .a-when { margin:4px 0 0 34px; font-size:11px; color:var(--muted); }
  .foot { padding:22px 32px 30px; color:var(--muted); font-size:12px; line-height:1.7; }
  .foot strong { color:var(--ink); }
  .actions { max-width:820px; margin:18px auto 0; text-align:center; }
  .actions button { font:inherit; cursor:pointer; background:var(--navy); color:#fff; border:0;
                    padding:11px 22px; border-radius:8px; font-weight:600; }
  @media print {
    body { background:#fff; padding:0; } .sheet{ border:0; border-radius:0; } .actions{ display:none; }
    /* A question separated from its answer is not a record of anything, so the
       two are never allowed to fall on either side of a page break. */
    .qa { page-break-inside: avoid; break-inside: avoid; }
    .sess-head { page-break-after: avoid; break-after: avoid; }
    .facts, .fact { page-break-inside: avoid; break-inside: avoid; }
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
        <h1>COURSE RECORD</h1>
        <span class="badge ${finished ? 'ok' : 'muted'}">${finished ? 'COMPLETED' : 'NOT COMPLETED'}</span>
      </div>
    </div>

    <div class="meta">
      <div>
        <h3>This record belongs to</h3>
        <p><strong>${esc(student?.name || '—')}</strong></p>
        ${student?.email ? `<p>${esc(student.email)}</p>` : ''}
      </div>
      <div>
        <h3>Course</h3>
        <p><strong>${esc(record.course?.name || '—')}</strong></p>
        ${record.packageName ? `<p>${esc(record.packageName)} plan</p>` : ''}
      </div>
    </div>

    <div class="facts">
      <h3>Your journey</h3>
      ${fact('Enrolled on', fmtDate(record.enrolledAt))}
      ${fact('Started on', record.startedAt ? fmtDate(record.startedAt) : 'Not started')}
      ${fact('Completed on', finished ? fmtDate(record.completedAt) : 'Not completed')}
      ${fact('Days taken', record.daysTaken != null ? `${record.daysTaken} day${record.daysTaken === 1 ? '' : 's'}` : '—')}
      ${fact('Sessions completed', `${sessionsDone} of ${sessionsTotal}`)}
      ${fact('Course access ended on', fmtDate(record.expiresAt))}
    </div>

    <div class="work">
      <h3>Your work, session by session</h3>
      ${sessions.length
        ? sessions.map(sessionHtml).join('')
        : '<p class="a a-none">The sessions are no longer part of this record.</p>'}
    </div>

    <div class="foot">
      This is your own work, kept exactly as you wrote it.
      ${record.recordUntil
        ? `You can download this record until <strong>${esc(fmtDate(record.recordUntil))}</strong>. Please save a copy before then.`
        : ''}
      <br/>Generated by ${esc(COMPANY.name)} on ${esc(fmtDate(new Date().toISOString()))}.
    </div>
  </div>

  <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 350); });</script>
</body></html>`
}

/** Open the course record in a new window (auto-prints). Falls back to HTML download. */
export function openCourseRecord(record, student) {
  const html = recordHtml(record, student)
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
  a.download = `Course-Record-${record.course?.slug || 'svastrino'}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
