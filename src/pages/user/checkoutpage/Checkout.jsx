import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import './Checkout.css'

/**
 * Checkout for a Skill-Build package. Protected route (login required).
 * Flow: quote → (apply coupon) → create order → pay → verify → receipt.
 * With real Razorpay (GATEWAY=razorpay on the server) the hosted widget opens;
 * without keys the server returns { mock:true } and a local test panel is shown.
 */
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')

const RZP_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
// Load Razorpay's checkout.js once; resolves true when window.Razorpay is ready.
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const existing = document.querySelector(`script[src="${RZP_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const s = document.createElement('script')
    s.src = RZP_SRC
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const packageId = params.get('pkg') || ''

  const [step, setStep] = useState('summary') // 'summary' | 'paying' | 'success'
  const [quote, setQuote] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [coupon, setCoupon] = useState('')
  const [couponErr, setCouponErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState(null) // created order (paying step)
  // Set when the gateway refuses a payment, so the screen can explain instead
  // of showing a red line the customer has to hunt for.
  const [payFailed, setPayFailed] = useState('')
  const [receipt, setReceipt] = useState(null) // paid order (success step)

  // Load the price quote (optionally with a coupon).
  const loadQuote = async (code) => {
    setCouponErr('')
    try {
      const qs = new URLSearchParams({ packageId })
      if (code) qs.set('coupon', code)
      const q = await api(`/user/payments/quote?${qs.toString()}`, { auth: 'user' })
      setQuote(q)
      return true
    } catch (e) {
      if (code) setCouponErr(e.message)
      else setLoadErr(e.message)
      return false
    }
  }

  useEffect(() => {
    if (!packageId) { setLoadErr('No package selected.'); return }
    loadQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId])

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setBusy(true)
    await loadQuote(coupon.trim())
    setBusy(false)
  }
  const removeCoupon = async () => {
    setCoupon('')
    setBusy(true)
    await loadQuote()
    setBusy(false)
  }

  // Step 1 → create the order, then open Razorpay (or the mock panel in dev).
  const proceed = async () => {
    setBusy(true)
    setLoadErr('')
    try {
      const res = await api('/user/payments/order', {
        method: 'POST',
        auth: 'user',
        body: { packageId, couponCode: quote?.couponCode || undefined },
      })
      setOrder(res)
      if (res.mock) {
        setStep('paying') // no keys → local test panel
      } else {
        await openRazorpay(res)
      }
    } catch (e) {
      setLoadErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Confirm a paid order on our server, then show the receipt.
  const confirm = async (body) => {
    const { order: paid } = await api('/user/payments/verify', { method: 'POST', auth: 'user', body })
    setReceipt(paid)
    setStep('success')
  }

  // Open the hosted Razorpay checkout. Its handler returns payment id + signature,
  // which we verify server-side before granting access.
  const openRazorpay = async (res) => {
    const ready = await loadRazorpay()
    if (!ready || !window.Razorpay) {
      setLoadErr('Could not load the payment gateway. Check your connection and try again.')
      return
    }
    const rzp = new window.Razorpay({
      key: res.key,
      order_id: res.gatewayOrderId,
      amount: res.amount,
      currency: res.currency || 'INR',
      name: 'Svastrino',
      description: res.packageLabel,
      prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
      theme: { color: '#2f7ae5' },
      handler: async (resp) => {
        setBusy(true)
        try {
          await confirm({
            orderId: res.orderId,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_signature: resp.razorpay_signature,
          })
        } catch (e) {
          setLoadErr(e.message)
        } finally {
          setBusy(false)
        }
      },
      modal: { ondismiss: () => setBusy(false) },
    })
    // A refused payment replaces the screen; closing the widget only stops the
    // spinner, because the customer chose to step away and may come straight back.
    rzp.on('payment.failed', (r) => {
      setBusy(false)
      setPayFailed(r?.error?.description || '')
      // Razorpay keeps its own retry screen open on top of ours, so the customer
      // sees two different offers to try again and never reads what we wrote.
      try { rzp.close() } catch { /* already closed */ }
    })
    rzp.open()
  }

  // Mock test panel only (dev, no keys): the server simulates a successful charge.
  const pay = async () => {
    setBusy(true)
    try {
      await confirm({ orderId: order.orderId })
    } catch (e) {
      setLoadErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loadErr && !quote) {
    return (
      <section className="section"><div className="container checkout-wrap">
        <div className="card checkout-card">
          <h1>Checkout</h1>
          <p className="checkout-error">{loadErr}</p>
          <Link to="/skill-build/nirmaan#packages" className="btn btn-primary">Back to packages</Link>
        </div>
      </div></section>
    )
  }
  if (!quote) {
    return <section className="section"><div className="container checkout-wrap"><p>Loading…</p></div></section>
  }

  return (
    <section className="section">
      <div className="container checkout-wrap">
        {step !== 'success' && (
          <Link to="/skill-build/nirmaan#packages" className="checkout-back-top">← Back to packages</Link>
        )}
        <h1 className="checkout-title">Checkout</h1>

        {/* ---- Payment refused ---- */}
        {payFailed !== '' && step !== 'success' ? (
          <PaymentFailed
            reason={payFailed}
            item={order?.packageLabel || quote?.packageLabel}
            amount={quote?.rupees?.amount != null ? `₹${Number(quote.rupees.amount).toLocaleString('en-IN')}` : ''}
            onRetry={() => { setPayFailed(''); if (order) openRazorpay(order) }}
            backTo="/skill-build/nirmaan#packages"
            backLabel="Back to packages"
          />
        ) : null}

        {/* ---- Success ---- */}
        {payFailed !== '' && step !== 'success' ? null : step === 'success' ? (
          <div className="card checkout-card checkout-success">
            <div className="checkout-tick" aria-hidden>✓</div>
            <h2>Payment successful</h2>
            <p className="checkout-muted">Your {receipt.item} is now active.</p>
            <div className="checkout-receipt">
              <Row label="Receipt" value={receipt.receiptNo} />
              <Row label="Item" value={receipt.item} />
              <Row label="Amount paid" value={inr(receipt.amountInr)} />
            </div>
            <div className="checkout-actions">
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to dashboard</button>
              <Link to="/settings?tab=orders" className="btn btn-secondary">View orders</Link>
            </div>
            <p className="checkout-muted checkout-note">A receipt has been emailed to you.</p>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* ---- Order summary ---- */}
            <div className="card checkout-card">
              <h2 className="checkout-h2">Order summary</h2>
              <div className="checkout-item">
                <span className="checkout-item-name">{quote.name}</span>
              </div>
              {quote.upgrade?.isUpgrade && (
                <p className="checkout-upgrade-note">
                  Upgrading from <strong>{quote.upgrade.fromPackageName}</strong> — the{' '}
                  {inr(quote.rupees.credit)} you already paid is credited below.
                </p>
              )}
              <div className="checkout-lines">
                <Line label="Price" value={inr(quote.rupees.listPrice)}
                      strike={quote.earlyBirdApplied} />
                {quote.earlyBirdApplied && (
                  <Line label="Early bird" value={'– ' + inr(quote.rupees.listPrice - quote.rupees.basePrice)} good />
                )}
                {quote.discount > 0 && (
                  <Line label={`Coupon ${quote.couponCode}`} value={'– ' + inr(quote.rupees.discount)} good />
                )}
                {quote.credit > 0 && (
                  <Line label="Upgrade credit (already paid)" value={'– ' + inr(quote.rupees.credit)} good />
                )}
                <div className="checkout-total">
                  <span>Total</span><span>{inr(quote.rupees.amount)}</span>
                </div>
              </div>

              {/* Coupon */}
              {quote.couponCode ? (
                <div className="checkout-coupon-applied">
                  Coupon <strong>{quote.couponCode}</strong> applied
                  <button type="button" className="checkout-link" onClick={removeCoupon} disabled={busy}>Remove</button>
                </div>
              ) : (
                <div className="checkout-coupon">
                  <input className="checkout-input" placeholder="Coupon code"
                         value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
                  <button type="button" className="btn btn-secondary" onClick={applyCoupon} disabled={busy || !coupon.trim()}>Apply</button>
                </div>
              )}
              {couponErr && <p className="checkout-error-sm">{couponErr}</p>}
            </div>

            {/* ---- Pay panel ---- */}
            <div className="card checkout-card checkout-pay">
              {step === 'summary' ? (
                <>
                  <h2 className="checkout-h2">Payment</h2>
                  <p className="checkout-muted">You'll pay securely. Cards, UPI, net-banking & wallets supported.</p>
                  <div className="checkout-payable">
                    <span>Payable now</span><strong>{inr(quote.rupees.amount)}</strong>
                  </div>
                  <button className="btn btn-primary checkout-full" onClick={proceed} disabled={busy}>
                    {busy ? 'Please wait…' : `Proceed to pay ${inr(quote.rupees.amount)}`}
                  </button>
                </>
              ) : (
                // Mock "gateway" panel — stands in for the Razorpay widget.
                <div className="checkout-gateway">
                  <p className="checkout-gateway-tag">TEST MODE · Mock gateway</p>
                  <h2 className="checkout-h2">Confirm payment</h2>
                  <p className="checkout-muted">
                    This simulates the Razorpay checkout. In production the real
                    payment widget opens here.
                  </p>
                  <div className="checkout-payable">
                    <span>{order.packageLabel}</span><strong>{inr(quote.rupees.amount)}</strong>
                  </div>
                  <button className="btn btn-primary checkout-full" onClick={pay} disabled={busy}>
                    {busy ? 'Processing…' : `Pay ${inr(quote.rupees.amount)}`}
                  </button>
                  <button type="button" className="checkout-link checkout-back" onClick={() => setStep('summary')} disabled={busy}>
                    Cancel
                  </button>
                </div>
              )}
              {loadErr && <p className="checkout-error-sm">{loadErr}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Line({ label, value, strike, good }) {
  return (
    <div className="checkout-line">
      <span>{label}</span>
      <span className={`${strike ? 'checkout-strike' : ''} ${good ? 'checkout-good' : ''}`}>{value}</span>
    </div>
  )
}
function Row({ label, value }) {
  return (
    <div className="checkout-line"><span>{label}</span><span>{value}</span></div>
  )
}
