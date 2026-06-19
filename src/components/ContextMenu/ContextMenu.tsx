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
  submenu?:  MenuEntry[]   // one-level flyout — leaf submenus ignore their own .submenu
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

function hasSubmenu(e: MenuItem): boolean {
  return Array.isArray(e.submenu) && e.submenu.length > 0
}

// ── Tuning ────────────────────────────────────────────────────────────────────

const MARGIN = 4                 // viewport gap, matches Popover
const SUBMENU_OPEN_DELAY  = 120  // hover-intent: dwell before a flyout opens
const SUBMENU_CLOSE_DELAY = 220  // grace period to cross the gap into the flyout

// Sub-panel position: flush to the parent item's right edge, flipping to the left
// side when there isn't room, then clamped to the viewport on both axes.
function computeSubmenuPosition(
  parentRect: DOMRect,
  subW:       number,
  subH:       number,
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = parentRect.right - 2   // slight overlap so there's no dead gap
  let top  = parentRect.top - 4     // offset up by the menu's own top padding

  if (left + subW + MARGIN > vw) left = parentRect.left - subW + 2  // flip left
  if (top  + subH + MARGIN > vh) top  = vh - subH - MARGIN          // shift up

  left = Math.max(MARGIN, Math.min(left, vw - subW - MARGIN))
  top  = Math.max(MARGIN, top)

  return { left, top }
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

// ── MenuRow (shared item presentation) ────────────────────────────────────────

interface MenuRowProps {
  item:          MenuItem
  withSubmenu:   boolean
  expanded:      boolean
  setRef:        (el: HTMLLIElement | null) => void
  onFocus:       () => void
  onClick:       () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function MenuRow({
  item, withSubmenu, expanded, setRef, onFocus, onClick, onMouseEnter, onMouseLeave,
}: MenuRowProps) {
  return (
    <li
      role={item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
      aria-disabled={item.disabled || undefined}
      aria-checked={item.checked ?? undefined}
      aria-haspopup={withSubmenu ? 'menu' : undefined}
      aria-expanded={withSubmenu ? expanded : undefined}
      data-danger={item.danger || undefined}
      data-has-submenu={withSubmenu || undefined}
      tabIndex={-1}
      className={styles.item}
      ref={setRef}
      onFocus={onFocus}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className={styles.leadSlot} aria-hidden="true">
        {item.checked !== undefined
          ? (item.checked
              ? <span className={styles.checkmark}>✓</span>
              : null)
          : (item.icon ?? null)}
      </span>
      <span className={styles.label}>{item.label}</span>
      {withSubmenu
        ? <span className={styles.caret} aria-hidden="true">▸</span>
        : item.shortcut && (
            <span className={styles.shortcut} aria-hidden="true">{item.shortcut}</span>
          )}
    </li>
  )
}

// ── Submenu (one-level flyout panel) ──────────────────────────────────────────

interface SubmenuProps {
  items:          MenuEntry[]
  parentItem:     HTMLLIElement
  autoFocus:      boolean
  ariaLabel:      string
  onCloseSubmenu: () => void   // dismiss just the flyout, return focus to parent
  onCloseAll:     () => void   // a leaf was chosen — tear the whole menu down
  onPointerEnter: () => void   // cancel a pending hover-close
  onPointerLeave: () => void   // schedule a hover-close
}

function Submenu({
  items, parentItem, autoFocus, ariaLabel,
  onCloseSubmenu, onCloseAll, onPointerEnter, onPointerLeave,
}: SubmenuProps) {
  const ulRef    = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Leaf-only: a one-level flyout never renders carets for deeper submenus.
  const focusable = items.filter((e): e is MenuItem => !isSeparator(e))

  // Measure self + parent, position with viewport flip (two-pass: hidden → shown).
  useLayoutEffect(() => {
    const ul = ulRef.current
    if (!ul) return
    const self = ul.getBoundingClientRect()
    const par  = parentItem.getBoundingClientRect()
    setPos(computeSubmenuPosition(par, self.width, self.height))
  }, [parentItem])

  // Keyboard entry (→ / Enter) lands focus on the first item; hover does not steal it.
  useEffect(() => {
    if (!autoFocus) return
    const first = focusable[0]
    if (first) {
      itemRefs.current[first.id]?.focus()
      setFocusedIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    const n = focusable.length
    if (n === 0) return

    // Submenu lives in a sibling subtree of the root <ul>, but stop handled keys
    // anyway so intent is explicit and nothing double-fires if nesting changes.
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault(); e.stopPropagation()
        const next = (focusedIndex + 1) % n
        setFocusedIndex(next)
        itemRefs.current[focusable[next].id]?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault(); e.stopPropagation()
        const prev = (focusedIndex - 1 + n) % n
        setFocusedIndex(prev)
        itemRefs.current[focusable[prev].id]?.focus()
        break
      }
      case 'Home': {
        e.preventDefault(); e.stopPropagation()
        setFocusedIndex(0)
        itemRefs.current[focusable[0].id]?.focus()
        break
      }
      case 'End': {
        e.preventDefault(); e.stopPropagation()
        const last = n - 1
        setFocusedIndex(last)
        itemRefs.current[focusable[last].id]?.focus()
        break
      }
      case 'ArrowLeft': {
        e.preventDefault(); e.stopPropagation()
        onCloseSubmenu()
        break
      }
      case ' ':
      case 'Enter': {
        e.preventDefault(); e.stopPropagation()
        const item = focusable[focusedIndex]
        if (item && !item.disabled) { item.onSelect?.(); onCloseAll() }
        break
      }
      case 'Tab': {
        e.stopPropagation()
        onCloseAll()
        break
      }
      // Escape: caught by Popover at the document level → closes the whole menu.
    }
  }

  const style: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.left, top: pos.top, visibility: 'visible' }
    : { position: 'fixed', left: 0, top: 0, visibility: 'hidden' }

  return (
    <ul
      role="menu"
      aria-label={ariaLabel}
      className={styles.menu}
      ref={ulRef}
      style={style}
      onKeyDown={handleKeyDown}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      {items.map(entry =>
        isSeparator(entry) ? (
          <li key={entry.id} role="separator" className={styles.separator} />
        ) : (
          <MenuRow
            key={entry.id}
            item={entry}
            withSubmenu={false}
            expanded={false}
            setRef={el => { itemRefs.current[entry.id] = el }}
            onFocus={() => {
              const idx = focusable.findIndex(f => f.id === entry.id)
              if (idx >= 0) setFocusedIndex(idx)
            }}
            onClick={() => {
              if (entry.disabled) return
              entry.onSelect?.()
              onCloseAll()
            }}
          />
        )
      )}
    </ul>
  )
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
  const openTimer      = useRef<number | null>(null)
  const closeTimer     = useRef<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  // Which item's flyout is open, and whether it should grab focus (keyboard) or
  // merely appear (hover).
  const [sub, setSub] = useState<{ id: string; autoFocus: boolean } | null>(null)

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

  // Drop any pending flyout timers when the menu unmounts.
  useEffect(() => () => {
    if (openTimer.current  !== null) clearTimeout(openTimer.current)
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
  }, [])

  if (!open) return null

  function clearTimers() {
    if (openTimer.current  !== null) { clearTimeout(openTimer.current);  openTimer.current  = null }
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }

  function openSubmenuNow(id: string, autoFocus: boolean) {
    clearTimers()
    setSub({ id, autoFocus })
  }

  function closeSubmenuNow() {
    clearTimers()
    setSub(null)
  }

  function scheduleOpenSubmenu(id: string) {
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null }
    if (openTimer.current  !== null) clearTimeout(openTimer.current)
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null
      setSub({ id, autoFocus: false })
    }, SUBMENU_OPEN_DELAY)
  }

  function scheduleCloseSubmenu() {
    if (openTimer.current  !== null) { clearTimeout(openTimer.current); openTimer.current = null }
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setSub(null)
    }, SUBMENU_CLOSE_DELAY)
  }

  function cancelScheduledClose() {
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }

  function handleClose() {
    clearTimers()
    returnFocusRef.current?.focus()
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const n = focusable.length
    if (n === 0) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        closeSubmenuNow()
        const next = (focusedIndex + 1) % n
        setFocusedIndex(next)
        itemRefs.current[focusable[next].id]?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        closeSubmenuNow()
        const prev = (focusedIndex - 1 + n) % n
        setFocusedIndex(prev)
        itemRefs.current[focusable[prev].id]?.focus()
        break
      }
      case 'Home': {
        e.preventDefault()
        closeSubmenuNow()
        setFocusedIndex(0)
        itemRefs.current[focusable[0].id]?.focus()
        break
      }
      case 'End': {
        e.preventDefault()
        closeSubmenuNow()
        const last = n - 1
        setFocusedIndex(last)
        itemRefs.current[focusable[last].id]?.focus()
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        const item = focusable[focusedIndex]
        if (item && !item.disabled && hasSubmenu(item)) openSubmenuNow(item.id, true)
        break
      }
      case ' ':
      case 'Enter': {
        e.preventDefault()
        const item = focusable[focusedIndex]
        if (!item || item.disabled) break
        if (hasSubmenu(item)) { openSubmenuNow(item.id, true); break }
        item.onSelect?.()
        handleClose()
        break
      }
      case 'Tab': {
        handleClose()
        break
      }
    }
  }

  const subParent = sub ? focusable.find(f => f.id === sub.id) : undefined

  return (
    <div ref={containerRef}>
      <Popover anchor={{ x, y }} containerRef={containerRef} onClose={handleClose}>
        <>
          <ul
            role="menu"
            aria-label={ariaLabel}
            className={styles.menu}
            ref={menuRef}
            onKeyDown={handleKeyDown}
          >
            {items.map(entry => {
              if (isSeparator(entry)) {
                return <li key={entry.id} role="separator" className={styles.separator} />
              }
              const withSubmenu = hasSubmenu(entry)
              return (
                <MenuRow
                  key={entry.id}
                  item={entry}
                  withSubmenu={withSubmenu}
                  expanded={sub?.id === entry.id}
                  setRef={el => { itemRefs.current[entry.id] = el }}
                  onFocus={() => {
                    const idx = focusable.findIndex(f => f.id === entry.id)
                    if (idx >= 0) setFocusedIndex(idx)
                  }}
                  onClick={() => {
                    if (entry.disabled) return
                    if (withSubmenu) { openSubmenuNow(entry.id, true); return }
                    entry.onSelect?.()
                    handleClose()
                  }}
                  onMouseEnter={
                    withSubmenu
                      ? () => scheduleOpenSubmenu(entry.id)
                      : () => scheduleCloseSubmenu()
                  }
                  onMouseLeave={withSubmenu ? () => scheduleCloseSubmenu() : undefined}
                />
              )
            })}
          </ul>

          {sub && subParent?.submenu && itemRefs.current[sub.id] && (
            <Submenu
              items={subParent.submenu}
              parentItem={itemRefs.current[sub.id]!}
              autoFocus={sub.autoFocus}
              ariaLabel={`${subParent.label} submenu`}
              onCloseSubmenu={() => {
                closeSubmenuNow()
                itemRefs.current[sub.id]?.focus()
              }}
              onCloseAll={handleClose}
              onPointerEnter={cancelScheduledClose}
              onPointerLeave={scheduleCloseSubmenu}
            />
          )}
        </>
      </Popover>
    </div>
  )
}
