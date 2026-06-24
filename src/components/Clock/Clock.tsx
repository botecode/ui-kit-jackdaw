// src/components/Clock/Clock.tsx
import { useThemeComponent } from '../../theme/themeComponents'
import styles from './Clock.module.css'

// 96 ticks per beat — matches the spec example "19.3.11" (2-digit tick display, max 95)
const TICKS_PER_BEAT = 96

type ClockState = 'stopped' | 'playing' | 'recording'

const STATE_LABELS: Record<ClockState, string> = {
  stopped: '[Stopped]',
  playing: 'Playing',
  recording: 'Recording',
}

const BARS_FALLBACK: Record<1 | 2 | 3, string> = { 1: '-', 2: '-.-', 3: '-.-.--' }

/** seconds → bars string, precision controls how many units: 1=bar, 2=bar.beat, 3=bar.beat.tick */
function toBarsBeats(seconds: number, bpm: number, numerator: number, precision: 1 | 2 | 3): string {
  if (bpm <= 0 || numerator <= 0) return BARS_FALLBACK[precision]
  const beats = Math.max(0, seconds) * (bpm / 60)
  const bar = Math.floor(beats / numerator) + 1
  if (precision === 1) return `${bar}`
  const beat = Math.floor(beats % numerator) + 1
  if (precision === 2) return `${bar}.${beat}`
  const tick = Math.floor((beats % 1) * TICKS_PER_BEAT)
  return `${bar}.${beat}.${String(tick).padStart(2, '0')}`
}

/** seconds → time string, precision controls units: 1=m, 2=m:ss, 3=m:ss.mmm */
function toMinSec(seconds: number, precision: 1 | 2 | 3): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  if (precision === 1) return `${m}`
  const sec = Math.floor(s % 60)
  if (precision === 2) return `${m}:${String(sec).padStart(2, '0')}`
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
  /**
   * How many time units to show. Default 3 (all).
   * bars mode: 1=bar, 2=bar.beat, 3=bar.beat.tick
   * time mode: 1=m, 2=m:ss, 3=m:ss.mmm
   */
  precision?: 1 | 2 | 3
  size?: 'sm' | 'md'
}

function ClockBase({
  seconds,
  bpm,
  numerator,
  denominator: _denominator,
  state,
  mode = 'bars',
  onModeChange,
  precision = 3,
  size = 'md',
}: ClockProps) {
  const position = mode === 'bars'
    ? toBarsBeats(seconds, bpm, numerator, precision)
    : toMinSec(seconds, precision)

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
      data-precision={precision}
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

// Theme-aware resolver: the active theme's variant, or the base.
export function Clock(props: ClockProps) {
  const Impl = useThemeComponent('Clock', ClockBase)
  return <Impl {...props} />
}
