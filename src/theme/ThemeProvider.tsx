// src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo, useRef, useState } from 'react'
import type { ThemeId } from '../tokens/types'
import { THEMES } from '../tokens/themes'
import { chromaTheme } from '../tokens/themes/chroma'

// ── Portal root ──────────────────────────────────────────────────────────────
// ThemeProvider renders a portal root div inside the token scope so portaled
// overlays (Popover with anchor) inherit the active theme's CSS custom properties
// while still escaping overflow-clipping containers via position:fixed.
// Outside any ThemeProvider, usePortalTarget() returns null and Popover falls
// back to document.body.
const PortalContext = createContext<React.RefObject<HTMLElement | null>>({ current: null })

export function usePortalTarget(): HTMLElement | null {
  return useContext(PortalContext).current
}

// ── ThemeContext ─────────────────────────────────────────────────────────────

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
  const portalRef = useRef<HTMLDivElement>(null)
  // Inline CSS vars = highest specificity source.
  // RULE: [data-theme] overrides in global.css affect structural tokens only.
  // Colour and radius are changed in the theme object — not via [data-theme] selectors.
  const tokens = THEMES.find(t => t.id === theme)?.tokens ?? chromaTheme
  // Layout-transparent wrapper: height:100% so a consumer whose root is height:100%
  // reaches the real viewport root instead of collapsing to content height (100% of
  // an otherwise auto-height wrapper) and letting the page background show below it.
  // (display:contents would dissolve the box but expose the sibling portal-root div
  // as a second grid item — height:100% keeps the single-box + portal structure.)
  // background:var(--bg) paints the active theme's surface so a consumer's body
  // default (e.g. :root #0a0a0a) never shows through.
  const style: React.CSSProperties = { height: '100%', background: 'var(--bg)', ...(tokens as React.CSSProperties) }
  return (
    <PortalContext.Provider value={portalRef}>
      <div data-theme={theme} style={style}>
        {children}
        <div ref={portalRef} />
      </div>
    </PortalContext.Provider>
  )
}

const VALID_IDS = new Set(THEMES.map(t => t.id))

// Convenience wrapper that owns the theme state and provides context.
// Use this at the App root. Use bare ThemeProvider for nested/compare usage.
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(() => {
    const stored = localStorage.getItem('jd-gallery-theme')
    return (stored && VALID_IDS.has(stored as ThemeId)) ? stored as ThemeId : 'chroma'
  })
  const ctx = useMemo<ThemeCtx>(() => ({
    theme,
    setTheme: (t) => {
      setTheme(t)
      localStorage.setItem('jd-gallery-theme', t)
    },
  }), [theme])
  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
}
