import { useCallback, useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import ConfirmModal from '../../../common_component/admin/ConfirmModal/ConfirmModal.jsx'
import Pager from '../../../common_component/admin/Pager/Pager.jsx'
import '../adminShared.css'

/**
 * Career Library — the three things that make up /resources#career-library:
 *   Streams  — categories such as Commerce or Engineering
 *   Courses  — the detail page behind each course (/career-library/<slug>)
 *
 * A course can sit in several streams, so membership is edited on the COURSE
 * (pick its streams there) and a stream's list is derived from that — which is
 * why the stream form has no course picker.
 */
const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const PER_PAGE = 20
const TABS = [
  { key: 'fields', label: 'Streams' },
  { key: 'courses', label: 'Courses' },
]

export default function AdminCareerLibrary() {
  const [tab, setTab] = useState('fields')
  const [fields, setFields] = useState(null)
  const [error, setError] = useState('')

  // Streams are the stream list AND the course form's picker, so they're loaded
  // once here and shared by both tabs.
  const loadFields = useCallback(() => {
    api('/admin/career-library/fields', { auth: 'admin' })
      .then((d) => setFields(d.fields))
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => { loadFields() }, [loadFields])

  return (
    <div>
      <h1 className="adm-title">Career Library</h1>
      <p className="adm-sub">Streams and the course pages filed under them.</p>

      <div className="adm-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`adm-tab${tab === t.key ? ' is-active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="adm-error">{error}</p>}

      {tab === 'fields' && <StreamsTab fields={fields} reload={loadFields} />}
      {tab === 'courses' && <CoursesTab fields={fields || []} onCourseSaved={loadFields} />}
    </div>
  )
}

/* ================= Streams ================= */

function StreamsTab({ fields, reload }) {
  const [editing, setEditing] = useState(null) // field | 'new' | null
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const doDelete = async () => {
    setBusy(true)
    try {
      await api(`/admin/career-library/fields/${del.id}`, { method: 'DELETE', auth: 'admin' })
      setDel(null)
      reload()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <div className="adm-toolbar">
        <button className="adm-btn" onClick={() => setEditing('new')}>+ New stream</button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {editing === 'new' && (
        <div className="adm-panel">
          <StreamForm onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
        </div>
      )}

      {!fields ? <p className="adm-empty">Loading…</p> : fields.length === 0 ? (
        <p className="adm-empty">No streams yet. Add the first one above.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>#</th><th>Stream</th><th>Courses</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {fields.map((f) => (
                editing !== 'new' && editing?.id === f.id ? (
                  <tr key={f.id}><td colSpan={5}>
                    <StreamForm field={f} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
                  </td></tr>
                ) : (
                  <tr key={f.id}>
                    <td className="adm-num">{f.order}</td>
                    <td>
                      <strong>{f.name}</strong>
                      <p className="adm-sub" style={{ margin: '2px 0 0', fontSize: 12.5 }}>{f.slug}</p>
                    </td>
                    <td className="adm-num">{f.courseCount}</td>
                    <td><span className={`adm-badge adm-badge--${f.active ? 'ok' : 'muted'}`}>{f.active ? 'Visible' : 'Hidden'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="adm-link" onClick={() => setEditing(f)}>Edit</button>
                      <button className="adm-link" style={{ color: 'var(--color-danger)' }} onClick={() => setDel(f)}>Delete</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}

      {del && (
        <ConfirmModal
          title={`Delete the “${del.name}” stream?`}
          message={`Its ${del.courseCount} course page${del.courseCount === 1 ? '' : 's'} stay — they just stop appearing under this stream.`}
          confirmLabel="Delete stream"
          danger
          busy={busy}
          onConfirm={doDelete}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  )
}

function StreamForm({ field, onCancel, onSaved }) {
  const [f, setF] = useState({
    name: field?.name || '', slug: field?.slug || '', description: field?.description || '',
    order: field?.order ?? '', active: field?.active ?? true,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const onName = (name) =>
    setF((p) => (field || (p.slug && p.slug !== slugify(p.name))
      ? { ...p, name }
      : { ...p, name, slug: slugify(name) }))

  const save = async () => {
    setBusy(true); setErr('')
    const body = { name: f.name, description: f.description, order: f.order === '' ? 0 : Number(f.order), active: f.active }
    try {
      if (field) await api(`/admin/career-library/fields/${field.id}`, { method: 'PATCH', auth: 'admin', body })
      else await api('/admin/career-library/fields', { method: 'POST', auth: 'admin', body: { ...body, slug: f.slug } })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>{field ? `Edit ${field.name}` : 'New stream'}</h3>
      <div className="adm-row2">
        <div className="adm-field"><label>Name</label>
          <input className="adm-input" value={f.name} onChange={(e) => onName(e.target.value)} placeholder="Professional Commerce Courses" /></div>
        <div className="adm-field"><label>Slug {field ? '(fixed — courses link to it)' : '(unique)'}</label>
          <input className="adm-input" value={f.slug} disabled={!!field} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
      </div>
      <div className="adm-field"><label>Description</label>
        <textarea className="adm-textarea" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>Order</label>
          <input className="adm-input adm-num" type="number" value={f.order} onChange={(e) => set('order', e.target.value)} /></div>
        <div className="adm-field" style={{ alignSelf: 'end', paddingBottom: 10 }}>
          <label style={{ display: 'inline', fontSize: 14, fontWeight: 400, color: 'inherit' }}>
            <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Visible on site
          </label>
        </div>
      </div>
      {field && (
        <p className="adm-sub" style={{ fontSize: 12.5 }}>
          Courses are attached from the Courses tab — open a course and tick this stream there.
        </p>
      )}
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save} disabled={busy || !f.name.trim() || !f.slug}>
          {busy ? 'Saving…' : field ? 'Save changes' : 'Create stream'}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

/* ================= Courses ================= */

function CoursesTab({ fields, onCourseSaved }) {
  const [courses, setCourses] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [q, setQ] = useState('')
  const [field, setField] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // course row | 'new' | null
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
    if (q.trim()) params.set('q', q.trim())
    if (field) params.set('field', field)
    if (status) params.set('status', status)

    api(`/admin/career-library/courses?${params}`, { auth: 'admin' })
      .then((d) => { setCourses(d.courses); setPagination(d.pagination); setError('') })
      .catch((e) => setError(e.message))
  }, [page, q, field, status])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => { setPage(1) }, [q, field, status])

  const doDelete = async () => {
    setBusy(true)
    try {
      await api(`/admin/career-library/courses/${del.id}`, { method: 'DELETE', auth: 'admin' })
      setDel(null)
      load(); onCourseSaved()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  if (editing) {
    return (
      <CourseEditor
        course={editing === 'new' ? null : editing}
        fields={fields}
        onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); onCourseSaved() }}
      />
    )
  }

  return (
    <div>
      <div className="adm-toolbar">
        <input className="adm-input" style={{ width: 220 }} value={q}
               onChange={(e) => setQ(e.target.value)} placeholder="Search course name or slug…" />
        <select className="adm-select" style={{ width: 220 }} value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">All streams</option>
          {fields.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select className="adm-select" style={{ width: 140 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <button className="adm-btn" onClick={() => setEditing('new')}>+ New course</button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {!courses ? <p className="adm-empty">Loading…</p> : courses.length === 0 ? (
        <p className="adm-empty">No courses match these filters.</p>
      ) : (
        <>
          <div className="adm-panel adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Course</th><th>Streams</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <p className="adm-sub" style={{ margin: '2px 0 0', fontSize: 12.5 }}>/career-library/{c.slug}</p>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {c.fields.length ? c.fields.map((f) => f.name).join(', ')
                        : <span className="adm-badge adm-badge--warn">No stream</span>}
                    </td>
                    <td><span className={`adm-badge adm-badge--${c.active ? 'ok' : 'muted'}`}>{c.active ? 'Visible' : 'Hidden'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="adm-link" onClick={() => setEditing(c)}>Edit</button>
                      {c.active && (
                        <a className="adm-link" href={`/${c.slug}`} target="_blank" rel="noreferrer"
                           style={{ textDecoration: 'none' }}>View ↗</a>
                      )}
                      <button className="adm-link" style={{ color: 'var(--color-danger)' }} onClick={() => setDel(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pager page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} unit="course" />
        </>
      )}

      {del && (
        <ConfirmModal
          title={`Delete “${del.name}”?`}
          message="The course page and its URL are removed for good. This can't be undone."
          confirmLabel="Delete course"
          danger
          busy={busy}
          onConfirm={doDelete}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  )
}

const blankCourse = {
  name: '', slug: '', overview: '', topQualities: '', institutesIndia: '',
  institutesInternational: '', careerLadder: '', sourceUrl: '', active: true,
}

function CourseEditor({ course, fields, onCancel, onSaved }) {
  const [f, setF] = useState(blankCourse)
  const [jobs, setJobs] = useState([])
  const [picked, setPicked] = useState([]) // stream slugs
  const [loading, setLoading] = useState(!!course)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  // The table rows carry only name/slug/streams — the long-form content comes
  // from a full fetch.
  useEffect(() => {
    if (!course) return
    api(`/admin/career-library/courses/${course.id}`, { auth: 'admin' })
      .then(({ course: c }) => {
        setF({
          name: c.name, slug: c.slug, overview: c.overview || '',
          topQualities: (c.topQualities || []).join('\n'),
          institutesIndia: (c.institutesIndia || []).join('\n'),
          institutesInternational: (c.institutesInternational || []).join('\n'),
          careerLadder: (c.careerLadder || []).join('\n'),
          sourceUrl: c.sourceUrl || '', active: c.active,
        })
        setJobs(c.topJobs || [])
        setPicked((c.fields || []).map((x) => x.slug))
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [course])

  const onName = (name) =>
    setF((p) => (course || (p.slug && p.slug !== slugify(p.name))
      ? { ...p, name }
      : { ...p, name, slug: slugify(name) }))

  const toggleField = (slug) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]))

  const setJob = (i, k, v) => setJobs((p) => p.map((j, idx) => (idx === i ? { ...j, [k]: v } : j)))
  const addJob = () => setJobs((p) => [...p, { role: '', description: '', indiaSalary: '', globalSalary: '' }])
  const removeJob = (i) => setJobs((p) => p.filter((_, idx) => idx !== i))

  const save = async () => {
    if (!f.name.trim()) return setErr('Course name is required')
    setBusy(true); setErr('')
    const body = {
      name: f.name, overview: f.overview, sourceUrl: f.sourceUrl, active: f.active,
      topQualities: f.topQualities, institutesIndia: f.institutesIndia,
      institutesInternational: f.institutesInternational, careerLadder: f.careerLadder,
      topJobs: jobs, fields: picked,
    }
    try {
      if (course) await api(`/admin/career-library/courses/${course.id}`, { method: 'PATCH', auth: 'admin', body })
      else await api('/admin/career-library/courses', { method: 'POST', auth: 'admin', body: { ...body, slug: f.slug } })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  if (loading) return <p className="adm-empty">Loading course…</p>

  return (
    <div>
      <button className="adm-link" style={{ padding: 0, marginBottom: 8 }} onClick={onCancel}>← Back to all courses</button>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{course ? `Edit ${course.name}` : 'New course'}</h2>
      <p className="adm-sub">Everything on the public course page. List fields take one item per line.</p>

      <div className="adm-panel">
        <div className="adm-row2">
          <div className="adm-field"><label>Name</label>
            <input className="adm-input" value={f.name} onChange={(e) => onName(e.target.value)} placeholder="Chartered Accountancy" /></div>
          <div className="adm-field"><label>Slug — the URL: /career-library/<em>{f.slug || '…'}</em></label>
            <input className="adm-input" value={f.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></div>
        </div>

        <div className="adm-field">
          <label>Streams this course belongs to</label>
          {fields.length === 0 ? (
            <p className="adm-sub" style={{ margin: 0 }}>No streams yet — create one on the Streams tab first.</p>
          ) : (
            <div className="adm-checks">
              {fields.map((s) => (
                <label key={s.slug} className="adm-check">
                  <input type="checkbox" checked={picked.includes(s.slug)} onChange={() => toggleField(s.slug)} />
                  {s.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="adm-field"><label>Overview — the intro under the page title</label>
          <textarea className="adm-textarea" rows={4} value={f.overview} onChange={(e) => set('overview', e.target.value)} /></div>

        <div className="adm-field"><label>Qualities you'll need (one per line)</label>
          <textarea className="adm-textarea" rows={4} value={f.topQualities} onChange={(e) => set('topQualities', e.target.value)}
                    placeholder={'Attention to detail\nAnalytical thinking'} /></div>

        {/* ---- jobs ---- */}
        <div className="adm-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Careers &amp; salaries</label>
            <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={addJob}>+ Add career</button>
          </div>
          {jobs.length === 0 && <p className="adm-sub" style={{ margin: '6px 0 0' }}>None yet — the section is hidden on the site.</p>}
          {jobs.map((j, i) => (
            <div key={i} className="adm-subpanel">
              <div className="adm-row2">
                <div className="adm-field"><label>Role</label>
                  <input className="adm-input" value={j.role} onChange={(e) => setJob(i, 'role', e.target.value)} placeholder="Statutory Auditor" /></div>
                <div className="adm-field" style={{ alignSelf: 'end', paddingBottom: 10 }}>
                  <button className="adm-link" style={{ color: 'var(--color-danger)', padding: 0 }} onClick={() => removeJob(i)}>Remove</button>
                </div>
              </div>
              <div className="adm-field"><label>Description</label>
                <textarea className="adm-textarea" rows={2} value={j.description} onChange={(e) => setJob(i, 'description', e.target.value)} /></div>
              <div className="adm-row2">
                <div className="adm-field"><label>India salary</label>
                  <input className="adm-input" value={j.indiaSalary} onChange={(e) => setJob(i, 'indiaSalary', e.target.value)} placeholder="₹7–12 LPA" /></div>
                <div className="adm-field"><label>Global salary</label>
                  <input className="adm-input" value={j.globalSalary} onChange={(e) => setJob(i, 'globalSalary', e.target.value)} placeholder="$60–90k" /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="adm-row2">
          <div className="adm-field"><label>Top institutes — India (one per line)</label>
            <textarea className="adm-textarea" rows={5} value={f.institutesIndia} onChange={(e) => set('institutesIndia', e.target.value)} /></div>
          <div className="adm-field"><label>Top institutes — International (one per line)</label>
            <textarea className="adm-textarea" rows={5} value={f.institutesInternational} onChange={(e) => set('institutesInternational', e.target.value)} /></div>
        </div>

        <div className="adm-field"><label>Career ladder — one step per line, in order</label>
          <textarea className="adm-textarea" rows={5} value={f.careerLadder} onChange={(e) => set('careerLadder', e.target.value)}
                    placeholder={'Articleship\nAssociate\nManager\nPartner'} /></div>

        <div className="adm-row2">
          <div className="adm-field"><label>Original URL (optional — for migrated pages)</label>
            <input className="adm-input" value={f.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} /></div>
          <div className="adm-field" style={{ alignSelf: 'end', paddingBottom: 10 }}>
            <label style={{ display: 'inline', fontSize: 14, fontWeight: 400, color: 'inherit' }}>
              <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Visible on site
            </label>
          </div>
        </div>

        {err && <p className="adm-error">{err}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="adm-btn" onClick={save} disabled={busy || !f.name.trim() || !f.slug}>
            {busy ? 'Saving…' : course ? 'Save changes' : 'Create course'}
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
