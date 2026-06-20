import { useRef, useState } from 'react'
import styles from './TimeSelection.module.css'

export interface SelectionRange {
  start: number  // seconds
  end: number    // seconds
}

export interface TimeSelectionProps {
  /** Loop region in seconds; null = no selection (empty state). */
  range: SelectionRange | null
  /**
   * Seconds → pixel offset from the timeline container's left edge.
   * Must be the same function passed to Playhead and derived from the same ruler params.
   * Memoize with useCallback to avoid spurious re-renders.
   */
  secondsToX: (s: number) => number
  /**
   * Pixel offset from the timeline container's left edge → seconds.
   * Must be the exact inverse of secondsToX.
   */
  xToSeconds: (x: number) => number
  /** Project length in seconds — used to clamp drags. */
  durationSeconds: number
  /** Called on every drag tick (controlled: reconcile to these props). */
  onChange: (range: SelectionRange) => void
  /** Called on right-click, Esc, or brackets dragged together to < 50ms. */
  onClear: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

/** Brackets closer than this in seconds on pointerup → onClear. */
const MIN_DURATION  = 0.05
const NUDGE_FINE    = 0.1   // arrow key nudge
const NUDGE_COARSE  = 1.0   // shift+arrow nudge

type DragKind = 'start' | 'end' | 'band'

interface DragInfo {
  kind:           DragKind
  downContainerX: number
  downStart:      number
  downEnd:        number
}

function fmt(s: number): string {
  return `${s.toFixed(2)}s`
}

export function TimeSelection({
  range,
  secondsToX,
  xToSeconds,
  durationSeconds,
  onChange,
  onClear,
  disabled = false,
  size = 'md',
}: TimeSelectionProps) {
  const rootRef  = useRef<HTMLDivElement>(null)
  const dragRef  = useRef<DragInfo | null>(null)
  const [dragKind, setDragKind] = useState<DragKind | null>(null)

  // ── Coord helpers ──────────────────────────────────────────────────────────

  // root is position:absolute left:0 inside the container, so its bounding rect
  // left IS the container's left edge in screen space — same coordinate origin as secondsToX(0).
  function clientXToContainerX(clientX: number): number {
    const root = rootRef.current
    if (!root) return 0
    return clientX - root.getBoundingClientRect().left
  }

  function clampSec(s: number): number {
    return Math.max(0, Math.min(s, durationSeconds))
  }

  // ── Drag init ──────────────────────────────────────────────────────────────

  function startDrag(e: React.PointerEvent, kind: DragKind) {
    if (disabled || !range) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = {
      kind,
      downContainerX: clientXToContainerX(e.clientX),
      downStart: range.start,
      downEnd:   range.end,
    }
    setDragKind(kind)
  }

  // ── Shared pointermove — called on whichever element captured the pointer ──

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const cx   = clientXToContainerX(e.clientX)
    const secs = xToSeconds(cx)

    if (drag.kind === 'start') {
      const newStart = Math.min(clampSec(secs), drag.downEnd - MIN_DURATION)
      onChange({ start: Math.max(0, newStart), end: drag.downEnd })
    } else if (drag.kind === 'end') {
      const newEnd = Math.max(clampSec(secs), drag.downStart + MIN_DURATION)
      onChange({ start: drag.downStart, end: Math.min(newEnd, durationSeconds) })
    } else {
      // band: move whole range, preserving width
      const downSecs  = xToSeconds(drag.downContainerX)
      const deltaSecs = secs - downSecs
      const bandWidth = drag.downEnd - drag.downStart
      const rawStart  = drag.downStart + deltaSecs
      const clampedStart = Math.max(0, Math.min(rawStart, durationSeconds - bandWidth))
      onChange({ start: clampedStart, end: clampedStart + bandWidth })
    }
  }

  function handlePointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    setDragKind(null)
    if (!drag) return
    // brackets together → clear
    if (range && Math.abs(range.end - range.start) < MIN_DURATION) {
      onClear()
    }
  }

  // ── Right-click → clear ────────────────────────────────────────────────────

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    onClear()
  }

  // ── Keyboard (on handles) ──────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent, side: 'start' | 'end') {
    if (disabled || !range) return
    const step = e.shiftKey ? NUDGE_COARSE : NUDGE_FINE

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault()
        if (side === 'start') {
          onChange({ ...range, start: clampSec(range.start - step) })
        } else {
          onChange({ ...range, end: Math.max(range.start + MIN_DURATION, clampSec(range.end - step)) })
        }
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        if (side === 'start') {
          onChange({ ...range, start: Math.min(range.end - MIN_DURATION, clampSec(range.start + step)) })
        } else {
          onChange({ ...range, end: clampSec(range.end + step) })
        }
        break
      }
      case 'Escape': {
        e.preventDefault()
        onClear()
        break
      }
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!range) {
    return (
      <div
        ref={rootRef}
        className={styles.root}
        data-testid="time-selection-root"
        data-size={size}
        data-empty
        aria-hidden="true"
      />
    )
  }

  // ── Derived geometry ───────────────────────────────────────────────────────

  const startX = secondsToX(range.start)
  const endX   = secondsToX(range.end)
  const width  = Math.max(0, endX - startX)

  const sharedMoveUp = {
    onPointerMove:   handlePointerMove,
    onPointerUp:     handlePointerUp,
    onPointerCancel: handlePointerUp,
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="time-selection-root"
      data-size={size}
      data-disabled={disabled || undefined}
      onContextMenu={handleContextMenu}
    >
      {/* ── Shaded band — drag to move whole range ── */}
      <div
        className={styles.band}
        data-testid="time-selection-band"
        data-dragging={dragKind === 'band' || undefined}
        style={{ left: startX, width } as React.CSSProperties}
        aria-hidden="true"
        onPointerDown={e => startDrag(e, 'band')}
        {...sharedMoveUp}
      />

      {/* ── ARIA group containing both handles ── */}
      <div
        role="group"
        aria-label={`Loop region ${fmt(range.start)} to ${fmt(range.end)}`}
        className={styles.group}
        aria-disabled={disabled || undefined}
      >
        {/* Start bracket — drag to resize start */}
        <div
          className={styles.handle}
          data-testid="time-selection-handle-start"
          data-side="start"
          data-dragging={dragKind === 'start' || undefined}
          style={{ left: startX } as React.CSSProperties}
          role="slider"
          aria-label="Loop start"
          aria-valuemin={0}
          aria-valuemax={durationSeconds}
          aria-valuenow={range.start}
          aria-valuetext={fmt(range.start)}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={e => startDrag(e, 'start')}
          onKeyDown={e => handleKeyDown(e, 'start')}
          {...sharedMoveUp}
        >
          <div className={styles.bracket} />
        </div>

        {/* End bracket — drag to resize end */}
        <div
          className={styles.handle}
          data-testid="time-selection-handle-end"
          data-side="end"
          data-dragging={dragKind === 'end' || undefined}
          style={{ left: endX } as React.CSSProperties}
          role="slider"
          aria-label="Loop end"
          aria-valuemin={0}
          aria-valuemax={durationSeconds}
          aria-valuenow={range.end}
          aria-valuetext={fmt(range.end)}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={e => startDrag(e, 'end')}
          onKeyDown={e => handleKeyDown(e, 'end')}
          {...sharedMoveUp}
        >
          <div className={styles.bracket} />
        </div>
      </div>
    </div>
  )
}
