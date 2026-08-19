import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../../api/client.js'
import {
  fetchMentoringPrograms,
  fetchSlots,
  fetchMyMentoring,
  createBooking,
  rescheduleBooking,
  guestStart,
} from '../../../api/mentoring.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import './BookOnline.css'

/**
 * Counselling & mentoring booking wizard. Four steps (as per spec):
 *   1 Date & time  → month calendar (T+3 … +2 months) + 2-hour slot picker
 *   2 Your details → account (guest auto-account) + coupon + fees
 *   3 Verify       → full summary before committing
 *   4 Payment      → existing payments stack (quote → order → verify), then the
 *                    booking is created. Only the FIRST booking of a program is
 *                    paid — later sessions (and reschedules) skip payment.
 *
 * Entry points: /book-online, /book-online?program=<sku>, and
 * /book-online?program=<sku>&reschedule=<bookingId> (from the dashboard).
 */

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
const paiseInr = (p) => inr(Math.round(Number(p) / 100))

// 'HH:MM' → '9:00 AM'
const fmt12 = (hm) => {
  const [h, m] = String(hm).split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

const pad = (n) => String(n).padStart(2, '0')
const dstr = (y, m0, d) => `${y}-${pad(m0 + 1)}-${pad(d)}`
const fmtLong = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })

// Today as an IST calendar date string (works from any timezone).
function istToday() {
  const t = new Date(Date.now() + 330 * 60_000)
  return dstr(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
}

const STEPS = ['Date & time', 'Your details', 'Verify', 'Payment']

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

export default function BookOnline() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const skuParam = params.get('program') || ''
  const rescheduleId = params.get('reschedule') || ''

  // ---- catalog + ownership ----
  const [programs, setPrograms] = useState(null) // null = loading
  const [mine, setMine] = useState(null) // owned programs (null until loaded / guest)
  const [loadErr, setLoadErr] = useState('')

  // ---- wizard state ----
  const [step, setStep] = useState('schedule') // program|schedule|details|verify|pay|success
  const [date, setDate] = useState(params.get('date') || '')
  const [slot, setSlot] = useState(params.get('start') || '')
  const [details, setDetails] = useState({ name: '', email: '', phone: '' })
  const [coupon, setCoupon] = useState('')
  const [couponErr, setCouponErr] = useState('')
  const [quote, setQuote] = useState(null)
  const [order, setOrder] = useState(null)
  const [booking, setBooking] = useState(null) // success payload
  const [receipt, setReceipt] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [emailExists, setEmailExists] = useState(false)

  // ---- calendar ----
  const [win, setWin] = useState(null) // { minDate, maxDate }
  const [month, setMonth] = useState(null) // { y, m0 }
  const [slots, setSlots] = useState(null) // slots for `date`
  const [slotsBusy, setSlotsBusy] = useState(false)

  const program = useMemo(
    () => (programs || []).find((p) => p.sku === skuParam) || null,
    [programs, skuParam],
  )
  const owned = useMemo(
    () => (mine || []).find((p) => p.sku === skuParam) || null,
    [mine, skuParam],
  )
  const isFree = !!rescheduleId || (owned && owned.sessionsRemaining > 0)
  const soldOut = owned && owned.sessionsRemaining === 0 && !rescheduleId

  // ---- load catalog + booking window ----
  useEffect(() => {
    fetchMentoringPrograms().then(setPrograms).catch((e) => setLoadErr(e.message))
    fetchSlots(istToday())
      .then((d) => {
        setWin(d.window)
        const [y, m] = d.window.minDate.split('-').map(Number)
        setMonth({ y, m0: m - 1 })
      })
      .catch((e) => setLoadErr(e.message))
  }, [])

  // ---- ownership (signed-in only) ----
  useEffect(() => {
    if (!user) { setMine(null); return }
    fetchMyMentoring().then(setMine).catch(() => setMine([]))
  }, [user])

  // Prefill details from the account.
  useEffect(() => {
    if (user) setDetails({ name: user.name || '', email: user.email || '', phone: user.phone || '' })
  }, [user])

  // No program chosen yet → program picker first.
  useEffect(() => {
    if (!skuParam) setStep('program')
    else if (step === 'program') setStep('schedule')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuParam])

  // ---- slots for the selected date ----
  useEffect(() => {
    if (!date) { setSlots(null); return }
    let alive = true
    setSlotsBusy(true)
    fetchSlots(date)
      .then((d) => { if (alive) setSlots(d.slots || []) })
      .catch(() => { if (alive) setSlots([]) })
      .finally(() => { if (alive) setSlotsBusy(false) })
    return () => { alive = false }
  }, [date])

  const syncParams = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const pickProgram = (sku) => { syncParams({ program: sku }); setStep('schedule') }
  const pickDate = (d) => { setDate(d); setSlot(''); syncParams({ date: d, start: '' }) }
  const pickSlot = (s) => { setSlot(s); syncParams({ start: s }) }

  // ---- quote (signed-in, paid flow only) ----
  const loadQuote = async (code) => {
    setCouponErr('')
    try {
      const qs = new URLSearchParams({ packageId: skuParam })
      if (code) qs.set('coupon', code)
      const q = await api(`/user/payments/quote?${qs.toString()}`, { auth: 'user' })
      setQuote(q)
      return true
    } catch (e) {
      if (code) setCouponErr(e.message)
      else setErr(e.message)
      return false
    }
  }
  useEffect(() => {
    if (user && program && !isFree && step === 'details') loadQuote(coupon.trim() || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, program, isFree, step])

  // ---- step 2 → 3: guest account (if needed) + final quote ----
  const continueToVerify = async () => {
    setErr(''); setEmailExists(false)
    if (!details.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
      setErr('Please enter your name and a valid email.')
      return
    }
    setBusy(true)
    try {
      if (!user) {
        try {
          const r = await guestStart({
            name: details.name.trim(),
            email: details.email.trim(),
            phone: details.phone.trim() || undefined,
          })
          login(r.token, r.user) // seamless session for this tab
        } catch (e) {
          if (e.code === 'EMAIL_EXISTS') { setEmailExists(true); return }
          throw e
        }
      }
      if (!isFree) {
        const ok = await loadQuote(coupon.trim() || undefined)
        if (!ok && coupon.trim()) return // bad coupon — fix or clear it first
      }
      setStep('verify')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // ---- create the booking (shared by free + paid paths) ----
  const placeBooking = async () => {
    if (rescheduleId) {
      const { booking: b } = await rescheduleBooking(rescheduleId, { date, start: slot })
      return b
    }
    const { booking: b } = await createBooking({ sku: skuParam, date, start: slot })
    return b
  }

  const onSlotTaken = (msg) => {
    setErr(msg || 'That slot was just taken — please pick another time.')
    setSlots(null)
    setSlot('')
    syncParams({ start: '' })
    setStep('schedule')
    if (date) fetchSlots(date).then((d) => setSlots(d.slots || [])).catch(() => setSlots([]))
  }

  // ---- step 3 confirm ----
  const confirm = async () => {
    setErr(''); setBusy(true)
    try {
      if (isFree) {
        const b = await placeBooking()
        setBooking(b)
        setStep('success')
      } else {
        const res = await api('/user/payments/order', {
          method: 'POST',
          auth: 'user',
          body: { packageId: skuParam, couponCode: quote?.couponCode || undefined },
        })
        setOrder(res)
        if (res.mock) {
          setStep('pay') // no real keys → local mock panel
        } else {
          setStep('pay')
          await openRazorpay(res) // real Razorpay hosted widget
        }
      }
    } catch (e) {
      if (e.code === 'SLOT_TAKEN') onSlotTaken()
      else setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // ---- verify the payment on our server, then create the booking ----
  const finalize = async (paymentFields = {}) => {
    setErr(''); setBusy(true)
    try {
      const { order: paid } = await api('/user/payments/verify', {
        method: 'POST',
        auth: 'user',
        body: { orderId: order.orderId, ...paymentFields },
      })
      setReceipt(paid)
      try {
        const b = await placeBooking()
        setBooking(b)
        setStep('success')
      } catch (e) {
        // Payment is done — the program is theirs. Only the slot needs re-picking.
        if (e.code === 'SLOT_TAKEN') {
          if (user) fetchMyMentoring().then(setMine).catch(() => {})
          onSlotTaken('Payment received ✓ — but that slot was just taken. Pick another time (no extra payment needed).')
        } else setErr(e.message)
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Mock panel "Pay" button → verify with no payment fields (server simulates it).
  const pay = () => finalize()

  // Open the hosted Razorpay checkout; its handler returns the payment id +
  // signature, which we verify server-side before creating the booking.
  const openRazorpay = async (res) => {
    const ready = await loadRazorpay()
    if (!ready || !window.Razorpay) {
      setErr('Could not load the payment gateway. Check your connection and try again.')
      return
    }
    const rzp = new window.Razorpay({
      key: res.key,
      order_id: res.gatewayOrderId,
      amount: res.amount,
      currency: res.currency || 'INR',
      name: 'Svastrino',
      description: res.packageLabel || program?.name,
      prefill: { name: details.name || user?.name || '', email: details.email || user?.email || '', contact: details.phone || user?.phone || '' },
      theme: { color: '#2f7ae5' },
      handler: (resp) => finalize({
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_signature: resp.razorpay_signature,
      }),
    })
    rzp.on('payment.failed', (resp) => setErr(resp?.error?.description || 'Payment failed — please try again.'))
    rzp.open()
  }

  /* ================================ render ================================ */

  if (loadErr) {
    return (
      <>
        <PageHero eyebrow="Book Online" title="Book a session" />
        <section className="section"><div className="container bo-wrap">
          <div className="card bo-card"><p className="bo-error">{loadErr}</p></div>
        </div></section>
      </>
    )
  }

  const stepIndex = { schedule: 0, details: 1, verify: 2, pay: 3 }[step]
  const sessionNo = rescheduleId
    ? (owned?.sessions || []).find((s) => String(s.bookingId) === rescheduleId)?.sessionNumber || null
    : owned ? owned.sessionsBooked + 1 : 1

  return (
    <>
      <PageHero
        eyebrow="Book Online"
        title={rescheduleId ? 'Reschedule your session' : 'Book a mentoring session'}
        subtitle="2-hour one-on-one sessions · book from 3 days ahead, up to 2 months in advance."
      />
      <section className="section">
        <div className="container bo-wrap">

          {/* Step indicator */}
          {step !== 'program' && step !== 'success' && (
            <ol className="bo-steps" aria-label="Booking steps">
              {STEPS.map((label, i) => {
                if (isFree && i === 3) return null // free flow has no payment step
                return (
                  <li key={label}
                      className={`bo-step ${i === stepIndex ? 'is-current' : ''} ${i < stepIndex ? 'is-done' : ''}`}>
                    <span className="bo-step-num">{i < stepIndex ? '✓' : i + 1}</span>
                    {label}
                  </li>
                )
              })}
            </ol>
          )}

          {/* ---- Step 0 · choose a program ---- */}
          {step === 'program' && (
            <div className="bo-programs">
              {programs == null ? <p>Loading programs…</p> : programs.map((p) => (
                <div key={p.sku} className={`card bo-card bo-program ${p.featured ? 'is-featured' : ''}`}>
                  {p.badge && <span className="bo-badge">{p.badge}</span>}
                  <h2>{p.name}</h2>
                  {p.tagline && <p className="bo-muted">{p.tagline}</p>}
                  <p className="bo-price">
                    {paiseInr(p.price)} <span className="bo-muted">· {p.sessions} session{p.sessions > 1 ? 's' : ''} × 2 hrs</span>
                  </p>
                  {Array.isArray(p.features) && p.features.length > 0 && (
                    <ul className="bo-features">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                  )}
                  <button className="btn btn-primary" onClick={() => pickProgram(p.sku)}>
                    Choose {p.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selected-program strip (all later steps) */}
          {step !== 'program' && step !== 'success' && program && (
            <div className="bo-selected">
              <div>
                <strong>{program.name}</strong>
                <span className="bo-muted"> · {program.sessions} sessions × 2 hrs</span>
                {isFree
                  ? <span className="bo-paid-tag">Program purchased ✓ {rescheduleId ? '· rescheduling' : `· booking session ${sessionNo} of ${program.sessions}`}</span>
                  : <span className="bo-muted"> · {paiseInr(program.price)}</span>}
              </div>
              {!rescheduleId && (
                <button type="button" className="bo-link" onClick={() => { syncParams({ program: '' }); setStep('program') }}>
                  Change program
                </button>
              )}
            </div>
          )}

          {soldOut && (
            <div className="card bo-card">
              <p>All {owned.sessionsTotal} sessions of <strong>{program?.name}</strong> are already booked.</p>
              <Link to="/dashboard" className="btn btn-primary">View your sessions</Link>
            </div>
          )}

          {/* ---- Step 1 · date & time ---- */}
          {step === 'schedule' && program && !soldOut && (
            <div className="bo-grid">
              <div className="card bo-card">
                <h2 className="bo-h2">Pick a date</h2>
                {win && month
                  ? <Calendar win={win} month={month} setMonth={setMonth} selected={date} onPick={pickDate} />
                  : <p>Loading calendar…</p>}
                <p className="bo-hint">
                  Bookings open 3 days ahead · Sundays till 1 PM only · Mondays closed.
                </p>
              </div>
              <div className="card bo-card">
                <h2 className="bo-h2">Pick a time</h2>
                {!date ? (
                  <p className="bo-muted">Select a date first.</p>
                ) : slotsBusy || slots == null ? (
                  <p className="bo-muted">Checking availability…</p>
                ) : slots.length === 0 ? (
                  <p className="bo-muted">No slots left on {fmtLong(date)} — try another date.</p>
                ) : (
                  <div className="bo-slots">
                    {slots.map((s) => (
                      <button key={s.start} type="button"
                              className={`bo-slot ${slot === s.start ? 'is-picked' : ''}`}
                              onClick={() => pickSlot(s.start)}>
                        {fmt12(s.start)} – {fmt12(s.end)}
                      </button>
                    ))}
                  </div>
                )}
                {err && <p className="bo-error">{err}</p>}
                <button className="btn btn-primary bo-full" disabled={!date || !slot}
                        onClick={() => { setErr(''); setStep(rescheduleId ? 'verify' : 'details') }}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ---- Step 2 · details + coupon + fees ---- */}
          {step === 'details' && program && (
            <div className="bo-grid">
              <div className="card bo-card">
                <h2 className="bo-h2">Your details</h2>
                {user ? (
                  <p className="bo-muted">Booking as <strong>{user.name}</strong> ({user.email})</p>
                ) : (
                  <p className="bo-muted">
                    No account needed — we'll create one with your email so you can track
                    your sessions. Already registered?{' '}
                    <button type="button" className="bo-link"
                            onClick={() => navigate('/login', { state: { from: `/book-online?${params.toString()}` } })}>
                      Log in
                    </button>
                  </p>
                )}
                <label className="bo-label">Full name
                  <input className="bo-input" value={details.name} disabled={!!user}
                         onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                </label>
                <label className="bo-label">Email
                  <input className="bo-input" type="email" value={details.email} disabled={!!user}
                         onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                </label>
                <label className="bo-label">Phone (optional)
                  <input className="bo-input" value={details.phone}
                         onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
                </label>
                {emailExists && (
                  <div className="bo-exists">
                    An account with this email already exists.{' '}
                    <button type="button" className="bo-link"
                            onClick={() => navigate('/login', { state: { from: `/book-online?${params.toString()}` } })}>
                      Log in to continue →
                    </button>
                  </div>
                )}
              </div>

              <div className="card bo-card">
                <h2 className="bo-h2">Fees</h2>
                <FeeLines program={program} quote={quote} isFree={isFree} />
                {!isFree && (
                  quote?.couponCode ? (
                    <div className="bo-coupon-applied">
                      Coupon <strong>{quote.couponCode}</strong> applied
                      <button type="button" className="bo-link" disabled={busy}
                              onClick={() => { setCoupon(''); if (user) loadQuote() }}>Remove</button>
                    </div>
                  ) : (
                    <div className="bo-coupon">
                      <input className="bo-input" placeholder="Coupon code" value={coupon}
                             onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponErr('') }} />
                      {user && (
                        <button type="button" className="btn btn-secondary" disabled={busy || !coupon.trim()}
                                onClick={() => loadQuote(coupon.trim())}>Apply</button>
                      )}
                    </div>
                  )
                )}
                {couponErr && <p className="bo-error">{couponErr}</p>}
                {!user && coupon.trim() && !couponErr && (
                  <p className="bo-hint">Coupon will be applied after your details are confirmed.</p>
                )}
                {err && <p className="bo-error">{err}</p>}
                <div className="bo-actions">
                  <button type="button" className="bo-link" onClick={() => setStep('schedule')}>← Back</button>
                  <button className="btn btn-primary" onClick={continueToVerify} disabled={busy}>
                    {busy ? 'Please wait…' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- Step 3 · verify ---- */}
          {step === 'verify' && program && (
            <div className="card bo-card bo-verify">
              <h2 className="bo-h2">Verify your booking</h2>
              <div className="bo-lines">
                <Line label="Program" value={program.name} />
                {sessionNo && <Line label="Session" value={`${sessionNo} of ${program.sessions}`} />}
                <Line label="Date" value={fmtLong(date)} />
                <Line label="Time" value={`${fmt12(slot)} – ${fmt12(addHM(slot, 120))} (2 hrs)`} />
                <Line label="Name" value={details.name} />
                <Line label="Email" value={details.email} />
                {details.phone && <Line label="Phone" value={details.phone} />}
              </div>
              <h3 className="bo-h3">Fees</h3>
              <FeeLines program={program} quote={quote} isFree={isFree} />
              {err && <p className="bo-error">{err}</p>}
              <div className="bo-actions">
                <button type="button" className="bo-link"
                        onClick={() => setStep(rescheduleId ? 'schedule' : 'details')}>← Back</button>
                <button className="btn btn-primary" onClick={confirm} disabled={busy}>
                  {busy ? 'Please wait…'
                    : isFree ? (rescheduleId ? 'Confirm reschedule' : 'Confirm booking')
                    : `Proceed to pay ${inr(quote?.rupees?.amount ?? Math.round(program.price / 100))}`}
                </button>
              </div>
              <p className="bo-hint">You can reschedule any session until 2 days before it starts.</p>
            </div>
          )}

          {/* ---- Step 4 · payment ---- */}
          {step === 'pay' && program && (
            <div className="card bo-card bo-verify">
              {order?.mock ? (
                <>
                  <p className="bo-gateway-tag">TEST MODE · Mock gateway</p>
                  <h2 className="bo-h2">Confirm payment</h2>
                  <p className="bo-muted">This simulates the payment gateway. Cards, UPI, net-banking &amp; EMI are supported in production.</p>
                  <div className="bo-payable">
                    <span>{order?.packageLabel || program.name}</span>
                    <strong>{inr(quote?.rupees?.amount ?? Math.round(program.price / 100))}</strong>
                  </div>
                  {err && <p className="bo-error">{err}</p>}
                  <button className="btn btn-primary bo-full" onClick={pay} disabled={busy}>
                    {busy ? 'Processing…' : `Pay ${inr(quote?.rupees?.amount ?? Math.round(program.price / 100))}`}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="bo-h2">Complete your payment</h2>
                  <p className="bo-muted">The secure Razorpay window should have opened. If you closed it, reopen it below.</p>
                  <div className="bo-payable">
                    <span>{order?.packageLabel || program.name}</span>
                    <strong>{inr(quote?.rupees?.amount ?? Math.round(program.price / 100))}</strong>
                  </div>
                  {err && <p className="bo-error">{err}</p>}
                  <button className="btn btn-primary bo-full" onClick={() => openRazorpay(order)} disabled={busy}>
                    {busy ? 'Processing…' : 'Open payment window'}
                  </button>
                </>
              )}
              <button type="button" className="bo-link" onClick={() => setStep('verify')} disabled={busy}>Cancel</button>
            </div>
          )}

          {/* ---- Success ---- */}
          {step === 'success' && booking && (
            <div className="card bo-card bo-success">
              <div className="bo-tick" aria-hidden>✓</div>
              <h2>{rescheduleId ? 'Session rescheduled' : 'Session booked'}</h2>
              <div className="bo-lines">
                <Line label="Program" value={program?.name || booking.programSku} />
                <Line label="Session" value={`${booking.sessionNumber} of ${program?.sessions ?? '—'}`} />
                <Line label="When" value={`${fmtLong(date)} · ${fmt12(slot)} – ${fmt12(addHM(slot, 120))}`} />
                {receipt && <Line label="Payment" value={`${inr(receipt.amountInr)} · receipt ${receipt.receiptNo}`} />}
              </div>
              <p className="bo-muted">
                Session updates and tasks from your mentor will appear on your dashboard.
                {receipt ? ' Your receipt has been emailed to you.' : ''}
              </p>
              <div className="bo-actions">
                <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
                {owned && owned.sessionsRemaining > 1 && !rescheduleId && (
                  <button className="btn btn-secondary"
                          onClick={() => { setBooking(null); setReceipt(null); setSlot(''); setDate(''); syncParams({ date: '', start: '' }); setStep('schedule'); fetchMyMentoring().then(setMine).catch(() => {}) }}>
                    Book next session
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  )
}

/* ---------- small pieces ---------- */

// 'HH:MM' + minutes → 'HH:MM'
function addHM(hm, mins) {
  const [h, m] = String(hm).split(':').map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

function Line({ label, value }) {
  return <div className="bo-line"><span>{label}</span><span>{value}</span></div>
}

/** Fee breakdown: free (already-purchased) note, live quote, or list price. */
function FeeLines({ program, quote, isFree }) {
  if (isFree) {
    return (
      <div className="bo-lines">
        <div className="bo-line"><span>Program fee</span><span>Already paid ✓</span></div>
        <div className="bo-total"><span>Payable now</span><span>{inr(0)}</span></div>
      </div>
    )
  }
  if (quote) {
    return (
      <div className="bo-lines">
        <div className="bo-line"><span>Program fee</span>
          <span className={quote.earlyBirdApplied ? 'bo-strike' : ''}>{inr(quote.rupees.listPrice)}</span></div>
        {quote.earlyBirdApplied && (
          <div className="bo-line"><span>Early bird</span>
            <span className="bo-good">– {inr(quote.rupees.listPrice - quote.rupees.basePrice)}</span></div>
        )}
        {quote.discount > 0 && (
          <div className="bo-line"><span>Coupon {quote.couponCode}</span>
            <span className="bo-good">– {inr(quote.rupees.discount)}</span></div>
        )}
        <div className="bo-total"><span>Payable now</span><span>{inr(quote.rupees.amount)}</span></div>
        <p className="bo-hint">One payment covers all {program.sessions} sessions — later sessions are booked free.</p>
      </div>
    )
  }
  return (
    <div className="bo-lines">
      <div className="bo-line"><span>Program fee</span><span>{paiseInr(program.price)}</span></div>
      <div className="bo-total"><span>Payable now</span><span>{paiseInr(program.price)}</span></div>
      <p className="bo-hint">One payment covers all {program.sessions} sessions — later sessions are booked free.</p>
    </div>
  )
}

/** Month calendar limited to the booking window. Mondays are closed. */
function Calendar({ win, month, setMonth, selected, onPick }) {
  const { y, m0 } = month
  const firstDow = new Date(Date.UTC(y, m0, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate()
  const monthLabel = new Date(Date.UTC(y, m0, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const prevOk = dstr(y, m0, 1) > win.minDate
  const nextOk = dstr(y, m0, daysInMonth) < win.maxDate

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bo-cal">
      <div className="bo-cal-head">
        <button type="button" className="bo-cal-nav" disabled={!prevOk} aria-label="Previous month"
                onClick={() => setMonth(m0 === 0 ? { y: y - 1, m0: 11 } : { y, m0: m0 - 1 })}>‹</button>
        <span className="bo-cal-month">{monthLabel}</span>
        <button type="button" className="bo-cal-nav" disabled={!nextOk} aria-label="Next month"
                onClick={() => setMonth(m0 === 11 ? { y: y + 1, m0: 0 } : { y, m0: m0 + 1 })}>›</button>
      </div>
      <div className="bo-cal-grid bo-cal-dows">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="bo-cal-grid">
        {cells.map((d, i) => {
          if (d == null) return <span key={`x${i}`} />
          const ds = dstr(y, m0, d)
          const monday = new Date(Date.UTC(y, m0, d)).getUTCDay() === 1
          const off = ds < win.minDate || ds > win.maxDate || monday
          return (
            <button key={ds} type="button" disabled={off}
                    className={`bo-cal-day ${selected === ds ? 'is-picked' : ''}`}
                    onClick={() => onPick(ds)}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}
