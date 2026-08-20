import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import ConnectionState from '../../../common_component/user/ConnectionState/ConnectionState.jsx'
import { fetchTicket, replyToTicket } from '../../../api/tickets.js'
import { CATEGORY_LABEL, STATUS_NOTE, StatusBadge, courseLabel, fmtDate, fmtWhen } from './Support.jsx'
import './Support.css'

/**
 * One conversation, read top to bottom: what was asked, what we answered, and
 * a box to write back.
 *
 * The whole thread arrives in a single response, so there is nothing to page
 * through and nothing to load as the student scrolls.
 */
export default function TicketThread() {
  const { id } = useParams()
  const location = useLocation()

  const [ticket, setTicket] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  // Set when the form handed us a line to show — usually that an existing
  // conversation was reused instead of a second one being opened.
  const [notice, setNotice] = useState(location.state?.notice || '')

  const endOfThread = useRef(null)

  useEffect(() => {
    let cancelled = false
    setTicket(null); setError(null)
    fetchTicket(id)
      .then((t) => { if (!cancelled) setTicket(t) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [id, reloadKey])

  const onReply = async (e) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSendError(''); setSending(true)
    try {
      const updated = await replyToTicket(id, body)
      setTicket(updated)
      setText('')
      setNotice('')
      // Their own message is now the last thing on the page, and on a long
      // thread it lands below the fold — so bring it into view.
      endOfThread.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    } catch (ex) {
      setSendError(ex.message || 'We could not send that just now. Please try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  // A conversation that is not this student's own comes back as a 404, exactly
  // like one that never existed. Either way there is nothing to retry, so it
  // gets a plain explanation rather than the "try again" panel.
  if (error?.status === 404) {
    return (
      <>
        <PageHero eyebrow="Support" title="We could not find that conversation" />
        <section className="section">
          <div className="container sup-wrap">
            <div className="card sup-empty">
              <p className="sup-sub">
                The link may be old, or the conversation may belong to another account.
              </p>
              <Link to="/support" className="btn btn-primary">See my conversations</Link>
            </div>
          </div>
        </section>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHero eyebrow="Support" title="Your conversation" />
        <section className="section">
          <div className="container sup-wrap">
            <ConnectionState
              error={error}
              onRetry={() => setReloadKey((k) => k + 1)}
              label="this conversation"
            />
          </div>
        </section>
      </>
    )
  }

  if (!ticket) {
    return (
      <>
        <PageHero eyebrow="Support" title="Your conversation" />
        <section className="section">
          <div className="container sup-wrap"><p className="sup-state">Loading…</p></div>
        </section>
      </>
    )
  }

  const closed = ticket.status === 'closed'
  const granted = Boolean(ticket.accessGrant?.grantedAt)

  return (
    <>
      <PageHero eyebrow="Support" title={ticket.subject} subtitle={STATUS_NOTE[ticket.status]}>
        <Link to="/support" className="btn btn-secondary">All my conversations</Link>
      </PageHero>

      <section className="section">
        <div className="container sup-wrap">
          {notice && <p className="sup-notice">{notice}</p>}

          <div className="sup-thread-meta">
            <StatusBadge status={ticket.status} />
            <span>{CATEGORY_LABEL[ticket.category] || CATEGORY_LABEL.other}</span>
            {ticket.product && (
              <Link to={`/learn/${ticket.product}`} className="sup-thread-course">
                {courseLabel(ticket.product)}
              </Link>
            )}
            <span>Started {fmtDate(ticket.createdAt)}</span>
          </div>

          <ol className="sup-thread">
            {(ticket.messages || []).map((m, i) => (
              <li
                key={`${m.at}-${i}`}
                className={`sup-msg ${m.from === 'student' ? 'sup-msg--you' : 'sup-msg--team'}`}
              >
                <div className="sup-msg-head">
                  {/* An admin's name is stamped on the message when it is
                      written, so the thread still reads properly years later. */}
                  <span className="sup-msg-who">
                    {m.from === 'student' ? 'You' : m.authorName || 'Svastrino team'}
                  </span>
                  <span className="sup-msg-when">{fmtWhen(m.at)}</span>
                </div>
                <p className="sup-msg-text">{m.text}</p>
              </li>
            ))}
          </ol>

          {granted && (
            <div className="sup-grant">
              <h2 className="sup-grant-title">Your course is open again</h2>
              {/* days is the total across every time we reopened this course,
                  so when that happened more than once the sentence has to say
                  so — quoting the total beside the latest date alone would read
                  as though all of it had been given that day. */}
              <p>
                {ticket.accessGrant.grantCount > 1
                  ? `We have given you ${ticket.accessGrant.days} extra days in all on`
                  : `On ${fmtDate(ticket.accessGrant.grantedAt)} we gave you ${ticket.accessGrant.days} more ${ticket.accessGrant.days === 1 ? 'day' : 'days'} on`}
                {ticket.product ? ` your ${courseLabel(ticket.product)} course` : ' your course'}
                {ticket.accessGrant.grantCount > 1
                  ? `, the last of them on ${fmtDate(ticket.accessGrant.grantedAt)}.`
                  : '.'}{' '}
                Please try to finish inside that time.
              </p>
              {ticket.product && (
                <Link to={`/learn/${ticket.product}`} className="btn btn-primary">
                  Go to my course
                </Link>
              )}
            </div>
          )}

          <div ref={endOfThread} />

          {closed ? (
            <div className="card sup-closed">
              <p className="sup-sub">
                This conversation is closed, so you cannot add to it. If you still need help, start
                a new one and we will pick it up from there.
              </p>
              <Link to="/support/new" className="btn btn-primary">Ask for help again</Link>
            </div>
          ) : (
            <form className="card sup-reply" onSubmit={onReply}>
              <label>
                Write back
                <textarea
                  rows="5"
                  maxLength={4000}
                  placeholder="Add anything else we should know."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              {sendError && <p className="sup-error">{sendError}</p>}
              <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
