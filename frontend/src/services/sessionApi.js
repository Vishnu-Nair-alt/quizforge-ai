import { apiRequest } from './api'

function participantParams(participant) {
  return new URLSearchParams({
    participant_id: participant.participant_id,
    participant_token: participant.participant_token,
  })
}

export const sessionApi = {
  currentHost() {
    return apiRequest('/sessions/current-host')
  },
  create(quizId) {
    return apiRequest('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: Number(quizId) }),
    })
  },
  status(code) {
    return apiRequest(`/sessions/${code}/status`)
  },
  lobby(code) {
    return apiRequest(`/sessions/${code}/lobby`)
  },
  join(code, name) {
    return apiRequest(`/sessions/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  },
  start(code) {
    return apiRequest(`/sessions/${code}/start`, { method: 'POST' })
  },
  end(code) {
    return apiRequest(`/sessions/${code}/end`, { method: 'POST' })
  },
  questions(code, participant) {
    return apiRequest(`/sessions/${code}/questions?${participantParams(participant)}`)
  },
  submit(code, participant, answers) {
    return apiRequest(`/sessions/${code}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: participant.participant_id,
        participant_token: participant.participant_token,
        answers,
      }),
    })
  },
  myResult(code, participant) {
    return apiRequest(`/sessions/${code}/my-result?${participantParams(participant)}`)
  },
  results(code) {
    return apiRequest(`/sessions/${code}/results`)
  },
}
