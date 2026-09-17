// Cashfree's browser checkout, shared by every page that takes a payment.

const SDK_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js'

// Load Cashfree's checkout script once; resolves true when window.Cashfree is ready.
function loadCashfree() {
  return new Promise((resolve) => {
    if (window.Cashfree) return resolve(true)
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const s = document.createElement('script')
    s.src = SDK_SRC
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

/**
 * Open Cashfree's checkout as a popup over the page, for an order our server
 * created ({ sessionId, mode } from POST /user/payments/order). Resolves when
 * the popup closes with Cashfree's own result — { error }, { redirect } or
 * { paymentDetails } — or null when the script could not load.
 *
 * The result is never proof of payment: a closed popup and a refused card both
 * come back as { error }. Always confirm the order on our server afterwards.
 */
export async function openCashfreeCheckout({ sessionId, mode }) {
  const ready = await loadCashfree()
  if (!ready || !window.Cashfree) return null
  const cashfree = window.Cashfree({ mode })
  return cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_modal' })
}
