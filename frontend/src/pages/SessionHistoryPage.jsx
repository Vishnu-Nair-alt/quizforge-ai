import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileClock,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { sessionHistoryApi } from '../services/sessionHistoryApi'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function SessionHistoryPage({ user, onNavigate, onLogout }) {
  const [sessions, setSessions] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState('list')
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoading('list')
    setError('')
    try {
      const data = await sessionHistoryApi.list()
      setSessions(data.sessions || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function openSession(sessionCode) {
    setLoading(`detail-${sessionCode}`)
    setError('')
    try {
      setDetail(await sessionHistoryApi.detail(sessionCode))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function exportReport() {
    if (!detail) return
    setLoading('export')
    setError('')
    try {
      await sessionHistoryApi.download(detail.session_code)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  return (
    <main className="app-shell">
      <AppHeader
        activePage="history"
        title="Session history"
        subtitle="Review past sessions, participant performance, and submitted answers."
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <section className="simple-page history-page">
        {error && <p className="status error">{error}</p>}

        {detail ? (
          <>
            <div className="history-actions">
              <button className="icon-text-button" type="button" onClick={() => setDetail(null)}>
                <ArrowLeft size={16} /> All sessions
              </button>
              <button className="primary-button export-button" type="button" onClick={exportReport} disabled={loading === 'export'}>
                {loading === 'export' ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
                Export CSV
              </button>
            </div>

            <div className="simple-card history-summary">
              <div>
                <p className="eyebrow">Session {detail.session_code}</p>
                <h2>{detail.quiz_title}</h2>
                <p>{detail.difficulty} · {detail.total_questions} questions</p>
              </div>
              <span className={`session-status ${detail.status}`}>{detail.status}</span>
              <div className="history-metrics">
                <span><strong>{detail.participant_count}</strong> Participants</span>
                <span><strong>{detail.submitted_count}</strong> Submitted</span>
                <span><strong>{formatDate(detail.created_at)}</strong> Created</span>
              </div>
            </div>

            {!detail.participants.length ? (
              <div className="simple-card">
                <p className="empty-copy">No participants joined this session.</p>
              </div>
            ) : (
              <div className="history-participants">
                {detail.participants.map((participant) => (
                  <article className="simple-card participant-detail" key={participant.participant_id}>
                    <div className="participant-detail-heading">
                      <div>
                        <h3>{participant.display_name}</h3>
                        <p>Joined {formatDate(participant.joined_at)}</p>
                      </div>
                      <strong>
                        {participant.has_submitted
                          ? `${participant.score}/${detail.total_questions}`
                          : 'Not submitted'}
                      </strong>
                    </div>
                    <div className="answer-counts">
                      <span className="correct-count">{participant.correct_count} correct</span>
                      <span className="incorrect-count">{participant.incorrect_count} incorrect</span>
                      <span>{participant.unanswered_count} unanswered</span>
                      <span>Submitted {formatDate(participant.submitted_at)}</span>
                    </div>
                    {participant.answers.length > 0 && (
                      <div className="answer-detail-list">
                        {participant.answers.map((answer) => (
                          <div className={answer.is_correct ? 'answer-detail correct' : 'answer-detail incorrect'} key={answer.question_index}>
                            {answer.is_correct ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                            <div>
                              <strong>Q{answer.question_index + 1}. {answer.question}</strong>
                              <span>Selected: {answer.selected_answer}</span>
                              {!answer.is_correct && <span>Correct: {answer.correct_answer}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="simple-card">
            <div className="simple-card-header">
              <div>
                <p className="eyebrow">Owner access</p>
                <h2>Your hosted sessions</h2>
              </div>
              <button className="icon-button" type="button" onClick={loadHistory} aria-label="Refresh history">
                <RefreshCw size={17} />
              </button>
            </div>

            {loading === 'list' ? (
              <p className="history-loading"><Loader2 className="spin" size={18} /> Loading session history...</p>
            ) : !sessions.length ? (
              <p className="empty-copy">No hosted sessions yet.</p>
            ) : (
              <div className="session-history-list">
                {sessions.map((session) => (
                  <button type="button" onClick={() => openSession(session.session_code)} key={session.session_id}>
                    <FileClock size={20} />
                    <span>
                      <strong>{session.quiz_title}</strong>
                      <small>{session.session_code} · {formatDate(session.created_at)}</small>
                    </span>
                    <span>{session.submitted_count}/{session.participant_count} submitted</span>
                    <span className={`session-status ${session.status}`}>{session.status}</span>
                    {loading === `detail-${session.session_code}` && <Loader2 className="spin" size={17} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default SessionHistoryPage
