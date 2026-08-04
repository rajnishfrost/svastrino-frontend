import { api } from './client.js'

// Counselling & mentoring booking API (server: /api/user/mentoring/*).

/** Public catalog — Bull's Eye / Bloom / Breakthrough with price + sessions. */
export const fetchMentoringPrograms = () =>
  api('/user/mentoring/programs').then((d) => d.programs || [])

/** Available 2-hour slots for one IST date. → { date, window, closed, slots } */
export const fetchSlots = (date) =>
  api(`/user/mentoring/slots?date=${encodeURIComponent(date)}`)

/** The signed-in user's programs + full session tables. */
export const fetchMyMentoring = () =>
  api('/user/mentoring/my', { auth: 'user' }).then((d) => d.programs || [])

/** Book the next session of an owned program. { sku, date, start:'HH:MM' } */
export const createBooking = (body) =>
  api('/user/mentoring/bookings', { method: 'POST', auth: 'user', body })

/** Move a booked session (allowed until 2 days before it starts). */
export const rescheduleBooking = (id, body) =>
  api(`/user/mentoring/bookings/${id}/reschedule`, { method: 'POST', auth: 'user', body })

/** Guest checkout: auto-create an account from name+email (409 EMAIL_EXISTS → login). */
export const guestStart = (body) =>
  api('/user/auth/guest', { method: 'POST', body })
