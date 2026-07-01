// src/components/WorkspaceSwitcher/WorkspaceSwitcher.tsx
//
// WorkspaceSwitcher — the identity plate at the top of the Home/Library sidebar.
// It reads "<workspace> · <user>" at rest and, when opened, drops a menu to
// switch workspaces or reach Settings / New workspace. Emits intents only.
//
// Why this isn't a webpage: an account switcher on the web is a chevron on an
// avatar that drops a plain white popover. Here the trigger is a warm paper
// plate — the same calm rail vocabulary as WorkspaceSidebar (flat ink on
// --rail-bg, one accent, no bevel), with the workspace's own data colour riding
// in the Avatar like a track's colour spine. The active workspace in the menu
// carries the same accent spine the sidebar uses for the current row, so the
// switcher and the list speak one language.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - Overlay = the shared Popover shell, element-anchored (`anchorRef`) — a
//   dropdown from the trigger, per KIT-LEAD §5 (don't invent a new overlay).
// - CALM PAPER menu, NOT the dark --stage ContextMenu. This control lives on the
//   Home/Library paper rail; dropping the hardware-well menu here would read as a
//   black bar on cream — the exact mistake WorkspaceSidebar calls out. The menu
//   wears --menu-bg + ink text + the accent spine, so it reskins with the rail
//   through every theme (light AND dark) instead of borrowing the studio well.
// - ARIA: the trigger is `aria-haspopup="menu"` + `aria-expanded`; the panel is
//   `role="menu"`; workspaces are `menuitemradio` (aria-checked = active — a
//   single-choice set), and Settings / New workspace are plain `menuitem`
//   commands. Roving focus, Home/End, Enter/Space, Esc + Tab + outside-click
//   close, and focus returns to the trigger (Popover doesn't do this for us).
import { useEffect, useRef, useState } from 'react'
import { Gear, Plus, Check, CaretUpDown } from '@phosphor-icons/react'
import { Popover } from '../Popover'
import { Avatar } from '../Avatar'
import styles from './WorkspaceSwitcher.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

/** A workspace the user can switch between. `colour` is its own data colour
 *  (a CSS string, like a track colour) — content, not a theme token. */
export interface WorkspaceSummary {
  id:      string
  name:    string
  /** A short type label ("Band", "Solo") shown as a subtle secondary. */
  type?:   string
  colour?: string
}

export interface WorkspaceSwitcherProps {
  workspaces:     WorkspaceSummary[]
  /** The id of the currently-open workspace. */
  activeId:       string
  /** The signed-in user's display name — the second line of the identity plate. */
  userName:       string
  onSwitch:       (id: string) => void
  onNewWorkspace: () => void
  onOpenSettings: () => void
  size?:          'sm' | 'md'
  className?:     string
  'aria-label'?:  string
}

// A focusable menu entry — either a workspace radio or a command.
interface MenuEntry {
  key:      string
  activate: () => void
}

// ── WorkspaceSwitcher ────────────────────────────────────────────────────────

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  userName,
  onSwitch,
  onNewWorkspace,
  onOpenSettings,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef   = useRef<HTMLButtonElement>(null)
  const itemRefs     = useRef<Record<string, HTMLButtonElement | null>>({})

  const active     = workspaces.find(w => w.id === activeId)
  const activeName = active?.name ?? '—'

  // Flat focusable order: every workspace, then New workspace, then Settings.
  const entries: MenuEntry[] = [
    ...workspaces.map(w => ({ key: `ws-${w.id}`, activate: () => select(() => onSwitch(w.id)) })),
    { key: 'new',      activate: () => select(onNewWorkspace) },
    { key: 'settings', activate: () => select(onOpenSettings) },
  ]

  function openMenu() { setOpen(true) }

  function closeMenu() {
    setOpen(false)
    triggerRef.current?.focus() // Popover doesn't return focus for us.
  }

  // Run an intent, then tear the menu down.
  function select(intent: () => void) {
    intent()
    closeMenu()
  }

  // On open, land focus on the active workspace (or the first entry).
  useEffect(() => {
    if (!open) return
    const preferred = active ? `ws-${active.id}` : entries[0]?.key
    const el = preferred ? itemRefs.current[preferred] : null
    el?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function focusAt(index: number) {
    const n = entries.length
    if (n === 0) return
    const wrapped = ((index % n) + n) % n
    itemRefs.current[entries[wrapped].key]?.focus()
  }

  function currentIndex(): number {
    const el = document.activeElement
    return entries.findIndex(e => itemRefs.current[e.key] === el)
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); focusAt(currentIndex() + 1); break
      case 'ArrowUp':   e.preventDefault(); focusAt(currentIndex() - 1); break
      case 'Home':      e.preventDefault(); focusAt(0); break
      case 'End':       e.preventDefault(); focusAt(entries.length - 1); break
      case 'Tab':       e.preventDefault(); closeMenu(); break
      // Enter/Space are handled by the native <button> click; Esc + outside-click
      // are handled by the Popover shell.
    }
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      openMenu()
    }
  }

  const triggerLabel = ariaLabel ?? `${activeName} — ${userName}, switch workspace`

  return (
    <div
      ref={containerRef}
      className={className ? `${styles.root} ${className}` : styles.root}
      data-size={size}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        data-open={open || undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <Avatar name={activeName} color={active?.colour} size={size === 'sm' ? 'xs' : 'sm'} />
        <span className={styles.identity} aria-hidden="true">
          <span className={styles.workspaceName}>{activeName}</span>
          <span className={styles.userName}>{userName}</span>
        </span>
        <span className={styles.caret} aria-hidden="true">
          <CaretUpDown size={size === 'sm' ? 12 : 14} weight="bold" />
        </span>
      </button>

      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
          className={styles.pop}
        >
          <div
            role="menu"
            aria-label="Switch workspace"
            className={styles.menu}
            onKeyDown={handleMenuKeyDown}
          >
            <p className={styles.sectionLabel} aria-hidden="true">Switch workspace</p>

            {workspaces.length === 0 ? (
              <p className={styles.empty}>No workspaces yet</p>
            ) : (
              workspaces.map(w => {
                const isActive = w.id === activeId
                return (
                  <button
                    key={w.id}
                    ref={el => { itemRefs.current[`ws-${w.id}`] = el }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    tabIndex={-1}
                    className={styles.item}
                    data-active={isActive || undefined}
                    onClick={() => select(() => onSwitch(w.id))}
                  >
                    <Avatar name={w.name} color={w.colour} size="xs" />
                    <span className={styles.itemText}>
                      <span className={styles.itemName}>{w.name}</span>
                      {w.type && <span className={styles.itemType}>{w.type}</span>}
                    </span>
                    <span className={styles.check} aria-hidden="true">
                      {isActive && <Check size={14} weight="bold" />}
                    </span>
                  </button>
                )
              })
            )}

            <div className={styles.separator} role="separator" />

            <button
              ref={el => { itemRefs.current['new'] = el }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={styles.command}
              onClick={() => select(onNewWorkspace)}
            >
              <span className={styles.commandLead} aria-hidden="true"><Plus size={16} /></span>
              <span className={styles.itemName}>New workspace</span>
            </button>

            <button
              ref={el => { itemRefs.current['settings'] = el }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={styles.command}
              onClick={() => select(onOpenSettings)}
            >
              <span className={styles.commandLead} aria-hidden="true"><Gear size={16} /></span>
              <span className={styles.itemName}>Settings</span>
            </button>
          </div>
        </Popover>
      )}
    </div>
  )
}
