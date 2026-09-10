import { useEffect, useState } from 'react'
import { api, apiUpload } from '../../../api/client.js'
import { fetchUploadMode, uploadDirectToS3, uploadThroughServer, awaitTranscode } from '../../../api/videoUpload.js'
import '../adminShared.css'

const TIER_LABEL = { 1: 'Discover+', 2: 'Clarity+', 3: 'Launch' }

// "2m 5s" style countdown for the upload / processing estimate.
const fmtLeft = (ms) => {
  const s = Math.max(1, Math.round(ms / 1000))
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
}
// Sessions come back from the API with `_id` (no `id`). One helper so every
// place agrees on the identifier.
const sidOf = (s) => s?._id || s?.id || null
const blank = { order: '', tier: 1, title: '', description: '', videoUrl: '', durationMins: '', worksheetTitle: '', tasks: '', notes: '' }

// Timestamped notes are edited as "M:SS  note text" (one per line).
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const fmtNotes = (notes) => (notes || []).map((n) => `${fmtTime(n.time)} ${n.text}`).join('\n')
const parseNotes = (text) =>
  String(text || '').split('\n').map((line) => {
    const t = line.trim()
    let m = t.match(/^(\d+):(\d{2})\s+(.+)$/) // M:SS text
    if (m) return { time: +m[1] * 60 + +m[2], text: m[3].trim() }
    m = t.match(/^(\d+)\s+(.+)$/) // plain seconds text
    if (m) return { time: +m[1], text: m[2].trim() }
    return null
  }).filter(Boolean)

export default function AdminContent() {
  const [builds, setBuilds] = useState([])
  const [slug, setSlug] = useState('')
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // session id | 'new' | null
  const [qEditing, setQEditing] = useState(null) // session id whose questions are open
  const [aViewing, setAViewing] = useState(null) // session id whose ANSWERS are open
  const [capEditing, setCapEditing] = useState(null) // session id whose CAPTIONS are open

  useEffect(() => {
    api('/admin/skill-builds', { auth: 'admin' })
      .then((d) => { setBuilds(d.skillBuilds); if (d.skillBuilds[0]) setSlug(d.skillBuilds[0].slug) })
      .catch((e) => setError(e.message))
  }, [])

  const load = (s = slug) =>
    api(`/admin/skill-builds/${s}/sessions`, { auth: 'admin' })
      .then((d) => setSessions(d.sessions || []))
      .catch((e) => setError(e.message))

  useEffect(() => { if (slug) { setSessions(null); setEditing(null); setQEditing(null); setCapEditing(null); load(slug) } /* eslint-disable-next-line */ }, [slug])

  const del = async (id) => {
    if (!confirm('Delete this session?')) return
    await api(`/admin/sessions/${id}`, { method: 'DELETE', auth: 'admin' })
    load()
  }

  return (
    <div>
      <h1 className="adm-title">Course content</h1>
      <p className="adm-sub">Manage sessions — videos, worksheets and which tier unlocks each one.</p>

      <div className="adm-toolbar">
        <select className="adm-select" style={{ width: 220 }} value={slug} onChange={(e) => setSlug(e.target.value)}>
          {builds.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
        <button className="adm-btn" onClick={() => setEditing('new')}>+ Add session</button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {editing === 'new' && (
        <div className="adm-panel">
          <SessionForm slug={slug} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
        </div>
      )}

      {!sessions ? <p className="adm-empty">Loading…</p> : sessions.length === 0 ? (
        <p className="adm-empty">No sessions yet. Add one above.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>#</th><th>Title</th><th>Tier</th><th>Duration</th><th>Video</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s, i) => {
                const sid = sidOf(s)
                // The `sid &&` guard matters: without an id, `editing === sid`
                // would be true for EVERY row and open all the forms at once.
                const isEdit = !!sid && editing === sid
                const isQ = !!sid && qEditing === sid
                const isA = !!sid && aViewing === sid
                const isC = !!sid && capEditing === sid
                const key = sid || `row-${i}`

                if (isEdit) {
                  return (
                    <tr key={key}><td colSpan={6}>
                      <SessionForm slug={slug} session={s} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
                    </td></tr>
                  )
                }
                if (isQ) {
                  return (
                    <tr key={key}><td colSpan={6}>
                      <QuestionsEditor session={s} onClose={() => setQEditing(null)} />
                    </td></tr>
                  )
                }
                if (isA) {
                  return (
                    <tr key={key}><td colSpan={6}>
                      <AnswersViewer session={s} onClose={() => setAViewing(null)} />
                    </td></tr>
                  )
                }
                if (isC) {
                  return (
                    <tr key={key}><td colSpan={6}>
                      <CaptionsEditor session={s} onClose={() => setCapEditing(null)} onChanged={() => load()} />
                    </td></tr>
                  )
                }
                return (
                  <tr key={key}>
                    <td className="adm-num">{s.order}</td>
                    <td>{s.title}{!s.active && <span className="adm-badge adm-badge--muted" style={{ marginLeft: 6 }}>Hidden</span>}</td>
                    <td><span className="adm-badge adm-badge--muted">{TIER_LABEL[s.tier] || s.tier}</span></td>
                    <td className="adm-num">{s.durationMins}m</td>
                    <td>{s.videoUrl ? <a className="adm-link" href={s.videoUrl} target="_blank" rel="noreferrer">video ↗</a> : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="adm-link" onClick={() => setEditing(sid)}>Edit</button>
                      <button className="adm-link" onClick={() => setQEditing(sid)}>Questions</button>
                      <button className="adm-link" onClick={() => setCapEditing(sid)}>
                        Captions{s.captions?.length ? ` (${s.captions.length})` : ''}
                      </button>
                      <button className="adm-link" onClick={() => setAViewing(sid)}>Answers</button>
                      <button className="adm-link" style={{ color: 'var(--color-danger)' }} onClick={() => del(sid)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SessionForm({ slug, session, onCancel, onSaved }) {
  const init = session
    ? { order: session.order, tier: session.tier, title: session.title, description: session.description,
        videoUrl: session.videoUrl, durationMins: session.durationMins,
        worksheetTitle: session.worksheet?.title || '', tasks: (session.worksheet?.tasks || []).join('\n'),
        notes: fmtNotes(session.notes) }
    : blank
  const [f, setF] = useState(init)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [phase, setPhase] = useState('')   // 'upload' | 'process'
  const [pct, setPct] = useState(0)
  const [eta, setEta] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  // Read a video's duration (minutes) from its metadata — works for a local
  // File (object URL) or a remote URL. Cross-origin URLs are fine (duration
  // doesn't need CORS).
  const detectDuration = (src) =>
    new Promise((resolve) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => {
        const mins = Number.isFinite(v.duration) ? Math.max(1, Math.round(v.duration / 60)) : null
        if (v.src.startsWith('blob:')) URL.revokeObjectURL(v.src)
        resolve(mins)
      }
      v.onerror = () => resolve(null)
      v.src = typeof src === 'string' ? src : URL.createObjectURL(src)
    })

  const autofillDuration = async (src) => {
    const mins = await detectDuration(src)
    if (mins) set('durationMins', mins)
  }

  const onFile = async (file) => {
    if (!file) return
    setErr(''); setUploadMsg(''); setUploading(true)
    setPhase('upload'); setPct(0); setEta('')
    autofillDuration(file) // detect from the local file immediately

    try {
      // Which path this deployment uses. On AWS the browser sends the file
      // straight to S3, because CloudFront allows an origin only 60 seconds to
      // respond and a large video cannot travel through it at all. On a dev box
      // it still goes through the API, exactly as before.
      const { mode, partSize } = await fetchUploadMode().catch(() => ({ mode: 'server' }))

      let jobId
      if (mode === 's3') {
        const done = await uploadDirectToS3(file, {
          partSize,
          onProgress: (p) => { setPct(p); if (p >= 100) setPhase('process') },
        })
        jobId = done.jobId
      } else {
        // The server keys the job by an id we choose, so polling can start
        // before the upload request has returned.
        jobId = Math.random().toString(36).slice(2) + Date.now().toString(36)
        await uploadThroughServer(file, {
          uploadId: jobId,
          onProgress: (p) => { setPct(p); if (p >= 100) setPhase('process') },
        })
      }

      // Bytes are stored either way; building the adaptive ladder is the longer
      // job, and it runs behind the request that started it.
      setPhase('process')
      const { url, type, durationMins, warning } = await awaitTranscode(jobId, {
        onProgress: (s) => {
          setPct(s.pct || 0)
          if (s.pct > 3 && s.elapsedMs) {
            const remaining = (s.elapsedMs / s.pct) * (100 - s.pct)
            setEta(remaining > 1000 ? `~${fmtLeft(remaining)} left` : 'almost done')
          }
        },
      })

      set('videoUrl', url)
      if (durationMins) setF((p) => (p.durationMins ? p : { ...p, durationMins }))
      setUploadMsg(
        type === 'hls'
          ? 'Video ready ✓ — adaptive quality (smooth on slow networks)'
          : `Uploaded ✓ — original quality${warning ? ' (adaptive processing unavailable)' : ''}`,
      )
    } catch (e) {
      setErr(e.message)
    } finally {
      setUploading(false)
      setPct(0); setEta(''); setPhase('')
    }
  }

  const save = async () => {
    if (!f.title.trim()) return setErr('Title is required')
    setBusy(true); setErr('')
    const body = {
      order: Number(f.order) || 1, tier: Number(f.tier) || 1,
      title: f.title, description: f.description, videoUrl: f.videoUrl,
      durationMins: Number(f.durationMins) || 0,
      worksheet: { title: f.worksheetTitle, tasks: f.tasks.split('\n').map((t) => t.trim()).filter(Boolean) },
      notes: parseNotes(f.notes),
    }
    try {
      const sid = session?.id || session?._id
      if (session && !sid) throw new Error('This session has no id — reload the page and try again')
      if (session) await api(`/admin/sessions/${sid}`, { method: 'PATCH', auth: 'admin', body })
      else await api(`/admin/skill-builds/${slug}/sessions`, { method: 'POST', auth: 'admin', body })
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>{session ? 'Edit session' : 'New session'}</h3>
      <div className="adm-row2">
        <div className="adm-field"><label>Order</label><input className="adm-input adm-num" type="number" value={f.order} onChange={(e) => set('order', e.target.value)} /></div>
        <div className="adm-field"><label>Tier (1 Discover / 2 Clarity / 3 Launch)</label>
          <select className="adm-select" value={f.tier} onChange={(e) => set('tier', e.target.value)}>
            <option value={1}>1 — Discover+</option><option value={2}>2 — Clarity+</option><option value={3}>3 — Launch</option>
          </select></div>
      </div>
      <div className="adm-field"><label>Title</label><input className="adm-input" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="adm-field"><label>Description</label><textarea className="adm-textarea" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></div>
      <div className="adm-field">
        <label>Video — paste a URL or upload a file</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="adm-input" style={{ flex: 1, minWidth: 240 }} value={f.videoUrl}
                 onChange={(e) => set('videoUrl', e.target.value)}
                 onBlur={() => { if (f.videoUrl && !f.durationMins) autofillDuration(f.videoUrl) }}
                 placeholder="https://…/video.mp4" />
          <label className="adm-btn adm-btn--ghost" style={{ cursor: uploading ? 'default' : 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
            {uploading ? 'Processing…' : '⤒ Upload'}
            <input type="file" accept="video/*" hidden disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        {uploading && (
          <div className="adm-progress">
            <div className="adm-progress-track"><span style={{ width: `${pct}%` }} /></div>
            <p className="adm-progress-label">
              {phase === 'upload'
                ? `Uploading… ${pct}%`
                : `Processing video ${pct}% — building quality versions (144p → source max)`}
              {eta && phase === 'process' ? ` · ${eta}` : ''}
            </p>
          </div>
        )}
        {uploadMsg && <p className="adm-ok" style={{ margin: '6px 0 0' }}>{uploadMsg}</p>}
      </div>
      <div className="adm-field" style={{ maxWidth: 240 }}>
        <label>Duration (mins) — auto-filled from the video</label>
        <input className="adm-input adm-num" type="number" value={f.durationMins} onChange={(e) => set('durationMins', e.target.value)} />
      </div>
      <div className="adm-field"><label>Worksheet title</label><input className="adm-input" value={f.worksheetTitle} onChange={(e) => set('worksheetTitle', e.target.value)} /></div>
      <div className="adm-field"><label>Worksheet tasks (one per line)</label><textarea className="adm-textarea" rows={3} value={f.tasks} onChange={(e) => set('tasks', e.target.value)} /></div>
      <div className="adm-field">
        <label>Video notes — one per line as <code>M:SS note text</code> (e.g. <code>1:30 RIASEC explained</code>)</label>
        <textarea className="adm-textarea" rows={4} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder={'0:15 Intro\n1:30 Key concept\n3:05 Example'} />
      </div>
      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Saving mid-upload would store the OLD video URL — the new one only
            arrives when processing finishes. So block Save until it's done. */}
        <button className="adm-btn" onClick={save} disabled={busy || uploading}>
          {busy ? 'Saving…' : uploading ? 'Processing video…' : 'Save session'}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        {uploading && <span className="adm-sub" style={{ margin: 0 }}>Please wait — the video is still processing.</span>}
      </div>
    </div>
  )
}

// Edit the 6 post-video questions for a session. Students answer these one per
// day after watching the video (text answers, stored — not graded).
function QuestionsEditor({ session, onClose }) {
  const sid = session.id || session._id
  const [prompts, setPrompts] = useState(['', '', '', '', '', ''])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api(`/admin/sessions/${sid}/questions`, { auth: 'admin' })
      .then((d) => {
        const arr = ['', '', '', '', '', '']
        d.questions.forEach((q) => { if (q.order >= 1 && q.order <= 6) arr[q.order - 1] = q.prompt })
        setPrompts(arr)
      })
      .catch((e) => setErr(e.message))
  }, [sid])

  const setAt = (i, v) => setPrompts((p) => p.map((x, idx) => (idx === i ? v : x)))

  const save = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      await api(`/admin/sessions/${sid}/questions`, { method: 'PUT', auth: 'admin', body: { prompts } })
      setMsg('Questions saved ✓')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Questions — {session.title}</h3>
      <p className="adm-sub" style={{ marginBottom: 12 }}>Up to 6. Students answer one per day after watching the video. Leave blank to skip.</p>
      {prompts.map((p, i) => (
        <div className="adm-field" key={i}>
          <label>Question {i + 1}</label>
          <textarea className="adm-textarea" rows={2} value={p} onChange={(e) => setAt(i, e.target.value)} placeholder={`Question ${i + 1}…`} />
        </div>
      ))}
      {err && <p className="adm-error">{err}</p>}
      {msg && <p className="adm-ok">{msg}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="adm-btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save questions'}</button>
        <button className="adm-btn adm-btn--ghost" onClick={onClose} disabled={busy}>Close</button>
      </div>
    </div>
  )
}

// Read-only view of every student's answers for a session, grouped by question.
function AnswersViewer({ session, onClose }) {
  const sid = session.id || session._id
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api(`/admin/sessions/${sid}/answers`, { auth: 'admin' })
      .then(setData)
      .catch((e) => setErr(e.message))
  }, [sid])

  const fmt = (iso) =>
    new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Answers — {session.title}</h3>
      {err && <p className="adm-error">{err}</p>}
      {!data ? (
        <p className="adm-empty">Loading…</p>
      ) : data.totalAnswers === 0 ? (
        <p className="adm-empty">No answers submitted yet for this session.</p>
      ) : (
        <>
          <p className="adm-sub" style={{ marginBottom: 12 }}>{data.totalAnswers} answer(s) across {data.questions.length} question(s).</p>
          {data.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Q{q.order}. {q.prompt}</p>
              {q.answers.length === 0 ? (
                <p className="adm-sub" style={{ margin: '0 0 0 14px' }}>— no answers yet</p>
              ) : (
                q.answers.map((a, i) => (
                  <div key={i} style={{ margin: '0 0 8px 14px', padding: '8px 12px', background: 'var(--gray-50, #f9fafb)', borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted, #6b7280)', marginBottom: 3 }}>
                      <strong>{a.student.name}</strong>{a.student.email ? ` · ${a.student.email}` : ''} · {fmt(a.submittedAt)}
                    </p>
                    <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{a.text}</p>
                  </div>
                ))
              )}
            </div>
          ))}
        </>
      )}
      <button className="adm-btn adm-btn--ghost" onClick={onClose}>Close</button>
    </div>
  )
}

// ---- Captions: upload SRT/VTT per language, delete ---------------------------
const LANGS = [
  // The course is spoken in Hinglish, so its own track is tagged hi-latn -
  // romanized Hindi. That leaves plain 'hi' free for a real Devanagari track.
  { v: 'hi-latn', label: 'Hinglish' },
  { v: 'hi', label: 'Hindi' }, { v: 'en', label: 'English' },
  { v: 'mr', label: 'Marathi' }, { v: 'gu', label: 'Gujarati' },
  { v: 'ta', label: 'Tamil' }, { v: 'te', label: 'Telugu' },
  { v: 'bn', label: 'Bengali' }, { v: 'kn', label: 'Kannada' },
]
const langLabel = (v) => LANGS.find((l) => l.v === v)?.label || v.toUpperCase()

function CaptionsEditor({ session, onClose, onChanged }) {
  const sid = sidOf(session)
  const [tracks, setTracks] = useState(session.captions || [])
  const [lang, setLang] = useState('hi-latn')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async () => {
    if (!file) { setError('Pick a .srt or .vtt file'); return }
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('lang', lang)
      fd.append('label', langLabel(lang))
      const d = await apiUpload(`/admin/sessions/${sid}/captions`, fd, { auth: 'admin' })
      setTracks(d.captions); setFile(null); onChanged?.()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const remove = async (l) => {
    if (!confirm(`Remove ${langLabel(l)} captions?`)) return
    setBusy(true); setError('')
    try {
      const d = await api(`/admin/sessions/${sid}/captions/${l}`, { method: 'DELETE', auth: 'admin' })
      setTracks(d.captions); onChanged?.()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 8 }}>Captions — {session.title}</h3>
      <p className="adm-sub" style={{ marginBottom: 12 }}>
        Upload a <strong>.srt</strong> (or .vtt) per language — we convert to WebVTT and keep the exact
        timings, so captions stay in sync. Students pick the language in the player.
      </p>

      {tracks.length === 0 ? (
        <p className="adm-empty">No captions yet.</p>
      ) : (
        <div className="adm-table-wrap" style={{ marginBottom: 12 }}>
          <table className="adm-table">
            <thead><tr><th>Language</th><th>File</th><th></th></tr></thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.lang}>
                  <td>{t.label} <span className="adm-sub">({t.lang})</span></td>
                  <td><a className="adm-link" href={t.url} target="_blank" rel="noreferrer">view ↗</a></td>
                  <td><button className="adm-link" style={{ color: 'var(--color-danger)' }} disabled={busy} onClick={() => remove(t.lang)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="adm-select" style={{ width: 130 }} value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
        </select>
        <input type="file" accept=".srt,.vtt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="adm-btn" disabled={busy || !file} onClick={upload}>{busy ? 'Uploading…' : 'Upload captions'}</button>
      </div>

      {error && <p className="adm-error">{error}</p>}
      <button className="adm-btn adm-btn--ghost" style={{ marginTop: 12 }} onClick={onClose}>Close</button>
    </div>
  )
}
