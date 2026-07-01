import { useEffect, useRef } from 'react'
import styles from './EditCursor.module.css'

export interface EditCursorProps {
  seconds: number
  secondsToX: (s: number) => number
  durationSeconds?: number
  onSeek: (seconds: number) => void
  disabled?: boolean
  'aria-label'?: string
  step?: number
  largeStep?: number
  /**
   * Vertical offset (px) of the caret head from the top of the cursor.
   * Anchors the ▽ to the host's ruler line so it reads as the head of the
   * line, not a triangle floating over the clip. Default 20 matches the tape,
   * where the Playhead's 20px cap sits above; the drilldown passes its own
   * (smaller) ruler height so the caret aligns to its ruler.
   */
  capOffset?: number
}

function formatTime(s: number): string {
  const m    = Math.floor(s / 60)
  const sec  = String(Math.floor(s % 60)).padStart(2, '0')
  const frac = Math.floor((s % 1) * 10)
  return `${m}:${sec}.${frac}`
}

export function EditCursor({
  seconds,
  secondsToX,
  durationSeconds,
  onSeek,
  disabled = false,
  'aria-label': ariaLabel = 'Edit cursor',
  step      = 1.0,
  largeStep = 10.0,
  capOffset = 20,
}: EditCursorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startClientX: number
    startSeconds: number
    pxPerSecond: number
  } | null>(null)

  const max = durationSeconds ?? 3600

  function clamp(v: number): number {
    return Math.max(0, Math.min(v, max))
  }

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const dpr = window.devicePixelRatio || 1
    const x   = Math.round(secondsToX(seconds) * dpr) / dpr
    el.style.transform = `translateX(${x}px)`
  }, [seconds, secondsToX])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight': next = clamp(seconds + step);      break
      case 'ArrowLeft':  next = clamp(seconds - step);      break
      case 'PageUp':     next = clamp(seconds + largeStep); break
      case 'PageDown':   next = clamp(seconds - largeStep); break
      case 'Home':       next = 0;                          break
      case 'End':        next = max;                        break
      default:           return
    }
    e.preventDefault()
    onSeek(next)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pxPerSecond = secondsToX(1) - secondsToX(0)
    if (pxPerSecond === 0) return
    dragRef.current = { startClientX: e.clientX, startSeconds: seconds, pxPerSecond }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !dragRef.current) return
    const { startClientX, startSeconds, pxPerSecond } = dragRef.current
    const deltaSeconds = (e.clientX - startClientX) / pxPerSecond
    onSeek(clamp(startSeconds + deltaSeconds))
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="edit-cursor-root"
      data-disabled={disabled || undefined}
      style={{ ['--ec-cap-offset']: `${capOffset}px` } as React.CSSProperties}
    >
      <div className={styles.line} data-testid="edit-cursor-line" />
      <div
        className={styles.handleWrap}
        data-testid="edit-cursor-handle-wrap"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={seconds}
        aria-valuetext={formatTime(seconds)}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className={styles.handle} data-testid="edit-cursor-handle" aria-hidden="true" />
      </div>
    </div>
  )
}
