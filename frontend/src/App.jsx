import { useEffect, useState } from 'react'
import './App.css'
import LoginSignupPage from './pages/LoginSignupPage'
import QuizBuilderPage from './pages/QuizBuilderPage'
import { apiRequest, clearSession, getStoredToken, getStoredUser } from './services/api'

function App() {
  const [user, setUser] = useState(() => getStoredUser())
  const [checkingSession, setCheckingSession] = useState(Boolean(getStoredToken()))

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
  }

  if (checkingSession) {
    return (
      <main className="app-shell">
        <div className="session-loader">Loading QuizForge AI...</div>
      </main>
    )
  }

  if (!user) {
    return <LoginSignupPage onAuthenticated={setUser} />
  }

  return <QuizBuilderPage user={user} onLogout={handleLogout} />
}

export default App
