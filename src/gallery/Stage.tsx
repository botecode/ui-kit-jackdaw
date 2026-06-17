// src/gallery/Stage.tsx
import type { ComponentType } from 'react'
import { useState } from 'react'
import { DEMO_MAP } from './registry'
import { useHashRoute } from './useHashRoute'
import { ThemeProvider } from '../theme/ThemeProvider'
import type { ThemeId } from '../tokens/types'
import styles from './Stage.module.css'

import { Tokens } from './pages/Tokens'
import { DesignLanguage } from './pages/DesignLanguage'

const COMPARE_THEMES: ThemeId[] = ['default', 'bowie', 'tropicalia', 'manuscript', 'ink']

export function Stage() {
  const route = useHashRoute()
  const [compareMode, setCompareMode] = useState(false)

  const PAGE_MAP: Record<string, ComponentType> = {
    '/tokens': Tokens,
    '/design-language': DesignLanguage,
    ...DEMO_MAP,
  }

  const Page = PAGE_MAP[route] ?? (() => (
    <div className={styles.stub}>No page for route: {route}</div>
  ))

  return (
    <div className={styles.stage}>
      <header className={styles.header}>
        <button
          className={styles.compareBtn}
          onClick={() => setCompareMode(m => !m)}
        >
          {compareMode ? 'Exit compare' : 'Compare themes'}
        </button>
        {compareMode && (
          <span className={styles.compareHint}>
            {COMPARE_THEMES.join(' · ')}
          </span>
        )}
      </header>

      {compareMode ? (
        <div className={styles.compareGrid}>
          {COMPARE_THEMES.map(t => (
            <div key={t} className={styles.compareCell}>
              <ThemeProvider theme={t}>
                <div className={styles.compareCellInner}>
                  <div className={styles.compareLabel}>{t}</div>
                  <Page />
                </div>
              </ThemeProvider>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.content}>
          <Page />
        </div>
      )}
    </div>
  )
}
