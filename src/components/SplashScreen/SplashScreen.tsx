// src/components/SplashScreen/SplashScreen.tsx
import { useEffect, useRef } from 'react'
import { BrandMark } from '../BrandMark'
import styles from './SplashScreen.module.css'

export interface SplashScreenProps {
  /** 0–1. Omit for indeterminate (calm pulse). */
  progress?: number
  /** Current boot step label, e.g. "Scanning plugins…" */
  status?: string
  /** Build/version tag shown in the corner, e.g. "1.0.0-beta.4" */
  version?: string
  /** Called once when progress reaches 1. Consumer handles fade-out. */
  onReady?: () => void
}

const RING_SIZE       = 200
const RING_RADIUS     = 88
const CIRCUMFERENCE   = 2 * Math.PI * RING_RADIUS

export function SplashScreen({
  progress,
  status,
  version,
  onReady,
}: SplashScreenProps) {
  const hasProgress = progress !== undefined
  const clamped     = hasProgress ? Math.max(0, Math.min(1, progress)) : 0
  const isDone      = hasProgress && clamped >= 1

  // Stable ref so the effect doesn't re-fire when onReady identity changes
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    if (isDone) onReadyRef.current?.()
  }, [isDone])

  const dashOffset = hasProgress
    ? CIRCUMFERENCE * (1 - clamped)
    : CIRCUMFERENCE            // empty ring in indeterminate mode

  return (
    <div
      className={styles.root}
      data-ready={isDone || undefined}
      data-indeterminate={!hasProgress || undefined}
      aria-busy={isDone ? 'false' : 'true'}
      aria-label="Loading Jackdaw"
      style={
        hasProgress
          ? ({ '--_progress': String(clamped) } as React.CSSProperties)
          : undefined
      }
    >
      <div className={styles.center}>
        {/* ── Brand + progress ring ─────────────────────────────────────── */}
        <div className={styles.brandRing}>
          <svg
            className={styles.ring}
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden="true"
          >
            <circle
              className={styles.ringTrack}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
            />
            <circle
              className={styles.ringFill}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>

          <BrandMark
            variant="icon"
            size={120}
            className={styles.brand}
          />
        </div>

        {/* ── Wordmark ──────────────────────────────────────────────────── */}
        <p className={styles.wordmark} aria-hidden="true">JACKDAW</p>

        {/* ── Status ────────────────────────────────────────────────────── */}
        <div role="status" aria-live="polite" className={styles.statusWrap}>
          {status && (
            <p className={styles.status} data-testid="status-text">{status}</p>
          )}
        </div>
      </div>

      {/* ── Version tag ───────────────────────────────────────────────── */}
      {version && (
        <span className={styles.version} data-testid="version">{version}</span>
      )}
    </div>
  )
}
