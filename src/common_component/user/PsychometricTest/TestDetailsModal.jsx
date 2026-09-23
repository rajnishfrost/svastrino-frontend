import { useState } from 'react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { api } from '../../../api/client.js'
import { useAuth } from '../../../context/AuthContext.jsx'
import { PSYCHOMETRIC_CLASSES as TEST_CLASSES } from '../../../utils/studentClass.js'
import { sanitisePhone, checkPhone } from '../../../utils/validate.js'

/**
 * Asked for just before the psychometric test opens, when the account is
 * missing what the test needs: the class (which picks the test) and a phone
 * number. Only the missing fields are shown. Saving writes them to the profile
 * — the same PATCH /user/profile the Settings page uses — and the caller then
 * carries straight on to the test, so the student is not sent off to Settings
 * and left to find their way back.
 *
 * `needs`: the server's list, any of 'studentClass' and 'phone'.
 */
export default function TestDetailsModal({ needs = [], onSaved, onCancel }) {
  const { user, refresh } = useAuth()
  const askClass = needs.includes('studentClass')
  const askPhone = needs.includes('phone')

  // Keep a class already on the profile if it is one the test takes; anything
  // else ('1st Year Undergraduate', a typo from an import) starts blank.
  const [studentClass, setStudentClass] = useState(
    TEST_CLASSES.includes(user?.studentClass) ? user.studentClass : ''
  )
  const [phone, setPhone] = useState(user?.phone || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const title = askClass && askPhone
    ? 'Add your class and phone number'
    : askClass ? 'Which class are you in?' : 'Add your phone number'

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    const body = {}
    if (askClass) {
      if (!studentClass) return setErr('Please choose your class.')
      body.studentClass = studentClass
    }
    if (askPhone) {
      // PhoneInput writes its dial code into an empty field, which is not a
      // number — same handling as the Settings page.
      const typed = sanitisePhone(phone).replace(/^\+\d{1,4}$/, '')
      const bad = checkPhone(typed, { required: true })
      if (bad) return setErr(bad)
      body.phone = typed
    }
    setBusy(true)
    try {
      await api('/user/profile', { method: 'PATCH', auth: 'user', body })
      await refresh() // Settings and the navbar see the new details too
      onSaved()
    } catch (e2) {
      setErr(e2.message)
      setBusy(false)
    }
  }

  return (
    <div className="ptest-modal" role="dialog" aria-modal="true" aria-labelledby="test-details-title">
      <form className="ptest-modal-card ptest-details" onSubmit={save} noValidate>
        <h3 id="test-details-title">{title}</h3>
        <p>
          We need {askClass && askPhone ? 'these' : 'this'} before your psychometric test can open.
          You can change {askClass && askPhone ? 'them' : 'it'} later in Settings.
        </p>

        {askClass && (
          <label className="ptest-details-field">
            <span className="ptest-details-label">Class</span>
            <select
              className="ptest-details-input"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              autoFocus
            >
              <option value="" disabled>Choose your class</option>
              {TEST_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="ptest-details-hint">
              The test is different for Classes 7–9 and Classes 10–12.
            </span>
          </label>
        )}

        {askPhone && (
          <div className="ptest-details-field">
            <span className="ptest-details-label">Phone number</span>
            <PhoneInput
              defaultCountry="in"
              value={phone}
              onChange={setPhone}
              className="phone-intl"
              inputClassName="phone-intl-input"
              countrySelectorStyleProps={{ buttonClassName: 'phone-intl-btn' }}
              inputProps={{ autoFocus: !askClass, 'aria-label': 'Phone number' }}
            />
          </div>
        )}

        {err && <p className="ptest-err">{err}</p>}

        <div className="ptest-modal-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save and take the test'}
          </button>
          <button type="button" className="settings-link" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
