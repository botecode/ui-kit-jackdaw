// src/components/Clock/Clock.tsx
import styles from './Clock.module.css'

// 96 ticks per beat — matches the spec example "19.3.11" (2-digit tick display, max 95)
const TICKS_PER_BEAT = 96

type ClockState = 'stopped' | 'playing' | 'recording'

const STATE_LABELS: Record<ClockState, string> = {
  stopped: '[Stopped]',
  playing: 'Playing',
  recording: 'Recording',
}

/** seconds → bars.beats.ticks string (1-indexed, ticks 0-padded 2 digits) */
function toBarsBeats(seconds: number, bpm: number, numerator: number): string {
  if (bpm <= 0 || numerator <= 0) return '-.-.--'
  const beats = Math.max(0, seconds) * (bpm / 60)
  const bar = Math.floor(beats / numerator) + 1
  const beat = Math.floor(beats % numerator) + 1
  const tick = Math.floor((beats % 1) * TICKS_PER_BEAT)
  return `${bar}.${beat}.${String(tick).padStart(2, '0')}`
}

/** seconds → m:ss.mmm string */
function toMinSec(seconds: number): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 1000)
  return `${m}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export interface ClockProps {
  /** Current position in seconds. Caller drives at ~30 Hz when playing. */
  seconds: number
  /** Tempo in BPM (quarter-note reference). */
  bpm: number
  /** Time signature numerator — beats per bar. */
  numerator: number
  /**
   * Time signature denominator — held for contract completeness.
   * Bar/beat display uses only numerator; denominator would be needed for
   * compound-meter correction (deferred to the real app).
   */
  denominator: number
  /** Transport state. */
  state: ClockState
  /** Display mode. Default 'bars'. */
  mode?: 'bars' | 'time'
  onModeChange?: (mode: 'bars' | 'time') => void
  size?: 'sm' | 'md'
}

export function Clock({
  seconds,
  bpm,
  numerator,
  denominator: _denominator,
  state,
  mode = 'bars',
  onModeChange,
  size = 'md',
}: ClockProps) {
  const position = mode === 'bars'
    ? toBarsBeats(seconds, bpm, numerator)
    : toMinSec(seconds)

  const nextMode: 'bars' | 'time' = mode === 'bars' ? 'time' : 'bars'

  function handleClick() {
    onModeChange?.(nextMode)
  }

  return (
    <button
      type="button"
      className={styles.root}
      data-size={size}
      data-state={state}
      data-mode={mode}
      aria-label={`Position display, ${mode} mode. Switch to ${nextMode} mode`}
      onClick={handleClick}
    >
      <div className={styles.statusRow} aria-hidden="true">
        <span className={styles.stateLabel}>{STATE_LABELS[state]}</span>
        <span className={styles.modeTag}>{mode === 'bars' ? 'BARS' : 'TIME'}</span>
      </div>
      <div className={styles.position} aria-hidden="true">
        {position}
      </div>
    </button>
  )
}
