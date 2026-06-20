// src/components/Playhead/Playhead.tsx
import { useEffect, useRef } from 'react'
import styles from './Playhead.module.css'

export interface PlayheadProps {
  /**
   * Park/seek position in seconds. Changes on seek-while-stopped, on stop, on locate.
   * Triggers a park write via useEffect. Memoize secondsToX (useCallback) or any
   * secondsToX change will re-trigger the park effect on every parent render.
   */
  seconds: number
  /**
   * Imperative read for the rAF loop during playback. Called on every animation frame.
   * Must derive from the same authoritative source as `seconds`.
   * Typically: `useCallback(() => engineRef.current.frame.seconds, [])`
   */
  getSeconds: () => number
  /** When true: rAF loop sweeps the line. When false: line is parked at `seconds`. */
  playing?: boolean
  /** When true: line and handle take the --led-red-core / --led-red recording tint. */
  recording?: boolean
  /**
   * Seconds → pixel offset from the timeline container's left edge.
   * Absorbs zoom, scroll, and any viewport offset.
   * Memoize with useCallback to avoid spurious park re-fires.
   */
  secondsToX: (s: number) => number
  /**
   * Reserved — not wired until the split-cursor interaction decision lands.
   * When provided: handle becomes pointer-events:auto, cursor:grab.
   * When absent: handle is pointer-events:none (no dead affordance).
   *
   * NOTE: wiring onScrub also requires revisiting the aria model. The root must
   * exit aria-hidden and the handle must adopt role="slider" with aria-valuemin/
   * max/now in seconds, arrow-key nudge → onScrub, :focus-visible ring.
   */
  onScrub?: (seconds: number) => void
}

export function Playhead({
  seconds,
  getSeconds,
  playing = false,
  recording = false,
  secondsToX,
  onScrub,
}: PlayheadProps) {
  const rootRef        = useRef<HTMLDivElement>(null)
  const secondsToXRef  = useRef(secondsToX)
  const getSecondsRef  = useRef(getSeconds)

  // Keep refs current without restarting effects
  useEffect(() => { secondsToXRef.current = secondsToX })
  useEffect(() => { getSecondsRef.current = getSeconds })

  // Park effect: runs when stopped or when position/projection changes while stopped
  useEffect(() => {
    const el = rootRef.current
    if (!el || playing) return
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(secondsToXRef.current(seconds) * dpr) / dpr
    el.style.transform = `translateX(${x}px)`
  }, [playing, seconds, secondsToX])

  // rAF loop: runs while playing; getSeconds is called on every tick
  useEffect(() => {
    const el = rootRef.current
    if (!el || !playing) return
    let raf: number
    function tick() {
      const dpr = window.devicePixelRatio || 1
      const raw = secondsToXRef.current(getSecondsRef.current())
      const x   = Math.round(raw * dpr) / dpr
      el!.style.transform = `translateX(${x}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="playhead-root"
      aria-hidden="true"
      data-playing={playing || undefined}
      data-recording={recording || undefined}
      data-interactive={onScrub ? true : undefined}
    >
      <div className={styles.line} data-testid="playhead-line" />
      <div className={styles.handle} data-testid="playhead-handle" />
    </div>
  )
}
