// src/components/Dialog/Dialog.tsx
import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './Dialog.module.css'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  size?: 'sm' | 'md'
  dismissible?: boolean
  'aria-label'?: string
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  dismissible = true,
  'aria-label': ariaLabel,
}: DialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const portalTarget = usePortalTarget()

  // Capture the trigger element BEFORE the focus-shift effect below runs.
  // Effects fire in definition order — this runs first while trigger is still focused.
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement
    }
  }, [open])

  // Explicit focus on open (WKWebView: clicking a button does NOT focus it).
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = getFocusable(dialogRef.current)
    const target = focusable[0] ?? dialogRef.current
    target.focus()
  }, [open])

  // Return focus to the trigger on close.
  useEffect(() => {
    if (!open && returnFocusRef.current) {
      returnFocusRef.current.focus()
      returnFocusRef.current = null
    }
  }, [open])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Esc to close.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  // Focus trap: Tab/Shift+Tab cycles within the dialog.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = getFocusable(dialogRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={styles.scrim}
      onClick={dismissible ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        className={styles.dialog}
        data-size={size}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {actions != null && (
          <div className={styles.footer}>{actions}</div>
        )}
      </div>
    </div>,
    portalTarget ?? document.body,
  )
}
