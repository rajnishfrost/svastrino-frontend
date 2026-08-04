import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'

// One account system: every person is one account with one role (managed on the
// Roles page). Only superadmin, or a role that grants ≥1 module, can enter the panel.
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : 'never'

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
                      <button className="adm-btn adm-btn--ghost adm-btn--sm"
                              onClick={() => { setAdding(false); setEditing(u) }}>Edit</button>
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
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const selected = roles.find((r) => r.key === f.role)
  // Keep the account's current role selectable even if it no longer exists as a role.
  const roleOpts = roles.some((r) => r.key === f.role) ? roles.map((r) => ({ v: r.key, label: r.name }))
    : [{ v: f.role, label: f.role }, ...roles.map((r) => ({ v: r.key, label: r.name }))]

  const save = async () => {
    setBusy(true); setErr('')
    try {
      if (isNew) {
        await api('/admin/admins', {
          method: 'POST', auth: 'admin',
          body: { name: f.name, email: f.email, password: f.password, role: f.role },
        })
      } else {
        await api(`/admin/admins/${account.id}`, {
          method: 'PATCH', auth: 'admin',
          body: { name: f.name, role: f.role, active: f.active, ...(f.password ? { password: f.password } : {}) },
        })
      }
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{isNew ? 'New account' : `Edit ${account.name || account.email}`}</h2>
      <div className="adm-row2">
        <div className="adm-field"><label>Name</label><input className="adm-input" value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="adm-field">
          <label>Email {isNew ? '' : '(fixed)'}</label>
          <input className="adm-input" type="email" value={f.email} disabled={!isNew} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>
      <div className="adm-row2">
        <div className="adm-field">
          <label>{isNew ? 'Password (min 8 chars)' : 'New password (blank = unchanged)'}</label>
          <input className="adm-input" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
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
        : selected?.panel
          ? <p className="adm-sub" style={{ marginTop: 4 }}>Panel access to this role’s modules — edit them on the Roles page.</p>
          : <p className="adm-sub" style={{ marginTop: 4 }}>Site account — no panel access unless this role is given modules on the Roles page.</p>}

      {!isNew && !isSelf && (
        <div style={{ margin: '10px 0 14px', fontSize: 14 }}>
          <label><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /> Active (can sign in)</label>
        </div>
      )}
      {!isNew && <p className="adm-sub" style={{ margin: '2px 0 10px' }}>Last login: {fmt(account.lastLoginAt)}</p>}

      {err && <p className="adm-error">{err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="adm-btn" onClick={save}
                disabled={busy || !f.name.trim() || (isNew && (!f.email.trim() || f.password.length < 8))}>
          {busy ? (isNew ? 'Creating…' : 'Saving…') : (isNew ? 'Create account' : 'Save changes')}
        </button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}
