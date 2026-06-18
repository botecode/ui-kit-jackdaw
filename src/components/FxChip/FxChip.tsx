// src/components/FxChip/FxChip.tsx
import { useRef, useState } from 'react'
import styles from './FxChip.module.css'
import { Popover } from '../Popover'

export interface FxPlugin {
  id: string
  name: string
  enabled: boolean
}

export interface FxChipProps {
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (fromIdx: number, toIdx: number) => void
  onRemove:       (id: string) => void
  onAdd:          () => void
  size?:          'sm' | 'md'
  disabled?:      boolean
  defaultOpen?:   boolean
  'aria-label'?:  string
}

export function FxChip({
  plugins,
  chainEnabled,
  onToggleChain: _onToggleChain,
  onTogglePlugin: _onTogglePlugin,
  onReorder: _onReorder,
  onRemove: _onRemove,
  onAdd: _onAdd,
  size = 'md',
  disabled,
  defaultOpen = false,
  'aria-label': ariaLabel = 'FX chain',
}: FxChipProps) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef   = useRef<HTMLButtonElement>(null)

  const chipState = plugins.length === 0 ? 'empty' : chainEnabled ? 'active' : 'bypassed'
  const chipLabel = plugins.length === 0 ? '+ FX' : plugins.length === 1 ? 'FX' : `FX ${plugins.length}`

  function openMenu()  { if (!disabled) setOpen(true) }
  function closeMenu() { setOpen(false); triggerRef.current?.focus() }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      openMenu()
    }
  }

  return (
    <div
      ref={containerRef}
      className={styles.root}
      data-state={chipState}
      data-open={open || undefined}
      data-size={size}
    >
      <button
        ref={triggerRef}
        className={styles.chip}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={open ? closeMenu : openMenu}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.label}>{chipLabel}</span>
      </button>
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
        >
          <div
            role="dialog"
            aria-label="FX chain"
            className={styles.chainDialog}
          >
            {/* Chain editor content — implemented in Task 3 */}
            <p style={{ padding: 8, margin: 0, fontSize: 11 }}>FX chain editor</p>
          </div>
        </Popover>
      )}
    </div>
  )
}
