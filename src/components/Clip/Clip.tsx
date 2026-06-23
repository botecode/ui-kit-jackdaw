// src/components/Clip/Clip.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Clip.module.css'

// ─── Zoom / draw thresholds (px) ──────────────────────────────────────────────

const SLIVER    = 40
const NARROW    = 80
const WIDE      = 200
const ULTRAWIDE = 400  // switches to thin-stroke line waveform

// ─── Waveform builders ────────────────────────────────────────────────────────

/** Downsample peaks → targetCount bars, taking the max amplitude in each bucket. */
function resamplePeaks(peaks: number[], targetCount: number): number[] {
  if (targetCount >= peaks.length) return peaks
  const result: number[] = []
  for (let i = 0; i < targetCount; i++) {
    const lo = Math.floor(i * peaks.length / targetCount)
    const hi = Math.ceil((i + 1) * peaks.length / targetCount)
    let max = 0
    for (let j = lo; j < Math.min(hi, peaks.length); j++) {
      if (peaks[j] > max) max = peaks[j]
    }
    result.push(max)
  }
  return result
}

/**
 * Filled bipolar bar-chart shape — one rectangular bar per peak, symmetric around y=50.
 * Viewbox is always 0 0 1000 100.
 */
function buildFillPath(bars: number[]): string {
  if (bars.length === 0) return 'M0,50L1000,50'
  const step   = 1000 / bars.length
  const maxAmp = 38

  const pts: string[] = ['M0,50']
  for (let i = 0; i < bars.length; i++) {
    const x0 = (i * step).toFixed(1)
    const x1 = ((i + 1) * step).toFixed(1)
    const y  = (50 - bars[i] * maxAmp).toFixed(1)
    pts.push(`L${x0},${y}L${x1},${y}`)
  }
  pts.push('L1000,50')
  for (let i = bars.length - 1; i >= 0; i--) {
    const x0 = (i * step).toFixed(1)
    const x1 = ((i + 1) * step).toFixed(1)
    const y  = (50 + bars[i] * maxAmp).toFixed(1)
    pts.push(`L${x1},${y}L${x0},${y}`)
  }
  return pts.join('') + 'Z'
}

/**
 * Smooth outline path — traces the top envelope left→right then bottom right→left.
 * Rendered as a thin stroke (fill: none), giving the precise-editing line-waveform
 * look that Reaper uses at high zoom.
 */
function buildStrokePath(bars: number[]): string {
  if (bars.length === 0) return 'M0,50L1000,50'
  const step   = 1000 / bars.length
  const maxAmp = 38

  const top = bars.map((v, i) => `${(i * step).toFixed(1)},${(50 - v * maxAmp).toFixed(1)}`)
  const bot = [...bars].reverse().map((v, i) => {
    const idx = bars.length - 1 - i
    return `${(idx * step).toFixed(1)},${(50 + v * maxAmp).toFixed(1)}`
  })
  return `M${[...top, ...bot].join('L')}Z`
}

/**
 * Entry point: compute the right LOD (bar count) for the current pixel width,
 * pick fill vs line draw mode, and return the SVG path string + mode.
 */
function computeWaveform(
  peaks: number[],
  pixelWidth: number,
): { d: string; mode: 'fill' | 'line' } {
  if (peaks.length === 0) return { d: 'M0,50L1000,50', mode: 'fill' }

  // Target bar density per zoom band. Don't upsample past source data.
  const targetBars = Math.min(
    peaks.length,
    pixelWidth < SLIVER    ? Math.max(1,  Math.floor(pixelWidth / 5))    // coarse silhouette
    : pixelWidth < NARROW  ? Math.max(6,  Math.floor(pixelWidth / 3))    // chunky bars
    : pixelWidth < WIDE    ? Math.max(20, Math.floor(pixelWidth))         // 1 bar / px
    : pixelWidth < ULTRAWIDE ? Math.floor(pixelWidth * 2)                 // 2 bars / px — fine
    :                          Math.floor(pixelWidth * 3),                // 3 bars / px — finest
  )

  const bars = resamplePeaks(peaks, targetBars)
  const mode: 'fill' | 'line' = pixelWidth >= ULTRAWIDE ? 'line' : 'fill'

  return { d: mode === 'line' ? buildStrokePath(bars) : buildFillPath(bars), mode }
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ClipProps {
  /** Amplitude values in [0, 1]; component maps to rendered width with level-of-detail. */
  peaks: number[]
  /** CSS color value for the track — drives the body tint. Default: --accent. */
  color?: string
  /**
   * "ink" (default) — waveform uses a neutral contrast token (dark on light themes, light
   * on dark), matching Reaper's style: colored shell, dark waveform.
   * "track" — waveform uses the track color (original behavior).
   */
  waveformColor?: 'ink' | 'track'
  state?: 'recorded' | 'recording'
  selected?: boolean
  label?: string
  /** Show label strip at top-left. Visible only at wide zoom (≥ 200 px). Default false. */
  showLabel?: boolean
  /** Hard-cut seam on the left edge (vs a natural clip boundary). */
  splitLeft?: boolean
  /** Hard-cut seam on the right edge (vs a natural clip boundary). */
  splitRight?: boolean
  muted?: boolean
  /**
   * Playback rate (time-stretch factor). 1 = natural, >1 = faster/compressed,
   * <1 = slower/expanded. When meaningfully ≠ 1 the clip shows a stretch indicator
   * (diagonal hatch + a mono rate chip). Default 1. The interaction that produces a
   * rate lives in TrackLane (Alt + drag an edge); Clip only renders the state.
   */
  rate?: number
  /** Fade-in duration in seconds, measured from the clip's left edge. 0/undefined = none. */
  fadeIn?: number
  /** Fade-out duration in seconds, ending at the clip's right edge. 0/undefined = none. */
  fadeOut?: number
  /**
   * The clip's on-timeline length in seconds. Fades are painted as a fraction of this
   * (`fadeIn / lengthSec`), so the triangular overlay scales correctly inside the clip's
   * pixel width at any zoom. Without it, fades cannot be placed and render nothing — the
   * Clip stays width-agnostic exactly like the waveform (drawn in a normalized viewBox).
   */
  lengthSec?: number
  /**
   * Paint the draggable fade-handle knobs at the top corners (offset inward by the
   * current fade). The gesture that *sets* a fade lives in TrackLane (drag a top corner);
   * Clip only renders the knobs as the affordance. Default false — a standalone Clip is
   * purely presentational and shows no handles unless asked.
   */
  fadeHandles?: boolean
  'aria-label'?: string
}

/** Below this delta from 1.0 a clip is treated as un-stretched (no indicator). */
const STRETCH_EPSILON = 0.01

/** Below this fraction of the clip a fade is treated as absent (no overlay/handle offset). */
const FADE_EPSILON = 0.0005

/**
 * Resolve fade-in/out seconds into clip-width fractions in [0, 1]. Fades can't overlap:
 * if together they'd exceed the clip, both scale down proportionally so they just meet.
 * Returns zeros when the length is unknown (can't place a fraction).
 */
function fadeFractions(
  fadeIn: number,
  fadeOut: number,
  lengthSec: number | undefined,
): { fIn: number; fOut: number } {
  if (lengthSec == null || lengthSec <= 0) return { fIn: 0, fOut: 0 }
  let fIn  = Math.min(1, Math.max(0, fadeIn  / lengthSec))
  let fOut = Math.min(1, Math.max(0, fadeOut / lengthSec))
  const sum = fIn + fOut
  if (sum > 1) { fIn /= sum; fOut /= sum }
  return { fIn, fOut }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Clip({
  peaks,
  color,
  waveformColor  = 'ink',
  state          = 'recorded',
  selected       = false,
  label,
  showLabel      = false,
  splitLeft      = false,
  splitRight     = false,
  muted          = false,
  rate           = 1,
  fadeIn         = 0,
  fadeOut        = 0,
  lengthSec,
  fadeHandles    = false,
  'aria-label': ariaLabel = 'Clip',
}: ClipProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Stable ID for SVG <clipPath> — avoids id collisions when multiple Clips share a page.
  const [clipPathId] = useState(
    () => `clip-rcp-${Math.random().toString(36).slice(2, 10)}`,
  )

  // ── Width → zoom level + waveform LOD ────────────────────────────────────────
  const [width, setWidth] = useState(200)

  useEffect(() => {
    const el = rootRef.current!
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const zoom =
    width < SLIVER    ? 'sliver'
    : width < NARROW  ? 'narrow'
    : width < WIDE    ? 'mid'
    : 'wide'

  const { d: waveformPath, mode: drawMode } = useMemo(
    () => computeWaveform(peaks, width),
    [peaks, width],
  )

  // ── Recording animation (rAF layer) ──────────────────────────────────────────
  const [recProgress, setRecProgress] = useState(0)
  const rafRef      = useRef(0)
  const progressRef = useRef(0)

  useEffect(() => {
    if (state !== 'recording') {
      cancelAnimationFrame(rafRef.current)
      progressRef.current = 0
      setRecProgress(0)
      return
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (mql.matches) {
      setRecProgress(0.68)
      return
    }

    const SPEED = 0.15
    let last = performance.now()

    function tick(now: number) {
      const dt = (now - last) / 1000
      last = now
      progressRef.current = (progressRef.current + SPEED * dt) % 1
      setRecProgress(progressRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const clipColor   = color ?? 'var(--accent)'
  const isRecording = state === 'recording'
  const showLabelEl = showLabel && !!label && zoom === 'wide'

  // ── Time-stretch (rate) ──────────────────────────────────────────────────────
  // A meaningfully non-unity rate paints the body with a diagonal hatch and a mono
  // rate chip so a stretched clip reads as stretched at rest — not only mid-drag.
  // Chip is hidden at sliver zoom where there's no room (matches the label rule).
  const isStretched   = Math.abs(rate - 1) > STRETCH_EPSILON
  const showRateChip  = isStretched && zoom !== 'sliver'

  // ── Fades ──────────────────────────────────────────────────────────────────
  // Fade-in/out are painted as triangular wedges that erase the clip body back to the
  // arrangement canvas (the waveform tapers to silence) plus a hairline fade curve. The
  // gesture that sets a fade lives in TrackLane; Clip only renders the state + the knob
  // affordance. Geometry is fraction-of-width in the normalized viewBox, so it scales
  // through every zoom exactly like the waveform.
  const { fIn, fOut } = fadeFractions(fadeIn, fadeOut, lengthSec)
  const hasFadeIn  = fIn  > FADE_EPSILON
  const hasFadeOut = fOut > FADE_EPSILON

  const classNames = [
    styles.root,
    isRecording && styles.recording,
    selected    && styles.selected,
    muted       && styles.muted,
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={rootRef}
      className={classNames}
      data-zoom={zoom}
      data-waveform-color={waveformColor}
      data-split-left={splitLeft  || undefined}
      data-split-right={splitRight || undefined}
      data-state={state}
      data-stretched={isStretched || undefined}
      data-fade-in={hasFadeIn  || undefined}
      data-fade-out={hasFadeOut || undefined}
      data-testid="clip-root"
      style={{ '--clip-color': clipColor } as React.CSSProperties}
      aria-label={ariaLabel}
      role="region"
    >
      {/* ── Waveform ──────────────────────────────────────────────────────── */}
      <svg
        className={styles.waveform}
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        data-draw-mode={drawMode}
        data-testid="clip-waveform"
      >
        {isRecording && (
          <defs>
            <clipPath id={clipPathId}>
              <rect x="0" y="0" width={recProgress * 1000} height="100" />
            </clipPath>
          </defs>
        )}

        <path
          className={styles.waveformPath}
          d={waveformPath}
          clipPath={isRecording ? `url(#${clipPathId})` : undefined}
        />

        {/* Capture head — CSS hides this under prefers-reduced-motion */}
        {isRecording && (
          <line
            className={styles.captureHead}
            x1={recProgress * 1000}
            x2={recProgress * 1000}
            y1="0"
            y2="100"
          />
        )}
      </svg>

      {/* ── Stretch hatch — faint diagonal weave over the body when stretched ── */}
      {isStretched && (
        <span className={styles.stretchHatch} aria-hidden="true" />
      )}

      {/* ── Fade overlay — triangular wedges + hairline fade curves ──────────── */}
      {(hasFadeIn || hasFadeOut) && (
        <svg
          className={styles.fadeOverlay}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          data-testid="clip-fade"
        >
          {hasFadeIn && (
            <>
              <polygon
                className={styles.fadeScrim}
                points={`0,0 ${(fIn * 1000).toFixed(1)},0 0,100`}
              />
              <line
                className={styles.fadeCurve}
                x1="0" y1="100" x2={(fIn * 1000).toFixed(1)} y2="0"
              />
            </>
          )}
          {hasFadeOut && (
            <>
              <polygon
                className={styles.fadeScrim}
                points={`${((1 - fOut) * 1000).toFixed(1)},0 1000,0 1000,100`}
              />
              <line
                className={styles.fadeCurve}
                x1={((1 - fOut) * 1000).toFixed(1)} y1="0" x2="1000" y2="100"
              />
            </>
          )}
        </svg>
      )}

      {/* ── Fade-handle knobs — top-corner affordance (drag lives in TrackLane) ─ */}
      {fadeHandles && (
        <>
          <span
            className={styles.fadeKnob}
            data-fade-knob="in"
            style={{ left: `${fIn * 100}%` }}
            aria-hidden="true"
          />
          <span
            className={styles.fadeKnob}
            data-fade-knob="out"
            style={{ left: `${(1 - fOut) * 100}%` }}
            aria-hidden="true"
          />
        </>
      )}

      {/* ── Label ─────────────────────────────────────────────────────────── */}
      {showLabelEl && (
        <span className={styles.label} data-testid="clip-label">
          {label}
        </span>
      )}

      {/* ── Rate chip (time-stretch readout) ──────────────────────────────── */}
      {showRateChip && (
        <span className={styles.rateChip} data-testid="clip-rate" aria-hidden="true">
          {rate.toFixed(2)}×
        </span>
      )}

      {/* ── Recording badge — CSS shows this only under prefers-reduced-motion */}
      {isRecording && (
        <span className={styles.recordingBadge} aria-hidden="true">●</span>
      )}
    </div>
  )
}
