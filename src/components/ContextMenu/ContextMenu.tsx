// src/components/ContextMenu/ContextMenu.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  submenu?:  MenuEntry[]   // v2 — reserved
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

// ── useContextMenu ────────────────────────────────────────────────────────────

export function useContextMenu() {
  const [state, setState] = useState<{ open: boolean; x: number; y: number }>({
    open: false, x: 0, y: 0,
  })

  function close() { setState(s => ({ ...s, open: false })) }

  const triggerProps = {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      setState({ open: true, x: e.clientX, y: e.clientY })
    },
  }

  return { open: state.open, x: state.x, y: state.y, onClose: close, triggerProps }
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
  const containerRef   = useRef<HTMLDivElement>(null)
  const menuRef        = useRef<HTMLUListElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const itemRefs       = useRef<Record<string, HTMLLIElement | null>>({})
  const [focusedIndex, setFocusedIndex] = useState(0)

  // All non-separator items are focusable — including disabled (APG pattern:
  // disabled items are reachable but inert on activation).
  const focusable = items.filter((e): e is MenuItem => !isSeparator(e))

  // Capture the currently focused element before it moves to the menu.
  // useLayoutEffect fires before useEffect so the capture happens before
  // the focus-on-open effect below moves focus to the first item.
  useLayoutEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement
  }, []) // empty deps — component only mounts when open=true

  // Focus the first item on open.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const first = focusable[0]
    if (first) {
      itemRefs.current[first.id]?.focus()
      setFocusedIndex(0)
    }
  }, []) // empty deps — intentional: run once on mount

  if (!open) return null

  function handleClose() {
    returnFocusRef.current?.focus()
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const n = focusable.length
    if (n === 0) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = (focusedIndex + 1) % n
        setFocusedIndex(next)
        itemRefs.current[focusable[next].id]?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = (focusedIndex - 1 + n) % n
        setFocusedIndex(prev)
        itemRefs.current[focusable[prev].id]?.focus()
        break
      }
      case 'Home': {
        e.preventDefault()
        setFocusedIndex(0)
        itemRefs.current[focusable[0].id]?.focus()
        break
      }
      case 'End': {
        e.preventDefault()
        const last = n - 1
        setFocusedIndex(last)
        itemRefs.current[focusable[last].id]?.focus()
        break
      }
      case ' ': {
        e.preventDefault()
        const item = focusable[focusedIndex]
        if (item && !item.disabled) { item.onSelect?.(); handleClose() }
        break
      }
      case 'Enter': {
        const item = focusable[focusedIndex]
        if (item && !item.disabled) { item.onSelect?.(); handleClose() }
        break
      }
      case 'Tab': {
        handleClose()
        break
      }
    }
  }

  return (
    <div ref={containerRef}>
      <Popover anchor={{ x, y }} containerRef={containerRef} onClose={handleClose}>
        <ul
          role="menu"
          aria-label={ariaLabel}
          className={styles.menu}
          ref={menuRef}
          onKeyDown={handleKeyDown}
        >
          {items.map((entry, _i) =>
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
                onFocus={() => {
                  const idx = focusable.findIndex(f => f.id === entry.id)
                  if (idx >= 0) setFocusedIndex(idx)
                }}
                onClick={() => {
                  if (entry.disabled) return
                  entry.onSelect?.()
                  handleClose()
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
