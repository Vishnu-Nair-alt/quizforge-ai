import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileClock,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import AppHeader from '../../components/AppHeader'
import HostAIAnalysis from './HostAIAnalysis'
import { sessionHistoryApi } from '../../services/sessionHistoryApi'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function SessionHistoryPage({ isActive, user, onNavigate, onLogout }) {
  const [mode, setMode] = useState('hosted')
  const [sessions, setSessions] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState('list')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isActive) return

    let cancelled = false
    const loader = mode === 'hosted' ? sessionHistoryApi.list() : sessionHistoryApi.listJoined()

    loader
      .then((data) => {
        if (cancelled) return
        setSessions(data.sessions || [])
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading('')
      })

    return () => {
      cancelled = true
    }
  }, [isActive, mode])

  useEffect(() => {
    setDetail(null)
  }, [mode])

  useEffect(() => {
    if (!notice) return

    const timer = window.setTimeout(() => {
      setNotice('')
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [notice])

  async function loadHistory() {
    setLoading('list')
    setError('')
    setDetail(null)
    try {
      const data = mode === 'hosted'
        ? await sessionHistoryApi.list()
        : await sessionHistoryApi.listJoined()
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
    setNotice('')
    try {
      const detailData = mode === 'hosted'
        ? await sessionHistoryApi.detail(sessionCode)
        : await sessionHistoryApi.detailJoined(sessionCode)
      setDetail({ ...detailData, historyMode: mode })
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

  async function deleteSession(session) {
    const confirmed = window.confirm(
      `Delete session ${session.session_code} and all of its participant results? This cannot be undone.`,
    )
    if (!confirmed) return

    setLoading(`delete-${session.session_code}`)
    setError('')
    setNotice('')

    try {
      await sessionHistoryApi.delete(session.session_code)
      setSessions((current) =>
        current.filter((item) => item.session_id !== session.session_id),
      )
      if (detail?.session_id === session.session_id) {
        setDetail(null)
      }
      setNotice(`Session ${session.session_code} deleted.`)
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
        {notice && <p className="status success">{notice}</p>}

        {detail ? (
          <>
            <div className="history-actions">
              <button className="icon-text-button" type="button" onClick={() => setDetail(null)}>
                <ArrowLeft size={16} /> All sessions
              </button>
              <div className="history-detail-actions">
                {detail.historyMode === 'hosted' && (
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => deleteSession(detail)}
                    disabled={loading === `delete-${detail.session_code}`}
                    aria-label={`Delete session ${detail.session_code}`}
                    title="Delete session history"
                  >
                    {loading === `delete-${detail.session_code}` ? (
                      <Loader2 className="spin" size={17} />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                )}
                {detail.historyMode === 'hosted' && (
                  <button className="primary-button export-button" type="button" onClick={exportReport} disabled={loading === 'export'}>
                    {loading === 'export' ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
                    Export CSV
                  </button>
                )}
                <p className="eyebrow">
                  {detail.historyMode === 'joined' ? 'Joined session' : 'Session'} {detail.session_code}
                </p>
                <h2>{detail.quiz_title}</h2>
                <p>{detail.difficulty} · {detail.total_questions} questions</p>
              </div>
              <span className={`session-status ${detail.status}`}>{detail.status}</span>
              <div className="history-metrics">
                <span><strong>{detail.participant_count}</strong> Participants</span>
                <span><strong>{detail.submitted_count}</strong> Submitted</span>
                <span><strong>{formatDate(detail.created_at)}</strong> Created</span>
                {detail.historyMode === 'joined' && detail.submitted_at && (
                  <span><strong>{formatDate(detail.submitted_at)}</strong> My submission</span>
                )}
              </div>
            </div>

            <HostAIAnalysis
              key={detail.session_id}
              sessionId={detail.session_id}
              submittedCount={detail.submitted_count}
            />

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
                      <details className="participant-answer-details">
                        <summary>
                          <span>
                            View answer details
                            <small>{participant.answers.length} answered questions</small>
                          </span>
                          <ChevronDown size={18} />
                        </summary>
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
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="simple-card">
            <div className="simple-card-header history-list-header">
              <div>
                <p className="eyebrow">{mode === 'hosted' ? 'Owner access' : 'Joined sessions'}</p>
                <h2>{mode === 'hosted' ? 'Your hosted sessions' : 'Sessions you joined'}</h2>
              </div>
              <div className="history-filter-actions">
                <button
                  type="button"
                  className={`tab-button ${mode === 'hosted' ? 'active' : ''}`}
                  onClick={() => setMode('hosted')}
                >
                  Hosted
                </button>
                <button
                  type="button"
                  className={`tab-button ${mode === 'joined' ? 'active' : ''}`}
                  onClick={() => setMode('joined')}
                >
                  Joined
                </button>
                <button className="icon-button" type="button" onClick={loadHistory} aria-label="Refresh history">
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>

            {loading === 'list' ? (
              <p className="history-loading"><Loader2 className="spin" size={18} /> Loading session history...</p>
            ) : !sessions.length ? (
              <p className="empty-copy">
                {mode === 'hosted'
                  ? 'No hosted sessions yet.'
                  : 'No joined sessions yet.'}
              </p>
            ) : (
              <div className="session-history-list">
                {sessions.map((session) => (
                  <div className="session-history-item" key={session.session_id}>
                    <button type="button" onClick={() => openSession(session.session_code)}>
                      <FileClock size={20} />
                      <span>
                        <strong>{session.quiz_title}</strong>
                        <small>
                          {session.session_code} · {formatDate(session.created_at)}
                          {mode === 'joined' && session.joined_at ? ` · joined ${formatDate(session.joined_at)}` : ''}
                        </small>
                      </span>
                      <span>{session.submitted_count}/{session.participant_count} submitted</span>
                      <span className={`session-status ${session.status}`}>{session.status}</span>
                      {loading === `detail-${session.session_code}` && <Loader2 className="spin" size={17} />}
                    </button>
                    {mode === 'hosted' && (
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => deleteSession(session)}
                    disabled={loading === `delete-${session.session_code}`}
                    aria-label={`Delete session ${session.session_code}`}
                    title="Delete session history"
                  >
                    {loading === `delete-${session.session_code}` ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
                  </div>
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
