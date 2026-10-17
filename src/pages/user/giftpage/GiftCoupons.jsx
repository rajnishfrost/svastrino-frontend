import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import PaymentGuard from '../../../common_component/user/PaymentGuard/PaymentGuard.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import { api } from '../../../api/client.js'
import { openCashfreeCheckout } from '../../../utils/cashfree.js'
import { usePageSeo } from '../../../seo/PageSeo.jsx'
import { LIMITS, checkEmail } from '../../../utils/validate.js'
import { openGiftTickets } from '../../../utils/giftTicket.js'
import GiftTicket from './GiftTicket.jsx'
import './GiftCoupons.css'

/**
 * Gift a coupon (footer → /gift-coupons). Anyone — no sign-in needed — picks a
 * value and how many, gives an email the coupons are also sent to (their copy
 * if they lose them), and pays through the usual Cashfree popup. The order
 * hands back a secret token that confirms the payment and reads the coupons. The coupons appear as tickets they can copy, download
 * (print / save as PDF) and hand on. Rules live on the server
 * (gifts/gift.service.js): any course or programme, once, for a year, used only
 * when the purchase it is applied to completes.
 */

// Shown until the server's own list arrives (and if it cannot be reached).
const FALLBACK = {
  values: [50000, 100000, 200000, 450000].map((v) => ({ value: v })),
  custom: { min: 100, max: 99999 }, // rupees
  maxQuantity: 10,
}
const inr = (paise) => '₹' + (Number(paise) / 100).toLocaleString('en-IN')
const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function GiftCoupons() {
  usePageSeo({
    title: 'Gift a coupon — help someone start with Svastrino',
    description: 'Buy a Svastrino gift coupon for a younger sibling or a friend. It works on any course or programme, once, for a year.',
  })
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

  const [options, setOptions] = useState(FALLBACK)
  const [value, setValue] = useState(100000)
  // "Other amount": whole rupees the buyer types, digits only.
  const [custom, setCustom] = useState(false)
  const [customText, setCustomText] = useState('')
  const [qty, setQty] = useState(1)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [payPhase, setPayPhase] = useState(null)
  const [err, setErr] = useState('')
  const [justBought, setJustBought] = useState(null)
  const [mine, setMine] = useState(null)
  const readyRef = useRef(null)

  useEffect(() => {
    api('/user/gifts/options').then(setOptions).catch(() => {})
  }, [])

  // Back from Cashfree's own payment page (an in-app browser cannot hold the
  // popup): the return link names the order and its token. Show its coupons,
  // then tidy the address so the token does not sit in the bar.
  useEffect(() => {
    const orderId = params.get('order')
    const token = params.get('t')
    if (!orderId || !token) return
    api(`/user/gifts/orders/${orderId}/verify`, { method: 'POST', body: { token } })
      .then(({ gift }) => setJustBought(gift))
      .catch((e) => { if (e.code !== 'PAYMENT_NOT_COMPLETED') setErr(e.message) })
      .finally(() => setParams({}, { replace: true }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // The account's email to start with; the student may change it.
  useEffect(() => {
    if (user?.email && !emailTouched) setEmail(user.email)
  }, [user?.email, emailTouched])

  const loadMine = () =>
    api('/user/gifts', { auth: 'user' }).then((d) => setMine(d.gifts)).catch(() => setMine([]))
  useEffect(() => {
    if (user) loadMine()
    else setMine(null)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const max = options.maxQuantity || 10
  const range = options.custom || FALLBACK.custom
  const customRupees = customText ? Number(customText) : 0
  const customErr = custom
    ? !customText
      ? 'Enter an amount.'
      : customRupees < range.min || customRupees > range.max
        ? `Enter an amount from ₹${range.min.toLocaleString('en-IN')} to ₹${range.max.toLocaleString('en-IN')}.`
        : ''
    : ''
  // The coupon's value in paise — the typed amount once it is in range.
  const chosen = custom ? (customErr ? 0 : customRupees * 100) : value
  const total = chosen * qty
  const emailErr = checkEmail(email)

  const buy = async () => {
    setErr('')
    if (customErr) { setErr(customErr); return }
    if (emailErr) { setErr(emailErr); return }
    setBusy(true)
    setPayPhase('preparing')
    try {
      const res = await api('/user/gifts/order', {
        method: 'POST', auth: 'user', body: { value: chosen, quantity: qty, email: email.trim() },
      })
      if (!res.mock) {
        // Cashfree's popup owns the screen from here; our overlay stands down.
        setPayPhase('gateway')
        const result = await openCashfreeCheckout(res)
        if (!result) throw new Error('Could not load the payment gateway. Check your connection and try again.')
        // An in-app browser: Cashfree took them away to pay, and brings them
        // back to this page, where the list below shows the coupons.
        if (result.redirect) return
      }
      // Only our server's check with Cashfree counts as paid. The order's
      // token proves this browser placed it — no account needed.
      setPayPhase('confirming')
      const { gift } = await api(`/user/gifts/orders/${res.orderId}/verify`, {
        method: 'POST', body: { token: res.giftToken },
      })
      setJustBought(gift)
      if (user) loadMine()
      setTimeout(() => readyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (e) {
      // Closing the popup without paying is not an error worth shouting about.
      if (e.code !== 'PAYMENT_NOT_COMPLETED') setErr(e.message)
    } finally {
      setBusy(false)
      setPayPhase(null)
    }
  }

  const history = (mine || []).filter((g) => g.orderId !== justBought?.orderId)

  return (
    <div className="gift-page">
      <PaymentGuard phase={payPhase} />
      <PageHero
        eyebrow="Gift a coupon"
        title="Give someone a head start"
        subtitle="Buy a Svastrino coupon for a younger sibling, a cousin or a friend. They use it on any course or programme — and you help them find their path."
      />

      <section className="py-12 md:py-16">
        <div className="container">
          {justBought && (
            <div className="gift-ready" ref={readyRef}>
              <h2 className="gift-section-title">
                {justBought.coupons.length === 1 ? 'Your gift coupon is ready 🎉' : `Your ${justBought.coupons.length} gift coupons are ready 🎉`}
              </h2>
              <p className="gift-section-sub">
                We have also emailed {justBought.coupons.length === 1 ? 'it' : 'them'} to <strong>{justBought.email}</strong>.
                Copy a code or download the tickets to hand them on.
              </p>
              <div className="gift-tickets">
                {justBought.coupons.map((c) => (
                  <GiftTicket key={c.code} {...c} onDownload={() => openGiftTickets([c])} />
                ))}
              </div>
              {justBought.coupons.length > 1 && (
                <button type="button" className="gift-link" style={{ marginTop: 16 }}
                        onClick={() => openGiftTickets(justBought.coupons)}>
                  Download all {justBought.coupons.length} tickets ↓
                </button>
              )}
            </div>
          )}

          <div className="gift-grid">
            {/* ---- Build the gift ---- */}
            <div className="gift-card">
              <div className="gift-step">
                <span className="gift-step-label" id="gift-value-q">1. Choose a value</span>
                <div className="gift-values" role="radiogroup" aria-labelledby="gift-value-q">
                  {options.values.map(({ value: v }) => (
                    <button key={v} type="button" role="radio" aria-checked={!custom && value === v}
                            className={`gift-value${!custom && value === v ? ' is-on' : ''}`}
                            onClick={() => { setValue(v); setCustom(false) }}>
                      {inr(v)}
                    </button>
                  ))}
                  <button type="button" role="radio" aria-checked={custom}
                          className={`gift-value gift-value--other${custom ? ' is-on' : ''}`}
                          onClick={() => setCustom(true)}>
                    Other amount
                  </button>
                </div>
                {custom && (
                  <div className="gift-custom">
                    <span className="gift-custom-prefix" aria-hidden>₹</span>
                    {/* Text, not type="number": a number box accepts "-", "e" and
                        decimals. Only digits get in, and no leading zeros. */}
                    <input className="gift-input gift-custom-input" type="text" inputMode="numeric"
                           autoFocus aria-label="Coupon value in rupees" placeholder={`${range.min} to ${range.max.toLocaleString('en-IN')}`}
                           maxLength={String(range.max).length} value={customText}
                           onChange={(e) => setCustomText(e.target.value.replace(/\D/g, '').replace(/^0+/, ''))} />
                  </div>
                )}
                {custom && (
                  <p className={customErr && customText ? 'gift-error' : 'gift-hint'}>
                    {customErr && customText ? customErr : `Whole rupees, from ₹${range.min.toLocaleString('en-IN')} to ₹${range.max.toLocaleString('en-IN')}.`}
                  </p>
                )}
              </div>

              <div className="gift-step">
                <span className="gift-step-label" id="gift-qty-q">2. How many coupons?</span>
                <div className="gift-qty" role="group" aria-labelledby="gift-qty-q">
                  <button type="button" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
                  <output aria-live="polite">{qty}</output>
                  <button type="button" aria-label="One more" disabled={qty >= max} onClick={() => setQty((n) => Math.min(max, n + 1))}>+</button>
                </div>
                <p className="gift-hint">Up to {max} at a time — each one is its own code.</p>
              </div>

              <div className="gift-step">
                <label className="gift-step-label" htmlFor="gift-email">3. Your email</label>
                <input id="gift-email" className="gift-input" type="email" inputMode="email" autoComplete="email"
                       maxLength={LIMITS.email} value={email} placeholder="you@example.com"
                       onChange={(e) => { setEmail(e.target.value); setEmailTouched(true) }} required />
                <p className="gift-hint">No account needed. We send the coupons to this email too, in case you lose them.</p>
              </div>

              <div className="gift-total">
                <div>
                  <div style={{ fontWeight: 700 }}>Total</div>
                  <small>{qty} × {chosen ? inr(chosen) : '—'}</small>
                </div>
                <strong>{chosen ? inr(total) : '—'}</strong>
              </div>

              <button type="button" className="gift-pay" onClick={buy} disabled={busy || !chosen || !!customErr || !!emailErr}>
                {busy ? 'Please wait…' : chosen ? `Buy for ${inr(total)}` : 'Enter an amount of ₹100 or more'}
              </button>
              {err && <p className="gift-error" role="alert">{err}</p>}

              <ul className="gift-rules">
                <li>Works on any course or programme at checkout</li>
                <li>One-time use, valid for 1 year from today</li>
                <li>Counts as used only when their purchase is completed</li>
                <li>Pay securely — cards, UPI, net banking and wallets</li>
              </ul>
            </div>

            {/* ---- Live preview ---- */}
            <div>
              <p className="gift-preview-label">Your gift will look like this</p>
              <GiftTicket value={chosen || (custom ? range.min * 100 : value)} sample />
              {qty > 1 && <p className="gift-hint" style={{ marginTop: 14 }}>× {qty} — every ticket gets its own code.</p>}
            </div>
          </div>

          {/* ---- What this student has bought ---- */}
          {user && history.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h2 className="gift-section-title">Your gift coupons</h2>
              <p className="gift-section-sub">Everything you have bought, and whether each code has been used.</p>
              {history.map((g) => (
                <div key={g.orderId} className="gift-order">
                  <div className="gift-order-head">
                    <span>
                      <strong>{g.quantity} × {inr(g.value)}</strong> · bought {g.paidAt ? day(g.paidAt) : ''}
                      {g.receiptNo ? ` · receipt ${g.receiptNo}` : ''}
                    </span>
                    {g.coupons.some((c) => c.status === 'active') && (
                      <button type="button" className="gift-link"
                              onClick={() => openGiftTickets(g.coupons.filter((c) => c.status === 'active'))}>
                        Download unused ↓
                      </button>
                    )}
                  </div>
                  <div className="gift-tickets">
                    {g.coupons.map((c) => (
                      <GiftTicket key={c.code} {...c} onDownload={c.status === 'active' ? () => openGiftTickets([c]) : undefined} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
