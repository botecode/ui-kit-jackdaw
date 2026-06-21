// src/gallery/ui/Playground.tsx
import styles from './Playground.module.css'

export function Playground({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <section className={styles.section} aria-label="Playground">
      <h2 className={styles.heading}>Playground</h2>
      <div className={styles.controls}>{children}</div>
    </section>
  )
}
