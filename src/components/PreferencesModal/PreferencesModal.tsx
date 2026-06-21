// src/components/PreferencesModal/PreferencesModal.tsx
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './PreferencesModal.module.css'

export interface PreferencesSection {
  id: string
  label: string
  icon: React.ReactNode
}

export interface PreferencesModalProps {
  open: boolean
  onClose: () => void
  sections: PreferencesSection[]
  active: string
  onSelect: (id: string) => void
  children?: React.ReactNode
}

const FOCUSABLE = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
}

export function PreferencesModal({
  open,
  onClose,
  sections,
  active,
  onSelect,
  children,
}: PreferencesModalProps) {
  const panelId    = useId()
  const dialogRef  = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const portalTarget   = usePortalTarget()

  // Capture trigger element BEFORE focus shifts on open.
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement
    }
  }, [open])

  // Explicit focus on open (WKWebView: clicking a <button> does NOT focus it).
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = getFocusable(dialogRef.current)
    const target = focusable[0] ?? dialogRef.current
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
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  // Focus trap: Tab / Shift+Tab cycles within the dialog.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = getFocusable(dialogRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  if (!open) return null

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onSelect(sections[(idx + 1) % sections.length].id)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onSelect(sections[(idx - 1 + sections.length) % sections.length].id)
    }
  }

  return createPortal(
    <div className={styles.scrim} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Preferences"
        className={styles.modal}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={styles.header}>
          <span className={styles.title}>PREFERENCES</span>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close preferences"
            onClick={onClose}
          >
            <X weight="regular" size={14} aria-hidden="true" />
          </button>
        </div>

        {/* ── Body: sidebar + content ── */}
        <div className={styles.layout}>
          <nav
            role="tablist"
            aria-orientation="vertical"
            aria-label="Preferences sections"
            className={styles.sidebar}
          >
            {sections.map((section, idx) => {
              const tabId   = `${panelId}-tab-${section.id}`
              const isActive = section.id === active
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  id={tabId}
                  aria-selected={isActive}
                  aria-controls={`${panelId}-panel`}
                  tabIndex={isActive ? 0 : -1}
                  className={styles.navItem}
                  data-active={isActive || undefined}
                  onClick={() => onSelect(section.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                >
                  <span className={styles.navIcon} aria-hidden="true">
                    {section.icon}
                  </span>
                  <span className={styles.navLabel}>{section.label}</span>
                </button>
              )
            })}
          </nav>

          <div
            id={`${panelId}-panel`}
            role="tabpanel"
            aria-labelledby={`${panelId}-tab-${active}`}
            className={styles.content}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    portalTarget ?? document.body,
  )
}
