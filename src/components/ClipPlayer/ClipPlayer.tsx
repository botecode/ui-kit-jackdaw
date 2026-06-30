// src/components/ClipPlayer/ClipPlayer.tsx
import { useMemo, useRef, useState } from 'react'
import { Play, Pause } from '@phosphor-icons/react'
import styles from './ClipPlayer.module.css'

// ─── Waveform builders ────────────────────────────────────────────────────────
// Mirrors Clip / DemoPlayer's proven peaks→SVG bar technique (viewBox 0 0 1000 100,
// bipolar bar chart). Kept private here rather than refactoring the shared Clip —
// the played-fill is the SAME path drawn a second time inside a progress clipPath,
// so played / unplayed bars are pixel-identical and differ only in colour.

/** Downsample peaks → targetCount bars, taking the max amplitude per bucket. */
function resamplePeaks(peaks: number[], targetCount: number): number[] {
  if (targetCount >= peaks.length) return peaks
  const result: number[] = []
  for (let i = 0; i < targetCount; i++) {
    const lo = Math.floor((i * peaks.length) / targetCount)
    const hi = Math.ceil(((i + 1) * peaks.length) / targetCount)
    let max = 0
    for (let j = lo; j < Math.min(hi, peaks.length); j++) {
      if (peaks[j] > max) max = peaks[j]
    }
    result.push(max)
  }
  return result
}

/** Filled bipolar bar-chart path, symmetric around y=50. Flat midline when empty. */
function buildFillPath(bars: number[]): string {
  if (bars.length === 0) return 'M0,50L1000,50'
  const step = 1000 / bars.length
  const maxAmp = 38

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

// ─── Time formatting ──────────────────────────────────────────────────────────

const EM_DASH_TIME = '–:––'

/** seconds → m:ss; em-dash placeholder when the value isn't known yet. */
function formatTime(seconds: number | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return EM_DASH_TIME
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── Seek step sizes (seconds) ────────────────────────────────────────────────

const STEP_ARROW = 5
const STEP_PAGE = 15

// Resolution the source peaks are drawn at (don't upsample past the data).
const MAX_BARS = 200

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ClipPlayerProps {
  /** Normalized waveform amplitudes in [0, 1] — the ~200 peaks a clip carries. */
  peaks: number[]
  /** Elapsed position, seconds. The host drives this at transport rate. */
  positionSeconds: number
  /**
   * Clip length, seconds. **Absent / 0 / non-finite → no-duration:** the times
   * read em-dash and the waveform isn't scrubbable (the clip is still rendering).
   */
  durationSeconds?: number
  /** Transport state — relabels the control + lights the played portion. */
  isPlaying?: boolean
  /** Accessible name — e.g. the clip / idea name. Default "Clip". */
  label?: string
  /** Hard-disable — flat dim waveform, no transport, not scrubbable. */
  disabled?: boolean
  size?: 'sm' | 'md'
  /**
   * Toggle play ⇄ pause (the real intent — audio is native, golden rule #1).
   * **Absent → the play control is dead** and renders disabled (no dead intent).
   */
  onPlayPause?: () => void
  /**
   * Commit a seek to an absolute position in seconds (already clamped to
   * [0, duration]). **Absent → the waveform is display-only** (shows position,
   * not scrubbable). The host plays from the seeked point.
   */
  onSeek?: (seconds: number) => void
  /** Prefix for the internal `data-testid`s so a host can compose under its namespace. */
  idPrefix?: string
}

// ─── Component ─────────────────────────────────────────────────────────────────
//
// Why this isn't a webpage: on the Ideas nest a clip is a bare colour swatch; the
// obvious upgrade is a SoundCloud strip — a flat purple progress line over a grey
// waveform. Instead this is a printed-ink instrument that lives on the paper face:
// the waveform is drawn in espresso ink straight onto the sheet, sunk into a
// hairline-pressed groove, and the part you've heard lights up in the ONE hot
// accent with an incandescent lift — so "how far in" reads as a single warm
// identity, not a colour the eye hunts for. The whole waveform IS the scrubber
// (click / drag anywhere to seek), with a real slider's keyboard. It carries NO
// audio — it renders the host's reported position and emits onSeek / onPlayPause
// intent. Token-only, so the same row reskins paper → Ink by swapping variables.
//
// Decisions (headless, resolved against KIT-LEAD.md):
//  • Paper + Ink register (the card), NOT the dark --stage well DemoPlayer uses —
//    this drops onto the Ideas nest's paper sheet, so the waveform is ink on paper
//    in a light recessed groove. DemoPlayer (web, dark stage) is a different home.
//  • Controlled + intent-only — distinct from DemoPlayer (owns <audio>). The card's
//    contract is exactly { peaks, durationSeconds, positionSeconds, isPlaying } +
//    { onPlayPause, onSeek }, so it drops into the Ideas player with zero rework.
//  • NOT composed from <Seeker>: Seeker is a plain groove; the card wants the
//    *waveform itself* scrubbable. The bar technique is shared with Clip/DemoPlayer
//    (copied private helper — same call DemoPlayer made — not a premature refactor).
//  • ONE accent for play state + played fill + playhead (the card: "the one hot
//    accent"), NOT the semantic green: a playback-only clip has no record to
//    disambiguate from, so a single warm identity reads cleaner (matches
//    MasterPlayer / Seeker).
//  • Action button relabels Play⇄Pause with no aria-pressed; the scrubber is a
//    role="slider" with full keyboard (KIT-LEAD §5 — one ARIA model each).
//  • Presence gates interactivity (the Seeker pattern): no onPlayPause → control
//    dead/disabled; no onSeek → display-only (tabindex -1). A tabbable control that
//    does nothing is a dead a11y trap.
//  • no-peaks ≠ broken: a clip whose peaks haven't loaded still plays — draw a flat
//    ink baseline and stay scrubbable when the duration is known.

export function ClipPlayer({
  peaks,
  positionSeconds,
  durationSeconds,
  isPlaying = false,
  label = 'Clip',
  disabled = false,
  size = 'md',
  onPlayPause,
  onSeek,
  idPrefix = 'clipplayer',
}: ClipPlayerProps) {
  const waveRef = useRef<HTMLDivElement>(null)

  // Stable per-instance id for the SVG <clipPath> — avoids collisions when many
  // ClipPlayers share a page (the Ideas nest renders a list of them).
  const [clipId] = useState(() => `clipplayer-played-${Math.random().toString(36).slice(2, 10)}`)

  // Local optimistic scrub position so the playhead tracks the finger 1:1 while
  // dragging, even though the authoritative position is the prop.
  const [scrubbing, setScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)
  const scrubbingRef = useRef(false)

  const hasDuration = durationSeconds != null && Number.isFinite(durationSeconds) && durationSeconds > 0
  const duration = hasDuration ? (durationSeconds as number) : 0
  const hasPeaks = peaks.length > 0

  const playable = !disabled && onPlayPause != null
  const seekable = !disabled && hasDuration && onSeek != null

  const clampedPosition = hasDuration ? Math.min(duration, Math.max(0, positionSeconds)) : 0
  const displayPosition = scrubbing ? scrubTime : clampedPosition
  const progress = hasDuration ? displayPosition / duration : 0

  // ── Waveform path (memoised on peaks) ────────────────────────────────────────
  const waveformPath = useMemo(() => {
    if (!hasPeaks) return 'M0,50L1000,50'
    return buildFillPath(resamplePeaks(peaks, Math.min(peaks.length, MAX_BARS)))
  }, [peaks, hasPeaks])

  // ── Seeking ──────────────────────────────────────────────────────────────────

  function commitSeek(seconds: number) {
    if (!seekable) return
    onSeek?.(Math.min(duration, Math.max(0, seconds)))
  }

  /** clientX → seconds within the waveform. Null if it has no width. */
  function timeAtClientX(clientX: number): number | null {
    const el = waveRef.current
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
    waveRef.current?.focus()
    waveRef.current?.setPointerCapture(e.pointerId)
    scrubbingRef.current = true
    setScrubbing(true)
    setScrubTime(t)
    commitSeek(t)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return
    const t = timeAtClientX(e.clientX)
    if (t === null) return
    setScrubTime(t)
    commitSeek(t)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return
    const t = timeAtClientX(e.clientX) ?? scrubTime
    scrubbingRef.current = false
    setScrubbing(false)
    waveRef.current?.releasePointerCapture(e.pointerId)
    commitSeek(t)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!seekable) return
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        commitSeek(clampedPosition - STEP_ARROW)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        commitSeek(clampedPosition + STEP_ARROW)
        break
      case 'PageDown':
        e.preventDefault()
        commitSeek(clampedPosition - STEP_PAGE)
        break
      case 'PageUp':
        e.preventDefault()
        commitSeek(clampedPosition + STEP_PAGE)
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
  const elapsedText = hasDuration ? formatTime(displayPosition) : EM_DASH_TIME
  const durationText = hasDuration ? formatTime(duration) : EM_DASH_TIME
  const valueText = `${elapsedText} of ${durationText}`
  const state = hasDuration ? 'ready' : 'no-duration'
  const showPlayhead = hasDuration && progress > 0 && progress < 1

  return (
    <div
      className={styles.root}
      data-size={size}
      data-playing={(isPlaying && !disabled) || undefined}
      data-scrubbing={scrubbing || undefined}
      data-disabled={disabled || undefined}
      data-no-peaks={!hasPeaks || undefined}
      data-state={state}
      data-testid={`${idPrefix}-root`}
    >
      {/* ── Play / pause — paper-register control, accent bloom while rolling ── */}
      <button
        type="button"
        className={styles.play}
        data-testid={`${idPrefix}-play`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={!playable}
        onClick={onPlayPause}
      >
        {isPlaying
          ? <Pause weight="fill" aria-hidden="true" />
          : <Play weight="fill" aria-hidden="true" />}
      </button>

      {/* ── Waveform — the scrubber itself ──────────────────────────────────── */}
      <div className={styles.waveArea}>
        <div
          ref={waveRef}
          className={styles.wave}
          data-testid={`${idPrefix}-wave`}
          data-state={state}
          role="slider"
          aria-label={`Seek — ${label}`}
          aria-valuemin={0}
          aria-valuemax={hasDuration ? Math.round(duration) : 0}
          aria-valuenow={hasDuration ? Math.round(displayPosition) : 0}
          aria-valuetext={valueText}
          aria-disabled={seekable ? undefined : true}
          tabIndex={seekable ? 0 : -1}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg
            className={styles.waveform}
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            data-testid={`${idPrefix}-waveform`}
          >
            <defs>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <rect x="0" y="0" width={progress * 1000} height="100" />
              </clipPath>
            </defs>

            {/* Recessed / unplayed ink */}
            <path className={styles.waveBase} d={waveformPath} />

            {/* Lit / played overlay — same path, clipped to progress */}
            <path
              className={styles.wavePlayed}
              d={waveformPath}
              clipPath={`url(#${clipId})`}
              data-testid={`${idPrefix}-played`}
            />

            {/* Playhead at the fill boundary — the one hot accent */}
            {showPlayhead && (
              <line
                className={styles.playhead}
                x1={progress * 1000}
                x2={progress * 1000}
                y1="2"
                y2="98"
                data-testid={`${idPrefix}-playhead`}
              />
            )}
          </svg>
        </div>
      </div>

      {/* ── Time readout — position vs duration ─────────────────────────────── */}
      <span className={styles.time} aria-hidden="true">
        <span className={styles.elapsed} data-testid={`${idPrefix}-elapsed`}>{elapsedText}</span>
        <span className={styles.timeSep}>/</span>
        <span className={styles.duration} data-testid={`${idPrefix}-duration`}>{durationText}</span>
      </span>
    </div>
  )
}
