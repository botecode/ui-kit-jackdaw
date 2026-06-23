// src/components/TrackLane/TrackLane.tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import { Clip } from '../Clip'
import { TimelineGrid, type Division } from '../TimelineGrid'
import { divisionToPx, snapXToDivision } from '../TimelineGrid'
import { secondsToX, xToSeconds } from '../TimelineRuler'
import { useSpring } from '../../motion/spring'
import styles from './TrackLane.module.css'

// ─── Time-stretch bounds ────────────────────────────────────────────────────────
// A clip's playback rate is constrained to ±2 octaves of speed. Symmetric in the
// time domain (0.25× = a quarter speed = 4× longer; 4× = 4× faster = a quarter the
// length) so a stretch reads the same dragging either edge in either direction.

const RATE_MIN = 0.25
const RATE_MAX = 4
/** Floor so a degenerate (zero/near-zero) length never divides into NaN/∞. */
const MIN_LEN_SEC = 0.02

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Source seconds available to a clip = sourceDuration minus its in-point offset. */
function contentSeconds(clip: ClipInfo): number {
  if (clip.sourceDuration == null) return 0
  return Math.max(MIN_LEN_SEC, clip.sourceDuration - (clip.offset ?? 0))
}

/** Whether a clip can be time-stretched (needs a known source extent to bound it). */
const isStretchable = (clip: ClipInfo) => clip.sourceDuration != null

// ─── Public types ──────────────────────────────────────────────────────────────

export interface ClipInfo {
  clipId: string
  /** Seconds from project start. */
  start: number
  /** Duration in seconds (the stretched, on-timeline length). */
  length: number
  peaks: number[]
  color?: string
  waveformColor?: 'ink' | 'track'
  state?: 'recorded' | 'recording'
  selected?: boolean
  label?: string
  muted?: boolean
  splitLeft?: boolean
  splitRight?: boolean
  /**
   * Total duration of the underlying source audio at rate 1.0 (seconds). Presence
   * of this field enables edge time-stretch — it bounds the rate (the clip plays
   * its source from `offset` to the source end, so the stretchable content is
   * `sourceDuration - offset`). Implied current rate = content / length.
   */
  sourceDuration?: number
  /** Seconds into the source where this clip's content begins (the in-point). Default 0. */
  offset?: number
}

/**
 * Live recording overlay descriptor. While a track is armed + rolling, the consumer
 * passes the punch-in point plus an imperative read of the transport position; the
 * lane paints a growing translucent capture region from `startSec` to the live
 * playhead. This is deliberately NOT a `ClipInfo` in `clips` — it has no peaks, id,
 * selection, or drag/trim semantics; it's transport-driven UI state, not edited data.
 */
export interface RecordingRegion {
  /** Project seconds where recording punched in — the region's fixed left edge. */
  startSec: number
  /**
   * Imperative read of the live transport position in project seconds — the SAME
   * authoritative source the Playhead reads via `getPlayheadSeconds`. Called once per
   * animation frame to grow the region's right edge to the playhead. Imperative (a
   * getter, not a plain number) so a recording lane repaints via its own rAF instead
   * of forcing a 60 fps React re-render of the whole arrangement — mirrors Playhead's
   * `seconds` / `getSeconds` split. Memoize it (useCallback) to avoid restarting the
   * rAF loop on every parent render.
   */
  getNowSec: () => number
}

export interface ClipMoveIntent {
  clipId: string
  /** Snapped start position in seconds. */
  start: number
  /** Target track id for cross-track moves. Omitted for same-track moves. */
  trackId?: string
}

export interface ClipTrimIntent {
  clipId: string
  start: number
  length: number
}

export interface TrackLaneProps {
  trackId: string
  clips: ClipInfo[]
  bpm: number
  numerator: number
  denominator: number
  pxPerBeat: number
  division: Division
  height: number
  selected?: boolean
  disabled?: boolean
  onClipMove?: (intent: ClipMoveIntent) => void
  /**
   * Fires on every pointer-move of a MOVE drag, surfacing the raw pointer position
   * and the clip being dragged. A standalone lane can't resolve a drop onto a
   * sibling lane — only the Arrangement composite sees the whole lane stack — so it
   * hit-tests these coordinates against its lanes to derive the live drop target
   * (and feed `dropTarget` back down + fire its own `onClipDragOver`).
   */
  onClipDragMove?: (info: { clipId: string; clientX: number; clientY: number }) => void
  /** Fires once when a MOVE drag is released (pointer up / cancel) — lets the
   *  composite clear its transient drop-target state. Trim/stretch don't fire it. */
  onClipDragEnd?: () => void
  /**
   * Live drop-target verdict for THIS lane during a cross-lane drag, resolved and
   * pushed down by the Arrangement composite: `'valid'` paints the accent drop
   * highlight, `'invalid'` the amber folder-reject highlight. Unset = not a target.
   */
  dropTarget?: 'valid' | 'invalid' | null
  onClipTrimStart?: (intent: ClipTrimIntent) => void
  onClipTrimEnd?: (intent: ClipTrimIntent) => void
  /**
   * Edge time-stretch — Alt + drag a clip edge changes its playback `rate` instead
   * of trimming (only when the clip carries `sourceDuration`). `rate` is absolute:
   * `(sourceDuration - offset) / newLength`, clamped to [0.25, 4]. The left edge is
   * end-anchored, so it also moves the start — `newStart` is the snapped new start
   * (seconds) for left-edge stretches and omitted for right-edge stretches.
   * Positional signature mirrors the DAW's `useClipStretch` / ClipStretchLayer.
   */
  onClipSetRate?: (clipId: string, rate: number, newStart?: number) => void
  onClipDelete?: (clipId: string) => void
  /** Plain click (or Enter) on a clip — replaces the selection with this clip. */
  onClipSelect?: (clipId: string) => void
  /** Shift+click (or Shift+Enter) on a clip — toggles it in the multi-clip selection. */
  onClipShiftSelect?: (clipId: string) => void
  /**
   * Right-click (contextmenu) on a clip. The kit only surfaces the gesture — the
   * consumer owns the menu UI (compose the shared `Popover` in point mode from
   * `event.clientX` / `event.clientY`). The kit calls `event.preventDefault()` so the
   * native browser menu is suppressed only when this handler is wired.
   */
  onClipContextMenu?: (event: React.MouseEvent<HTMLDivElement>, clipId: string) => void
  /**
   * Right-click (contextmenu) on empty lane space. Surfaces the event + this lane's
   * `trackId` so the consumer can open a track-level menu (e.g. paste, insert).
   * `preventDefault` is called only when this handler is provided.
   */
  onLaneContextMenu?: (event: React.MouseEvent<HTMLDivElement>, trackId: string) => void
  /** Called when the user clicks empty lane space; seconds are snapped to division. */
  onSetCursor?: (seconds: number) => void
  /**
   * Live recording overlay. While this track is armed + rolling, pass the punch-in
   * point + an imperative read of the transport position and the lane paints a growing
   * translucent red capture region from `startSec` to the live playhead (driven by the
   * lane's own rAF, so it costs no React re-renders). Unset = not recording. This is a
   * transient transport-driven region, NOT a clip in `clips`.
   */
  recordingRegion?: RecordingRegion | null
}

// ─── Internal types ────────────────────────────────────────────────────────────

type DragMode = 'move' | 'trim-start' | 'trim-end' | 'stretch-start' | 'stretch-end'

const isStretchMode = (m: DragMode) => m === 'stretch-start' || m === 'stretch-end'

interface ActiveDrag {
  clipId: string
  mode: DragMode
  clip0Left: number
  clip0Right: number
  pointerX0: number
  currentLeft: number
  currentRight: number
  /** Move only: pointer Y at grab + live vertical offset, so the clip lifts toward
   *  a sibling lane while the composite resolves the cross-track target. */
  pointerY0: number
  offsetY: number
  /** Stretch only: source seconds in the clip + px length bounds derived from the rate range. */
  contentSec?: number
  minLenPx?: number
  maxLenPx?: number
}

interface ReleaseInfo {
  /** Clip left-px at the moment the pointer was released (unsnapped). Seeds the spring. */
  fromX: number
  /** Increment each release to retrigger the spring. */
  key: number
}

// ─── ClipSlot ─────────────────────────────────────────────────────────────────
// Encapsulates one clip's positioning + per-clip spring settle instance.

interface ClipSlotProps {
  clip: ClipInfo
  pxPerBeat: number
  bpm: number
  isDragging: boolean
  /** True while THIS clip is being time-stretched (vs moved/trimmed). */
  stretching: boolean
  dragLeft?: number
  dragRight?: number
  /** Vertical lift (px) while THIS clip is being moved across lanes. */
  dragOffsetY?: number
  release?: ReleaseInfo
  disabled: boolean
  onKeyDelete: (clipId: string) => void
  onKeySelect: (clipId: string, additive: boolean) => void
}

function ClipSlot({
  clip,
  pxPerBeat,
  bpm,
  isDragging,
  stretching,
  dragLeft,
  dragRight,
  dragOffsetY,
  release,
  disabled,
  onKeyDelete,
  onKeySelect,
}: ClipSlotProps) {
  const naturalLeft  = secondsToX(clip.start, pxPerBeat, bpm)
  const naturalRight = secondsToX(clip.start + clip.length, pxPerBeat, bpm)
  const naturalWidth = Math.max(0, naturalRight - naturalLeft)

  // Spring: seeds from `fromX` each time `key` increments (drag release).
  // Targets naturalLeft — which equals the snapped position once the parent updates.
  // Under prefers-reduced-motion, useSpring snaps instantly; drag tracking is 1:1
  // regardless (functional motion, not decorative).
  const springLeft = useSpring(naturalLeft, {
    from: release?.fromX,
    key:  release?.key ?? 0,
  })

  const renderLeft  = isDragging ? (dragLeft  ?? naturalLeft)  : springLeft
  const renderRight = isDragging ? (dragRight ?? naturalRight) : springLeft + naturalWidth
  const renderWidth = Math.max(8, renderRight - renderLeft)

  // Implied playback rate = source content / on-timeline length. Computed from the
  // live rendered width so the rate chip tracks the edge 1:1 during a stretch drag.
  // Only meaningful for stretchable clips; others render at rate 1 (no indicator).
  const content     = isStretchable(clip) ? contentSeconds(clip) : null
  const renderLenSec = xToSeconds(renderWidth, pxPerBeat, bpm)
  const rate = content != null
    ? clamp(content / Math.max(MIN_LEN_SEC, renderLenSec), RATE_MIN, RATE_MAX)
    : 1

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onKeyDelete(clip.clipId)
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Keyboard equivalent of click / shift+click; Shift extends the selection.
      e.preventDefault()
      onKeySelect(clip.clipId, e.shiftKey)
    }
  }

  return (
    <div
      className={styles.clipSlot}
      data-clip-id={clip.clipId}
      data-dragging={isDragging || undefined}
      data-stretching={stretching || undefined}
      data-stretchable={isStretchable(clip) || undefined}
      style={{
        position:  'absolute',
        left:      renderLeft,
        width:     renderWidth,
        top:       4,
        bottom:    4,
        transform: dragOffsetY ? `translateY(${dragOffsetY}px)` : undefined,
      }}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Trim handles — invisible hit-zones; cursor + visual indicator via CSS.
          On a stretchable clip these double as stretch handles when Alt is held. */}
      <div className={styles.trimHandle} data-trim="start" />
      <div className={styles.trimHandle} data-trim="end"   />

      <Clip
        peaks={clip.peaks}
        color={clip.color}
        waveformColor={clip.waveformColor ?? 'ink'}
        state={clip.state ?? 'recorded'}
        selected={clip.selected}
        label={clip.label}
        showLabel={!!clip.label}
        muted={clip.muted}
        splitLeft={clip.splitLeft}
        splitRight={clip.splitRight}
        rate={rate}
        aria-label={clip.label ? `Clip: ${clip.label}` : 'Clip'}
      />
    </div>
  )
}

// ─── RecordingOverlay ───────────────────────────────────────────────────────────
// The live capture region. Left edge is fixed at the punch-in point; the right edge
// tracks the transport position imperatively via rAF, so the region grows smoothly
// while recording without re-rendering the lane each frame (same no-churn contract as
// Playhead). The width is also seeded synchronously from getNowSec() at render so the
// first paint is correct (no flash) and the snapshot stays right even if rAF never
// advances — e.g. a paused frame. Growth is functional, state-carrying motion (what's
// being captured, tied to transport), so it KEEPS tracking under prefers-reduced-motion,
// exactly like the playhead and meters — no decorative animation to disable.

interface RecordingOverlayProps {
  region: RecordingRegion
  pxPerBeat: number
  bpm: number
}

function RecordingOverlay({ region, pxPerBeat, bpm }: RecordingOverlayProps) {
  const elRef = useRef<HTMLDivElement>(null)

  // Keep the live getter current without restarting the rAF loop on every render.
  const getNowRef = useRef(region.getNowSec)
  useEffect(() => { getNowRef.current = region.getNowSec })

  const left = secondsToX(region.startSec, pxPerBeat, bpm)
  // Synchronous seed: correct first paint + a sane snapshot if rAF never fires.
  const width0 = Math.max(0, secondsToX(region.getNowSec(), pxPerBeat, bpm) - left)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    let raf = 0
    const paint = () => {
      const right = secondsToX(getNowRef.current(), pxPerBeat, bpm)
      el.style.width = `${Math.max(0, right - left)}px`
      raf = requestAnimationFrame(paint)
    }
    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [left, pxPerBeat, bpm])

  return (
    <div
      ref={elRef}
      className={styles.recordingRegion}
      data-testid="recording-region"
      aria-hidden="true"
      style={{ left, width: width0 }}
    />
  )
}

// ─── TrackLane ────────────────────────────────────────────────────────────────

export function TrackLane({
  trackId,
  clips,
  bpm,
  numerator,
  denominator,
  pxPerBeat,
  division,
  height,
  selected  = false,
  disabled  = false,
  onClipMove,
  onClipDragMove,
  onClipDragEnd,
  dropTarget = null,
  onClipTrimStart,
  onClipTrimEnd,
  onClipSetRate,
  onClipDelete,
  onClipSelect,
  onClipShiftSelect,
  onClipContextMenu,
  onLaneContextMenu,
  onSetCursor,
  recordingRegion,
}: TrackLaneProps) {
  const laneRef      = useRef<HTMLDivElement>(null)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  // Mutable mirror — read inside pointer-move/up without stale-closure risk.
  const activeDragRef = useRef<ActiveDrag | null>(null)
  const [releaseMap, setReleaseMap] = useState<Record<string, ReleaseInfo>>({})

  const divisionPx = divisionToPx(division, pxPerBeat, numerator, denominator)
  const pxPerSec   = secondsToX(1, pxPerBeat, bpm)

  // ── Stretch-armed (Alt) ───────────────────────────────────────────────────────
  // Holding Alt over a lane that has stretchable clips arms the edges for
  // time-stretch: the cursor + edge affordance switch from trim to stretch. The
  // gesture itself is read from the live `event.altKey` at pointer-down — this
  // state only drives the at-rest cursor/affordance so it costs nothing functional.
  const [altArmed, setAltArmed] = useState(false)
  const hasStretchable = clips.some(isStretchable)

  useEffect(() => {
    if (disabled || !hasStretchable) {
      setAltArmed(false)
      return
    }
    const sync = (e: KeyboardEvent) => setAltArmed(e.altKey)
    window.addEventListener('keydown', sync)
    window.addEventListener('keyup', sync)
    // A blur (e.g. tab-away while held) must not leave the lane stuck armed.
    const clear = () => setAltArmed(false)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', sync)
      window.removeEventListener('keyup', sync)
      window.removeEventListener('blur', clear)
    }
  }, [disabled, hasStretchable])

  // ── Pointer move ────────────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = activeDragRef.current
    if (!drag) return

    const dx = e.clientX - drag.pointerX0

    if (drag.mode === 'move') {
      const newLeft   = Math.max(0, drag.clip0Left + dx)
      const clipWidth = drag.clip0Right - drag.clip0Left
      const updated   = {
        ...drag,
        currentLeft:  newLeft,
        currentRight: newLeft + clipWidth,
        offsetY:      e.clientY - drag.pointerY0,
      }
      activeDragRef.current = updated
      setActiveDrag(updated)
      // Surface the live pointer so the composite can hit-test the lane stack and
      // resolve the cross-track drop target (this lane can't see its siblings).
      onClipDragMove?.({ clipId: drag.clipId, clientX: e.clientX, clientY: e.clientY })
    } else if (drag.mode === 'trim-start') {
      const newLeft = Math.max(0, Math.min(drag.clip0Left + dx, drag.clip0Right - 8))
      const updated = { ...drag, currentLeft: newLeft }
      activeDragRef.current = updated
      setActiveDrag(updated)
    } else if (drag.mode === 'trim-end') {
      const newRight = Math.max(drag.clip0Left + 8, drag.clip0Right + dx)
      const updated  = { ...drag, currentRight: newRight }
      activeDragRef.current = updated
      setActiveDrag(updated)
    } else if (drag.mode === 'stretch-end') {
      // Right edge stretches the length within the rate-derived px bounds; left fixed.
      const min = drag.clip0Left + (drag.minLenPx ?? 8)
      const max = drag.clip0Left + (drag.maxLenPx ?? Infinity)
      const updated = { ...drag, currentRight: clamp(drag.clip0Right + dx, min, max) }
      activeDragRef.current = updated
      setActiveDrag(updated)
    } else {
      // stretch-start — end-anchored: right edge fixed, left edge moves the start.
      const min = drag.clip0Right - (drag.maxLenPx ?? drag.clip0Right)
      const max = drag.clip0Right - (drag.minLenPx ?? 8)
      const updated = { ...drag, currentLeft: Math.max(0, clamp(drag.clip0Left + dx, min, max)) }
      activeDragRef.current = updated
      setActiveDrag(updated)
    }
  }, [onClipDragMove])

  // ── Pointer up ─────────────────────────────────────────────────────────────

  const handlePointerUp = useCallback(() => {
    const drag = activeDragRef.current
    if (!drag) return

    const { clipId, mode, currentLeft, currentRight } = drag

    if (mode === 'move') {
      const snappedLeft = snapXToDivision(currentLeft, divisionPx)
      // The composite injects the resolved sibling lane into `intent.trackId` (it owns
      // the cross-lane hit-test); a standalone lane just emits the same-track start.
      onClipMove?.({ clipId, start: xToSeconds(snappedLeft, pxPerBeat, bpm) })
      // Seed spring settle: from drag-release position → natural (snapped) position.
      setReleaseMap(prev => ({
        ...prev,
        [clipId]: { fromX: currentLeft, key: (prev[clipId]?.key ?? 0) + 1 },
      }))
      // Let the composite clear its transient drop-target state (fires after move so
      // the onClipMove wrapper can still read the resolved target).
      onClipDragEnd?.()
    } else if (mode === 'trim-start') {
      const snappedLeft = snapXToDivision(currentLeft, divisionPx)
      const clip = clips.find(c => c.clipId === clipId)
      if (clip) {
        const newStart  = xToSeconds(snappedLeft, pxPerBeat, bpm)
        const newLength = Math.max(0.01, clip.start + clip.length - newStart)
        onClipTrimStart?.({ clipId, start: newStart, length: newLength })
      }
    } else if (mode === 'trim-end') {
      const snappedRight = snapXToDivision(currentRight, divisionPx)
      const clip = clips.find(c => c.clipId === clipId)
      if (clip) {
        const newLength = Math.max(0.01, xToSeconds(snappedRight, pxPerBeat, bpm) - clip.start)
        onClipTrimEnd?.({ clipId, start: clip.start, length: newLength })
      }
    } else if (mode === 'stretch-end') {
      // Right edge: start fixed, length snaps to grid, rate = content / length.
      const clip = clips.find(c => c.clipId === clipId)
      if (clip) {
        const snappedRight = snapXToDivision(currentRight, divisionPx)
        const lengthSec    = Math.max(MIN_LEN_SEC, xToSeconds(snappedRight, pxPerBeat, bpm) - clip.start)
        const rate         = clamp(contentSeconds(clip) / lengthSec, RATE_MIN, RATE_MAX)
        onClipSetRate?.(clipId, rate)
      }
    } else {
      // stretch-start — end-anchored: end fixed, start moves; emit rate + new start.
      const clip = clips.find(c => c.clipId === clipId)
      if (clip) {
        const snappedLeft = snapXToDivision(currentLeft, divisionPx)
        const newStart    = Math.max(0, xToSeconds(snappedLeft, pxPerBeat, bpm))
        const endSec      = clip.start + clip.length
        const lengthSec   = Math.max(MIN_LEN_SEC, endSec - newStart)
        const rate        = clamp(contentSeconds(clip) / lengthSec, RATE_MIN, RATE_MAX)
        onClipSetRate?.(clipId, rate, newStart)
      }
    }

    activeDragRef.current = null
    setActiveDrag(null)
  }, [bpm, clips, divisionPx, onClipMove, onClipDragEnd, onClipSetRate, onClipTrimEnd, onClipTrimStart, pxPerBeat])

  // ── Start drag (called from lane pointer-down after target detection) ───────

  function startDrag(e: React.PointerEvent<HTMLDivElement>, clipId: string, mode: DragMode) {
    const clip = clips.find(c => c.clipId === clipId)
    if (!clip) return

    const clip0Left  = secondsToX(clip.start, pxPerBeat, bpm)
    const clip0Right = secondsToX(clip.start + clip.length, pxPerBeat, bpm)

    // Stretch modes precompute the px length window the rate range allows so the
    // edge can be clamped 1:1 during the drag (shorter ⇒ faster, longer ⇒ slower).
    const stretch = isStretchMode(mode)
      ? (() => {
          const c = contentSeconds(clip)
          return { contentSec: c, minLenPx: (c / RATE_MAX) * pxPerSec, maxLenPx: (c / RATE_MIN) * pxPerSec }
        })()
      : {}

    const drag: ActiveDrag = {
      clipId, mode, clip0Left, clip0Right,
      pointerX0:    e.clientX,
      pointerY0:    e.clientY,
      currentLeft:  clip0Left,
      currentRight: clip0Right,
      offsetY:      0,
      ...stretch,
    }
    activeDragRef.current = drag
    setActiveDrag(drag)
    // Capture on the lane so move/up continue when pointer leaves clips.
    laneRef.current!.setPointerCapture(e.pointerId)
  }

  // ── Lane pointer-down ──────────────────────────────────────────────────────

  function handleLanePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return

    // Detect whether the pointer hit a clip (or its trim handle).
    const clipEl = (e.target as HTMLElement).closest('[data-clip-id]') as HTMLElement | null
    const trimEl = (e.target as HTMLElement).closest('[data-trim]')    as HTMLElement | null

    if (clipEl) {
      const clipId = clipEl.dataset.clipId!

      // Edge handles. Alt + a stretchable clip → time-stretch (rate); otherwise the
      // same handle trims. Both are pure-resize gestures: no selection change.
      if (trimEl) {
        const atStart  = trimEl.dataset.trim === 'start'
        const clip     = clips.find(c => c.clipId === clipId)
        const stretch  = e.altKey && !!clip && isStretchable(clip)
        const mode: DragMode = stretch
          ? (atStart ? 'stretch-start' : 'stretch-end')
          : (atStart ? 'trim-start'    : 'trim-end')
        startDrag(e, clipId, mode)
        return
      }

      // Clip body. Shift+click is a pure additive-selection gesture — it toggles
      // the clip in the cross-lane set and must NOT arm a move drag (dragging a
      // freshly-toggled multi-selection has no coherent meaning here). A plain
      // click replaces the selection with this clip and then arms the move drag.
      if (e.shiftKey) {
        onClipShiftSelect?.(clipId)
        return
      }
      onClipSelect?.(clipId)
      startDrag(e, clipId, 'move')
      return
    }

    // Empty lane → set cursor at snapped position.
    const rect = laneRef.current!.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left)
    onSetCursor?.(xToSeconds(snapXToDivision(x, divisionPx), pxPerBeat, bpm))
  }

  // ── Lane context menu ──────────────────────────────────────────────────────
  // Right-click routes by hit-target: a clip (incl. its trim handles, which live
  // inside [data-clip-id]) → onClipContextMenu; otherwise the empty lane →
  // onLaneContextMenu. The kit only surfaces event + ids; the consumer owns the
  // menu UI. preventDefault is called ONLY when the matching handler is wired, so
  // the native menu is suppressed exactly where we hand off a custom one.

  function handleLaneContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return

    const clipEl = (e.target as HTMLElement).closest('[data-clip-id]') as HTMLElement | null

    if (clipEl) {
      if (!onClipContextMenu) return
      e.preventDefault()
      onClipContextMenu(e, clipEl.dataset.clipId!)
      return
    }

    if (!onLaneContextMenu) return
    e.preventDefault()
    onLaneContextMenu(e, trackId)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={laneRef}
      className={styles.root}
      data-testid="track-lane"
      data-track-id={trackId}
      data-selected={selected  || undefined}
      data-disabled={disabled  || undefined}
      data-dragging={activeDrag?.clipId || undefined}
      data-drag-mode={activeDrag?.mode}
      data-drop-target={dropTarget ?? undefined}
      data-stretch-armed={(altArmed && !activeDrag) || undefined}
      data-stretching={(activeDrag && isStretchMode(activeDrag.mode)) || undefined}
      data-recording={recordingRegion ? '' : undefined}
      style={{ height }}
      onPointerDown={handleLanePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleLaneContextMenu}
    >
      {/* Cross-lane drop highlight — painted when the composite resolves this lane as
          the live drag target: accent for a valid landing, amber for a folder reject. */}
      {dropTarget && (
        <div className={styles.dropHighlight} data-drop={dropTarget} aria-hidden="true" />
      )}

      {/* Beat/bar grid + paper texture (TimelineGrid already composites both). */}
      <div className={styles.gridLayer} aria-hidden="true">
        <TimelineGrid
          division={division}
          pxPerBeat={pxPerBeat}
          bpm={bpm}
          numerator={numerator}
          denominator={denominator}
        />
      </div>

      {/* Live capture region — a growing translucent red band from the punch-in point
          to the live playhead while this track is armed + rolling. Transport-driven UI
          state (its own rAF), not a clip; sits above the grid, below clip bodies. */}
      {recordingRegion && (
        <RecordingOverlay region={recordingRegion} pxPerBeat={pxPerBeat} bpm={bpm} />
      )}

      {clips.map(clip => {
        const isDragging = activeDrag?.clipId === clip.clipId
        return (
          <ClipSlot
            key={clip.clipId}
            clip={clip}
            pxPerBeat={pxPerBeat}
            bpm={bpm}
            isDragging={isDragging}
            stretching={isDragging && isStretchMode(activeDrag!.mode)}
            dragLeft={isDragging  ? activeDrag!.currentLeft  : undefined}
            dragRight={isDragging ? activeDrag!.currentRight : undefined}
            dragOffsetY={isDragging && activeDrag!.mode === 'move' ? activeDrag!.offsetY : undefined}
            release={releaseMap[clip.clipId]}
            disabled={disabled}
            onKeyDelete={clipId => onClipDelete?.(clipId)}
            onKeySelect={(clipId, additive) =>
              additive ? onClipShiftSelect?.(clipId) : onClipSelect?.(clipId)}
          />
        )
      })}
    </div>
  )
}
