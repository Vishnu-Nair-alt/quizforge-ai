import { Check, Moon, RotateCcw, Settings, SlidersHorizontal, Sparkles, Sun } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { defaultPreferences } from '../services/preferences'

const themes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: SlidersHorizontal },
]

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="settings-toggle-row">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="settings-switch" aria-hidden="true"><i /></span>
    </label>
  )
}

function SettingsPage({ user, preferences, onPreferencesChange, onNavigate, onLogout }) {
  const update = (changes) => onPreferencesChange({ ...preferences, ...changes })

  return (
    <main className="app-shell">
      <AppHeader activePage="settings" title="Settings" subtitle="Make QuizForge work the way you prefer." user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <section className="settings-page">
        <aside className="settings-summary simple-card">
          <span className="settings-summary-icon"><Settings size={23} /></span>
          <h2>Your preferences</h2>
          <p>Changes are saved automatically on this browser.</p>
          <div className="settings-saved"><Check size={15} /> Up to date</div>
        </aside>

        <div className="settings-sections">
          <section className="simple-card settings-card">
            <div className="settings-card-heading"><Sun size={20} /><div><h2>Appearance</h2><p>Choose how the interface looks and feels.</p></div></div>
            <div className="theme-options">
              {themes.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={preferences.theme === id ? 'active' : ''} onClick={() => update({ theme: id })} aria-pressed={preferences.theme === id}>
                  <Icon size={19} /><span>{label}</span>{preferences.theme === id && <Check size={16} />}
                </button>
              ))}
            </div>
            <div className="settings-toggle-list">
              <Toggle checked={preferences.compactMode} onChange={(compactMode) => update({ compactMode })} label="Compact layout" description="Reduce spacing to show more content at once." />
              <Toggle checked={preferences.reduceMotion} onChange={(reduceMotion) => update({ reduceMotion })} label="Reduce motion" description="Minimize interface animations and transitions." />
            </div>
          </section>

          <section className="simple-card settings-card">
            <div className="settings-card-heading"><Sparkles size={20} /><div><h2>Quiz defaults</h2><p>Start every new quiz with your usual choices.</p></div></div>
            <div className="settings-fields">
              <label>Default question count<input type="number" min="1" max="30" value={preferences.defaultQuestionCount} onChange={(event) => update({ defaultQuestionCount: Math.min(30, Math.max(1, Number(event.target.value) || 1)) })} /></label>
              <label>Default difficulty<select value={preferences.defaultDifficulty} onChange={(event) => update({ defaultDifficulty: event.target.value })}>{['Easy', 'Medium', 'Hard', 'Mixed'].map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </section>

          <button className="settings-reset" type="button" onClick={() => onPreferencesChange(defaultPreferences)}><RotateCcw size={16} /> Reset all preferences</button>
        </div>
      </section>
    </main>
  )
}

export default SettingsPage
