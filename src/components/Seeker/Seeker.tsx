// src/components/Seeker/Seeker.tsx
import { useRef } from 'react'
import styles from './Seeker.module.css'

// ─── Time formatting ──────────────────────────────────────────────────────────

const EM_DASH_TIME = '–:––'

/**
 * seconds → m:ss. Returns the em-dash placeholder when the value isn't known
 * (undefined / NaN / Infinity) — the "no-duration" readout the host shows while
 * the master is still rendering. Negatives clamp to 0.
 */
export function formatClock(seconds: number | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return EM_DASH_TIME
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── Defaults ───────────────────────────────────────────────────────────────────

const STEP_ARROW = 5
const STEP_PAGE = 15

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface SeekerProps {
  /** Accessible name for the slider — e.g. "Seek — Golden Hour". */
  label: string
  /** Elapsed playback position, seconds. The host drives this at transport rate. */
  positionSeconds: number
  /**
   * Total length, seconds. **Absent / 0 / non-finite → no-duration:** the bar
   * goes indeterminate (a slow incandescent sweep), times read em-dash, and the
   * track is not scrubbable. The host omits it while the master is still rendering.
   */
  durationSeconds?: number
  /** Transport state — lights the played portion with a rolling bloom + pins the thumb. */
  isPlaying?: boolean
  /**
   * Commit a seek to an absolute position in seconds (already clamped to
   * [0, duration]). **Absent → the track is display-only** (shows position, not
   * scrubbable). The host owns the actual transport (golden rule #1: audio is native).
   */
  onSeek?: (seconds: number) => void
  /** Hard-disable — flat dim groove, no sweep, not scrubbable. */
  disabled?: boolean
  /** Show the m:ss readout below the groove. Default true. */
  showTimes?: boolean
  /** Trailing time: countdown `remaining` (default) or the `total` duration. */
  trailingTime?: 'remaining' | 'total'
  /** Arrow-key nudge, seconds. Default 5. */
  stepSeconds?: number
  /** Page-key jump, seconds. Default 15. */
  pageSeconds?: number
  size?: 'sm' | 'md'
  /** Prefix for the internal `data-testid`s so a host can compose under its namespace. */
  idPrefix?: string
  className?: string
}

// ─── Component ─────────────────────────────────────────────────────────────────
//
// Why this isn't a webpage: the obvious build is a flat HTML <progress> or a
// Spotify hairline with a draggable dot. Instead the seeker is the pressed-in
// groove of the deck — a recessed well sunk into the surface, the played portion
// lit by the one warm accent (not a neutral grey "progress" bar), a thumb that
// only surfaces when you can touch it (hover / focus / rolling) and otherwise
// stays flush in the groove. When the master isn't ready yet it doesn't show a
// fake 0% bar — it goes indeterminate with a slow incandescent sweep, the
// honest "still bouncing" state. It carries NO audio: it renders the host's
// reported position and emits onSeek intent. Token-only, so it reskins through
// every theme (paper → Ink) by swapping variables.
//
// Decisions (headless, resolved against KIT-LEAD.md):
//  • ONE accent for the played portion (not the semantic green): the seeker is a
//    position display, not a play≠record control — a single warm identity reads
//    as "how far in", and matches the host's now-playing accent spine.
//  • role="slider" with full arrow / Page / Home / End keyboard — the seeker is a
//    real control, keyboard-accessible per the card; it is NOT an action button,
//    so no relabel / aria-pressed (KIT-LEAD §5).
//  • No onSeek → aria-disabled + tabindex -1 (display-only): a tabbable control
//    that does nothing is a dead a11y trap. The host opts into scrubbing by
//    wiring onSeek.
//  • no-duration is its own state (data-state="no-duration"), distinct from
//    disabled: rendering = sweep; disabled = flat dim. The sweep is decorative →
//    snaps under reduced-motion; the fill bloom is state-carrying → stays.

export function Seeker({
  label,
  positionSeconds,
  durationSeconds,
  isPlaying = false,
  onSeek,
  disabled = false,
  showTimes = true,
  trailingTime = 'remaining',
  stepSeconds = STEP_ARROW,
  pageSeconds = STEP_PAGE,
  size = 'md',
  idPrefix = 'seeker',
  className,
}: SeekerProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const hasDuration = durationSeconds != null && Number.isFinite(durationSeconds) && durationSeconds > 0
  const duration = hasDuration ? (durationSeconds as number) : 0
  const position = hasDuration ? Math.min(duration, Math.max(0, positionSeconds)) : 0
  const progress = hasDuration ? position / duration : 0
  const remaining = duration - position

  const seekable = hasDuration && !disabled && onSeek != null
  const state = hasDuration ? 'ready' : 'no-duration'

  // ── Seeking ────────────────────────────────────────────────────────────────

  function commitSeek(seconds: number) {
    if (!seekable) return
    onSeek?.(Math.min(duration, Math.max(0, seconds)))
  }

  /** clientX → seconds within the track. Null if the track has no width. */
  function timeAtClientX(clientX: number): number | null {
    const el = trackRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return null
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return frac * duration
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!seekable || e.button !== 0) return
    const t = timeAtClientX(e.clientX)
    if (t === null) return
    e.preventDefault()
    trackRef.current?.focus()
    trackRef.current?.setPointerCapture(e.pointerId)
    commitSeek(t)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!seekable || !trackRef.current?.hasPointerCapture(e.pointerId)) return
    const t = timeAtClientX(e.clientX)
    if (t === null) return
    commitSeek(t)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!seekable) return
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        commitSeek(position - stepSeconds)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        commitSeek(position + stepSeconds)
        break
      case 'PageDown':
        e.preventDefault()
        commitSeek(position - pageSeconds)
        break
      case 'PageUp':
        e.preventDefault()
        commitSeek(position + pageSeconds)
        break
      case 'Home':
        e.preventDefault()
        commitSeek(0)
        break
      case 'End':
        e.preventDefault()
        commitSeek(duration)
        break
    }
  }

  // ── Derived display ──────────────────────────────────────────────────────────

  const pct = `${(progress * 100).toFixed(2)}%`
  const elapsedText = hasDuration ? formatClock(position) : EM_DASH_TIME
  const trailingText = hasDuration
    ? trailingTime === 'total'
      ? formatClock(duration)
      : `-${formatClock(remaining)}`
    : EM_DASH_TIME
  const valueText = hasDuration ? `${formatClock(position)} of ${formatClock(duration)}` : 'Not ready'

  // Thumb is real only on a scrubbable track; on a display-only track it would
  // imply a control that isn't there.
  const showThumb = hasDuration && !disabled

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root} data-size={size}>
      <div
        ref={trackRef}
        className={styles.track}
        data-testid={`${idPrefix}-track`}
        data-size={size}
        data-state={state}
        data-playing={(isPlaying && !disabled) || undefined}
        data-disabled={disabled || undefined}
        data-seekable={seekable || undefined}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={hasDuration ? Math.round(duration) : 0}
        aria-valuenow={hasDuration ? Math.round(position) : 0}
        aria-valuetext={valueText}
        aria-disabled={seekable ? undefined : true}
        tabIndex={seekable ? 0 : -1}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div className={styles.fill} style={{ width: pct }} data-testid={`${idPrefix}-fill`} />
        {showThumb && <div className={styles.thumb} style={{ left: pct }} aria-hidden="true" />}
      </div>

      {showTimes && (
        <div className={styles.times} aria-hidden="true">
          <span className={styles.elapsed} data-testid={`${idPrefix}-elapsed`}>{elapsedText}</span>
          <span className={styles.trailing} data-testid={`${idPrefix}-remaining`}>{trailingText}</span>
        </div>
      )}
    </div>
  )
}
