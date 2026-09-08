import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import Pager from '../../../common_component/admin/Pager/Pager.jsx'

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
            <thead><tr><th>Receipt</th><th>Customer</th><th>Item</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.receiptNo || '—'}</td>
                  <td>{o.user ? <span title={o.user.email}>{o.user.name || o.user.email}</span> : '—'}</td>
                  <td>{o.item}</td>
                  <td className="adm-num">{inr(o.amount)}</td>
                  <td>{fmt(o.paidAt || o.createdAt)}</td>
                  <td><span className={`adm-badge adm-badge--${statusOf(o.status).tone}`}>{statusOf(o.status).label}</span></td>
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
