const TOAST_EVENT = 'quizforge:toast'

export function toast(message, type = 'info') {
  if (!message) return
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }))
}

toast.success = (message) => toast(message, 'success')
toast.error = (message) => toast(message, 'error')
toast.info = (message) => toast(message, 'info')

export { TOAST_EVENT }
