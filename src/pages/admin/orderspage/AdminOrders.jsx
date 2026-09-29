import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import Pager from '../../../common_component/admin/Pager/Pager.jsx'
import { openInvoice } from '../../../utils/invoice.js'
import CopyLink from '../../../common_component/admin/CopyLink/CopyLink.jsx'

/**
 * What each stored status means, in the words someone reading a table would
 * use. The raw values are the payment gateway's vocabulary, not a person's:
 * "created" is a row the checkout opened and the money never arrived for, which
 * reads as if something HAS happened when nothing has.
 */
const STATUS = {
  paid: { label: 'Paid', tone: 'ok' },
  refunded: { label: 'Refunded', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  failed: { label: 'Failed', tone: 'warn' },
  created: { label: 'Not paid', tone: 'warn' },
}
const statusOf = (s) => STATUS[s] || { label: s || '—', tone: 'muted' }
// Who the invoice is billed to: the institution for its orders, else the buyer.
const invoiceCustomer = (o) => o.kind === 'institution' && o.organisation
  ? { name: o.organisation.name, email: o.user?.email }
  : { name: o.user?.name, email: o.user?.email }

const inr = (paise) => '₹' + (Number(paise) / 100).toLocaleString('en-IN')
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pg, setPg] = useState({ page: 1, pages: 1, total: 0 })

  const load = (st = status, pageNo = page) => {
    const qs = new URLSearchParams()
    if (st) qs.set('status', st)
    qs.set('page', pageNo)
    return api(`/admin/payments/orders?${qs}`, { auth: 'admin' })
      .then((d) => { setOrders(d.orders); setPg({ page: d.page, pages: d.pages, total: d.total }) })
      .catch((e) => setError(e.message))
  }

  // A filter change starts again at page 1: staying on page 4 of a list that
  // now has two pages shows an empty table and looks broken.
  useEffect(() => { setPage(1) }, [status])
  useEffect(() => { load() /* eslint-disable-next-line */ }, [status, page])

  return (
    <div>
      <h1 className="adm-title">Orders &amp; revenue</h1>
      <p className="adm-sub">Every transaction, newest first.</p>

      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="created">Not paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!orders ? <p className="adm-empty">Loading…</p> : orders.length === 0 ? (
        <p className="adm-empty">No orders.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Receipt</th><th>Customer</th><th>Item</th><th>Amount</th><th>Paid by</th><th>Date</th><th>Status</th><th>Invoice</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.receiptNo || '—'}</td>
                  <td>
                    {/* An institution's order is the institution's, not its
                        owner's: name it, and say what kind of buyer it is. */}
                    {o.kind === 'institution' && o.organisation
                      ? <div className="adm-badge-stack">
                          <span title={o.user?.email}>{o.organisation.name}</span>
                          <span className="adm-badge adm-badge--muted">Institution</span>
                        </div>
                      : o.user ? <span title={o.user.email}>{o.user.name || o.user.email}</span> : '—'}
                  </td>
                  <td>
                    {o.item}
                    {o.kind === 'institution' && o.quantity > 1 && (
                      <div className="adm-sub" style={{ margin: 0 }}>{inr(o.amount / o.quantity)} per student</div>
                    )}
                  </td>
                  <td className="adm-num">{inr(o.amount)}</td>
                  <td>
                    {o.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                    {o.reference && <div className="adm-sub" style={{ margin: 0 }}>Ref: {o.reference}</div>}
                    {o.gatewayPaymentId && o.paymentMethod !== 'cash' && (
                      <div className="adm-sub" style={{ margin: 0 }} title="Cashfree payment ID">Txn: {o.gatewayPaymentId}</div>
                    )}
                    {/* Unpaid institution order: the link it was emailed. */}
                    {o.payLink && <CopyLink url={o.payLink} compact />}
                  </td>
                  <td>{fmt(o.paidAt || o.createdAt)}</td>
                  <td><span className={`adm-badge adm-badge--${statusOf(o.status).tone}`}>{statusOf(o.status).label}</span></td>
                  <td>
                    {/* The same invoice the customer downloads (utils/invoice.js),
                        and only once money has moved — the same rule. */}
                    {(o.status === 'paid' || o.status === 'refunded') ? (
                      <button className="adm-link" style={{ padding: 0 }} onClick={() => openInvoice(o, invoiceCustomer(o))}>Download</button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={pg.page} pages={pg.pages} total={pg.total} onChange={setPage} unit="order" />
        </div>
      )}
    </div>
  )
}
