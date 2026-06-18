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

const COMPARE_THEMES: ThemeId[] = ['chroma', 'bowie', 'tropicalia', 'manuscript', 'ink']
const ZOOM_LEVELS = [1, 1.5, 2, 4] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]

export function Stage() {
  const route = useHashRoute()
  const [compareMode, setCompareMode] = useState(false)
  const [zoom, setZoom] = useState<ZoomLevel>(1)

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
        {!compareMode && (
          <div className={styles.zoomControl} role="group" aria-label="Zoom">
            {ZOOM_LEVELS.map(z => (
              <button
                key={z}
                className={`${styles.zoomBtn}${zoom === z ? ` ${styles.zoomBtnActive}` : ''}`}
                onClick={() => setZoom(z)}
                aria-pressed={zoom === z}
              >
                {z}×
              </button>
            ))}
          </div>
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
          <div
            style={zoom !== 1 ? {
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              // Compensate layout width so overflow: auto creates a scroll region
              width: `${(100 / zoom).toFixed(2)}%`,
            } : undefined}
          >
            <Page />
          </div>
        </div>
      )}
    </div>
  )
}
