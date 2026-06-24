// src/components/AutomationButton/AutomationButton.calm.tsx
// Calm-theme variant: a soft automation toggle (engaged = gentle violet fill),
// with the optional mode menu on the ContextMenu's light "paper" surface.
import { useRef, useState } from 'react'
import { ChartLine, CaretDown } from '@phosphor-icons/react'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import type { AutomationButtonProps } from './AutomationButton'
import styles from './AutomationButton.calm.module.css'

const ICON_SIZE:  Record<'sm' | 'md', number> = { sm: 16, md: 20 }
const CARET_SIZE: Record<'sm' | 'md', number> = { sm: 10, md: 12 }

const DEFAULT_LABELS: Record<'track' | 'master', string> = {
  track:  'Automation',
  master: 'Master automation',
}

export function AutomationButtonCalm({
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
    if (Date.now() - closeTimeRef.current < 300) return
    const el = caretRef.current
    if (!el) return
    el.focus()
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
        { id: 'read',  label: 'Read',  role: 'menuitemradio', checked: mode === 'read',  onSelect: () => onModeChange('read') },
        { id: 'write', label: 'Write', role: 'menuitemradio', checked: mode === 'write', onSelect: () => onModeChange('write') },
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

  if (!onModeChange) return toggleBtn

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
          surface="paper"
          onClose={closeMenu}
          aria-label="Automation mode"
        />
      )}
    </div>
  )
}
