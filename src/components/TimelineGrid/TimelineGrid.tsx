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
  /**
   * Line thickness multiplier. 1 = default (bar 1.5px, beat/sub 1px).
   * Values above 1 make lines heavier; useful when the grid is hard to see.
   * @default 1
   */
  lineWeight?: number
  /**
   * Paint faint horizontal lane rules (ledger rows) so both axes are printed.
   * Off by default — existing callers and dark themes are unaffected.
   * @default false
   */
  showLaneRules?: boolean
  /**
   * Height of one lane row in px — the period of the horizontal rule.
   * Match the track lane height so rules align with the rows above them.
   * Only applied when {@link showLaneRules} is on.
   * @default 48
   */
  laneHeight?: number
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
  lineWeight = 1,
  showLaneRules = false,
  laneHeight = 48,
}: TimelineGridProps) {
  const divPx = divisionToPx(division, pxPerBeat, numerator, denominator)

  return (
    <div
      className={styles.root}
      data-testid="timeline-grid"
      data-division={division}
      data-lane-rules={showLaneRules ? '' : undefined}
      aria-hidden="true"
      style={{
        '--beat-px':          `${pxPerBeat}px`,
        '--bar-beats':        String(numerator),
        '--grid-div-px':      `${divPx}px`,
        '--grid-line-weight': String(lineWeight),
        // --lane-px is the horizontal-rule period; only set when lane rules are on
        // so the default DOM carries no lane var and dark themes stay untouched.
        ...(showLaneRules ? { '--lane-px': `${laneHeight}px` } : {}),
      } as React.CSSProperties}
    />
  )
}
