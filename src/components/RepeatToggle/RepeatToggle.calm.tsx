// src/components/RepeatToggle/RepeatToggle.calm.tsx
// Calm-theme variant: soft icon toggle; active = gentle accent fill, no LED.
import { Repeat } from '@phosphor-icons/react'
import type { RepeatToggleProps } from './RepeatToggle'
import styles from './RepeatToggle.calm.module.css'

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

export function RepeatToggleCalm({
  repeating,
  onToggle,
  size = 'md',
  disabled,
  'aria-label': ariaLabel = 'Loop',
}: RepeatToggleProps) {
  return (
    <button
      type="button"
      className={styles.root}
      data-size={size}
      data-repeating={repeating || undefined}
      aria-label={ariaLabel}
      aria-pressed={repeating}
      disabled={disabled}
      onClick={() => onToggle(!repeating)}
    >
      <Repeat aria-hidden size={ICON_SIZE[size]} />
    </button>
  )
}
