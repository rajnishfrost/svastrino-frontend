import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { validatePassword } from '../../../utils/password.js'
import StrengthMeter from '../../../common_component/user/StrengthMeter/StrengthMeter.jsx'
import AvatarEditor from './AvatarEditor.jsx'
import { openInvoice } from '../../../utils/invoice.js'
import './Settings.css'

/**
 * Account settings with URL-driven tabs:
 *   /settings                     → Account (profile + security)
 *   /settings?tab=orders          → Orders list
 *   /settings?tab=orders&order=ID → a single order's detail
 * Keeping the active tab / open order in the query string makes every view
 * deep-linkable, shareable and refresh-safe.
 */
const TABS = [
  { key: 'account', label: 'Account' },
  { key: 'orders', label: 'Orders' },
]

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
// Money with 2 decimals (paise → rupees), for exact invoice amounts.
const money = (paise) =>
  '₹' + (Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
// "Nirmaan — Launch" → { product, pkg }
const splitItem = (label = '') => {
  const [product, pkg] = String(label).split('—').map((s) => s.trim())
  return { product: product || label, pkg: pkg || '' }
}
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function Settings() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawTab = searchParams.get('tab') || 'account'
  const tab = TABS.some((t) => t.key === rawTab) ? rawTab : 'account'
  const orderId = searchParams.get('order')

  if (!user) return null

  const goTab = (key) => setSearchParams(key === 'account' ? {} : { tab: key })
  const openOrder = (id) => setSearchParams({ tab: 'orders', order: id })
  const backToOrders = () => setSearchParams({ tab: 'orders' })

  return (
    <section className="section">
      <div className="container settings-wrap">
        <header className="settings-head">
          <h1>Settings</h1>
          <p>Manage your account details, security and orders.</p>
        </header>

        <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`settings-tab${tab === t.key ? ' is-active' : ''}`}
              onClick={() => goTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'account' && <AccountPanel />}

        {tab === 'orders' && (
          <OrdersPanel orderId={orderId} onOpen={openOrder} onBack={backToOrders} />
        )}
      </div>
    </section>
  )
}

/* ---------- Account (profile + security, editable) ---------- */
function AccountPanel() {
  const { user, refresh } = useAuth()
  const [avatarOk, setAvatarOk] = useState(true)
  const [editing, setEditing] = useState(null) // 'name' | 'phone' | 'password'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Profile photo editing
  const fileRef = useRef(null)
  const [editorFile, setEditorFile] = useState(null) // File being cropped, or null
  const [photoBusy, setPhotoBusy] = useState(false)

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (file) { setError(''); setNotice(''); setEditorFile(file) }
  }

  const savePhoto = async (blob) => {
    setPhotoBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('avatar', blob, 'avatar.jpg')
      await api('/user/profile/avatar', { method: 'POST', auth: 'user', body: fd })
      await refresh()
      setAvatarOk(true)
      setEditorFile(null)
      setNotice('Profile photo updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+91')
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confPw, setConfPw] = useState('')

  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase()

  const open = (field) => {
    setError('')
    setNotice('')
    setName(user.name || '')
    setPhone(user.phone || '+91')
    setCurPw('')
    setNewPw('')
    setConfPw('')
    setEditing(field)
  }
  const cancel = () => {
    setEditing(null)
    setError('')
  }

  const patchProfile = async (changes, okMsg) => {
    setBusy(true)
    setError('')
    try {
      await api('/user/profile', { method: 'PATCH', auth: 'user', body: changes })
      await refresh()
      setEditing(null)
      setNotice(okMsg)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const saveName = () => {
    if (!name.trim()) return setError('Name is required')
    patchProfile({ name: name.trim() }, 'Name updated.')
  }
  const savePhone = () => patchProfile({ phone }, 'Phone updated — verify it when you get the option.')

  const savePassword = async () => {
    setError('')
    // Same policy as signup / reset (min length + strength + no name).
    const pwErr = validatePassword(newPw, user.name)
    if (pwErr) return setError(pwErr)
    if (newPw !== confPw) return setError('New passwords do not match')
    setBusy(true)
    try {
      await api('/user/change-password', {
        method: 'POST',
        auth: 'user',
        body: { currentPassword: curPw, newPassword: newPw },
      })
      await refresh()
      setEditing(null)
      setNotice(user.hasPassword ? 'Password changed.' : 'Password set.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const hasPhoto = user.avatar && avatarOk

  return (
    <div className="card settings-card">
      <div className="settings-profile">
        <button
          type="button"
          className="settings-avatar-edit"
          onClick={() => fileRef.current?.click()}
          disabled={photoBusy}
          aria-label={hasPhoto ? 'Change profile photo' : 'Add profile photo'}
        >
          {hasPhoto ? (
            <img src={user.avatar} alt="" className="settings-avatar" referrerPolicy="no-referrer" onError={() => setAvatarOk(false)} />
          ) : (
            <span className="settings-avatar settings-avatar--initial">{initial}</span>
          )}
          <span className="settings-avatar-cam" aria-hidden>📷</span>
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickPhoto} />
        <div>
          <h2 className="settings-name">{user.name || 'Your account'}</h2>
          <p className="settings-muted">{user.email}</p>
        </div>
      </div>

      {editorFile && (
        <div className="avatar-modal" role="dialog" aria-modal="true" aria-label="Crop profile photo">
          <div className="avatar-modal-card">
            <h3 className="avatar-modal-title">Adjust your photo</h3>
            <AvatarEditor file={editorFile} busy={photoBusy} onSave={savePhoto} onCancel={() => setEditorFile(null)} />
          </div>
        </div>
      )}

      {error && <p className="settings-alert settings-alert--error" role="alert">{error}</p>}
      {notice && <p className="settings-alert settings-alert--ok" role="status">{notice}</p>}

      <div className="settings-rows">
        {/* Name */}
        {editing === 'name' ? (
          <EditField label="Name" onSave={saveName} onCancel={cancel} busy={busy}>
            <input className="settings-input" value={name} maxLength={60}
                   onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoFocus />
          </EditField>
        ) : (
          <ViewRow label="Name" value={user.name || '—'} action="Edit" onAction={() => open('name')} />
        )}

        {/* Email — read-only (login identity) */}
        <ViewRow label="Email" value={user.email}
                 badge={user.emailVerified ? 'verified' : 'unverified'} />

        {/* Account type (role) — read-only; changed by an admin */}
        <ViewRow label="Account type"
                 value={(user.role || 'student').replace(/^./, (c) => c.toUpperCase())} />

        {/* Phone */}
        {editing === 'phone' ? (
          <EditField label="Phone" onSave={savePhone} onCancel={cancel} busy={busy}>
            <PhoneInput defaultCountry="in" value={phone} onChange={setPhone}
                        className="phone-intl" inputClassName="phone-intl-input"
                        countrySelectorStyleProps={{ buttonClassName: 'phone-intl-btn' }} />
          </EditField>
        ) : (
          <ViewRow label="Phone" value={user.phone || 'Not added'}
                   badge={!user.phone ? undefined : user.phoneVerified ? 'verified' : 'unverified'}
                   action={user.phone ? 'Edit' : 'Add'} onAction={() => open('phone')} />
        )}

        {/* Password */}
        {editing === 'password' ? (
          <EditField label={user.hasPassword ? 'Change password' : 'Set password'}
                     onSave={savePassword} onCancel={cancel} busy={busy}>
            {user.hasPassword && (
              <input className="settings-input" type="password" autoComplete="current-password"
                     value={curPw} onChange={(e) => setCurPw(e.target.value)}
                     placeholder="Current password" autoFocus />
            )}
            <div>
              <input className="settings-input" type="password" autoComplete="new-password"
                     value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" />
              <StrengthMeter pw={newPw} name={user.name} />
            </div>
            <input className="settings-input" type="password" autoComplete="new-password"
                   value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="Confirm new password" />
          </EditField>
        ) : (
          <ViewRow label="Password" value={user.hasPassword ? '••••••••' : 'Not set'}
                   action={user.hasPassword ? 'Change' : 'Set'} onAction={() => open('password')} />
        )}
      </div>
    </div>
  )
}

function ViewRow({ label, value, badge, action, onAction }) {
  return (
    <div className="settings-row">
      <div className="settings-row-main">
        <span className="settings-row-label">{label}</span>
        <span className="settings-row-value">{value}</span>
      </div>
      <div className="settings-row-side">
        {badge === 'verified' && <span className="settings-badge settings-badge--ok">✓ Verified</span>}
        {badge === 'unverified' && <span className="settings-badge settings-badge--warn">Unverified</span>}
        {action && <button type="button" className="settings-link" onClick={onAction}>{action}</button>}
      </div>
    </div>
  )
}

function EditField({ label, children, onSave, onCancel, busy }) {
  return (
    <div className="settings-edit">
      <span className="settings-row-label">{label}</span>
      <div className="settings-edit-fields">{children}</div>
      <div className="settings-edit-actions">
        <button type="button" className="settings-save" onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="settings-link" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </div>
  )
}

/* ---------- Orders ---------- */
// Fetches the signed-in user's orders and shows either the list or one order.
function OrdersPanel({ orderId, onOpen, onBack }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/user/payments/orders', { auth: 'user' })
      .then((d) => setOrders(d.orders || []))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="card settings-card">
      {error && <p className="settings-alert settings-alert--error">{error}</p>}
      {orders == null ? (
        <p className="settings-muted">Loading…</p>
      ) : orderId ? (
        <OrderDetail order={orders.find((o) => o.id === orderId)} onBack={onBack} />
      ) : (
        <OrdersList orders={orders} onOpen={onOpen} />
      )}
    </div>
  )
}

function OrdersList({ orders, onOpen }) {
  if (!orders.length) {
    return (
      <>
        <h3 className="settings-section-title">Orders</h3>
        <p className="settings-muted">
          You haven't placed any orders yet. <Link to="/skill-build/nirmaan">Explore Nirmaan →</Link>
        </p>
      </>
    )
  }
  return (
    <>
      <h3 className="settings-section-title">Orders</h3>
      <ul className="orders-list">
        {orders.map((o) => (
          <li key={o.id}>
            <button type="button" className="order-row" onClick={() => onOpen(o.id)}>
              <span className="order-row-main">
                <span className="order-row-item">{o.item}</span>
                <span className="order-row-meta">{o.receiptNo || 'Pending'} · {fmtDate(o.createdAt)}</span>
              </span>
              <span className="order-row-side">
                <span className="order-amount">{money(o.amount)}</span>
                <OrderStatus status={o.status} />
                <span className="order-chevron" aria-hidden>›</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function OrderDetail({ order, onBack }) {
  const { user } = useAuth()
  if (!order) {
    return (
      <div className="order-detail">
        <button type="button" className="settings-link order-back" onClick={onBack}>‹ Back to orders</button>
        <p className="settings-muted">That order could not be found.</p>
      </div>
    )
  }

  const { product, pkg } = splitItem(order.item)
  const listPrice = order.listPrice ?? order.basePrice ?? order.amount
  const earlyBird = order.earlyBirdApplied && order.basePrice != null ? listPrice - order.basePrice : 0

  return (
    <div className="order-detail">
      <button type="button" className="settings-link order-back" onClick={onBack}>‹ Back to orders</button>

      <div className="order-detail-head">
        <h3 className="settings-section-title">{order.item}</h3>
        <OrderStatus status={order.status} />
      </div>

      {/* Order + product details */}
      <div className="settings-rows">
        <ViewRow label="Receipt No" value={order.receiptNo || '—'} />
        <ViewRow label="Date" value={fmtDate(order.paidAt || order.createdAt)} />
        <ViewRow label="Product" value={product} />
        {pkg && <ViewRow label="Package" value={`${pkg}${order.isUpgrade ? ' (upgrade)' : ''}`} />}
        <ViewRow label="Payment" value={`${order.currency || 'INR'} · ${(order.status || '').toUpperCase()}`} />
      </div>

      {/* Price breakdown */}
      <div className="order-breakdown">
        <BreakRow label="Package price" value={money(listPrice)} />
        {earlyBird > 0 && <BreakRow label="Early-bird discount" value={'– ' + money(earlyBird)} good />}
        {order.discount > 0 && (
          <BreakRow label={`Coupon ${order.couponCode || ''}`.trim()} value={'– ' + money(order.discount)} good />
        )}
        {order.isUpgrade && order.creditApplied > 0 && (
          <BreakRow label="Upgrade credit (already paid)" value={'– ' + money(order.creditApplied)} good />
        )}
        <BreakRow label="Total paid" value={money(order.amount)} total />
      </div>

      <div className="order-detail-actions">
        <button type="button" className="btn btn-primary" onClick={() => openInvoice(order, user)}>
          Download invoice
        </button>
      </div>
    </div>
  )
}

function BreakRow({ label, value, good, total }) {
  return (
    <div className={`order-break-row${total ? ' order-break-total' : ''}`}>
      <span>{label}</span>
      <span className={good ? 'order-break-good' : ''}>{value}</span>
    </div>
  )
}

function OrderStatus({ status }) {
  const map = {
    paid: ['ok', 'Paid'],
    refunded: ['muted', 'Refunded'],
    failed: ['warn', 'Failed'],
    created: ['warn', 'Pending'],
  }
  const [cls, label] = map[status] || ['muted', status]
  return <span className={`settings-badge settings-badge--${cls}`}>{label}</span>
}
