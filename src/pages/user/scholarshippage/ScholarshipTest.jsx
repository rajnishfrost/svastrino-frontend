import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../../api/client.js'
import './Scholarship.css'

const countWords = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length
// Keep a typed answer within its word limit (trims extra words as you go).
const capWords = (s, max) => {
  const parts = String(s).split(/(\s+)/) // keep separators so typing spaces feels natural
  let words = 0, out = ''
  for (const p of parts) {
    if (/\s+/.test(p)) { out += p; continue }
    if (p === '') continue
    if (words >= max) break
    out += p; words += 1
  }
  return out
}

/**
 * Timed Nirmaan scholarship test. Starts an attempt on mount, counts down to the
 * server-provided deadline, auto-submits at zero, and shows the score. Questions
 * are open-ended: the student types an answer (word-limited) that is AI-graded on
 * submit. Guarded by ProtectedRoute (logged in + enrolled + within the window).
 */
export default function ScholarshipTest() {
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // loading | taking | grading | done | error
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) // { questionId: text }
  const [deadline, setDeadline] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null)
  // The paper belongs to the student's organisation, so its title and
  // instructions come from their cycle rather than being hard-coded here.
  const [paper, setPaper] = useState({ title: '', instructions: '' })
  const submittingRef = useRef(false)

  useEffect(() => {
    document.body.classList.add('theme-nirmaan')
    return () => document.body.classList.remove('theme-nirmaan')
  }, [])

  useEffect(() => {
    api('/user/scholarship/attempt/start', { method: 'POST', auth: 'user', body: {} })
      .then((d) => {
        setQuestions(d.questions)
        setDeadline(d.deadline)
        setPaper({ title: d.title || '', instructions: d.instructions || '' })
        setState('taking')
      })
      .catch((e) => { setError(e.message); setState('error') })
  }, [])

  // Countdown → auto-submit at zero.
  useEffect(() => {
    if (state !== 'taking' || !deadline) return
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now()
      setRemaining(Math.max(0, ms))
      if (ms <= 0) submit()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, deadline])

  const submit = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setState('grading')
    try {
      const payload = questions.map((q) => ({ question: q.id, text: answers[q.id] || '' }))
      const d = await api('/user/scholarship/attempt/submit', { method: 'POST', auth: 'user', body: { answers: payload } })
      setResult(d); setState('done')
    } catch (e) { setError(e.message); setState('error') }
  }

  const mmss = (ms) => {
    const s = Math.floor(ms / 1000); const m = Math.floor(s / 60)
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }
  const answeredCount = questions.filter((q) => countWords(answers[q.id]) > 0).length

  if (state === 'loading') return <div className="scholarship-page"><div className="container section"><p>Starting your test…</p></div></div>

  if (state === 'grading') {
    return (
      <div className="scholarship-page"><div className="container section">
        <div className="card sch-panel sch-thanks">
          <h2>Grading your answers…</h2>
          <p>Our AI is reading your responses. This takes a few seconds — please don’t close this page.</p>
        </div>
      </div></div>
    )
  }

  if (state === 'error') {
    return (
      <div className="scholarship-page"><div className="container section">
        <div className="card sch-panel">
          <h2>Can’t start the test</h2>
          <p className="sch-error">{error}</p>
          <Link to="/nirmaan-scholarship" className="btn btn-primary">Back to scholarship</Link>
        </div>
      </div></div>
    )
  }

  if (state === 'done') {
    return (
      <div className="scholarship-page"><div className="container section">
        <div className="card sch-panel sch-thanks">
          <h2>Test submitted ✓</h2>
          <p className="sch-score">{result.score} <span>/ {result.total}</span></p>
          <p>Your answers are locked in. Winners are announced after the test window closes — best of luck!</p>
          <button className="btn btn-primary btn-large" onClick={() => navigate('/nirmaan-scholarship')}>Done</button>
        </div>
      </div></div>
    )
  }

  const low = remaining < 60 * 1000
  return (
    <div className="scholarship-page sch-test">
      <div className="sch-test-bar">
        <div className="container sch-test-bar-inner">
          <span>Question progress: <strong>{answeredCount}/{questions.length}</strong></span>
          <span className={`sch-timer${low ? ' low' : ''}`}>⏱ {mmss(remaining)}</span>
        </div>
      </div>

      <div className="container section">
        {(paper.title || paper.instructions) && (
          <div className="card sch-panel sch-paper-head">
            {paper.title && <h2>{paper.title}</h2>}
            {paper.instructions && <p>{paper.instructions}</p>}
          </div>
        )}

        {questions.map((q, i) => {
          const max = q.maxWords || 1000
          const used = countWords(answers[q.id])
          return (
            <div key={q.id} className="card sch-panel sch-q">
              <h3><span className="sch-q-n">{i + 1}</span> {q.prompt}</h3>
              <textarea
                className="sch-answer"
                rows={6}
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: capWords(e.target.value, max) }))}
                placeholder="Type your answer in your own words…"
              />
              <div className={`sch-wordcount${used >= max ? ' at-limit' : ''}`}>
                {used} / {max} words{used >= max ? ' · limit reached' : ''}
              </div>
            </div>
          )
        })}

        <div className="sch-submit-row">
          <button className="btn btn-primary btn-large" onClick={submit}>Submit test</button>
          <span className="sch-note">You can submit anytime; the test auto-submits when the timer ends. Answers are AI-graded.</span>
        </div>
      </div>
    </div>
  )
}
