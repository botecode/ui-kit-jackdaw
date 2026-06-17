// src/gallery/ui/ThemeSwitcher.tsx
// Phase 1: native <select>. Replaced by the bespoke Dropdown component in Phase 2.
import { THEMES } from '../../tokens/themes'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeId } from '../../tokens/types'
import styles from './ThemeSwitcher.module.css'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <select
      className={styles.select}
      value={theme}
      onChange={e => setTheme(e.target.value as ThemeId)}
      aria-label="Switch theme"
    >
      {THEMES.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  )
}
