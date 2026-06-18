// src/components/ContextMenu/ContextMenu.tsx
import { useRef } from 'react'
import styles from './ContextMenu.module.css'
import { Popover } from '../Popover'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id:        string
  label:     string
  icon?:     React.ReactNode
  shortcut?: string
  disabled?: boolean
  checked?:  boolean
  danger?:   boolean
  onSelect?: () => void
  submenu?:  MenuEntry[]   // v2 — reserved, not implemented
}

export interface MenuSeparator {
  id:        string
  separator: true
}

export type MenuEntry = MenuItem | MenuSeparator

export interface ContextMenuProps {
  items:         MenuEntry[]
  open:          boolean
  x:             number
  y:             number
  onClose:       () => void
  'aria-label'?: string
}

export function isSeparator(e: MenuEntry): e is MenuSeparator {
  return 'separator' in e && (e as MenuSeparator).separator === true
}

// ── ContextMenu ───────────────────────────────────────────────────────────────

export function ContextMenu({
  items,
  open,
  x,
  y,
  onClose,
  'aria-label': ariaLabel = 'Context menu',
}: ContextMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef      = useRef<HTMLUListElement>(null)
  const itemRefs     = useRef<Record<string, HTMLLIElement | null>>({})

  if (!open) return null

  return (
    <div ref={containerRef}>
      <Popover anchor={{ x, y }} containerRef={containerRef} onClose={onClose}>
        <ul
          role="menu"
          aria-label={ariaLabel}
          className={styles.menu}
          ref={menuRef}
        >
          {items.map(entry =>
            isSeparator(entry) ? (
              <li key={entry.id} role="separator" className={styles.separator} />
            ) : (
              <li
                key={entry.id}
                role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                aria-disabled={entry.disabled || undefined}
                aria-checked={entry.checked ?? undefined}
                data-danger={entry.danger || undefined}
                tabIndex={-1}
                className={styles.item}
                ref={el => { itemRefs.current[entry.id] = el }}
                onClick={() => {
                  if (entry.disabled) return
                  entry.onSelect?.()
                  onClose()
                }}
              >
                <span className={styles.leadSlot} aria-hidden>
                  {entry.checked !== undefined
                    ? (entry.checked
                        ? <span className={styles.checkmark}>✓</span>
                        : null)
                    : (entry.icon ?? null)}
                </span>
                <span className={styles.label}>{entry.label}</span>
                {entry.shortcut && (
                  <span className={styles.shortcut} aria-hidden>{entry.shortcut}</span>
                )}
              </li>
            )
          )}
        </ul>
      </Popover>
    </div>
  )
}
