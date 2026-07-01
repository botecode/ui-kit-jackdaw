// src/components/Tuner/Tuner.tsx
//
// Tuner — the chromatic-tuner display for plugin/host UIs.
//
// Why this isn't a webpage: a tuner is an instrument's face — a dark glass
// screen recessed into the panel, a needle that slides a physical cents scale,
// direction arrows that light like LEDs, and real controls (mute, reference
// pitch) mounted below the screen. Fully controlled and presentational: the
// host owns detection and hands us note/cents/confidence; no audio, no timers.
//
// Colour: in-tune lights GREEN (--led-green — the "good" family, per the card),
// off-tune lights AMBER (--led-orange = attention). Never red — red is
// arm/record and a tuner must not read as recording.
//
// ARIA: the gauge is one `role="img"` with a computed label ("Tuner: E2,
// 4 cents flat"). No aria-live — pitch updates arrive ~30fps and a live region
// would spam screen readers. The controls carry their own ARIA models.

import { Toggle } from '../Toggle'
import { NumberField } from '../NumberField'
import { SegmentedControl } from '../SegmentedControl'
import styles from './Tuner.module.css'

export type TunerMode = 'cents' | 'hz'

export interface TunerProps {
  /** Detected note name, e.g. "A", "F#". null/undefined = no pitch. */
  note?: string | null
  /** Octave number for the subscript, e.g. 2 in "E2". */
  octave?: number | null
  /** Cents offset −50..+50 (clamped). Default 0. */
  cents?: number
  /** Host's in-tune verdict (the host owns the threshold). */
  inTune?: boolean
  /** Detection confidence 0..1; below 0.3 (or note == null) → idle. Default 1. */
  confidence?: number
  /** Detected frequency in Hz — the 'hz' mode readout. */
  frequency?: number | null
  /** Tune silently — display-only; the host wires the actual audio mute. */
  mute: boolean
  onMuteChange: (next: boolean) => void
  /** Reference pitch (A4), e.g. 440. */
  referenceHz: number
  onReferenceChange: (hz: number) => void
  /** Readout mode under the note. Default 'cents'. */
  mode?: TunerMode
  /** When provided, the CENT/HZ toggle renders in the control row. */
  onModeChange?: (mode: TunerMode) => void
  size?: 'sm' | 'md'
  'aria-label'?: string
}

// Below this confidence the display goes idle — the host owns real detection;
// the display only needs one documented floor.
const CONFIDENCE_FLOOR = 0.3
const CENTS_RANGE = 50

// Scale ticks every 10 cents; index 5 is the center detent.
const TICKS = Array.from({ length: 11 }, (_, i) => i)

const MODE_OPTIONS = [
  { value: 'cents', label: 'CENT' },
  { value: 'hz', label: 'HZ' },
]

function clampCents(c: number): number {
  return Math.max(-CENTS_RANGE, Math.min(CENTS_RANGE, c))
}

// ▸ / ◂ — bespoke LED triangles pointing at the note (UAD's ▸E◂).
function ArrowGlyph({ direction }: { direction: 'right' | 'left' }) {
  const points = direction === 'right' ? '1,1 9,6 1,11' : '9,1 1,6 9,11'
  return (
    <svg className={styles.arrowGlyph} viewBox="0 0 10 12" aria-hidden="true">
      <polygon points={points} />
    </svg>
  )
}

export function Tuner({
  note,
  octave,
  cents = 0,
  inTune = false,
  confidence = 1,
  frequency,
  mute,
  onMuteChange,
  referenceHz,
  onReferenceChange,
  mode = 'cents',
  onModeChange,
  size = 'md',
  'aria-label': ariaLabel = 'Tuner',
}: TunerProps) {
  const idle = note == null || confidence < CONFIDENCE_FLOOR
  const c = clampCents(cents)
  const rounded = Math.round(c)
  const flat = !idle && !inTune && c < 0
  const sharp = !idle && !inTune && c > 0
  const needlePct = idle ? 50 : ((c + CENTS_RANGE) / (CENTS_RANGE * 2)) * 100

  const noteName = `${note}${octave ?? ''}`
  const centsMagnitude = Math.abs(rounded)
  const centsUnit = centsMagnitude === 1 ? 'cent' : 'cents'
  const gaugeLabel = idle
    ? `${ariaLabel}: no signal`
    : inTune
      ? `${ariaLabel}: ${noteName}, in tune`
      : flat
        ? `${ariaLabel}: ${noteName}, ${centsMagnitude} ${centsUnit} flat`
        : sharp
          ? `${ariaLabel}: ${noteName}, ${centsMagnitude} ${centsUnit} sharp`
          : `${ariaLabel}: ${noteName}, 0 cents`

  // U+2212 minus — the mono readout deserves a real minus, not a hyphen.
  const centsText = rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${centsMagnitude}` : '0'
  const showHz = mode === 'hz'
  const hzText = frequency != null ? frequency.toFixed(1) : null

  return (
    <div
      className={styles.root}
      data-size={size}
      data-idle={idle || undefined}
      data-in-tune={(!idle && inTune) || undefined}
      data-flat={flat || undefined}
      data-sharp={sharp || undefined}
      data-muted={mute || undefined}
    >
      <div className={styles.screen} role="img" aria-label={gaugeLabel}>
        {mute && (
          <span className={styles.muteTag} aria-hidden="true">
            mute
          </span>
        )}

        {/* ▸ note ◂ — arrows light amber toward the correction direction */}
        <div className={styles.noteRow} aria-hidden="true">
          <span className={styles.arrow} data-lit={flat || undefined}>
            <ArrowGlyph direction="right" />
          </span>
          <span className={styles.note}>
            {idle ? '—' : note}
            {!idle && octave != null && <span className={styles.octave}>{octave}</span>}
          </span>
          <span className={styles.arrow} data-lit={sharp || undefined}>
            <ArrowGlyph direction="left" />
          </span>
        </div>

        {/* Cents / Hz readout */}
        <div className={styles.readout} aria-hidden="true">
          {idle ? (
            <span className={styles.readoutValue}>—</span>
          ) : showHz ? (
            <>
              <span className={styles.readoutValue}>{hzText ?? '—'}</span>
              {hzText && <span className={styles.readoutUnit}>Hz</span>}
            </>
          ) : (
            <span className={styles.readoutValue}>{centsText}</span>
          )}
        </div>

        {/* −50…+50 scale with center detent and the sliding needle tick */}
        <div className={styles.scale} aria-hidden="true">
          <div className={styles.track}>
            {TICKS.map(i => (
              <span key={i} className={styles.tick} data-detent={i === 5 || undefined} />
            ))}
            <span className={styles.needle} style={{ left: `${needlePct}%` }} />
          </div>
          <div className={styles.scaleLabels}>
            <span>−50</span>
            <span>0</span>
            <span>+50</span>
          </div>
        </div>

        <span className={styles.reference} aria-hidden="true">
          A = {referenceHz.toFixed(1)} Hz
        </span>
      </div>

      {/* Physical controls on the panel, below the screen */}
      <div className={styles.controls}>
        <Toggle checked={mute} onChange={onMuteChange} label="Mute" size="sm" />
        <NumberField
          value={referenceHz}
          onChange={onReferenceChange}
          min={415}
          max={466}
          step={0.5}
          unit="Hz"
          size="sm"
          aria-label="Reference pitch"
        />
        {onModeChange && (
          <SegmentedControl
            options={MODE_OPTIONS}
            value={mode}
            onChange={v => onModeChange(v as TunerMode)}
            size="sm"
            aria-label="Readout mode"
          />
        )}
      </div>
    </div>
  )
}
