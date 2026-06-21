// src/components/Preferences/Preferences.tsx
import { useEffect, useRef, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './Preferences.module.css'

export interface PreferencesSection {
  id: string
  label: string
  icon: React.ReactNode
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

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
}

export function Preferences({
  open,
  onClose,
  sections,
  active,
  onSelect,
  children,
}: PreferencesProps) {
  const uid     = useId()
  const titleId = `${uid}-title`
  const shellRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const portalTarget = usePortalTarget()

  // Capture trigger before focus shifts.
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement
    }
  }, [open])

  // Explicit focus on open (WKWebView: clicking a button does NOT focus it).
  useEffect(() => {
    if (!open || !shellRef.current) return
    const focusable = getFocusable(shellRef.current)
    const target = focusable[0] ?? shellRef.current
    target.focus()
  }, [open])

  // Return focus on close.
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

  // Focus trap: Tab/Shift+Tab cycles within the shell.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !shellRef.current) return
      const focusable = getFocusable(shellRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  // Arrow key nav in the vertical tablist.
  const handleNavKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const idx = sections.findIndex(s => s.id === active)
    if (idx === -1) return
    const next = e.key === 'ArrowDown'
      ? sections[(idx + 1) % sections.length]
      : sections[(idx - 1 + sections.length) % sections.length]
    onSelect(next.id)
  }, [sections, active, onSelect])

  if (!open) return null

  return createPortal(
    <div className={styles.scrim} onClick={onClose}>
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.shell}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>PREFERENCES</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close preferences"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </header>

        {/* Body: sidebar + content */}
        <div className={styles.body}>
          {/* Sidebar nav */}
          <nav
            className={styles.sidebar}
            role="tablist"
            aria-orientation="vertical"
            aria-label="Preferences sections"
            onKeyDown={handleNavKeyDown}
          >
            {sections.map(section => (
              <button
                key={section.id}
                role="tab"
                id={`${uid}-tab-${section.id}`}
                aria-selected={active === section.id}
                aria-controls={`${uid}-panel-${section.id}`}
                className={styles.navItem}
                data-active={active === section.id || undefined}
                onClick={() => onSelect(section.id)}
                tabIndex={active === section.id ? 0 : -1}
              >
                <span className={styles.navIcon} aria-hidden="true">{section.icon}</span>
                <span className={styles.navLabel}>{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div
            role="tabpanel"
            id={`${uid}-panel-${active}`}
            aria-labelledby={`${uid}-tab-${active}`}
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
