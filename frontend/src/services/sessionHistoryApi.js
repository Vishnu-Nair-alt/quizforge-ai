import { API_BASE_URL, apiRequest, getStoredToken } from './api'

export const sessionHistoryApi = {
  list() {
    return apiRequest('/session-history')
  },
  detail(sessionCode) {
    return apiRequest(`/session-history/${sessionCode}`)
  },
  async download(sessionCode) {
    const response = await fetch(
      `${API_BASE_URL}/session-history/${sessionCode}/export`,
      {
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
        },
      },
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || 'Could not export the session report.')
    }

    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const filename =
      disposition.match(/filename="([^"]+)"/)?.[1] ||
      `quizforge-${sessionCode}-results.csv`
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
