import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import './AdminTickets.css'

/**
 * Support conversations, and the one screen where a locked course is reopened.
 *
 * A course is valid for a year. When that year runs out the videos and tasks
 * shut, and the student's only way forward is to talk to us — that conversation
 * lands here. An admin answers it in the thread and, if it is fair, gives the
 * student more days from the same panel.
 *
 * Two things matter more than anything else on this page. Nobody may be left
 * unanswered, which is why the default order is longest-waiting first rather
 * than newest first. And a second grant of access must never happen by
 * accident: nothing stops one, because sometimes it is the right call, so every
 * grant already made is shown at the top of the thread before the button is.
 *
 * `accessGrant.days` is the TOTAL across every grant on the ticket, not the
 * size of the last one — grants stack. Every sentence below that shows it says
 * so, because reading it as a single decision would understate how much time
 * the student has actually been given.
 */

const STATUSES = [
  { value: 'open', label: 'Needs our reply' },
  { value: 'awaiting_student', label: 'Waiting on the student' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_FILTERS = [{ value: '', label: 'All conversations' }, ...STATUSES]

const CATEGORY_LABEL = {
  'course-expired': 'Course year over',
  payment: 'Payment',
  technical: 'Technical',
  other: 'Something else',
}

const SORTS = [
  { value: 'waiting', label: 'Longest waiting first' },
  { value: 'recent', label: 'Newest activity first' },
]

// An open thread left alone for this long is the thing this page exists to
// catch, so it is called out in the list rather than left to be noticed.
const LATE_AFTER_DAYS = 2

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_GRANT_DAYS = '90'

const when = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

const onDay = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

/** How long since the thread last moved, in the roughest unit that still reads true. */
const waitedFor = (d) => {
  const ms = Date.now() - new Date(d).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

const isLate = (t) =>
  t.status === 'open' && Date.now() - new Date(t.lastMessageAt).getTime() > LATE_AFTER_DAYS * DAY_MS

/**
 * The ticket carries the course as a slug, because that is what the enrolment
 * is keyed on. Nobody should have to read a slug off a screen, so it is turned
 * back into words for display while the slug itself stays the thing we send.
 */
const courseName = (slug) =>
  String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/** Never render a blank name — fall back to the email, then to something human. */
const studentName = (t) => t.student?.name?.trim() || t.student?.email || 'A student'

export default function AdminTickets() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('waiting')
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('') // the debounced value we actually search on
  const [error, setError] = useState('')

  const [openId, setOpenId] = useState('')
  const [reply, setReply] = useState('')
  const [days, setDays] = useState(DEFAULT_GRANT_DAYS)
  const [detailError, setDetailError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [confirm, setConfirm] = useState(null) // the grant awaiting a yes

  // The search runs a regex query across accounts and tickets, so it waits for
  // a pause in typing rather than firing on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(() => {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    if (term) qs.set('q', term)
    setError('')
    api(`/admin/tickets${qs.toString() ? `?${qs}` : ''}`, { auth: 'admin' })
      .then((d) => setRows(d.tickets))
      .catch((e) => setError(e.message))
  }, [status, term])

  useEffect(() => { load() }, [load])

  /**
   * Every action returns the whole updated ticket, so the row is swapped for
   * the new one and nothing else is disturbed. Reloading the list instead would
   * scroll the admin away from the conversation they are in the middle of.
   */
  const replaceRow = (ticket) =>
    setRows((list) => (list || []).map((r) => (r.id === ticket.id ? ticket : r)))

  const openThread = (row) => {
    const next = row.id === openId ? '' : row.id
    setOpenId(next)
    setReply('')
    setDays(DEFAULT_GRANT_DAYS)
    setDetailError('')
  }

  const setTicketStatus = async (id, value) => {
    setBusyId(id); setDetailError(''); setError('')
    try {
      const d = await api(`/admin/tickets/${id}/status`, {
        method: 'PATCH', auth: 'admin', body: { status: value },
      })
      replaceRow(d.ticket)
    } catch (ex) {
      setError(ex.message)
    } finally {
      setBusyId('')
    }
  }

  const sendReply = async (id) => {
    const text = reply.trim()
    if (!text) { setDetailError('Write your reply before sending it.'); return }
    setBusyId(id); setDetailError('')
    try {
      const d = await api(`/admin/tickets/${id}/reply`, { method: 'POST', auth: 'admin', body: { text } })
      replaceRow(d.ticket)
      setReply('')
    } catch (ex) {
      setDetailError(ex.message)
    } finally {
      setBusyId('')
    }
  }

  /** Check the number here so an obvious mistake never becomes a request. */
  const askToGrant = (row) => {
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      setDetailError('Enter the number of days as a whole number between 1 and 365.')
      return
    }
    setDetailError('')
    setConfirm({ id: row.id, days: n, name: studentName(row), product: row.product })
  }

  const doGrant = async () => {
    if (!confirm) return
    const { id, days: n } = confirm
    setBusyId(id); setDetailError('')
    try {
      const d = await api(`/admin/tickets/${id}/grant`, { method: 'POST', auth: 'admin', body: { days: n } })
      replaceRow(d.ticket)
      setConfirm(null)
      setDays(DEFAULT_GRANT_DAYS)
    } catch (ex) {
      setConfirm(null)
      setDetailError(ex.message)
    } finally {
      setBusyId('')
    }
  }

  /**
   * Longest waiting first means two things at once: conversations where the ball
   * is with us come above the rest, and inside each group the one untouched the
   * longest is on top. A thread waiting on a student for forty days matters too
   * — it usually means they never came back — so it is not hidden, just ranked
   * below the ones we owe an answer to.
   */
  const visible = useMemo(() => {
    if (!rows) return null
    const list = [...rows]
    if (sort === 'recent') {
      list.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      return list
    }
    const oursFirst = (t) => (t.status === 'open' ? 0 : 1)
    list.sort((a, b) =>
      oursFirst(a) - oursFirst(b) || new Date(a.lastMessageAt) - new Date(b.lastMessageAt))
    return list
  }, [rows, sort])

  const waitingOnUs = (rows || []).filter((t) => t.status === 'open').length

  return (
    <>
      <h1 className="adm-title">Support</h1>
      <p className="adm-sub">
        Conversations with students. When a course year has run out, this is where
        you talk it through and give the student more time.
      </p>

      <div className="adm-toolbar">
        <input
          className="adm-input tkt-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, subject or course"
          aria-label="Search conversations"
        />
        <select className="adm-select tkt-filter" value={status}
                onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="adm-select tkt-filter" value={sort}
                onChange={(e) => setSort(e.target.value)} aria-label="Sort conversations">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={load}>Refresh</button>
        {waitingOnUs > 0 && (
          <span className="tkt-count">
            {waitingOnUs} waiting on us
          </span>
        )}
      </div>

      {error && <p className="adm-error">{error}</p>}

      {visible == null ? (
        <p className="adm-empty">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="adm-empty">
          {term || status
            ? 'No conversations match that search.'
            : 'No one has written in yet.'}
        </p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table tkt-table">
            <thead>
              <tr>
                <th>Who</th>
                <th>About</th>
                <th>Course</th>
                <th>Waiting</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <Fragment key={r.id}>
                  <tr className={isLate(r) ? 'tkt-row--late' : undefined}>
                    <td>
                      <strong>{studentName(r)}</strong>
                      <div className="tkt-contact">
                        {r.student?.email && <a href={`mailto:${r.student.email}`}>{r.student.email}</a>}
                      </div>
                    </td>
                    <td className="tkt-subject">
                      {r.subject}
                      <div className="tkt-meta">
                        {CATEGORY_LABEL[r.category] || 'Something else'}
                        {' · '}
                        {r.messageCount} {r.messageCount === 1 ? 'message' : 'messages'}
                      </div>
                    </td>
                    <td>
                      {r.product
                        ? <span className="tkt-course">{courseName(r.product)}</span>
                        : <span className="tkt-meta">Not about a course</span>}
                      {r.accessGrant?.grantedAt && (
                        <div className="tkt-granted-flag">
                          Access already given · {r.accessGrant.days} days in total
                        </div>
                      )}
                    </td>
                    <td className={`tkt-wait${isLate(r) ? ' tkt-wait--late' : ''}`}>
                      {waitedFor(r.lastMessageAt)}
                    </td>
                    <td>
                      <select
                        className="adm-select tkt-status"
                        value={r.status}
                        disabled={busyId === r.id}
                        onChange={(e) => setTicketStatus(r.id, e.target.value)}
                        aria-label="Change status"
                      >
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openThread(r)}>
                        {openId === r.id ? 'Close' : 'Open'}
                      </button>
                    </td>
                  </tr>

                  {openId === r.id && (
                    <tr className="tkt-detail-row">
                      <td colSpan={6}>
                        {/* The grant comes first on purpose: whoever opens this
                            thread has to see that access was already given
                            before they think about giving it again. */}
                        {r.accessGrant?.grantedAt && (
                          <div className="tkt-grant-banner">
                            <strong>Course access has already been reopened</strong>
                            <span>
                              {r.accessGrant.days} {r.accessGrant.days === 1 ? 'day' : 'days'} in
                              total{r.accessGrant.grantCount > 1
                                ? ` across ${r.accessGrant.grantCount} grants, most recently on `
                                : ' on '}
                              {onDay(r.accessGrant.grantedAt)}
                              {r.product ? ` for ${courseName(r.product)}` : ''}.
                            </span>
                          </div>
                        )}

                        <div className="tkt-thread">
                          {r.messages.map((m, i) => {
                            // The message a grant wrote carries the very same
                            // instant as the grant itself, which is the only
                            // way to tell it apart — it is an ordinary admin
                            // message otherwise. Every grant is matched, not
                            // just the most recent, so a thread that was
                            // reopened twice shows both decisions where they
                            // were made.
                            const isGrantNote =
                              m.from === 'admin' &&
                              (r.grants || []).some(
                                (g) => g.grantedAt && new Date(g.grantedAt).getTime() === new Date(m.at).getTime()
                              )
                            return (
                              <div
                                key={`${r.id}-${i}`}
                                className={`tkt-msg tkt-msg--${m.from}${isGrantNote ? ' tkt-msg--grant' : ''}`}
                              >
                                <div className="tkt-msg-head">
                                  <strong>{m.authorName || (m.from === 'admin' ? 'Svastrino team' : 'Student')}</strong>
                                  <span>{when(m.at)}</span>
                                </div>
                                {isGrantNote && <span className="tkt-msg-tag">Access reopened</span>}
                                <p className="tkt-msg-text">{m.text}</p>
                              </div>
                            )
                          })}
                        </div>

                        {detailError && <p className="adm-error">{detailError}</p>}

                        <div className="tkt-actions">
                          <div className="tkt-reply">
                            <label className="adm-label" htmlFor={`reply-${r.id}`}>Your reply</label>
                            {r.status === 'closed' ? (
                              <p className="tkt-note">
                                This conversation is closed, so a reply cannot be sent. Move it back
                                to “Needs our reply” above if you want to carry on with the student.
                              </p>
                            ) : (
                              <>
                                <textarea
                                  id={`reply-${r.id}`}
                                  className="adm-textarea"
                                  rows={4}
                                  maxLength={4000}
                                  value={reply}
                                  onChange={(e) => setReply(e.target.value)}
                                  onKeyDown={(e) => {
                                    // A support reply is typed and sent dozens of
                                    // times a day, so the keyboard can finish it.
                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendReply(r.id)
                                  }}
                                  placeholder="Write to the student. They read this on their own support page."
                                />
                                <button
                                  className="adm-btn adm-btn--sm"
                                  disabled={busyId === r.id}
                                  onClick={() => sendReply(r.id)}
                                >
                                  {busyId === r.id ? 'Sending…' : 'Send reply'}
                                </button>
                                <span className="tkt-hint">Sending moves this to “Waiting on the student”.</span>
                              </>
                            )}
                          </div>

                          <div className="tkt-grant">
                            <label className="adm-label" htmlFor={`days-${r.id}`}>Reopen course access</label>
                            {r.product ? (
                              <>
                                <p className="tkt-note">
                                  Gives {studentName(r)} more time on {courseName(r.product)}. The days
                                  count from today when the course has already run out. A note goes into
                                  this conversation and the student is told.
                                </p>
                                <div className="tkt-grant-row">
                                  <input
                                    id={`days-${r.id}`}
                                    className="adm-input tkt-days"
                                    type="number"
                                    min={1}
                                    max={365}
                                    step={1}
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                  />
                                  <span className="tkt-hint">days, up to 365</span>
                                  <button
                                    className="adm-btn adm-btn--sm"
                                    disabled={busyId === r.id}
                                    onClick={() => askToGrant(r)}
                                  >
                                    Reopen access
                                  </button>
                                </div>
                                {r.accessGrant?.grantedAt && (
                                  <p className="tkt-note tkt-note--warn">
                                    This student has already been given {r.accessGrant.days}{' '}
                                    {r.accessGrant.days === 1 ? 'day' : 'days'} in total
                                    {r.accessGrant.grantCount > 1
                                      ? ` across ${r.accessGrant.grantCount} grants, most recently on `
                                      : ' on '}
                                    {onDay(r.accessGrant.grantedAt)}. Any days you give now are added
                                    on top, so only do this again if you mean to.
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="tkt-note">
                                This conversation is not linked to a course, so there is no access to
                                reopen. Ask the student which course they mean, then handle it from a
                                conversation about that course.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <div className="adm-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm reopening access">
          <div className="adm-modal">
            <h3>Reopen this course?</h3>
            <p className="tkt-note">
              {confirm.name} gets {confirm.days} more {confirm.days === 1 ? 'day' : 'days'} on{' '}
              {courseName(confirm.product)}. The conversation is marked resolved and the student is
              told straight away. This cannot be undone from here.
            </p>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="adm-btn" disabled={busyId === confirm.id} onClick={doGrant}>
                {busyId === confirm.id ? 'Giving access…' : `Yes, give ${confirm.days} days`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
