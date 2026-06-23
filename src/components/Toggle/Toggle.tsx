import { useThemeComponent } from '../../theme/themeComponents'
import styles from './Toggle.module.css'

export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean, e: React.MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  label?: string
  'aria-label'?: string
  color?: string
  autoFocus?: boolean
}

function ToggleBase({
  checked,
  onChange,
  size = 'md',
  disabled,
  label,
  'aria-label': ariaLabel,
  color,
  autoFocus,
}: ToggleProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onChange(!checked, e)
  }

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
      onClick={handleClick}
      style={color ? { '--_toggle-accent': color } as React.CSSProperties : undefined}
    >
      {label && <span className={styles.label}>{label}</span>}
      <span className={styles.pill} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  )
}

// Theme-aware resolver: the active theme's variant, or the base.
export function Toggle(props: ToggleProps) {
  const Impl = useThemeComponent('Toggle', ToggleBase)
  return <Impl {...props} />
}
