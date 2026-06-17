// src/gallery/Sidebar.tsx
import { useMemo } from 'react'
import { DEMOS, type DemoMeta } from './registry'
import { PLANNED } from './planned'
import { ThemeSwitcher } from './ui/ThemeSwitcher'
import { useHashRoute } from './useHashRoute'
import styles from './Sidebar.module.css'

type Group = 'Foundations' | 'Primitives' | 'Composites'
const GROUPS: Group[] = ['Foundations', 'Primitives', 'Composites']

const FOUNDATION_LINKS = [
  { name: 'Tokens',          route: '/tokens' },
  { name: 'Design Language', route: '/design-language' },
]

export function Sidebar() {
  const route = useHashRoute()

  const liveByGroup = useMemo(() => {
    const map: Record<Group, DemoMeta[]> = { Foundations: [], Primitives: [], Composites: [] }
    for (const d of DEMOS) {
      if (d.meta.group in map) map[d.meta.group].push(d.meta)
    }
    return map
  }, [])

  const plannedByGroup = useMemo(() => {
    const map: Record<Group, typeof PLANNED> = { Foundations: [], Primitives: [], Composites: [] }
    for (const p of PLANNED) map[p.group].push(p)
    return map
  }, [])

  return (
    <nav className={styles.sidebar} aria-label="Component navigation">
      <div className={styles.header}>
        <span className={styles.wordmark}>JACKDAW</span>
        <ThemeSwitcher />
      </div>
      <div className={styles.nav}>
        {GROUPS.map(group => {
          const foundations = group === 'Foundations' ? FOUNDATION_LINKS : []
          const live = liveByGroup[group]
            .slice()
            .sort((a, b) => a.order - b.order)
          const planned = plannedByGroup[group]
          if (foundations.length + live.length + planned.length === 0) return null

          return (
            <div key={group} className={styles.group}>
              <div className={styles.groupLabel}>{group}</div>
              {[...foundations, ...live].map(item => (
                <a
                  key={item.route}
                  href={`#${item.route}`}
                  className={route === item.route ? styles.navLinkActive : styles.navLink}
                >
                  {item.name}
                </a>
              ))}
              {planned.map(p => (
                <span key={p.route} className={styles.navPlanned} aria-disabled="true">
                  {p.name}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
