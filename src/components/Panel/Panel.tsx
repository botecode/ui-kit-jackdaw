// src/components/Panel/Panel.tsx
import { useId } from 'react'
import styles from './Panel.module.css'

export interface PanelProps {
  title?: string
  tone?: 'outlined' | 'stage'
  headerLead?: React.ReactNode
  headerControl?: React.ReactNode
  texture?: boolean
  padding?: 'sm' | 'md' | 'lg'
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Panel({
  title,
  tone = 'outlined',
  headerLead,
  headerControl,
  texture,
  padding = 'md',
  children,
  className,
  style,
}: PanelProps) {
  const titleId = useId()
  const hasHeader = !!(title || headerLead != null || headerControl != null)
  const showTexture = texture ?? (tone === 'outlined')

  return (
    <section
      className={className ? `${styles.root} ${className}` : styles.root}
      style={style}
      data-tone={tone}
      data-texture={showTexture || undefined}
      data-padding={padding}
      aria-labelledby={title ? titleId : undefined}
    >
      {hasHeader && (
        <div className={styles.header}>
          {headerLead != null && (
            <div className={styles.headerLead}>{headerLead}</div>
          )}
          {title && (
            <span id={titleId} className={styles.title}>{title}</span>
          )}
          {headerControl != null && (
            <div className={styles.headerControl}>{headerControl}</div>
          )}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
