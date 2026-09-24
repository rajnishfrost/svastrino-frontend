import { useEffect, useRef } from 'react'
import HlsPlayer from '../../../pages/user/learnpage/HlsPlayer.jsx'
import TestProgress from './TestProgress.jsx'

/**
 * A short how-to video played just before the student leaves for the test
 * site: how to take the test, or how to find the report once it is done. The
 * links are set in Admin → Settings. Until one is set, `steps` stands in for
 * the video, so the pop-up is never an empty frame.
 *
 * One action: "Continue", which carries on to the test site whether or not
 * the video was watched — nothing here is enforced, and the student can seek
 * anywhere. Esc or a click outside quietly goes back to the card.
 */
export default function GuideVideoModal({ src, steps = [], progress = null, title, sub, onContinue, onClose }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = () => {
    videoRef.current?.pause()
    onContinue()
  }

  return (
    <div
      className="ptest-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-video-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="ptest-modal-card ptest-guide">
        <h3 id="guide-video-title">{title}</h3>
        {sub && <p>{sub}</p>}
        {/* A student coming back to an unfinished test sees how far they got. */}
        {progress != null && <TestProgress percent={progress} />}

        {src ? (
          <div className="ptest-guide-player">
            <HlsPlayer src={src} videoRef={videoRef} />
          </div>
        ) : (
          <ol className="ptest-guide-steps">
            {steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        )}

        <div className="ptest-modal-actions ptest-guide-actions">
          <button type="button" className="btn btn-primary" onClick={go}>Continue</button>
        </div>
      </div>
    </div>
  )
}
