# LookAndFeelPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `LookAndFeelPanel` component — the Preferences > Look & Feel theme gallery — that renders a vertical list of theme cards with color-swatch previews and live theme switching.

**Architecture:** A single composite component (no sub-components) that accepts `themes`, `active`, and `onSelect` as props, renders them as a `role="radiogroup"` / `role="radio"` card list, and composes directly with the gallery's existing `useTheme()` / `setTheme` context in its demo. Swatch colors are applied via inline `style` using the theme's raw token values (each card reflects a different theme, so CSS vars from the active theme cannot be used).

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + React Testing Library, `@phosphor-icons/react`, existing `ThemeProvider` context.

## Global Constraints

- Tokens only for structural/spacing/color in the *component's own surface* — no hardcoded hex values for chrome.
- `data-*` attributes for state, CSS targets them — no className juggling.
- File structure: `X.tsx`, `X.module.css`, `X.test.tsx`, `X.demo.tsx`, `index.ts` under `src/components/LookAndFeelPanel/`.
- Tests use `fireEvent`, NOT `userEvent`.
- `npx tsc --noEmit`, `npx vitest run`, lint must all be green.
- Sizes `sm`/`md` — this panel has only one visual variant (no size prop needed per spec; don't add what the spec doesn't ask for).
- Keyboard: roving `tabIndex` pattern for radio group (arrow keys navigate, Enter/Space selects).
- `:focus-visible` only, never `:focus`.
- The gallery auto-registers via `import.meta.glob` — no manual registry edits.
- All states in the gallery demo; verify in 3+ themes including a light one.

---

### Task 1: Component + CSS Module

**Files:**
- Create: `src/components/LookAndFeelPanel/LookAndFeelPanel.tsx`
- Create: `src/components/LookAndFeelPanel/LookAndFeelPanel.module.css`
- Create: `src/components/LookAndFeelPanel/index.ts`

**Interfaces:**
- Consumes: `ThemeMeta`, `ThemeId` from `../../tokens/types`; `THEMES` from `../../tokens/themes` (in demo only)
- Produces: `LookAndFeelPanel({ themes, active, onSelect })`, `LookAndFeelPanelProps`

**Design decisions locked in:**
- Swatches: 5 tokens — `--bg`, `--surface-2`, `--accent`, `--led-cyan`, `--stage`. These are applied as `style={{ background: theme.tokens['--bg'] }}` etc. on each swatch `<span>` — NOT as CSS vars, because each card reflects a *different* theme's tokens.
- Selected state: `data-selected` attribute on the card button; accent-colored 1px border + light surface background.
- Keyboard: roving `tabIndex` (selected card = `0`, others = `-1`). ArrowDown/Up moves focus + calls `onSelect`. Enter/Space calls `onSelect` on focused card.
- Layout: each card = `display:flex; align-items:center` — [swatches pill | name | checkmark].
- Checkmark: `CheckCircle` from `@phosphor-icons/react` at 14px, shown only when `data-selected`.
- Footer stub: empty `<div className={styles.footer}>` for future toggles.
- `role="radiogroup"` on the scroll container; `role="radio"` + `aria-checked` on each card button.

- [ ] **Step 1: Write `LookAndFeelPanel.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `LookAndFeelPanel.module.css`**

```css
/* src/components/LookAndFeelPanel/LookAndFeelPanel.module.css */

.root {
  display: flex;
  flex-direction: column;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2);
  overflow-y: auto;
  max-height: 360px;
}

.card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  transition:
    background var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.card:hover {
  background: var(--surface-2);
}

.card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.card[data-selected] {
  border-color: var(--accent);
  background: var(--surface);
}

.swatches {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.swatch {
  display: block;
  width: 14px;
  height: 22px;
}

.name {
  flex: 1;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check {
  width: 14px;
  height: 14px;
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Reserve space for future appearance toggles */
.footer {
  min-height: var(--space-8);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

- [ ] **Step 3: Write `index.ts`**

```ts
// src/components/LookAndFeelPanel/index.ts
export { LookAndFeelPanel } from './LookAndFeelPanel'
export type { LookAndFeelPanelProps } from './LookAndFeelPanel'
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

### Task 2: Tests

**Files:**
- Create: `src/components/LookAndFeelPanel/LookAndFeelPanel.test.tsx`

**Interfaces:**
- Consumes: `LookAndFeelPanel`, `LookAndFeelPanelProps` from `./LookAndFeelPanel`; `THEMES` from `../../tokens/themes`; `ThemeId` from `../../tokens/types`

- [ ] **Step 1: Write the test file**

```tsx
// src/components/LookAndFeelPanel/LookAndFeelPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { THEMES } from '../../tokens/themes'
import { LookAndFeelPanel } from './LookAndFeelPanel'

const THREE = THEMES.slice(0, 3) // chroma, default, bowie

// ── Rendering ────────────────────────────────────────────────────────────────

describe('LookAndFeelPanel rendering', () => {
  it('renders a radiogroup', () => {
    const { getByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders one radio button per theme', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getAllByRole('radio')).toHaveLength(3)
  })

  it('active card has aria-checked="true"', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="default" onSelect={() => {}} />,
    )
    // default is index 1 in THREE
    expect(getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('non-active cards have aria-checked="false"', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    const cards = getAllByRole('radio')
    expect(cards[1]).toHaveAttribute('aria-checked', 'false')
    expect(cards[2]).toHaveAttribute('aria-checked', 'false')
  })

  it('active card has data-selected attribute', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getAllByRole('radio')[0]).toHaveAttribute('data-selected')
  })

  it('non-active cards lack data-selected', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    const cards = getAllByRole('radio')
    expect(cards[1]).not.toHaveAttribute('data-selected')
    expect(cards[2]).not.toHaveAttribute('data-selected')
  })

  it('renders theme names as text', () => {
    const { getByText } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getByText('Chroma')).toBeInTheDocument()
    expect(getByText('Default')).toBeInTheDocument()
    expect(getByText('Bowie')).toBeInTheDocument()
  })

  it('active card has tabIndex 0', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getAllByRole('radio')[0]).toHaveAttribute('tabindex', '0')
  })

  it('non-active cards have tabIndex -1', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    const cards = getAllByRole('radio')
    expect(cards[1]).toHaveAttribute('tabindex', '-1')
    expect(cards[2]).toHaveAttribute('tabindex', '-1')
  })

  it('renders with all THEMES without error', () => {
    expect(() =>
      render(<LookAndFeelPanel themes={THEMES} active="chroma" onSelect={() => {}} />),
    ).not.toThrow()
  })
})

// ── Interaction ──────────────────────────────────────────────────────────────

describe('LookAndFeelPanel interaction', () => {
  it('clicking a non-active card calls onSelect with its id', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.click(getAllByRole('radio')[1])
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('clicking the active card still calls onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.click(getAllByRole('radio')[0])
    expect(onSelect).toHaveBeenCalledWith('chroma')
  })

  it('ArrowDown from index 0 calls onSelect with next theme id', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[0], { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('ArrowDown from last index wraps to first', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="bowie" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[2], { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('chroma')
  })

  it('ArrowUp from index 0 wraps to last', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[0], { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('bowie')
  })

  it('ArrowUp from index 2 calls onSelect with index 1', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="bowie" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[2], { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('Enter key calls onSelect with focused card theme', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="default" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[1], { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('Space key calls onSelect with focused card theme', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="default" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[1], { key: ' ' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('unrelated key does not call onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[0], { key: 'Tab' })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run src/components/LookAndFeelPanel/LookAndFeelPanel.test.tsx`
Expected: all tests PASS.

- [ ] **Step 3: Run full vitest suite**

Run: `npx vitest run`
Expected: all tests PASS (existing tests must stay green).

---

### Task 3: Gallery Demo

**Files:**
- Create: `src/components/LookAndFeelPanel/LookAndFeelPanel.demo.tsx`

**Interfaces:**
- Consumes: `LookAndFeelPanel` from `./LookAndFeelPanel`; `THEMES` from `../../tokens/themes`; `useTheme` from `../../theme/ThemeProvider`; gallery primitives from `../../gallery/registry`, `../../gallery/ui/*`

- [ ] **Step 1: Write the demo**

```tsx
// src/components/LookAndFeelPanel/LookAndFeelPanel.demo.tsx
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { THEMES } from '../../tokens/themes'
import { useTheme } from '../../theme/ThemeProvider'
import { LookAndFeelPanel } from './LookAndFeelPanel'

export const meta: DemoMeta = {
  name: 'LookAndFeelPanel',
  group: 'Composites',
  route: '/look-and-feel-panel',
  order: 60,
}

// ── State cards ───────────────────────────────────────────────────────────────

function DefaultGallery() {
  return (
    <State label="Gallery — Chroma selected">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 6)}
        active="chroma"
        onSelect={() => {}}
      />
    </State>
  )
}

function OtherSelected() {
  return (
    <State label="Nocturne selected">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 6)}
        active="nocturne"
        onSelect={() => {}}
      />
    </State>
  )
}

function ScrollState() {
  return (
    <State label="Scroll — all 15 themes">
      <LookAndFeelPanel
        themes={THEMES}
        active="chroma"
        onSelect={() => {}}
      />
    </State>
  )
}

function SingleTheme() {
  return (
    <State label="Single theme">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 1)}
        active="chroma"
        onSelect={() => {}}
      />
    </State>
  )
}

function DarkThemeSelected() {
  return (
    <State label="Dark theme selected (Bowie)">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 6)}
        active="bowie"
        onSelect={() => {}}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <DefaultGallery />
      <OtherSelected />
      <DarkThemeSelected />
      <ScrollState />
      <SingleTheme />
    </StatesGrid>
  )
}

// ── Playground — live theme switching ────────────────────────────────────────

function PlaygroundDemo() {
  const { theme, setTheme } = useTheme()
  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <LookAndFeelPanel
          themes={THEMES}
          active={theme}
          onSelect={setTheme}
        />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
          }}
        >
          active: {theme}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function LookAndFeelPanelDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: zero errors.

---

### Task 4: Final green bar + commit

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LookAndFeelPanel/
git commit -m "feat(LookAndFeelPanel): theme gallery with swatch cards + live select

Composites panel — Preferences > Look & Feel.

Design decisions:
- role=radiogroup/radio for a11y; roving tabIndex pattern for arrow-key nav.
- Swatches use 5 key tokens (--bg, --surface-2, --accent, --led-cyan, --stage)
  applied as inline style.background so each card reflects its own theme's colors,
  not the active theme's CSS vars.
- CheckCircle (fill, 14px) from @phosphor-icons/react for the selected checkmark.
- data-selected drives CSS; no className toggling.
- Footer stub reserves space for future appearance toggles (reduced motion, font scale).
- Demo's Playground composes useTheme() to drive live theme switching in the gallery."
```
