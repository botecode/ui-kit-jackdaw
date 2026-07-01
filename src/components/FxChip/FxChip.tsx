// src/components/FxChip/FxChip.tsx
import { useEffect, useRef, useState } from 'react'
import styles from './FxChip.module.css'
import { Popover } from '../Popover'
import { Panel } from '../Panel'
import { FxChainList } from './FxChainList'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FxPlugin {
  id:      string
  name:    string
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
  onOpenPlugin:   (id: string) => void
  size?:          'sm' | 'md'
  disabled?:      boolean
  defaultOpen?:   boolean
  'aria-label'?:  string
}

// ── MasterLED ─────────────────────────────────────────────────────────────────

interface MasterLEDProps {
  chainEnabled: boolean
  plugins:      FxPlugin[]
  onToggle:     (next: boolean) => void
  ledRef:       React.RefObject<HTMLButtonElement | null>
}

function MasterLED({ chainEnabled, plugins, onToggle, ledRef }: MasterLEDProps) {
  const someBypassedPlugins = chainEnabled && plugins.some(p => !p.enabled)
  const masterState =
    plugins.length === 0  ? 'off'
    : !chainEnabled       ? 'off'
    : someBypassedPlugins ? 'partial'
    :                       'active'

  const ariaChecked: boolean | 'mixed' =
    plugins.length === 0  ? false
    : !chainEnabled        ? false
    : someBypassedPlugins  ? 'mixed'
    :                        true

  return (
    <button
      type="button"
      ref={ledRef}
      role="checkbox"
      aria-checked={ariaChecked}
      aria-label="FX chain"
      data-state={masterState}
      className={styles.masterLed}
      onClick={() => onToggle(!chainEnabled)}
    />
  )
}

// ── ChainEditor ───────────────────────────────────────────────────────────────

interface ChainEditorProps {
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (fromIdx: number, toIdx: number) => void
  onRemove:       (id: string) => void
  onAdd:          () => void
  onOpenPlugin:   (id: string) => void
  masterLedRef:   React.RefObject<HTMLButtonElement | null>
}

function ChainEditor({
  plugins, chainEnabled, onToggleChain, onTogglePlugin, onReorder, onRemove, onAdd, onOpenPlugin, masterLedRef,
}: ChainEditorProps) {
  return (
    <div role="dialog" aria-label="FX chain" className={styles.chainDialog}>
      <Panel
        tone="stage"
        padding="sm"
        title="FX"
        headerLead={
          <MasterLED
            chainEnabled={chainEnabled}
            plugins={plugins}
            onToggle={onToggleChain}
            ledRef={masterLedRef}
          />
        }
      >
        <FxChainList
          mode="live"
          items={plugins}
          onReorder={onReorder}
          onRemove={onRemove}
          onAdd={onAdd}
          onTogglePlugin={onTogglePlugin}
          onOpenPlugin={onOpenPlugin}
        />
      </Panel>
    </div>
  )
}

// ── FxChip ────────────────────────────────────────────────────────────────────

export function FxChip({
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
  const containerRef  = useRef<HTMLDivElement>(null)
  const triggerRef    = useRef<HTMLButtonElement>(null)
  const masterLedRef  = useRef<HTMLButtonElement>(null)

  const someBypassedPlugins = chainEnabled && plugins.some(p => !p.enabled)
  const chipState =
    plugins.length === 0  ? 'empty'
    : !chainEnabled       ? 'bypassed'
    : someBypassedPlugins ? 'partial'
    :                       'active'
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
        <span className={styles.label}>{chipLabel}</span>
      </button>
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
        >
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
        </Popover>
      )}
    </div>
  )
}
