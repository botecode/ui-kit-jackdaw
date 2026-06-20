import { useRef, useState, useEffect } from 'react'
import {
  secondsToX,
  xToSeconds,
  snapXToGrid,
  formatBarsBeats,
  buildBarMarks,
} from './rulerMath'
import styles from './TimelineRuler.module.css'

export type { BarMark } from './rulerMath'
export { secondsToX, xToSeconds, snapXToGrid, formatBarsBeats } from './rulerMath'

export interface TimelineRulerProps {
  bpm: number
  numerator: number
  denominator: number
  pxPerBeat: number
  durationSeconds: number
  onSeek?: (seconds: number) => void
  snap?: boolean
  size?: 'sm' | 'md'
  showLaneRules?: boolean
}

export function TimelineRuler({
  bpm,
  numerator,
  pxPerBeat,
  durationSeconds,
  onSeek,
  snap = false,
  size = 'md',
  showLaneRules = false,
}: TimelineRulerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [seekSeconds, setSeekSeconds] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Mutable refs — keep handlers stable across re-renders
  const bpmRef       = useRef(bpm)
  const pxPerBeatRef = useRef(pxPerBeat)
  const snapRef      = useRef(snap)
  const onSeekRef    = useRef(onSeek)
  const seekRef      = useRef(0)
  const durationRef  = useRef(durationSeconds)

  useEffect(() => { bpmRef.current = bpm })
  useEffect(() => { pxPerBeatRef.current = pxPerBeat })
  useEffect(() => { snapRef.current = snap })
  useEffect(() => { onSeekRef.current = onSeek })
  useEffect(() => { durationRef.current = durationSeconds })

  function commit(secs: number) {
    const clamped = Math.max(0, Math.min(secs, durationRef.current))
    setSeekSeconds(clamped)
    seekRef.current = clamped
    onSeekRef.current?.(clamped)
  }

  function seekFromClientX(clientX: number) {
    const rect = rootRef.current!.getBoundingClientRect()
    let x = Math.max(0, clientX - rect.left)
    if (snapRef.current) x = snapXToGrid(x, pxPerBeatRef.current)
    commit(xToSeconds(x, pxPerBeatRef.current, bpmRef.current))
  }

  // ── Pointer seek ──────────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
    seekFromClientX(e.clientX)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    seekFromClientX(e.clientX)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  // ── Keyboard seek ─────────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    const beatSeconds = 60 / bpmRef.current
    let next: number | null = null

    switch (e.key) {
      case 'ArrowRight': next = seekRef.current + beatSeconds; break
      case 'ArrowLeft':  next = seekRef.current - beatSeconds; break
      default: return
    }

    e.preventDefault()
    let x = secondsToX(next, pxPerBeatRef.current, bpmRef.current)
    if (snapRef.current) x = snapXToGrid(x, pxPerBeatRef.current)
    commit(xToSeconds(x, pxPerBeatRef.current, bpmRef.current))
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalWidth = secondsToX(durationSeconds, pxPerBeat, bpm)
  const barMarks   = buildBarMarks(durationSeconds, bpm, numerator, pxPerBeat)
  const ariaText   = formatBarsBeats(seekSeconds, bpm, numerator)

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="timeline-ruler"
      data-size={size}
      data-dragging={dragging || undefined}
      data-lane-rules={showLaneRules || undefined}
      role="slider"
      aria-label="Timeline"
      aria-valuemin={0}
      aria-valuemax={durationSeconds}
      aria-valuenow={seekSeconds}
      aria-valuetext={ariaText}
      tabIndex={0}
      style={{
        '--beat-px':   `${pxPerBeat}px`,
        '--bar-beats': String(numerator),
        width:         `${totalWidth}px`,
      } as React.CSSProperties}
      onKeyDown={handleKeyDown}
    >
      {/* ── Ruler strip (seek surface + bar/beat labels) ── */}
      <div
        className={styles.strip}
        data-testid="ruler-strip"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {barMarks.map(({ x, bar }) => (
          <span
            key={bar}
            className={styles.barLabel}
            style={{ left: x } as React.CSSProperties}
          >
            {bar}
          </span>
        ))}
      </div>

      {/* ── Musical grid (repeating-gradient — reflows via CSS var update) ── */}
      <div className={styles.grid} aria-hidden="true" />
    </div>
  )
}
