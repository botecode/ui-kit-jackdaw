import styles from './TimelineGrid.module.css'
import { divisionToPx, type Division } from './gridMath'

export type { Division } from './gridMath'

export interface TimelineGridProps {
  /** Grid resolution — drives subdivision line spacing. */
  division: Division
  /** Pixels per beat — the same value passed to TimelineRuler / Playhead. */
  pxPerBeat: number
  /** BPM — included for contract parity with ruler; does not affect gradient math. */
  bpm: number
  /** Time signature numerator (beats per bar). */
  numerator: number
  /** Time signature denominator (beat note value: 4 = quarter, 8 = eighth, …). */
  denominator: number
}

/**
 * Live beat/bar grid rendered as vertical division lines.
 * Display-only — no interactivity.
 * Sits behind clips in the lane area, aligned with TimelineRuler via the same pxPerBeat.
 * Width and height are controlled by the parent container.
 */
export function TimelineGrid({
  division,
  pxPerBeat,
  numerator,
  denominator,
}: TimelineGridProps) {
  const divPx = divisionToPx(division, pxPerBeat, numerator, denominator)

  return (
    <div
      className={styles.root}
      data-testid="timeline-grid"
      data-division={division}
      aria-hidden="true"
      style={{
        '--beat-px':     `${pxPerBeat}px`,
        '--bar-beats':   String(numerator),
        '--grid-div-px': `${divPx}px`,
      } as React.CSSProperties}
    />
  )
}
