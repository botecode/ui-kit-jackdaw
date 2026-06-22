// src/components/MobileRecordButton/MobileRecordButton.tsx
//
// The Walkman record key — the centerpiece of the mobile Record tab. A large,
// tactile press target: a warm raised hardware key holding a bespoke record dot
// that lights and morphs to a stop-square while rolling, over a mono m:ss readout
// and a simple input-level meter.
//
// Why this isn't a webpage: a web app would drop a flat red circular <button>
// with a CSS color swap and a number ticking beside it. This is the kit's
// hardware idiom instead — the key is a recessed-off / LED-lit-on control with a
// hairline top-highlight and a real press (it sinks into its well when punched),
// the record meaning is carried by the semantic red LED (not a generic accent),
// and the bloom rides incandescent timing (fast attack / slow decay) so stopping
// glows down like a real lamp. Everything is token-driven, so the same key reskins
// through every theme. The press is decorative motion (snaps under reduced-motion);
// the LED bloom and the meter are functional and stay.
import { MicrophoneSlash } from '@phosphor-icons/react'
import styles from './MobileRecordButton.module.css'

export type MobileRecordState = 'idle' | 'recording' | 'stopped' | 'disabled'

export interface MobileRecordButtonProps {
  /**
   * Transport state of the mobile recorder.
   * - idle     — ready, never recorded this take; the inviting "Record" affordance.
   * - recording — rolling: LED lit, live timer + input meter.
   * - stopped  — a take was just captured; LED off, timer frozen on the final length.
   * - disabled — no microphone permission; non-interactive, hint shown.
   */
  state: MobileRecordState
  /**
   * Elapsed recording time in seconds — drives the m:ss readout. The caller owns
   * the clock (it ticks the real recorder) and updates this ~1 Hz while recording;
   * the component only formats it, so it stays pure and trivially testable.
   */
  elapsedSeconds?: number
  /**
   * Normalised input peak, 0..1, for the simple level meter. Caller drives at
   * ~30 Hz while recording. Clamped internally. Ignored outside `recording`.
   */
  level?: number
  /** User pressed to START a take (fires from idle / stopped). */
  onStart: () => void
  /** User pressed to STOP the running take (fires from recording). */
  onStop: () => void
  size?: 'sm' | 'md'
  /** Override the key's accessible label. Defaults follow the relabel pattern. */
  'aria-label'?: string
  autoFocus?: boolean
}

/** seconds → "m:ss" (clamped at 0, minutes uncapped for long takes). */
function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${m}:${ss}`
}

const STATUS: Record<MobileRecordState, string> = {
  idle:      'Record',
  recording: 'Recording',
  stopped:   'Stopped',
  disabled:  'Microphone access needed',
}

const MIC_ICON: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

export function MobileRecordButton({
  state,
  elapsedSeconds = 0,
  level = 0,
  onStart,
  onStop,
  size = 'md',
  autoFocus,
  'aria-label': ariaLabel,
}: MobileRecordButtonProps) {
  const recording = state === 'recording'
  const disabled = state === 'disabled'

  // Relabel pattern (KIT-LEAD §5): the label says what the click DOES — no
  // aria-pressed. Mobile record is a pure start/stop action (no separate arm
  // step like RecordMode), so there is no "engaged" middle ground to encode.
  const label = ariaLabel ?? (recording ? 'Stop recording' : 'Record')

  // Meter fill, 0..1 → percentage width. Only meaningful while recording.
  const fill = Math.max(0, Math.min(1, level)) * 100

  function handleClick() {
    if (disabled) return
    if (recording) onStop()
    else onStart()
  }

  return (
    <div className={styles.root} data-state={state} data-size={size}>
      <button
        type="button"
        className={styles.key}
        data-state={state}
        data-size={size}
        aria-label={label}
        disabled={disabled}
        autoFocus={autoFocus}
        onClick={handleClick}
      >
        <span className={styles.face} aria-hidden="true">
          {disabled ? (
            <MicrophoneSlash size={MIC_ICON[size]} className={styles.micGlyph} />
          ) : (
            // Bespoke record/stop glyph (inline SVG, per Chroma): a dot that
            // morphs to a rounded square while rolling — the dot IS the record
            // affordance, the square reads "tap to stop".
            <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
              <rect
                className={styles.glyphShape}
                data-recording={recording || undefined}
                x="6" y="6" width="12" height="12"
              />
            </svg>
          )}
        </span>
      </button>

      <div className={styles.readout} aria-hidden="true">
        <span className={styles.timer} data-testid="record-timer">
          {formatElapsed(elapsedSeconds)}
        </span>
      </div>

      {recording && (
        <div className={styles.meter} data-testid="record-meter" aria-hidden="true">
          <div
            className={styles.meterFill}
            style={{ '--clip': `${100 - fill}%` } as React.CSSProperties}
          />
          <div className={styles.meterMask} />
        </div>
      )}

      <div className={styles.status} aria-hidden="true">
        {STATUS[state]}
      </div>
    </div>
  )
}
