import { useEffect, useRef, useState } from 'react'
import { Anvil, BookOpen, FileClock, HelpCircle, Home, LogIn, LogOut, Radio, Settings, Sparkles, Users } from 'lucide-react'
import { getPreferences } from '../services/preferences'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'quizzes', label: 'Build', icon: BookOpen },
  { id: 'host', label: 'Host', icon: Radio },
  { id: 'history', label: 'History', icon: FileClock },
  { id: 'join', label: 'Join', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

function AppHeader({ activePage, title, subtitle, user, onNavigate, onLogout, profileImage: profileImageOverride, children }) {
  const initial = (user?.name || user?.email || 'Q').trim().charAt(0).toUpperCase()
  const profileImage = user ? (profileImageOverride ?? getPreferences().profileImage) : ''
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    if (!profileOpen) return undefined
    function closeProfileMenu(event) {
      const clickedOutside = event.type === 'pointerdown' && !profileMenuRef.current?.contains(event.target)
      if (event.key === 'Escape' || clickedOutside) setProfileOpen(false)
    }
    document.addEventListener('pointerdown', closeProfileMenu)
    document.addEventListener('keydown', closeProfileMenu)
    return () => {
      document.removeEventListener('pointerdown', closeProfileMenu)
      document.removeEventListener('keydown', closeProfileMenu)
    }
  }, [profileOpen])

  return (
    <header className="app-header">
      <div className="app-nav">
        <button className="app-brand" type="button" onClick={() => onNavigate('home')}>
          <span className="brand-mark" aria-hidden="true">
            <Anvil className="brand-anvil" size={25} strokeWidth={2.2} />
            <Sparkles className="brand-spark" size={13} strokeWidth={2.6} />
          </span>
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
          <div className="account-menu" ref={profileMenuRef}>
            <button className="account-avatar" type="button" onClick={() => setProfileOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={profileOpen}>{profileImage ? <img src={profileImage} alt="" /> : initial}</button>
            <span className="account-copy">
              <strong>{user.name || 'Creator'}</strong>
              <small>{user.email}</small>
            </span>
            {profileOpen && (
              <div className="profile-menu-panel">
                <span className="profile-menu-avatar">{profileImage ? <img src={profileImage} alt="Your profile" /> : initial}</span>
                <div className="profile-menu-identity"><strong>{user.name || 'Creator'}</strong><span>{user.email}</span></div>
                <button type="button" onClick={() => { setProfileOpen(false); onNavigate('settings') }}><Settings size={16} /><span>Profile & settings</span></button>
                <button className="profile-menu-logout" type="button" onClick={onLogout}><LogOut size={16} /><span>Log out</span></button>
              </div>
            )}
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
