// src/components/Button/Button.tsx
//
// The kit's generic chrome button. Every other button here is purpose-built
// (TransportButton, ArmButton, AutomationButton, MobileRecordButton); this is
// the one for app/document chrome — undo, redo, Save, Lyrics, Share — so the
// DAW stops hand-rolling them.
//
// Why this isn't a webpage button: it sits in the kit's recessed-well language
// (default = a control milled into the cream surface, not a flat box), reuses
// TransportButton's exact disabled/hover/press feel so a row of mixed kit
// buttons reads as one instrument, and reskins through every theme on tokens
// alone. `primary` lights with the accent (KIT-LEAD §6: generic lit → accent);
// `ghost` is the quiet, well-less variant for dense bars (icon undo/redo).
import styles from './Button.module.css'

export interface ButtonProps {
  /** Leading glyph — a phosphor icon or bespoke audio SVG. Icon-only when no children. */
  icon?: React.ReactNode
  /** The label. Absent → icon-only (square); requires an aria-label for its name. */
  children?: React.ReactNode
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  /** default = recessed well · ghost = well-less/quiet · primary = accent-lit CTA. */
  variant?: 'default' | 'ghost' | 'primary'
  size?: 'sm' | 'md'
  'aria-label'?: string
}

export function Button({
  icon,
  children,
  onClick,
  disabled,
  variant = 'default',
  size = 'md',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const iconOnly = children == null || children === false

  if (import.meta.env.DEV && iconOnly && !ariaLabel) {
    // Action button → relabel pattern (KIT-LEAD §5): an icon-only button has no
    // text to name it, so it needs an explicit aria-label or it's invisible to AT.
    console.warn(
      'Button: an icon-only Button (no children) needs an `aria-label` for its accessible name.',
    )
  }

  return (
    <button
      type="button"
      className={styles.root}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly || undefined}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      {icon != null && icon !== false && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      {!iconOnly && <span className={styles.label}>{children}</span>}
    </button>
  )
}
