// src/components/Progress/Progress.tsx
import styles from './Progress.module.css'

export interface ProgressProps {
  variant?: 'bar' | 'ring'
  /** 0–1. Omit for indeterminate. */
  value?: number
  label?: string
  size?: 'sm' | 'md'
  'aria-label'?: string
}

const RING_MD = { size: 40, cx: 20, cy: 20, r: 16, sw: 3 }
const RING_SM = { size: 24, cx: 12, cy: 12, r:  9, sw: 2 }

function circ(r: number) { return 2 * Math.PI * r }

export function Progress({
  variant = 'bar',
  value,
  label,
  size = 'md',
  'aria-label': ariaLabel,
}: ProgressProps) {
  const isIndeterminate = value === undefined
  const clamped = isIndeterminate ? 0 : Math.max(0, Math.min(1, value))
  const pct = Math.round(clamped * 100)
  const accessibleLabel = label ?? ariaLabel ?? 'Loading'

  const sharedAttrs = {
    role: 'progressbar' as const,
    'aria-label': accessibleLabel,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': isIndeterminate ? undefined : pct,
    'data-variant': variant,
    'data-size': size,
    'data-indeterminate': isIndeterminate || undefined,
  }

  if (variant === 'ring') {
    const ring = size === 'sm' ? RING_SM : RING_MD
    const c = circ(ring.r)
    const dashArray = isIndeterminate
      ? `${c * 0.35} ${c}`
      : `${c}`
    const dashOffset = isIndeterminate ? 0 : c * (1 - clamped)

    return (
      <div className={styles.ringWrap}>
        <svg
          {...sharedAttrs}
          className={styles.ring}
          width={ring.size}
          height={ring.size}
          viewBox={`0 0 ${ring.size} ${ring.size}`}
        >
          <circle
            className={styles.ringTrack}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            strokeWidth={ring.sw}
          />
          <circle
            className={styles.ringFill}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            strokeWidth={ring.sw}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
          />
        </svg>
        {label && <span className={styles.label}>{label}</span>}
      </div>
    )
  }

  return (
    <div className={styles.barWrap}>
      <div
        {...sharedAttrs}
        className={styles.bar}
        style={
          isIndeterminate
            ? undefined
            : ({ '--_fill': String(clamped) } as React.CSSProperties)
        }
      >
        <div className={styles.barFill} aria-hidden="true" />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
