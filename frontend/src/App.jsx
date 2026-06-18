import { useEffect, useState } from 'react'
import './App.css'
import LoginSignupPage from './pages/LoginSignupPage'
import QuizBuilderPage from './pages/QuizBuilderPage'
import HostSessionPage from './pages/HostSessionPage'
import JoinSessionPage from './pages/JoinSessionPage'
import { apiRequest, clearSession, getStoredToken, getStoredUser } from './services/api'

function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const [checkingSession, setCheckingSession] = useState(Boolean(getStoredToken()))
  const [page, setPage] = useState('quizzes')

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
    setPage('quizzes')
  }

  if (checkingSession) {
    return (
      <main className="app-shell">
        <div className="session-loader">Loading QuizForge AI...</div>
      </main>
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

  if (page === 'join') {
    return (
      <JoinSessionPage
        user={user}
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'host') {
    return (
      <HostSessionPage
        user={user}
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <QuizBuilderPage
      user={user}
      onLogout={handleLogout}
      onNavigate={setPage}
    />
  )
}

export default App
