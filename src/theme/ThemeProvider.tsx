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

// ── Portalled-theme inheritance ───────────────────────────────────────────────
// Tokens are subtree-scoped (inline CSS vars on the themed <div>), never on :root —
// Jackdaw runs two faces at once (Home's paper face, the Studio's device face), so
// a single global theme can't exist. But every createPortal surface (Popover,
// Dialog, ContextMenu, Tooltip, Toast …) renders OUTSIDE its themed subtree —
// into usePortalTarget()'s root, or document.body when there's no provider — so the
// CSS variables don't resolve there and the surface paints unstyled.
// Fix: expose the opening subtree's active theme + its token style here, and have
// each portal primitive re-declare them on a wrapper at the portal root via
// useThemedPortalProps(). Default to chroma so a portal with no ThemeProvider
// ancestor still resolves the brand tokens instead of rendering bare.
interface PortalTheme {
  theme: ThemeId
  style: React.CSSProperties
}

const PortalThemeContext = createContext<PortalTheme>({
  theme: 'chroma',
  style: chromaTheme as React.CSSProperties,
})

// Spread onto the wrapper a portal primitive renders at its portal root:
//   createPortal(<div {...useThemedPortalProps()}>…</div>, target ?? document.body)
// so var(--accent) & co. resolve even when the content escapes the themed subtree.
export function useThemedPortalProps(): { 'data-theme': ThemeId; style: React.CSSProperties } {
  const { theme, style } = useContext(PortalThemeContext)
  return { 'data-theme': theme, style }
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
  const tokenStyle = tokens as React.CSSProperties
  // Re-declared by portalled surfaces (useThemedPortalProps) at the portal root.
  const portalTheme = useMemo<PortalTheme>(() => ({ theme, style: tokenStyle }), [theme])
  // Layout-transparent wrapper: height:100% so a consumer whose root is height:100%
  // reaches the real viewport root instead of collapsing to content height (100% of
  // an otherwise auto-height wrapper) and letting the page background show below it.
  // (display:contents would dissolve the box but expose the sibling portal-root div
  // as a second grid item — height:100% keeps the single-box + portal structure.)
  // background:var(--bg) paints the active theme's surface so a consumer's body
  // default (e.g. :root #0a0a0a) never shows through.
  const style: React.CSSProperties = { height: '100%', background: 'var(--bg)', ...tokenStyle }
  return (
    <PortalContext.Provider value={portalRef}>
      <PortalThemeContext.Provider value={portalTheme}>
        <div data-theme={theme} style={style}>
          {children}
          <div ref={portalRef} />
        </div>
      </PortalThemeContext.Provider>
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
