import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../../../api/client.js'
import { dashboardTabFor } from '../dashboardpage/dashboardTab.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { PSYCHOMETRIC_CLASSES } from '../../../utils/studentClass.js'
import { openCashfreeCheckout } from '../../../utils/cashfree.js'
import { LIMITS, sanitiseCoupon } from '../../../utils/validate.js'
import PaymentFailed from '../../../common_component/user/PaymentFailed/PaymentFailed.jsx'
import PaymentGuard from '../../../common_component/user/PaymentGuard/PaymentGuard.jsx'
import './Checkout.css'

/**
 * Checkout for a Skill-Build package. Protected route (login required).
 * Flow: quote → (apply coupon) → create order → pay → verify → receipt.
 * With real Cashfree (GATEWAY=cashfree on the server) its checkout popup opens;
 * without keys the server returns { mock:true } and a local test panel is shown.
 */
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function Checkout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const packageId = params.get('pkg') || ''

  const [step, setStep] = useState('summary') // 'summary' | 'paying' | 'success'
  const [quote, setQuote] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [coupon, setCoupon] = useState('')
  const [couponErr, setCouponErr] = useState('')
  const [busy, setBusy] = useState(false)
  // Which part of a payment is in flight, or null. Drives PaymentGuard, which
  // takes the page away from the customer until the money has landed — see the
  // note there on why a click in this window is the expensive one.
  //
  // Deliberately separate from `busy`: `busy` is also true while a coupon is
  // being priced, and blacking out the screen to apply a coupon would be absurd.
  const [payPhase, setPayPhase] = useState(null)
  const [order, setOrder] = useState(null) // created order (paying step)
  // Set when the gateway refuses a payment, so the screen can explain instead
  // of showing a red line the customer has to hunt for.
  const [payFailed, setPayFailed] = useState('')
  const [receipt, setReceipt] = useState(null) // paid order (success step)

  // A plan that bundles the psychometric test cannot be sold until the profile
  // says which class the student is in, so the class is asked for here instead
  // of bouncing them to Settings and back. `classBlock` holds the server's own
  // words when it refuses a checkout over the class (missing, or outside the
  // 7-12 band the test is scored for).
  const [studentClass, setStudentClass] = useState('')
  const [classBlock, setClassBlock] = useState('')
  const [classBusy, setClassBusy] = useState(false)
  const [classErr, setClassErr] = useState('')
  const [classSaved, setClassSaved] = useState('')

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

  // Start on the profile's class only when it is one the test takes. The
  // picker is shown for a class outside 7 to 12 too (the server refused it),
  // and pre-selecting that would show a choice the list does not contain.
  useEffect(() => {
    setStudentClass(PSYCHOMETRIC_CLASSES.includes(user?.studentClass) ? user.studentClass : '')
  }, [user?.studentClass])

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

  // Write the class to the account, then re-read the profile so the rest of the
  // page (and the next Proceed) sees it. Saving does NOT start the payment: the
  // student came here to press Pay themselves, and opening a payment widget off
  // the back of a save would be a surprise.
  const saveClass = async () => {
    if (!studentClass) return
    setClassBusy(true)
    setClassErr('')
    try {
      await api('/user/profile', { method: 'PATCH', auth: 'user', body: { studentClass } })
      await refresh()
      setClassBlock('')
      setLoadErr('')
      setClassSaved(`Saved — you're recorded as ${studentClass}.`)
    } catch (e) {
      setClassErr(e.message)
    } finally {
      setClassBusy(false)
    }
  }

  // Step 1 → create the order, then open Cashfree (or the mock panel in dev).
  const proceed = async () => {
    setBusy(true)
    setPayPhase('preparing')
    setLoadErr('')
    try {
      const res = await api('/user/payments/order', {
        method: 'POST',
        auth: 'user',
        body: { packageId, couponCode: quote?.couponCode || undefined },
      })
      setOrder(res)
      if (res.mock) {
        setPayPhase(null)
        setStep('paying') // no keys → local test panel
      } else {
        await openCashfree(res)
      }
    } catch (e) {
      setPayPhase(null)
      // These two the student can fix right here, so they belong on the class
      // row, not in the generic error line under the button.
      if (e.code === 'CLASS_REQUIRED' || e.code === 'PSYCHOMETRIC_CLASS_RANGE') {
        setClassBlock(e.message)
        setClassSaved('')
      } else {
        setLoadErr(e.message)
      }
    } finally {
      setBusy(false)
    }
  }

  // Closing the checkout abandons the basket, so the order stops reading as a
  // payment we are still waiting on. Best-effort and silent: nothing is waiting
  // on the answer, the server only parks an order still sitting at 'created',
  // and a payment already in flight can still land on it afterwards.
  const abandon = (orderId) => {
    api(`/user/payments/orders/${orderId}/cancel`, { method: 'POST', auth: 'user' }).catch(() => {})
  }

  // Confirm a paid order on our server, then show the receipt.
  const confirm = async (body) => {
    const { order: paid } = await api('/user/payments/verify', { method: 'POST', auth: 'user', body })
    setReceipt(paid)
    setStep('success')
  }

  // Open Cashfree's checkout popup. What it reports when it closes is not proof
  // of anything — a closed window and a refused card come back alike — so our
  // server asks Cashfree how the order stands before granting access.
  const openCashfree = async (res) => {
    setBusy(true)
    setLoadErr('')
    try {
      // Cashfree's modal owns the screen from here, so our own overlay stands
      // down — two backdrops would put ours over the card form. The unload guard
      // stays on, which is the half that still matters while they are typing a
      // card number.
      setPayPhase('gateway')
      const result = await openCashfreeCheckout(res)
      if (!result) {
        setLoadErr('Could not load the payment gateway. Check your connection and try again.')
        return
      }
      // An in-app browser cannot hold the popup, so Cashfree has taken the
      // customer away to pay. The webhook grants access; they land on their orders.
      if (result.redirect) return
      // The modal has closed and the money has moved. Everything from here to the
      // receipt is ours, and it is the stretch a refresh must not interrupt.
      setPayPhase('confirming')
      await confirm({ orderId: res.orderId })
    } catch (e) {
      // A refusal replaces the screen. Closing the popup without paying only
      // stops the spinner: the customer chose to step away and may come straight
      // back, and the server has already parked the order.
      if (e.code === 'PAYMENT_FAILED') setPayFailed(e.message)
      else if (e.code !== 'PAYMENT_NOT_COMPLETED') setLoadErr(e.message)
    } finally {
      setBusy(false)
      setPayPhase(null)
    }
  }

  // Mock test panel only (dev, no keys): the server simulates a successful charge.
  // Guarded exactly like a real one — it grants the same access, and a flow that
  // is only protected in production is a flow nobody tests the protection of.
  const pay = async () => {
    setBusy(true)
    setPayPhase('confirming')
    try {
      await confirm({ orderId: order.orderId })
    } catch (e) {
      setLoadErr(e.message)
    } finally {
      setBusy(false)
      setPayPhase(null)
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

  // A plan this student cannot buy — the one they are on, or one their plan
  // rules out — is said here instead of offering a Pay button the order refuses.
  const refusal = ['owned', 'blocked'].includes(quote.standing?.state) ? quote.standing : null

  // Ask before they press Pay when the plan bundles the test and the account
  // has no class on it — and keep asking while the server is refusing over it.
  const askClass = (quote.includesPsychometric && !user?.studentClass) || !!classBlock

  return (
    <section className="section">
      {/* Outside the content, because it covers the whole viewport rather than
          this section — and first, so it is in the DOM before anything it is
          meant to protect. */}
      <PaymentGuard phase={payPhase} />

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
            onRetry={() => { setPayFailed(''); if (order) openCashfree(order) }}
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
              <button className="btn btn-primary" onClick={() => navigate(dashboardTabFor(packageId))}>Go to dashboard</button>
              <Link to="/dashboard/settings?section=orders" className="btn btn-secondary">View orders</Link>
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
                  {inr(quote.rupees.credit)} that plan costs is credited below, so you only pay the
                  difference.
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
                  <Line label="Upgrade credit (plan you own)" value={'– ' + inr(quote.rupees.credit)} good />
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
                  {/* sanitiseCoupon, not toUpperCase: a coupon is letters, digits
                      and dashes, so a pasted "  SAVE20 " or a stray comma is
                      cleaned as it is typed rather than sent to be rejected. */}
                  <input className="checkout-input" placeholder="Coupon code"
                         maxLength={LIMITS.couponCode} inputMode="text" autoCapitalize="characters"
                         value={coupon} onChange={(e) => setCoupon(sanitiseCoupon(e.target.value))} />
                  <button type="button" className="btn btn-secondary" onClick={applyCoupon} disabled={busy || !coupon.trim()}>Apply</button>
                </div>
              )}
              {couponErr && <p className="checkout-error-sm">{couponErr}</p>}
            </div>

            {/* ---- Pay panel ---- */}
            <div className="card checkout-card checkout-pay">
              {step === 'summary' && refusal ? (
                <>
                  <h2 className="checkout-h2">
                    {refusal.state === 'owned' ? 'This is your current plan' : 'Not available on your plan'}
                  </h2>
                  <p className="checkout-muted">{refusal.message}</p>
                  <button className="btn btn-primary checkout-full" onClick={() => navigate(dashboardTabFor(packageId))}>
                    Go to dashboard
                  </button>
                </>
              ) : step === 'summary' ? (
                <>
                  <h2 className="checkout-h2">Payment</h2>
                  <p className="checkout-muted">You'll pay securely. Cards, UPI, net-banking & wallets supported.</p>
                  <div className="checkout-payable">
                    <span>Payable now</span><strong>{inr(quote.rupees.amount)}</strong>
                  </div>
                  {askClass && (
                    <div className="checkout-class">
                      <p className="checkout-class-note">
                        {classBlock ||
                          'This plan includes a psychometric test, which is written for a particular school year. Tell us which class you are in and we will save it to your profile.'}
                      </p>
                      <div className="checkout-class-row">
                        <label className="checkout-sr-only" htmlFor="checkout-class">Your class</label>
                        <select id="checkout-class" className="checkout-input" value={studentClass}
                                onChange={(e) => setStudentClass(e.target.value)} disabled={classBusy}>
                          <option value="">Select your class</option>
                          {/* Only the classes this plan can be sold to. */}
                          {PSYCHOMETRIC_CLASSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-secondary" onClick={saveClass}
                                disabled={classBusy || !studentClass || studentClass === user?.studentClass}>
                          {classBusy ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                      {classErr && <p className="checkout-error-sm">{classErr}</p>}
                    </div>
                  )}
                  {classSaved && <p className="checkout-class-ok">{classSaved}</p>}
                  <button className="btn btn-primary checkout-full" onClick={proceed}
                          disabled={busy || (askClass && !user?.studentClass)}>
                    {busy ? 'Please wait…' : `Proceed to pay ${inr(quote.rupees.amount)}`}
                  </button>
                </>
              ) : (
                // Mock "gateway" panel — stands in for the Cashfree popup.
                <div className="checkout-gateway">
                  <p className="checkout-gateway-tag">TEST MODE · Mock gateway</p>
                  <h2 className="checkout-h2">Confirm payment</h2>
                  <p className="checkout-muted">
                    This simulates the Cashfree checkout. In production the real
                    payment widget opens here.
                  </p>
                  <div className="checkout-payable">
                    <span>{order.packageLabel}</span><strong>{inr(quote.rupees.amount)}</strong>
                  </div>
                  <button className="btn btn-primary checkout-full" onClick={pay} disabled={busy}>
                    {busy ? 'Processing…' : `Pay ${inr(quote.rupees.amount)}`}
                  </button>
                  <button type="button" className="checkout-link checkout-back"
                          onClick={() => { abandon(order.orderId); setOrder(null); setStep('summary') }}
                          disabled={busy}>
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
