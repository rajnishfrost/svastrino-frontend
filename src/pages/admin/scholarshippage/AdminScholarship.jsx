import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import ConfirmModal from '../../../common_component/admin/ConfirmModal/ConfirmModal.jsx'
import ScholarshipCycleEditor from '../../../common_component/scholarship/ScholarshipCycleEditor.jsx'
import '../adminShared.css'

/**
 * Nirmaan Scholarship admin — the whole programme, across every partner.
 *
 * Organisations run their own cycles now, so admin's job is oversight: review
 * applications, decide what each partner may reach, and be able to open ANY
 * cycle's settings, questions, enrolments, results and individual answer sheets.
 * The cycle editor is the very same component the organisation portal uses, so
 * the two views can't drift apart.
 */
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'organisations', label: 'Organisations' },
  { key: 'cycles', label: 'Scholarship cycles' },
]

export default function AdminScholarship() {
  const [tab, setTab] = useState('overview')
  // Set when drilling into one organisation or cycle from a table.
  const [orgFocus, setOrgFocus] = useState(null)
  const [cycleFocus, setCycleFocus] = useState(null)

  const openOrg = (id) => { setOrgFocus(id); setTab('organisations') }
  const openCycles = (orgId) => { setOrgFocus(orgId); setCycleFocus(null); setTab('cycles') }

  return (
    <div>
      <h1 className="adm-title">Nirmaan Scholarship</h1>
      <p className="adm-sub">
        Approve partner organisations, control what each one can reach, and see every cycle they run.
      </p>

      <div className="adm-toolbar" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.key}
                  className={`adm-btn adm-btn--sm${tab === t.key ? '' : ' adm-btn--ghost'}`}
                  onClick={() => { setTab(t.key); setCycleFocus(null) }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && <Overview onOpenOrgs={() => setTab('organisations')} />}
      {tab === 'organisations' && (
        <Organisations focusId={orgFocus} onClearFocus={() => setOrgFocus(null)} onOpenCycles={openCycles} />
      )}
      {tab === 'cycles' && (
        <Cycles
          orgFilter={orgFocus}
          onClearOrgFilter={() => setOrgFocus(null)}
          focusId={cycleFocus}
          onFocus={setCycleFocus}
          onOpenOrg={openOrg}
        />
      )}
    </div>
  )
}

// ---- Overview ----------------------------------------------------------------
function Overview({ onOpenOrgs }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/scholarship/overview', { auth: 'admin' })
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="adm-error">{error}</p>
  if (!stats) return <p className="adm-empty">Loading…</p>

  return (
    <section>
      <div className="adm-stat-grid">
        <div className="adm-stat-card"><strong>{stats.organisations}</strong><span>Partner organisations</span></div>
        <div className="adm-stat-card"><strong>{stats.activeOrganisations}</strong><span>Approved &amp; active</span></div>
        <div className="adm-stat-card"><strong>{stats.pendingOrganisations}</strong><span>Awaiting review</span></div>
        <div className="adm-stat-card"><strong>{stats.liveCycles}</strong><span>Live cycles</span></div>
        <div className="adm-stat-card"><strong>{stats.cycles}</strong><span>Cycles all-time</span></div>
        <div className="adm-stat-card"><strong>{stats.enrolments}</strong><span>Student enrolments</span></div>
        <div className="adm-stat-card"><strong>{stats.submitted}</strong><span>Tests submitted</span></div>
        <div className="adm-stat-card"><strong>{stats.winners}</strong><span>Winners declared</span></div>
      </div>

      {stats.pendingOrganisations > 0 && (
        <section className="adm-panel">
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>
            {stats.pendingOrganisations} organisation{stats.pendingOrganisations === 1 ? '' : 's'} waiting for review
          </h2>
          <p className="adm-sub">
            Approving one creates its login account and emails a set-password link to its portal.
          </p>
          <button className="adm-btn" onClick={onOpenOrgs}>Review applications</button>
        </section>
      )}
    </section>
  )
}

// ---- Organisations -----------------------------------------------------------
const TYPE_LABEL = {
  school: 'School', college: 'College', village: 'Village / Panchayat',
  ngo: 'NGO / Trust', coaching: 'Coaching centre', corporate: 'Corporate', other: 'Other',
}
const ALL_MODULES = [
  { key: 'students', label: 'Students', hint: 'Add students and bulk-import a roster' },
  { key: 'scholarship', label: 'Scholarship', hint: 'Run cycles, questions, results' },
  { key: 'profile', label: 'Profile', hint: 'Edit their public listing' },
]

function Organisations({ focusId, onClearFocus, onOpenCycles }) {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [review, setReview] = useState(null) // { org, action }
  const [edit, setEdit] = useState(null)     // org being configured
  const [detail, setDetail] = useState(null) // drill-down payload
  const [busy, setBusy] = useState(false)

  const load = (st = status, search = q) => {
    const p = new URLSearchParams()
    if (st) p.set('status', st)
    if (search.trim()) p.set('q', search.trim())
    const qs = p.toString()
    return api(`/admin/scholarship/organisations${qs ? `?${qs}` : ''}`, { auth: 'admin' })
      .then((d) => setRows(d.organisations))
      .catch((e) => setError(e.message))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Drill straight into an organisation when arrived at from another tab.
  useEffect(() => {
    if (focusId) openDetail(focusId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  const openDetail = async (id) => {
    setError('')
    try { setDetail(await api(`/admin/scholarship/organisations/${id}`, { auth: 'admin' })) }
    catch (e) { setError(e.message) }
  }

  const doReview = async (reason) => {
    const { org, action } = review
    setBusy(true); setError('')
    try {
      await api(`/admin/scholarship/organisations/${org.id}`, {
        method: 'PATCH', auth: 'admin',
        body: { status: action, reason: action === 'rejected' ? reason : '' },
      })
      setReview(null); load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (detail) {
    return (
      <OrgDetail
        detail={detail}
        onBack={() => { setDetail(null); onClearFocus() }}
        onOpenCycles={onOpenCycles}
        onConfigure={() => setEdit(detail.organisation)}
        editing={edit}
        onCloseEdit={(changed) => { setEdit(null); if (changed) openDetail(detail.organisation.id) }}
      />
    )
  }

  return (
    <section>
      <div className="adm-toolbar">
        <input className="adm-input" style={{ maxWidth: 240 }} placeholder="Search name, city, code…"
               value={q} onChange={(e) => { setQ(e.target.value); load(status, e.target.value) }} />
        <select className="adm-select" style={{ width: 180 }} value={status}
                onChange={(e) => { setStatus(e.target.value); setRows(null); load(e.target.value, q) }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {error && <p className="adm-error">{error}</p>}
      {!rows ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? (
        <p className="adm-empty">No organisations.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Organisation</th><th>Location</th><th>Contact</th><th>Access</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button className="adm-link" style={{ padding: 0, fontSize: 14 }} onClick={() => openDetail(o.id)}>
                      <strong>{o.name}</strong>
                    </button>
                    <div className="adm-sub" style={{ margin: 0 }}>
                      {TYPE_LABEL[o.type] || o.type}{o.branch ? ` · ${o.branch}` : ''}{o.code ? ` · ${o.code}` : ''}
                    </div>
                  </td>
                  <td>{[o.city, o.state].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <div>{o.contactPerson || '—'}</div>
                    <div className="adm-sub" style={{ margin: 0 }}>{o.email}{o.phone ? ` · ${o.phone}` : ''}</div>
                  </td>
                  <td>
                    <div className="adm-sub" style={{ margin: 0 }}>{o.modules?.length ? o.modules.join(', ') : 'none'}</div>
                    {!o.publicListed && <span className="adm-badge adm-badge--muted">unlisted</span>}
                    {!o.active && <span className="adm-badge adm-badge--warn" style={{ marginLeft: 4 }}>suspended</span>}
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge--${o.status === 'approved' ? 'ok' : o.status === 'rejected' ? 'warn' : 'muted'}`}>{o.status}</span>
                    {o.status === 'rejected' && o.rejectionReason && (
                      <div className="adm-sub" style={{ margin: '4px 0 0', maxWidth: 220 }}>{o.rejectionReason}</div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {o.status !== 'approved' && (
                      <button className="adm-btn adm-btn--sm" onClick={() => setReview({ org: o, action: 'approved' })}>Approve</button>
                    )}
                    {o.status !== 'rejected' && (
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" style={{ marginLeft: 6 }} onClick={() => setReview({ org: o, action: 'rejected' })}>Reject</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {review && (
        <ConfirmModal
          title={review.action === 'approved' ? `Approve “${review.org.name}”?` : `Reject “${review.org.name}”?`}
          message={review.action === 'approved'
            ? 'This creates their organisation login and emails a set-password link to their portal, where they can add students and run their scholarship.'
            : 'They’ll be emailed the outcome.'}
          confirmLabel={review.action === 'approved' ? 'Approve' : 'Reject'}
          danger={review.action === 'rejected'}
          input={review.action === 'rejected' ? { label: 'Reason (optional — emailed to them)', placeholder: 'e.g. Not eligible this cycle' } : undefined}
          busy={busy}
          onCancel={() => setReview(null)}
          onConfirm={doReview}
        />
      )}
    </section>
  )
}

// ---- One organisation, in full ----------------------------------------------
function OrgDetail({ detail, onBack, onOpenCycles, onConfigure, editing, onCloseEdit }) {
  const { organisation: o, stats, cycles } = detail
  const [students, setStudents] = useState(null)
  const [showStudents, setShowStudents] = useState(false)
  const [error, setError] = useState('')

  const loadStudents = async () => {
    setShowStudents(true)
    if (students) return
    try {
      const d = await api(`/admin/scholarship/organisations/${o.id}/students`, { auth: 'admin' })
      setStudents(d.students)
    } catch (e) { setError(e.message) }
  }

  return (
    <section>
      <button className="adm-link" style={{ padding: 0, marginBottom: 10 }} onClick={onBack}>← All organisations</button>

      <div className="adm-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>{o.name}</h2>
            <p className="adm-sub" style={{ margin: '4px 0 0' }}>
              {TYPE_LABEL[o.type] || o.type}
              {o.branch ? ` · ${o.branch}` : ''}
              {[o.city, o.state].filter(Boolean).length ? ` · ${[o.city, o.state].filter(Boolean).join(', ')}` : ''}
              {o.code ? ` · ${o.code}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span className={`adm-badge adm-badge--${o.status === 'approved' ? 'ok' : o.status === 'rejected' ? 'warn' : 'muted'}`}>{o.status}</span>
            {!o.active && <span className="adm-badge adm-badge--warn">suspended</span>}
            <button className="adm-btn adm-btn--sm" onClick={onConfigure}>Configure access</button>
          </div>
        </div>
        {o.description && <p style={{ marginTop: 12, marginBottom: 0 }}>{o.description}</p>}
        <p className="adm-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          {o.contactPerson || '—'} · {o.email}{o.phone ? ` · ${o.phone}` : ''}
          {o.website ? <> · <a href={o.website} target="_blank" rel="noreferrer">{o.website}</a></> : null}
        </p>
      </div>

      <div className="adm-stat-grid">
        <div className="adm-stat-card"><strong>{stats.students}</strong><span>Students added</span></div>
        <div className="adm-stat-card"><strong>{stats.enrolments}</strong><span>Enrolments</span></div>
        <div className="adm-stat-card"><strong>{stats.submitted}</strong><span>Tests submitted</span></div>
        <div className="adm-stat-card"><strong>{stats.cycles}</strong><span>Cycles run</span></div>
      </div>

      {error && <p className="adm-error">{error}</p>}

      <div className="adm-toolbar">
        <button className="adm-btn adm-btn--ghost" onClick={loadStudents}>
          {showStudents ? 'Refresh students' : 'View students'}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={() => onOpenCycles(o.id)}>Open their cycles</button>
      </div>

      {showStudents && (
        !students ? <p className="adm-empty">Loading students…</p> : students.length === 0 ? (
          <p className="adm-empty">No students added yet.</p>
        ) : (
          <div className="adm-panel adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Student</th><th>Class</th><th>Roll no.</th><th>Account</th><th>Test</th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}<div className="adm-sub" style={{ margin: 0 }}>{s.email}</div></td>
                    <td>{s.studentClass || '—'}{s.section ? `-${s.section}` : ''}</td>
                    <td>{s.rollNo || '—'}</td>
                    <td>{s.activated
                      ? <span className="adm-badge adm-badge--ok">Active</span>
                      : <span className="adm-badge adm-badge--warn">Invite sent</span>}</td>
                    <td>{s.attempt === 'submitted'
                      ? <span className="adm-badge adm-badge--ok">{s.score}/{s.total}</span>
                      : <span className="adm-badge adm-badge--muted">{s.attempt.replace('_', ' ')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <h3 style={{ fontSize: 16, margin: '18px 0 8px' }}>Cycles</h3>
      {cycles.length === 0 ? <p className="adm-empty">No cycles yet.</p> : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Year</th><th>Title</th><th>Status</th><th>Questions</th><th>Enrolled</th><th>Submitted</th><th>Winner</th></tr></thead>
            <tbody>
              {cycles.map((c) => (
                <tr key={c.id}>
                  <td className="adm-num">{c.year}</td>
                  <td>{c.title}</td>
                  <td><span className={`adm-badge adm-badge--${c.open ? 'ok' : c.status === 'draft' ? 'muted' : 'warn'}`}>{c.status}</span></td>
                  <td className="adm-num">{c.questions}</td>
                  <td className="adm-num">{c.enrolled}</td>
                  <td className="adm-num">{c.submitted}</td>
                  <td>{c.winnerName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <ConfigureModal org={editing} onClose={onCloseEdit} />}
    </section>
  )
}

/* Per-organisation access: which portal sections, public listing, suspension. */
function ConfigureModal({ org, onClose }) {
  const [modules, setModules] = useState(org.modules || [])
  const [publicListed, setPublicListed] = useState(org.publicListed !== false)
  const [active, setActive] = useState(org.active !== false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key) =>
    setModules((p) => (p.includes(key) ? p.filter((m) => m !== key) : [...p, key]))

  const save = async () => {
    setBusy(true); setError('')
    try {
      await api(`/admin/scholarship/organisations/${org.id}`, {
        method: 'PUT', auth: 'admin', body: { modules, publicListed, active },
      })
      onClose(true)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="adm-modal-overlay" onClick={() => !busy && onClose(false)}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{org.name} — access</h3>
        <p className="adm-sub">Which sections of their portal this organisation can use. Takes effect on their next request.</p>

        {ALL_MODULES.map((m) => (
          <label key={m.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, fontSize: 14 }}>
            <input type="checkbox" checked={modules.includes(m.key)} onChange={() => toggle(m.key)} style={{ marginTop: 3 }} />
            <span>
              <strong>{m.label}</strong>
              <div className="adm-sub" style={{ margin: 0 }}>{m.hint}</div>
            </span>
          </label>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)', margin: '14px 0' }} />

        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 14 }}>
          <input type="checkbox" checked={publicListed} onChange={(e) => setPublicListed(e.target.checked)} />
          Show in the public /organisations directory
        </label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active — unticking suspends their portal and hides them from enrolment
        </label>

        {error && <p className="adm-error">{error}</p>}
        <div className="adm-modal-actions">
          <button className="adm-btn adm-btn--ghost" onClick={() => onClose(false)} disabled={busy}>Cancel</button>
          <button className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save access'}</button>
        </div>
      </div>
    </div>
  )
}

// ---- Cycles across every organisation ---------------------------------------
function Cycles({ orgFilter, onClearOrgFilter, focusId, onFocus, onOpenOrg }) {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    const p = new URLSearchParams()
    if (orgFilter) p.set('organisation', orgFilter)
    if (status) p.set('status', status)
    if (year) p.set('year', year)
    const qs = p.toString()
    return api(`/admin/scholarship/cycles${qs ? `?${qs}` : ''}`, { auth: 'admin' })
      .then((d) => setRows(d.cycles))
      .catch((e) => setError(e.message))
  }

  useEffect(() => { setRows(null); load() }, [orgFilter, status, year]) // eslint-disable-line react-hooks/exhaustive-deps

  const cycle = rows?.find((c) => c.id === focusId) || null

  if (cycle) {
    return (
      <section>
        <button className="adm-link" style={{ padding: 0, marginBottom: 10 }} onClick={() => onFocus(null)}>← All cycles</button>
        <ScholarshipCycleEditor
          key={cycle.id}
          cycle={cycle}
          basePath="/admin/scholarship"
          auth="admin"
          onChanged={load}
          onDeleted={() => { onFocus(null); load() }}
        />
      </section>
    )
  }

  const years = [...new Set((rows || []).map((c) => c.year))].sort((a, b) => b - a)

  return (
    <section>
      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 170 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select className="adm-select" style={{ width: 140 }} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {orgFilter && (
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={onClearOrgFilter}>
            Clear organisation filter ✕
          </button>
        )}
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!rows ? <p className="adm-empty">Loading…</p> : rows.length === 0 ? (
        <p className="adm-empty">No cycles yet.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Year</th><th>Organisation</th><th>Cycle</th><th>Status</th>
                <th>Questions</th><th>Enrolled</th><th>Submitted</th><th>Winner</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="adm-num">{c.year}</td>
                  <td>
                    <button className="adm-link" style={{ padding: 0, fontSize: 14 }} onClick={() => onOpenOrg(c.organisation)}>
                      {c.organisationName}
                    </button>
                    <div className="adm-sub" style={{ margin: 0 }}>
                      {TYPE_LABEL[c.organisationType] || c.organisationType}{c.organisationCity ? ` · ${c.organisationCity}` : ''}
                    </div>
                  </td>
                  <td>{c.title}</td>
                  <td>
                    <span className={`adm-badge adm-badge--${c.open ? 'ok' : c.status === 'draft' ? 'muted' : 'warn'}`}>
                      {c.status === 'published' ? (c.open ? 'test open' : c.upcoming ? 'scheduled' : c.ended ? 'closed' : 'published') : c.status}
                    </span>
                  </td>
                  <td className="adm-num">{c.questions}</td>
                  <td className="adm-num">{c.enrolled}</td>
                  <td className="adm-num">{c.submitted}</td>
                  <td>{c.winnerName || '—'}{c.winnerEmail && <div className="adm-sub" style={{ margin: 0 }}>{c.winnerEmail}</div>}</td>
                  <td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onFocus(c.id)}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
