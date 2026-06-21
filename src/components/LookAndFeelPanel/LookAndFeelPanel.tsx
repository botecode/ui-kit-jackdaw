// src/components/LookAndFeelPanel/LookAndFeelPanel.tsx
import { useCallback, useRef } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import type { ThemeMeta, ThemeId, ThemeTokens } from '../../tokens/types'
import styles from './LookAndFeelPanel.module.css'

const SWATCH_KEYS: Array<keyof ThemeTokens> = [
  '--bg',
  '--surface-2',
  '--accent',
  '--led-cyan',
  '--stage',
]

export interface LookAndFeelPanelProps {
  themes: ThemeMeta[]
  active: ThemeId
  onSelect: (id: ThemeId) => void
}

export function LookAndFeelPanel({ themes, active, onSelect }: LookAndFeelPanelProps) {
  const groupRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const total = themes.length
      let next = -1
      if (e.key === 'ArrowDown') next = (idx + 1) % total
      if (e.key === 'ArrowUp')   next = (idx - 1 + total) % total
      if (next >= 0) {
        e.preventDefault()
        const items = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        items?.[next]?.focus()
        onSelect(themes[next]!.id)
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(themes[idx]!.id)
      }
    },
    [themes, onSelect],
  )

  return (
    <div className={styles.root}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Theme"
        className={styles.gallery}
      >
        {themes.map((theme, idx) => {
          const selected = theme.id === active
          return (
            <button
              key={theme.id}
              role="radio"
              aria-checked={selected}
              className={styles.card}
              data-selected={selected || undefined}
              onClick={() => onSelect(theme.id)}
              onKeyDown={e => handleKeyDown(e, idx)}
              tabIndex={selected ? 0 : -1}
            >
              <span className={styles.swatches} aria-hidden="true">
                {SWATCH_KEYS.map(key => (
                  <span
                    key={key}
                    className={styles.swatch}
                    style={{ background: theme.tokens[key] }}
                  />
                ))}
              </span>
              <span className={styles.name}>{theme.name}</span>
              <span className={styles.check} aria-hidden="true">
                {selected && <CheckCircle weight="fill" size={14} />}
              </span>
            </button>
          )
        })}
      </div>
      {/* Spacer — reserved for future appearance toggles (reduced motion, font scale, etc.) */}
      <div className={styles.footer} />
    </div>
  )
}
