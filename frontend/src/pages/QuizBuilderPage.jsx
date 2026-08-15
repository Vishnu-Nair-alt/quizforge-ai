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
import AppHeader from '../components/AppHeader'
import { apiRequest } from '../services/api'
import { toast } from '../services/toast'

const difficulties = ['Easy', 'Medium', 'Hard', 'Mixed']

function QuizBuilderPage({ user, onLogout, onNavigate, preferences }) {
  const [file, setFile] = useState(null)
  const [quizDraft, setQuizDraft] = useState({
    title: 'Generated Quiz',
    number_of_questions: preferences?.defaultQuestionCount || 10,
    difficulty: preferences?.defaultDifficulty || 'Mixed',
    topic_focus: '',
  })
  const [generatedQuiz, setGeneratedQuiz] = useState(null)
  const [savedQuizzes, setSavedQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [activeView, setActiveView] = useState('builder')
  const [loading, setLoading] = useState('')
  const [, setNotice] = useState('')
  const [, setError] = useState('')

  const canGenerate = Boolean(file && quizDraft.title.trim())
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
      toast.error(err.message)
    }
  }

  function handleFileSelection(event) {
    const selectedFile = event.target.files?.[0] || null
    setFile(selectedFile)
    setGeneratedQuiz(null)
    setError('')
    setNotice('')
    if (selectedFile) toast.success(`${selectedFile.name} is ready`)
  }

  function removeFile() {
    setFile(null)
    setGeneratedQuiz(null)
    setError('')
    setNotice('PDF removed')
    toast.info('Source PDF removed')
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', quizDraft.title.trim())
      formData.append('number_of_questions', String(Number(quizDraft.number_of_questions)))
      formData.append('difficulty', quizDraft.difficulty)
      formData.append('topic_focus', quizDraft.topic_focus)

      const data = await apiRequest('/generate-quiz', {
        method: 'POST',
        body: formData,
      })
      setGeneratedQuiz(data)
      setFile(null)
      setNotice('Quiz generated')
      toast.success('Quiz generated successfully')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
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
          difficulty: generatedQuiz.difficulty,
          topic_focus: generatedQuiz.topic_focus || '',
          questions: generatedQuiz.questions,
        }),
      })
      setNotice('Quiz saved')
      toast.success('Quiz saved to your library')
      await loadQuizzes()
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
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
      toast.info('Quiz opened from library')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
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
      toast.success('Quiz deleted')
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(null)
      }
      await loadQuizzes()
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading('')
    }
  }

  const displayedQuiz = activeView === 'library' ? selectedQuiz : generatedQuiz

  return (
    <main className="app-shell">
      <AppHeader
        activePage="quizzes"
        title="Quiz workspace"
        subtitle="Create a new quiz or open one from your library."
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

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
              <section className="panel-section">
                <div className="section-title">
                  <span className="builder-step">1</span>
                  <div><h2>Source material</h2><p>Start with the document your quiz should follow.</p></div>
                </div>
                {!file ? (
                  <label className="file-drop">
                    <input type="file" accept="application/pdf,.pdf" onChange={handleFileSelection} />
                    <Upload size={22} />
                    <span>Choose PDF</span>
                    <small>The file stays in this browser until you generate.</small>
                  </label>
                ) : (
                  <>
                    <div className="metric-row source-file-summary">
                      <span><FileText size={16} /> {file.name}</span>
                      <strong>{(file.size / 1024 / 1024).toFixed(2)} MB</strong>
                    </div>
                    <div className="source-file-actions">
                      <label className="icon-text-button">
                        <RefreshCw size={16} /> Replace PDF
                        <input type="file" accept="application/pdf,.pdf" onChange={handleFileSelection} />
                      </label>
                      <button className="icon-text-button danger" type="button" onClick={removeFile}>
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </>
                )}
              </section>

              <form className="panel-section" onSubmit={handleGenerate}>
                <div className="section-title">
                  <span className="builder-step">2</span>
                  <div><h2>Shape the quiz</h2><p>Set the scope, focus, and level.</p></div>
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
                  Generate quiz
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
                        {quiz.number_of_questions} questions - {quiz.difficulty}
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
            <div className="builder-empty-state">
              <div className="builder-empty-mark"><Sparkles size={26} /></div>
              <p className="eyebrow">Your canvas</p>
              <h2>Turn source material into a quiz</h2>
              <p>Complete the two steps on the left. Your generated questions will arrive here, ready to review and save.</p>
              <div className="builder-empty-flow" aria-label="Quiz creation steps">
                <span className={file ? 'complete' : ''}><strong>{file ? <Check size={15} /> : '1'}</strong> Add PDF</span>
                <i />
                <span><strong>2</strong> Tune settings</span>
                <i />
                <span><strong>3</strong> Review quiz</span>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default QuizBuilderPage
