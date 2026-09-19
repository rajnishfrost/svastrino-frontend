import { useEffect, useRef } from 'react'
import './PaymentGuard.css'

/**
 * The screen that sits over everything while money is moving.
 *
 * Between "create the order" and "the server has confirmed it", a click is the
 * one thing that can cost a customer real money with nothing to show for it. A
 * second press of Pay starts a second order; a link followed mid-verify leaves a
 * charge that went through on a page that never learned it did; a refresh at the
 * wrong second does the same. None of those are rare — they are what people do
 * when a screen looks like it has stopped.
 *
 * So for that window the page stops being usable: nothing beneath this can be
 * clicked, tabbed to, or scrolled, and the browser asks before it lets the tab
 * be closed or reloaded. The words say what is happening and what not to do,
 * because an unexplained block is indistinguishable from a hang.
 *
 * `phase` is the part of the payment we are in:
 *
 *   'preparing'   we are creating the order. Ours to block.
 *   'gateway'     Cashfree's own window is open and waiting for a card.
 *   'confirming'  the money has moved and our server is confirming it. The most
 *                 important one to hold: this is where access is granted and a
 *                 booking is written.
 *   null          not paying — nothing rendered, no listeners.
 *
 * 'gateway' deliberately draws NOTHING. Cashfree renders its checkout as a modal
 * over this page with its own backdrop, and a second overlay on top of it would
 * cover the card form and make paying impossible. The unload guard stays on
 * through it, which is the part that still matters there.
 */
export default function PaymentGuard({ phase }) {
  const panelRef = useRef(null)
  const active = !!phase
  const visible = active && phase !== 'gateway'

  // Ask before the tab is reloaded or closed. The browser shows its own wording
  // — ours is ignored by every current browser — but the prompt is what matters:
  // it turns an instant, silent loss into a decision.
  useEffect(() => {
    if (!active) return undefined
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = '' // Chrome and Safari need this assignment, not just the call
      return ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])

  // Freeze the page underneath. Without this the overlay covers the content but
  // the wheel still scrolls it, which reads as a page that is half responding.
  useEffect(() => {
    if (!visible) return undefined
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [visible])

  /*
   * Hold the keyboard here too.
   *
   * A blocked screen that can still be tabbed through is not blocked: the focus
   * ring walks onto the buttons behind the overlay and Enter presses them, so
   * the customer sets off a second order without ever seeing what they hit.
   * Escape is swallowed for the same reason — there is nothing to dismiss, and a
   * key that looks like it should close this and does not is worse than one that
   * does nothing at all.
   */
  useEffect(() => {
    if (!visible) return undefined
    const panel = panelRef.current
    panel?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        panel?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true) // capture: before anything else sees it
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [visible])

  if (!visible) return null

  const confirming = phase === 'confirming'

  return (
    // aria-modal + role=alertdialog: a screen reader announces this and stays
    // inside it, which is the spoken equivalent of what the focus trap does.
    <div className="paywall" role="alertdialog" aria-modal="true" aria-busy="true"
         aria-labelledby="paywall-title" aria-describedby="paywall-warning">
      <div className="paywall-panel" ref={panelRef} tabIndex={-1}>
        <div className="paywall-spinner" aria-hidden="true" />

        <h2 className="paywall-title" id="paywall-title">
          {confirming ? 'Confirming your payment' : 'Setting up your payment'}
        </h2>

        <p className="paywall-sub">
          {confirming
            ? 'Your payment has gone through and we are confirming it now. This takes a few seconds.'
            : 'One moment while we open the secure payment window.'}
        </p>

        {/* The instruction, given its own box rather than a line of small print:
            it is the only thing on this screen the customer has to act on. */}
        <p className="paywall-warning" id="paywall-warning">
          Please do not refresh the page or close the window.
        </p>
      </div>
    </div>
  )
}
