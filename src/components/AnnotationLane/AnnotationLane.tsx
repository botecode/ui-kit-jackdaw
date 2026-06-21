// src/components/AnnotationLane/AnnotationLane.tsx
// One type-aware annotation lane: lyrics / chords / tabs / comments.
// Paper-ish writing layer rendered above the audio track lanes.
import { useRef, useState, useCallback } from 'react'
import { Play } from '@phosphor-icons/react'
import { secondsToX, xToSeconds } from '../TimelineRuler'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import styles from './AnnotationLane.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_WIDTH = 88   // px — left label column
const EDGE_HIT_W   = 8   // px — right-edge resize hit zone
const CLICK_THRESH = 4   // px — movement beyond this = drag, not click
const MIN_BLOCK_W  = 32  // px — minimum rendered block width

const LANE_HEIGHT: Record<AnnotationType, number> = {
  lyrics:   32,
  chords:   24,
  tabs:     36,
  comments: 40,
}

const TYPE_LABEL: Record<AnnotationType, string> = {
  lyrics:   'Lyrics',
  chords:   'Chords',
  tabs:     'Tabs',
  comments: 'Comments',
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type AnnotationType = 'lyrics' | 'chords' | 'tabs' | 'comments'

export interface AnnotationItem {
  id: string
  /** Seconds from project start. */
  start: number
  /** Seconds — defines span for lyric phrases and comment ranges. */
  end?: number
  text?: string
  /** true → audio play-chip (comments type only). */
  audio?: boolean
}

export interface AnnotationLaneProps {
  type: AnnotationType
  items: AnnotationItem[]
  bpm: number
  pxPerBeat: number
  /** Highlights the block matching this id. */
  selectedId?: string
  disabled?: boolean
  /** Called when user clicks empty lane space — create annotation at this time (seconds). */
  onAdd?: (time: number) => void
  /** Called when user clicks a block — open the annotation editor for this id. */
  onEdit?: (id: string) => void
  /** Called when user drags a block — new start time (seconds). */
  onMove?: (id: string, start: number) => void
  /** Called when user drags the block's right edge — new end time (seconds). */
  onResize?: (id: string, end: number) => void
  /** Called on right-click → Delete, or Delete/Backspace key on focused block. */
  onDelete?: (id: string) => void
  /** Called when user clicks the audio play chip inside a comment block. */
  onPlayAudio?: (id: string) => void
}

// ─── Internal drag state ──────────────────────────────────────────────────────

type DragMode = 'move' | 'resize-end'

interface ActiveDrag {
  id: string
  mode: DragMode
  startPointerX: number
  startTime: number
  startEnd: number | undefined
  currentStart: number
  currentEnd: number | undefined
}

// ─── Block ────────────────────────────────────────────────────────────────────

interface BlockProps {
  item: AnnotationItem
  type: AnnotationType
  pxPerBeat: number
  bpm: number
  isDragging: boolean
  dragStart?: number
  dragEnd?: number
  isSelected: boolean
  disabled: boolean
  onStartDrag: (e: React.PointerEvent, id: string, mode: DragMode) => void
  onKeyDown: (e: React.KeyboardEvent, id: string) => void
  onPlayAudio?: (id: string) => void
}

function Block({
  item, type, pxPerBeat, bpm,
  isDragging, dragStart, dragEnd,
  isSelected, disabled,
  onStartDrag, onKeyDown, onPlayAudio,
}: BlockProps) {
  const displayStart = isDragging ? (dragStart ?? item.start) : item.start
  const displayEnd   = isDragging ? dragEnd : item.end

  const left  = secondsToX(displayStart, pxPerBeat, bpm)
  const right = displayEnd != null
    ? secondsToX(displayEnd, pxPerBeat, bpm)
    : left + MIN_BLOCK_W
  const width = Math.max(MIN_BLOCK_W, right - left)

  const isAudioChip = type === 'comments' && !!item.audio

  return (
    <div
      className={styles.block}
      data-type={type}
      data-selected={isSelected || undefined}
      data-dragging={isDragging || undefined}
      data-audio={isAudioChip || undefined}
      data-block-id={item.id}
      style={{ left, width, top: 4, bottom: 4, position: 'absolute' }}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={item.text
        ? `${TYPE_LABEL[type]}: ${item.text}`
        : `${TYPE_LABEL[type]} annotation`}
      aria-pressed={isSelected}
      onPointerDown={e => {
        if (disabled) return
        e.stopPropagation()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const mode: DragMode =
          item.end != null && (rect.right - e.clientX) <= EDGE_HIT_W
            ? 'resize-end'
            : 'move'
        onStartDrag(e, item.id, mode)
      }}
      onKeyDown={e => onKeyDown(e, item.id)}
    >
      {isAudioChip ? (
        <button
          type="button"
          className={styles.audioChip}
          aria-label="Play audio comment"
          tabIndex={-1}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onPlayAudio?.(item.id) }}
        >
          <Play aria-hidden size={9} weight="fill" />
          {item.text && <span className={styles.blockText}>{item.text}</span>}
        </button>
      ) : (
        <span className={styles.blockText}>{item.text ?? ''}</span>
      )}

      {/* Right-edge resize handle — only rendered when item has an end time */}
      {item.end != null && (
        <div
          className={styles.resizeHandle}
          data-resize="end"
          onPointerDown={e => {
            if (disabled) return
            e.stopPropagation()
            onStartDrag(e, item.id, 'resize-end')
          }}
        />
      )}
    </div>
  )
}

// ─── AnnotationLane ───────────────────────────────────────────────────────────

export function AnnotationLane({
  type, items, bpm, pxPerBeat,
  selectedId, disabled = false,
  onAdd, onEdit, onMove, onResize, onDelete, onPlayAudio,
}: AnnotationLaneProps) {
  const laneRef      = useRef<HTMLDivElement>(null)
  const dragRef      = useRef<ActiveDrag | null>(null)
  const downRef      = useRef<{ x: number; isBlock: boolean } | null>(null)
  const closeTimeRef = useRef(0)

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [ctxOpen,    setCtxOpen]    = useState(false)
  const [ctxPos,     setCtxPos]     = useState({ x: 0, y: 0 })
  const [ctxItemId,  setCtxItemId]  = useState<string | null>(null)

  const laneH = LANE_HEIGHT[type]

  function toLaneX(clientX: number): number {
    const rect = laneRef.current!.getBoundingClientRect()
    return Math.max(0, clientX - rect.left)
  }

  // ── Start drag (called from Block.onPointerDown via e.stopPropagation) ───────

  function startDrag(e: React.PointerEvent, id: string, mode: DragMode) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const drag: ActiveDrag = {
      id, mode,
      startPointerX: e.clientX,
      startTime:     item.start,
      startEnd:      item.end,
      currentStart:  item.start,
      currentEnd:    item.end,
    }
    dragRef.current = drag
    setActiveDrag(drag)
    downRef.current = { x: e.clientX, isBlock: true }
    laneRef.current?.setPointerCapture(e.pointerId)
  }

  // ── Lane pointer-down (empty space → queue click-to-add) ────────────────────

  function handleLanePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    downRef.current = { x: e.clientX, isBlock: false }
    laneRef.current?.setPointerCapture(e.pointerId)
  }

  // ── Pointer move ─────────────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startPointerX
    const dtSeconds = xToSeconds(Math.abs(dx), pxPerBeat, bpm) * Math.sign(dx)

    if (drag.mode === 'move') {
      const newStart = Math.max(0, drag.startTime + dtSeconds)
      const delta    = newStart - drag.startTime
      const updated: ActiveDrag = {
        ...drag,
        currentStart: newStart,
        currentEnd:   drag.startEnd != null ? drag.startEnd + delta : undefined,
      }
      dragRef.current = updated
      setActiveDrag(updated)
    } else {
      const rawEnd = (drag.startEnd ?? drag.startTime) + dtSeconds
      const newEnd = Math.max(drag.startTime + 0.1, rawEnd)
      const updated: ActiveDrag = { ...drag, currentEnd: newEnd }
      dragRef.current = updated
      setActiveDrag(updated)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerBeat, bpm])

  // ── Pointer up ───────────────────────────────────────────────────────────────

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const down = downRef.current

    if (drag) {
      const moved = Math.abs(e.clientX - drag.startPointerX) > CLICK_THRESH
      if (moved) {
        if (drag.mode === 'move')         onMove?.(drag.id, drag.currentStart)
        else if (drag.currentEnd != null) onResize?.(drag.id, drag.currentEnd)
      } else {
        onEdit?.(drag.id)
      }
      dragRef.current = null
      downRef.current = null
      setActiveDrag(null)
      return
    }

    // Empty-space click-to-add
    if (down && !down.isBlock) {
      const moved = Math.abs(e.clientX - down.x) > CLICK_THRESH
      if (!moved) {
        onAdd?.(xToSeconds(toLaneX(e.clientX), pxPerBeat, bpm))
      }
    }
    downRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMove, onResize, onEdit, onAdd, pxPerBeat, bpm])

  // ── Context menu (right-click on a block) ────────────────────────────────────

  function handleContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return
    const blockEl = (e.target as HTMLElement).closest('[data-block-id]') as HTMLElement | null
    if (!blockEl) return
    e.preventDefault()
    setCtxItemId(blockEl.dataset.blockId!)
    setCtxPos({ x: e.clientX, y: e.clientY })
    setCtxOpen(true)
  }

  // ── Block keyboard ───────────────────────────────────────────────────────────

  function handleBlockKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onDelete?.(id)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEdit?.(id)
    }
  }

  function closeCtx() {
    closeTimeRef.current = Date.now()
    setCtxOpen(false)
    setCtxItemId(null)
  }

  const ctxItems: MenuEntry[] = [
    {
      id:       'edit',
      label:    'Edit',
      onSelect: () => { if (ctxItemId) { onEdit?.(ctxItemId); closeCtx() } },
    },
    { id: 'sep', separator: true },
    {
      id:       'delete',
      label:    'Delete',
      danger:   true,
      onSelect: () => { if (ctxItemId) { onDelete?.(ctxItemId); closeCtx() } },
    },
  ]

  return (
    <div
      className={styles.lane}
      data-testid="annotation-lane"
      data-type={type}
      data-disabled={disabled || undefined}
      style={{ height: laneH + 8 }}
    >
      {/* Type label header */}
      <div className={styles.header} data-type={type}>
        <span className={styles.typeLabel}>{TYPE_LABEL[type]}</span>
      </div>

      {/* Timeline body */}
      <div
        ref={laneRef}
        className={styles.body}
        data-testid="annotation-body"
        data-type={type}
        data-dragging={activeDrag !== null || undefined}
        style={{ height: laneH + 8 }}
        aria-label={`${TYPE_LABEL[type]} annotations`}
        onPointerDown={handleLanePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        {items.map(item => (
          <Block
            key={item.id}
            item={item}
            type={type}
            pxPerBeat={pxPerBeat}
            bpm={bpm}
            isDragging={activeDrag?.id === item.id}
            dragStart={activeDrag?.id === item.id ? activeDrag.currentStart : undefined}
            dragEnd={activeDrag?.id   === item.id ? activeDrag.currentEnd   : undefined}
            isSelected={selectedId === item.id}
            disabled={disabled}
            onStartDrag={startDrag}
            onKeyDown={handleBlockKeyDown}
            onPlayAudio={onPlayAudio}
          />
        ))}
      </div>

      {ctxOpen && (
        <ContextMenu
          items={ctxItems}
          open
          x={ctxPos.x}
          y={ctxPos.y}
          onClose={closeCtx}
          aria-label="Annotation options"
        />
      )}
    </div>
  )
}

export { HEADER_WIDTH }
