import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import SponsoredCoursePicker from '../../../common_component/admin/SponsoredCoursePicker/SponsoredCoursePicker.jsx'
import Pager from '../../../common_component/admin/Pager/Pager.jsx'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { LIMITS, sanitisePhone } from '../../../utils/validate.js'
import PasswordField from '../../../common_component/PasswordField/PasswordField.jsx'
import CopyLink from '../../../common_component/admin/CopyLink/CopyLink.jsx'
import { SkeletonForm, SkeletonTable } from '../../../common_component/Skeleton/Skeleton.jsx'

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
  packages: [], // sponsored Skill-Build course SKUs — see SponsoredCoursePicker
  // The institution's Mindler account. `password` is only ever what is typed
  // now — blank keeps the saved one; the server never sends it back.
  mindler: { loginId: '', password: '', schoolId: '', passwordSetAt: null },
}

// The institution as the server takes it. PhoneInput writes its dial code
// ("+91") into an empty box, which is not a number and which the server
// refuses — so a profile with no phone could not be saved at all. A bare dial
// code is sent as no phone, the same as the Settings page does. The contact
// email falls back to the login email.
const orgPayload = (org, loginEmail) => ({
  ...org,
  phone: sanitisePhone(org.phone || '').replace(/^\+\d{1,4}$/, ''),
  email: org.email || loginEmail,
  // The website is optional, and people type "school.edu.in" far more often
  // than "https://school.edu.in" — the server wants the latter.
  website: withScheme(org.website),
})
const withScheme = (url) => {
  const v = String(url || '').trim()
  return v && !/^https?:\/\//i.test(v) ? `https://${v}` : v
}

// What a new institution is buying. Amounts in rupees as typed.
const BLANK_PURCHASE = { packageId: '', students: '', totalInr: '', method: '', reference: '' }
const perStudent = (p) => {
  const n = Number(p.students)
  const t = Number(p.totalInr)
  return n >= 1 && Number.isFinite(t) && p.totalInr !== '' ? t / n : null
}
const inr = (v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

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
  const [signups, setSignups] = useState(null)
  const [page, setPage] = useState(1)
  const [pg, setPg] = useState({ page: 1, pages: 1, total: 0 })
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [editing, setEditing] = useState(null) // account object
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadList = (search = '') =>
    api(`/admin/users?${new URLSearchParams({ ...(search ? { q: search } : {}), page })}`, { auth: 'admin' })
      .then((d) => { setUsers(d.users); setSignups(d.signups || null); setPg({ page: d.page, pages: d.pages, total: d.total }) })
      .catch((e) => setError(e.message))

  const load = () => {
    loadList(q)
    if (isSuper) api('/admin/roles', { auth: 'admin' }).then((d) => setRoles(d.roles)).catch(() => {})
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Turning a page re-asks the server; the search box keeps whatever is in it.
  useEffect(() => { loadList(q) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const roleMap = Object.fromEntries(roles.map((r) => [r.key, r]))

  // How the account came to exist, in the words a person would use.
  const SIGNUP = {
    password: { label: 'Email', tone: 'muted' },
    google: { label: 'Google', tone: 'ok' },
    invite: { label: 'Invited', tone: 'warn' },
    guest: { label: 'Checkout', tone: 'muted' },
  }
  const STATUS = {
    active: { label: 'Active', tone: 'ok' },
    invited: { label: 'Invite sent', tone: 'warn' },
    disabled: { label: 'Disabled', tone: 'muted' },
  }
  const onDate = (iso) => (iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—')
  const tone = (key) => (key === 'superadmin' ? 'warn' : roleMap[key]?.panel ? 'ok' : 'muted')
  const label = (key) => roleMap[key]?.name || key

  /**
   * Open or close the student portal for one account.
   *
   * Only offered on non-student roles: one login serves both the site and the
   * panel, so an admin pressing "View site" has always landed inside the portal
   * signed in. That suits a mentor who also learns and not a content editor —
   * this is where that gets decided. A student is not asked, because their
   * account IS the portal.
   */
  const changeSiteAccess = async (id, siteAccess) => {
    setSavingId(id); setError('')
    try {
      const { user } = await api(`/admin/users/${id}/site-access`, {
        method: 'PATCH', auth: 'admin', body: { siteAccess },
      })
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, siteAccess: user.siteAccess } : u)))
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingId(null)
    }
  }

  const changeRole = async (id, role) => {
    setSavingId(id); setError('')
    try {
      const { user } = await api(`/admin/users/${id}/role`, { method: 'PATCH', auth: 'admin', body: { role } })
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: user.role } : u)))
    } catch (e) { setError(e.message); loadList(q) } finally { setSavingId(null) }
  }

  const removeAccount = async (u) => {
    const warn = u.role === ORG_ROLE && u.organisation
      ? `Delete ${u.name || u.email}?\n\nThis deletes the institution “${u.organisation.name}” and EVERYTHING that belongs to it: every student account it added (with their courses, progress and orders), its orders, and the institution itself. Nothing is kept. This cannot be undone.`
      : `Delete ${u.name || u.email}? This permanently removes the account and cannot be undone.`
    if (!window.confirm(warn)) return
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

  const formOpen = (adding || editing) && isSuper
  const closeForm = () => { setAdding(false); setEditing(null) }
  // What the last create left to act on: an institution's payment link.
  const [created, setCreated] = useState(null)

  // Adding or editing an account is its own screen: the form alone, with a way
  // back. Shown above the list it read as part of the list, and a long form
  // (an institution's full profile) pushed the rows it belongs to off screen.
  if (formOpen) {
    return (
      <section>
        <button className="adm-link" style={{ padding: 0, marginBottom: 10 }} onClick={closeForm}>← All accounts</button>
        <div className="adm-panel">
          <AccountForm account={editing} roles={roles} isSelf={editing && me.id === editing.id}
                       onCancel={closeForm}
                       onSaved={(res) => { closeForm(); setCreated(res?.institutionOrder ? res : null); load() }} />
        </div>
      </section>
    )
  }

  return (
    <section>
      {created?.institutionOrder && (
        <div className="adm-panel" role="status" style={{ marginBottom: 14 }}>
          <strong>{created.admin?.name || 'The institution'} is added.</strong>{' '}
          {created.institutionOrder.status === 'paid'
            ? <>Cash payment recorded (receipt {created.institutionOrder.receiptNo}). Its seats are ready — it can add students now.</>
            : <>A payment link has gone to the institution’s email. It cannot sign in or use its portal until it pays; then its seats open. You can send the link yourself too:</>}
          <CopyLink url={created.institutionOrder.payLink} />
          <button className="adm-link" style={{ padding: 0, marginTop: 8 }} onClick={() => setCreated(null)}>Dismiss</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
        <input className="adm-input" style={{ maxWidth: 280 }} placeholder="Search name or email"
               value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(1), loadList(q))} maxLength={LIMITS.search} />
        <button className="adm-btn adm-btn--ghost" onClick={() => { setPage(1); loadList(q) }}>Search</button>
        {isSuper && (
          <button className="adm-btn adm-btn--sm" style={{ marginLeft: 'auto' }}
                  onClick={() => { setEditing(null); setAdding(true) }}>+ New account</button>
        )}
      </div>

      {/* Where accounts come from — counted across every account, not just the
          rows a search happens to be showing. */}
      {signups && (
        <div className="adm-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: '14px 18px', marginBottom: 14 }}>
          {[
            ['Total accounts', signups.total],
            ['Signed up with email', signups.password],
            ['Signed up with Google', signups.google],
            ['Invited by an institution', signups.invite],
            ['Created at checkout', signups.guest],
          ].map(([label, n]) => (
            <div key={label}>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{n}</div>
              <div className="adm-sub" style={{ margin: 0 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}
      {!users ? <SkeletonTable /> : users.length === 0 ? (
        <p className="adm-empty">No accounts found.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Role</th><th>Institution</th><th>Signed up</th><th>Created</th><th>Access</th><th>Student portal</th>{isSuper && <th></th>}</tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || '—'}{me.id === u.id && <span className="adm-sub" style={{ fontWeight: 400 }}> (you)</span>}</td>
                  <td>{u.email}</td>
                  {/* The same rule the organisation's roster uses. "Verified"
                      used to sit here and answered a different question, which
                      is how one student could read Active on one screen and
                      Invite sent on the other. */}
                  <td>
                    {/* Stacked and left-aligned, so a second badge sits under
                        the first instead of wrapping loose text beside it. */}
                    <div className="adm-badge-stack">
                      <span className={`adm-badge adm-badge--${(STATUS[u.status] || STATUS.active).tone}`}>
                        {(STATUS[u.status] || STATUS.active).label}
                      </span>
                      {!u.emailVerified && (
                        <span className="adm-badge adm-badge--warn" title="This account has not confirmed its email address yet">
                          Email unverified
                        </span>
                      )}
                    </div>
                  </td>
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
                  {/* Every account belongs somewhere. A public signup belongs
                      to nobody, and that is the answer, not a blank. */}
                  <td>
                    {u.organisation
                      ? u.organisation.name
                      : <span className="adm-sub" style={{ margin: 0 }}>Self</span>}
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge--${(SIGNUP[u.signupMethod] || SIGNUP.password).tone}`}>
                      {(SIGNUP[u.signupMethod] || SIGNUP.password).label}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {onDate(u.createdAt)}
                    <div className="adm-sub" style={{ margin: 0 }}>
                      by {u.createdBy ? (u.createdBy.name || u.createdBy.email) : 'Self'}
                    </div>
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
                  <td>
                    {u.role === 'student' ? (
                      // Nothing to decide: a student account is the portal.
                      <span className="adm-sub" style={{ margin: 0 }}>Always</span>
                    ) : isSuper ? (
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={u.siteAccess !== false}
                          disabled={savingId === u.id}
                          onChange={(e) => changeSiteAccess(u.id, e.target.checked)}
                        />
                        <span className="adm-sub" style={{ margin: 0 }}>
                          {u.siteAccess !== false ? 'Allowed' : 'Blocked'}
                        </span>
                      </label>
                    ) : (
                      <span className={`adm-badge adm-badge--${u.siteAccess !== false ? 'ok' : 'muted'}`}>
                        {u.siteAccess !== false ? 'Allowed' : 'Blocked'}
                      </span>
                    )}
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
      <Pager page={pg.page} pages={pg.pages} total={pg.total} onChange={setPage} unit="account" />
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
  const [purchase, setPurchase] = useState(BLANK_PURCHASE)
  const setBuy = (k, v) => setPurchase((p) => ({ ...p, [k]: v }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [tried, setTried] = useState(false) // has submit been attempted?

  // An account that already owns an institution: its whole profile — the same
  // fields it was created with — is loaded into the form and saved back with
  // the account. `ownedLoaded` stays false until it has arrived, so a save can
  // never write blanks over a profile that simply had not loaded yet.
  const ownedOrgId = account?.role === ORG_ROLE ? account?.organisation?.id : null
  const [ownedLoaded, setOwnedLoaded] = useState(false)
  const [ownedErr, setOwnedErr] = useState('')
  useEffect(() => {
    if (!ownedOrgId) return
    api(`/admin/organisations/${ownedOrgId}`, { auth: 'admin' })
      .then((d) => {
        const o = d.organisation || {}
        setOrg(Object.fromEntries(Object.keys(BLANK_ORG).map((k) => [k, o[k] ?? BLANK_ORG[k]])))
        setOrg((p) => ({ ...p, mindler: { ...BLANK_ORG.mindler, ...(o.mindler || {}), password: '' } }))
        setOrg((p) => ({ ...p, email: o.email || '' }))
        setOwnedLoaded(true)
      })
      .catch((e) => setOwnedErr(e.message || 'Could not load the institution'))
  }, [ownedOrgId])
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const setOrgField = (k, v) => setOrg((p) => ({ ...p, [k]: v }))
  const selected = roles.find((r) => r.key === f.role)

  // Creating an institution: the role is changing TO institution. Editing one:
  // the account already owns it, and its profile is edited right here too.
  const needsOrg = f.role === ORG_ROLE && account?.role !== ORG_ROLE
  const editsOrg = !!ownedOrgId && f.role === ORG_ROLE

  // What's wrong, per field. The button stays clickable and submitting shows
  // these — a greyed-out button tells you nothing, and a 7-character password
  // looks exactly like a valid one behind the dots.
  const problems = {
    name: !f.name.trim() ? (needsOrg ? 'Enter the institute name.' : 'Enter a name.') : '',
    email: isNew && !f.email.trim() ? 'Enter an email address.' : '',
    password: isNew && f.password.length < 8
      ? `Password must be at least 8 characters — this one has ${f.password.length}.`
      : '',
    orgName: editsOrg && ownedLoaded && !org.name.trim() ? 'Enter the institution’s name.' : '',
    // A new institution comes with what it is buying.
    buyCourse: needsOrg && !purchase.packageId ? 'Choose the course.' : '',
    buyStudents: needsOrg && !(Number.isInteger(Number(purchase.students)) && Number(purchase.students) >= 1)
      ? 'Enter the number of students (at least 1).' : '',
    buyTotal: needsOrg && (purchase.totalInr === '' || !(Number(purchase.totalInr) >= 0))
      ? 'Enter the total amount.'
      : needsOrg && purchase.method === 'online' && Number(purchase.totalInr) < 1 ? 'An online payment has to be at least ₹1.' : '',
    buyMethod: needsOrg && !purchase.method ? 'Choose the payment type.' : '',
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
      const orgBody = needsOrg
        ? {
            organisation: { ...orgPayload(org, f.email), name: f.name.trim(), email: f.email.trim().toLowerCase() },
            purchase: {
              packageId: purchase.packageId,
              students: Number(purchase.students),
              totalInr: Number(purchase.totalInr),
              method: purchase.method,
              reference: purchase.reference.trim(),
            },
          }
        : {}
      if (isNew) {
        const res = await api('/admin/admins', {
          method: 'POST', auth: 'admin',
          body: { name: f.name, email: f.email, password: f.password, role: f.role, ...orgBody },
        })
        return onSaved(res)
      } else {
        await api(`/admin/admins/${account.id}`, {
          method: 'PATCH', auth: 'admin',
          body: {
            name: f.name, role: f.role, active: f.active,
            ...(f.password ? { password: f.password } : {}),
            ...orgBody,
          },
        })
        // The institution's profile, while the account still owns it — a role
        // moved away from Institution is refused by the server above, so
        // reaching here means it does. Only once it has loaded (see above).
        if (editsOrg && ownedLoaded) {
          await api(`/admin/organisations/${ownedOrgId}`, {
            method: 'PUT', auth: 'admin', body: orgPayload(org, f.email),
          })
        }
      }
      onSaved()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>{isNew ? 'New account' : `Edit ${account.name || account.email}`}</h2>
      {/* Role first: it decides what the rest of the form asks for. */}
      <div className="adm-row2">
        <div className="adm-field">
          <label>Role</label>
          <select className="adm-select" value={f.role} disabled={isSelf} onChange={(e) => set('role', e.target.value)}>
            {roleOpts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        </div>
      </div>
      {f.role === 'superadmin'
        ? <p className="adm-sub" style={{ marginTop: -4 }}>Full access to everything, including managing accounts &amp; roles.</p>
        : f.role === ORG_ROLE
          ? <p className="adm-sub" style={{ marginTop: -4 }}>Partner institution — no admin panel. Signs in to the <strong>/organisation</strong> portal to add and manage its students.</p>
          : selected?.panel
            ? <p className="adm-sub" style={{ marginTop: -4 }}>Panel access to this role’s modules — edit them on the Roles page.</p>
            : <p className="adm-sub" style={{ marginTop: -4 }}>Site account — no panel access unless this role is given modules on the Roles page.</p>}

      <h4 className="adm-form-section">{needsOrg ? 'Institute account' : 'Account'}</h4>
      <div className="adm-row2">
        <div className="adm-field">
          {/* A new institution's account IS the institution, so its name is
              asked for once, here, and used for both. */}
          <label>{needsOrg ? 'Institute name *' : 'Name'}</label>
          <input className={inputCls(fieldErr('name'))} value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={LIMITS.title}
                 placeholder={needsOrg ? 'e.g. Rampur Public School' : undefined} />
          <FieldError msg={fieldErr('name')} />
        </div>
        <div className="adm-field">
          <label>{needsOrg && isNew ? 'Email * (sign-in, payment link and all messages)' : `Email ${isNew ? '' : '(fixed)'}`}</label>
          <input className={inputCls(fieldErr('email'))} type="email" value={f.email} disabled={!isNew} onChange={(e) => set('email', e.target.value)} maxLength={LIMITS.email} />
          <FieldError msg={fieldErr('email')} />
        </div>
      </div>
      <div className="adm-row2">
        <div className="adm-field">
          <label>{isNew ? 'Password (min 8 chars)' : 'New password (blank = unchanged)'}</label>
          <PasswordField className={inputCls(fieldErr('password'))} value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" maxLength={LIMITS.password} />
          <FieldError msg={fieldErr('password')} />
        </div>
      </div>

      {needsOrg && (
        <>
          <OrgFields org={org} set={setOrgField} loginEmail={f.email} hideName />
          <PurchaseFields p={purchase} set={setBuy} err={fieldErr} />
        </>
      )}
      {editsOrg && (ownedLoaded
        ? <OrgFields org={org} set={setOrgField} loginEmail={f.email} nameErr={fieldErr('orgName')} editing />
        : (
          <div className="adm-panel" style={{ marginTop: 12, background: 'var(--gray-50)' }}>
            {ownedErr
              ? <p className="adm-error" style={{ margin: 0 }}>{ownedErr}</p>
              : <SkeletonForm fields={3} label="Loading the institution’s details" />}
          </div>
        ))}

      {account?.removedFrom && !account.organisation && (
        <div className="adm-panel" style={{ marginTop: 12, background: 'var(--gray-50)' }}>
          <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>Removed by their institution</h3>
          <p className="adm-sub" style={{ marginTop: 0 }}>
            <strong>{account.removedFrom.name}</strong> removed this student from its roster
            {account.removedFrom.at ? ` on ${fmt(account.removedFrom.at)}` : ''}.
            Restoring puts them back on that roster, switches their login back on if the removal
            switched it off, and grants the institution’s sponsored course if they do not hold it yet.
          </p>
          <button type="button" className="adm-btn" disabled={busy} onClick={async () => {
            setBusy(true); setErr('')
            try {
              await api(`/admin/organisations/students/${account.id}/restore`, { method: 'POST', auth: 'admin' })
              onSaved()
            } catch (e) { setErr(e.message) } finally { setBusy(false) }
          }}>
            {busy ? 'Restoring…' : `Restore to ${account.removedFrom.name}`}
          </button>
        </div>
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
function OrgFields({ org, set, loginEmail, nameErr, editing = false, hideName = false }) {
  // `hideName`: a new institution, whose name and email are the account's own, asked
  // once at the top of the form.
  return (
    <div className="adm-panel" style={{ marginTop: 12, background: 'var(--gray-50)' }}>
      <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>Institution details</h3>
      <p className="adm-sub" style={{ marginTop: 0 }}>
        {editing
          ? 'Everything the institution’s profile holds. Changes save with the account. Portal access and suspension are on the Institutions page.'
          : 'Creates the institution itself — approved and active straight away. It appears in the public partner directory unless you untick that below.'}
      </p>

      <h4 className="adm-form-section">About the institution</h4>
      <div className="adm-row2">
        {/* Creating: the name is the "Institute name" at the top of the form. */}
        {!hideName && (
          <div className="adm-field"><label>Institution name *</label>
            <input className={inputCls(nameErr)} value={org.name} maxLength={LIMITS.title}
                   placeholder="e.g. Rampur Gram Panchayat"
                   onChange={(e) => set('name', e.target.value)} />
            <FieldError msg={nameErr} /></div>
        )}
        <div className="adm-field"><label>Type</label>
          <select className="adm-select" value={org.type} onChange={(e) => set('type', e.target.value)}>
            {ORG_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select></div>
        {hideName && (
          <div className="adm-field"><label>Branch / campus</label>
            <input className="adm-input" value={org.branch} maxLength={LIMITS.title} onChange={(e) => set('branch', e.target.value)} /></div>
        )}
      </div>
      <div className="adm-row2">
        {!hideName && (
          <div className="adm-field"><label>Branch / campus</label>
            <input className="adm-input" value={org.branch} maxLength={LIMITS.title} onChange={(e) => set('branch', e.target.value)} /></div>
        )}
        <div className="adm-field"><label>Website (optional)</label>
          <input className="adm-input" value={org.website} maxLength={LIMITS.url} placeholder="e.g. school.edu.in"
                 onChange={(e) => set('website', e.target.value)} /></div>
      </div>
      <div className="adm-field"><label>About (shown in the public directory)</label>
        <textarea className="adm-input" rows={3} value={org.description} maxLength={LIMITS.description}
                  placeholder="e.g. Village panchayat sponsoring career guidance for students across the block."
                  onChange={(e) => set('description', e.target.value)} /></div>

      <h4 className="adm-form-section">Contact</h4>
      <div className="adm-row2">
        <div className="adm-field"><label>Contact person</label>
          <input className="adm-input" value={org.contactPerson} maxLength={LIMITS.name}
                 placeholder="Who to call at the institution"
                 onChange={(e) => set('contactPerson', e.target.value)} /></div>
        {/* The same country picker the rest of the site uses. This number is how
            a school is called back, and it was the last phone box on the site
            still accepting a bare string. */}
        <div className="adm-field"><label>Contact number</label>
          <PhoneInput defaultCountry="in" value={org.phone} onChange={(v) => set('phone', v)}
                      className="phone-intl" inputClassName="phone-intl-input"
                      countrySelectorStyleProps={{ buttonClassName: 'phone-intl-btn' }} /></div>
      </div>
      {/* Creating: the login email at the top is the institution's email
          too — one address for signing in, the payment link and every
          message. */}
      {!hideName && (
        <div className="adm-row2">
          <div className="adm-field"><label>Institution email</label>
            <input className="adm-input" type="email" value={org.email || ''} maxLength={LIMITS.email}
                   placeholder={loginEmail || 'Defaults to the login email'}
                   onChange={(e) => set('email', e.target.value)} /></div>
        </div>
      )}

      <h4 className="adm-form-section">Address</h4>
      <div className="adm-field"><label>Address</label>
        <input className="adm-input" value={org.address} maxLength={LIMITS.address}
               placeholder="Building, street, area" onChange={(e) => set('address', e.target.value)} /></div>
      <div className="adm-row2">
        <div className="adm-field"><label>City / Town / Village</label>
          <input className="adm-input" value={org.city} maxLength={LIMITS.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div className="adm-field"><label>State</label>
          <input className="adm-input" value={org.state} maxLength={LIMITS.state} onChange={(e) => set('state', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Pincode</label>
          <input className="adm-input" value={org.pincode} maxLength={LIMITS.pincode} inputMode="numeric"
                 onChange={(e) => set('pincode', e.target.value)} /></div>
      </div>

      {/* A new institution picks its course in the purchase below. */}
      {editing && (
        <>
          <h4 className="adm-form-section">Course</h4>
          <SponsoredCoursePicker value={org.packages || []} onChange={(v) => set('packages', v)} />
        </>
      )}

      <MindlerFields value={org.mindler || BLANK_ORG.mindler} onChange={(v) => set('mindler', v)} />

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
        <input type="checkbox" checked={org.publicListed !== false}
               onChange={(e) => set('publicListed', e.target.checked)} />
        List in the public institutions directory (/organisations)
      </label>
    </div>
  )
}

/**
 * The institution's account on Mindler, the psychometric test provider, as
 * Mindler issued it — what the institution reads its reports with — and the
 * Mindler school ID, which every student it adds carries to the test so the
 * school sees their report. The password is encrypted on the server and never shown again.
 */
function MindlerFields({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  const saved = value.passwordSetAt
    ? `Saved ${new Date(value.passwordSetAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — leave blank to keep`
    : 'As Mindler gave it'
  return (
    <>
      <h4 className="adm-form-section">Mindler (psychometric reports)</h4>
      <p className="adm-sub" style={{ marginTop: 0 }}>
        The account Mindler created for this institution. Leave empty if it has none yet.
      </p>
      <div className="adm-row2">
        <div className="adm-field"><label>Mindler login (email)</label>
          <input className="adm-input" type="email" value={value.loginId} maxLength={LIMITS.email}
                 autoComplete="off" placeholder="e.g. school@example.com"
                 onChange={(e) => set('loginId', e.target.value)} /></div>
        <div className="adm-field"><label>Mindler password</label>
          <input className="adm-input" type="password" value={value.password} maxLength={200}
                 autoComplete="new-password" placeholder={saved}
                 onChange={(e) => set('password', e.target.value)} /></div>
      </div>
      <div className="adm-row2">
        <div className="adm-field"><label>Mindler school ID</label>
          <input className="adm-input" value={value.schoolId} maxLength={40}
                 placeholder="e.g. 2" onChange={(e) => set('schoolId', e.target.value)} />
          <span className="adm-sub" style={{ fontSize: 12 }}>Given to every student this institution adds, and to those already on its roster.</span></div>
      </div>
    </>
  )
}

/**
 * What a new institution is buying: the course, for how many students, the
 * total agreed, and how it is paid. The per-student figure is worked out as
 * the admin types. Cash is recorded as paid there and then; digital sends the
 * institution a Cashfree payment link. Either way it becomes an order on the
 * Orders page, and the students count becomes the seats it can fill.
 */
function PurchaseFields({ p, set, err }) {
  const each = perStudent(p)
  return (
    <div className="adm-panel" style={{ marginTop: 12, background: 'var(--gray-50)' }}>
      <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>Purchase</h3>
      <p className="adm-sub" style={{ marginTop: 0 }}>
        The institution can add as many students as it pays for here. Each student gets the course when they
        set their password.
      </p>

      <SponsoredCoursePicker
        value={p.packageId ? [p.packageId] : []}
        onChange={(v) => set('packageId', v[0] || '')}
        allowNone={false}
        label="Course *"
        note="The course every student this institution adds will get."
        error={err('buyCourse')}
      />

      <div className="adm-row2">
        <div className="adm-field"><label>Number of students *</label>
          <input className={inputCls(err('buyStudents'))} type="number" min={1} step={1} inputMode="numeric"
                 value={p.students} placeholder="e.g. 50"
                 onChange={(e) => set('students', e.target.value.replace(/[^\d]/g, ''))} />
          <FieldError msg={err('buyStudents')} /></div>
        <div className="adm-field"><label>Total amount (₹) *</label>
          <input className={inputCls(err('buyTotal'))} type="number" min={0} step="0.01" inputMode="decimal"
                 value={p.totalInr} placeholder="e.g. 150000"
                 onChange={(e) => set('totalInr', e.target.value)} />
          <FieldError msg={err('buyTotal')} /></div>
      </div>

      <p className="adm-sub" style={{ margin: '-4px 0 12px' }}>
        Per student: <strong>{each != null ? inr(each) : '—'}</strong>
      </p>

      <div className="adm-row2">
        <div className="adm-field"><label>Payment type *</label>
          <select className={`adm-select${err('buyMethod') ? ' adm-input--err' : ''}`} value={p.method}
                  onChange={(e) => set('method', e.target.value)}>
            <option value="">Choose…</option>
            <option value="cash">Cash</option>
            <option value="online">Digital payment (Cashfree link)</option>
          </select>
          <FieldError msg={err('buyMethod')} /></div>
        {p.method === 'cash' && (
          <div className="adm-field"><label>Receipt / reference no. (optional)</label>
            <input className="adm-input" value={p.reference} maxLength={120} placeholder="e.g. cash receipt number"
                   onChange={(e) => set('reference', e.target.value)} /></div>
        )}
      </div>

      {p.method === 'cash' && (
        <p className="adm-sub" style={{ margin: 0 }}>Recorded as paid now. The seats are ready as soon as the account is created.</p>
      )}
      {p.method === 'online' && (
        <p className="adm-sub" style={{ margin: 0 }}>
          A Cashfree payment link is emailed to the institution (and shown to you to copy). The seats open when it
          pays; the payment and its transaction ID are saved on the order.
        </p>
      )}
    </div>
  )
}
