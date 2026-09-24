import { useEffect, useState } from 'react'
import { api } from '../../../api/client.js'
import '../adminShared.css'
import { LIMITS } from '../../../utils/validate.js'

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
  // The two psychometric guide videos (links to the uploaded video).
  const [videos, setVideos] = useState({ psychometricTestVideo: '', psychometricReportVideo: '' })
  const [videoMsg, setVideoMsg] = useState('')
  const [videoErr, setVideoErr] = useState('')
  const [videoBusy, setVideoBusy] = useState(false)

  const takeVideos = (st) => setVideos({
    psychometricTestVideo: st.psychometricTestVideo || '',
    psychometricReportVideo: st.psychometricReportVideo || '',
  })

  const load = () =>
    api('/admin/settings', { auth: 'admin' })
      .then((d) => { setSettings(d.settings); setEnquiryTo(d.settings.enquiryTo || ''); takeVideos(d.settings) })
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

  const saveVideos = async (e) => {
    e.preventDefault()
    setVideoBusy(true); setVideoErr(''); setVideoMsg('')
    try {
      const d = await api('/admin/settings', {
        method: 'PATCH', auth: 'admin',
        body: {
          psychometricTestVideo: videos.psychometricTestVideo.trim(),
          psychometricReportVideo: videos.psychometricReportVideo.trim(),
        },
      })
      setSettings(d.settings)
      takeVideos(d.settings)
      setVideoMsg('Saved. Students see the new videos the next time they open the test.')
    } catch (ex) {
      setVideoErr(ex.message)
    } finally {
      setVideoBusy(false)
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
            {/* Ten addresses is what the server accepts on this list, and each
                one is held to the site's email rule — so the cap here is ten of
                the longest address there can be, plus the separators. */}
            <input
              id="enquiryTo"
              className="adm-input"
              type="text"
              maxLength={(LIMITS.email + 2) * 10}
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

      <section className="adm-panel" style={{ marginTop: 'var(--space-4)' }}>
        <h2 className="adm-title">Psychometric test videos</h2>
        <p className="adm-sub">
          Short how-to videos that play in a pop-up just before a student leaves for the test
          site. Paste the link to the uploaded video: the .m3u8 stream link, or an .mp4.
          Students can skip or scrub them freely. Leave a box empty and that video is skipped.
        </p>

        {videoErr && <p className="adm-error">{videoErr}</p>}
        {videoMsg && <p className="adm-ok">{videoMsg}</p>}

        <form onSubmit={saveVideos}>
          <div className="adm-field">
            <label className="adm-label" htmlFor="psychometricTestVideo">
              How to take the test (plays before “Take the test”)
            </label>
            <input
              id="psychometricTestVideo"
              className="adm-input"
              type="text"
              maxLength={LIMITS.url}
              value={videos.psychometricTestVideo}
              onChange={(e) => setVideos((v) => ({ ...v, psychometricTestVideo: e.target.value }))}
              placeholder="https://…/psychometric/how-to-take/master.m3u8"
            />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="psychometricReportVideo">
              How to see your report (plays before “See your report”, once the test is done)
            </label>
            <input
              id="psychometricReportVideo"
              className="adm-input"
              type="text"
              maxLength={LIMITS.url}
              value={videos.psychometricReportVideo}
              onChange={(e) => setVideos((v) => ({ ...v, psychometricReportVideo: e.target.value }))}
              placeholder="https://…/psychometric/how-to-read-report/master.m3u8"
            />
          </div>
          <button className="adm-btn" disabled={videoBusy}>
            {videoBusy ? 'Saving…' : 'Save videos'}
          </button>
        </form>
      </section>
    </>
  )
}
