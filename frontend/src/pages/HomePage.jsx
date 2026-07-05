import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileClock,
  FileText,
  LogIn,
  Radio,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import AppHeader from '../components/AppHeader'

const actions = [
  {
    id: 'quizzes',
    title: 'Build a quiz',
    copy: 'Upload source material, generate questions, and save polished quizzes for later.',
    icon: Sparkles,
    button: 'Open builder',
    meta: 'PDF to questions',
  },
  {
    id: 'host',
    title: 'Host live',
    copy: 'Choose a saved quiz, share a session code, and watch participants join in real time.',
    icon: Radio,
    button: 'Host session',
    meta: 'Lobby ready',
  },
  {
    id: 'join',
    title: 'Join a session',
    copy: 'Enter a session code and jump into a live quiz as a guest or signed-in user.',
    icon: Users,
    button: 'Join quiz',
    meta: 'Code based',
  },
]

const workflow = [
  { label: 'Source', value: 'Upload notes', icon: FileText },
  { label: 'Quiz', value: 'Review draft', icon: CheckCircle2 },
  { label: 'Session', value: 'Launch room', icon: Radio },
  { label: 'Results', value: 'Track scores', icon: Trophy },
]

function HomePage({ user, onNavigate, onLogout }) {
  return (
    <main className="app-shell">
      <AppHeader
        activePage="home"
        title="QuizForge home"
        subtitle="Build AI quizzes, host live sessions, and join with a simple code."
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <section className="home-page">
        <div className="home-hero">
          <div className="home-hero-copy">
            <p className="eyebrow">AI quiz studio</p>
            <h2>Forge a quiz, open the room, see who gets it.</h2>
            <p>
              QuizForge keeps the full flow close: generate from source material, host live,
              and keep session history ready for review.
            </p>
            <div className="home-hero-actions">
              <button className="primary-button" type="button" onClick={() => onNavigate('quizzes')}>
                <Sparkles size={17} />
                Build a Quiz
              </button>
              <button className="icon-text-button" type="button" onClick={() => onNavigate(user ? 'host' : 'join')}>
                {user ? <Radio size={17} /> : <LogIn size={17} />}
                {user ? 'Host Live' : 'Join Session'}
              </button>
            </div>
            <div className="home-hero-metrics" aria-label="QuizForge workflow highlights">
              <span><strong>4</strong> workflow steps</span>
              <span><strong>30</strong> question max</span>
              <span><strong>Live</strong> lobby updates</span>
            </div>
          </div>

          <div className="home-session-preview" aria-label="Session overview preview">
            <div className="home-preview-topline">
              <span>
                <small>Live room</small>
                <strong>QF-284</strong>
              </span>
              <span className="session-status active">active</span>
            </div>
            <div className="home-preview-question">
              <span>Q4</span>
              <p>Which concept best explains the material?</p>
            </div>
            <div className="home-preview-options">
              <span><i />Compare the key definitions</span>
              <span><i />Memorize every paragraph</span>
              <span className="selected"><i />Apply the source example</span>
              <span><i />Skip the explanation</span>
            </div>
            <div className="home-preview-footer">
              <span><Users size={15} /> 18 joined</span>
              <span><FileClock size={15} /> Live results</span>
            </div>
          </div>
        </div>

        <div className="home-workflow" aria-label="QuizForge workflow">
          {workflow.map(({ label, value, icon: Icon }, index) => (
            <div className="home-workflow-step" key={label}>
              <span className="home-workflow-icon"><Icon size={18} /></span>
              <span>
                <small>{label}</small>
                <strong>{value}</strong>
              </span>
              {index < workflow.length - 1 && <ArrowRight className="home-workflow-arrow" size={17} />}
            </div>
          ))}
        </div>

        <div className="home-action-grid">
          {actions.map(({ id, title, copy, icon: Icon, button, meta }) => (
            <article className="simple-card home-action-card" key={id}>
              <div className="home-action-topline">
                <span><Icon size={21} /></span>
                <small>{meta}</small>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <button className="icon-text-button" type="button" onClick={() => onNavigate(id)}>
                {id === 'quizzes' ? <BookOpen size={16} /> : <Icon size={16} />}
                {button}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default HomePage
