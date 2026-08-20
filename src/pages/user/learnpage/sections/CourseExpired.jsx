import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCourseRecord } from '../../../../api/learn.js'
import { openCourseRecord } from '../../../../utils/courseRecord.js'
// This screen uses the page shell (.learn-wrap) that Learn.css owns, so it is
// imported here rather than relied on through whichever parent rendered us.
import '../Learn.css'
import './CourseExpired.css'

/**
 * What the student sees once their year with a course is over. It replaces the
 * player, so it is the whole page — and for many students it is the last thing
 * they will read from us about a course they paid for. It has to be honest and
 * calm: say what has closed, say what is still theirs, and give them the way
 * forward. There is no version of this screen that tells anyone off.
 *
 * Three situations, in the order they arrive:
 *   expired + finished   — they did the work; congratulate them, hand them the
 *                          record, and get out of the way.
 *   expired + unfinished — the year ran out first. The videos and the remaining
 *                          tasks are closed and only the team can reopen them,
 *                          so talking to us is the one real next step. The work
 *                          they DID do is still theirs to download.
 *   archived             — three years on, the download window has closed too.
 *                          All that is left is which course they took and when.
 */

// Course dates are all IST-anchored, like every other date on the course page.
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

export default function CourseExpired({ course, user, slug }) {
  const access = course?.access || {}
  const archived = access.state === 'archived'
  const courseName = course?.skillBuild?.name || 'this course'

  // The record carries the two dates the course payload does not know about —
  // when they started and whether they finished — so it is fetched up front
  // rather than only when the Download button is pressed. Fetching it early
  // also means the button can open the print window inside the click itself,
  // which is what keeps popup blockers out of the way.
  const [record, setRecord] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    let alive = true
    fetchCourseRecord(slug)
      .then((r) => { if (alive) setRecord(r) })
      .catch(() => { /* The dates below fall back to the course payload. */ })
    return () => { alive = false }
  }, [slug])

  const startedAt = record?.startedAt || course?.startedAt || null
  const progress = course?.progress || {}
  const sessionsDone = record?.sessionsCompleted ?? progress.completed ?? 0
  const sessionsTotal = record?.sessionsTotal ?? progress.total ?? 0
  // Until the record arrives, fall back to the session counts already on screen.
  const finished = record
    ? !!record.completedAt
    : sessionsTotal > 0 && sessionsDone === sessionsTotal

  const download = async () => {
    setNote('')
    if (record) return openCourseRecord(record, user)
    setBusy(true)
    try {
      const r = await fetchCourseRecord(slug)
      setRecord(r)
      openCourseRecord(r, user)
    } catch {
      setNote('We could not put your work together just now. Please try again in a few minutes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section"><div className="container learn-wrap">
      <div className="card learn-exp">
        <p className="learn-exp-eyebrow">Skill Build</p>

        {archived ? (
          <>
            <h1>{courseName}</h1>
            <p className="learn-exp-lead">
              You took this course with us. Your access ended on {fmtDate(access.expiresAt)}, and the
              three years to download your work ended on {fmtDate(access.recordUntil)}.
            </p>
            <p className="learn-exp-lead">
              Your questions and answers can no longer be downloaded. What stays here is the record
              that you did this course, and when.
            </p>
          </>
        ) : finished ? (
          <>
            <h1>You finished {courseName}. Well done.</h1>
            <p className="learn-exp-lead">
              Your one year with this course is over, so the videos and tasks are now closed.
              Everything you wrote is still yours. Download it and keep a copy.
            </p>
          </>
        ) : (
          <>
            <h1>Your year with {courseName} has ended</h1>
            <p className="learn-exp-lead">
              A course stays open for one year from the day you enrol. That year is now over, so the
              videos and the tasks you had left are closed.
              {sessionsTotal > 0 && ` You finished ${sessionsDone} of ${sessionsTotal} sessions.`}
            </p>
            <p className="learn-exp-lead">
              If something got in the way and you would like more time, tell us what happened.
              Someone from our team will read it and reply to you.
            </p>
          </>
        )}

        <dl className="learn-exp-facts">
          <div className="learn-exp-fact">
            <dt>Enrolled on</dt><dd>{fmtDate(access.enrolledAt)}</dd>
          </div>
          <div className="learn-exp-fact">
            <dt>Started on</dt><dd>{startedAt ? fmtDate(startedAt) : 'Not started'}</dd>
          </div>
          <div className="learn-exp-fact">
            <dt>Completed on</dt>
            <dd>{record?.completedAt ? fmtDate(record.completedAt) : 'Not completed'}</dd>
          </div>
          <div className="learn-exp-fact">
            <dt>Access ended on</dt><dd>{fmtDate(access.expiresAt)}</dd>
          </div>
        </dl>

        {!archived && (
          <>
            <div className="learn-exp-actions">
              {!finished && (
                <Link
                  className="btn btn-primary"
                  to={`/support/new?course=${encodeURIComponent(slug)}&reason=expired`}
                >
                  Ask us for more time
                </Link>
              )}
              <button
                type="button"
                className={finished ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={download}
                disabled={busy}
              >
                {busy ? 'Getting your work ready…' : 'Download my work'}
              </button>
            </div>
            <p className="learn-exp-note">
              Your record has every question you were asked and every answer you wrote, with the
              dates. You can download it until {fmtDate(access.recordUntil)}, so please save a copy
              before then.
            </p>
          </>
        )}

        {note && <p className="learn-exp-msg">{note}</p>}

        <Link to="/dashboard" className="learn-exp-back">Go to my dashboard</Link>
      </div>
    </div></section>
  )
}
