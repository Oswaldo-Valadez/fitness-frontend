import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { clsx } from 'clsx'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastOptions {
  variant?: ToastVariant
  message: string
  action?: ToastAction
  /** ms before auto-dismiss; set 0 to require manual dismiss */
  duration?: number
}

interface Toast extends Required<Pick<ToastOptions, 'message'>> {
  id: number
  variant: ToastVariant
  action?: ToastAction
}

interface ToastContextValue {
  show: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-accent',
  error: 'text-destructive',
  info: 'text-primary',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    ({ variant = 'info', message, action, duration = 4000 }: ToastOptions) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, variant, message, action }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 top-4 z-200 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((t) => {
            const Icon = ICONS[t.variant]
            return (
              <div
                key={t.id}
                role="status"
                className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-elevated"
              >
                <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', ICON_COLORS[t.variant])} aria-hidden="true" />
                <p className="flex-1 text-sm text-foreground">{t.message}</p>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action?.onClick()
                      dismiss(t.id)
                    }}
                    className="shrink-0 cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
                <button onClick={() => dismiss(t.id)} aria-label="Cerrar notificación" className="shrink-0 cursor-pointer text-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
