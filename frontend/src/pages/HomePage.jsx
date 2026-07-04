import { BookOpen, FileClock, LogIn, Radio, Sparkles, Users } from 'lucide-react'
import AppHeader from '../components/AppHeader'

const actions = [
  {
    id: 'quizzes',
    title: 'Build a quiz',
    copy: 'Upload source material, generate questions, and save polished quizzes for later.',
    icon: Sparkles,
    button: 'Open builder',
  },
  {
    id: 'host',
    title: 'Host live',
    copy: 'Choose a saved quiz, share a session code, and watch participants join in real time.',
    icon: Radio,
    button: 'Host session',
  },
  {
    id: 'join',
    title: 'Join a session',
    copy: 'Enter a session code and jump into a live quiz as a guest or signed-in user.',
    icon: Users,
    button: 'Join quiz',
  },
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
            <h2>Turn study material into live quiz sessions.</h2>
            <p>
              Create quiz sets from documents, launch them for a room, or join an active
              session without digging through the workspace.
            </p>
            <div className="home-hero-actions">
              <button className="primary-button" type="button" onClick={() => onNavigate('host')}>
                <Radio size={17} />
                Host a Quiz
              </button>
              <button className="icon-text-button" type="button" onClick={() => onNavigate('join')}>
                <LogIn size={17} />
                Join Session
              </button>
            </div>
          </div>

          <div className="home-session-preview" aria-label="Session overview preview">
            <div className="home-preview-topline">
              <span className="session-status active">active</span>
              <strong>QF-284</strong>
            </div>
            <div className="home-preview-question">
              <span>Q1</span>
              <p>Which concept best explains the material?</p>
            </div>
            <div className="home-preview-options">
              <span />
              <span />
              <span className="selected" />
              <span />
            </div>
            <div className="home-preview-footer">
              <span><Users size={15} /> 18 joined</span>
              <span><FileClock size={15} /> Live results</span>
            </div>
          </div>
        </div>

        <div className="home-action-grid">
          {actions.map(({ id, title, copy, icon: Icon, button }) => (
            <article className="simple-card home-action-card" key={id}>
              <Icon size={24} />
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
