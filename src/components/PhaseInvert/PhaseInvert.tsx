import styles from './PhaseInvert.module.css'

export interface PhaseInvertProps {
  inverted: boolean
  onToggle: (next: boolean) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
  autoFocus?: boolean
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 12, md: 16 }

function PhaseGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="3.8" y1="12.2"
        x2="12.2" y2="3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PhaseInvert({
  inverted,
  onToggle,
  size = 'md',
  disabled,
  'aria-label': ariaLabel = 'Invert phase',
  autoFocus,
}: PhaseInvertProps) {
  return (
    <button
      type="button"
      className={styles.root}
      data-size={size}
      data-inverted={inverted || undefined}
      aria-pressed={inverted}
      aria-label={ariaLabel}
      disabled={disabled}
      autoFocus={autoFocus}
      onClick={() => onToggle(!inverted)}
    >
      <PhaseGlyph size={ICON_SIZE[size]} />
    </button>
  )
}
