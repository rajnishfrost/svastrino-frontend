import { api } from './client.js'

// The bell icon and the "New offers" page (server: /api/user/notifications/*).

/** The signed-in user's notifications plus the badge count. → { notifications, unread } */
export const fetchNotifications = () => api('/user/notifications', { auth: 'user' })

/** Clear the whole badge in one call. → { ok } */
export const markAllNotificationsRead = () =>
  api('/user/notifications/read-all', { method: 'POST', auth: 'user' })

/** Mark one as read; doing it twice is a no-op on the server. → { notification } */
export const markNotificationRead = (id) =>
  api(`/user/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', auth: 'user' })

/** Offers running right now. Public, so it works signed-out. → { offers } */
export const fetchOffers = () => api('/user/notifications/offers')
