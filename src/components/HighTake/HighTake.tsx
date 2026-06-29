// src/components/HighTake/HighTake.tsx
//
// HighTake — a captured take in High mode's takes review.
//
// Why this isn't a webpage: trimming a take is NOT two number inputs. It's two physical
// grips you slide along a waveform you can actually read — the kept audio lit, the discarded
// audio dimmed *in place* (not deleted), with a "+ save" that rides under exactly the part
// you're keeping. The gesture feels like cutting tape, not editing a form field.
//
// Self-contained geometry: the component owns its own width. The waveform is drawn in a
// normalized SVG viewBox (0 0 1000 100); handle/save positions are fractions of the take
// (seconds / durationSeconds). Drag maps pointer X → seconds via the waveform's own bounding
// rect (same approach as TimeSelection), so it drops in anywhere with no coordinate plumbing.

import { useId, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Button } from '../Button'
import styles from './HighTake.module.css'

// ─── Constants ─────────────────────────────────────────────────────────────

/** Smallest kept span, in seconds — handles never cross or collapse past this. */
const MIN_KEEP = 0.05
/** Arrow-key nudge (seconds); Shift uses the coarse step. */
const NUDGE_FINE   = 0.1
const NUDGE_COARSE = 1.0
/** Fixed bar density for the resampled waveform — a review card, not a zoomable lane. */
const BAR_COUNT = 120

// ─── Waveform builder ────────────────────────────────────────────────────────

/** Downsample peaks → targetCount bars, taking the max amplitude in each bucket. */
function resamplePeaks(peaks: number[], targetCount: number): number[] {
  if (peaks.length === 0) return []
  if (targetCount >= peaks.length) return peaks
  const out: number[] = []
  for (let i = 0; i < targetCount; i++) {
    const lo = Math.floor((i * peaks.length) / targetCount)
    const hi = Math.ceil(((i + 1) * peaks.length) / targetCount)
    let max = 0
    for (let j = lo; j < Math.min(hi, peaks.length); j++) {
      if (peaks[j] > max) max = peaks[j]
    }
    out.push(max)
  }
  return out
}

/** Filled bipolar bar shape symmetric around y=50 in the 0 0 1000 100 viewBox. */
function buildWavePath(bars: number[]): string {
  if (bars.length === 0) return 'M0,50L1000,50'
  const step = 1000 / bars.length
  const maxAmp = 40
  const pts: string[] = ['M0,50']
  for (let i = 0; i < bars.length; i++) {
    const x0 = (i * step).toFixed(1)
    const x1 = ((i + 1) * step).toFixed(1)
    const y = (50 - bars[i] * maxAmp).toFixed(1)
    pts.push(`L${x0},${y}L${x1},${y}`)
  }
  pts.push('L1000,50')
  for (let i = bars.length - 1; i >= 0; i--) {
    const x0 = (i * step).toFixed(1)
    const x1 = ((i + 1) * step).toFixed(1)
    const y = (50 + bars[i] * maxAmp).toFixed(1)
    pts.push(`L${x1},${y}L${x0},${y}`)
  }
  return pts.join('') + 'Z'
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface HighTakeProps {
  /** Amplitude values in [0, 1]; resampled to a fixed bar density. */
  peaks: number[]
  /** Full take length in seconds — the slider domain. */
  durationSeconds: number
  /** Kept-range start, seconds (controlled). */
  trimStart: number
  /** Kept-range end, seconds (controlled). */
  trimEnd: number
  /** Reported on every drag / keyboard tick: the new kept range. Reconcile to props. */
  onTrim: (start: number, end: number) => void
  /** The host opens the name modal (Dialog + TextField — out of scope here). */
  onSave: () => void
  /** Take name shown on the strip. */
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  'aria-label'?: string
}

// ─── Component ─────────────────────────────────────────────────────────────

type Side = 'start' | 'end'

function fmt(s: number): string {
  return `${s.toFixed(2)}s`
}

function clampFrac(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function HighTake({
  peaks,
  durationSeconds,
  trimStart,
  trimEnd,
  onTrim,
  onSave,
  label,
  disabled = false,
  size = 'md',
  'aria-label': ariaLabel = label ? `${label} trim` : 'Take trim',
}: HighTakeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<Side | null>(null)
  const clipId = useId().replace(/:/g, '')

  const isEmpty = peaks.length === 0
  const isTrimmed = trimStart > 0 || trimEnd < durationSeconds

  // Normalized waveform path (independent of pixel width).
  const bars = resamplePeaks(peaks, BAR_COUNT)
  const wavePath = buildWavePath(bars)

  // Fractions of the take → percentage positions.
  const dur = durationSeconds > 0 ? durationSeconds : 1
  const startFrac = clampFrac(trimStart / dur)
  const endFrac = clampFrac(trimEnd / dur)
  const midFrac = (startFrac + endFrac) / 2

  // ── Coord helper ────────────────────────────────────────────────────────
  function clientXToSeconds(clientX: number): number {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const frac = rect.width > 0 ? (clientX - rect.left) / rect.width : 0
    return clampFrac(frac) * durationSeconds
  }

  function clampSec(s: number): number {
    return Math.max(0, Math.min(s, durationSeconds))
  }

  // Apply a candidate value for one side, enforcing [0,dur] and the no-cross min keep.
  function applyTrim(side: Side, value: number) {
    if (side === 'start') {
      const next = Math.min(clampSec(value), trimEnd - MIN_KEEP)
      onTrim(Math.max(0, next), trimEnd)
    } else {
      const next = Math.max(clampSec(value), trimStart + MIN_KEEP)
      onTrim(trimStart, Math.min(next, durationSeconds))
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent, side: Side) {
    if (disabled) return
    e.preventDefault()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    setDragging(side)
  }

  function handlePointerMove(e: React.PointerEvent, side: Side) {
    if (disabled || dragging !== side) return
    applyTrim(side, clientXToSeconds(e.clientX))
  }

  function endDrag() {
    setDragging(null)
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent, side: Side) {
    if (disabled) return
    const step = e.shiftKey ? NUDGE_COARSE : NUDGE_FINE
    const current = side === 'start' ? trimStart : trimEnd
    let next: number | null = null

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - step
        break
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + step
        break
      case 'Home':
        next = side === 'start' ? 0 : trimStart + MIN_KEEP
        break
      case 'End':
        next = side === 'start' ? trimEnd - MIN_KEEP : durationSeconds
        break
      default:
        return
    }
    e.preventDefault()
    applyTrim(side, next)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={styles.root}
      data-testid="high-take-root"
      data-size={size}
      data-disabled={disabled || undefined}
      data-trimmed={isTrimmed || undefined}
      data-empty={isEmpty || undefined}
    >
      {label && (
        <div className={styles.label} data-testid="high-take-label">
          {label}
        </div>
      )}

      {/* ── Waveform track ──────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className={styles.waveform}
        data-testid="high-take-waveform"
      >
        {/* Trimmed-off ends — dimmed scrims left of start and right of end. */}
        <div
          className={styles.trimScrim}
          data-side="start"
          style={{ width: `${startFrac * 100}%` }}
          aria-hidden="true"
        />
        <div
          className={styles.trimScrim}
          data-side="end"
          style={{ left: `${endFrac * 100}%`, right: 0 }}
          aria-hidden="true"
        />

        {/* Kept-span tint band behind the lit waveform. */}
        <div
          className={styles.kept}
          data-testid="high-take-kept"
          style={{ left: `${startFrac * 100}%`, width: `${(endFrac - startFrac) * 100}%` }}
          aria-hidden="true"
        />

        {/* Waveform: dim base for the whole take + accent copy clipped to the kept span. */}
        <svg
          className={styles.wave}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={startFrac * 1000}
                y="0"
                width={Math.max(0, (endFrac - startFrac) * 1000)}
                height="100"
              />
            </clipPath>
          </defs>
          <path
            className={styles.waveBase}
            data-testid="high-take-wave-base"
            d={wavePath}
          />
          <path className={styles.waveKept} d={wavePath} clipPath={`url(#${clipId})`} />
        </svg>

        {/* ── Boundary handles ──────────────────────────────────────────── */}
        <div
          role="group"
          aria-label={ariaLabel}
          aria-disabled={disabled || undefined}
          className={styles.handleGroup}
        >
          <div
            className={styles.handle}
            data-testid="high-take-handle-start"
            data-side="start"
            data-dragging={dragging === 'start' || undefined}
            style={{ left: `${startFrac * 100}%` }}
            role="slider"
            aria-label="Trim start"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={durationSeconds}
            aria-valuenow={trimStart}
            aria-valuetext={fmt(trimStart)}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={e => handlePointerDown(e, 'start')}
            onPointerMove={e => handlePointerMove(e, 'start')}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={e => handleKeyDown(e, 'start')}
          >
            <span className={styles.grip} aria-hidden="true" />
          </div>

          <div
            className={styles.handle}
            data-testid="high-take-handle-end"
            data-side="end"
            data-dragging={dragging === 'end' || undefined}
            style={{ left: `${endFrac * 100}%` }}
            role="slider"
            aria-label="Trim end"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={durationSeconds}
            aria-valuenow={trimEnd}
            aria-valuetext={fmt(trimEnd)}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={e => handlePointerDown(e, 'end')}
            onPointerMove={e => handlePointerMove(e, 'end')}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={e => handleKeyDown(e, 'end')}
          >
            <span className={styles.grip} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ── + save — centred under the kept span ────────────────────────── */}
      <div className={styles.saveRow}>
        <div
          className={styles.saveAnchor}
          style={{ left: `${midFrac * 100}%` }}
        >
          <Button
            variant="primary"
            size={size}
            icon={<Plus />}
            onClick={onSave}
            disabled={disabled}
          >
            save
          </Button>
        </div>
      </div>
    </div>
  )
}
