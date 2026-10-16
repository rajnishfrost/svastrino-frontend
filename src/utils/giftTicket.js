/**
 * Download gift coupons: a standalone page of tickets that prints (or saves as
 * PDF) on its own — the same way the invoice download works (utils/invoice.js).
 * Opened in a new window inside the click; if the browser blocks that, the page
 * is downloaded as an .html file instead.
 *
 * `coupons`: [{ code, value (paise), expiresAt }]
 */
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inr = (paise) => '₹' + (Number(paise) / 100).toLocaleString('en-IN')
const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function ticketsHtml(coupons) {
  const logo = `${window.location.origin}/logo-256.png`
  const tickets = coupons.map((c) => `
  <div class="t">
    <div class="stub">
      <span class="tag">Gift coupon</span>
      <span class="val">${esc(inr(c.value))}</span>
      <span class="sub">off any course</span>
      <span class="stars">✦ ✦ ✦</span>
    </div>
    <span class="notch a"></span><span class="notch b"></span>
    <div class="main">
      <div class="brand"><img src="${esc(logo)}" alt="Svastrino"><span>svastrino.com</span></div>
      <p class="title">A gift for your journey</p>
      <div class="code">${esc(c.code)}</div>
      <p class="meta">Valid till <strong>${esc(day(c.expiresAt))}</strong> &nbsp;•&nbsp; One-time use</p>
      <p class="how">Enter the code in the coupon box at checkout on svastrino.com — it comes off any course or programme.</p>
    </div>
  </div>`).join('')

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Svastrino gift coupon${coupons.length === 1 ? '' : 's'}</title>
<style>
  *{box-sizing:border-box} body{margin:0;padding:28px 18px;background:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f2c5c}
  h1{font-size:18px;margin:0 0 4px} .lead{margin:0 0 22px;color:#64748b;font-size:13px}
  .t{--stub:34%;position:relative;display:flex;max-width:640px;min-height:190px;margin:0 auto 22px;border-radius:18px;border:1px solid #e3d9c4;break-inside:avoid;page-break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .stub{flex:0 0 var(--stub);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;padding:20px 12px;border-radius:17px 0 0 17px;color:#fff;text-align:center;background:radial-gradient(circle at 18% 18%,rgba(240,198,116,.28),transparent 42%),radial-gradient(circle at 85% 90%,rgba(200,16,46,.35),transparent 45%),linear-gradient(150deg,#0f2c5c,#0a1f43)}
  .tag{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#f0c674}
  .val{font-size:36px;font-weight:800;line-height:1.1} .sub{font-size:12px;color:#c9d3e6} .stars{margin-top:8px;font-size:10px;letter-spacing:6px;color:rgba(240,198,116,.75)}
  .main{flex:1;min-width:0;padding:18px 20px 16px 24px;border-radius:0 17px 17px 0;background:#fffaf0;border-left:2px dashed rgba(15,44,92,.25)}
  .notch{position:absolute;left:var(--stub);width:24px;height:24px;border-radius:50%;background:#fff;transform:translateX(-50%);border:1px solid #e3d9c4}
  .notch.a{top:-13px;border-top-color:#fff} .notch.b{bottom:-13px;border-bottom-color:#fff}
  .brand{display:flex;justify-content:space-between;align-items:center} .brand img{height:26px} .brand span{font-size:11.5px;font-weight:700;letter-spacing:.06em;color:#8a7f6a}
  .title{margin:10px 0 8px;font-size:13px;font-weight:700;letter-spacing:.04em;color:#c8102e;text-transform:uppercase}
  .code{display:inline-block;padding:7px 12px;border:1.5px dashed rgba(15,44,92,.35);border-radius:10px;background:#fff;font-family:'Courier New',monospace;font-size:20px;font-weight:800;letter-spacing:.12em}
  .meta{margin:10px 0 0;font-size:12.5px;color:#475569} .how{margin:6px 0 0;font-size:12px;color:#8a7f6a}
  .actions{text-align:center;margin-top:10px} .actions button{padding:10px 22px;border:0;border-radius:999px;background:#c8102e;color:#fff;font-weight:700;font-size:14px;cursor:pointer}
  @media print{body{padding:0}.actions,.lead{display:none}}
</style></head><body>
  <h1>Your Svastrino gift coupon${coupons.length === 1 ? '' : 's'}</h1>
  <p class="lead">Print this page or save it as a PDF, then hand a coupon on.</p>
  ${tickets}
  <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
  <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})</script>
</body></html>`
}

export function openGiftTickets(coupons) {
  if (!coupons?.length) return
  const html = ticketsHtml(coupons)
  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    return
  }
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const a = document.createElement('a')
  a.href = url
  a.download = coupons.length === 1 ? `Svastrino-gift-${coupons[0].code}.html` : 'Svastrino-gift-coupons.html'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
