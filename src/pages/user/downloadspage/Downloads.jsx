import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { listDownloads, removeDownload, storageEstimate, fmtMB } from '../../../utils/offlineVideo.js'

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
    <section className="bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-4xl">
        <header className="flex flex-col gap-3 border-b border-brand-navy/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-navy">My downloads</h1>
            <p className="mt-2 max-w-xl text-sm text-brand-slate">
              Saved inside this site — they play without internet and are never stored as a file on your device.
            </p>
          </div>
          {usage?.usage ? (
            <span className="inline-flex w-fit shrink-0 rounded-full bg-brand-crimson/10 px-3 py-1 text-xs font-semibold text-brand-crimson">
              {fmtMB(usage.usage)} used
            </span>
          ) : null}
        </header>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-brand-navy/5 bg-white p-10 text-center shadow-sm">
            <p className="font-display text-lg font-bold text-brand-navy">Nothing saved yet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-brand-slate">
              Open a session and tap <strong className="font-semibold text-brand-navy">“⤓ Save for offline”</strong> under the video to keep it for later.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand-crimson px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
            >
              Go to my courses
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {items.map((d) => (
              <li
                key={d.url}
                className="flex flex-col gap-4 rounded-xl border border-brand-navy/5 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  {/* Older downloads (saved before we stored details) have no title. */}
                  <h3 className="font-display text-base font-bold text-brand-navy">{d.title || 'Saved video'}</h3>
                  <p className="mt-1 text-sm text-brand-slate">
                    {d.course ? `${d.course} · ` : ''}
                    {d.height ? `${d.height}p` : 'original quality'}
                    {d.bytes ? ` · ${fmtMB(d.bytes)}` : ''}
                    {d.durationMins ? ` · ${d.durationMins} min` : ''}
                    {d.at ? ` · saved ${fmtDate(d.at)}` : ''}
                  </p>
                  {!d.title && <p className="mt-1 text-xs italic text-brand-slate">Save it again to show its name here.</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {d.slug && (
                    <Link
                      to={`/learn/${d.slug}`}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-crimson px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-crimson-dark"
                    >
                      <Play className="size-4 fill-current" /> Play
                    </Link>
                  )}
                  <button
                    type="button"
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-brand-navy/15 bg-white px-4 text-sm font-semibold text-brand-navy transition-colors hover:border-red-300 hover:text-red-600"
                    onClick={() => remove(d.url)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
