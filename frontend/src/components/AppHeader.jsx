import { BookOpen, FileClock, Home, LogIn, LogOut, Radio, Users } from 'lucide-react'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'quizzes', label: 'Build', icon: BookOpen },
  { id: 'host', label: 'Host', icon: Radio },
  { id: 'history', label: 'History', icon: FileClock },
  { id: 'join', label: 'Join', icon: Users },
]

function AppHeader({ activePage, title, subtitle, user, onNavigate, onLogout, children }) {
  const initial = (user?.name || user?.email || 'Q').trim().charAt(0).toUpperCase()

  return (
    <header className="app-header">
      <div className="app-nav">
        <button className="app-brand" type="button" onClick={() => onNavigate('home')}>
          <span className="brand-mark">Q</span>
          <span>
            <strong>QuizForge</strong>
            <small>AI quiz studio</small>
          </span>
        </button>

        {user ? (
          <nav className="page-tabs" aria-label="Main navigation">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <button
                className={activePage === id ? 'active' : ''}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={activePage === id ? 'page' : undefined}
                key={id}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="page-tabs guest-nav">
            <button type="button" onClick={() => onNavigate('quizzes')}>
              <LogIn size={16} />
              <span>Login</span>
            </button>
          </div>
        )}

        {user && (
          <div className="account-menu">
            <span className="account-avatar" aria-hidden="true">{initial}</span>
            <span className="account-copy">
              <strong>{user.name || 'Creator'}</strong>
              <small>{user.email}</small>
            </span>
            <button className="logout-button" type="button" onClick={onLogout} title="Log out">
              <LogOut size={17} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children && <div className="page-heading-status">{children}</div>}
      </div>
    </header>
  )
}

export default AppHeader
