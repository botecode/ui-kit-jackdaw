// src/components/Clock/Clock.calm.tsx
// Calm-theme variant: a soft paper readout instead of a dark display well. Mono
// digits in ink; state shown by a quiet coloured label (sage = playing,
// terracotta = recording).
import type { ClockProps } from './Clock'
import styles from './Clock.calm.module.css'

const TICKS_PER_BEAT = 96

const STATE_LABELS = {
  stopped:   '[Stopped]',
  playing:   'Playing',
  recording: 'Recording',
} as const

const BARS_FALLBACK: Record<1 | 2 | 3, string> = { 1: '-', 2: '-.-', 3: '-.-.--' }

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

function toMinSec(seconds: number, precision: 1 | 2 | 3): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  if (precision === 1) return `${m}`
  const sec = Math.floor(s % 60)
  if (precision === 2) return `${m}:${String(sec).padStart(2, '0')}`
  const ms = Math.floor((s % 1) * 1000)
  return `${m}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

export function ClockCalm({
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

  return (
    <button
      type="button"
      className={styles.root}
      data-size={size}
      data-state={state}
      data-mode={mode}
      data-precision={precision}
      aria-label={`Position display, ${mode} mode. Switch to ${nextMode} mode`}
      onClick={() => onModeChange?.(nextMode)}
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
