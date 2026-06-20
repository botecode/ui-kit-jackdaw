// src/components/TrackLane/TrackLane.tsx
import { useRef, useState, useCallback } from 'react'
import { Clip } from '../Clip'
import { TimelineGrid, type Division } from '../TimelineGrid'
import { divisionToPx, snapXToDivision } from '../TimelineGrid'
import { secondsToX, xToSeconds } from '../TimelineRuler'
import { useSpring } from '../../motion/spring'
import styles from './TrackLane.module.css'

// ─── Public types ──────────────────────────────────────────────────────────────

export interface ClipInfo {
  clipId: string
  /** Seconds from project start. */
  start: number
  /** Duration in seconds. */
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
  onClipTrimStart?: (intent: ClipTrimIntent) => void
  onClipTrimEnd?: (intent: ClipTrimIntent) => void
  onClipDelete?: (clipId: string) => void
  /** Called when the user clicks empty lane space; seconds are snapped to division. */
  onSetCursor?: (seconds: number) => void
}

// ─── Internal types ────────────────────────────────────────────────────────────

type DragMode = 'move' | 'trim-start' | 'trim-end'

interface ActiveDrag {
  clipId: string
  mode: DragMode
  clip0Left: number
  clip0Right: number
  pointerX0: number
  currentLeft: number
  currentRight: number
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
  dragLeft?: number
  dragRight?: number
  release?: ReleaseInfo
  disabled: boolean
  onKeyDelete: (clipId: string) => void
}

function ClipSlot({
  clip,
  pxPerBeat,
  bpm,
  isDragging,
  dragLeft,
  dragRight,
  release,
  disabled,
  onKeyDelete,
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onKeyDelete(clip.clipId)
    }
  }

  return (
    <div
      className={styles.clipSlot}
      data-clip-id={clip.clipId}
      data-dragging={isDragging || undefined}
      style={{
        position: 'absolute',
        left:     renderLeft,
        width:    renderWidth,
        top:      4,
        bottom:   4,
      }}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {/* Trim handles — invisible hit-zones; cursor + visual indicator via CSS. */}
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
        aria-label={clip.label ? `Clip: ${clip.label}` : 'Clip'}
      />
    </div>
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
  onClipTrimStart,
  onClipTrimEnd,
  onClipDelete,
  onSetCursor,
}: TrackLaneProps) {
  const laneRef      = useRef<HTMLDivElement>(null)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  // Mutable mirror — read inside pointer-move/up without stale-closure risk.
  const activeDragRef = useRef<ActiveDrag | null>(null)
  const [releaseMap, setReleaseMap] = useState<Record<string, ReleaseInfo>>({})

  const divisionPx = divisionToPx(division, pxPerBeat, numerator, denominator)

  // ── Pointer move ────────────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = activeDragRef.current
    if (!drag) return

    const dx = e.clientX - drag.pointerX0

    if (drag.mode === 'move') {
      const newLeft   = Math.max(0, drag.clip0Left + dx)
      const clipWidth = drag.clip0Right - drag.clip0Left
      const updated   = { ...drag, currentLeft: newLeft, currentRight: newLeft + clipWidth }
      activeDragRef.current = updated
      setActiveDrag(updated)
    } else if (drag.mode === 'trim-start') {
      const newLeft = Math.max(0, Math.min(drag.clip0Left + dx, drag.clip0Right - 8))
      const updated = { ...drag, currentLeft: newLeft }
      activeDragRef.current = updated
      setActiveDrag(updated)
    } else {
      const newRight = Math.max(drag.clip0Left + 8, drag.clip0Right + dx)
      const updated  = { ...drag, currentRight: newRight }
      activeDragRef.current = updated
      setActiveDrag(updated)
    }
  }, [])

  // ── Pointer up ─────────────────────────────────────────────────────────────

  const handlePointerUp = useCallback(() => {
    const drag = activeDragRef.current
    if (!drag) return

    const { clipId, mode, currentLeft, currentRight } = drag

    if (mode === 'move') {
      const snappedLeft = snapXToDivision(currentLeft, divisionPx)
      onClipMove?.({ clipId, start: xToSeconds(snappedLeft, pxPerBeat, bpm) })
      // Seed spring settle: from drag-release position → natural (snapped) position.
      setReleaseMap(prev => ({
        ...prev,
        [clipId]: { fromX: currentLeft, key: (prev[clipId]?.key ?? 0) + 1 },
      }))
    } else if (mode === 'trim-start') {
      const snappedLeft = snapXToDivision(currentLeft, divisionPx)
      const clip = clips.find(c => c.clipId === clipId)
      if (clip) {
        const newStart  = xToSeconds(snappedLeft, pxPerBeat, bpm)
        const newLength = Math.max(0.01, clip.start + clip.length - newStart)
        onClipTrimStart?.({ clipId, start: newStart, length: newLength })
      }
    } else {
      const snappedRight = snapXToDivision(currentRight, divisionPx)
      const clip = clips.find(c => c.clipId === clipId)
      if (clip) {
        const newLength = Math.max(0.01, xToSeconds(snappedRight, pxPerBeat, bpm) - clip.start)
        onClipTrimEnd?.({ clipId, start: clip.start, length: newLength })
      }
    }

    activeDragRef.current = null
    setActiveDrag(null)
  }, [bpm, clips, divisionPx, onClipMove, onClipTrimEnd, onClipTrimStart, pxPerBeat])

  // ── Start drag (called from lane pointer-down after target detection) ───────

  function startDrag(e: React.PointerEvent<HTMLDivElement>, clipId: string, mode: DragMode) {
    const clip = clips.find(c => c.clipId === clipId)
    if (!clip) return

    const clip0Left  = secondsToX(clip.start, pxPerBeat, bpm)
    const clip0Right = secondsToX(clip.start + clip.length, pxPerBeat, bpm)

    const drag: ActiveDrag = {
      clipId, mode, clip0Left, clip0Right,
      pointerX0:    e.clientX,
      currentLeft:  clip0Left,
      currentRight: clip0Right,
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
      const mode: DragMode = trimEl
        ? (trimEl.dataset.trim === 'start' ? 'trim-start' : 'trim-end')
        : 'move'
      startDrag(e, clipId, mode)
      return
    }

    // Empty lane → set cursor at snapped position.
    const rect = laneRef.current!.getBoundingClientRect()
    const x = Math.max(0, e.clientX - rect.left)
    onSetCursor?.(xToSeconds(snapXToDivision(x, divisionPx), pxPerBeat, bpm))
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
      style={{ height }}
      onPointerDown={handleLanePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
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

      {clips.map(clip => {
        const isDragging = activeDrag?.clipId === clip.clipId
        return (
          <ClipSlot
            key={clip.clipId}
            clip={clip}
            pxPerBeat={pxPerBeat}
            bpm={bpm}
            isDragging={isDragging}
            dragLeft={isDragging  ? activeDrag!.currentLeft  : undefined}
            dragRight={isDragging ? activeDrag!.currentRight : undefined}
            release={releaseMap[clip.clipId]}
            disabled={disabled}
            onKeyDelete={clipId => onClipDelete?.(clipId)}
          />
        )
      })}
    </div>
  )
}
