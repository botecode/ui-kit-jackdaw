// src/components/FxChip/FxChip.tsx
import { CSSProperties, useEffect, useRef, useState } from 'react'
import styles from './FxChip.module.css'
import { Popover } from '../Popover'
import { Panel } from '../Panel'

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
  size?:          'sm' | 'md'
  disabled?:      boolean
  defaultOpen?:   boolean
  'aria-label'?:  string
}

// ── slotColor ─────────────────────────────────────────────────────────────────

const CHROMA_CYCLE = [
  '--chroma-red', '--chroma-orange', '--chroma-yellow', '--chroma-green',
  '--chroma-teal', '--chroma-blue', '--chroma-purple',
] as const

function slotColor(index: number): string {
  return `var(${CHROMA_CYCLE[index % CHROMA_CYCLE.length]})`
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
    !chainEnabled        ? false
    : someBypassedPlugins ? 'mixed'
    :                       true

  return (
    <button
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

// ── SlotRow ───────────────────────────────────────────────────────────────────

interface SlotRowProps {
  plugin:         FxPlugin
  index:          number
  total:          number
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (fromIdx: number, toIdx: number) => void
  onRemove:       (id: string) => void
  onAnnounce:     (msg: string) => void
  slotRef:        (el: HTMLDivElement | null) => void
}

function SlotRow({ plugin, index, total, onTogglePlugin, onReorder, onRemove, onAnnounce, slotRef }: SlotRowProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!e.altKey) return
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      onReorder(index, index - 1)
      onAnnounce(`${plugin.name} moved to position ${index} of ${total}`)
    }
    if (e.key === 'ArrowDown' && index < total - 1) {
      e.preventDefault()
      onReorder(index, index + 1)
      onAnnounce(`${plugin.name} moved to position ${index + 2} of ${total}`)
    }
  }

  return (
    <div
      ref={slotRef}
      className={styles.slot}
      data-slot-index={index}
      data-bypassed={!plugin.enabled || undefined}
      style={{ '--slot-color': slotColor(index) } as CSSProperties}
      onKeyDown={handleKeyDown}
    >
      <button
        className={styles.ledBtn}
        role="checkbox"
        aria-checked={plugin.enabled}
        aria-label={plugin.name}
        onClick={() => onTogglePlugin(plugin.id, !plugin.enabled)}
      />
      <span className={styles.name}>{plugin.name}</span>
      <button
        className={styles.moveUp}
        aria-label={`Move ${plugin.name} up`}
        disabled={index === 0}
        onClick={() => { onReorder(index, index - 1); onAnnounce(`${plugin.name} moved to position ${index} of ${total}`) }}
      >↑</button>
      <button
        className={styles.moveDown}
        aria-label={`Move ${plugin.name} down`}
        disabled={index === total - 1}
        onClick={() => { onReorder(index, index + 1); onAnnounce(`${plugin.name} moved to position ${index + 2} of ${total}`) }}
      >↓</button>
      <div
        className={styles.handle}
        aria-hidden
        data-testid="drag-handle"
      >⠿</div>
      <button
        className={styles.removeBtn}
        aria-label={`Remove ${plugin.name}`}
        onClick={() => onRemove(plugin.id)}
      >×</button>
    </div>
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
  masterLedRef:   React.RefObject<HTMLButtonElement | null>
}

function ChainEditor({
  plugins, chainEnabled, onToggleChain, onTogglePlugin, onReorder, onRemove, onAdd, masterLedRef,
}: ChainEditorProps) {
  const [announcement, setAnnouncement] = useState('')
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])

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
        {plugins.length === 0 ? (
          <p className={styles.empty}>No effects yet — add one.</p>
        ) : (
          <div>
            {plugins.map((p, i) => (
              <SlotRow
                key={p.id}
                plugin={p}
                index={i}
                total={plugins.length}
                onTogglePlugin={onTogglePlugin}
                onReorder={onReorder}
                onRemove={onRemove}
                onAnnounce={setAnnouncement}
                slotRef={el => { slotRefs.current[i] = el }}
              />
            ))}
          </div>
        )}
        <button className={styles.addRow} onClick={onAdd}>+ Add plugin…</button>
        <div className={styles.srAnnounce} aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
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
  size = 'md',
  disabled,
  defaultOpen = false,
  'aria-label': ariaLabel = 'FX chain',
}: FxChipProps) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef  = useRef<HTMLDivElement>(null)
  const triggerRef    = useRef<HTMLButtonElement>(null)
  const masterLedRef  = useRef<HTMLButtonElement>(null)

  const chipState = plugins.length === 0 ? 'empty' : chainEnabled ? 'active' : 'bypassed'
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
          <ChainEditor
            plugins={plugins}
            chainEnabled={chainEnabled}
            onToggleChain={onToggleChain}
            onTogglePlugin={onTogglePlugin}
            onReorder={onReorder}
            onRemove={onRemove}
            onAdd={onAdd}
            masterLedRef={masterLedRef}
          />
        </Popover>
      )}
    </div>
  )
}
