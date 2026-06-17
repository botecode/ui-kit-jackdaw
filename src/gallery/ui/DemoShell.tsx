// src/gallery/ui/DemoShell.tsx
import type { DemoMeta } from '../registry'
import styles from './DemoShell.module.css'

interface Props {
  meta: DemoMeta
  children: React.ReactNode
}

export function DemoShell({ meta, children }: Props) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{meta.name}</h1>
          <span className={styles.group}>{meta.group}</span>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
