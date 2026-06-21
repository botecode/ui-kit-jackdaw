// src/components/Preferences/Preferences.tsx
import { useEffect, useRef, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
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
  const panelId = useId()
  const modalRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const portalTarget = usePortalTarget()

  // Capture trigger before the focus shift below.
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement
    }
  }, [open])

  // Explicit focus on open (WKWebView: clicking a button does NOT focus it).
  useEffect(() => {
    if (!open || !modalRef.current) return
    const focusable = getFocusable(modalRef.current)
    const target = focusable[0] ?? modalRef.current
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

  // Tablist Arrow Up/Down / Home / End navigation.
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const total = sections.length
      let next = -1
      if (e.key === 'ArrowDown') next = (idx + 1) % total
      if (e.key === 'ArrowUp')   next = (idx - 1 + total) % total
      if (e.key === 'Home')      next = 0
      if (e.key === 'End')       next = total - 1
      if (next >= 0) {
        e.preventDefault()
        const tabs = modalRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')
        tabs?.[next]?.focus()
        onSelect(sections[next]!.id)
      }
    },
    [sections, onSelect],
  )

  if (!open) return null

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

        {/* Body: sidebar + content */}
        <div className={styles.body}>
          <nav className={styles.sidebar} aria-label="Preferences navigation">
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Preferences sections"
            >
              {sections.map((section, idx) => {
                const selected = section.id === active
                return (
                  <button
                    key={section.id}
                    id={`${panelId}-tab-${section.id}`}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    className={styles.navItem}
                    data-selected={selected || undefined}
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
            </div>
          </nav>

          <div
            role="tabpanel"
            id={panelId}
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
