import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { openCashfreeCheckout } from '../../../utils/cashfree.js'
import './PayLink.css'
import { SkeletonForm } from '../../../common_component/Skeleton/Skeleton.jsx'

/**
 * /pay/<token> — where an institution pays for its seats, from the link an
 * admin had emailed to it. No sign-in: the token in the address is the key.
 *
 * The server hands back a fresh Cashfree session each time the page loads (the
 * link may be days old). After the checkout closes, the server — not the
 * popup's own report — says whether the money arrived; the webhook covers a
 * tab that was closed before that.
 */
const inr = (v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function PayLink() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setErr('')
    return api(`/user/payments/link/${token}`)
      .then(setData)
      .catch((e) => { setErr(e.message); setData(null) })
  }, [token])

  useEffect(() => { load() }, [load])

  const confirm = async () => {
    const d = await api(`/user/payments/link/${token}/verify`, { method: 'POST', body: {} })
    setData(d)
  }

  const pay = async () => {
    setBusy(true); setErr('')
    try {
      // Test mode (no gateway keys, development only): the server stands in
      // for Cashfree.
      if (data.mock) return await confirm()
      const result = await openCashfreeCheckout({ sessionId: data.sessionId, mode: data.mode })
      if (!result) { setErr('Could not load the payment page. Check your connection and try again.'); return }
      // Taken away to pay (an in-app browser): Cashfree brings them back here.
      if (result.redirect) return
      await confirm()
    } catch (e) {
      // Closing the window without paying is not an error worth shouting about.
      if (e.code !== 'PAYMENT_NOT_COMPLETED') setErr(e.message)
      await load().catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  const perStudent = data && data.students ? data.amountInr / data.students : null

  return (
    <section className="section paylink">
      <div className="container paylink-wrap">
        <div className="paylink-card">
          {!data && !err && <SkeletonForm fields={2} label="Loading the payment" />}

          {!data && err && (
            <>
              <h1 className="paylink-title">This link does not work</h1>
              <p className="paylink-muted">{err} If you were sent this link, please ask the Svastrino team for a new one.</p>
            </>
          )}

          {data && (
            <>
              <p className="paylink-eyebrow">{data.status === 'paid' ? 'Paid' : 'Payment'}</p>
              <h1 className="paylink-title">{data.institution}</h1>

              <dl className="paylink-lines">
                <div><dt>Course</dt><dd>{data.item}</dd></div>
                <div><dt>Students</dt><dd>{data.students}</dd></div>
                {perStudent != null && <div><dt>Per student</dt><dd>{inr(perStudent)}</dd></div>}
                <div className="paylink-total"><dt>Total</dt><dd>{inr(data.amountInr)}</dd></div>
              </dl>

              {data.status === 'paid' && (
                <div className="paylink-done" role="status">
                  <strong>Thank you — this is paid.</strong>
                  <span>
                    Receipt {data.receiptNo}
                    {data.paidAt ? ` · ${new Date(data.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}.
                    {' '}You can now add your students from your Svastrino portal.
                  </span>
                </div>
              )}

              {data.status === 'refunded' && (
                <p className="paylink-muted">This payment was refunded. Please contact the Svastrino team.</p>
              )}

              {data.status === 'open' && (
                <>
                  {err && <p className="paylink-err">{err}</p>}
                  <button type="button" className="btn btn-primary paylink-btn" onClick={pay} disabled={busy}>
                    {busy ? 'Opening…' : `Pay ${inr(data.amountInr)}`}
                  </button>
                  <p className="paylink-note">
                    UPI, card or net banking, through Cashfree. Your students’ seats open the moment it is paid.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
