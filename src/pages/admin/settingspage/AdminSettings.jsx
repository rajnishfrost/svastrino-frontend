import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'

/**
 * Site settings — the switches the team can change without a deploy.
 * Superadmin only, matching the API.
 */
export default function AdminSettings() {
  const [settings, setSettings] = useState(null)
  const [enquiryTo, setEnquiryTo] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () =>
    api('/admin/settings', { auth: 'admin' })
      .then((d) => { setSettings(d.settings); setEnquiryTo(d.settings.enquiryTo || '') })
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setMsg('')
    try {
      const d = await api('/admin/settings', {
        method: 'PATCH', auth: 'admin', body: { enquiryTo: enquiryTo.trim() },
      })
      setSettings(d.settings)
      setEnquiryTo(d.settings.enquiryTo || '')
      setMsg('Saved. New enquiries will go to this address from now on.')
    } catch (ex) {
      setError(ex.message)
    } finally {
      setBusy(false)
    }
  }

  if (!settings && !error) return <p className="adm-sub">Loading…</p>

  const usingFallback = settings && !settings.enquiryTo && settings.effectiveEnquiryTo

  return (
    <>
      <div className="adm-toolbar">
        <div>
          <h1 className="adm-title">Settings</h1>
          <p className="adm-sub">Site-wide options you can change without a deploy.</p>
        </div>
      </div>

      {error && <p className="adm-error">{error}</p>}
      {msg && <p className="adm-ok">{msg}</p>}

      <section className="adm-panel">
        <h2 className="adm-title">Enquiry notifications</h2>
        <p className="adm-sub">
          Where enquiries from the Contact page and the home-page form are emailed.
          Separate several addresses with commas.
        </p>

        <form onSubmit={save}>
          <div className="adm-field">
            <label className="adm-label" htmlFor="enquiryTo">Send enquiries to</label>
            <input
              id="enquiryTo"
              className="adm-input"
              type="text"
              value={enquiryTo}
              onChange={(e) => setEnquiryTo(e.target.value)}
              placeholder="enquiries@svastrino.com, rohit@svastrino.com"
            />
          </div>

          {usingFallback && (
            <p className="adm-sub">
              Nothing set here yet, so enquiries currently go to{' '}
              <strong>{settings.effectiveEnquiryTo}</strong> — the address configured on
              the server.
            </p>
          )}

          <button className="adm-btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>

        <p className="adm-sub" style={{ marginTop: 'var(--space-3)' }}>
          Every enquiry is also stored in the database, so nothing is lost even if an
          email fails to send.
        </p>
      </section>
    </>
  )
}
