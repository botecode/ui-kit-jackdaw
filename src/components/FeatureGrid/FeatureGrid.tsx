// src/components/FeatureGrid/FeatureGrid.tsx
import type { CSSProperties } from 'react'
import { FeatureCard } from './FeatureCard'
import type { FeatureItem } from './types'
import styles from './FeatureGrid.module.css'

export interface FeatureGridProps {
  /** The feature highlights to lay out. */
  features: FeatureItem[]
  /** Max columns at the widest width; collapses toward 1 as space shrinks. Default 3. */
  columns?: 2 | 3 | 4
  size?: 'sm' | 'md'
  /** Real intent — forwarded from each card's link activation. */
  onActivate?: (item: FeatureItem) => void
  /** Shown when `features` is empty. */
  emptyLabel?: string
}

// A responsive grid of feature tiles.
//
// Why this isn't a webpage: the responsiveness is intrinsic, not a stack of
// breakpoints — the grid flows from 1 column on a phone up to `columns` on a wide
// screen with one rule (the auto-fit / minmax recipe), keeping an even rhythm at
// every width. The empty state isn't a blank div; it's a recessed stage well, so
// even "nothing here" reads as part of the instrument.

export function FeatureGrid({
  features,
  columns = 3,
  size = 'md',
  onActivate,
  emptyLabel = 'No features to show.',
}: FeatureGridProps) {
  if (features.length === 0) {
    return (
      <div className={styles.empty} data-size={size} role="status">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ul
      className={styles.grid}
      data-size={size}
      style={{ '--_cols': columns } as CSSProperties}
    >
      {features.map((feature) => (
        <li key={feature.id} className={styles.cell}>
          <FeatureCard feature={feature} size={size} onActivate={onActivate} />
        </li>
      ))}
    </ul>
  )
}
