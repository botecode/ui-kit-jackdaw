// src/components/Tabs/Tabs.tsx
import { useId, useRef, useLayoutEffect, useState } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  children?: React.ReactNode
  size?: 'sm' | 'md'
}

export function Tabs({ tabs, active, onChange, children, size = 'md' }: TabsProps) {
  const uid = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [ind, setInd] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const idx = tabs.findIndex(t => t.id === active)
    const el = tabRefs.current[idx]
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active, tabs, size])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter(t => !t.disabled)
    const cur = enabled.findIndex(t => t.id === active)
    let next: TabItem | undefined

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next = enabled[(cur + 1) % enabled.length]
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      next = enabled[(cur - 1 + enabled.length) % enabled.length]
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = enabled[0]
    } else if (e.key === 'End') {
      e.preventDefault()
      next = enabled[enabled.length - 1]
    }

    if (next) {
      onChange(next.id)
      const nextIdx = tabs.indexOf(next)
      tabRefs.current[nextIdx]?.focus()
    }
  }

  const panelId = `${uid}-panel`

  return (
    <div className={styles.root} data-size={size}>
      <div className={styles.tablistWrapper}>
        <div
          role="tablist"
          className={styles.tablist}
          onKeyDown={handleKeyDown}
        >
          {tabs.map((tab, idx) => {
            const isActive = tab.id === active
            const tabId = `${uid}-tab-${tab.id}`
            return (
              <button
                key={tab.id}
                id={tabId}
                type="button"
                ref={el => { tabRefs.current[idx] = el }}
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-disabled={tab.disabled || undefined}
                // Disabled tabs are never in the tab sequence — even if they are the current active.
                tabIndex={isActive && !tab.disabled ? 0 : -1}
                className={styles.tab}
                data-active={isActive || undefined}
                data-disabled={tab.disabled || undefined}
                onClick={() => { if (!tab.disabled) onChange(tab.id) }}
              >
                {tab.icon && <span className={styles.tabIcon} aria-hidden="true">{tab.icon}</span>}
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            )
          })}
          <div
            className={styles.indicator}
            aria-hidden="true"
            style={{
              '--_ind-left': `${ind.left}px`,
              '--_ind-width': `${ind.width}px`,
            } as React.CSSProperties}
          />
        </div>
      </div>
      <div
        id={panelId}
        role="tabpanel"
        className={styles.panel}
        aria-labelledby={`${uid}-tab-${active}`}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  )
}
