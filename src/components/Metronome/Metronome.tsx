// src/components/Metronome/Metronome.tsx
//
// Metronome — the click toggle for the record room.
//
// Why this isn't a checkbox: a metronome is a piece of hardware that blinks on
// the beat. This is a recessed-off / LED-lit-on toggle (the kit signature) whose
// click carries a row of beat pips that light across the bar. The pips are driven
// by the host's `beat` (the transport owns the clock — same imperative contract as
// the Playhead), so the component stays a pure render: no internal timer, fully
// testable, and the lit pip is the ONE state-carrying light that survives reduced
// motion (only the decorative blink would be gated, and we don't add one).
//
// Colour: the click LED is cyan — the kit's "active utility" lit colour (FX-chain
// family), kept off the red/green transport semantics so the click never reads as
// record or play.

import styles from './Metronome.module.css'

export interface MetronomeProps {
  /** Is the click on? */
  enabled: boolean
  /** Toggle the click. */
  onToggle: (next: boolean) => void
  /** Tempo, shown as the readout. */
  bpm: number
  /** Beats per bar — how many pips. Default 4. */
  numerator?: number
  /**
   * Current beat index (0-based) for the lit pip. Host drives it from the
   * transport clock; omit / -1 to light none. The downbeat (0) reads brighter.
   */
  beat?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

export function Metronome({
  enabled,
  onToggle,
  bpm,
  numerator = 4,
  beat = -1,
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel = 'Metronome click',
}: MetronomeProps) {
  const pips = Array.from({ length: Math.max(1, numerator) }, (_, i) => i)

  return (
    <div className={styles.root} data-size={size} data-on={enabled || undefined}>
      <button
        type="button"
        className={styles.toggle}
        data-on={enabled || undefined}
        aria-pressed={enabled}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
      >
        <span className={styles.led} aria-hidden="true" />
        <span className={styles.label}>Click</span>
      </button>

      <div className={styles.pips} aria-hidden="true">
        {pips.map(i => (
          <span
            key={i}
            className={styles.pip}
            data-lit={enabled && i === beat ? '' : undefined}
            data-downbeat={i === 0 ? '' : undefined}
          />
        ))}
      </div>

      <span className={styles.bpm}>
        {bpm}
        <span className={styles.bpmUnit}>BPM</span>
      </span>
    </div>
  )
}
