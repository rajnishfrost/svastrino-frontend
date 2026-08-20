import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchMyTickets } from '../../../api/tickets.js'
import './Support.css'

/**
 * "Help & support" — every conversation this student has had with our team,
 * most recently active first.
 *
 * The three support screens (this list, the new-ticket form and one thread)
 * share their wording from here. Students and parents read all three in the
 * same sitting, so a status that reads one way on the list and another way
 * inside the thread would look like two different things happening.
 */

/**
 * The status words the student sees. The stored values are written for us, not
 * for them: 'open' means the ball is with our team, and 'awaiting_student'
 * means we have answered and are waiting on them — which is the one status a
 * student has to act on, so it is phrased as the thing they need to do.
 */
export const STATUS_LABEL = {
  open: 'With our team',
  awaiting_student: 'Your reply needed',
  resolved: 'Sorted out',
  closed: 'Closed',
}

// A calm dot colour per status, so the list can be scanned without reading.
export const STATUS_TONE = {
  open: 'wait',
  awaiting_student: 'you',
  resolved: 'done',
  closed: 'shut',
}

/** One line saying what happens next, for the top of a thread. */
export const STATUS_NOTE = {
  open: 'Our team has your message and will reply here.',
  awaiting_student: 'We have replied. Write back below whenever you are ready.',
  resolved: 'This one is sorted. You can still write back if you need more help.',
  closed: 'This conversation is closed. If you still need help, please start a new one.',
}

/** What each kind of question is called on the student's side of the site. */
export const CATEGORY_LABEL = {
  'course-expired': 'My course year has ended',
  payment: 'Payment or refund',
  technical: 'Something is not working',
  other: 'Something else',
}

/**
 * A course is stored as its slug ('nirmaan'), which is fine for the server but
 * is not how anyone says the name out loud, so it is tidied up for reading.
 */
export const courseLabel = (slug) =>
  String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/** A date the way a student would say it: 12 August 2026. */
export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

/** A date with the time on it, for the messages inside a thread. */
export const fmtWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      })
    : ''

/** The status pill, shared by the list and the thread header. */
export function StatusBadge({ status }) {
  return (
    <span className={`sup-badge sup-badge--${STATUS_TONE[status] || 'shut'}`}>
      {STATUS_LABEL[status] || 'In progress'}
    </span>
  )
}

export default function Support() {
  const [tickets, setTickets] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setTickets(null); setError(null)
    fetchMyTickets()
      .then((list) => { if (!cancelled) setTickets(list) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [reloadKey])

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Help &amp; support"
        subtitle="Ask us about your course, a payment, or anything on this website. A real person from our team answers."
      >
        <Link to="/support/new" className="btn btn-accent btn-large">Ask for help</Link>
      </PageHero>

      <section className="section">
        <div className="container sup-wrap">
          {error ? (
            <ConnectionState
              error={error}
              onRetry={() => setReloadKey((k) => k + 1)}
              label="your conversations"
            />
          ) : tickets == null ? (
            <p className="sup-state">Loading…</p>
          ) : tickets.length === 0 ? (
            <div className="card sup-empty">
              <h2 className="sup-empty-title">You have not asked us anything yet</h2>
              <p className="sup-sub">
                When you do, your conversation will sit here so you can come back to it any time.
              </p>
              <Link to="/support/new" className="btn btn-primary">Ask for help</Link>
            </div>
          ) : (
            <ul className="sup-list">
              {tickets.map((t) => (
                <li key={t.id}>
                  {/* The whole row is the link — a small "view" link at the end
                      would be a harder target on a phone. */}
                  <Link to={`/support/${t.id}`} className="card sup-item">
                    <div className="sup-item-main">
                      <h3 className="sup-item-title">{t.subject}</h3>
                      <p className="sup-item-meta">
                        {t.product ? `${courseLabel(t.product)} · ` : ''}
                        Last update {fmtDate(t.lastMessageAt)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
