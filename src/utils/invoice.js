/**
 * Client-side invoice generator. Builds a self-contained, print-ready HTML
 * invoice for a paid order (no server/PDF dependency) and opens it in a new
 * window so the user can save it as a PDF. Falls back to an .html download if
 * the popup is blocked.
 */

// Seller details shown on every invoice. Edit these to match the registered
// entity (add GSTIN/PAN here once available — left blank so nothing is faked).
const COMPANY = {
  name: 'Svastrino Consultancy Services',
  tagline: 'Soch Se Vikas Tak',
  address: 'Thane · Dharamshala, India',
  email: 'support@svastrino.com',
  website: 'svastrino.com',
  gstin: '', // e.g. '27ABCDE1234F1Z5' — appears only when set
}

const rupees = (paise) => (Math.round(Number(paise) || 0) / 100)
const money = (paise) =>
  '₹' + rupees(paise).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
// Anchored to IST, as every other printed date on the site is. An invoice is
// kept and compared against the course record and the dashboard, so a customer
// reading it from outside India must not be shown a different day here.
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

// Split "Nirmaan — Launch" → { product: 'Nirmaan', pkg: 'Launch' }.
const splitItem = (label = '') => {
  const [product, pkg] = String(label).split('—').map((s) => s.trim())
  return { product: product || label, pkg: pkg || '' }
}

/** Rows in the price summary, computed from the order's paise fields. */
function summaryLines(order) {
  const lines = []
  const listPrice = order.listPrice ?? order.basePrice ?? order.amount
  lines.push({ label: 'Package price', value: money(listPrice) })
  if (order.earlyBirdApplied && order.basePrice != null && listPrice - order.basePrice > 0)
    lines.push({ label: 'Early-bird discount', value: '– ' + money(listPrice - order.basePrice), good: true })
  if (order.discount > 0)
    lines.push({ label: `Coupon ${order.couponCode || ''}`.trim(), value: '– ' + money(order.discount), good: true })
  if (order.isUpgrade && order.creditApplied > 0)
    lines.push({ label: 'Upgrade credit (already paid)', value: '– ' + money(order.creditApplied), good: true })
  return lines
}

function invoiceHtml(order, customer) {
  const { product, pkg } = splitItem(order.item)
  const lines = summaryLines(order)
  const paidLabel = order.status === 'paid' ? 'PAID' : String(order.status || '').toUpperCase()
  const paidClass = order.status === 'paid' ? 'ok' : order.status === 'refunded' ? 'muted' : 'warn'

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(order.receiptNo || order.id)}</title>
<style>
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
           font-size:12px; font-weight:700; letter-spacing:.5px; }
  .badge.ok { background:#e9f7ef; color:var(--ok); } .badge.muted{ background:#eef0f3; color:var(--muted); }
  .badge.warn{ background:#fdf0e3; color:#a15c00; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:24px 32px; border-bottom:1px solid var(--line); }
  .meta h3 { margin:0 0 8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); }
  .meta p { margin:2px 0; font-size:14px; }
  table { width:100%; border-collapse:collapse; }
  thead th { text-align:left; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--muted);
             padding:14px 32px; background:#fafbfc; border-bottom:1px solid var(--line); }
  thead th.r, tbody td.r { text-align:right; }
  tbody td { padding:16px 32px; border-bottom:1px solid var(--line); font-size:14px; vertical-align:top; }
  .item-name { font-weight:700; } .item-sub { color:var(--muted); font-size:13px; margin-top:2px; }
  .totals { width:320px; margin-left:auto; padding:16px 32px 0; }
  .totals .row { display:flex; justify-content:space-between; padding:7px 0; font-size:14px; }
  .totals .row.good span:last-child { color:var(--ok); }
  .totals .grand { margin-top:8px; border-top:2px solid var(--navy); padding-top:12px;
                   font-size:18px; font-weight:800; color:var(--navy); }
  .foot { padding:24px 32px 30px; color:var(--muted); font-size:12px; line-height:1.7; }
  .foot strong { color:var(--ink); }
  .actions { max-width:820px; margin:18px auto 0; text-align:center; }
  .actions button { font:inherit; cursor:pointer; background:var(--navy); color:#fff; border:0;
                    padding:11px 22px; border-radius:8px; font-weight:600; }
  @media print { body { background:#fff; padding:0; } .sheet{ border:0; border-radius:0; } .actions{ display:none; } }
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
          ${COMPANY.gstin ? '<br/>GSTIN: ' + esc(COMPANY.gstin) : ''}
        </div>
      </div>
      <div class="doc">
        <h1>INVOICE</h1>
        <span class="badge ${paidClass}">${esc(paidLabel)}</span>
      </div>
    </div>

    <div class="meta">
      <div>
        <h3>Billed to</h3>
        <p><strong>${esc(customer?.name || '—')}</strong></p>
        ${customer?.email ? `<p>${esc(customer.email)}</p>` : ''}
      </div>
      <div>
        <h3>Invoice details</h3>
        <p>Receipt&nbsp;No: <strong>${esc(order.receiptNo || '—')}</strong></p>
        <p>Date: ${esc(fmtDate(order.paidAt || order.createdAt))}</p>
        <p>Order&nbsp;ID: ${esc(order.id)}</p>
        <p>Payment: ${esc(order.currency || 'INR')} · ${esc((order.status || '').toUpperCase())}</p>
      </div>
    </div>

    <table>
      <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>
            <div class="item-name">${esc(product)}${pkg ? ' — ' + esc(pkg) + ' package' : ''}</div>
            <div class="item-sub">Skill-Build career program${order.isUpgrade ? ' · upgrade' : ''}</div>
          </td>
          <td class="r">${money(order.listPrice ?? order.basePrice ?? order.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      ${lines.map((l) => `<div class="row ${l.good ? 'good' : ''}"><span>${esc(l.label)}</span><span>${l.value}</span></div>`).join('')}
      <div class="row grand"><span>Total paid</span><span>${money(order.amount)}</span></div>
    </div>

    <div class="foot">
      Thank you for choosing ${esc(COMPANY.name)}. ${order.isUpgrade ? 'This purchase upgraded your existing plan; the amount you had already paid was credited above. ' : ''}This is a computer-generated invoice and does not require a signature.${order.refundedAt ? ' <strong>Refunded on ' + esc(fmtDate(order.refundedAt)) + '.</strong>' : ''}
    </div>
  </div>

  <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
  <script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 350); });</script>
</body></html>`
}

/** Open the invoice in a new window (auto-prints). Falls back to HTML download. */
export function openInvoice(order, customer) {
  const html = invoiceHtml(order, customer)
  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    return
  }
  // Popup blocked → download a standalone file the user can open + print.
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Invoice-${order.receiptNo || order.id}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
