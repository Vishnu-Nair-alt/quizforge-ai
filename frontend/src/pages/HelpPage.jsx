import { BookOpen, CheckCircle2, FileClock, HelpCircle, Radio, Sparkles, Upload, Users } from 'lucide-react'
import AppHeader from '../components/AppHeader'

const guide = [
  { number: '01', title: 'Create', copy: 'Open Build, upload a PDF, then choose the number and difficulty of your questions.', icon: Upload, action: 'Open Build', page: 'quizzes' },
  { number: '02', title: 'Check & save', copy: 'Review the generated questions and answers. Make any edits, then save your quiz.', icon: CheckCircle2, action: 'View quizzes', page: 'quizzes' },
  { number: '03', title: 'Start a session', copy: 'Open Host, choose your saved quiz, and give participants the room code.', icon: Radio, action: 'Open Host', page: 'host' },
  { number: '04', title: 'See results', copy: 'When the session ends, open History to review scores and participant answers.', icon: FileClock, action: 'Open History', page: 'history' },
]

function HelpPage({ user, onNavigate, onLogout }) {
  return (
    <main className="app-shell">
      <AppHeader activePage="help" title="Help & guide" subtitle="Create, host, and review a QuizForge session in a few simple steps." user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <section className="help-page">
        <div className="help-intro simple-card">
          <span className="help-intro-icon"><Sparkles size={24} /></span>
          <div><p className="eyebrow">Quick start</p><h2>Turn a PDF into a live quiz</h2><p>Follow these four steps to create your quiz, invite participants, and review their results.</p></div>
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
          <section className="simple-card help-section help-join-section">
            <div className="help-section-heading"><Users size={20} /><div><h2>Join a session</h2><p>Participants do not need an account.</p></div></div>
            <ol><li>Get the room code from your host.</li><li>Open the <button type="button" onClick={() => onNavigate('join')}>Join</button> page.</li><li>Enter the room code and your display name.</li><li>Select <strong>Join session</strong> and wait for the host to start.</li><li>Choose an answer and submit it before time runs out.</li></ol>
            <div className="help-guest-note">
              <div className="help-guest-note-title"><Users size={17} /><h3>Joining as a guest</h3></div>
              <p>Guests can take part without creating or signing in to an account. Simply open Join, enter the host's room code and choose a display name. Your name is only used to identify you in that session and its results.</p>
            </div>
          </section>
          <section className="simple-card help-section">
            <div className="help-section-heading"><HelpCircle size={20} /><div><h2>Good to know</h2><p>Quick answers to common questions.</p></div></div>
            <div className="help-faq-list">
              <div className="help-faq-item"><h3>What can I upload?</h3><p>QuizForge accepts PDF documents. For better questions, use a clear, text-based PDF.</p></div>
              <div className="help-faq-item"><h3>Where are my saved quizzes?</h3><p>Find them in your library on the Build page. You can edit them there or select one from Host.</p></div>
              <div className="help-faq-item"><h3>Can I change the quiz defaults?</h3><p>Yes. Open Settings to choose your usual question count and difficulty.</p></div>
              <div className="help-faq-item"><h3>Should I check AI-generated questions?</h3><p>Yes. Review every question and answer before hosting, especially when accuracy matters.</p></div>
            </div>
          </section>
        </div>
        <div className="help-footer"><BookOpen size={18} /><span>Tip: review AI-generated questions before presenting them to a class or audience.</span></div>
      </section>
    </main>
  )
}

export default HelpPage
