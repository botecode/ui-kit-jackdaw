// src/components/Toggle/Toggle.calm.tsx
// Calm-theme variant: a soft switch — no recessed well, no LED. Off is a quiet
// track; on fills gently with the accent.
import type { ToggleProps } from './Toggle'
import styles from './Toggle.calm.module.css'

export function ToggleCalm({
  checked,
  onChange,
  size = 'md',
  disabled,
  label,
  'aria-label': ariaLabel,
  color,
  autoFocus,
}: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={styles.root}
      data-size={size}
      data-checked={checked || undefined}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      onClick={e => onChange(!checked, e)}
      style={color ? { '--_toggle-accent': color } as React.CSSProperties : undefined}
    >
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.pill} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  )
}
