// src/components/Preferences/Preferences.tsx
import { useEffect, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './Preferences.module.css'

export interface PreferencesSection {
  id: string
  label: string
}

export interface PreferencesProps {
  open: boolean
  onClose: () => void
  sections: PreferencesSection[]
  active: string
  onSelect: (id: string) => void
  children: React.ReactNode
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

export function Preferences({
  open,
  onClose,
  sections,
  active,
  onSelect,
  children,
}: PreferencesProps) {
  const titleId = useId()
  const modalRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const portalTarget = usePortalTarget()

  // Capture trigger before the focus shift below.
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement
    }
  }, [open])

  // Focus the section select on open (WKWebView: clicking a button does NOT focus it).
  useEffect(() => {
    if (!open || !modalRef.current) return
    const target = selectRef.current ?? getFocusable(modalRef.current)[0] ?? modalRef.current
    target.focus()
  }, [open])

  // Return focus to trigger on close.
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

  // Focus trap: Tab/Shift+Tab cycles within the modal.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusable = getFocusable(modalRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last!.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first!.focus()
        }
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  if (!open) return null

  const activeLabel = sections.find(s => s.id === active)?.label

  return createPortal(
    <div className={styles.scrim} onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.modal}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>PREFERENCES</h2>
          <button
            className={styles.closeBtn}
            aria-label="Close preferences"
            onClick={onClose}
          >
            <X weight="bold" size={14} />
          </button>
        </div>

        {/* Section selector */}
        <div className={styles.sectionBar}>
          <select
            ref={selectRef}
            className={styles.sectionSelect}
            value={active}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Preferences section"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        {/* Panel — full width */}
        <div
          role="region"
          aria-label={activeLabel}
          className={styles.content}
        >
          {children}
        </div>
      </div>
    </div>,
    portalTarget ?? document.body,
  )
}
