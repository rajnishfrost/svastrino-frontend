import { Fragment, useCallback, useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import './AdminEnquiries.css'

/**
 * Everyone who has written in — the Contact page, the home-page banner, and the
 * "talk to an expert" form on the Breakthrough page all land here.
 *
 * Approving an expert-call request is not just book-keeping: until it is
 * approved the checkout refuses that program, so this page is where a
 * Breakthrough sale is actually unlocked after the call.
 */
const SOURCES = [
  { value: '', label: 'All forms' },
  { value: 'expert-call', label: 'Expert call requests' },
  { value: 'contact', label: 'Contact page' },
  { value: 'home', label: 'Home page banner' },
]

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'approved', label: 'Approved to pay' },
  { value: 'closed', label: 'Closed' },
]

const SOURCE_LABEL = {
  'expert-call': 'Expert call',
  contact: 'Contact page',
  home: 'Home banner',
}

const when = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

export default function AdminEnquiries() {
  const [rows, setRows] = useState(null)
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [openId, setOpenId] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(() => {
    const qs = new URLSearchParams()
    if (source) qs.set('source', source)
    if (status) qs.set('status', status)
    setError('')
    api(`/admin/enquiries${qs.toString() ? `?${qs}` : ''}`, { auth: 'admin' })
      .then((d) => setRows(d.enquiries))
      .catch((e) => setError(e.message))
  }, [source, status])

  useEffect(() => { load() }, [load])

  const patch = async (id, body) => {
    setBusyId(id); setError('')
    try {
      const d = await api(`/admin/enquiries/${id}`, { method: 'PATCH', auth: 'admin', body })
      setRows((list) => list.map((r) => (r.id === id ? d.enquiry : r)))
    } catch (ex) {
      setError(ex.message)
    } finally {
      setBusyId('')
    }
  }

  const openNotes = (row) => {
    setOpenId(row.id === openId ? '' : row.id)
    setNote(row.notes || '')
  }

  return (
    <>
      <h1 className="adm-title">Enquiries</h1>
      <p className="adm-sub">
        Everyone who has written in. Approving an expert-call request is what
        opens the checkout for that program.
      </p>

      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 200 }} value={source}
                onChange={(e) => setSource(e.target.value)} aria-label="Filter by form">
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="adm-select" style={{ width: 180 }} value={status}
                onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {rows == null ? (
        <p className="adm-empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="adm-empty">Nothing here yet.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table enq-table">
            <thead>
              <tr>
                <th>Who</th>
                <th>Form</th>
                <th>What they said</th>
                <th>Received</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td>
                      <strong>{r.name}</strong>
                      <div className="enq-contact">
                        {r.phone && <a href={`tel:${r.phone}`}>{r.phone}</a>}
                        {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                        {r.city && <span>{r.city}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`enq-tag enq-${r.source}`}>{SOURCE_LABEL[r.source] || r.source}</span>
                      {r.program && <div className="enq-meta">{r.program}</div>}
                      {r.studentClass && <div className="enq-meta">{r.studentClass}</div>}
                    </td>
                    <td className="enq-msg">
                      {r.message || '—'}
                      {r.preferredTime && <div className="enq-meta">Call: {r.preferredTime}</div>}
                    </td>
                    <td className="enq-when">{when(r.createdAt)}</td>
                    <td>
                      <select
                        className="adm-select enq-status"
                        value={r.status}
                        disabled={busyId === r.id}
                        onChange={(e) => patch(r.id, { status: e.target.value })}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="approved">Approved to pay</option>
                        <option value="closed">Closed</option>
                      </select>
                      {r.status === 'approved' && r.approvedAt && (
                        <div className="enq-meta">Approved {when(r.approvedAt)}</div>
                      )}
                    </td>
                    <td className="enq-actions">
                      {r.source === 'expert-call' && r.status !== 'approved' && (
                        <button
                          className="adm-btn adm-btn--sm"
                          disabled={busyId === r.id}
                          onClick={() => patch(r.id, { status: 'approved' })}
                          title="Opens the checkout for this program and emails them the booking link"
                        >
                          Approve to pay
                        </button>
                      )}
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openNotes(r)}>
                        {openId === r.id ? 'Close' : 'Notes'}
                      </button>
                    </td>
                  </tr>

                  {openId === r.id && (
                    <tr className="enq-note-row">
                      <td colSpan={6}>
                        <label className="adm-label" htmlFor={`note-${r.id}`}>Internal note</label>
                        <textarea
                          id={`note-${r.id}`}
                          className="adm-textarea"
                          rows={3}
                          value={note}
                          maxLength={2000}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="What happened on the call, what they need, what to do next…"
                        />
                        <button
                          className="adm-btn adm-btn--sm"
                          disabled={busyId === r.id}
                          onClick={() => patch(r.id, { notes: note }).then(() => setOpenId(''))}
                        >
                          Save note
                        </button>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
