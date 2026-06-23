// src/components/ArmButton/ArmButton.calm.tsx
// Calm-theme variant of ArmButton. Same contract, no LED: a soft ring that fills
// with a muted terracotta when armed, a gentle breath when recording. Quiet.
import type { ArmButtonProps } from './ArmButton'
import styles from './ArmButton.calm.module.css'

export function ArmButtonCalm({
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
