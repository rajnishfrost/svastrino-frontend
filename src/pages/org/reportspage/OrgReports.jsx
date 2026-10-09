import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../../admin/adminShared.css'

/**
 * Student Reports — the institute's own admin on the assessment site
 * (assessment.svastrino.com/admin), inside this panel.
 *
 * On opening, our server signs the institute in to Mindler with the login our
 * admin saved for it (Mindler's adminLogin), and the result is stored the way
 * Mindler's own admin login form stores it, key for key, before the frame
 * loads their admin home.
 */

// What Mindler's admin login form keeps in local storage, and from where in
// the login response (read from their admin app, 2026-10-09).
function storeLikeMindler({ session, token, role, customizations: c = {} }) {
  try {
    if (role) localStorage.setItem('role_id', String(role))
    localStorage.setItem('customization', JSON.stringify(c.profileSections))
    localStorage.setItem('dashboardCustomization', JSON.stringify(c.dashboardSection))
    localStorage.setItem('reportCustomization', JSON.stringify(c.reportSection))
    localStorage.setItem('languagesCustomization', JSON.stringify(c.languages))
    localStorage.setItem('admin_key', session)
    localStorage.setItem('admin_token', token)
  } catch {
    // Storage blocked (private window, site data off): the frame still loads.
  }
}

export default function OrgReports() {
  const [m, setM] = useState(null)               // { connected, loginId, adminUrl }
  const [step, setStep] = useState('signing-in') // → 'loading' → 'ready'
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const { mindler } = await api('/org/reports', { auth: 'user' })
        if (!live) return
        setM(mindler)
        if (!mindler.connected) return
        storeLikeMindler(await api('/org/reports/mindler-login', { method: 'POST', auth: 'user' }))
        if (live) setStep('loading')
      } catch (e) {
        if (live) { setError(e.message); setStep('loading') }
      }
    })()
    return () => { live = false }
  }, [])

  const showFrame = m?.connected && step !== 'signing-in'

  return (
    <div>
      <h1 className="adm-title">Student Reports</h1>
      {error && <p className="adm-error">{error}</p>}

      {m && !m.connected ? (
        <p className="adm-sub">
          Your account on the assessment site is not set up yet. The Svastrino team will let you know once it is.
        </p>
      ) : (
        <div className="org-reports-wrap">
          {/* The frame only starts loading once the sign-in has finished. */}
          {showFrame && (
            <iframe title="Student reports" src={`${m.adminUrl}/home`} className="adm-mindler-frame org-reports-frame"
                    onLoad={() => setStep('ready')} />
          )}
          {step !== 'ready' && (
            <div className={`org-reports-load${showFrame ? '' : ' org-reports-load--alone'}`}
                 role="status" aria-live="polite">
              <div className="org-reports-spinner" aria-hidden />
              <p className="org-reports-load-title">
                {step === 'signing-in' ? 'Signing you in to the assessment site' : 'Opening your student reports'}
              </p>
              <p className="org-reports-load-sub">This takes a few seconds — please keep this page open.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
