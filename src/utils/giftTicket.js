/**
 * Download gift coupons: open the ONE printable tickets page the server builds
 * (GET /api/user/gifts/orders/:id/tickets?t=…, the same page the email's
 * "Download your coupons" opens), so the site and the email can never show
 * different tickets. It opens the save-as-PDF dialog by itself.
 *
 * `downloadUrl` comes with each gift order (gift.downloadUrl); pass `code` to
 * show just that one coupon.
 */
export function openGiftTickets(downloadUrl, code) {
  if (!downloadUrl) return
  const url = code ? `${downloadUrl}&code=${encodeURIComponent(code)}` : downloadUrl
  // Inside the click, so the new tab is allowed; if a browser still blocks it,
  // open it here instead.
  // (No 'noopener' flag: with it window.open returns null even on success.)
  const tab = window.open(url, '_blank')
  if (tab) tab.opener = null
  else window.location.assign(url)
}
