// src/components/ArmButton/ArmButton.tsx
import styles from './ArmButton.module.css'

export interface ArmButtonProps {
  /** Whether the track is armed for recording. */
  armed: boolean
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  /**
   * Whether live recording is actively happening on this track.
   * Drives the pulse animation. Requires armed=true — set both when recording.
   */
  recording?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
  autoFocus?: boolean
}

export function ArmButton({
  armed,
  onToggle,
  recording,
  size = 'md',
  disabled,
  autoFocus,
  'aria-label': ariaLabel = 'Arm for recording',
}: ArmButtonProps) {
  return (
    <button
      className={styles.root}
      data-size={size}
      data-armed={armed || undefined}
      data-recording={recording || undefined}
      aria-pressed={armed}
      aria-label={ariaLabel}
      disabled={disabled}
      autoFocus={autoFocus}
      onClick={onToggle}
    />
  )
}
