// src/components/MuteSoloToggle/MuteSoloToggle.calm.tsx
// Calm-theme variant: two soft text pills instead of recessed LED chips. Active
// state is a gentle filled pill, not a lit well.
import { isSilencedBySolo } from './MuteSoloToggle'
import type { MuteSoloToggleProps } from './MuteSoloToggle'
import styles from './MuteSoloToggle.calm.module.css'

export function MuteSoloToggleCalm({
  muted,
  soloed,
  onToggleMute,
  onToggleSolo,
  anySoloActive,
  size = 'md',
  orientation = 'stacked',
  disabled = false,
  muteLabel = 'Mute',
  soloLabel = 'Solo',
}: MuteSoloToggleProps) {
  const silenced = isSilencedBySolo(muted, soloed, anySoloActive)

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={size}
    >
      <button
        className={styles.chip}
        data-variant="mute"
        data-active={muted || undefined}
        data-silenced={silenced || undefined}
        aria-pressed={muted}
        aria-label={silenced ? `${muteLabel} (silenced by solo)` : muteLabel}
        title={silenced ? 'Silenced by solo' : undefined}
        onClick={onToggleMute}
        disabled={disabled}
      >
        <span aria-hidden="true">M</span>
      </button>
      <button
        className={styles.chip}
        data-variant="solo"
        data-active={soloed || undefined}
        aria-pressed={soloed}
        aria-label={soloLabel}
        onClick={onToggleSolo}
        disabled={disabled}
      >
        <span aria-hidden="true">S</span>
      </button>
    </div>
  )
}
