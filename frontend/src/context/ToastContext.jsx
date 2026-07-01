import { createContext, useCallback, useContext, useState } from 'react'
import { HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineX } from 'react-icons/hi'

const ToastContext = createContext(null)

const ICONS = {
  success: HiOutlineCheckCircle,
  error: HiOutlineExclamationCircle,
  info: HiOutlineInformationCircle,
}

const STYLES = {
  success: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-900 shadow-emerald-200/50',
  error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-900 shadow-red-200/50',
  info: 'bg-gradient-to-r from-sky-50 to-violet-50 border-violet-300 text-violet-900 shadow-violet-200/50',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(({ id, message, type }) => {
          const Icon = ICONS[type] || ICONS.info
          return (
            <div
              key={id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md border-2 shadow-lg toast-enter ${STYLES[type] || STYLES.info}`}
              role="status"
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
              <button
                type="button"
                onClick={() => dismiss(id)}
                className="p-0.5 rounded-md opacity-60 hover:opacity-100 transition-opacity shrink-0"
                aria-label="Dismiss"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
