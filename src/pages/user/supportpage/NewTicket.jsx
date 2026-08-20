import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import { api } from '../../../api/client.js'
import { createTicket } from '../../../api/tickets.js'
import { CATEGORY_LABEL, courseLabel } from './Support.jsx'
import './Support.css'

/**
 * The form that starts a conversation with our team.
 *
 * It can be opened cold from the support page, or from a course that has just
 * locked, as /support/new?course=nirmaan&reason=expired. In that second case
 * the student is already stuck and probably annoyed, so the form arrives with
 * the subject and the first message written for them — asking somebody to
 * explain a rule we enforced is a poor way to greet them. Everything stays
 * editable; it is a starting point, not a script.
 */

const MAX_SUBJECT = 120   // matches the server's own limit
const MAX_MESSAGE = 4000

/** The opening subject and message we write for a locked-out student. */
function expiredCopy(product) {
  const name = product ? `${courseLabel(product)} course` : 'course'
  return {
    subject: `More time to finish my ${name}`.slice(0, MAX_SUBJECT),
    text:
      `My one year with the ${name} has ended, so the videos and tasks are closed for me. ` +
      `I would like some more time to finish it. Please could you help?`,
  }
}

export default function NewTicket() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Read once: these come from the link the student followed, and re-reading
  // them mid-form would fight whatever they have typed since.
  const askedCourse = params.get('course') || ''
  const expiredIntent = params.get('reason') === 'expired'

  const [form, setForm] = useState({
    subject: '',
    category: expiredIntent ? 'course-expired' : 'other',
    product: askedCourse,
    text: '',
  })
  const [courses, setCourses] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // The courses this student actually holds, so they can say which one they
  // mean. Getting that right matters: an admin can only reopen a course the
  // ticket names. A failure here is quiet on purpose — the picker simply falls
  // back to whatever the link asked for, and the form still works.
  useEffect(() => {
    api('/user/payments/enrollments', { auth: 'user' })
      .then((d) => setCourses((d.enrollments || []).map((e) => e.courseSlug || e.product).filter(Boolean)))
      .catch(() => setCourses([]))
  }, [])

  /**
   * Keep the written-for-you copy in step with the chosen course, but only for
   * as long as the student has not touched it. Once they change a word it is
   * their message, and we leave it alone.
   */
  const written = useRef({ subject: '', text: '' })
  useEffect(() => {
    if (!expiredIntent) return
    const next = expiredCopy(form.product)
    setForm((f) => ({
      ...f,
      subject: f.subject === written.current.subject ? next.subject : f.subject,
      text: f.text === written.current.text ? next.text : f.text,
    }))
    written.current = next
  }, [expiredIntent, form.product])

  // The link may name a course that is not in the list yet (it loads a tick
  // after the form), so it is folded in rather than dropped.
  const courseOptions = [...new Set([...(askedCourse ? [askedCourse] : []), ...courses])]

  // Asking for a course back only means something if we know which course.
  const needsCourse = form.category === 'course-expired' && !form.product && courseOptions.length > 0
  const ready = form.subject.trim().length >= 3 && form.text.trim().length > 0 && !needsCourse

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!ready) return
    setErr(''); setBusy(true)
    try {
      const { ticket, message } = await createTicket({
        subject: form.subject.trim(),
        category: form.category,
        product: form.product,
        text: form.text.trim(),
      })
      // The server hands back an existing thread when one is already running
      // about the same thing, and says so in `message`. Carrying that line to
      // the thread explains why they landed on an older conversation.
      navigate(`/support/${ticket.id}`, { replace: true, state: { notice: message } })
    } catch (ex) {
      setErr(ex.message || 'We could not send that just now. Please try again in a moment.')
      setBusy(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Ask for help"
        subtitle="Tell us what you need and we will take it from there."
      />

      <section className="section">
        <div className="container sup-new-grid">
          <form className="card sup-form" onSubmit={onSubmit}>
            {expiredIntent && (
              <p className="sup-prefill">
                We have written the first message for you. Please add anything else that helps —
                how much of the course is left, or why you could not finish in time.
              </p>
            )}

            <label>
              What is this about?
              <select value={form.category} onChange={set('category')}>
                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            {courseOptions.length > 0 && (
              <label>
                Which course?
                <select value={form.product} onChange={set('product')}>
                  <option value="">This is not about a course</option>
                  {courseOptions.map((slug) => (
                    <option key={slug} value={slug}>{courseLabel(slug)}</option>
                  ))}
                </select>
                {needsCourse && (
                  <span className="sup-field-hint">
                    Please pick the course, so we open the right one for you.
                  </span>
                )}
              </label>
            )}

            <label>
              A short title
              <input
                type="text"
                required
                maxLength={MAX_SUBJECT}
                placeholder="For example: More time to finish my course"
                value={form.subject}
                onChange={set('subject')}
              />
            </label>

            <label>
              Your message
              <textarea
                rows="8"
                required
                maxLength={MAX_MESSAGE}
                placeholder="Tell us what happened and what you need."
                value={form.text}
                onChange={set('text')}
              />
            </label>

            {err && <p className="sup-error">{err}</p>}

            <div className="sup-form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy || !ready}>
                {busy ? 'Sending…' : 'Send to our team'}
              </button>
              <Link to="/support" className="btn btn-secondary">Back to my conversations</Link>
            </div>
          </form>

          <aside className="card sup-aside">
            <h2 className="sup-aside-title">A person reads this</h2>
            <p>
              Your message goes to our team, not to a robot. Someone reads it and writes back in
              their own words.
            </p>
            <p>
              We usually reply within one working day. You will find the answer on this page, and a
              note will appear in your notifications at the top of the site.
            </p>
            <p className="sup-aside-note">
              If your course year has ended, tell us how much is left to do. It helps us decide how
              much extra time to give you.
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}
