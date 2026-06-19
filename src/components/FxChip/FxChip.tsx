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
  onOpenPlugin:   (id: string) => void
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
    plugins.length === 0  ? false
    : !chainEnabled        ? false
    : someBypassedPlugins  ? 'mixed'
    :                        true

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

// ── DragState ─────────────────────────────────────────────────────────────────

interface DragState {
  dragIndex:     number
  hoverIndex:    number
  ghostY:        number
  panelTop:      number
  panelBottom:   number
  reducedMotion: boolean
}

// ── SlotRow ───────────────────────────────────────────────────────────────────

interface SlotRowProps {
  plugin:          FxPlugin
  index:           number
  total:           number
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (fromIdx: number, toIdx: number) => void
  onRemove:        (id: string) => void
  onOpenPlugin:    (id: string) => void
  onAnnounce:      (msg: string) => void
  slotRef:         (el: HTMLDivElement | null) => void
  onDragStart:     (index: number, e: React.PointerEvent<HTMLDivElement>) => void
  onDragMove:      (e: React.PointerEvent<HTMLDivElement>) => void
  onDragEnd:       (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void
}

function SlotRow({
  plugin, index, total, onTogglePlugin, onReorder, onRemove, onOpenPlugin, onAnnounce,
  slotRef, onDragStart, onDragMove, onDragEnd, onPointerCancel,
}: SlotRowProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!e.altKey) return
    const t = e.target as HTMLElement
    if (t.classList.contains(styles.moveUp) || t.classList.contains(styles.moveDown)) return
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
      <button
        className={styles.nameBtn}
        aria-label={`Open ${plugin.name}`}
        onClick={() => onOpenPlugin(plugin.id)}
      >
        {plugin.name}
      </button>
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
        onPointerDown={e => onDragStart(index, e)}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onPointerCancel}
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
  onOpenPlugin:   (id: string) => void
  masterLedRef:   React.RefObject<HTMLButtonElement | null>
}

function ChainEditor({
  plugins, chainEnabled, onToggleChain, onTogglePlugin, onReorder, onRemove, onAdd, onOpenPlugin, masterLedRef,
}: ChainEditorProps) {
  const [announcement, setAnnouncement] = useState('')
  const [dragState, setDragState]       = useState<DragState | null>(null)
  const slotRefs    = useRef<(HTMLDivElement | null)[]>([])
  const panelRef    = useRef<HTMLDivElement>(null)
  const slotListRef = useRef<HTMLDivElement>(null)

  function handleDragStart(index: number, e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const panel = panelRef.current?.getBoundingClientRect()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setDragState({
      dragIndex:     index,
      hoverIndex:    index,
      ghostY:        e.clientY,
      panelTop:      panel?.top    ?? 0,
      panelBottom:   panel?.bottom ?? window.innerHeight,
      reducedMotion,
    })
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState) return
    let hoverIndex = dragState.dragIndex
    for (let i = 0; i < slotRefs.current.length; i++) {
      const rect = slotRefs.current[i]?.getBoundingClientRect()
      if (!rect) continue
      if (e.clientY > rect.top + rect.height / 2) hoverIndex = i
    }
    const ghostY = Math.max(
      dragState.panelTop,
      Math.min(dragState.panelBottom - 28, e.clientY - 14)
    )
    setDragState(prev => prev ? { ...prev, hoverIndex, ghostY } : null)
  }

  function handleDragEnd(_e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState) return
    if (dragState.hoverIndex !== dragState.dragIndex) {
      onReorder(dragState.dragIndex, dragState.hoverIndex)
    }
    setDragState(null)
  }

  function getInsertionLineY(afterIndex: number): number {
    const rect = slotRefs.current[afterIndex]?.getBoundingClientRect()
    const slotListRect = slotListRef.current?.getBoundingClientRect()
    if (!rect || !slotListRect) return 0
    return rect.bottom - slotListRect.top
  }

  return (
    <div role="dialog" aria-label="FX chain" className={styles.chainDialog} ref={panelRef}>
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
          <div ref={slotListRef} style={{ position: 'relative' }}>
            {plugins.map((p, i) => (
              <SlotRow
                key={p.id}
                plugin={p}
                index={i}
                total={plugins.length}
                onTogglePlugin={onTogglePlugin}
                onReorder={onReorder}
                onRemove={onRemove}
                onOpenPlugin={onOpenPlugin}
                onAnnounce={setAnnouncement}
                slotRef={el => { slotRefs.current[i] = el }}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onPointerCancel={handleDragEnd}
              />
            ))}
            {dragState && !dragState.reducedMotion && (
              <div
                className={styles.insertionLine}
                style={{ top: getInsertionLineY(dragState.hoverIndex) }}
                aria-hidden
              />
            )}
          </div>
        )}
        <button className={styles.addRow} onClick={onAdd}>+ Add plugin…</button>
        <div className={styles.srAnnounce} aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </Panel>
      {dragState && !dragState.reducedMotion && (
        <div
          className={styles.ghost}
          style={{
            top:   dragState.ghostY,
            left:  panelRef.current?.getBoundingClientRect().left ?? 0,
            width: panelRef.current?.getBoundingClientRect().width ?? 220,
          }}
          aria-hidden
        >
          {plugins[dragState.dragIndex]?.name}
        </div>
      )}
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
