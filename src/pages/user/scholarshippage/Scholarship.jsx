import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHero from '../../../common_component/user/PageHero/PageHero.jsx'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import './Scholarship.css'

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : ''

/**
 * Nirmaan scholarship — full detail page (linked from the Home highlight and the
 * Nirmaan page). Adds `.theme-nirmaan` to <body> so the page uses the Nirmaan
 * green/brown/cream palette, matching the product it belongs to.
 *
 * Each partner organisation now runs its OWN scholarship, one cycle per year —
 * so a student's enrolment, test window and winner all belong to the
 * organisation they picked, not to one global contest.
 */
const STEPS = [
  { n: 1, title: 'Partner organisation', text: 'Your school, college, village body or NGO partners with Svastrino to host the scholarship for its students.' },
  { n: 2, title: 'Take the test', text: 'Eligible students sit a timed, auto-scored scholarship test on the Nirmaan platform.' },
  { n: 3, title: 'Top the leaderboard', text: 'Students are ranked by score — ties broken by who finished fastest.' },
  { n: 4, title: 'Win it free', text: 'The top scorer wins their entire Nirmaan package — 100% free.' },
]

const ELIGIBILITY = [
  'Open to students of a partner organisation — a school, college, village body, NGO or company.',
  'One entry per student per year; the test is taken once, under timed conditions.',
  'Your organisation must be enrolled as a Nirmaan scholarship partner.',
]

const FAQS = [
  { q: 'What does the winner get?', a: 'The complete Nirmaan package — psychometric test, career report, mentoring sessions and worksheets — entirely free.' },
  { q: 'How are winners decided?', a: 'Purely on merit: the highest scorer on the auto-scored test wins. If two students tie, the one who finished faster ranks higher. Each partner organisation picks its own winner.' },
  { q: 'Is there any fee to enter?', a: 'No. The scholarship test is free for students of partner organisations.' },
  { q: 'Who can become a partner?', a: 'Any school, college, village panchayat, NGO, coaching centre or company can partner with us to bring the Nirmaan scholarship to its students.' },
  { q: 'Does it run every year?', a: 'Yes — each partner runs its own cycle per year, so a student who misses one year can compete in the next.' },
]

export default function Scholarship() {
  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  return (
    <div className="scholarship-page">
      <PageHero
        eyebrow="Nirmaan Scholarship"
        title="Win a full Nirmaan scholarship"
        subtitle="We partner with schools, colleges, villages and NGOs to give one deserving student their entire Nirmaan package — completely free. Compete, top the test, and it’s yours."
      >
        <a href="#enrol" className="btn btn-primary btn-large">Enrol &amp; take the test</a>
        <a href="#partner" className="btn btn-secondary btn-large">Partner your organisation</a>
      </PageHero>

      {/* Winner announcements (public, once declared — one per partner) */}
      <WinnersBanner />

      {/* Student: enrol + take the test */}
      <EnrolSection />

      {/* How it works */}
      <section className="section">
        <div className="container text-center">
          <p className="section-eyebrow">How it works</p>
          <h2 className="section-title">Four steps to a free package</h2>
          <div className="grid grid-4 sch-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="card sch-step">
                <div className="sch-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility + prize */}
      <section className="section section--alt">
        <div className="container sch-two">
          <div className="card sch-panel">
            <h2>Who can apply</h2>
            <ul className="sch-list">
              {ELIGIBILITY.map((e) => <li key={e}>{e}</li>)}
            </ul>
            <Link to="/organisations" className="sch-link">See our partner organisations →</Link>
          </div>
          <div className="card sch-panel sch-prize">
            <span className="sch-prize-badge">The prize</span>
            <h2>Your entire Nirmaan package — free</h2>
            <p>
              Psychometric test, personalised career report, mentoring sessions and worksheets —
              the full journey, at no cost, for the top scorer.
            </p>
            <Link to="/skill-build/nirmaan" className="sch-link">See what’s inside Nirmaan →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="text-center">
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title">Common questions</h2>
          </div>
          <div className="sch-faqs">
            {FAQS.map((f) => (
              <div key={f.q} className="card sch-faq">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner form (organisations) */}
      <PartnerSection />
    </div>
  )
}

/* ---------------- Winner announcements (public) ---------------- */
function WinnersBanner() {
  const [winners, setWinners] = useState([])
  useEffect(() => {
    api('/user/scholarship/winners').then((d) => setWinners(d.winners || [])).catch(() => {})
  }, [])
  if (!winners.length) return null

  return (
    <section className="section sch-winner-wrap">
      <div className="container">
        {winners.slice(0, 3).map((w) => (
          <div className="sch-winner" key={`${w.userId}-${w.year}`}>
            <span className="sch-winner-trophy" aria-hidden>🏆</span>
            <div>
              <p className="sch-winner-label">Scholarship winner · {w.year}</p>
              <h2 className="sch-winner-name">{w.name}</h2>
              <p className="sch-winner-sub">
                {w.organisation}{w.score != null ? ` · scored ${w.score}/${w.total}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Student: enrol + take the test ---------------- */
function EnrolSection() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [organisations, setOrganisations] = useState([])
  const [me, setMe] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const loadMe = () => { if (user) api('/user/scholarship/me', { auth: 'user' }).then(setMe).catch(() => {}) }
  useEffect(() => {
    api('/user/organisations/enrollable').then((d) => setOrganisations(d.organisations)).catch(() => {})
    loadMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const c = me?.cycle

  return (
    <section id="enrol" className="section">
      <div className="container">
        <div className="card sch-panel sch-enrol">
          <span className="sch-prize-badge">For students</span>
          <h2>Enrol &amp; compete</h2>

          {/* Not logged in */}
          {!user && (
            <>
              <p>Log in (or create a free account) to enrol for the scholarship and take the test.</p>
              <button className="btn btn-primary btn-large"
                      onClick={() => navigate('/login', { state: { from: '/nirmaan-scholarship' } })}>
                Log in to enrol
              </button>
            </>
          )}

          {/* Logged in, not yet enrolled in a live cycle */}
          {user && me?.canEnroll && (
            <>
              <p>Enrol to compete — you’ll pick your partner organisation and enter your class &amp; roll number.</p>
              {organisations.length === 0
                ? <p className="sch-note">No partner organisations yet — ask yours to partner with us below.</p>
                : <button className="btn btn-primary btn-large" onClick={() => setShowModal(true)}>Enrol now</button>}
            </>
          )}

          {/* Enrolled — status + test entry based on this cycle's window */}
          {user && me?.enrolled && (
            <div className="sch-status">
              <p>
                Enrolled with <strong>{me.organisation?.name}</strong>{me.organisation?.branch ? ` (${me.organisation.branch})` : ''}
                {me.student ? ` · Class ${me.student.studentClass}${me.student.section ? `-${me.student.section}` : ''}, Roll ${me.student.rollNo}` : ''}
                {c?.year ? ` · ${c.year}` : ''}.
              </p>

              {me.isWinner && (
                <div className="sch-status-box ok">
                  <strong>🎉 You won the scholarship!</strong>
                  <p>Congratulations — you topped the Nirmaan scholarship test. We’ll reach out with the next steps.</p>
                </div>
              )}

              {me.attempt?.status === 'submitted' ? (
                <div className="sch-status-box ok">
                  <strong>Test submitted ✓</strong>
                  <p>
                    You scored <strong>{me.attempt.score}/{me.attempt.total}</strong>.{' '}
                    {me.winner && !me.isWinner
                      ? <>The winner is <strong>{me.winner.name}</strong>{me.winner.organisation ? ` from ${me.winner.organisation}` : ''}. Thanks for participating!</>
                      : 'Winners are announced after the window closes.'}
                  </p>
                </div>
              ) : c?.open ? (
                <div className="sch-status-box">
                  <p><strong>The test is open.</strong> You have {c.durationMins} minutes once you start. Closes {fmtDate(c.endAt)}.</p>
                  <button className="btn btn-primary btn-large" onClick={() => navigate('/nirmaan-scholarship/test')}>Start test</button>
                </div>
              ) : c?.upcoming ? (
                <div className="sch-status-box">Your test opens on <strong>{fmtDate(c.startAt)}</strong>. Come back then!</div>
              ) : c?.ended ? (
                <div className="sch-status-box warn">The test window has closed.</div>
              ) : (
                <div className="sch-status-box">Your organisation hasn’t scheduled the test yet — check back soon.</div>
              )}
            </div>
          )}

          {/* Past years */}
          {user && me?.history?.length > 1 && (
            <div className="sch-history">
              <h3>Your past attempts</h3>
              <ul>
                {me.history.filter((h) => h.cycleId !== c?.id).map((h) => (
                  <li key={h.cycleId}>
                    <strong>{h.year}</strong> · {h.organisation} ·{' '}
                    {h.attempt === 'submitted' ? `${h.score}/${h.total}` : 'not attempted'}
                    {h.isWinner && ' · 🏆 winner'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <EnrolModal
          organisations={organisations}
          onClose={() => setShowModal(false)}
          onDone={(m) => { setMe(m); setShowModal(false) }}
        />
      )}
    </section>
  )
}

/* ---------------- Enrol modal (organisation + class/section/roll) ---------------- */
function EnrolModal({ organisations, onClose, onDone }) {
  const [f, setF] = useState({ organisationId: '', studentClass: '', section: '', rollNo: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.organisationId) { setError('Please select your organisation.'); return }
    setBusy(true); setError('')
    try { onDone(await api('/user/scholarship/enroll', { method: 'POST', auth: 'user', body: f })) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="sch-modal-overlay" onClick={() => !busy && onClose()}>
      <form className="sch-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>Enrol for the scholarship</h3>
        <label className="sch-modal-field">Organisation
          <select value={f.organisationId} onChange={(e) => set('organisationId', e.target.value)} required>
            <option value="">— Select your organisation —</option>
            {organisations.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <div className="sch-modal-row">
          <label className="sch-modal-field">Class<input value={f.studentClass} onChange={(e) => set('studentClass', e.target.value)} placeholder="e.g. 10" maxLength={20} required /></label>
          <label className="sch-modal-field">Section<input value={f.section} onChange={(e) => set('section', e.target.value)} placeholder="e.g. A" maxLength={20} /></label>
          <label className="sch-modal-field">Roll no.<input value={f.rollNo} onChange={(e) => set('rollNo', e.target.value)} placeholder="e.g. 23" maxLength={30} required /></label>
        </div>
        {error && <p className="sch-error">{error}</p>}
        <div className="sch-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Enrolling…' : 'Enrol'}</button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- Organisation partner form ---------------- */
// Mirrors ORG_TYPES on the server — a fixed list keeps the public directory's
// filters meaningful.
const ORG_TYPES = [
  { key: 'school', label: 'School' },
  { key: 'college', label: 'College' },
  { key: 'village', label: 'Village / Panchayat' },
  { key: 'ngo', label: 'NGO / Trust' },
  { key: 'coaching', label: 'Coaching centre' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'other', label: 'Other' },
]

const BLANK = {
  name: '', type: 'school', description: '', branch: '', city: '', state: '',
  contactPerson: '', phone: '', email: '',
}

function PartnerSection() {
  const [f, setF] = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api('/user/organisations', { method: 'POST', body: f })
      setDone(true)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <section id="partner" className="section section--alt">
      <div className="container sch-cta">
        <div className="text-center">
          <p className="section-eyebrow">For organisations</p>
          <h2 className="section-title">Partner with us</h2>
          <p className="section-sub">
            A school, college, village body, NGO or company? Register to host the Nirmaan
            scholarship for your students. Once approved you get your own portal — add students in
            bulk, set your test, and pick your winner. We review every request and email you the outcome.
          </p>
        </div>

        {done ? (
          <div className="card sch-panel sch-thanks">
            <h3>Request received 🎉</h3>
            <p>
              Thanks! We’ll review your organisation and email you at <strong>{f.email}</strong> once
              it’s approved — that email carries the link to set your password and open your portal.
            </p>
          </div>
        ) : (
          <form className="card sch-panel sch-form" onSubmit={submit}>
            <div className="sch-form-grid">
              <label>Organisation name<input value={f.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} /></label>
              <label>Type
                <select value={f.type} onChange={(e) => set('type', e.target.value)}>
                  {ORG_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </label>
              <label>Branch / campus<input value={f.branch} onChange={(e) => set('branch', e.target.value)} maxLength={120} /></label>
              <label>City<input value={f.city} onChange={(e) => set('city', e.target.value)} maxLength={80} /></label>
              <label>State<input value={f.state} onChange={(e) => set('state', e.target.value)} maxLength={80} /></label>
              <label>Contact person<input value={f.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} maxLength={80} /></label>
              <label>Phone<input value={f.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} /></label>
              <label>Email (this becomes your login)<input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required maxLength={254} /></label>
            </div>
            <label className="sch-form-full">About your organisation (optional — shown in our public directory)
              <textarea value={f.description} onChange={(e) => set('description', e.target.value)} rows={3} maxLength={1200} />
            </label>
            {error && <p className="sch-error">{error}</p>}
            <button className="btn btn-primary btn-large" disabled={busy || !f.name.trim() || !f.email.trim()}>
              {busy ? 'Submitting…' : 'Submit partner request'}
            </button>
            <p className="sch-note">One request per network. We’ll email the outcome to the address above.</p>
          </form>
        )}
      </div>
    </section>
  )
}
