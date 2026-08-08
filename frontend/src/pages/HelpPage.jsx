import { BookOpen, CheckCircle2, FileClock, HelpCircle, Radio, Sparkles, Upload, Users } from 'lucide-react'
import AppHeader from '../components/AppHeader'

const guide = [
  { number: '01', title: 'Build a quiz', copy: 'Open Build, upload a PDF, choose the question count and difficulty, then generate your draft.', icon: Upload, action: 'Open builder', page: 'quizzes' },
  { number: '02', title: 'Review and save', copy: 'Check every generated answer and explanation. Save the quiz when it is ready to use.', icon: CheckCircle2, action: 'View your quizzes', page: 'quizzes' },
  { number: '03', title: 'Host it live', copy: 'Open Host, select a saved quiz, and share the room code with your participants.', icon: Radio, action: 'Start hosting', page: 'host' },
  { number: '04', title: 'Review results', copy: 'After the session, use History to inspect scores, answers, and participant performance.', icon: FileClock, action: 'Open history', page: 'history' },
]

function HelpPage({ user, onNavigate, onLogout }) {
  return (
    <main className="app-shell">
      <AppHeader activePage="help" title="Help & guide" subtitle="Everything you need to create and run your first QuizForge session." user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <section className="help-page">
        <div className="help-intro simple-card">
          <span className="help-intro-icon"><Sparkles size={24} /></span>
          <div><p className="eyebrow">Quick start</p><h2>From PDF to live quiz in four steps</h2><p>QuizForge turns your source material into a reusable quiz, then gives you a live room and a results report.</p></div>
        </div>

        <div className="help-guide" aria-label="QuizForge instructions">
          {guide.map(({ number, title, copy, icon: Icon, action, page }) => (
            <article className="simple-card help-step" key={number}>
              <div className="help-step-top"><span>{number}</span><Icon size={21} /></div>
              <h3>{title}</h3><p>{copy}</p>
              <button className="icon-text-button" type="button" onClick={() => onNavigate(page)}>{action}</button>
            </article>
          ))}
        </div>

        <div className="help-lower-grid">
          <section className="simple-card help-section">
            <div className="help-section-heading"><Users size={20} /><div><h2>Joining a session</h2><p>No account is required for participants.</p></div></div>
            <ol><li>Ask the host for the room code.</li><li>Open the <button type="button" onClick={() => onNavigate('join')}>Join</button> tab.</li><li>Enter the code and your display name.</li><li>Wait for the host to begin, then submit your answers.</li></ol>
          </section>
          <section className="simple-card help-section">
            <div className="help-section-heading"><HelpCircle size={20} /><div><h2>Good to know</h2><p>Quick answers to common questions.</p></div></div>
            <details><summary>What files can I upload?</summary><p>The quiz builder currently accepts PDF source documents.</p></details>
            <details><summary>Where are my quizzes?</summary><p>Saved quizzes appear in your library on the Build page and can be selected when hosting.</p></details>
            <details><summary>Can I change the default quiz setup?</summary><p>Yes. Open Settings to choose your usual question count and difficulty.</p></details>
          </section>
        </div>
        <div className="help-footer"><BookOpen size={18} /><span>Tip: review AI-generated questions before presenting them to a class or audience.</span></div>
      </section>
    </main>
  )
}

export default HelpPage
