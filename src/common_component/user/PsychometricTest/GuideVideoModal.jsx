import { useEffect, useRef, useState } from 'react'
import HlsPlayer from '../../../pages/user/learnpage/HlsPlayer.jsx'
import TestProgress from './TestProgress.jsx'
import PreTestGuide from './PreTestGuide.jsx'

/**
 * The pop-up just before the student leaves for the test site: how to take the
 * test, or how to open the report once it is done.
 *
 * Two sides, switched by a toggle at the top:
 *   - the video (`src`, set in Admin → Settings) — labelled `firstLabel`,
 *     "Video" before the test and "Result" before the report. Without a video
 *     it shows `steps` instead, so it is never an empty frame;
 *   - the pre-test guide for the student's own test (`testType`: Stream or
 *     Career Selector), with a PDF link when Admin → Settings has one.
 *
 * Before the test with no video set, there is nothing to switch between, so
 * the guide shows on its own.
 *
 * One action: "Continue", which carries on to the test site whether or not
 * anything was watched or read — nothing here is enforced. Esc or a click
 * outside quietly goes back to the card.
 */
export default function GuideVideoModal({
  src, steps = [], progress = null, title, sub, onContinue, onClose,
  firstLabel = 'Video', alwaysTabs = false, testType = null, pdf = null,
}) {
  const videoRef = useRef(null)
  const [tab, setTab] = useState('first')
  const tabs = alwaysTabs || !!src

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = () => {
    videoRef.current?.pause()
    onContinue()
  }

  const choose = (next) => {
    if (next !== 'first') videoRef.current?.pause()
    setTab(next)
  }

  // The first side: the player, or the steps while no video is set. Kept
  // mounted while the guide shows, so switching back resumes it.
  const firstSide = src ? (
    <div className="ptest-guide-player">
      <HlsPlayer src={src} videoRef={videoRef} />
    </div>
  ) : (
    <ol className="ptest-guide-steps">
      {steps.map((step, i) => <li key={i}>{step}</li>)}
    </ol>
  )

  const guideSide = (
    <>
      {pdf && (
        <a className="ptest-guide-pdf-link" href={pdf} target="_blank" rel="noopener noreferrer">
          Download this guide as a PDF
        </a>
      )}
      <PreTestGuide testType={testType} />
    </>
  )

  return (
    <div
      className="ptest-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-video-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="ptest-modal-card ptest-guide ptest-guide--tabs">
        <h3 id="guide-video-title">{title}</h3>
        {sub && <p>{sub}</p>}
        {/* A student coming back to an unfinished test sees how far they got. */}
        {progress != null && <TestProgress percent={progress} />}

        {tabs ? (
          <>
            <div className="ptest-switch" role="tablist" aria-label="Guide">
              <span className={`ptest-switch-thumb${tab === 'guide' ? ' is-right' : ''}`} aria-hidden />
              <button
                type="button" role="tab" id="guide-tab-first" aria-controls="guide-panel-first"
                aria-selected={tab === 'first'}
                className={`ptest-switch-opt${tab === 'first' ? ' is-on' : ''}`}
                onClick={() => choose('first')}
              >
                <svg viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
                {firstLabel}
              </button>
              <button
                type="button" role="tab" id="guide-tab-guide" aria-controls="guide-panel-guide"
                aria-selected={tab === 'guide'}
                className={`ptest-switch-opt${tab === 'guide' ? ' is-on' : ''}`}
                onClick={() => choose('guide')}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M14 3v5h5M9 13h6M9 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Test guide
              </button>
            </div>

            <div id="guide-panel-first" role="tabpanel" aria-labelledby="guide-tab-first"
                 className="ptest-guide-panel" hidden={tab !== 'first'}>
              {firstSide}
            </div>
            <div id="guide-panel-guide" role="tabpanel" aria-labelledby="guide-tab-guide"
                 className="ptest-guide-panel" hidden={tab !== 'guide'}>
              {guideSide}
            </div>
          </>
        ) : guideSide}

        <div className="ptest-modal-actions ptest-guide-actions">
          <button type="button" className="btn btn-primary" onClick={go}>Continue</button>
        </div>
      </div>
    </div>
  )
}
