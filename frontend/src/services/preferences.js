export const PREFERENCES_KEY = 'quizforge_preferences'

export const defaultPreferences = {
  theme: 'system',
  compactMode: false,
  reduceMotion: false,
  defaultQuestionCount: 10,
  defaultDifficulty: 'Mixed',
}

export function getPreferences() {
  try {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}') }
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
  root.dataset.density = preferences.compactMode ? 'compact' : 'comfortable'
  root.dataset.reduceMotion = preferences.reduceMotion ? 'true' : 'false'
}
