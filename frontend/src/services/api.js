export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'

export const AUTH_TOKEN_KEY = 'quizforge_token'
export const AUTH_USER_KEY = 'quizforge_user'

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredUser() {
  const user = localStorage.getItem(AUTH_USER_KEY)
  return user ? JSON.parse(user) : null
}

export function storeSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error(`Cannot connect to the backend at ${API_BASE_URL}.`)
  }
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data.detail

    throw new Error(detail || data.message || 'Request failed')
  }

  return data
}
