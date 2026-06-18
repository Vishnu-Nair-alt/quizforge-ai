import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Loader2, LogOut, Radio, RefreshCw, Send } from 'lucide-react'
import { sessionApi } from '../services/sessionApi'

function JoinSessionPage({ user, onNavigate, onLogout }) {
  const [form, setForm] = useState({ code: '', name: user?.name || '' })
  const [participant, setParticipant] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

  const code = form.code.trim().toUpperCase()

  useEffect(() => {
    if (!participant || quiz || result) return undefined

    async function checkStatus() {
      try {
        const status = await sessionApi.status(code)
        setSessionStatus(status)
        if (status.status === 'active') {
          setQuiz(await sessionApi.questions(code, participant))
        }
      } catch (err) {
        setError(err.message)
      }
    }

    const timer = window.setInterval(checkStatus, 3000)
    return () => window.clearInterval(timer)
  }, [code, participant, quiz, result])

  async function joinSession(event) {
    event.preventDefault()
    setLoading('join')
    setError('')
    try {
      const joined = await sessionApi.join(code, form.name.trim())
      setParticipant(joined)
      setSessionStatus(await sessionApi.status(code))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function checkNow() {
    setLoading('check')
    setError('')
    try {
      const status = await sessionApi.status(code)
      setSessionStatus(status)
      if (status.status === 'active') {
        setQuiz(await sessionApi.questions(code, participant))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function submitAnswers() {
    setLoading('submit')
    setError('')
    try {
      await sessionApi.submit(
        code,
        participant,
        Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
          question_index: Number(questionIndex),
          selected_answer: selectedAnswer,
        })),
      )
      setResult(await sessionApi.myResult(code, participant))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar simple-topbar">
        <div className="brand-block">
          <p className="eyebrow">Live quiz</p>
          <h1>Join Session</h1>
          <p className="signature-line">Enter a session code and display name.</p>
        </div>
        <div className="topbar-actions">
          <button className="icon-text-button" type="button" onClick={() => onNavigate('quizzes')}>
            <ArrowLeft size={16} /> {user ? 'Back to quizzes' : 'Back to login'}
          </button>
          {user && <button className="icon-text-button" type="button" onClick={onLogout}><LogOut size={16} /> Logout</button>}
        </div>
      </header>

      <section className="simple-page">
        {error && <p className="status error">{error}</p>}

        {!participant ? (
          <form className="simple-card join-card-simple" onSubmit={joinSession}>
            <Radio size={28} />
            <h2>Join a live quiz</h2>
            <label>
              Session code
              <input
                className="code-input-simple"
                value={form.code}
                maxLength={6}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                placeholder="ABC123"
                required
              />
            </label>
            <label>
              Display name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Your name"
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={code.length !== 6 || !form.name.trim() || loading === 'join'}>
              {loading === 'join' ? <Loader2 className="spin" size={17} /> : <Radio size={17} />}
              Join Session
            </button>
            <p className="empty-copy">{user ? 'Joining as a logged-in user.' : 'Guest participants do not need an account.'}</p>
          </form>
        ) : result ? (
          <div className="simple-card result-card-simple">
            <Check size={30} />
            <p className="eyebrow">Quiz complete</p>
            <h2>{result.display_name}, your score is</h2>
            <strong>{result.score} / {result.total_questions}</strong>
            <p>{result.total_questions ? Math.round((result.score / result.total_questions) * 100) : 0}% correct</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>Join Another Session</button>
          </div>
        ) : !quiz ? (
          <div className="simple-card waiting-card">
            <Loader2 className="spin" size={28} />
            <p className="eyebrow">You joined successfully</p>
            <h2>Waiting for the host to start</h2>
            <p>{sessionStatus?.quiz_title || 'Your quiz'} will appear automatically.</p>
            <button className="icon-text-button" type="button" onClick={checkNow} disabled={loading === 'check'}>
              <RefreshCw size={16} /> Check now
            </button>
          </div>
        ) : (
          <div className="participant-quiz">
            <div className="simple-card quiz-intro">
              <p className="eyebrow">Session {code}</p>
              <h2>{quiz.quiz_title}</h2>
              <p>{Object.keys(answers).length} of {quiz.questions.length} answered</p>
            </div>
            {quiz.questions.map((question, index) => (
              <div className="simple-card participant-question" key={question.question_index}>
                <p className="eyebrow">Question {index + 1}</p>
                <h3>{question.question}</h3>
                <div className="participant-options">
                  {question.options.map((option) => (
                    <button
                      className={answers[question.question_index] === option ? 'selected' : ''}
                      type="button"
                      key={option}
                      onClick={() => setAnswers({ ...answers, [question.question_index]: option })}
                    >
                      {answers[question.question_index] === option && <Check size={16} />}
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="primary-button submit-answers" type="button" disabled={Object.keys(answers).length !== quiz.questions.length || loading === 'submit'} onClick={submitAnswers}>
              {loading === 'submit' ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
              Submit Answers
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default JoinSessionPage
