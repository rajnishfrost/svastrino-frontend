import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'

const STATUS_CLS = { paid: 'ok', refunded: 'muted', failed: 'warn', created: 'warn' }
const inr = (paise) => '₹' + (Number(paise) / 100).toLocaleString('en-IN')
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = (st = status) =>
    api(`/admin/payments/orders${st ? `?status=${st}` : ''}`, { auth: 'admin' })
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e.message))

  useEffect(() => { load() /* eslint-disable-next-line */ }, [status])

  const refund = async (id) => {
    if (!confirm('Refund this order? This revokes the student’s access.')) return
    setBusyId(id); setError('')
    try {
      await api('/admin/payments/refund', { method: 'POST', auth: 'admin', body: { orderId: id } })
      load()
    } catch (e) { setError(e.message) } finally { setBusyId(null) }
  }

  return (
    <div>
      <h1 className="adm-title">Orders &amp; revenue</h1>
      <p className="adm-sub">All transactions. Refund a paid order to revoke access.</p>

      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
          <option value="created">Pending</option>
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!orders ? <p className="adm-empty">Loading…</p> : orders.length === 0 ? (
        <p className="adm-empty">No orders.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Receipt</th><th>Customer</th><th>Item</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.receiptNo || '—'}</td>
                  <td>{o.user ? <span title={o.user.email}>{o.user.name || o.user.email}</span> : '—'}</td>
                  <td>{o.item}</td>
                  <td className="adm-num">{inr(o.amount)}</td>
                  <td>{fmt(o.paidAt || o.createdAt)}</td>
                  <td><span className={`adm-badge adm-badge--${STATUS_CLS[o.status] || 'muted'}`}>{o.status}</span></td>
                  <td>{o.status === 'paid' && (
                    <button className="adm-link" style={{ color: 'var(--color-danger)' }} disabled={busyId === o.id} onClick={() => refund(o.id)}>
                      {busyId === o.id ? '…' : 'Refund'}
                    </button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
