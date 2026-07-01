// src/components/FxChip/FxChainList.tsx
//
// The ordered FX-chain list — extracted from FxChip so the studio card (live
// plugin chain) and the cold InstrumentTemplate (identity-only chain) share ONE
// reorderable list instead of duplicating the drag/keyboard machinery.
//
//   • mode="live"  — each row leads with a bypass LED (click to toggle) and the
//     name opens the plugin editor. This is exactly what FxChip renders today.
//   • mode="cold"  — each row leads with a static slot-color chip and the name
//     is plain text (no bypass, no editor). The chain is just identity + order.
//
// Reorder is identical in both modes: a mouse drag handle (with ghost +
// insertion line), ↑/↓ buttons, and Alt+↑/↓ from a focused row control. Under
// reduced motion the drag visuals are suppressed (the ↑/↓ buttons still work).

import { CSSProperties, useRef, useState } from 'react'
import styles from './FxChainList.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FxChainItem {
  id:       string
  name:     string
  /** live mode only — the bypass state of the plugin. */
  enabled?: boolean
}

export interface FxChainListProps {
  mode:        'live' | 'cold'
  items:       FxChainItem[]
  onReorder:   (fromIdx: number, toIdx: number) => void
  onRemove:    (id: string) => void
  onAdd:       () => void
  /** live mode — toggle a plugin's bypass LED. */
  onTogglePlugin?: (id: string, next: boolean) => void
  /** live mode — the name button opens the plugin editor. */
  onOpenPlugin?:   (id: string) => void
  addLabel?:   string
  emptyLabel?: string
  disabled?:   boolean
}

// ── slotColor ─────────────────────────────────────────────────────────────────
// Identity color by chain position (v1: slot-position, not user-assigned).

const CHROMA_CYCLE = [
  '--chroma-red', '--chroma-orange', '--chroma-yellow', '--chroma-green',
  '--chroma-teal', '--chroma-blue', '--chroma-purple',
] as const

export function slotColor(index: number): string {
  return `var(${CHROMA_CYCLE[index % CHROMA_CYCLE.length]})`
}

// ── DragState ─────────────────────────────────────────────────────────────────

interface DragState {
  dragIndex:     number
  hoverIndex:    number
  ghostY:        number
  rootTop:       number
  rootBottom:    number
  reducedMotion: boolean
}

// ── SlotRow ───────────────────────────────────────────────────────────────────

interface SlotRowProps {
  mode:            'live' | 'cold'
  item:            FxChainItem
  index:           number
  total:           number
  disabled?:       boolean
  onTogglePlugin?: (id: string, next: boolean) => void
  onOpenPlugin?:   (id: string) => void
  onReorder:       (fromIdx: number, toIdx: number) => void
  onRemove:        (id: string) => void
  onAnnounce:      (msg: string) => void
  slotRef:         (el: HTMLDivElement | null) => void
  onDragStart:     (index: number, e: React.PointerEvent<HTMLDivElement>) => void
  onDragMove:      (e: React.PointerEvent<HTMLDivElement>) => void
  onDragEnd:       (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void
}

function SlotRow({
  mode, item, index, total, disabled,
  onTogglePlugin, onOpenPlugin, onReorder, onRemove, onAnnounce,
  slotRef, onDragStart, onDragMove, onDragEnd, onPointerCancel,
}: SlotRowProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!e.altKey) return
    const t = e.target as HTMLElement
    if (
      t.classList.contains(styles.moveUp) ||
      t.classList.contains(styles.moveDown) ||
      t.classList.contains(styles.nameBtn) ||
      t.classList.contains(styles.removeBtn)
    ) return
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      onReorder(index, index - 1)
      onAnnounce(`${item.name} moved to position ${index} of ${total}`)
    }
    if (e.key === 'ArrowDown' && index < total - 1) {
      e.preventDefault()
      onReorder(index, index + 1)
      onAnnounce(`${item.name} moved to position ${index + 2} of ${total}`)
    }
  }

  return (
    <div
      ref={slotRef}
      className={styles.slot}
      data-slot-index={index}
      data-bypassed={mode === 'live' && !item.enabled || undefined}
      style={{ '--slot-color': slotColor(index) } as CSSProperties}
      onKeyDown={handleKeyDown}
    >
      {mode === 'live' ? (
        <button
          type="button"
          className={styles.ledBtn}
          role="checkbox"
          aria-checked={!!item.enabled}
          aria-label={item.name}
          disabled={disabled}
          onClick={() => onTogglePlugin?.(item.id, !item.enabled)}
        />
      ) : (
        <span className={styles.colorDot} aria-hidden data-testid="fx-color-dot" />
      )}

      {mode === 'live' ? (
        <button
          type="button"
          className={styles.nameBtn}
          aria-label={`Open ${item.name}`}
          disabled={disabled}
          onClick={() => onOpenPlugin?.(item.id)}
        >
          {item.name}
        </button>
      ) : (
        <span className={styles.nameStatic} title={item.name}>{item.name}</span>
      )}

      <button
        type="button"
        className={styles.moveUp}
        aria-label={`Move ${item.name} up`}
        disabled={disabled || index === 0}
        onClick={() => { onReorder(index, index - 1); onAnnounce(`${item.name} moved to position ${index} of ${total}`) }}
      >↑</button>
      <button
        type="button"
        className={styles.moveDown}
        aria-label={`Move ${item.name} down`}
        disabled={disabled || index === total - 1}
        onClick={() => { onReorder(index, index + 1); onAnnounce(`${item.name} moved to position ${index + 2} of ${total}`) }}
      >↓</button>
      <div
        className={styles.handle}
        aria-hidden
        data-testid="drag-handle"
        onPointerDown={disabled ? undefined : e => onDragStart(index, e)}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onPointerCancel}
      >⠿</div>
      <button
        type="button"
        className={styles.removeBtn}
        aria-label={`Remove ${item.name}`}
        disabled={disabled}
        onClick={() => onRemove(item.id)}
      >×</button>
    </div>
  )
}

// ── FxChainList ───────────────────────────────────────────────────────────────

export function FxChainList({
  mode,
  items,
  onReorder,
  onRemove,
  onAdd,
  onTogglePlugin,
  onOpenPlugin,
  addLabel = mode === 'live' ? '+ Add plugin…' : '+ Add effect…',
  emptyLabel = mode === 'live' ? 'No effects yet — add one.' : 'No effects — add one.',
  disabled,
}: FxChainListProps) {
  const [announcement, setAnnouncement] = useState('')
  const [dragState, setDragState]       = useState<DragState | null>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const rootRef  = useRef<HTMLDivElement>(null)
  const slotsRef = useRef<HTMLDivElement>(null)

  function handleDragStart(index: number, e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const root = rootRef.current?.getBoundingClientRect()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setDragState({
      dragIndex:     index,
      hoverIndex:    index,
      ghostY:        e.clientY,
      rootTop:       root?.top    ?? 0,
      rootBottom:    root?.bottom ?? window.innerHeight,
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
      dragState.rootTop,
      Math.min(dragState.rootBottom - 28, e.clientY - 14)
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
    const slotsRect = slotsRef.current?.getBoundingClientRect()
    if (!rect || !slotsRect) return 0
    return rect.bottom - slotsRect.top
  }

  return (
    <div className={styles.list} ref={rootRef}>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <div ref={slotsRef} className={styles.slots}>
          {items.map((it, i) => (
            <SlotRow
              key={it.id}
              mode={mode}
              item={it}
              index={i}
              total={items.length}
              disabled={disabled}
              onTogglePlugin={onTogglePlugin}
              onOpenPlugin={onOpenPlugin}
              onReorder={onReorder}
              onRemove={onRemove}
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
      <button type="button" className={styles.addRow} onClick={onAdd} disabled={disabled}>
        {addLabel}
      </button>
      <div className={styles.srAnnounce} aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {dragState && !dragState.reducedMotion && (
        <div
          className={styles.ghost}
          style={{
            top:   dragState.ghostY,
            left:  rootRef.current?.getBoundingClientRect().left  ?? 0,
            width: rootRef.current?.getBoundingClientRect().width ?? 220,
          }}
          aria-hidden
        >
          {items[dragState.dragIndex]?.name}
        </div>
      )}
    </div>
  )
}
