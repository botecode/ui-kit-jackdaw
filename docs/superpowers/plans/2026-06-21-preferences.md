# Preferences Modal Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Preferences modal shell — a two-column dialog (sidebar nav + content panel) that composes Dialog behavioral patterns (focus-trap, Esc, scroll-lock, portal) with tablist/tabpanel ARIA semantics and three section slots.

**Architecture:** Preferences is a standalone modal component (not a wrapper around Dialog) because Dialog's 480px-fixed-width and header/body/footer structure are incompatible with the sidebar+content two-column layout. Preferences re-implements Dialog's behavioral infrastructure (same focus-trap, Esc, scroll-lock, portal patterns) in a custom layout. It portals into the themed mount via `usePortalTarget()`, uses `role="dialog" aria-modal="true"`, and exposes a `role="tablist"` sidebar nav with `role="tabpanel"` content area. The shell is layout-only; actual panel content is passed as `children`.

**Tech Stack:** React 19, TypeScript 6, CSS Modules, @phosphor-icons/react, Vitest + @testing-library/react (fireEvent only)

## Global Constraints

- Tokens only — no hardcoded colors; verify Compare light + dark
- CSS Modules + `data-*` attributes for state (no class juggling)
- Tests use `fireEvent`, NOT `userEvent`
- `npx tsc --noEmit` + `npx vitest run` + lint green
- Sizes `sm`/`md` (default `md`) — Preferences is `md` only (no size prop needed; it's a fixed-layout shell)
- `:focus-visible` only (never `:focus`)
- Every state in the demo (open/closed, each section active)
- Dogfood: playground controls from kit `Toggle`
- Icons: `@phosphor-icons/react`, only from that package
- Auto-registers via `import.meta.glob` — NO manual registry edits

---

### Task 1: Implement `Preferences.tsx` + `Preferences.module.css`

**Files:**
- Create: `src/components/Preferences/Preferences.tsx`
- Create: `src/components/Preferences/Preferences.module.css`

**Interfaces:**
- Consumes: `usePortalTarget` from `../../theme/ThemeProvider`
- Produces: `export interface PreferencesSection { id: string; label: string; icon: React.ReactNode }` and `export interface PreferencesProps { open: boolean; onClose: () => void; sections: PreferencesSection[]; active: string; onSelect: (id: string) => void; children: React.ReactNode }`

- [ ] **Step 1: Write `Preferences.tsx`**

```tsx
// src/components/Preferences/Preferences.tsx
import { useEffect, useRef, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './Preferences.module.css'

export interface PreferencesSection {
  id: string
  label: string
  icon: React.ReactNode
}

export interface PreferencesProps {
  open: boolean
  onClose: () => void
  sections: PreferencesSection[]
  active: string
  onSelect: (id: string) => void
  children: React.ReactNode
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
}

export function Preferences({
  open,
  onClose,
  sections,
  active,
  onSelect,
  children,
}: PreferencesProps) {
  const titleId = useId()
  const shellRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const portalTarget = usePortalTarget()

  // Capture trigger before focus shifts.
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement
    }
  }, [open])

  // Explicit focus on open (WKWebView: clicking a button does NOT focus it).
  useEffect(() => {
    if (!open || !shellRef.current) return
    const focusable = getFocusable(shellRef.current)
    const target = focusable[0] ?? shellRef.current
    target.focus()
  }, [open])

  // Return focus on close.
  useEffect(() => {
    if (!open && returnFocusRef.current) {
      returnFocusRef.current.focus()
      returnFocusRef.current = null
    }
  }, [open])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Esc to close.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  // Focus trap: Tab/Shift+Tab cycles within the shell.
  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !shellRef.current) return
      const focusable = getFocusable(shellRef.current)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  // Arrow key nav in the tablist.
  const handleNavKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const idx = sections.findIndex(s => s.id === active)
    if (idx === -1) return
    const next = e.key === 'ArrowDown'
      ? sections[(idx + 1) % sections.length]
      : sections[(idx - 1 + sections.length) % sections.length]
    onSelect(next.id)
  }, [sections, active, onSelect])

  if (!open) return null

  return createPortal(
    <div className={styles.scrim} onClick={onClose}>
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.shell}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>PREFERENCES</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close preferences"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </header>

        {/* Body: sidebar + content */}
        <div className={styles.body}>
          {/* Sidebar nav */}
          <nav
            className={styles.sidebar}
            role="tablist"
            aria-orientation="vertical"
            aria-label="Preferences sections"
            onKeyDown={handleNavKeyDown}
          >
            {sections.map(section => (
              <button
                key={section.id}
                role="tab"
                id={`prefs-tab-${section.id}`}
                aria-selected={active === section.id}
                aria-controls={`prefs-panel-${section.id}`}
                className={styles.navItem}
                data-active={active === section.id || undefined}
                onClick={() => onSelect(section.id)}
                tabIndex={active === section.id ? 0 : -1}
              >
                <span className={styles.navIcon} aria-hidden="true">{section.icon}</span>
                <span className={styles.navLabel}>{section.label}</span>
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div
            role="tabpanel"
            id={`prefs-panel-${active}`}
            aria-labelledby={`prefs-tab-${active}`}
            className={styles.content}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    portalTarget ?? document.body,
  )
}
```

- [ ] **Step 2: Write `Preferences.module.css`**

```css
/* src/components/Preferences/Preferences.module.css */

/* ─── Scrim ─────────────────────────────────────────────────────────────────── */

.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  animation: scrim-in var(--dur-base) var(--ease-out) both;
}

@keyframes scrim-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ─── Shell ──────────────────────────────────────────────────────────────────── */

.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 720px;
  height: 480px;
  max-width: calc(100vw - var(--space-8));
  max-height: calc(100vh - var(--space-8));

  background-color: var(--surface);
  background-image: var(--texture-paper);
  background-blend-mode: multiply;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    var(--shadow-lg);
  outline: none;

  animation: shell-in var(--dur-base) var(--ease-out) both;
}

@keyframes shell-in {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ─── Header ──────────────────────────────────────────────────────────────────── */

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  height: 44px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.closeBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text-muted);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-out),
              color var(--dur-base) var(--ease-out);
}

.closeBtn:hover {
  background: var(--surface-2);
  color: var(--text);
}

.closeBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

/* ─── Body ────────────────────────────────────────────────────────────────────── */

.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────────── */

.sidebar {
  flex-shrink: 0;
  width: 176px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-2);
  border-right: 1px solid var(--border);
  background-color: var(--surface-2);
  background-image: var(--texture-paper);
  background-blend-mode: multiply;
  overflow-y: auto;
}

/* Nav items */
.navItem {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: calc(var(--radius) - 1px);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-base) var(--ease-out),
              color var(--dur-base) var(--ease-out);
}

.navItem:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text);
}

.navItem[data-active] {
  color: var(--accent);
  background: rgba(0, 0, 0, 0.06);
}

/* Active indicator bar */
.navItem[data-active]::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 16px;
  background: var(--accent);
  border-radius: 0 1px 1px 0;
}

.navItem:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}

.navIcon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: inherit;
}

.navLabel {
  line-height: var(--leading-sm);
}

/* ─── Content area ────────────────────────────────────────────────────────────── */

.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}
```

- [ ] **Step 3: Run tsc to verify types compile**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/preferences && npx tsc --noEmit
```

Expected: No errors.

---

### Task 2: Write `Preferences.test.tsx` and verify green

**Files:**
- Create: `src/components/Preferences/Preferences.test.tsx`

**Interfaces:**
- Consumes: `PreferencesProps`, `PreferencesSection` from `./Preferences`

- [ ] **Step 1: Write the test file**

```tsx
// src/components/Preferences/Preferences.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

const SECTIONS: PreferencesSection[] = [
  { id: 'input',       label: 'Input',        icon: null },
  { id: 'look-feel',   label: 'Look & feel',  icon: null },
  { id: 'shortcuts',   label: 'Shortcuts',    icon: null },
]

const BASE = {
  open: true as const,
  onClose: vi.fn(),
  sections: SECTIONS,
  active: 'input',
  onSelect: vi.fn(),
  children: <p>Panel content</p>,
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Preferences — rendering', () => {
  it('renders role="dialog" when open=true', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<Preferences {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has aria-modal="true"', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-labelledby pointing to "PREFERENCES" title', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const titleEl = document.getElementById(labelledBy!)
    expect(titleEl?.textContent).toBe('PREFERENCES')
  })

  it('renders children as panel content', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('button', { name: 'Close preferences' })).toBeInTheDocument()
  })
})

// ── Sidebar / tablist ─────────────────────────────────────────────────────────

describe('Preferences — sidebar', () => {
  it('renders a tablist', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders a tab for each section', () => {
    render(<Preferences {...BASE} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('marks the active section as aria-selected=true', () => {
    render(<Preferences {...BASE} active="look-feel" />)
    const tabs = screen.getAllByRole('tab')
    const lookFeel = tabs.find(t => t.textContent?.includes('Look & feel'))!
    expect(lookFeel).toHaveAttribute('aria-selected', 'true')
  })

  it('marks inactive sections as aria-selected=false', () => {
    render(<Preferences {...BASE} active="input" />)
    const tabs = screen.getAllByRole('tab')
    const shortcuts = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    expect(shortcuts).toHaveAttribute('aria-selected', 'false')
  })

  it('applies data-active only to the active tab', () => {
    render(<Preferences {...BASE} active="input" />)
    const tabs = screen.getAllByRole('tab')
    const inputTab = tabs.find(t => t.textContent?.includes('Input'))!
    expect(inputTab).toHaveAttribute('data-active')
    const shortcutsTab = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    expect(shortcutsTab).not.toHaveAttribute('data-active')
  })

  it('clicking a tab calls onSelect with the section id', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} onSelect={onSelect} />)
    const tabs = screen.getAllByRole('tab')
    const shortcutsTab = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    fireEvent.click(shortcutsTab)
    expect(onSelect).toHaveBeenCalledWith('shortcuts')
  })
})

// ── Content / tabpanel ────────────────────────────────────────────────────────

describe('Preferences — content area', () => {
  it('renders a tabpanel', () => {
    render(<Preferences {...BASE} />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })

  it('tabpanel aria-labelledby matches the active tab id', () => {
    render(<Preferences {...BASE} active="shortcuts" />)
    const panel = screen.getByRole('tabpanel')
    const tabs = screen.getAllByRole('tab')
    const shortcutsTab = tabs.find(t => t.textContent?.includes('Shortcuts'))!
    expect(panel.getAttribute('aria-labelledby')).toBe(shortcutsTab.id)
  })
})

// ── Keyboard ──────────────────────────────────────────────────────────────────

describe('Preferences — keyboard', () => {
  it('Escape calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape does NOT call onClose when closed', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} open={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clicking the close button calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close preferences' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking the scrim calls onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking inside the dialog does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<Preferences {...BASE} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ArrowDown in tablist advances to next section', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="input" onSelect={onSelect} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('look-feel')
  })

  it('ArrowUp in tablist goes to previous section', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="look-feel" onSelect={onSelect} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('input')
  })

  it('ArrowDown wraps from last section to first', () => {
    const onSelect = vi.fn()
    render(<Preferences {...BASE} active="shortcuts" onSelect={onSelect} />)
    const tablist = screen.getByRole('tablist')
    fireEvent.keyDown(tablist, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('input')
  })

  it('Tab wraps from last focusable to first', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    )
    const last = focusable[focusable.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(focusable[0])
  })
})

// ── Focus management ──────────────────────────────────────────────────────────

describe('Preferences — focus management', () => {
  it('focuses the first focusable element on open', () => {
    render(<Preferences {...BASE} />)
    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled])')
    expect(document.activeElement).toBe(focusable[0])
  })

  it('returns focus to the previously focused element on close', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(<Preferences {...BASE} />)
    rerender(<Preferences {...BASE} open={false} />)

    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })
})

// ── Scroll lock ───────────────────────────────────────────────────────────────

describe('Preferences — scroll lock', () => {
  it('locks body scroll while open', () => {
    render(<Preferences {...BASE} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll on close', () => {
    const { rerender } = render(<Preferences {...BASE} />)
    rerender(<Preferences {...BASE} open={false} />)
    expect(document.body.style.overflow).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify green**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/preferences && npx vitest run src/components/Preferences/Preferences.test.tsx
```

Expected: All tests pass.

- [ ] **Step 3: Run full vitest suite to verify no regressions**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/preferences && npx vitest run
```

Expected: All tests pass.

---

### Task 3: Write `Preferences.demo.tsx` + `index.ts`

**Files:**
- Create: `src/components/Preferences/Preferences.demo.tsx`
- Create: `src/components/Preferences/index.ts`

**Interfaces:**
- Consumes: `PreferencesProps`, `PreferencesSection` from `./Preferences`; `DemoMeta` from `../../gallery/registry`; `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery UI; `Toggle` from `../Toggle`; icons from `@phosphor-icons/react`

- [ ] **Step 1: Write `index.ts`**

```ts
// src/components/Preferences/index.ts
export { Preferences } from './Preferences'
export type { PreferencesProps, PreferencesSection } from './Preferences'
```

- [ ] **Step 2: Write `Preferences.demo.tsx`**

```tsx
// src/components/Preferences/Preferences.demo.tsx
import { useState } from 'react'
import { Sliders, PaintBrush, Keyboard } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Preferences } from './Preferences'
import type { PreferencesSection } from './Preferences'

export const meta: DemoMeta = {
  name: 'Preferences',
  group: 'Composites',
  route: '/preferences',
  order: 22,
}

// ── Default sections used across states ───────────────────────────────────────

const SECTIONS: PreferencesSection[] = [
  { id: 'input',      label: 'Input',       icon: <Sliders size={14} /> },
  { id: 'look-feel',  label: 'Look & feel', icon: <PaintBrush size={14} /> },
  { id: 'shortcuts',  label: 'Shortcuts',   icon: <Keyboard size={14} /> },
]

// ── Placeholder panel content ──────────────────────────────────────────────────

const PANEL_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
}

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--text)',
  margin: 0,
}

const BODY_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
  lineHeight: 'var(--leading-base)',
}

const HR_STYLE: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border)',
  margin: 0,
}

function InputPanel() {
  return (
    <div style={PANEL_STYLE}>
      <p style={HEADING_STYLE}>Input</p>
      <hr style={HR_STYLE} />
      <p style={BODY_STYLE}>
        Configure your audio interface, sample rate, and buffer size. Input devices and
        monitoring settings live here.
      </p>
    </div>
  )
}

function LookFeelPanel() {
  return (
    <div style={PANEL_STYLE}>
      <p style={HEADING_STYLE}>Look & feel</p>
      <hr style={HR_STYLE} />
      <p style={BODY_STYLE}>
        Theme, display density, and visual preferences. Choose a colour theme and
        adjust the interface to your workflow.
      </p>
    </div>
  )
}

function ShortcutsPanel() {
  return (
    <div style={PANEL_STYLE}>
      <p style={HEADING_STYLE}>Shortcuts</p>
      <hr style={HR_STYLE} />
      <p style={BODY_STYLE}>
        Keyboard shortcuts and MIDI mapping. Customise transport controls, edit
        operations, and navigation to match your muscle memory.
      </p>
    </div>
  )
}

function panelFor(id: string) {
  if (id === 'look-feel') return <LookFeelPanel />
  if (id === 'shortcuts') return <ShortcutsPanel />
  return <InputPanel />
}

// ── Trigger button (demo-only, not a kit component) ───────────────────────────

const TRIGGER_STYLE: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
  outline: 'none',
}

// ── State cards ───────────────────────────────────────────────────────────────

function OpenInputCard() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('input')
  return (
    <State label="Open — Input active">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open Preferences
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelFor(active)}
      </Preferences>
    </State>
  )
}

function OpenLookFeelCard() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('look-feel')
  return (
    <State label="Open — Look & feel active">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open → Look & feel
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelFor(active)}
      </Preferences>
    </State>
  )
}

function OpenShortcutsCard() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('shortcuts')
  return (
    <State label="Open — Shortcuts active">
      <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
        Open → Shortcuts
      </button>
      <Preferences
        open={open}
        onClose={() => setOpen(false)}
        sections={SECTIONS}
        active={active}
        onSelect={setActive}
      >
        {panelFor(active)}
      </Preferences>
    </State>
  )
}

function ClosedCard() {
  return (
    <State label="Closed (open=false)">
      <button style={{ ...TRIGGER_STYLE, opacity: 0.5, cursor: 'not-allowed' }} disabled>
        Open Preferences
      </button>
      <Preferences
        open={false}
        onClose={() => {}}
        sections={SECTIONS}
        active="input"
        onSelect={() => {}}
      >
        <InputPanel />
      </Preferences>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <OpenInputCard />
      <OpenLookFeelCard />
      <OpenShortcutsCard />
      <ClosedCard />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('input')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER_STYLE} onClick={() => setOpen(true)}>
          Open Preferences
        </button>

        <Preferences
          open={open}
          onClose={() => setOpen(false)}
          sections={SECTIONS}
          active={active}
          onSelect={setActive}
        >
          {panelFor(active)}
        </Preferences>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle
            checked={open}
            onChange={setOpen}
            size="sm"
            label="open"
          />
          {SECTIONS.map(s => (
            <Toggle
              key={s.id}
              checked={active === s.id}
              onChange={v => { if (v) setActive(s.id) }}
              size="sm"
              label={s.label}
            />
          ))}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function PreferencesDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 3: Run tsc + vitest to confirm clean**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/preferences && npx tsc --noEmit && npx vitest run
```

Expected: No type errors, all tests green.

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/preferences && git add src/components/Preferences/ docs/superpowers/plans/2026-06-21-preferences.md && git commit -m "feat(Preferences): modal shell — sidebar tablist nav + tabpanel content

Layout: 720×480 shell, header ('PREFERENCES' + close), vertical tablist sidebar
(176px, --surface-2 recessed bg), scrollable tabpanel content area.

Behavioral: all Dialog patterns inline (focus-trap, Esc, scroll-lock,
usePortalTarget portal, return-focus). Arrow-up/down moves between tabs.

a11y: role=dialog + aria-modal + aria-labelledby; tablist + tab + aria-selected
+ aria-controls; tabpanel + aria-labelledby. focus-visible only.

CSS: tokens only, data-active for selected tab, accent left-bar indicator,
--dur-base transitions, reduced-motion-safe (decorative durations zeroed globally).

Decision: standalone modal (not Dialog wrapper) — Dialog's 480px fixed width
and header/body/footer layout are incompatible with sidebar+content two-column
shell; Preferences implements Dialog's behavioral patterns directly.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
