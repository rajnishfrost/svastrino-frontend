import { api, tokenStore } from '../api/client.js'

const currentUserId = () => {
  try { return JSON.parse(localStorage.getItem('svastrino_user') || 'null')?.id || null } catch { return null }
}

/**
 * Offline write queue.
 *
 * Some actions (finishing a video, answering a question) happen while a student
 * is offline watching a downloaded session. Instead of losing them, we park them
 * here and replay them the moment the network is back.
 *
 * Entries are keyed so a repeat of the same action overwrites the old one
 * (last-write-wins) — e.g. re-answering the same question before syncing.
 */
const KEY = 'svastrino:outbox:v1'
const listeners = new Set()

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
const write = (items) => {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* quota */ }
  listeners.forEach((fn) => fn(items.length))
}

/** Subscribe to pending-count changes. Returns an unsubscribe function. */
export function onOutboxChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const pendingCount = () => read().length

/** Queue a write for later. `key` dedupes; `path`/`body` replay through api(). */
export function enqueue({ key, path, body }) {
  const items = read().filter((i) => i.key !== key)
  // Tag with the owner so a later login by a DIFFERENT account never replays
  // someone else's actions under the wrong user.
  items.push({ key, path, body, userId: currentUserId(), at: Date.now() })
  write(items)
}

let flushing = false

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Replay everything we can. Rules:
 *  - not logged in → do nothing (a 401 here would wrongly discard real progress)
 *  - only replay entries belonging to the CURRENT user
 *  - drop on success, or on a permanent 4xx (e.g. the question moved on)
 *  - KEEP on 401 (auth blip — retry after the next login), network or 5xx
 *  - entries older than a week are abandoned
 */
export async function flush() {
  if (flushing) return { sent: 0, left: pendingCount() }
  if (!tokenStore.get()) return { sent: 0, left: pendingCount() } // logged out — wait

  const uid = currentUserId()
  const items = read()
  if (!items.length) return { sent: 0, left: 0 }

  flushing = true
  let sent = 0
  const keep = []

  try {
    for (const item of items) {
      if (item.at && Date.now() - item.at > WEEK_MS) continue // too old — abandon
      if (item.userId && uid && item.userId !== uid) { keep.push(item); continue } // someone else's

      try {
        await api(item.path, { method: 'POST', auth: 'user', body: item.body })
        sent++
      } catch (e) {
        const status = e?.status
        if (typeof status === 'number' && status >= 400 && status < 500 && status !== 401) {
          sent++ // permanently rejected — drop it rather than retry forever
        } else {
          keep.push(item) // offline / 401 / server error — try again later
        }
      }
    }
  } finally {
    write(keep)
    flushing = false
  }
  return { sent, left: keep.length }
}

/** Flush now and whenever connectivity returns. Safe to call once at startup. */
export function startOutboxSync() {
  const run = () => { flush().catch(() => {}) }
  window.addEventListener('online', run)
  if (navigator.onLine) run()
  return () => window.removeEventListener('online', run)
}
