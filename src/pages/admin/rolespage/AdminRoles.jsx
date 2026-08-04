import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import ConfirmModal from '../../../common_component/admin/ConfirmModal/ConfirmModal.jsx'
import '../adminShared.css'

/**
 * Roles (superadmin only). A role IS its module set. Every account has one role;
 * an account can enter the panel when its role is superadmin OR its role grants
 * at least one module. Roles are fully CRUD-able except two built-ins:
 * `student` (the default account role — can't be deleted) and `superadmin`
 * (locked to everything — can't be edited or deleted).
 */
const MODULES = [
  { key: 'assessments', label: 'Assessments' },
  { key: 'content', label: 'Content' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'mentoring', label: 'Mentoring' },
  { key: 'orders', label: 'Orders' },
  { key: 'skill-builds', label: 'Skill Builds' },
  { key: 'users', label: 'Users' },
]
const roleTone = (r) => (r.key === 'superadmin' ? 'warn' : r.panel ? 'ok' : 'muted')

export default function AdminRoles() {
  const [roles, setRoles] = useState(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [del, setDel] = useState(null) // role pending delete
  const [busy, setBusy] = useState(false)

  const load = () =>
    api('/admin/roles', { auth: 'admin' })
      .then((d) => setRoles(d.roles))
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const doDelete = async () => {
    setBusy(true); setError('')
    try {
      await api(`/admin/roles/${del.id}`, { method: 'DELETE', auth: 'admin' })
      setDel(null); load()
    } catch (e) { setError(e.message); setDel(null) } finally { setBusy(false) }
  }

  return (
    <div>
      <h1 className="adm-title">Roles</h1>
      <p className="adm-sub">
        Every account has one role, and a role is just the set of admin-panel modules it grants.
        Give a role at least one module and its accounts can sign into the panel; leave it empty and
        they’re site-only. New accounts default to <strong>student</strong>; superadmin always has everything.
      </p>

      <div className="adm-toolbar">
        <button className="adm-btn adm-btn--sm" onClick={() => setAdding((v) => !v)}>+ New role</button>
      </div>

      {adding && (
        <div className="adm-panel">
          <RoleForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} onError={setError} />
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
      {!roles && !error && <p className="adm-empty">Loading…</p>}

      {roles && roles.map((r) => (
        <RoleCard key={r.id} role={r} onSaved={load} onError={setError} onDelete={() => setDel(r)} />
      ))}

      {del && (
        <ConfirmModal
          title={`Delete “${del.name}”?`}
          message="Accounts using this role must be reassigned first. This can’t be undone."
          confirmLabel="Delete role"
          danger
          busy={busy}
          onCancel={() => setDel(null)}
          onConfirm={doDelete}
        />
      )}
    </div>
  )
}

/** Create a brand-new role (name + modules). */
function RoleForm({ onCancel, onSaved, onError }) {
  const [name, setName] = useState('')
  const [perms, setPerms] = useState([])
  const [busy, setBusy] = useState(false)
  const toggle = (k) => setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))

  const save = async () => {
    setBusy(true); onError('')
    try {
      await api('/admin/roles', { method: 'POST', auth: 'admin', body: { name, permissions: perms } })
      onSaved()
    } catch (e) { onError(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>New role</h2>
      <div className="adm-field" style={{ maxWidth: 420 }}>
        <label>Role name</label>
        <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Content Manager" />
      </div>
      <div className="adm-field">
        <label>Module access</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginTop: 6 }}>
          {MODULES.map((m) => (
            <label key={m.key} style={{ fontSize: 14, display: 'flex', gap: 7, alignItems: 'center' }}>
              <input type="checkbox" checked={perms.includes(m.key)} onChange={() => toggle(m.key)} />
              {m.label}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="adm-btn" onClick={save} disabled={busy || !name.trim()}>{busy ? 'Creating…' : 'Create role'}</button>
        <button className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

/** View + edit an existing role (modules always; name for non-built-ins). */
function RoleCard({ role, onSaved, onError, onDelete }) {
  const [name, setName] = useState(role.name)
  const [perms, setPerms] = useState(role.permissions || [])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty =
    name !== role.name ||
    perms.length !== role.permissions.length ||
    perms.some((p) => !role.permissions.includes(p))
  const toggle = (k) => setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))

  const save = async () => {
    setBusy(true); setSaved(false); onError('')
    try {
      const body = { permissions: perms }
      if (!role.system) body.name = name
      await api(`/admin/roles/${role.id}`, { method: 'PATCH', auth: 'admin', body })
      setSaved(true)
      onSaved()
    } catch (e) { onError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="adm-panel">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <span className={`adm-badge adm-badge--${roleTone(role)}`} style={{ minWidth: 92, textAlign: 'center' }}>{role.key}</span>
        {role.panel && <span className="adm-badge adm-badge--ok">Panel access</span>}
        {!role.panel && <span className="adm-sub" style={{ margin: 0 }}>Site-only — no panel access</span>}
        {role.system && <span className="adm-badge adm-badge--muted">Built-in</span>}
        {role.locked && <span className="adm-sub" style={{ margin: 0 }}>Locked — always full access</span>}
        {!role.system && (
          <button className="adm-btn adm-btn--ghost adm-btn--sm" style={{ marginLeft: 'auto' }} onClick={onDelete}>Delete</button>
        )}
      </div>

      {role.locked ? (
        <span className="adm-badge adm-badge--ok">All modules</span>
      ) : (
        <>
          {!role.system && (
            <div className="adm-field" style={{ maxWidth: 420 }}>
              <label>Role name</label>
              <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="adm-field">
            <label>Module access</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginTop: 6 }}>
              {MODULES.map((m) => (
                <label key={m.key} style={{ fontSize: 14, display: 'flex', gap: 7, alignItems: 'center' }}>
                  <input type="checkbox" checked={perms.includes(m.key)} onChange={() => toggle(m.key)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <button className="adm-btn adm-btn--sm" onClick={save} disabled={busy || !dirty || !name.trim()}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            {saved && !dirty && <span className="adm-sub" style={{ margin: 0 }}>Saved ✓</span>}
          </div>
        </>
      )}
    </div>
  )
}
