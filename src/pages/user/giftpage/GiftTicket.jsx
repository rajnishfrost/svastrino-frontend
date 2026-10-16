import { useState } from 'react'

const inr = (paise) => '₹' + (Number(paise) / 100).toLocaleString('en-IN')
const day = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * One gift coupon, drawn as a ticket: a navy stub with the value, a perforated
 * tear line with two punched notches, and the code, validity and branding on
 * the cream side. Stacks vertically on phones. A used or expired coupon is
 * stamped and greyed out.
 *
 * `sample` draws the live preview on the buy form (placeholder code, no copy).
 */
export default function GiftTicket({ code, value, expiresAt, status = 'active', sample = false, onDownload }) {
  const [copied, setCopied] = useState(false)
  const off = status === 'used' || status === 'expired' || status === 'inactive'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* the code is on screen to copy by hand */ }
  }

  return (
    <div className={`gt${off ? ' gt--off' : ''}${sample ? ' gt--sample' : ''}`}>
      <div className="gt-stub">
        <span className="gt-stub-tag">Gift coupon</span>
        <span className="gt-stub-value">{inr(value)}</span>
        <span className="gt-stub-sub">off any course</span>
        <span className="gt-stub-stars" aria-hidden>✦ ✦ ✦</span>
      </div>

      <span className="gt-notch gt-notch--a" aria-hidden />
      <span className="gt-notch gt-notch--b" aria-hidden />

      <div className="gt-main">
        <div className="gt-brand">
          <img src="/logo-256.png" alt="Svastrino" className="gt-logo" />
          <span className="gt-site">svastrino.com</span>
        </div>
        <p className="gt-title">A gift for your journey</p>

        <div className="gt-code-row">
          <span className="gt-code" aria-label="Coupon code">{sample ? 'GIFT-XXXX-XXXX' : code}</span>
          {!sample && !off && (
            <button type="button" className="gt-copy" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          )}
        </div>

        <div className="gt-meta">
          <span>Valid till <strong>{expiresAt ? day(expiresAt) : '1 year from today'}</strong></span>
          <span className="gt-dot" aria-hidden>•</span>
          <span>One-time use</span>
        </div>
        <p className="gt-how">Enter the code in the coupon box at checkout on any course or programme.</p>

        {!sample && onDownload && (
          <button type="button" className="gt-download" onClick={onDownload}>Download ↓</button>
        )}
      </div>

      {off && (
        <span className="gt-stamp" aria-label={`This coupon is ${status}`}>
          {status === 'used' ? 'Used' : status === 'expired' ? 'Expired' : 'Off'}
        </span>
      )}
    </div>
  )
}
