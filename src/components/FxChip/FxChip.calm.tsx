// src/components/FxChip/FxChip.calm.tsx
// Calm-theme variant of FxChip. The persistent element — the trigger — becomes a
// quiet calm pill (state shown by a soft dot + colour, not a lit chip). The
// dropdown reuses the shared ChainEditor (drag-reorder, master LED, add) so
// behaviour is identical; under Calm tokens its panel reads as a soft drawer.
import { useEffect, useRef, useState } from 'react'
import { ChainEditor } from './FxChip'
import type { FxChipProps } from './FxChip'
import { Popover } from '../Popover'
import paper from '../../theme/paperOverlay.module.css'
import styles from './FxChip.calm.module.css'

export function FxChipCalm({
  plugins,
  chainEnabled,
  onToggleChain,
  onTogglePlugin,
  onReorder,
  onRemove,
  onAdd,
  onOpenPlugin,
  size = 'md',
  disabled,
  defaultOpen = false,
  'aria-label': ariaLabel = 'FX chain',
}: FxChipProps) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const masterLedRef = useRef<HTMLButtonElement>(null)

  const someBypassed = chainEnabled && plugins.some(p => !p.enabled)
  const chipState =
    plugins.length === 0 ? 'empty'
    : !chainEnabled      ? 'bypassed'
    : someBypassed       ? 'partial'
    :                      'active'
  const chipLabel = plugins.length === 0 ? '+ FX' : plugins.length === 1 ? 'FX' : `FX ${plugins.length}`

  function openMenu()  { if (!disabled) setOpen(true) }
  function closeMenu() { setOpen(false); triggerRef.current?.focus() }

  useEffect(() => {
    if (open) masterLedRef.current?.focus()
  }, [open])

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
        type="button"
        ref={triggerRef}
        className={styles.chip}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={open ? closeMenu : openMenu}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.label}>{chipLabel}</span>
      </button>
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
        >
          <div className={paper.paper}>
            <ChainEditor
              plugins={plugins}
              chainEnabled={chainEnabled}
              onToggleChain={onToggleChain}
              onTogglePlugin={onTogglePlugin}
              onReorder={onReorder}
              onRemove={onRemove}
              onAdd={onAdd}
              onOpenPlugin={onOpenPlugin}
              masterLedRef={masterLedRef}
            />
          </div>
        </Popover>
      )}
    </div>
  )
}
