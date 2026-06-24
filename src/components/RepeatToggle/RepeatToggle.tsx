import { Repeat } from '@phosphor-icons/react'
import { useThemeComponent } from '../../theme/themeComponents'
import styles from './RepeatToggle.module.css'

export interface RepeatToggleProps {
  repeating: boolean
  onToggle: (next: boolean) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

function RepeatToggleBase({
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

// Theme-aware resolver: the active theme's variant, or the base.
export function RepeatToggle(props: RepeatToggleProps) {
  const Impl = useThemeComponent('RepeatToggle', RepeatToggleBase)
  return <Impl {...props} />
}
