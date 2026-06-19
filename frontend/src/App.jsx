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
      <div hidden={page !== 'quizzes'}>
        <QuizBuilderPage
          user={user}
          onLogout={handleLogout}
          onNavigate={setPage}
        />
      </div>
      <div hidden={page !== 'host'}>
        <HostSessionPage
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
    </>
  )
}

export default App
