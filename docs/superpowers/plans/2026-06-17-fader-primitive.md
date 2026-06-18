# Fader Primitive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Fader` primitive to the Jackdaw UI Kit and replace native `<input type="range">` elements in the gallery with Fader instances, starting with the PanKnob playground.

**Architecture:** Fader is composed of a DOM well/fill track (stretches to any length) plus a CSS-detailed cap (knurled repeating-gradient + contrast pointer via `::after`). A `FaderScale` interface holds value↔position mapping and default formatter, keeping all taper logic outside the component. Reset and detent-snap animate via `useSpring` on position×100 (pixel-scale for spring epsilon compatibility). Pointer drag is relative from drag-start; well-click first jumps the cap. Non-passive wheel listener attaches once via ref, reading value/onChange from mutable refs to avoid the PanKnob re-attach bug.

**Tech Stack:** React 19, TypeScript, CSS Modules, CSS custom properties (tokens), `useSpring` from `src/motion/spring.ts`, Vitest + @testing-library/react, Vite with `import.meta.glob` for demo discovery.

## Global Constraints

- Tokens only — no hardcoded colors or sizes; all colors via `var(--token-name)`
- CSS Modules only — no Tailwind, no CSS-in-JS
- Fonts: `var(--font-display)`, `var(--font-ui)`, `var(--font-mono)`
- Motion: CSS transitions for state, `useSpring` for reset/detent-snap (spring on position×100)
- Non-passive wheel: attach once via ref, `[value,onChange]` NOT in deps — read from refs inside listener
- `typecheck` and `test` must be green before each commit
- Demo auto-discovered via `import.meta.glob` — create `Fader.demo.tsx`, no registry edits needed
- Spring unit contract: spring values must be in ~pixel-scale range; multiply position 0..1 by 100

---

### Task 1: Scale helpers and pure utilities

**Files:**
- Create: `src/components/Fader/faderScales.ts`
- Create: `src/components/Fader/Fader.test.tsx` (utility section; rendering/interaction tests added in later tasks)

**Interfaces:**
- Produces: `FaderScale` (interface), `clamp`, `linearScale`, `dbScale`, `quantizeValue` — all exported from `faderScales.ts`. Every later task imports these exact names.

- [ ] **Step 1: Create `Fader.test.tsx` with scale utility tests**

```typescript
// src/components/Fader/Fader.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clamp, linearScale, dbScale, quantizeValue } from './faderScales'

// ─── clamp ───────────────────────────────────────────────────────────────────

describe('clamp', () => {
  it('returns value within range', () => expect(clamp(0.5, 0, 1)).toBe(0.5))
  it('clamps below min',           () => expect(clamp(-0.1, 0, 1)).toBe(0))
  it('clamps above max',           () => expect(clamp(1.1, 0, 1)).toBe(1))
  it('returns min exactly',        () => expect(clamp(0, 0, 1)).toBe(0))
  it('returns max exactly',        () => expect(clamp(1, 0, 1)).toBe(1))
})

// ─── linearScale ─────────────────────────────────────────────────────────────

describe('linearScale.toPosition', () => {
  const s = linearScale()
  it('min → 0',            () => expect(s.toPosition(0, 0, 1)).toBeCloseTo(0))
  it('max → 1',            () => expect(s.toPosition(1, 0, 1)).toBeCloseTo(1))
  it('midpoint → 0.5',     () => expect(s.toPosition(0.5, 0, 1)).toBeCloseTo(0.5))
  it('works for dB range', () => expect(s.toPosition(-30, -60, 6)).toBeCloseTo(0.4545, 3))
})

describe('linearScale.toValue', () => {
  const s = linearScale()
  it('position 0 → min',   () => expect(s.toValue(0, 0, 1)).toBeCloseTo(0))
  it('position 1 → max',   () => expect(s.toValue(1, 0, 1)).toBeCloseTo(1))
  it('position 0.5 → mid', () => expect(s.toValue(0.5, 0, 1)).toBeCloseTo(0.5))
  it('round-trips',        () => {
    const v = 0.312
    expect(s.toValue(s.toPosition(v, 0, 1), 0, 1)).toBeCloseTo(v, 10)
  })
})

describe('linearScale.defaultFormat', () => {
  const s = linearScale()
  it('formats 0.5 → "0.50"', () => expect(s.defaultFormat(0.5)).toBe('0.50'))
  it('formats 1   → "1.00"', () => expect(s.defaultFormat(1)).toBe('1.00'))
})

// ─── dbScale ─────────────────────────────────────────────────────────────────

describe('dbScale with defaults { min:-60, max:6, unityAt:0.75 }', () => {
  const s = dbScale()
  it('0 dB (unity) → position ≈ 0.75', () => expect(s.toPosition(0, -60, 6)).toBeCloseTo(0.75, 5))
  it('-60 dB → position 0',            () => expect(s.toPosition(-60, -60, 6)).toBeCloseTo(0))
  it('6 dB → position 1',             () => expect(s.toPosition(6, -60, 6)).toBeCloseTo(1))
  it('-30 dB → position ≈ 0.375',     () => expect(s.toPosition(-30, -60, 6)).toBeCloseTo(0.375, 5))
  it('position 0 → -60 dB',           () => expect(s.toValue(0, -60, 6)).toBeCloseTo(-60))
  it('position 1 → 6 dB',            () => expect(s.toValue(1, -60, 6)).toBeCloseTo(6))
  it('position 0.75 → 0 dB',         () => expect(s.toValue(0.75, -60, 6)).toBeCloseTo(0))
  it('round-trips unity',             () => {
    expect(s.toValue(s.toPosition(0, -60, 6), -60, 6)).toBeCloseTo(0, 5)
  })
  it('round-trips -30 dB', () => {
    expect(s.toValue(s.toPosition(-30, -60, 6), -60, 6)).toBeCloseTo(-30, 5)
  })
  it('round-trips 3 dB', () => {
    expect(s.toValue(s.toPosition(3, -60, 6), -60, 6)).toBeCloseTo(3, 5)
  })
})

describe('dbScale.defaultFormat', () => {
  const s = dbScale()
  it('-60 dB → "-∞ dB"',  () => expect(s.defaultFormat(-60)).toBe('-∞ dB'))
  it('-6 dB  → "-6.0 dB"', () => expect(s.defaultFormat(-6)).toBe('-6.0 dB'))
  it('0 dB   → "+0.0 dB"', () => expect(s.defaultFormat(0)).toBe('+0.0 dB'))
  it('+3 dB  → "+3.0 dB"', () => expect(s.defaultFormat(3)).toBe('+3.0 dB'))
  it('+6 dB  → "+6.0 dB"', () => expect(s.defaultFormat(6)).toBe('+6.0 dB'))
})

// ─── quantizeValue ────────────────────────────────────────────────────────────

describe('quantizeValue', () => {
  it('undefined step → passthrough',   () => expect(quantizeValue(0.312, undefined, 0, 1)).toBe(0.312))
  it('step=0.1 snaps 0.35 → 0.4',     () => expect(quantizeValue(0.35, 0.1, 0, 1)).toBeCloseTo(0.4))
  it('step=0.1 snaps 0.31 → 0.3',     () => expect(quantizeValue(0.31, 0.1, 0, 1)).toBeCloseTo(0.3))
  it('clamps to max',                  () => expect(quantizeValue(0.99, 0.1, 0, 1)).toBeCloseTo(1.0))
  it('clamps to min',                  () => expect(quantizeValue(0.001, 0.1, 0, 1)).toBeCloseTo(0.0))
  it('step=1 snaps 2.6 → 3 in dB range', () => expect(quantizeValue(2.6, 1, -60, 6)).toBeCloseTo(3))
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | head -20
```
Expected: FAIL with "Cannot find module './faderScales'"

- [ ] **Step 3: Create `faderScales.ts`**

```typescript
// src/components/Fader/faderScales.ts

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// value↔position mapping + default formatter. toPosition/toValue receive the
// component's min/max so linearScale can use them; dbScale ignores them (uses
// its own baked-in parameters).
export interface FaderScale {
  toPosition(value: number, min: number, max: number): number  // → 0..1
  toValue(position: number, min: number, max: number): number
  defaultFormat(value: number): string
}

export function linearScale(): FaderScale {
  return {
    toPosition(value, min, max) {
      if (max === min) return 0
      return (value - min) / (max - min)
    },
    toValue(position, min, max) {
      return min + position * (max - min)
    },
    defaultFormat(value) {
      return value.toFixed(2)
    },
  }
}

// Classic fader law: piecewise linear in dB. Range [dbMin, 0] maps to
// position [0, unityAt]; range [0, dbMax] maps to [unityAt, 1].
// Ignores the component's min/max args — uses its own baked parameters.
export function dbScale({
  min: dbMin = -60,
  max: dbMax = 6,
  unityAt = 0.75,
}: { min?: number; max?: number; unityAt?: number } = {}): FaderScale {
  return {
    toPosition(value) {
      if (value <= dbMin) return 0
      if (value >= dbMax) return 1
      if (value <= 0) {
        return ((value - dbMin) / (0 - dbMin)) * unityAt
      }
      return unityAt + (value / dbMax) * (1 - unityAt)
    },
    toValue(position) {
      const p = clamp(position, 0, 1)
      if (p <= 0) return dbMin
      if (p >= 1) return dbMax
      if (p <= unityAt) {
        return dbMin + (p / unityAt) * (0 - dbMin)
      }
      return ((p - unityAt) / (1 - unityAt)) * dbMax
    },
    defaultFormat(value) {
      if (value <= dbMin) return '-∞ dB'
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(1)} dB`
    },
  }
}

export function quantizeValue(
  value: number,
  step: number | undefined,
  min: number,
  max: number,
): number {
  if (step === undefined || step <= 0) return value
  const snapped = Math.round((value - min) / step) * step + min
  return clamp(snapped, min, max)
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/Fader/faderScales.ts src/components/Fader/Fader.test.tsx && git commit -m "feat(fader): add scale utilities and tests (linearScale, dbScale, quantizeValue)"
```

---

### Task 2: Fader component skeleton — visual structure, CSS, ARIA

**Files:**
- Create: `src/components/Fader/Fader.tsx`
- Create: `src/components/Fader/Fader.module.css`

**Interfaces:**
- Consumes: `FaderScale`, `clamp`, `linearScale`, `quantizeValue` from `./faderScales`
- Produces: `Fader` component, `FaderProps` type — exported from `Fader.tsx`. No interaction wired yet; pointer/keyboard/wheel handlers added in Tasks 3–4.

- [ ] **Step 1: Add rendering + ARIA tests to `Fader.test.tsx`**

Append after the `quantizeValue` describe block:

```typescript
// ─── Rendering + ARIA ──────────────────────────────────────────────────────

import { render, fireEvent } from '@testing-library/react'
import { Fader } from './Fader'

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('Fader rendering', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('renders a track and cap', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-track"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="fader-cap"]')).not.toBeNull()
  })

  it('renders a readout element', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-readout"]')).not.toBeNull()
  })

  it('data-orientation="vertical" by default', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('data-orientation="horizontal" when prop set', () => {
    const { container } = render(
      <Fader value={0.5} onChange={noop} orientation="horizontal" />,
    )
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('data-size="custom" for explicit CSS length', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} size="200px" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'custom')
  })

  it('renders detent tick when detent prop provided', () => {
    const { container } = render(
      <Fader value={0} onChange={noop} min={-1} max={1} detent={{ value: 0 }} />,
    )
    expect(container.querySelector('[data-testid="fader-detent"]')).not.toBeNull()
  })

  it('no detent tick without detent prop', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-detent"]')).toBeNull()
  })

  it('format prop overrides readout text', () => {
    const { container } = render(
      <Fader value={0.5} onChange={noop} format={(v) => `${Math.round(v * 100)}%`} />,
    )
    expect(container.querySelector('[data-testid="fader-readout"]')?.textContent).toBe('50%')
  })

  it('linearScale defaultFormat shows 2dp', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="fader-readout"]')?.textContent).toBe('0.50')
  })
})

describe('Fader accessibility', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('has role="slider"', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} />)
    expect(getByRole('slider')).toBeDefined()
  })

  it('aria-valuemin and aria-valuemax reflect min/max props', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} min={0} max={1} />)
    const el = getByRole('slider')
    expect(el.getAttribute('aria-valuemin')).toBe('0')
    expect(el.getAttribute('aria-valuemax')).toBe('1')
  })

  it('aria-valuenow reflects value prop', () => {
    const { getByRole } = render(<Fader value={0.75} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuenow')).toBe('0.75')
  })

  it('aria-label defaults to "Fader"', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Fader')
  })

  it('custom aria-label', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} aria-label="Volume" />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Volume')
  })

  it('aria-disabled when disabled', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('aria-disabled')).toBe('true')
  })

  it('tabIndex=0 by default', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('0')
  })

  it('tabIndex=-1 when disabled', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('-1')
  })
})
```

- [ ] **Step 2: Run tests — confirm new tests fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | head -20
```
Expected: FAIL with "Cannot find module './Fader'"

- [ ] **Step 3: Create `Fader.module.css`**

```css
/* src/components/Fader/Fader.module.css */

/* ─── Layout ─────────────────────────────────────────────────────────────── */

.root {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  cursor: grab;
  outline: none;
}

.root[data-dragging] { cursor: grabbing; }

.disabled {
  pointer-events: none;
  opacity: 0.4;
}

.root[data-orientation='vertical']   { flex-direction: column; }
.root[data-orientation='horizontal'] { flex-direction: row; }

/* ─── Focus ring ─────────────────────────────────────────────────────────── */

.root:focus-visible {
  box-shadow: 0 0 0 2px var(--accent);
  border-radius: 3px;
}

/* ─── Track / Well ───────────────────────────────────────────────────────── */

.track {
  position: relative;
  background: var(--surface-2);
  border-radius: 3px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

/* Vertical: fixed width, height = length */
.root[data-orientation='vertical'][data-size='sm'] .track { width: 8px;  height: 80px; }
.root[data-orientation='vertical'][data-size='md'] .track { width: 12px; height: 120px; }
.root[data-orientation='vertical'][data-size='lg'] .track { width: 18px; height: 180px; }
.root[data-orientation='vertical'][data-size='custom'] .track {
  width: 12px;
  height: var(--fader-length, 120px);
}

/* Horizontal: fixed height, width = length */
.root[data-orientation='horizontal'][data-size='sm'] .track { height: 8px;  width: 80px; }
.root[data-orientation='horizontal'][data-size='md'] .track { height: 12px; width: 120px; }
.root[data-orientation='horizontal'][data-size='lg'] .track { height: 18px; width: 180px; }
.root[data-orientation='horizontal'][data-size='custom'] .track {
  height: 12px;
  width: var(--fader-length, 120px);
}

/* ─── Fill ───────────────────────────────────────────────────────────────── */

.fill {
  position: absolute;
  background: var(--fader-accent, var(--accent));
  opacity: 0.35;
  border-radius: inherit;
  pointer-events: none;
}

.root[data-orientation='vertical'] .fill {
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--pos, 0) * 100%);
}

.root[data-orientation='horizontal'] .fill {
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(var(--pos, 0) * 100%);
}

/* ─── Detent tick ────────────────────────────────────────────────────────── */

.detentTick {
  position: absolute;
  background: var(--border-strong);
  pointer-events: none;
  z-index: 1;
}

.root[data-orientation='vertical'] .detentTick {
  left: -3px;
  right: -3px;
  height: 2px;
  bottom: calc(var(--detent-pos, 0) * 100%);
  transform: translateY(50%);
}

.root[data-orientation='horizontal'] .detentTick {
  top: -3px;
  bottom: -3px;
  width: 2px;
  left: calc(var(--detent-pos, 0) * 100%);
  transform: translateX(-50%);
}

/* ─── Cap ────────────────────────────────────────────────────────────────── */

.cap {
  position: absolute;
  border-radius: 3px;
  z-index: 2;
  pointer-events: none;
}

/* Vertical: centered horiz, travels top↔bottom (top = max) */
.root[data-orientation='vertical'] .cap {
  left: 50%;
  transform: translateX(-50%);
  width: var(--cap-width);
  height: var(--cap-length);
  top: calc((1 - var(--pos, 0)) * (100% - var(--cap-length)));
  background:
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 3px,
      rgba(0, 0, 0, 0.18) 3px,
      rgba(0, 0, 0, 0.18) 4px
    ),
    var(--fader-accent, var(--accent));
}

/* Horizontal: centered vert, travels left↔right (right = max) */
.root[data-orientation='horizontal'] .cap {
  top: 50%;
  transform: translateY(-50%);
  height: var(--cap-width);
  width: var(--cap-length);
  left: calc(var(--pos, 0) * (100% - var(--cap-length)));
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 3px,
      rgba(0, 0, 0, 0.18) 3px,
      rgba(0, 0, 0, 0.18) 4px
    ),
    var(--fader-accent, var(--accent));
}

/* Gloss highlight */
.cap::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(ellipse at 38% 28%, rgba(255, 255, 255, 0.22) 0%, transparent 65%);
  pointer-events: none;
}

/* Contrast pointer line — echoes PanKnob's notch rect */
.root[data-orientation='vertical'] .cap::after {
  content: '';
  position: absolute;
  left: 12%;
  right: 12%;
  height: 3px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--accent-contrast);
  border-radius: 2px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.3);
}

.root[data-orientation='horizontal'] .cap::after {
  content: '';
  position: absolute;
  top: 12%;
  bottom: 12%;
  width: 3px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent-contrast);
  border-radius: 2px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.3);
}

/* ─── Readout ─────────────────────────────────────────────────────────────── */

.readout {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1;
  height: 1em;
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.root:hover .readout,
.root[data-dragging] .readout { opacity: 1; }

.root:hover .cap,
.root[data-dragging] .cap { filter: brightness(1.08); }
```

- [ ] **Step 4: Create `Fader.tsx` skeleton (visual + ARIA, no interaction yet)**

```tsx
// src/components/Fader/Fader.tsx
import { useEffect, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import { clamp, linearScale, quantizeValue } from './faderScales'
import type { FaderScale } from './faderScales'
import styles from './Fader.module.css'

export type { FaderScale }
export { linearScale, dbScale } from './faderScales'

// ─── Constants ─────────────────────────────────────────────────────────────

const PRESET_SIZES = new Set(['sm', 'md', 'lg'])
const CAP_LENGTHS: Record<'sm' | 'md' | 'lg', number> = { sm: 24, md: 32, lg: 44 }
const CAP_WIDTHS:  Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 20, lg: 28 }

const DEFAULT_SCALE = linearScale()

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FaderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  orientation?: 'vertical' | 'horizontal'
  scale?: FaderScale
  detent?: { value: number; strength?: number }
  resetValue?: number
  size?: 'sm' | 'md' | 'lg' | (string & {})
  disabled?: boolean
  color?: string
  format?: (value: number) => string
  'aria-label'?: string
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Fader({
  value,
  onChange,
  min = 0,
  max = 1,
  step,
  orientation = 'vertical',
  scale,
  detent,
  resetValue,
  size = 'md',
  disabled = false,
  color,
  format,
  'aria-label': ariaLabel = 'Fader',
}: FaderProps) {
  const effectiveScale = scale ?? DEFAULT_SCALE
  const isPreset = PRESET_SIZES.has(size)
  const effectiveSize = isPreset ? (size as 'sm' | 'md' | 'lg') : 'md'

  // ── Mutable refs (read by stable callbacks) ───────────────────────────────
  const valueRef    = useRef(value)
  const onChangeRef = useRef(onChange)
  const scaleRef    = useRef(effectiveScale)
  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => { scaleRef.current = effectiveScale })

  // ── Drag state ────────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false)
  const rootRef  = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const capRef   = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ pointerAxis: 0, position: 0, travelLength: 0, shift: false })

  // ── Spring for reset / detent snap ───────────────────────────────────────
  const [resetting, setResetting] = useState(false)
  const [resetSeed, setResetSeed] = useState(() => {
    const pct = effectiveScale.toPosition(value, min, max) * 100
    return { from: pct, target: pct, key: 0 }
  })

  const springPct = useSpring(resetSeed.target, {
    stiffness: 200,
    damping: 30,
    from: resetSeed.from,
    key: resetSeed.key,
  })

  useEffect(() => {
    if (resetting && Math.abs(springPct - resetSeed.target) < 0.5) {
      setResetting(false)
    }
  }, [resetting, springPct, resetSeed.target])

  const displayPosition = resetting
    ? clamp(springPct / 100, 0, 1)
    : clamp(effectiveScale.toPosition(value, min, max), 0, 1)

  // ── Derived values ────────────────────────────────────────────────────────
  const capLength = CAP_LENGTHS[effectiveSize]
  const capWidth  = CAP_WIDTHS[effectiveSize]
  const capColor  = color ?? 'var(--accent)'
  const readoutText = format ? format(value) : effectiveScale.defaultFormat(value)
  const detentPosition = detent
    ? clamp(effectiveScale.toPosition(detent.value, min, max), 0, 1)
    : 0

  // ── Reset (shared by keyboard + double-click + detent snap) ───────────────
  function triggerReset(targetValue = resetValue ?? min) {
    if (disabled) return
    const currentPct = resetting
      ? springPct
      : effectiveScale.toPosition(valueRef.current, min, max) * 100
    onChange(targetValue)
    setResetSeed(prev => ({
      from: currentPct,
      target: effectiveScale.toPosition(targetValue, min, max) * 100,
      key: prev.key + 1,
    }))
    setResetting(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={isPreset ? effectiveSize : 'custom'}
      data-dragging={dragging || undefined}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={readoutText}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      style={!isPreset ? { '--fader-length': size } as React.CSSProperties : undefined}
    >
      <div ref={trackRef} className={styles.track} data-testid="fader-track">
        {detent && (
          <div
            className={styles.detentTick}
            data-testid="fader-detent"
            style={{ '--detent-pos': detentPosition } as React.CSSProperties}
          />
        )}
        <div
          className={styles.fill}
          style={{
            '--pos': displayPosition,
            '--fader-accent': capColor,
          } as React.CSSProperties}
        />
        <div
          ref={capRef}
          className={styles.cap}
          data-testid="fader-cap"
          style={{
            '--pos': displayPosition,
            '--cap-length': `${capLength}px`,
            '--cap-width': `${capWidth}px`,
            '--fader-accent': capColor,
          } as React.CSSProperties}
        />
      </div>
      <span className={styles.readout} data-testid="fader-readout" aria-hidden="true">
        {readoutText}
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | tail -15
```
Expected: all tests pass.

- [ ] **Step 6: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/Fader/Fader.tsx src/components/Fader/Fader.module.css && git commit -m "feat(fader): add Fader skeleton — visual structure, CSS, ARIA"
```

---

### Task 3: Keyboard + wheel interaction

**Files:**
- Modify: `src/components/Fader/Fader.tsx` (add handlers)
- Modify: `src/components/Fader/Fader.test.tsx` (add keyboard tests)

**Key decisions:**
- Arrow = 2% of range (normal), Shift+Arrow = 0.4% (fine, 5× slower — Shift=fine for Fader unlike PanKnob where Shift=coarse)
- PageUp/Down = 10% of range
- Wheel: raw delta scaled by range, value/onChange read from refs (never in dep array)

- [ ] **Step 1: Add keyboard tests to `Fader.test.tsx`**

Append after the accessibility describe block:

```typescript
// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('Fader keyboard (min=0 max=1)', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  function slider(value: number) {
    return render(<Fader value={value} onChange={noop} />).getByRole('slider')
  }

  it('ArrowUp increases by 2%',         () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowUp' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.52, 5))
  })
  it('ArrowDown decreases by 2%',       () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowDown' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.48, 5))
  })
  it('ArrowRight increases',            () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowRight' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.52, 5))
  })
  it('ArrowLeft decreases',             () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowLeft' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.48, 5))
  })
  it('Shift+ArrowUp fine step (0.4%)', () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowUp', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.504, 5))
  })
  it('Shift+ArrowDown fine step',      () => {
    fireEvent.keyDown(slider(0.5), { key: 'ArrowDown', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.496, 5))
  })
  it('PageUp +10%',  () => {
    fireEvent.keyDown(slider(0.5), { key: 'PageUp' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.6, 5))
  })
  it('PageDown -10%', () => {
    fireEvent.keyDown(slider(0.5), { key: 'PageDown' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.4, 5))
  })
  it('Home → min',   () => {
    fireEvent.keyDown(slider(0.5), { key: 'Home' })
    expect(noop).toHaveBeenCalledWith(0)
  })
  it('End → max',    () => {
    fireEvent.keyDown(slider(0.5), { key: 'End' })
    expect(noop).toHaveBeenCalledWith(1)
  })
  it('ArrowUp at max does not exceed max', () => {
    fireEvent.keyDown(slider(1), { key: 'ArrowUp' })
    expect(noop.mock.calls[0][0]).toBeLessThanOrEqual(1)
  })
  it('ArrowDown at min does not go below min', () => {
    fireEvent.keyDown(slider(0), { key: 'ArrowDown' })
    expect(noop.mock.calls[0][0]).toBeGreaterThanOrEqual(0)
  })
  it('step prop quantizes keyboard increments', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} step={0.1} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(noop).toHaveBeenCalledWith(expect.closeTo(0.6, 5))
  })
  it('Backspace calls onChange(resetValue)', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} resetValue={0.25} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Backspace' })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('Delete calls onChange(resetValue)', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} resetValue={0.25} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Delete' })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('disabled ignores keyboard', () => {
    const { getByRole } = render(<Fader value={0.5} onChange={noop} disabled />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(noop).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — confirm keyboard tests fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | grep -E "FAIL|×" | head -10
```

- [ ] **Step 3: Add `handleKeyDown` to `Fader.tsx`**

Inside the `Fader` component, after `triggerReset`:

```tsx
  // ── Keyboard ─────────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const rangeSize = max - min
    const normalStep = step ?? rangeSize * 0.02
    const fineStep   = step ? step / 5 : rangeSize * 0.004
    const coarseStep = rangeSize * 0.1

    const increment = e.shiftKey ? fineStep : normalStep
    let next: number | null = null

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight': next = clamp(valueRef.current + increment, min, max); break
      case 'ArrowDown':
      case 'ArrowLeft':  next = clamp(valueRef.current - increment, min, max); break
      case 'PageUp':     next = clamp(valueRef.current + coarseStep, min, max); break
      case 'PageDown':   next = clamp(valueRef.current - coarseStep, min, max); break
      case 'Home':       next = min; break
      case 'End':        next = max; break
      case 'Backspace':
      case 'Delete':     e.preventDefault(); triggerReset(); return
      default: return
    }
    e.preventDefault()
    if (next !== null) {
      onChangeRef.current(quantizeValue(next, step, min, max))
    }
  }
```

- [ ] **Step 4: Add non-passive wheel listener to `Fader.tsx`**

After the spring-settle `useEffect`, add:

```tsx
  // ── Wheel (non-passive, attached once) ────────────────────────────────────
  // value and onChange are read from refs inside the listener — NOT in deps —
  // so the listener is only recreated when structural props (disabled/min/max/step) change.
  useEffect(() => {
    const el = rootRef.current!
    const onWheel = (e: WheelEvent) => {
      if (disabled) return
      e.preventDefault()
      const rangeSize = max - min
      const delta = -e.deltaY * 0.002 * rangeSize
      const next = clamp(valueRef.current + delta, min, max)
      onChangeRef.current(quantizeValue(next, step, min, max))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled, min, max, step])
```

- [ ] **Step 5: Wire `onKeyDown` on the root div**

Add `onKeyDown={handleKeyDown}` to the root `<div>` in the return statement.

- [ ] **Step 6: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 7: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/Fader/Fader.tsx src/components/Fader/Fader.test.tsx && git commit -m "feat(fader): add keyboard (Shift=fine) and non-passive wheel interaction"
```

---

### Task 4: Pointer drag interaction + reset tests

**Files:**
- Modify: `src/components/Fader/Fader.tsx` (add pointer handlers)
- Modify: `src/components/Fader/Fader.test.tsx` (add drag + reset + detent + reduced-motion tests)

**Key decisions:**
- Relative drag from pointer-down position; Shift = 20% sensitivity (same fractional factor as PanKnob)
- Well-click jump: compute absolute position from click, jump before starting relative drag
- Detent snap on `pointerUp` if within `strength × 5%` of detent position; Shift bypasses
- `triggerReset` uses `springPct` as `from` if already resetting (avoids stale seed bug)

- [ ] **Step 1: Add drag, reset, detent, reduced-motion tests**

Append to `Fader.test.tsx`:

```typescript
// ─── Pointer drag ─────────────────────────────────────────────────────────────

describe('Fader pointer drag', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('sets data-dragging on pointerDown', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    const root  = container.firstChild as HTMLElement
    const track = container.querySelector('[data-testid="fader-track"]')!
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0 })
    expect(root.dataset.dragging).toBeDefined()
  })

  it('clears data-dragging on pointerUp', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} />)
    const root  = container.firstChild as HTMLElement
    const track = container.querySelector('[data-testid="fader-track"]')!
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(track)
    expect(root.dataset.dragging).toBeUndefined()
  })

  it('disabled fader ignores pointerDown', () => {
    const { container } = render(<Fader value={0.5} onChange={noop} disabled />)
    const root  = container.firstChild as HTMLElement
    const track = container.querySelector('[data-testid="fader-track"]')!
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0 })
    expect(root.dataset.dragging).toBeUndefined()
  })
})

// ─── Reset gesture ────────────────────────────────────────────────────────────

describe('Fader reset gesture', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('double-click calls onChange(resetValue)', () => {
    const { container } = render(<Fader value={0.75} onChange={noop} resetValue={0.5} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).toHaveBeenCalledWith(0.5)
  })

  it('double-click with no resetValue calls onChange(min)', () => {
    const { container } = render(<Fader value={0.75} onChange={noop} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('Backspace calls onChange(resetValue)', () => {
    const { getByRole } = render(<Fader value={0.75} onChange={noop} resetValue={0.5} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Backspace' })
    expect(noop).toHaveBeenCalledWith(0.5)
  })

  it('disabled ignores double-click reset', () => {
    const { container } = render(<Fader value={0.75} onChange={noop} disabled resetValue={0} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).not.toHaveBeenCalled()
  })
})

// ─── Detent tick ──────────────────────────────────────────────────────────────

describe('Fader detent', () => {
  it('renders detent tick with correct data-testid', () => {
    const noop = vi.fn()
    const { container } = render(
      <Fader value={0} onChange={noop} min={-1} max={1} detent={{ value: 0 }} />,
    )
    expect(container.querySelector('[data-testid="fader-detent"]')).not.toBeNull()
  })
})

// ─── Reduced-motion ───────────────────────────────────────────────────────────

describe('Fader reduced-motion', () => {
  it('reset calls onChange(resetValue) immediately', () => {
    mockMatchMedia(true)
    const noop = vi.fn()
    const { container } = render(<Fader value={0.75} onChange={noop} resetValue={0.5} />)
    fireEvent.doubleClick(container.firstChild!)
    expect(noop).toHaveBeenCalledWith(0.5)
  })
})
```

- [ ] **Step 2: Run tests — confirm new tests fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | grep -E "FAIL|×" | head -10
```

- [ ] **Step 3: Add pointer handlers to `Fader.tsx`**

After `handleKeyDown`, add:

```tsx
  // ── Pointer drag ─────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setResetting(false)

    const trackEl = trackRef.current!
    const rect = trackEl.getBoundingClientRect()
    const capLen = CAP_LENGTHS[effectiveSize]
    const travelLength = Math.max(
      (orientation === 'vertical' ? rect.height : rect.width) - capLen,
      1,
    )

    // If click lands outside the cap, jump to the click position first
    const capEl = capRef.current!
    const capRect = capEl.getBoundingClientRect()
    const HIT_PAD = 6
    const onCap = (
      e.clientX >= capRect.left - HIT_PAD && e.clientX <= capRect.right  + HIT_PAD &&
      e.clientY >= capRect.top  - HIT_PAD && e.clientY <= capRect.bottom + HIT_PAD
    )

    let startValue = valueRef.current
    if (!onCap) {
      const capHalf = capLen / 2
      const rawPos = orientation === 'vertical'
        ? 1 - (e.clientY - rect.top  - capHalf) / travelLength
        : (e.clientX  - rect.left - capHalf) / travelLength
      const jumped = clamp(
        scaleRef.current.toValue(clamp(rawPos, 0, 1), min, max),
        min, max,
      )
      startValue = quantizeValue(jumped, step, min, max)
      onChangeRef.current(startValue)
    }

    dragStart.current = {
      pointerAxis: orientation === 'vertical' ? e.clientY : e.clientX,
      position: scaleRef.current.toPosition(startValue, min, max),
      travelLength,
      shift: e.shiftKey,
    }
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const axis = orientation === 'vertical' ? e.clientY : e.clientX
    const delta = axis - dragStart.current.pointerAxis
    const sensitivity = dragStart.current.shift ? 0.2 : 1.0
    const direction = orientation === 'vertical' ? -1 : 1
    const newPos = clamp(
      dragStart.current.position + direction * delta / dragStart.current.travelLength * sensitivity,
      0, 1,
    )
    const rawValue = clamp(scaleRef.current.toValue(newPos, min, max), min, max)
    onChangeRef.current(quantizeValue(rawValue, step, min, max))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setDragging(false)

    // Detent snap on release (Shift bypasses)
    if (!e.shiftKey && detent) {
      const currentPos = scaleRef.current.toPosition(valueRef.current, min, max)
      const detentPos  = scaleRef.current.toPosition(detent.value, min, max)
      const snapRadius = (detent.strength ?? 1) * 0.05
      if (Math.abs(currentPos - detentPos) <= snapRadius) {
        triggerReset(detent.value)
      }
    }
  }

  function handleDoubleClick() {
    triggerReset()
  }
```

- [ ] **Step 4: Wire handlers on the track div**

Update the `<div ref={trackRef}>` to add:

```tsx
  <div
    ref={trackRef}
    className={styles.track}
    data-testid="fader-track"
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
  >
```

And add `onDoubleClick={handleDoubleClick}` to the root `<div>`.

- [ ] **Step 5: Run all tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/Fader/Fader.test.tsx 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 6: Run full suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run 2>&1 | tail -5
```
Expected: all suites pass.

- [ ] **Step 7: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/Fader/Fader.tsx src/components/Fader/Fader.test.tsx && git commit -m "feat(fader): add pointer drag, well-click jump, detent snap, reset gesture"
```

---

### Task 5: Demo, exports, and PanKnob dogfood

**Files:**
- Create: `src/components/Fader/index.ts`
- Create: `src/components/Fader/Fader.demo.tsx`
- Modify: `src/components/PanKnob/PanKnob.demo.tsx` (replace two `<input type="range">` with `<Fader>`)

- [ ] **Step 1: Create `index.ts`**

```typescript
// src/components/Fader/index.ts
export { Fader } from './Fader'
export type { FaderProps } from './Fader'
export { linearScale, dbScale } from './faderScales'
export type { FaderScale } from './faderScales'
```

- [ ] **Step 2: Create `Fader.demo.tsx`**

```tsx
// src/components/Fader/Fader.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from './Fader'
import { dbScale } from './faderScales'

export const meta: DemoMeta = {
  name: 'Fader',
  group: 'Primitives',
  route: '/fader',
  order: 2,
}

// ── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  const db = dbScale()
  return (
    <StatesGrid>
      <State label="Unity (0 dB)">
        <Fader value={0} onChange={noop} min={-60} max={6} scale={db} resetValue={0} />
      </State>
      <State label="-6 dB">
        <Fader value={-6} onChange={noop} min={-60} max={6} scale={db} resetValue={0} />
      </State>
      <State label="-∞ (−60 dB)">
        <Fader value={-60} onChange={noop} min={-60} max={6} scale={db} resetValue={0} />
      </State>
      <State label="+6 dB">
        <Fader value={6} onChange={noop} min={-60} max={6} scale={db} resetValue={0} />
      </State>
      <State label="Horizontal">
        <Fader
          value={0}
          onChange={noop}
          min={-60}
          max={6}
          scale={db}
          orientation="horizontal"
          resetValue={0}
          aria-label="Volume horizontal"
        />
      </State>
      <State label="sm size">
        <Fader value={0} onChange={noop} min={-60} max={6} scale={db} size="sm" resetValue={0} />
      </State>
      <State label="Disabled">
        <Fader value={-6} onChange={noop} min={-60} max={6} scale={db} disabled />
      </State>
      <State label="Custom color">
        <Fader
          value={0}
          onChange={noop}
          min={-60}
          max={6}
          scale={db}
          color="var(--accent-green)"
          resetValue={0}
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────
// Controls are themselves Faders (horizontal) — dogfooding the component.

function PlaygroundDemo() {
  const db = dbScale()
  const [volume, setVolume]     = useState(0)
  const [resetVal, setResetVal] = useState(0)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end' }}>
        {/* Main vertical dB fader on demo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Fader
            value={volume}
            onChange={setVolume}
            min={-60}
            max={6}
            scale={db}
            detent={{ value: 0 }}
            resetValue={resetVal}
            aria-label="Volume"
            size="lg"
          />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
            double-click to reset
          </span>
        </div>

        {/* Controls as horizontal Faders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            volume: {db.defaultFormat(volume)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={volume}
                onChange={setVolume}
                min={-60}
                max={6}
                scale={db}
                orientation="horizontal"
                detent={{ value: 0 }}
                aria-label="Volume fader control"
              />
            </div>
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            resetValue: {db.defaultFormat(resetVal)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={resetVal}
                onChange={setResetVal}
                min={-60}
                max={6}
                scale={db}
                orientation="horizontal"
                aria-label="Reset value control"
              />
            </div>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function FaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 3: Dogfood Fader in `PanKnob.demo.tsx`**

At the top of `src/components/PanKnob/PanKnob.demo.tsx`, add the import:

```tsx
import { Fader } from '../Fader'
```

In `PlaygroundDemo`, replace the `pan` range input. Find:

```tsx
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            pan: {pan.toFixed(2)}
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={pan}
              onChange={(e) => setPan(Number(e.target.value))}
              style={{ display: 'block', width: '140px' }}
            />
          </label>
```

Replace with:

```tsx
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            pan: {pan.toFixed(2)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={pan}
                onChange={setPan}
                min={-1}
                max={1}
                step={0.01}
                orientation="horizontal"
                detent={{ value: 0 }}
                aria-label="Pan"
              />
            </div>
          </label>
```

Replace the `resetValue` range input. Find:

```tsx
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            resetValue: {resetValue}
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={resetValue}
              onChange={(e) => setResetValue(Number(e.target.value))}
              style={{ display: 'block', width: '140px' }}
            />
          </label>
```

Replace with:

```tsx
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            resetValue: {resetValue.toFixed(2)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader
                value={resetValue}
                onChange={setResetValue}
                min={-1}
                max={1}
                step={0.01}
                orientation="horizontal"
                aria-label="Reset value"
              />
            </div>
          </label>
```

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run 2>&1 | tail -5
```
Expected: all tests pass.

- [ ] **Step 5: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 6: Verify in gallery**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npm run dev
```

Verification checklist:
1. Navigate to `/fader` — STATES grid shows 8 states (Unity, -6 dB, -inf, +6 dB, Horizontal, sm, Disabled, Custom color)
2. PLAYGROUND uses horizontal Faders as controls (not native ranges)
3. Drag the vertical Fader — cap tracks pointer 1:1
4. Double-click main Fader — spring-animated reset glides to `resetVal` Fader's position
5. Drag main Fader near unity (0 dB), release — detent snap animates to 0 dB
6. Navigate to `/pan-knob` — both range controls are now horizontal Faders with detent (pan) and linear (resetValue)
7. PanKnob playground still works: dragging PanKnob rotates correctly, reset works
8. Tab to focus Fader → arrow keys move it → Shift+arrow for fine steps
9. Switch to Compare mode → Fader renders correctly across default, bowie, tropicalia, manuscript, ink themes

- [ ] **Step 7: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/Fader/index.ts src/components/Fader/Fader.demo.tsx src/components/PanKnob/PanKnob.demo.tsx && git commit -m "feat(fader): add demo with Fader-driven playground, dogfood PanKnob range inputs"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| `value`, `onChange`, `min`, `max`, `step` | Task 2 props |
| `orientation: "vertical" \| "horizontal"` | Task 2 CSS + data-orientation |
| `scale?` + `dbScale` + `linearScale` | Task 1 |
| `detent?`: tick mark, snap on release, Shift bypasses | Task 2 tick; Task 4 pointerUp |
| `resetValue?` + double-click / Backspace / Delete | Tasks 3–4 + tests |
| Spring from current cap position (seed fix) | Task 2 `springPct` used as `from` |
| `size? "sm" \| "md" \| "lg" \| string` | Task 2 |
| `disabled?` | Task 2 ARIA; Tasks 3–4 guard |
| `color?` CSS override via `--fader-accent` | Task 2 |
| `format?(value): string` | Task 2 readout |
| Recessed well (`--surface-2`), fill (`--accent`), knurl cap | Task 2 CSS |
| Vertical top = max; Horizontal right = max | Task 2 CSS `calc` |
| Drag 1:1, Shift = 20% (same ratio as PanKnob) | Task 4 |
| Well-click jumps cap | Task 4 pointerDown |
| Pointer capture | Task 4 `setPointerCapture` |
| Non-passive wheel, no re-attach on value/onChange | Task 3 |
| Keyboard: Arrow, Shift+Arrow (fine), Page, Home/End | Task 3 |
| `:focus-visible` ring only | Task 2 CSS |
| `prefers-reduced-motion`: instant jump | Task 2 + useSpring |
| Fader demo STATES + PLAYGROUND with Fader controls | Task 5 |
| PanKnob dogfood: replace two range inputs | Task 5 |
| `typecheck` / `test` green | Verified each task |

### Type consistency

- `FaderScale` defined in Task 1, re-exported in Task 2, used in Tasks 3–5 ✓
- `clamp`, `quantizeValue` defined in Task 1, imported in Task 2 via `./faderScales` ✓
- `CAP_LENGTHS`, `CAP_WIDTHS` keyed on `'sm' | 'md' | 'lg'`, `effectiveSize` narrowed to that type ✓
- `triggerReset(targetValue?)` — optional param, defaults to `resetValue ?? min` — called in Task 3 (keyboard), Task 4 (double-click, detent snap) ✓
- `dragStart.current` shape `{ pointerAxis, position, travelLength, shift }` — defined in Task 2 ref, written in Task 4 `handlePointerDown`, read in Task 4 `handlePointerMove` ✓
- `resetSeed.{ from, target, key }` — defined in Task 2 `useState`, mutated in Task 2 `triggerReset` and Task 4 detent snap ✓
- `springPct` — output of `useSpring` in Task 2, used as `displayPosition` source and as `from` in `triggerReset` ✓
