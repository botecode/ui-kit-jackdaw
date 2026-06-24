// src/components/RecordMode/RecordMode.calm.tsx
// Calm-theme variant: a soft record control. Armed/recording read as a muted
// terracotta fill with a slow breath (no LED glow). The mode menu uses the
// ContextMenu's light "paper" surface so the drawer matches the calm theme.
import { useRef, useState } from 'react'
import { Record, ArrowsClockwise, CaretDown } from '@phosphor-icons/react'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import type { RecordModeProps } from './RecordMode'
import styles from './RecordMode.calm.module.css'

const ICON_SIZE:  Record<'sm' | 'md', number> = { sm: 16, md: 20 }
const CARET_SIZE: Record<'sm' | 'md', number> = { sm: 10, md: 12 }
const BADGE_SIZE: Record<'sm' | 'md', number> = { sm: 6,  md: 8  }

function resolveLabel(
  state:    RecordModeProps['state'],
  mode:     RecordModeProps['mode'],
  override: string | undefined,
): string {
  if (override) return override
  const base   = state === 'recording' ? 'Recording' : 'Record'
  const suffix = mode  === 'loop-punch' ? ' (loop-punch)' : ''
  return base + suffix
}

export function RecordModeCalm({
  state,
  mode,
  onToggleRecord,
  onSelectMode,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
}: RecordModeProps) {
  const caretRef     = useRef<HTMLButtonElement>(null)
  const closeTimeRef = useRef(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos,  setMenuPos]  = useState({ x: 0, y: 0 })

  const label     = resolveLabel(state, mode, ariaLabel)
  const iconSize  = ICON_SIZE[size]
  const caretSize = CARET_SIZE[size]
  const badgeSize = BADGE_SIZE[size]

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

  const menuItems: MenuEntry[] = [
    { id: 'normal',     label: 'Normal',       role: 'menuitemradio', checked: mode === 'normal',     onSelect: () => onSelectMode('normal') },
    { id: 'loop-punch', label: 'Loop / punch', role: 'menuitemradio', checked: mode === 'loop-punch', onSelect: () => onSelectMode('loop-punch') },
  ]

  return (
    <div className={styles.root} data-size={size}>
      <button
        type="button"
        className={styles.recordBtn}
        data-state={state}
        data-size={size}
        aria-pressed={state !== 'idle'}
        aria-label={label}
        disabled={disabled}
        onClick={onToggleRecord}
      >
        <Record aria-hidden size={iconSize} weight={state === 'idle' ? 'regular' : 'fill'} />
        {mode === 'loop-punch' && (
          <span className={styles.badge} data-testid="record-loop-badge" aria-hidden>
            <ArrowsClockwise size={badgeSize} />
          </span>
        )}
      </button>
      <button
        ref={caretRef}
        type="button"
        className={styles.caret}
        data-size={size}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Record mode"
        disabled={disabled}
        onClick={openMenu}
      >
        <CaretDown aria-hidden size={caretSize} />
      </button>
      {menuOpen && (
        <ContextMenu
          items={menuItems}
          open
          x={menuPos.x}
          y={menuPos.y}
          surface="paper"
          onClose={closeMenu}
          aria-label="Record mode"
        />
      )}
    </div>
  )
}
