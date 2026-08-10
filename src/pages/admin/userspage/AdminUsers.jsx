import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'

// One account system: every person is one account with one role (managed on the
// Roles page). Only superadmin, or a role that grants ≥1 module, can enter the panel.
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : 'never'

// The `organisation` role is special: the account must OWN an Organisation
// record (that's what the /organisation portal resolves from), so picking it
// here also asks for the organisation's own details. Mirrors ORG_TYPES server-side.
const ORG_ROLE = 'organisation'
const ORG_TYPES = [
  { v: 'school', label: 'School' },
  { v: 'college', label: 'College' },
  { v: 'village', label: 'Village / Panchayat' },
  { v: 'ngo', label: 'NGO / Trust' },
  { v: 'coaching', label: 'Coaching centre' },
  { v: 'corporate', label: 'Corporate' },
  { v: 'other', label: 'Other' },
]
const BLANK_ORG = {
  name: '', type: 'school', description: '', branch: '', address: '',
  city: '', state: '', pincode: '', website: '', contactPerson: '', phone: '',
  publicListed: true,
}

// Red-outline an input that failed validation, and print the reason under it.
const inputCls = (err) => `adm-input${err ? ' adm-input--err' : ''}`
const FieldError = ({ msg }) =>
  msg ? <span className="adm-field-err">{msg}</span> : null

export default function AdminUsers() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    api('/admin/auth/me', { auth: 'admin' }).then((d) => setMe(d.admin)).catch(() => setMe({ role: 'admin' }))
  }, [])

  return (
    <div>
      <h1 className="adm-title">Users</h1>
      <p className="adm-sub">
        One account list for everyone — site users and panel admins. Each account has a single
        role (defined on the Roles page); only superadmin or a module-granting role can sign in here.
      </p>
      {me && <Accounts me={me} />}
    </div>
  )
}

function Accounts({ me }) {
  const isSuper = me.role === 'superadmin'
  const [users, setUsers] = useState(null)
  const [roles, setRoles] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [editing, setEditing] = useState(null) // account object
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadList = (search = '') =>
    api(`/admin/users${search ? `?q=${encodeURIComponent(search)}` : ''}`, { auth: 'admin' })
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))

  const load = () => {
    loadList(q)
    if (isSuper) api('/admin/roles', { auth: 'admin' }).then((d) => setRoles(d.roles)).catch(() => {})
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const roleMap = Object.fromEntries(roles.map((r) => [r.key, r]))
  const tone = (key) => (key === 'superadmin' ? 'warn' : roleMap[key]?.panel ? 'ok' : 'muted')
  const label = (key) => roleMap[key]?.name || key

  const changeRole = async (id, role) => {
    setSavingId(id); setError('')
    try {
      const { user } = await api(`/admin/users/${id}/role`, { method: 'PATCH', auth: 'admin', body: { role } })
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: user.role } : u)))
    } catch (e) { setError(e.message); loadList(q) } finally { setSavingId(null) }
  }

  const removeAccount = async (u) => {
    if (!window.confirm(`Delete ${u.name || u.email}? This permanently removes the account and cannot be undone.`)) return
    setDeletingId(u.id); setError('')
    try {
      await api(`/admin/admins/${u.id}`, { method: 'DELETE', auth: 'admin' })
      setUsers((list) => list.filter((x) => x.id !== u.id))
    } catch (e) { setError(e.message) } finally { setDeletingId(null) }
  }

  // Options for the inline dropdown — always keep the row's current role visible.
  const optionsFor = (current) => {
    const opts = roles.map((r) => ({ v: r.key, label: r.name }))
    return opts.some((o) => o.v === current) ? opts : [{ v: current, label: current }, ...opts]
  }

  return (
    <section>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
        <input className="adm-input" style={{ maxWidth: 280 }} placeholder="Search name or email"
               value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList(q)} />
        <button className="adm-btn adm-btn--ghost" onClick={() => loadList(q)}>Search</button>
        {isSuper && (
          <button className="adm-btn adm-btn--sm" style={{ marginLeft: 'auto' }}
                  onClick={() => { setEditing(null); setAdding((v) => !v) }}>+ New account</button>
        )}
      </div>

      {(adding || editing) && isSuper && (
        <div className="adm-panel">
          <AccountForm account={editing} roles={roles} isSelf={editing && me.id === editing.id}
                       onCancel={() => { setAdding(false); setEditing(null) }}
                       onSaved={() => { setAdding(false); setEditing(null); load() }} />
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
      {!users ? <p className="adm-empty">Loading…</p> : users.length === 0 ? (
        <p className="adm-empty">No accounts found.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Verified</th><th>Role</th><th>Access</th>{isSuper && <th></th>}</tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || '—'}{me.id === u.id && <span className="adm-sub" style={{ fontWeight: 400 }}> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td>{u.emailVerified
                    ? <span className="adm-badge adm-badge--ok">Yes</span>
                    : <span className="adm-badge adm-badge--warn">No</span>}</td>
                  <td>
                    {isSuper && roles.length && me.id !== u.id ? (
                      <select className="adm-select" style={{ width: 160 }} value={u.role} disabled={savingId === u.id}
                              onChange={(e) => changeRole(u.id, e.target.value)}>
                        {optionsFor(u.role).map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    ) : (
                      <span className={`adm-badge adm-badge--${tone(u.role)}`}>{label(u.role)}</span>
                    )}
                  </td>
                  <td>
                    {u.active === false
                      ? <span className="adm-badge adm-badge--muted">Disabled</span>
                      : u.role === 'superadmin'
                        ? <span className="adm-badge adm-badge--ok">All modules</span>
                        : roleMap[u.role]?.panel
                          ? <span className="adm-badge adm-badge--ok">Panel access</span>
                          : <span className="adm-sub" style={{ margin: 0 }}>Site account</span>}
                  </td>
                  {isSuper && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm"
                                onClick={() => { setAdding(false); setEditing(u) }}>Edit</button>
                        {me.id !== u.id && (
                          <button className="adm-btn adm-btn--ghost adm-btn--sm"
                                  style={{ color: 'var(--color-danger, #b3261e)' }}
                                  disabled={deletingId === u.id}
                                  onClick={() => removeAccount(u)}>
                            {deletingId === u.id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/** Create (no `account`) or edit any account. Superadmin only. */
function AccountForm({ account, roles, isSelf, onCancel, onSaved }) {
  const isNew = !account
  const [f, setF] = useState({
    name: account?.name || '', email: account?.email || '', password: '',
    role: account?.role || 'student',
    active: account ? account.active !== false : true,
  })
  const [org, setOrg] = useState(BLANK_ORG)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [tried, setTried] = useState(false) // has submit been attempted?
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const setOrgField = (k, v) => setOrg((p) => ({ ...p, [k]: v }))
  const selected = roles.find((r) => r.key === f.role)

  // Only ask for organisation details when we'd actually be creating one — i.e.
  // the role is changing TO organisation. An account that already owns one keeps
  // its details on the Scholarship page (and in its own portal).
  const needsOrg = f.role === ORG_ROLE && account?.role !== ORG_ROLE

  // What's wrong, per field. The button stays clickable and submitting shows
  // these — a greyed-out button tells you nothing, and a 7-character password
  // looks exactly like a valid one behind the dots.
  const problems = {
    name: !f.name.trim() ? 'Enter a name.' : '',
    email: isNew && !f.email.trim() ? 'Enter an email address.' : '',
    password: isNew && f.password.length < 8
      ? `Password must be at least 8 characters — this one has ${f.password.length}.`
      : '',
    orgName: needsOrg && !org.name.trim() ? 'Enter the organisation’s name.' : '',
  }
  const problemList = Object.values(problems).filter(Boolean)
  // Field errors only appear after a submit attempt, so the form doesn't shout
  // at you while you're still filling it in.
  const fieldErr = (k) => (tried ? problems[k] : '')

  // Keep the account's current role selectable even if it no longer exists as a role.
  const roleOpts = roles.some((r) => r.key === f.role) ? roles.map((r) => ({ v: r.key, label: r.name }))
    : [{ v: f.role, label: f.role }, ...roles.map((r) => ({ v: r.key, label: r.name }))]

  const save = async () => {
    setTried(true)
    if (problemList.length) {
      setErr(problemList.length === 1 ? problemList[0] : `Fix ${problemList.length} fields below.`)
      return
    }
    setBusy(true); setErr('')
    try {
      // The organisation's contact email defaults to the login email unless the
      // admin overrode it — one less field to retype in the common case.
      const orgBody = needsOrg ? { organisation: { ...org, email: org.email || f.email } } : {}
      if (isNew) {
        await api('/admin/admins', {
          method: 'POST', auth: 'admin',
          body: { name: f.name, email: f.email, password: f.password, role: f.role, ...orgBody },
        })
      } else {
        await api(`/admin/admins/${account.id}`, {
          method: 'PATCH', auth: 'admin',
          body: {
            name: f.name, role: f.role, active: f.active,
            ...(f.password ? { password: f.password } : {}),
            ...orgBody,
          },
        })
      }
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{isNew ? 'New account' : `Edit ${account.name || account.email}`}</h2>
      <div className="adm-row2">
        <div className="adm-field">
          <label>Name</label>
          <input className={inputCls(fieldErr('name'))} value={f.name} onChange={(e) => set('name', e.target.value)} />
          <FieldError msg={fieldErr('name')} />
        </div>
        <div className="adm-field">
          <label>Email {isNew ? '' : '(fixed)'}</label>
          <input className={inputCls(fieldErr('email'))} type="email" value={f.email} disabled={!isNew} onChange={(e) => set('email', e.target.value)} />
          <FieldError msg={fieldErr('email')} />
        </div>
      </div>
      <div className="adm-row2">
        <div className="adm-field">
          <label>{isNew ? 'Password (min 8 chars)' : 'New password (blank = unchanged)'}</label>
          <input className={inputCls(fieldErr('password'))} type="password" value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
          <FieldError msg={fieldErr('password')} />
        </div>
        <div className="adm-field">
          <label>Role</label>
          <select className="adm-select" value={f.role} disabled={isSelf} onChange={(e) => set('role', e.target.value)}>
            {roleOpts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {f.role === 'superadmin'
        ? <p className="adm-sub" style={{ marginTop: 4 }}>Full access to everything, including managing accounts &amp; roles.</p>
        : f.role === ORG_ROLE
          ? <p className="adm-sub" style={{ marginTop: 4 }}>Partner organisation — no admin panel. Signs in to the <strong>/organisation</strong> portal to add students and run its scholarship.</p>
          : selected?.panel
            ? <p className="adm-sub" style={{ marginTop: 4 }}>Panel access to this role’s modules — edit them on the Roles page.</p>
            : <p className="adm-sub" style={{ marginTop: 4 }}>Site account — no panel access unless this role is given modules on the Roles page.</p>}

      {needsOrg && <OrgFields org={org} set={setOrgField} loginEmail={f.email} nameErr={fieldErr('orgName')} />}
      {f.role === ORG_ROLE && account?.role === ORG_ROLE && (
        <p className="adm-sub" style={{ marginTop: 4 }}>
          Edit this organisation’s name, address and access on the <strong>Scholarship → Organisations</strong> page.
        </p>
      )}

      {!isNew && !isSelf && (
        <div style={{ margin: '10px 0 14px', fontSize: 14 }}>
          <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (can sign in)</label>
        </div>
      )}
      {!isNew && <p className="adm-sub" style={{ margin: '2px 0 10px' }}>Last login: {fmt(account.lastLoginAt)}</p>}

      {err && <p className="adm-error">{err}</p>}
      {/* The button is only disabled while a request is in flight. Clicking with
          an incomplete form reports what's wrong instead of doing nothing. */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="adm-btn" onClick={save} disabled={busy}>
          {busy ? (isNew ? 'Creating…' : 'Saving…') : (isNew ? 'Create account' : 'Save changes')}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

/**
 * The organisation behind an `organisation`-role account. Shown only when this
 * save would create one — it lands already approved and active (an admin typing
 * these details in person has effectively done the review), with a code assigned
 * and the full portal granted. Only the name is required; the rest is the public
 * profile the organisation can refine itself later.
 */
function OrgFields({ org, set, loginEmail, nameErr }) {
  return (
    <div className="adm-panel" style={{ marginTop: 12, background: 'var(--gray-50)' }}>
      <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>Organisation details</h3>
      <p className="adm-sub" style={{ marginTop: 0 }}>
        Creates the organisation itself — approved and active straight away. It appears in the
        public partner directory unless you untick that below.
      </p>

      <div className="adm-row2">
        <div className="adm-field"><label>Organisation name *</label>
          <input className={inputCls(nameErr)} value={org.name} maxLength={120}
                 placeholder="e.g. Rampur Gram Panchayat"
                 onChange={(e) => set('name', e.target.value)} />
          <FieldError msg={nameErr} /></div>
        <div className="adm-field"><label>Type</label>
          <select className="adm-select" value={org.type} onChange={(e) => set('type', e.target.value)}>
            {ORG_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select></div>
      </div>

      <div className="adm-field"><label>About (shown in the public directory)</label>
        <textarea className="adm-input" rows={3} value={org.description} maxLength={1200}
                  placeholder="e.g. Village panchayat sponsoring career guidance for students across the block."
                  onChange={(e) => set('description', e.target.value)} /></div>

      <div className="adm-row2">
        <div className="adm-field"><label>Branch / campus</label>
          <input className="adm-input" value={org.branch} maxLength={120} onChange={(e) => set('branch', e.target.value)} /></div>
        <div className="adm-field"><label>Website</label>
          <input className="adm-input" value={org.website} maxLength={200} placeholder="https://…"
                 onChange={(e) => set('website', e.target.value)} /></div>
      </div>

      <div className="adm-field"><label>Address</label>
        <input className="adm-input" value={org.address} maxLength={240} onChange={(e) => set('address', e.target.value)} /></div>

      <div className="adm-row2">
        <div className="adm-field"><label>City</label>
          <input className="adm-input" value={org.city} maxLength={80} onChange={(e) => set('city', e.target.value)} /></div>
        <div className="adm-field"><label>State</label>
          <input className="adm-input" value={org.state} maxLength={80} onChange={(e) => set('state', e.target.value)} /></div>
      </div>

      <div className="adm-row2">
        <div className="adm-field"><label>Pincode</label>
          <input className="adm-input" value={org.pincode} maxLength={12} onChange={(e) => set('pincode', e.target.value)} /></div>
        <div className="adm-field"><label>Contact number</label>
          <input className="adm-input" value={org.phone} maxLength={20} onChange={(e) => set('phone', e.target.value)} /></div>
      </div>

      <div className="adm-row2">
        <div className="adm-field"><label>Contact person</label>
          <input className="adm-input" value={org.contactPerson} maxLength={80}
                 placeholder="Defaults to the account name"
                 onChange={(e) => set('contactPerson', e.target.value)} /></div>
        <div className="adm-field"><label>Organisation email</label>
          <input className="adm-input" type="email" value={org.email || ''} maxLength={254}
                 placeholder={loginEmail || 'Defaults to the login email'}
                 onChange={(e) => set('email', e.target.value)} /></div>
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
        <input type="checkbox" checked={org.publicListed !== false}
               onChange={(e) => set('publicListed', e.target.checked)} />
        List in the public /organisations directory
      </label>
    </div>
  )
}
