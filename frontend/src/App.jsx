import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const difficulties = ['Easy', 'Medium', 'Hard', 'Mixed']

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed')
  }

  return data
}

function App() {
  const [file, setFile] = useState(null)
  const [uploadInfo, setUploadInfo] = useState(null)
  const [quizDraft, setQuizDraft] = useState({
    title: 'Generated Quiz',
    number_of_questions: 10,
    difficulty: 'Mixed',
    topic_focus: '',
  })
  const [generatedQuiz, setGeneratedQuiz] = useState(null)
  const [savedQuizzes, setSavedQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [activeView, setActiveView] = useState('builder')
  const [loading, setLoading] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const canGenerate = Boolean(uploadInfo?.filename && quizDraft.title.trim())
  const canSave = Boolean(generatedQuiz?.questions?.length)

  const questionCountLabel = useMemo(() => {
    const count = generatedQuiz?.questions?.length || selectedQuiz?.questions?.length || 0
    return count === 1 ? '1 question' : `${count} questions`
  }, [generatedQuiz, selectedQuiz])

  useEffect(() => {
    loadQuizzes()
  }, [])

  async function loadQuizzes() {
    try {
      const data = await apiRequest('/quizzes')
      setSavedQuizzes(data.quizzes || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading('upload')
    setError('')
    setNotice('')

    try {
      const data = await apiRequest('/upload-pdf', {
        method: 'POST',
        body: formData,
      })
      setUploadInfo(data)
      setGeneratedQuiz(null)
      setNotice(`${data.filename} uploaded`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function handleGenerate(event) {
    event.preventDefault()
    if (!canGenerate) return

    setLoading('generate')
    setError('')
    setNotice('')
    setSelectedQuiz(null)
    setActiveView('builder')

    try {
      const data = await apiRequest('/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quizDraft,
          number_of_questions: Number(quizDraft.number_of_questions),
        }),
      })
      setGeneratedQuiz(data)
      setNotice('Quiz generated')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function handleSave() {
    if (!canSave) return

    setLoading('save')
    setError('')
    setNotice('')

    try {
      await apiRequest('/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: generatedQuiz.title,
          filename: generatedQuiz.filename,
          difficulty: generatedQuiz.difficulty,
          topic_focus: generatedQuiz.topic_focus || '',
          questions: generatedQuiz.questions,
        }),
      })
      setNotice('Quiz saved')
      await loadQuizzes()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function openQuiz(quizId) {
    setLoading(`quiz-${quizId}`)
    setError('')
    setNotice('')

    try {
      const data = await apiRequest(`/quizzes/${quizId}`)
      setSelectedQuiz(data.quiz)
      setGeneratedQuiz(null)
      setActiveView('library')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  async function deleteQuiz(quizId) {
    setLoading(`delete-${quizId}`)
    setError('')
    setNotice('')

    try {
      await apiRequest(`/quizzes/${quizId}`, {
        method: 'DELETE',
      })
      setNotice('Quiz deleted')
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(null)
      }
      await loadQuizzes()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  const displayedQuiz = activeView === 'library' ? selectedQuiz : generatedQuiz

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">QuizForge AI</p>
          <h1>PDF to quiz workspace</h1>
        </div>
        <div className="status-strip" aria-live="polite">
          {error && <span className="status error">{error}</span>}
          {!error && notice && <span className="status success">{notice}</span>}
          {!error && !notice && <span className="status">Backend: {API_BASE_URL}</span>}
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel">
          <div className="tabs" role="tablist" aria-label="Workspace views">
            <button
              type="button"
              className={activeView === 'builder' ? 'active' : ''}
              onClick={() => setActiveView('builder')}
            >
              <Sparkles size={16} />
              Builder
            </button>
            <button
              type="button"
              className={activeView === 'library' ? 'active' : ''}
              onClick={() => setActiveView('library')}
            >
              <BookOpen size={16} />
              Library
            </button>
          </div>

          {activeView === 'builder' ? (
            <>
              <form className="panel-section" onSubmit={handleUpload}>
                <div className="section-title">
                  <FileText size={18} />
                  <h2>Source PDF</h2>
                </div>
                <label className="file-drop">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                  <Upload size={22} />
                  <span>{file?.name || uploadInfo?.filename || 'Select PDF'}</span>
                </label>
                {uploadInfo && (
                  <div className="metric-row">
                    <span>{uploadInfo.filename}</span>
                    <strong>{uploadInfo.total_characters.toLocaleString()} chars</strong>
                  </div>
                )}
                <button className="primary-button" type="submit" disabled={!file || loading === 'upload'}>
                  {loading === 'upload' ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
                  Upload
                </button>
              </form>

              <form className="panel-section" onSubmit={handleGenerate}>
                <div className="section-title">
                  <Sparkles size={18} />
                  <h2>Quiz Settings</h2>
                </div>
                <label>
                  Title
                  <input
                    value={quizDraft.title}
                    onChange={(event) =>
                      setQuizDraft((draft) => ({ ...draft, title: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Questions
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={quizDraft.number_of_questions}
                    onChange={(event) =>
                      setQuizDraft((draft) => ({
                        ...draft,
                        number_of_questions: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Topic Focus
                  <input
                    value={quizDraft.topic_focus}
                    onChange={(event) =>
                      setQuizDraft((draft) => ({ ...draft, topic_focus: event.target.value }))
                    }
                    placeholder="Optional"
                  />
                </label>
                <div className="segmented" aria-label="Difficulty">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={quizDraft.difficulty === difficulty ? 'active' : ''}
                      onClick={() => setQuizDraft((draft) => ({ ...draft, difficulty }))}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!canGenerate || loading === 'generate'}
                >
                  {loading === 'generate' ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
                  Generate
                </button>
              </form>
            </>
          ) : (
            <div className="panel-section library-list">
              <div className="section-title split-title">
                <div>
                  <BookOpen size={18} />
                  <h2>Saved Quizzes</h2>
                </div>
                <button className="icon-button" type="button" onClick={loadQuizzes} aria-label="Refresh quizzes">
                  <RefreshCw size={17} />
                </button>
              </div>
              {savedQuizzes.length === 0 ? (
                <p className="empty-copy">No saved quizzes yet.</p>
              ) : (
                savedQuizzes.map((quiz) => (
                  <div className="quiz-list-item" key={quiz.id}>
                    <button type="button" onClick={() => openQuiz(quiz.id)}>
                      <strong>{quiz.title}</strong>
                      <span>
                        {quiz.number_of_questions} questions · {quiz.difficulty}
                      </span>
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => deleteQuiz(quiz.id)}
                      aria-label={`Delete ${quiz.title}`}
                    >
                      {loading === `delete-${quiz.id}` ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        <section className="quiz-stage">
          <div className="quiz-header">
            <div>
              <p className="eyebrow">{displayedQuiz?.difficulty || quizDraft.difficulty}</p>
              <h2>{displayedQuiz?.title || 'Generated quiz appears here'}</h2>
            </div>
            <div className="stage-actions">
              <span className="question-count">{questionCountLabel}</span>
              {activeView === 'builder' && (
                <button className="save-button" type="button" onClick={handleSave} disabled={!canSave || loading === 'save'}>
                  {loading === 'save' ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                  Save
                </button>
              )}
            </div>
          </div>

          {displayedQuiz?.questions?.length ? (
            <div className="question-grid">
              {displayedQuiz.questions.map((question, index) => (
                <article className="question-card" key={`${question.question}-${index}`}>
                  <div className="question-topline">
                    <span>Q{index + 1}</span>
                    <strong>{question.difficulty}</strong>
                  </div>
                  <h3>{question.question}</h3>
                  <div className="options">
                    {question.options.map((option) => (
                      <div
                        className={option === question.correct_answer ? 'option correct' : 'option'}
                        key={option}
                      >
                        {option === question.correct_answer && <Check size={15} />}
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                  <p className="explanation">{question.explanation}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Sparkles size={32} />
              <h2>Ready for a quiz</h2>
              <p>Upload a PDF and generate questions from the builder panel.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
