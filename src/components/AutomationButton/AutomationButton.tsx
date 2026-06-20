// src/components/AutomationButton/AutomationButton.tsx
import { useRef, useState } from 'react'
import { ChartLine, CaretDown } from '@phosphor-icons/react'
import styles from './AutomationButton.module.css'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'

export type AutomationMode = 'read' | 'write'

export interface AutomationButtonProps {
  /** Whether automation is engaged for this scope. */
  engaged: boolean
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'
  /** 'track' = per-track in the detail panel; 'master' = global in the transport bar. */
  scope?: 'track' | 'master'
  /** Current read/write mode. Only meaningful when onModeChange is provided. */
  mode?: AutomationMode
  /** Providing this prop shows the caret → mode menu (Read / Write). */
  onModeChange?: (mode: AutomationMode) => void
  disabled?: boolean
  'aria-label'?: string
}

const ICON_SIZE:  Record<'sm' | 'md', number> = { sm: 16, md: 20 }
const CARET_SIZE: Record<'sm' | 'md', number> = { sm: 10, md: 12 }

const DEFAULT_LABELS: Record<'track' | 'master', string> = {
  track:  'Automation',
  master: 'Master automation',
}

export function AutomationButton({
  engaged,
  onToggle,
  size = 'md',
  scope = 'track',
  mode,
  onModeChange,
  disabled,
  'aria-label': ariaLabel,
}: AutomationButtonProps) {
  const caretRef     = useRef<HTMLButtonElement>(null)
  const closeTimeRef = useRef(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ x: 0, y: 0 })

  const label    = ariaLabel ?? DEFAULT_LABELS[scope]
  const iconSize = ICON_SIZE[size]

  function openMenu() {
    // Guard: Popover's outside-click mousedown fires on the caret just before
    // this click — closeMenu() stamps closeTimeRef to skip the reopen.
    if (Date.now() - closeTimeRef.current < 300) return
    const el = caretRef.current
    if (!el) return
    el.focus() // WebKit: mouse click doesn't focus <button>
    const rect = el.getBoundingClientRect()
    setMenuPos({ x: rect.left, y: rect.bottom + 2 })
    setMenuOpen(true)
  }

  function closeMenu() {
    closeTimeRef.current = Date.now()
    setMenuOpen(false)
  }

  const menuItems: MenuEntry[] = onModeChange
    ? [
        {
          id:       'read',
          label:    'Read',
          role:     'menuitemradio',
          checked:  mode === 'read',
          onSelect: () => onModeChange('read'),
        },
        {
          id:       'write',
          label:    'Write',
          role:     'menuitemradio',
          checked:  mode === 'write',
          onSelect: () => onModeChange('write'),
        },
      ]
    : []

  const toggleBtn = (
    <button
      type="button"
      className={styles.toggleBtn}
      data-size={size}
      data-engaged={engaged || undefined}
      aria-pressed={engaged}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
    >
      <ChartLine aria-hidden size={iconSize} />
    </button>
  )

  if (!onModeChange) {
    return toggleBtn
  }

  return (
    <div className={styles.root} data-size={size}>
      {toggleBtn}
      <button
        ref={caretRef}
        type="button"
        className={styles.caret}
        data-size={size}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Automation mode"
        disabled={disabled}
        onClick={openMenu}
      >
        <CaretDown aria-hidden size={CARET_SIZE[size]} />
      </button>
      {menuOpen && (
        <ContextMenu
          items={menuItems}
          open
          x={menuPos.x}
          y={menuPos.y}
          onClose={closeMenu}
          aria-label="Automation mode"
        />
      )}
    </div>
  )
}
