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
  'aria-label'?: string
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

      {/* ── Label ─────────────────────────────────────────────────────────── */}
      {showLabelEl && (
        <span className={styles.label} data-testid="clip-label">
          {label}
        </span>
      )}

      {/* ── Recording badge — CSS shows this only under prefers-reduced-motion */}
      {isRecording && (
        <span className={styles.recordingBadge} aria-hidden="true">●</span>
      )}
    </div>
  )
}
