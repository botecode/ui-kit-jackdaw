// src/gallery/Sidebar.tsx
import { useMemo, useState, useRef, useEffect } from 'react'
import { DEMOS, type DemoMeta } from './registry'
import { PLANNED, subtractBuilt } from './planned'
import { ThemeSwitcher } from './ui/ThemeSwitcher'
import { useHashRoute } from './useHashRoute'
import { SidebarSearch } from './SidebarSearch'
import { filterByName } from './gallerySearch'
import styles from './Sidebar.module.css'

type Group = 'Foundations' | 'Primitives' | 'Composites'
const GROUPS: Group[] = ['Foundations', 'Primitives', 'Composites']

const FOUNDATION_LINKS = [
  { name: 'Tokens',          route: '/tokens' },
  { name: 'Design Language', route: '/design-language' },
]

export function Sidebar() {
  const route = useHashRoute()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcut: / or ⌘F (⌃F) focuses the search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as Element
      const editable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable

      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('')
        inputRef.current?.blur()
        return
      }

      if (editable) return

      if (e.key === '/' || (e.key === 'f' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const liveByGroup = useMemo(() => {
    const map: Record<Group, DemoMeta[]> = { Foundations: [], Primitives: [], Composites: [] }
    for (const d of DEMOS) {
      if (d.meta.group in map) map[d.meta.group].push(d.meta)
    }
    return map
  }, [])

  const plannedByGroup = useMemo(() => {
    const builtNames = new Set(DEMOS.map(d => d.meta.name))
    const map: Record<Group, typeof PLANNED> = { Foundations: [], Primitives: [], Composites: [] }
    for (const p of subtractBuilt(PLANNED, builtNames)) map[p.group].push(p)
    return map
  }, [])

  const filteredFoundationLinks = filterByName(FOUNDATION_LINKS, query)

  const filteredLiveByGroup = useMemo<Record<Group, DemoMeta[]>>(() => {
    const map: Record<Group, DemoMeta[]> = { Foundations: [], Primitives: [], Composites: [] }
    for (const g of GROUPS) {
      map[g] = filterByName(
        liveByGroup[g].slice().sort((a, b) => a.order - b.order),
        query,
      )
    }
    return map
  }, [liveByGroup, query])

  const filteredPlannedByGroup = useMemo<Record<Group, typeof PLANNED>>(() => {
    const map: Record<Group, typeof PLANNED> = { Foundations: [], Primitives: [], Composites: [] }
    for (const g of GROUPS) {
      map[g] = filterByName(plannedByGroup[g], query)
    }
    return map
  }, [plannedByGroup, query])

  const hasAnyResult =
    filteredFoundationLinks.length > 0 ||
    GROUPS.some(
      g => filteredLiveByGroup[g].length > 0 || filteredPlannedByGroup[g].length > 0,
    )

  return (
    <nav className={styles.sidebar} aria-label="Component navigation">
      <div className={styles.header}>
        <span className={styles.wordmark}>JACKDAW</span>
        <ThemeSwitcher />
      </div>
      <div className={styles.searchWrap}>
        <SidebarSearch
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          inputRef={inputRef}
        />
      </div>
      <div className={styles.nav}>
        {query && !hasAnyResult && (
          <p className={styles.emptyState}>No components match "{query}"</p>
        )}
        {GROUPS.map(group => {
          const foundations = group === 'Foundations' ? filteredFoundationLinks : []
          const live = filteredLiveByGroup[group]
          const planned = filteredPlannedByGroup[group]
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
