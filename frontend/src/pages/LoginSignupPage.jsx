import { useState } from 'react'
import { LogIn, Loader2, Radio, Sparkles, UserPlus } from 'lucide-react'
import { apiRequest, storeSession } from '../services/api'
import { toast } from '../services/toast'

const emptyLoginForm = {
  email: '',
  password: '',
}

const emptySignupForm = {
  name: '',
  email: '',
  password: '',
}

function LoginSignupPage({ onAuthenticated, onJoinSession }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(emptyLoginForm)
  const [signupForm, setSignupForm] = useState(emptySignupForm)
  const [loading, setLoading] = useState(false)
  const [, setNotice] = useState('')
  const [, setError] = useState('')

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setNotice('')

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      })

      storeSession(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.name || 'quiz maker'}`)
      onAuthenticated(data.user)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(event) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setNotice('')

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupForm),
      })

      setMode('login')
      setLoginForm({
        email: signupForm.email,
        password: '',
      })
      setSignupForm(emptySignupForm)
      setNotice(data.message || 'Account created. Login to continue.')
      toast.success(data.message || 'Account created. Login to continue.')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <Sparkles size={30} />
          <h1>QuizForge AI</h1>
          <p>Craft smarter quizzes, faster.</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Authentication">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setError('')
                setNotice('')
              }}
            >
              <LogIn size={16} />
              Login
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup')
                setError('')
                setNotice('')
              }}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((form) => ({ ...form, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((form) => ({ ...form, password: event.target.value }))
                  }
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? <Loader2 className="spin" size={17} /> : <LogIn size={17} />}
                Login
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <label>
                Name
                <input
                  autoComplete="name"
                  value={signupForm.name}
                  onChange={(event) =>
                    setSignupForm((form) => ({ ...form, name: event.target.value }))
                  }
                  minLength={2}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={signupForm.email}
                  onChange={(event) =>
                    setSignupForm((form) => ({ ...form, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={signupForm.password}
                  onChange={(event) =>
                    setSignupForm((form) => ({ ...form, password: event.target.value }))
                  }
                  minLength={8}
                  maxLength={72}
                  pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}"
                  title="Use at least 8 characters, including a letter, number, and special character."
                  required
                />
                <small>At least 8 characters, including a letter, number, and special character.</small>
              </label>
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? <Loader2 className="spin" size={17} /> : <UserPlus size={17} />}
                Create Account
              </button>
            </form>
          )}

          <button className="join-link-button" type="button" onClick={onJoinSession}>
            <Radio size={16} />
            Join a live session without an account
          </button>
        </div>
      </section>
    </main>
  )
}

export default LoginSignupPage
