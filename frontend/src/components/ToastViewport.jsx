import { useEffect, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { TOAST_EVENT } from '../services/toast'

const icons = { success: CheckCircle2, error: XCircle, info: Info }

function ToastViewport() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function addToast(event) {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((current) => [...current.slice(-3), { id, ...event.detail }])
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200)
    }
    window.addEventListener(TOAST_EVENT, addToast)
    return () => window.removeEventListener(TOAST_EVENT, addToast)
  }, [])

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => {
        const Icon = icons[item.type] || Info
        return (
          <div className={`toast toast-${item.type}`} role={item.type === 'error' ? 'alert' : 'status'} key={item.id}>
            <Icon size={19} />
            <span>{item.message}</span>
            <button type="button" onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))} aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastViewport
