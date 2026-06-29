// src/components/Toast/Toast.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Info, CheckCircle, WarningCircle, X } from '@phosphor-icons/react'
import { usePortalTarget, useThemedPortalProps } from '../../theme/ThemeProvider'
import styles from './Toast.module.css'

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastAction {
  label:   string
  onClick: () => void
}

export interface ToastData {
  id:       string
  variant:  ToastVariant
  message:  string
  action?:  ToastAction
  duration?: number   // ms; default = 4000; 0 = persistent
}

interface ToastState extends ToastData {
  leaving?: boolean
}

interface ToastCtx {
  push:    (data: Omit<ToastData, 'id'>) => string
  dismiss: (id: string) => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 4000
// Must match --dur-slow (200ms) so the CSS exit animation completes before removal.
const LEAVE_DURATION   = 200

let _seq = 0

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastCtx | null>(null)

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Icons ────────────────────────────────────────────────────────────────────

const ICONS: Record<ToastVariant, React.ReactNode> = {
  info:    <Info           weight="fill" size={16} />,
  success: <CheckCircle   weight="fill" size={16} />,
  error:   <WarningCircle weight="fill" size={16} />,
}

// ── ToastItem ────────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast:     ToastState
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { variant, message, action, duration = DEFAULT_DURATION, leaving } = toast
  const timerRef = useRef<number | null>(null)

  const startTimer = useCallback(() => {
    if (duration === 0) return
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      onDismiss()
    }, duration)
  }, [duration, onDismiss])

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Start timer on mount; clear on unmount.
  useEffect(() => {
    startTimer()
    return stopTimer
  }, [startTimer, stopTimer])

  // Cancel timer when the leaving animation begins (dismiss already triggered).
  useEffect(() => {
    if (leaving) stopTimer()
  }, [leaving, stopTimer])

  function handleAction() {
    action!.onClick()
    onDismiss()
  }

  // role="alert" (assertive) for errors; role="status" (polite) for info/success.
  const role = variant === 'error' ? 'alert' : 'status'

  return (
    <div
      className={styles.toast}
      role={role}
      data-variant={variant}
      data-leaving={leaving || undefined}
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[variant]}
      </span>
      <span className={styles.message}>{message}</span>
      {action && (
        <button
          type="button"
          className={styles.action}
          onClick={handleAction}
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

// ── ToastProvider ────────────────────────────────────────────────────────────

export interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const portalTarget = usePortalTarget()
  const themedProps = useThemedPortalProps()

  const dismiss = useCallback((id: string) => {
    // Under reduced-motion, skip the exit animation and remove immediately.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setToasts(prev => prev.filter(t => t.id !== id))
      return
    }
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, LEAVE_DURATION)
  }, [])

  const push = useCallback((data: Omit<ToastData, 'id'>): string => {
    const id = `toast-${++_seq}`
    // Prepend so newest is first in the DOM; flex-direction:column-reverse places
    // the first child at the container's bottom edge (closest to corner).
    setToasts(prev => [{ ...data, id }, ...prev])
    return id
  }, [])

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      {/* Re-declare the opening subtree's theme tokens at the portal root so toasts
          resolve var(--…) even though they escape the themed subtree. */}
      {createPortal(
        <div {...themedProps}>
          <div className={styles.container}>
            {toasts.map(toast => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onDismiss={() => dismiss(toast.id)}
              />
            ))}
          </div>
        </div>,
        portalTarget ?? document.body,
      )}
    </ToastContext.Provider>
  )
}
