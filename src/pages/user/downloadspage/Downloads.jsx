import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDownloads, removeDownload, storageEstimate, fmtMB } from '../../../utils/offlineVideo.js'
import './Downloads.css'

/**
 * Videos saved for offline viewing. Everything here comes from localStorage +
 * Cache Storage, so the page renders with **no network at all** — that's the
 * whole point: a student with no internet can find and play what they saved.
 */
const fmtDate = (ms) =>
  ms ? new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export default function Downloads() {
  const [items, setItems] = useState([])
  const [usage, setUsage] = useState(null)

  const refresh = () => {
    setItems(listDownloads())
    storageEstimate().then(setUsage)
  }
  useEffect(() => { refresh() }, [])

  const remove = async (url) => {
    if (!confirm('Remove this download? You can save it again later.')) return
    await removeDownload(url)
    refresh()
  }

  return (
    <section className="section">
      <div className="container dl-wrap">
        <header className="dl-head">
          <div>
            <h1>My downloads</h1>
            <p className="dl-sub">
              Saved inside this site — they play without internet and are never stored as a file on your device.
            </p>
          </div>
          {usage?.usage ? (
            <span className="dl-usage">{fmtMB(usage.usage)} used</span>
          ) : null}
        </header>

        {items.length === 0 ? (
          <div className="card dl-empty">
            <p>Nothing saved yet.</p>
            <p className="dl-sub">
              Open a session and tap <strong>“⤓ Save for offline”</strong> under the video to keep it for later.
            </p>
            <Link to="/dashboard" className="btn btn-primary">Go to my courses</Link>
          </div>
        ) : (
          <ul className="dl-list">
            {items.map((d) => (
              <li key={d.url} className="card dl-item">
                <div className="dl-item-main">
                  {/* Older downloads (saved before we stored details) have no title. */}
                  <h3 className="dl-item-title">{d.title || 'Saved video'}</h3>
                  <p className="dl-item-meta">
                    {d.course ? `${d.course} · ` : ''}
                    {d.height ? `${d.height}p` : 'original quality'}
                    {d.bytes ? ` · ${fmtMB(d.bytes)}` : ''}
                    {d.durationMins ? ` · ${d.durationMins} min` : ''}
                    {d.at ? ` · saved ${fmtDate(d.at)}` : ''}
                  </p>
                  {!d.title && (
                    <p className="dl-item-hint">Save it again to show its name here.</p>
                  )}
                </div>
                <div className="dl-item-actions">
                  {d.slug && <Link to={`/learn/${d.slug}`} className="btn btn-primary dl-play">Play</Link>}
                  <button type="button" className="dl-remove" onClick={() => remove(d.url)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
