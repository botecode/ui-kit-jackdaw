// src/components/DemoPlayer/DemoPlayer.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { TransportButton } from '../TransportButton'
import styles from './DemoPlayer.module.css'

// ─── Waveform builders ────────────────────────────────────────────────────────
// Mirrors Clip's proven peaks→SVG bar technique (viewBox 0 0 1000 100, bipolar
// bar chart). Kept private here rather than refactoring the shared Clip — the
// played-fill is the SAME path rendered a second time inside a progress clipPath,
// so played/unplayed bars are pixel-identical and differ only in luminance.

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

/** Filled bipolar bar-chart path, symmetric around y=50. */
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
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return EM_DASH_TIME
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── Seek step sizes (seconds) ────────────────────────────────────────────────

const STEP_ARROW = 5
const STEP_PAGE = 15

// ─── Props ─────────────────────────────────────────────────────────────────────

export type DemoPlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface DemoPlayerProps {
  /** The real audio source → an `<audio src>` under the hood. */
  src: string
  /** Waveform amplitudes in [0,1] — same shape as Clip's `peaks`. */
  peaks: number[]
  /** Track name shown in the header. */
  label: string
  /** Per-track color spine + played-fill tint. CSS color. Default `--accent`. */
  color?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  /** Fired when playback starts (the real intent). */
  onPlay?: () => void
  /** Fired when playback pauses. */
  onPause?: () => void
  /** Fired when a seek is committed (keyboard press, click, or drag release). */
  onSeek?: (seconds: number) => void
  /** Fired when playback reaches the end. */
  onEnded?: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────
//
// Why this isn't a webpage: this is the one kit surface that genuinely lives on
// the *web* (the marketing/gallery page), and the temptation is an <audio
// controls> bar or a SoundCloud-style purple progress strip. Instead it's an
// instrument: the waveform sits in a recessed dark `--stage` groove, the played
// portion lights up in the track color (incandescent attack/decay, not a flat
// tween), the play control blooms the green "rolling" LED, and the groove itself
// IS the scrubber — there's no separate chrome track. It reskins through every
// theme on tokens alone. A visitor should feel they're touching the same hardware
// the song was made on, not clicking a media player embedded in a page.

export function DemoPlayer({
  src,
  peaks,
  label,
  color,
  size = 'md',
  disabled = false,
  onPlay,
  onPause,
  onSeek,
  onEnded,
}: DemoPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const wellRef = useRef<HTMLDivElement>(null)

  // Stable per-instance id for the SVG <clipPath> — avoids collisions when many
  // DemoPlayers share a page (the gallery does).
  const [clipId] = useState(() => `demoplayer-played-${Math.random().toString(36).slice(2, 10)}`)

  const [status, setStatus] = useState<DemoPlayerStatus>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [scrubTime, setScrubTime] = useState(0)

  // Refs mirror state for use inside the rAF loop / pointer listeners without
  // re-subscribing on every frame.
  const scrubbingRef = useRef(false)
  const endedRef = useRef(false)

  const isEmpty = !src || peaks.length === 0
  const isPlaying = status === 'playing'
  const interactive = !disabled && !isEmpty && status !== 'error'
  const seekable = interactive && Number.isFinite(duration) && duration > 0

  const displayTime = scrubbing ? scrubTime : currentTime
  const safeDuration = Number.isFinite(duration) ? duration : 0
  const progress = safeDuration > 0 ? Math.min(1, Math.max(0, displayTime / safeDuration)) : 0

  // ── Waveform path (memoised on peaks) ────────────────────────────────────────
  const waveformPath = useMemo(() => {
    if (peaks.length === 0) return 'M0,50L1000,50'
    const bars = resamplePeaks(peaks, Math.min(peaks.length, 600))
    return buildFillPath(bars)
  }, [peaks])

  // ── Reset when the source changes ────────────────────────────────────────────
  useEffect(() => {
    endedRef.current = false
    setCurrentTime(0)
    setDuration(0)
    setStatus('idle')
  }, [src])

  // ── Smooth playhead while rolling (functional motion — rAF, ~60fps) ──────────
  // Under prefers-reduced-motion we skip the rAF and lean on `timeupdate`, which
  // still advances the fill (functional motion stays; only the smoothness drops).
  useEffect(() => {
    if (status !== 'playing') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) return

    let raf = 0
    const tick = () => {
      const el = audioRef.current
      if (el && !scrubbingRef.current) setCurrentTime(el.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [status])

  // ── Audio element event handlers ─────────────────────────────────────────────

  function handleLoadStart() {
    if (src) setStatus(s => (s === 'playing' ? s : 'loading'))
  }
  function handleDurationChange() {
    const el = audioRef.current
    if (el) setDuration(el.duration)
  }
  function handleCanPlay() {
    setStatus(s => (s === 'loading' ? 'idle' : s))
  }
  function handlePlay() {
    endedRef.current = false
    setStatus('playing')
    onPlay?.()
  }
  function handlePause() {
    if (endedRef.current) return // ended already reported the stop
    const el = audioRef.current
    const atStart = !el || el.currentTime <= 0.04
    setStatus(s => (s === 'error' ? s : atStart ? 'idle' : 'paused'))
    onPause?.()
  }
  function handleTimeUpdate() {
    const el = audioRef.current
    if (el && !scrubbingRef.current) setCurrentTime(el.currentTime)
  }
  function handleEnded() {
    endedRef.current = true
    setStatus('idle')
    setCurrentTime(safeDuration)
    onEnded?.()
  }
  function handleError() {
    setStatus('error')
  }

  // ── Transport ────────────────────────────────────────────────────────────────

  function togglePlay() {
    const el = audioRef.current
    if (!el || !interactive) return
    if (el.paused) {
      const p = el.play() as unknown
      if (p && typeof (p as Promise<void>).catch === 'function') {
        ;(p as Promise<void>).catch(() => {})
      }
    } else {
      el.pause()
    }
  }

  // ── Seeking ──────────────────────────────────────────────────────────────────

  /** Move the audio cursor and report the committed seek. */
  function commitSeek(seconds: number) {
    const el = audioRef.current
    if (!el || !seekable) return
    const clamped = Math.min(safeDuration, Math.max(0, seconds))
    el.currentTime = clamped
    setCurrentTime(clamped)
    onSeek?.(clamped)
  }

  function handleSliderKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!seekable) return
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        commitSeek(displayTime - STEP_ARROW)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        commitSeek(displayTime + STEP_ARROW)
        break
      case 'PageDown':
        e.preventDefault()
        commitSeek(displayTime - STEP_PAGE)
        break
      case 'PageUp':
        e.preventDefault()
        commitSeek(displayTime + STEP_PAGE)
        break
      case 'Home':
        e.preventDefault()
        commitSeek(0)
        break
      case 'End':
        e.preventDefault()
        commitSeek(safeDuration)
        break
    }
  }

  /** clientX → seconds within the well. Returns null if the well has no width. */
  function timeAtClientX(clientX: number): number | null {
    const el = wellRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return null
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return frac * safeDuration
  }

  function handleWellPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!seekable || e.button !== 0) return
    const t = timeAtClientX(e.clientX)
    if (t === null) return
    e.preventDefault()
    wellRef.current?.focus()
    wellRef.current?.setPointerCapture(e.pointerId)
    scrubbingRef.current = true
    setScrubbing(true)
    setScrubTime(t)
    // Live audible scrub (1:1, no inertia — the precision-control rule).
    const el = audioRef.current
    if (el) el.currentTime = t
  }

  function handleWellPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return
    const t = timeAtClientX(e.clientX)
    if (t === null) return
    setScrubTime(t)
    const el = audioRef.current
    if (el) el.currentTime = t
  }

  function handleWellPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return
    const t = timeAtClientX(e.clientX) ?? scrubTime
    scrubbingRef.current = false
    setScrubbing(false)
    wellRef.current?.releasePointerCapture(e.pointerId)
    commitSeek(t)
  }

  // ── Derived display ──────────────────────────────────────────────────────────
  const fillColor = color ?? 'var(--accent)'
  const valueText = `${formatTime(displayTime)} of ${formatTime(isEmpty ? NaN : safeDuration)}`

  return (
    <div
      className={styles.root}
      data-size={size}
      data-status={status}
      data-scrubbing={scrubbing || undefined}
      data-disabled={disabled || undefined}
      data-empty={isEmpty || undefined}
      data-testid="demoplayer-root"
      style={{ '--demo-fill': fillColor } as React.CSSProperties}
    >
      {/* The real media node — visually hidden, the source of truth for playback. */}
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
        className={styles.audio}
        data-testid="demoplayer-audio"
        onLoadStart={handleLoadStart}
        onDurationChange={handleDurationChange}
        onLoadedMetadata={handleDurationChange}
        onCanPlay={handleCanPlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* ── Header: color spine · label · time readout ──────────────────────── */}
      <div className={styles.header}>
        <span className={styles.spine} aria-hidden="true" />
        <span className={styles.label} data-testid="demoplayer-label">
          {label}
        </span>
        <span className={styles.time} data-testid="demoplayer-time">
          <span className={styles.timeNow}>{formatTime(isEmpty ? NaN : displayTime)}</span>
          <span className={styles.timeSep} aria-hidden="true">
            /
          </span>
          <span className={styles.timeDur}>{formatTime(isEmpty ? NaN : safeDuration)}</span>
        </span>
      </div>

      {/* ── Controls: play/pause + scrubbing waveform well ──────────────────── */}
      <div className={styles.controls}>
        <TransportButton
          variant="play"
          playing={isPlaying}
          onClick={togglePlay}
          size={size}
          disabled={!interactive}
        />

        <div
          ref={wellRef}
          className={styles.well}
          data-testid="demoplayer-well"
          role="slider"
          aria-label={`Seek — ${label}`}
          aria-valuemin={0}
          aria-valuemax={Math.round(safeDuration)}
          aria-valuenow={Math.round(displayTime)}
          aria-valuetext={valueText}
          aria-disabled={!seekable || undefined}
          tabIndex={seekable ? 0 : -1}
          onKeyDown={handleSliderKeyDown}
          onPointerDown={handleWellPointerDown}
          onPointerMove={handleWellPointerMove}
          onPointerUp={handleWellPointerUp}
          onPointerCancel={handleWellPointerUp}
        >
          <svg
            className={styles.waveform}
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            data-testid="demoplayer-waveform"
          >
            <defs>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <rect x="0" y="0" width={progress * 1000} height="100" />
              </clipPath>
            </defs>

            {/* Recessed / unplayed base */}
            <path className={styles.waveBase} d={waveformPath} />

            {/* Lit / played overlay — same path, clipped to progress */}
            <path
              className={styles.wavePlayed}
              d={waveformPath}
              clipPath={`url(#${clipId})`}
              data-testid="demoplayer-played"
            />

            {/* Playhead at the fill boundary (functional motion) */}
            {progress > 0 && progress < 1 && (
              <line
                className={styles.playhead}
                x1={progress * 1000}
                x2={progress * 1000}
                y1="2"
                y2="98"
                data-testid="demoplayer-playhead"
              />
            )}
          </svg>

          {status === 'error' && (
            <span className={styles.message} data-testid="demoplayer-error" role="status">
              Couldn’t load this demo
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
