// src/gallery/ui/StatesGrid.tsx
import styles from './StatesGrid.module.css'

// The 9 required states for every component. All must be present for DoD.
export const REQUIRED_STATES = [
  'default', 'hover', 'focus', 'active', 'disabled',
  'selected', 'error', 'empty', 'loading',
] as const

export type StateLabel = typeof REQUIRED_STATES[number]

export function State({ label, children }: { label: StateLabel; children: React.ReactNode }) {
  return (
    <div className={styles.stateCell}>
      <span className={styles.stateLabel}>{label}</span>
      <div className={styles.stateContent}>{children}</div>
    </div>
  )
}

export function StatesGrid({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>States</h2>
      <div className={styles.grid}>{children}</div>
    </section>
  )
}
