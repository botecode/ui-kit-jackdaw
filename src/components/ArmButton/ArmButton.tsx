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
}

export function ArmButton(_props: ArmButtonProps) {
  return <button className={styles.root} />
}
