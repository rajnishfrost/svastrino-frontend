import { api } from './client.js'

// The student's side of support (server: /api/user/tickets/*). A support thread
// is always somebody's own conversation, so every call here is signed in.

/** Start a conversation. Body: { subject, category, product, text }. → { ticket, message } */
export const createTicket = (body) => api('/user/tickets', { method: 'POST', auth: 'user', body })

/** The signed-in student's own conversations, newest activity first. → [ticket] */
export const fetchMyTickets = () =>
  api('/user/tickets', { auth: 'user' }).then((d) => d.tickets || [])

/** One of the student's own conversations, with every message in it. → ticket */
export const fetchTicket = (id) =>
  api(`/user/tickets/${encodeURIComponent(id)}`, { auth: 'user' }).then((d) => d.ticket)

/** Write back into a conversation. The server refuses a closed one. → ticket */
export const replyToTicket = (id, text) =>
  api(`/user/tickets/${encodeURIComponent(id)}/reply`, { method: 'POST', auth: 'user', body: { text } })
    .then((d) => d.ticket)
