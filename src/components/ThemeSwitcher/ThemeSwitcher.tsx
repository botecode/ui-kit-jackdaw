// src/components/ThemeSwitcher/ThemeSwitcher.tsx
import { useRef, useCallback } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import styles from './ThemeSwitcher.module.css'

export interface ThemeSwitcherItem {
  id: string
  name: string
  swatches: string[]
}

export interface ThemeSwitcherProps {
  themes: ThemeSwitcherItem[]
  active: string
  onSelect: (id: string) => void
}

export function ThemeSwitcher({ themes, active, onSelect }: ThemeSwitcherProps) {
  const groupRef = useRef<HTMLDivElement>(null)

  // Roving tabindex: if active matches, that card is the tab stop; else fall back to first.
  const selectedIdx = themes.findIndex(t => t.id === active)
  const focusableIdx = selectedIdx >= 0 ? selectedIdx : 0

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
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Theme"
      className={styles.root}
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
            tabIndex={idx === focusableIdx ? 0 : -1}
          >
            <span className={styles.swatches} aria-hidden="true">
              {theme.swatches.map((color, i) => (
                <span
                  key={i}
                  className={styles.swatch}
                  style={{ background: color }}
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
  )
}
