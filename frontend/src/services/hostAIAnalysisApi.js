import { apiRequest } from './api'


export const hostAIAnalysisApi = {
  get(sessionId) {
    return apiRequest(`/sessions/${sessionId}/ai-analysis`)
  },
}
