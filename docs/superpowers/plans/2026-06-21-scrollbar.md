# ScrollArea Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `ScrollArea` component that replaces the browser scrollbar with a Chroma-themed recessed track + warm tactile thumb, usable for both timeline (horizontal) and general app scroll (vertical/horizontal).

**Architecture:** Style native `::-webkit-scrollbar` pseudo-elements (safe in WKWebView/WebKit) so scroll behavior, keyboard, and wheel a11y come for free. Expose as a `ScrollArea` wrapper `<div>` whose `data-*` attributes drive all visual state from CSS only (no class juggling). Auto-hide is the only stateful piece: a scroll listener sets/clears `data-scrolling` via a 1.2 s debounce timer, which CSS uses to fade the thumb.

**Tech Stack:** React 19, CSS Modules, `::-webkit-scrollbar` pseudo-elements, no animation library.

## Global Constraints

- Tokens only — no hardcoded colors; every surface token must resolve in Chroma light AND dark.
- CSS Modules; `data-*` attributes for all stateful CSS targets (no class juggling).
- `fireEvent` in tests, NOT `userEvent`.
- Sizes `sm` / `md` only (default `md`).
- `:focus-visible` only (never `:focus`).
- `tsc --noEmit` + `vitest run` + lint green before committing.
- Gallery auto-registered via `import.meta.glob` — no registry edits.
- Dogfood playground controls from kit `Toggle`.

---

### Task 1: Component + CSS scaffold (ScrollArea.tsx + ScrollArea.module.css)

**Files:**
- Create: `src/components/ScrollArea/ScrollArea.tsx`
- Create: `src/components/ScrollArea/ScrollArea.module.css`

**Interfaces:**
- Produces: `ScrollArea({ orientation?, size?, autoHide?, children, className?, style? }): JSX.Element`
- Produces: `ScrollAreaProps` interface exported from the same file

- [ ] **Step 1: Create `ScrollArea.tsx`**

```tsx
// src/components/ScrollArea/ScrollArea.tsx
import { useEffect, useRef } from 'react'
import styles from './ScrollArea.module.css'

export interface ScrollAreaProps {
  orientation?: 'vertical' | 'horizontal' | 'both'
  size?: 'sm' | 'md'
  autoHide?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ScrollArea({
  orientation = 'vertical',
  size = 'md',
  autoHide = false,
  children,
  className,
  style,
}: ScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleScroll() {
    if (!autoHide) return
    const el = rootRef.current
    if (!el) return
    el.dataset.scrolling = ''
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (rootRef.current) delete rootRef.current.dataset.scrolling
    }, 1200)
  }

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      data-orientation={orientation}
      data-size={size}
      data-auto-hide={autoHide || undefined}
      onScroll={handleScroll}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create `ScrollArea.module.css`**

```css
/* src/components/ScrollArea/ScrollArea.module.css */

/* ─── Container ─────────────────────────────────────────────────────────── */

.root {
  /* Prevent block-level shrink-wrapping problems */
  min-width: 0;
  min-height: 0;
}

/* Overflow per orientation */
.root[data-orientation='vertical']   { overflow-y: auto; overflow-x: hidden; }
.root[data-orientation='horizontal'] { overflow-x: auto; overflow-y: hidden; }
.root[data-orientation='both']       { overflow: auto; }

/* ─── Scrollbar size ────────────────────────────────────────────────────── */

.root[data-size='md']::-webkit-scrollbar { width: 8px; height: 8px; }
.root[data-size='sm']::-webkit-scrollbar { width: 6px; height: 6px; }

/* ─── Track (recessed groove — same well recipe as Fader channel) ───────── */

.root::-webkit-scrollbar-track {
  background: var(--stage);
  border-radius: 999px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--border);
}

/* ─── Thumb (warm, grippable — fader-cap family) ───────────────────────── */

/*
  border: transparent + background-clip: padding-box creates a visual inset gap
  between the thumb and the track walls without a real border color.
  Reducing border-width on hover/active widens the thumb tactilely.
*/

.root::-webkit-scrollbar-thumb {
  background-color: var(--surface-2);
  /* Catch-light: same top-left highlight recipe as Toggle knob / Fader cap */
  background-image: radial-gradient(
    circle at 40% 30%,
    rgba(255, 255, 255, 0.22),
    transparent 55%
  );
  background-clip: padding-box;
  border: 2px solid transparent;
  border-radius: 999px;
  transition:
    background-color var(--dur-base) var(--ease-out),
    border-width     var(--dur-base) var(--ease-out);
}

/* Hover: brighten + widen */
.root::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-dim);
  border-width: 1px;
}

/* Active/dragging: pressed down — darker, full width, dimmer highlight */
.root::-webkit-scrollbar-thumb:active {
  background-color: var(--text-muted);
  border-width: 1px;
  background-image: radial-gradient(
    circle at 40% 30%,
    rgba(255, 255, 255, 0.10),
    transparent 55%
  );
}

/* ─── Corner (where both bars meet) ─────────────────────────────────────── */

.root::-webkit-scrollbar-corner {
  background: var(--stage);
}

/* ─── Auto-hide: fade out when idle ────────────────────────────────────── */

/*
  When [data-auto-hide] is on and neither [data-scrolling] nor :hover,
  make the thumb invisible. The transition on the base .root::-webkit-scrollbar-thumb
  rule drives the fade in both directions.
  Under prefers-reduced-motion, --dur-base is 0ms → thumb snaps (no decorative fade).
*/
.root[data-auto-hide]:not([data-scrolling]):not(:hover)::-webkit-scrollbar-thumb {
  background-color: transparent;
  background-image: none;
  border-width: 2px;
}
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/scrollbar && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to ScrollArea).

---

### Task 2: Tests (ScrollArea.test.tsx)

**Files:**
- Create: `src/components/ScrollArea/ScrollArea.test.tsx`

**Interfaces:**
- Consumes: `ScrollArea` from `./ScrollArea`
- Consumes: `ScrollAreaProps` interface

- [ ] **Step 1: Create `ScrollArea.test.tsx`**

```tsx
// src/components/ScrollArea/ScrollArea.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { ScrollArea } from './ScrollArea'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('ScrollArea rendering', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ScrollArea><p>content</p></ScrollArea>
    )
    expect(getByText('content')).toBeInTheDocument()
  })

  it('data-orientation="vertical" by default', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('data-orientation reflects prop', () => {
    const { container } = render(
      <ScrollArea orientation="horizontal"><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('data-orientation="both" when prop="both"', () => {
    const { container } = render(
      <ScrollArea orientation="both"><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveAttribute('data-orientation', 'both')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<ScrollArea size="sm"><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('no data-auto-hide when autoHide=false (default)', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    expect(container.firstChild).not.toHaveAttribute('data-auto-hide')
  })

  it('data-auto-hide present when autoHide=true', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-auto-hide')
  })

  it('forwards className', () => {
    const { container } = render(
      <ScrollArea className="extra"><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveClass('extra')
  })

  it('forwards style', () => {
    const { container } = render(
      <ScrollArea style={{ height: '200px' }}><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveStyle({ height: '200px' })
  })
})

// ─── Auto-hide scroll handling ───────────────────────────────────────────────

describe('ScrollArea auto-hide', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('scroll fires: data-scrolling appears when autoHide=true', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    expect(el).toHaveAttribute('data-scrolling')
  })

  it('scroll fires: data-scrolling cleared after 1200ms', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    expect(el).toHaveAttribute('data-scrolling')
    act(() => { vi.advanceTimersByTime(1200) })
    expect(el).not.toHaveAttribute('data-scrolling')
  })

  it('scroll fires: timer resets on each scroll event', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    act(() => { vi.advanceTimersByTime(800) })
    // Fire scroll again — resets the 1200ms timer
    fireEvent.scroll(el)
    act(() => { vi.advanceTimersByTime(800) })
    // Only 800ms since the last scroll — still scrolling
    expect(el).toHaveAttribute('data-scrolling')
    act(() => { vi.advanceTimersByTime(500) })
    // Now 1300ms since last scroll — timer should have fired
    expect(el).not.toHaveAttribute('data-scrolling')
  })

  it('scroll does NOT set data-scrolling when autoHide=false', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    expect(el).not.toHaveAttribute('data-scrolling')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/scrollbar && npx vitest run src/components/ScrollArea/ScrollArea.test.tsx 2>&1
```

Expected: all tests PASS.

---

### Task 3: Index + Demo (index.ts + ScrollArea.demo.tsx)

**Files:**
- Create: `src/components/ScrollArea/index.ts`
- Create: `src/components/ScrollArea/ScrollArea.demo.tsx`

**Interfaces:**
- Consumes: `ScrollArea`, `ScrollAreaProps` from `./ScrollArea`
- Consumes: `DemoMeta` from `../../gallery/registry`
- Consumes: `DemoShell` from `../../gallery/ui/DemoShell`
- Consumes: `StatesGrid`, `State` from `../../gallery/ui/StatesGrid`
- Consumes: `Playground` from `../../gallery/ui/Playground`
- Consumes: `Toggle` from `../Toggle`

- [ ] **Step 1: Create `index.ts`**

```ts
// src/components/ScrollArea/index.ts
export { ScrollArea } from './ScrollArea'
export type { ScrollAreaProps } from './ScrollArea'
```

- [ ] **Step 2: Create `ScrollArea.demo.tsx`**

```tsx
// src/components/ScrollArea/ScrollArea.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ScrollArea } from './ScrollArea'

export const meta: DemoMeta = {
  name: 'ScrollArea',
  group: 'Primitives',
  route: '/scroll-area',
  order: 72,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Tall content for vertical overflow demo */
function TallContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            height: 28,
            background: 'var(--surface-2)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            paddingInline: 'var(--space-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          Track {String(i + 1).padStart(2, '0')}
        </div>
      ))}
    </div>
  )
}

/** Wide content for horizontal overflow demo */
function WideContent() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-1) 0' }}>
      {Array.from({ length: 32 }, (_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: 48,
            height: 40,
            background: 'var(--surface-2)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}

/** Content that fits — no scrollbar should appear */
function ShortContent() {
  return (
    <div style={{ padding: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
      Short content — no overflow, no scrollbar.
    </div>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Vertical (default)">
        <ScrollArea style={{ height: 120, width: 160 }}>
          <TallContent />
        </ScrollArea>
      </State>

      <State label="Horizontal (timeline)">
        <ScrollArea orientation="horizontal" style={{ width: 200, height: 56 }}>
          <WideContent />
        </ScrollArea>
      </State>

      <State label="Both axes">
        <ScrollArea orientation="both" style={{ width: 200, height: 120 }}>
          <div style={{ width: 400 }}>
            <TallContent />
          </div>
        </ScrollArea>
      </State>

      <State label="Auto-hide (hover to reveal)">
        <ScrollArea autoHide style={{ height: 120, width: 160 }}>
          <TallContent />
        </ScrollArea>
      </State>

      <State label="Size sm">
        <ScrollArea size="sm" style={{ height: 120, width: 160 }}>
          <TallContent />
        </ScrollArea>
      </State>

      <State label="Short content (no bar)">
        <ScrollArea style={{ height: 120, width: 160, border: '1px solid var(--border)' }}>
          <ShortContent />
        </ScrollArea>
      </State>

      {/* Hover/drag states are demonstrated by the live instances — user interacts */}
      <State label="Hover thumb (interact above)">
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', padding: 'var(--space-2)' }}>
          Hover the scrollbar thumb in any instance above to see it brighten and widen.
        </div>
      </State>

      <State label="Drag thumb (interact above)">
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', padding: 'var(--space-2)' }}>
          Click and drag a thumb to see the pressed/active state.
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | 'both'>('vertical')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [autoHide, setAutoHide] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Live instance */}
        <ScrollArea
          orientation={orientation}
          size={size}
          autoHide={autoHide}
          style={
            orientation === 'horizontal'
              ? { width: 240, height: 56 }
              : { width: 200, height: 160 }
          }
        >
          {orientation === 'horizontal' ? <WideContent /> : <TallContent />}
        </ScrollArea>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={autoHide}
            onChange={setAutoHide}
            size="sm"
            label="autoHide"
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            orientation
            <select
              value={orientation}
              onChange={e => setOrientation(e.target.value as typeof orientation)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="vertical">vertical</option>
              <option value="horizontal">horizontal</option>
              <option value="both">both</option>
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (8px)</option>
              <option value="sm">sm (6px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ScrollAreaDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 3: Run full test suite + tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/scrollbar && npx tsc --noEmit 2>&1 | head -20 && npx vitest run 2>&1 | tail -20
```

Expected: `0 errors` from tsc, all vitest tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/scrollbar
git add src/components/ScrollArea/
git commit -m "feat(ScrollArea): Chroma scrollbar — recessed track + warm grippable thumb

v1 via ::-webkit-scrollbar (WebKit/WKWebView native, keeps scroll/keyboard
a11y for free). Track = --stage recessed well (same inset shadow recipe as
Fader channel). Thumb = --surface-2 warm neutral + radial catch-light
(same family as Toggle knob / Fader cap). Hover widens + brightens via
border-width trick (transparent border creates visual gap; shrinking it
on hover tactilely widens the thumb). Active = darker/pressed.
Auto-hide: data-scrolling toggled by scroll listener + 1.2s debounce;
:hover also reveals. --dur-base → 0ms under prefers-reduced-motion so
fade becomes instant snap (decorative only).

Decision: orientation='both' sets overflow:auto so both bars appear only
when content overflows on each axis (native behavior). Corner uses --stage
to match track. No JS-driven overlay for v1 (deferred per spec).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
