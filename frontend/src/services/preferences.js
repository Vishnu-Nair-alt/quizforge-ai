export const PREFERENCES_KEY = 'quizforge_preferences'

export const defaultPreferences = {
  theme: 'system',
  profileImage: '',
  notificationsEnabled: true,
  defaultQuestionCount: 10,
  defaultDifficulty: 'Mixed',
}

export function getPreferences() {
  try {
    const savedPreferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}')
    delete savedPreferences.reduceMotion
    return { ...defaultPreferences, ...savedPreferences }
  } catch {
    return defaultPreferences
  }
}

export function savePreferences(preferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
}

export function applyPreferences(preferences) {
  const root = document.documentElement
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  root.dataset.theme = preferences.theme === 'system' ? (systemDark ? 'dark' : 'light') : preferences.theme
  delete root.dataset.density
  delete root.dataset.reduceMotion
}
