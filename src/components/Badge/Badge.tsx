// src/components/Badge/Badge.tsx

export type BadgeVariant = 'count' | 'dot' | 'label'
export type BadgeTone    = 'default' | 'accent' | 'red' | 'amber' | 'green'

export interface BadgeProps {
  variant?:      BadgeVariant
  tone?:         BadgeTone
  size?:         'sm' | 'md'
  count?:        number
  children?:     React.ReactNode
  'aria-label'?: string
}

import styles from './Badge.module.css'

function countLabel(n: number): string {
  return n >= 100 ? '99+' : String(n)
}

export function Badge({
  variant  = 'count',
  tone     = 'default',
  size     = 'md',
  count,
  children,
  'aria-label': ariaLabel,
}: BadgeProps) {
  const isDot = variant === 'dot'

  return (
    <span
      className={styles.root}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      aria-label={ariaLabel}
      aria-hidden={isDot && !ariaLabel ? true : undefined}
    >
      {variant === 'count' && count !== undefined && countLabel(count)}
      {variant === 'label' && children}
    </span>
  )
}
