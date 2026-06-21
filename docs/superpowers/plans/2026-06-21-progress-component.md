# Progress Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `Progress` kit primitive — bar and ring variants, determinate + indeterminate — that reads as warm instrument hardware, not a browser loading indicator.

**Architecture:** Single component with two render paths (`bar` / `ring`) driven by `data-*` attributes and CSS. Determinate state is a CSS custom property (`--_fill`) + inline SVG `strokeDashoffset`; indeterminate uses CSS `@keyframes` on a traveling shimmer (bar) or a rotating arc (ring). No JS animation timers — pure CSS motion so reduced-motion tokens apply automatically.

**Tech Stack:** React 18, CSS Modules, CSS custom properties, SVG (ring), Vitest + `@testing-library/react`, `fireEvent` (never `userEvent`).

## Global Constraints

- Tokens only — no hardcoded colors ever; verify Compare light AND dark
- CSS Modules; `data-*` attributes drive state (never class-juggling)
- Sizes: `sm` / `md` only (default `md`); no `lg`
- Tests: `fireEvent`, NOT `userEvent`; `vitest run` must be green
- `tsc --noEmit` must pass; lint must pass
- No manual registry edits — auto-discovered via `import.meta.glob`
- `:focus-visible` only (never `:focus`)
- `--font-ui` (General Sans/Satoshi), `--font-mono` (Space Mono) — never Inter
- No animation library; CSS for state, CSS `@keyframes` for indeterminate sweep
- Fill color: `--accent` (generic progress → accent per KIT-LEAD §6)
- Functional motion (the progress fill / indeterminate sweep) stays under reduced-motion; decorative pulse variants snap
- Component route: `/progress`, group: `Primitives`, order: `16`

---

## File Map

| File | Role |
|------|------|
| `src/components/Progress/Progress.tsx` | Component — props, ARIA, data attrs, SVG math |
| `src/components/Progress/Progress.module.css` | Styles — bar track/fill, ring SVG, indeterminate keyframes, reduced-motion |
| `src/components/Progress/Progress.test.tsx` | Tests — rendering, ARIA attrs, data attrs, value clamping |
| `src/components/Progress/Progress.demo.tsx` | Gallery demo — all states, Playground |
| `src/components/Progress/index.ts` | Barrel export |

---

## Design Reference

### Bar sizes
| size | height | width |
|------|--------|-------|
| md   | 6px    | 100% (flex-stretch, min-width 120px in demo) |
| sm   | 3px    | 100% |

### Ring sizes
| size | SVG box | cx/cy | r  | stroke-width | circumference |
|------|---------|-------|----|--------------|---------------|
| md   | 40×40   | 20,20 | 16 | 3            | ≈100.53 |
| sm   | 24×24   | 12,12 | 9  | 2            | ≈56.55  |

### Indeterminate motion
- **Bar:** A `--_shimmer` element (30% width, accent gradient) translates from `−30%` to `+130%` over 1.8s `ease-in-out infinite`. Under `prefers-reduced-motion`: no translation, gentle `opacity` pulse only.
- **Ring:** SVG rotates from `−90deg` to `+270deg` over 1.4s `linear infinite`; fill arc is 35% of circumference. Under `prefers-reduced-motion`: rotation stops; arc opacity pulses 0.3→0.8 over 1.8s.

### ARIA contract
```
role="progressbar"
aria-valuemin="0"
aria-valuemax="100"
aria-valuenow={Math.round(clamped * 100)}  // absent when indeterminate
aria-label={label ?? aria-label ?? "Loading"}
```

---

## Task 1: Component Shell + Bar (determinate)

**Files:**
- Create: `src/components/Progress/Progress.tsx`
- Create: `src/components/Progress/Progress.module.css`
- Create: `src/components/Progress/index.ts`

**Interfaces:**
- Produces: `Progress({ variant?, value?, label?, size?, 'aria-label'? })`

- [ ] **Step 1: Write Progress.tsx**

```tsx
// src/components/Progress/Progress.tsx
import styles from './Progress.module.css'

export interface ProgressProps {
  variant?: 'bar' | 'ring'
  value?: number
  label?: string
  size?: 'sm' | 'md'
  'aria-label'?: string
}

const RING_MD = { size: 40, cx: 20, cy: 20, r: 16, sw: 3 }
const RING_SM = { size: 24, cx: 12, cy: 12, r:  9, sw: 2 }

function circ(r: number) { return 2 * Math.PI * r }

export function Progress({
  variant = 'bar',
  value,
  label,
  size = 'md',
  'aria-label': ariaLabel,
}: ProgressProps) {
  const isIndeterminate = value === undefined
  const clamped = isIndeterminate ? 0 : Math.max(0, Math.min(1, value))
  const pct = Math.round(clamped * 100)
  const accessibleLabel = label ?? ariaLabel ?? 'Loading'

  const sharedProps = {
    role: 'progressbar' as const,
    'aria-label': accessibleLabel,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': isIndeterminate ? undefined : pct,
    'data-variant': variant,
    'data-size': size,
    'data-indeterminate': isIndeterminate || undefined,
  }

  if (variant === 'ring') {
    const ring = size === 'sm' ? RING_SM : RING_MD
    const c = circ(ring.r)
    const dashArray = isIndeterminate
      ? `${c * 0.35} ${c}`
      : `${c}`
    const dashOffset = isIndeterminate ? 0 : c * (1 - clamped)

    return (
      <div className={styles.ringWrap}>
        <svg
          {...sharedProps}
          className={styles.ring}
          width={ring.size}
          height={ring.size}
          viewBox={`0 0 ${ring.size} ${ring.size}`}
          style={{ '--_circ': String(c) } as React.CSSProperties}
        >
          <circle
            className={styles.ringTrack}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            strokeWidth={ring.sw}
          />
          <circle
            className={styles.ringFill}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            strokeWidth={ring.sw}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
          />
        </svg>
        {label && <span className={styles.label}>{label}</span>}
      </div>
    )
  }

  // Bar variant
  return (
    <div className={styles.barWrap}>
      <div
        {...sharedProps}
        className={styles.bar}
        style={
          isIndeterminate
            ? undefined
            : ({ '--_fill': String(clamped) } as React.CSSProperties)
        }
      >
        <div className={styles.barFill} aria-hidden="true" />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
```

- [ ] **Step 2: Write Progress.module.css**

```css
/* src/components/Progress/Progress.module.css */

/* ── Bar wrapper ─────────────────────────────────────────────────────────── */

.barWrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

/* ── Bar track (the progressbar role element) ────────────────────────────── */

.bar {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: var(--stage);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--border);
}

.bar[data-size="md"] { height: 6px; }
.bar[data-size="sm"] { height: 3px; }

/* ── Bar fill ────────────────────────────────────────────────────────────── */

.barFill {
  height: 100%;
  width: calc(var(--_fill, 0) * 100%);
  background: var(--accent);
  border-radius: inherit;
  box-shadow: 2px 0 8px 1px color-mix(in srgb, var(--accent) 45%, transparent);
  transition: width var(--dur-base) linear;
  transform-origin: left center;
}

/* ── Bar indeterminate: travelling shimmer ───────────────────────────────── */

.bar[data-indeterminate] .barFill {
  width: 30%;
  box-shadow: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--accent) 70%, transparent) 35%,
    var(--accent) 50%,
    color-mix(in srgb, var(--accent) 70%, transparent) 65%,
    transparent 100%
  );
  animation: bar-sweep 1.8s ease-in-out infinite;
}

@keyframes bar-sweep {
  0%   { transform: translateX(-160%); }
  100% { transform: translateX(440%); }
}

/* ── Ring wrapper ────────────────────────────────────────────────────────── */

.ringWrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

/* ── Ring SVG ────────────────────────────────────────────────────────────── */

.ring {
  transform: rotate(-90deg);
  transform-origin: center;
  flex-shrink: 0;
}

.ring[data-indeterminate] {
  animation: ring-spin 1.4s linear infinite;
}

@keyframes ring-spin {
  from { transform: rotate(-90deg); }
  to   { transform: rotate(270deg); }
}

/* ── Ring track ──────────────────────────────────────────────────────────── */

.ringTrack {
  fill: none;
  stroke: var(--border);
}

/* ── Ring fill ───────────────────────────────────────────────────────────── */

.ringFill {
  fill: none;
  stroke: var(--accent);
  stroke-linecap: round;
  transition: stroke-dashoffset var(--dur-base) linear;
}

/* Warm LED bloom when 100% */
.ring:not([data-indeterminate])[aria-valuenow="100"] .ringFill {
  stroke: color-mix(in srgb, var(--accent) 85%, white);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 60%, transparent));
}

/* ── Label ───────────────────────────────────────────────────────────────── */

.label {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1;
  letter-spacing: 0.01em;
}

/* ── Reduced-motion ──────────────────────────────────────────────────────── */
/*
  Functional motion (the fill tracking progress) stays — only decorative
  indeterminate animations are replaced.
  Bar: width/opacity pulse instead of sweep.
  Ring: no rotation; arc opacity pulses.
*/

@media (prefers-reduced-motion: reduce) {
  .bar[data-indeterminate] .barFill {
    width: 100%;
    transform: none;
    animation: none;
    background: var(--accent);
    opacity: 0.4;
    animation: bar-pulse 1.8s ease-in-out infinite;
  }

  @keyframes bar-pulse {
    0%, 100% { opacity: 0.3; }
    50%       { opacity: 0.6; }
  }

  .ring[data-indeterminate] {
    animation: none;
    transform: rotate(-90deg);
  }

  .ring[data-indeterminate] .ringFill {
    animation: ring-pulse 1.8s ease-in-out infinite;
  }

  @keyframes ring-pulse {
    0%, 100% { opacity: 0.3; }
    50%       { opacity: 0.75; }
  }
}
```

- [ ] **Step 3: Write index.ts**

```ts
// src/components/Progress/index.ts
export { Progress } from './Progress'
export type { ProgressProps } from './Progress'
```

- [ ] **Step 4: Verify TSC passes**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/progress && npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Tests

**Files:**
- Create: `src/components/Progress/Progress.test.tsx`

- [ ] **Step 1: Write Progress.test.tsx**

```tsx
// src/components/Progress/Progress.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Progress } from './Progress'

// ── Rendering ─────────────────────────────────────────────────────────────

describe('Progress — rendering', () => {
  it('renders a progressbar role element', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar')).toBeInTheDocument()
  })

  it('default variant is bar', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar').getAttribute('data-variant')).toBe('bar')
  })

  it('ring variant sets data-variant="ring" on the SVG', () => {
    const { getByRole } = render(<Progress variant="ring" />)
    expect(getByRole('progressbar').getAttribute('data-variant')).toBe('ring')
  })

  it('default size is md', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar').getAttribute('data-size')).toBe('md')
  })

  it('size="sm" sets data-size="sm"', () => {
    const { getByRole } = render(<Progress size="sm" />)
    expect(getByRole('progressbar').getAttribute('data-size')).toBe('sm')
  })

  it('renders label text when label prop is provided', () => {
    const { getByText } = render(<Progress label="Scanning…" />)
    expect(getByText('Scanning…')).toBeInTheDocument()
  })

  it('no label element when label is absent', () => {
    const { queryByText } = render(<Progress />)
    expect(queryByText('Scanning…')).not.toBeInTheDocument()
  })
})

// ── ARIA ──────────────────────────────────────────────────────────────────

describe('Progress — ARIA', () => {
  it('has aria-valuemin="0"', () => {
    const { getByRole } = render(<Progress value={0.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuemin')).toBe('0')
  })

  it('has aria-valuemax="100"', () => {
    const { getByRole } = render(<Progress value={0.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuemax')).toBe('100')
  })

  it('aria-valuenow is set when value provided (40 for 0.4)', () => {
    const { getByRole } = render(<Progress value={0.4} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40')
  })

  it('aria-valuenow rounds to nearest integer', () => {
    const { getByRole } = render(<Progress value={0.426} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('43')
  })

  it('aria-valuenow absent when indeterminate', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  })

  it('aria-label falls back to "Loading" when no label or aria-label', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
  })

  it('aria-label set from label prop', () => {
    const { getByRole } = render(<Progress label="Exporting…" />)
    expect(getByRole('progressbar', { name: 'Exporting…' })).toBeInTheDocument()
  })

  it('aria-label set from aria-label prop', () => {
    const { getByRole } = render(<Progress aria-label="Rendering scene" />)
    expect(getByRole('progressbar', { name: 'Rendering scene' })).toBeInTheDocument()
  })
})

// ── Data attributes ────────────────────────────────────────────────────────

describe('Progress — data-indeterminate', () => {
  it('sets data-indeterminate when value is omitted', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar')).toHaveAttribute('data-indeterminate')
  })

  it('no data-indeterminate when value=0', () => {
    const { getByRole } = render(<Progress value={0} />)
    expect(getByRole('progressbar')).not.toHaveAttribute('data-indeterminate')
  })

  it('no data-indeterminate when value=0.5', () => {
    const { getByRole } = render(<Progress value={0.5} />)
    expect(getByRole('progressbar')).not.toHaveAttribute('data-indeterminate')
  })
})

// ── Value clamping ─────────────────────────────────────────────────────────

describe('Progress — value clamping', () => {
  it('clamps value below 0 → aria-valuenow=0', () => {
    const { getByRole } = render(<Progress value={-0.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
  })

  it('clamps value above 1 → aria-valuenow=100', () => {
    const { getByRole } = render(<Progress value={1.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
  })
})

// ── CSS custom property ────────────────────────────────────────────────────

describe('Progress — CSS custom property', () => {
  it('sets --_fill on the bar element when determinate', () => {
    const { getByRole } = render(<Progress value={0.42} />)
    const bar = getByRole('progressbar') as HTMLElement
    expect(bar.style.getPropertyValue('--_fill')).toBe('0.42')
  })

  it('no --_fill on bar when indeterminate', () => {
    const { getByRole } = render(<Progress />)
    const bar = getByRole('progressbar') as HTMLElement
    expect(bar.style.getPropertyValue('--_fill')).toBe('')
  })
})

// ── Ring ───────────────────────────────────────────────────────────────────

describe('Progress ring variant', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Progress variant="ring" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('ring SVG is 40×40 for md', () => {
    const { container } = render(<Progress variant="ring" size="md" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('40')
    expect(svg.getAttribute('height')).toBe('40')
  })

  it('ring SVG is 24×24 for sm', () => {
    const { container } = render(<Progress variant="ring" size="sm" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('24')
  })

  it('ring fill circle has stroke-dasharray when determinate', () => {
    const { container } = render(<Progress variant="ring" value={0.5} />)
    const fills = container.querySelectorAll('circle')
    const fill = fills[fills.length - 1]
    expect(fill.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('ring indeterminate: fill circle stroke-dasharray contains two values', () => {
    const { container } = render(<Progress variant="ring" />)
    const fills = container.querySelectorAll('circle')
    const fill = fills[fills.length - 1]
    const da = fill.getAttribute('stroke-dasharray') ?? ''
    expect(da.split(' ').length).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/progress && npx vitest run src/components/Progress/
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/progress
git add src/components/Progress/
git commit -m "feat(Progress): bar + ring, determinate + indeterminate, all states

Decisions:
- Fill color: --accent (generic progress per KIT-LEAD §6, not semantic LED)
- Bar indeterminate: traveling 30% shimmer with gradient fade on ends
- Ring indeterminate: 35% arc rotating -90deg→270deg, 1.4s linear
- Reduced-motion: functional fill keeps transition; decorative sweep/spin
  replaced by opacity pulse (bar-pulse / ring-pulse keyframes)
- Ring sizes: md=40px r=16 sw=3 (circ≈100.5) / sm=24px r=9 sw=2 (circ≈56.5)
- ARIA: role=progressbar, aria-valuenow absent when indeterminate (ARIA spec)
- Label renders below the control, --font-ui --text-sm --text-muted"
```

---

## Task 3: Gallery Demo

**Files:**
- Create: `src/components/Progress/Progress.demo.tsx`

- [ ] **Step 1: Write Progress.demo.tsx**

```tsx
// src/components/Progress/Progress.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Progress } from './Progress'

export const meta: DemoMeta = {
  name: 'Progress',
  group: 'Primitives',
  route: '/progress',
  order: 16,
}

// ── Bar states ────────────────────────────────────────────────────────────

function BarStates() {
  return (
    <StatesGrid>
      <State label="Bar 0%">
        <div style={{ width: 200 }}>
          <Progress value={0} aria-label="0%" />
        </div>
      </State>
      <State label="Bar 40%">
        <div style={{ width: 200 }}>
          <Progress value={0.4} aria-label="40%" />
        </div>
      </State>
      <State label="Bar 100%">
        <div style={{ width: 200 }}>
          <Progress value={1} aria-label="100%" />
        </div>
      </State>
      <State label="Bar indeterminate">
        <div style={{ width: 200 }}>
          <Progress aria-label="Loading" />
        </div>
      </State>
      <State label="Bar with label">
        <div style={{ width: 200 }}>
          <Progress value={0.6} label="Scanning plugins… 60%" />
        </div>
      </State>
      <State label="Bar sm 40%">
        <div style={{ width: 200 }}>
          <Progress value={0.4} size="sm" aria-label="40% small" />
        </div>
      </State>
      <State label="Bar sm indeterminate">
        <div style={{ width: 200 }}>
          <Progress size="sm" aria-label="Loading small" />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Ring states ───────────────────────────────────────────────────────────

function RingStates() {
  return (
    <section style={{ marginTop: 'var(--space-6)' }}>
      <h2 style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        fontWeight: 'var(--weight-medium)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 'var(--space-4)',
      }}>
        Ring variant
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {[
          { label: 'Ring 0%',             value: 0 as number | undefined,    size: 'md' as const },
          { label: 'Ring 40%',            value: 0.4,                        size: 'md' as const },
          { label: 'Ring 100%',           value: 1,                          size: 'md' as const },
          { label: 'Ring indeterminate',  value: undefined,                  size: 'md' as const },
          { label: 'Ring sm 0%',          value: 0,                          size: 'sm' as const },
          { label: 'Ring sm 40%',         value: 0.4,                        size: 'sm' as const },
          { label: 'Ring sm 100%',        value: 1,                          size: 'sm' as const },
          { label: 'Ring sm indet.',      value: undefined,                  size: 'sm' as const },
        ].map(({ label, value, size }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Progress variant="ring" value={value} size={size} aria-label={label} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
              {label}
            </span>
          </div>
        ))}
        {/* Ring with label prop */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Progress variant="ring" value={0.75} label="Exporting…" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
            Ring + label
          </span>
        </div>
      </div>
    </section>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [variant, setVariant] = useState<'bar' | 'ring'>('bar')
  const [indeterminate, setIndeterminate] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [value, setValue] = useState(0.4)
  const [showLabel, setShowLabel] = useState(false)

  const progressValue = indeterminate ? undefined : value

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live instance */}
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          {variant === 'bar' ? (
            <Progress
              variant="bar"
              value={progressValue}
              size={size}
              label={showLabel ? 'Rendering…' : undefined}
              aria-label={showLabel ? undefined : 'Progress playground'}
            />
          ) : (
            <Progress
              variant="ring"
              value={progressValue}
              size={size}
              label={showLabel ? 'Rendering…' : undefined}
              aria-label={showLabel ? undefined : 'Progress playground'}
            />
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={variant === 'ring'}
            onChange={(next) => setVariant(next ? 'ring' : 'bar')}
            size="sm"
            label="ring variant"
          />
          <Toggle
            checked={indeterminate}
            onChange={(next) => setIndeterminate(next)}
            size="sm"
            label="indeterminate"
          />
          <Toggle
            checked={size === 'sm'}
            onChange={(next) => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size sm"
          />
          <Toggle
            checked={showLabel}
            onChange={(next) => setShowLabel(next)}
            size="sm"
            label="show label"
          />
          {!indeterminate && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}>
              value
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
                {Math.round(value * 100)}%
              </span>
            </label>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────

export default function ProgressDemo() {
  return (
    <DemoShell meta={meta}>
      <BarStates />
      <RingStates />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/progress && npx vitest run && npx tsc --noEmit
```

Expected: all green.

- [ ] **Step 3: Final commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/progress
git add src/components/Progress/
git commit -m "feat(Progress): gallery demo — all bar + ring states, Playground"
```
