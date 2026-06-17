// src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo, useState } from 'react'
import type { ThemeId } from '../tokens/types'
import { THEMES } from '../tokens/themes'
import { defaultTheme } from '../tokens/themes/default'

interface ThemeCtx {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

// ThemeContext is provided at App level (above both ThemeProvider wrappers).
// Sidebar reads setTheme for the switcher. Tokens page reads theme for value display.
export const ThemeContext = createContext<ThemeCtx>({
  theme: 'default',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface Props {
  theme: ThemeId
  children: React.ReactNode
}

export function ThemeProvider({ theme, children }: Props) {
  // Inline CSS vars = highest specificity source.
  // RULE: [data-theme] overrides in global.css affect structural tokens only.
  // Colour and radius are changed in the theme object — not via [data-theme] selectors.
  const tokens = THEMES.find(t => t.id === theme)?.tokens ?? defaultTheme
  return (
    <div data-theme={theme} style={tokens as React.CSSProperties}>
      {children}
    </div>
  )
}

// Convenience wrapper that owns the theme state and provides context.
// Use this at the App root. Use bare ThemeProvider for nested/compare usage.
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem('jd-gallery-theme') as ThemeId | null) ?? 'default'
  )
  const ctx = useMemo<ThemeCtx>(() => ({
    theme,
    setTheme: (t) => {
      setTheme(t)
      localStorage.setItem('jd-gallery-theme', t)
    },
  }), [theme])
  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
}
