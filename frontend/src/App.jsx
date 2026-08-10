import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import './App.css'
import HomePage from './pages/HomePage'
import LoginSignupPage from './pages/LoginSignupPage'
import QuizBuilderPage from './pages/QuizBuilderPage'
import HostSessionPage from './pages/HostSessionPage'
import JoinSessionPage from './pages/JoinSessionPage'
import SessionHistoryPage from './pages/SessionHistoryPage/SessionHistoryPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import { apiRequest, clearSession, getStoredToken, getStoredUser } from './services/api'
import { applyPreferences, getPreferences, savePreferences } from './services/preferences'

function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const [checkingSession, setCheckingSession] = useState(Boolean(getStoredToken()))
  const [page, setPage] = useState('home')
  const [preferences, setPreferences] = useState(() => getPreferences())

  useEffect(() => {
    applyPreferences(preferences)
    savePreferences(preferences)
  }, [preferences])

  useEffect(() => {
    if (!getStoredToken()) return

    async function verifySession() {
      try {
        const data = await apiRequest('/auth/me')
        setUser(data.user)
      } catch {
        clearSession()
        setUser(null)
      } finally {
        setCheckingSession(false)
      }
    }

    verifySession()
  }, [])

  function handleLogout() {
    clearSession()
    setUser(null)
    setPage('home')
  }

  if (checkingSession) {
    return (
      <main className="app-shell">
        <div className="session-loader"><Loader2 className="spin" size={20} /> Loading QuizForge AI...</div>
      </main>
    )
  }

  if (!user && page === 'home') {
    return (
      <HomePage
        user={user}
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (!user && page !== 'join') {
    return (
      <LoginSignupPage
        onAuthenticated={setUser}
        onJoinSession={() => setPage('join')}
      />
    )
  }

  if (!user && page === 'join') {
    return (
      <JoinSessionPage
        user={user}
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <>
      <div hidden={page !== 'home'}>
        <HomePage
          user={user}
          onNavigate={setPage}
          onLogout={handleLogout}
        />
      </div>
      <div hidden={page !== 'quizzes'}>
        <QuizBuilderPage
          key={`${preferences.defaultQuestionCount}-${preferences.defaultDifficulty}`}
          user={user}
          onLogout={handleLogout}
          onNavigate={setPage}
          preferences={preferences}
        />
      </div>
      <div hidden={page !== 'settings'}>
        <SettingsPage user={user} preferences={preferences} onPreferencesChange={setPreferences} onNavigate={setPage} onLogout={handleLogout} />
      </div>
      <div hidden={page !== 'help'}>
        <HelpPage user={user} onNavigate={setPage} onLogout={handleLogout} />
      </div>
      <div hidden={page !== 'host'}>
        <HostSessionPage
          isActive={page === 'host'}
          user={user}
          onNavigate={setPage}
          onLogout={handleLogout}
        />
      </div>
      <div hidden={page !== 'join'}>
        <JoinSessionPage
          user={user}
          onNavigate={setPage}
          onLogout={handleLogout}
        />
      </div>
      <div hidden={page !== 'history'}>
        <SessionHistoryPage
          isActive={page === 'history'}
          user={user}
          onNavigate={setPage}
          onLogout={handleLogout}
        />
      </div>
    </>
  )
}

export default App
