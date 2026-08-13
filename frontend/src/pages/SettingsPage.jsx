import { Check, ImagePlus, Moon, RotateCcw, Settings, SlidersHorizontal, Sparkles, Sun, Trash2 } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { defaultPreferences } from '../services/preferences'
import { readProfileImage } from '../services/profileImage'
import { toast } from '../services/toast'

const themes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: SlidersHorizontal },
]

function SettingsPage({ user, preferences, onPreferencesChange, onNavigate, onLogout }) {
  const update = (changes) => onPreferencesChange({ ...preferences, ...changes })
  const initial = (user?.name || user?.email || 'Q').trim().charAt(0).toUpperCase()

  async function selectProfileImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      update({ profileImage: await readProfileImage(file) })
      toast.success('Profile picture updated')
    } catch (error) {
      toast.error(error.message)
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="app-shell">
      <AppHeader activePage="settings" title="Settings" subtitle="Make QuizForge work the way you prefer." user={user} profileImage={preferences.profileImage} onNavigate={onNavigate} onLogout={onLogout} />
      <section className="settings-page">
        <aside className="settings-summary simple-card">
          <span className="settings-summary-icon"><Settings size={23} /></span>
          <h2>Your preferences</h2>
          <p>Changes are saved automatically on this browser.</p>
          <div className="settings-saved"><Check size={15} /> Up to date</div>
        </aside>

        <div className="settings-sections">
          <section className="simple-card settings-card">
            <div className="settings-card-heading"><ImagePlus size={20} /><div><h2>Profile picture</h2><p>Choose the picture people see when you join a session.</p></div></div>
            <div className="profile-picture-editor">
              <span className="profile-picture-preview">{preferences.profileImage ? <img src={preferences.profileImage} alt="Your profile" /> : initial}</span>
              <div><strong>{user?.name || 'QuizForge user'}</strong><small>PNG, JPG or WebP, up to 2 MB. A square crop is created automatically.</small><div className="profile-picture-actions"><label className="icon-text-button"><ImagePlus size={16} /> Choose picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectProfileImage} /></label>{preferences.profileImage && <button className="profile-remove-button" type="button" onClick={() => { update({ profileImage: '' }); toast.info('Profile picture removed') }}><Trash2 size={15} /> Remove</button>}</div></div>
            </div>
          </section>

          <section className="simple-card settings-card">
            <div className="settings-card-heading"><Sun size={20} /><div><h2>Appearance</h2><p>Choose how the interface looks and feels.</p></div></div>
            <div className="theme-options">
              {themes.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={preferences.theme === id ? 'active' : ''} onClick={() => { update({ theme: id }); toast.success(`${label} theme selected`) }} aria-pressed={preferences.theme === id}>
                  <Icon size={19} /><span>{label}</span>{preferences.theme === id && <Check size={16} />}
                </button>
              ))}
            </div>
          </section>

          <section className="simple-card settings-card">
            <div className="settings-card-heading"><Sparkles size={20} /><div><h2>Quiz defaults</h2><p>Start every new quiz with your usual choices.</p></div></div>
            <div className="settings-fields">
              <label>Default question count<input type="number" min="1" max="30" value={preferences.defaultQuestionCount} onChange={(event) => update({ defaultQuestionCount: Math.min(30, Math.max(1, Number(event.target.value) || 1)) })} /></label>
              <label>Default difficulty<select value={preferences.defaultDifficulty} onChange={(event) => update({ defaultDifficulty: event.target.value })}>{['Easy', 'Medium', 'Hard', 'Mixed'].map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </section>

          <button className="settings-reset" type="button" onClick={() => { onPreferencesChange(defaultPreferences); toast.info('Preferences reset to defaults') }}><RotateCcw size={16} /> Reset all preferences</button>
        </div>
      </section>
    </main>
  )
}

export default SettingsPage
