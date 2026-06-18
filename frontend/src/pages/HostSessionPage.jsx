import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Copy, Loader2, LogOut, Play, Radio, RefreshCw, Square, Users } from 'lucide-react'
import { apiRequest } from '../services/api'
import { sessionApi } from '../services/sessionApi'

function HostSessionPage({ user, onNavigate, onLogout }) {
  const [quizzes, setQuizzes] = useState([])
  const [quizId, setQuizId] = useState('')
  const [session, setSession] = useState(null)
  const [lobby, setLobby] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState('quizzes')
  const [error, setError] = useState('')
  const sessionCode = session?.session_code

  useEffect(() => {
    apiRequest('/quizzes')
      .then((data) => setQuizzes(data.quizzes || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(''))
  }, [])

  const refreshSession = useCallback(async () => {
    if (!sessionCode) return

    try {
      const lobbyData = await sessionApi.lobby(sessionCode)
      setLobby(lobbyData)
      setSession((current) => ({ ...current, status: lobbyData.status }))

      if (lobbyData.status !== 'waiting') {
        const resultData = await sessionApi.results(sessionCode)
        setResults(resultData.results || [])
      }
    } catch (err) {
      setError(err.message)
    }
  }, [sessionCode])

  useEffect(() => {
    if (!sessionCode) return undefined
    const timer = window.setInterval(refreshSession, 4000)
    return () => window.clearInterval(timer)
  }, [sessionCode, refreshSession])

  async function createSession() {
    setLoading('create')
    setError('')
    try {
      const data = await sessionApi.create(quizId)
      setSession(data)
      const lobbyData = await sessionApi.lobby(data.session_code)
      setLobby(lobbyData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function updateStatus(action) {
    setLoading(action)
    setError('')
    try {
      const data =
        action === 'start'
          ? await sessionApi.start(session.session_code)
          : await sessionApi.end(session.session_code)
      setSession((current) => ({ ...current, ...data }))
      await refreshSession()
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
          <h1>Host Session</h1>
          <p className="signature-line">Choose a saved quiz and invite participants.</p>
        </div>
        <div className="topbar-actions">
          <button className="icon-text-button" type="button" onClick={() => onNavigate('quizzes')}>
            <BookOpen size={16} /> Quizzes
          </button>
          <button className="icon-text-button" type="button" onClick={() => onNavigate('join')}>
            Join
          </button>
          <div className="user-chip"><span>{user.name}</span><strong>{user.email}</strong></div>
          <button className="icon-text-button" type="button" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <section className="simple-page">
        {error && <p className="status error">{error}</p>}

        {!session ? (
          <div className="simple-card host-create-card">
            <Radio size={28} />
            <h2>Create a session</h2>
            <p>Select one of your saved quizzes.</p>
            {loading === 'quizzes' ? (
              <p><Loader2 className="spin" size={17} /> Loading quizzes...</p>
            ) : quizzes.length ? (
              <>
                <label>
                  Saved quiz
                  <select value={quizId} onChange={(event) => setQuizId(event.target.value)}>
                    <option value="">Choose a quiz</option>
                    {quizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.number_of_questions} questions)
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-button" type="button" disabled={!quizId || loading === 'create'} onClick={createSession}>
                  {loading === 'create' ? <Loader2 className="spin" size={17} /> : <Play size={17} />}
                  Create Session
                </button>
              </>
            ) : (
              <p>No saved quizzes yet. Create and save one first.</p>
            )}
          </div>
        ) : (
          <div className="host-grid">
            <div className="simple-card session-code-panel">
              <p>Session code</p>
              <strong>{session.session_code}</strong>
              <button className="icon-text-button" type="button" onClick={() => navigator.clipboard.writeText(session.session_code)}>
                <Copy size={16} /> Copy
              </button>
              <span className={`session-status ${session.status}`}>{session.status}</span>
              {session.status === 'waiting' && (
                <button className="primary-button" type="button" onClick={() => updateStatus('start')} disabled={loading === 'start'}>
                  <Play size={17} /> Start Session
                </button>
              )}
              {session.status === 'active' && (
                <button className="danger-button" type="button" onClick={() => updateStatus('end')} disabled={loading === 'end'}>
                  <Square size={16} /> End Session
                </button>
              )}
            </div>

            <div className="simple-card">
              <div className="simple-card-header">
                <div><p className="eyebrow">Lobby</p><h2>{lobby?.quiz_title || 'Session'}</h2></div>
                <button className="icon-button" type="button" onClick={refreshSession} aria-label="Refresh session">
                  <RefreshCw size={17} />
                </button>
              </div>
              <p className="participant-count"><Users size={17} /> {lobby?.participants?.length || 0} participants</p>
              {!lobby?.participants?.length ? (
                <p className="empty-copy">Waiting for participants to join.</p>
              ) : (
                <div className="participant-list">
                  {lobby.participants.map((participant) => (
                    <div key={participant.id}>
                      <strong>{participant.display_name}</strong>
                      <span>{participant.has_submitted ? 'Submitted' : 'Joined'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {session.status !== 'waiting' && (
              <div className="simple-card results-panel">
                <h2>Results</h2>
                {!results.length ? (
                  <p className="empty-copy">No results yet.</p>
                ) : (
                  <div className="results-table">
                    <div className="result-row result-heading"><span>Rank</span><span>Name</span><span>Score</span><span>Percentage</span></div>
                    {results.map((result, index) => (
                      <div className="result-row" key={result.participant_id}>
                        <span>{result.has_submitted ? index + 1 : '-'}</span>
                        <strong>{result.display_name}</strong>
                        <span>{result.has_submitted ? `${result.score}/${result.total_questions}` : 'Waiting'}</span>
                        <span>{result.has_submitted && result.total_questions ? `${Math.round((result.score / result.total_questions) * 100)}%` : '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default HostSessionPage
