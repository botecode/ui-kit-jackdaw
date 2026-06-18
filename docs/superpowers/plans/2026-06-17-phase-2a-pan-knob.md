# PanKnob Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `PanKnob` primitive — a Chroma-Console-inspired tactile rotary pan control with knurled-grip SVG rendering, 1:1 drag, native scroll, full keyboard, spring-settle reset, and gallery demo.

**Architecture:** Two-task prerequisites (extend `useSpring` with seeded-start support, then the component), followed by three component layers — utilities + ARIA shell, SVG + CSS visual, interaction + reset — and a final gallery demo registration. The spring extension is a shared primitive that Fader will reuse.

**Tech Stack:** Vite 6, React 19, TypeScript 5 strict, CSS Modules, `useSpring` from `src/motion/spring.ts`, Vitest + @testing-library/react.

## Global Constraints

- Zero runtime dependencies beyond `react`, `react-dom` — no animation libraries.
- CSS Modules + CSS vars only — no hardcoded colours, sizes, durations, or fonts anywhere in component files.
- Tokens that exist (verify in `src/tokens/types.ts`): `--surface-2`, `--border`, `--border-strong`, `--accent`, `--accent-contrast`, `--bg`, `--text-muted`, `--radius`. Structural tokens from `global.css`: `--font-mono`, `--text-xs`, `--space-1`, `--dur-fast`, `--ease-out`.
- `ThemeTokens` interface must not be modified.
- `npx tsc --noEmit` clean after every task.
- All existing tests (`npm run test`) must continue to pass.
- `:focus-visible` only for focus ring — never `:focus`.
- Scroll prevention via native listener with `{ passive: false }` — never React `onWheel`.

---

## File Map

```
src/motion/spring.ts                          ← extend Config with from + key
src/motion/spring.test.ts                     ← add seeding tests

src/components/PanKnob/
  PanKnob.tsx                                 ← component + helpers
  PanKnob.module.css                          ← visual styles (tokens only)
  PanKnob.test.tsx                            ← all tests
  PanKnob.demo.tsx                            ← gallery demo
  index.ts                                    ← re-export

src/gallery/planned.ts                        ← remove PanKnob entry
```

---

### Task 1: Extend `useSpring` with seeded-start support (`from` + `key`)

The existing `useSpring` maintains internal `{ pos, vel }` across renders. Without seeding, a double-click reset fires `useSpring(0)` but the spring's internal `pos` is already near 0 (from wherever it last settled) — the knob snaps rather than gliding from the current drag position. This extension lets callers provide a `from` position and a `key` to force the seed on repeated resets. **Fader's reset-to-unity will use the identical extension.**

**Files:**
- Modify: `src/motion/spring.ts`
- Modify: `src/motion/spring.test.ts`

**Interfaces:**
- Produces: `useSpring(target, { stiffness?, damping?, from?, key? }): number`
  - When `from` is provided and changes (or `key` increments), the effect re-runs and seeds `state.current = { pos: from, vel: 0 }` before starting the RAF loop.

- [ ] **Step 1: Write the failing tests**

```ts
// Add to src/motion/spring.test.ts (after existing tests):

describe('from + key seeding', () => {
  it('accepts from and key without error', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useSpring(50, { from: 100, key: 1 }))
    // Initial useState value is target; spring will animate from 100 → 50
    expect(result.current).toBe(50)
  })

  it('snaps to target under reduced-motion even when from is provided', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useSpring(50, { from: 100, key: 1 }))
    expect(result.current).toBe(50)
  })

  it('re-seeds when key increments (same from value)', () => {
    mockMatchMedia(true)
    const { result, rerender } = renderHook(
      ({ t, k }: { t: number; k: number }) => useSpring(t, { from: 0, key: k }),
      { initialProps: { t: 0, k: 0 } },
    )
    expect(result.current).toBe(0)
    rerender({ t: 0, k: 1 }) // same from=0, same target=0, new key
    expect(result.current).toBe(0) // still correct (reduced-motion snaps)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm run test -- spring
```

Expected: FAIL — `useSpring` does not accept `from` or `key` (TypeScript error or runtime ignore).

- [ ] **Step 3: Extend `src/motion/spring.ts`**

Replace the entire file with:

```ts
// src/motion/spring.ts
import { useEffect, useRef, useState } from 'react'

const reducedMotionMql = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)')

interface Config {
  stiffness?: number
  damping?: number
  // Seed: when `from` is provided and `key` changes (or `from` changes),
  // the spring internal state is reset to { pos: from, vel: 0 } before
  // animating toward `target`. Increment `key` to force re-seed even
  // when `from` value is numerically unchanged (e.g. repeated resets
  // from the same position).
  from?: number
  key?: number
}

// Critically-damped spring using symplectic (semi-implicit) Euler integration.
// Default: stiffness 200, damping 30 → ζ ≈ 1.06 (just past critical: zero overshoot).
// Heavier settle (resize divider): { stiffness: 120, damping: 22 } → ζ ≈ 1.0.
//
// UNIT CONTRACT: target must be in PIXELS (or degree-range values ~0–135).
// The settle epsilon (0.01) is calibrated for those magnitudes and will
// cause early settle on a normalised 0–1 input.
//
// Brand rule: weight ≠ bounce. Tune for firm, authoritative settle. Never
// increase stiffness to the point of overshoot — that's the tell of a toy.
export function useSpring(
  target: number,
  { stiffness = 200, damping = 30, from, key = 0 }: Config = {},
) {
  const [value, setValue] = useState(target)
  const state = useRef({ pos: target, vel: 0 })
  const rafId = useRef(0)

  useEffect(() => {
    // Seed internal position when caller provides a start point.
    if (from !== undefined) {
      state.current = { pos: from, vel: 0 }
    }

    const mql = reducedMotionMql()

    if (mql.matches) {
      cancelAnimationFrame(rafId.current)
      setValue(target)
      state.current = { pos: target, vel: 0 }
      return
    }

    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now

      // Symplectic Euler: update velocity first, then position with new velocity.
      const force = stiffness * (target - state.current.pos) - damping * state.current.vel
      state.current.vel += force * dt
      state.current.pos += state.current.vel * dt

      const settled =
        Math.abs(target - state.current.pos) < 0.01 &&
        Math.abs(state.current.vel) < 0.01

      if (settled) {
        setValue(target)
        state.current = { pos: target, vel: 0 }
        return
      }

      setValue(state.current.pos)
      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)

    const onMqlChange = () => {
      if (mql.matches) {
        cancelAnimationFrame(rafId.current)
        state.current = { pos: target, vel: 0 }
        setValue(target)
      }
    }
    mql.addEventListener('change', onMqlChange)

    return () => {
      cancelAnimationFrame(rafId.current)
      mql.removeEventListener('change', onMqlChange)
    }
  }, [target, stiffness, damping, from, key])

  return value
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm run test -- spring
```

Expected: 6 passing (3 existing + 3 new).

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/motion/spring.ts src/motion/spring.test.ts
git commit -m "feat(spring): add from + key config for seeded-start animations"
```

---

### Task 2: PanKnob — pure utilities + ARIA component shell

Pure functions (`panToAngle`, `formatReadout`, `formatAriaValueText`, `clamp`) and a component skeleton with correct ARIA — no SVG yet, just a `<div>` wrapper so the ARIA tests pass. This gives a reviewable gate on the API contract before adding visual complexity.

**Files:**
- Create: `src/components/PanKnob/PanKnob.tsx`
- Create: `src/components/PanKnob/PanKnob.test.tsx`
- Create: `src/components/PanKnob/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export function clamp(value: number, min: number, max: number): number
  export function panToAngle(pan: number): number   // returns degrees −135..135
  export function formatReadout(pan: number): string   // "L20" | "C" | "R35"
  export function formatAriaValueText(pan: number): string  // "Left 20" | "Center" | "Right 35"
  export interface PanKnobProps { pan, onChange, size?, color?, resetValue?, disabled?, aria-label? }
  export function PanKnob(props: PanKnobProps): JSX.Element
  ```

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/PanKnob/PanKnob.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PanKnob, panToAngle, formatReadout, formatAriaValueText, clamp } from './PanKnob'

describe('clamp', () => {
  it('returns value within range', () => expect(clamp(0.5, -1, 1)).toBe(0.5))
  it('clamps below min',         () => expect(clamp(-2, -1, 1)).toBe(-1))
  it('clamps above max',         () => expect(clamp(2, -1, 1)).toBe(1))
  it('returns min exactly',      () => expect(clamp(-1, -1, 1)).toBe(-1))
  it('returns max exactly',      () => expect(clamp(1, -1, 1)).toBe(1))
})

describe('panToAngle', () => {
  it('maps 0 to 0°',     () => expect(panToAngle(0)).toBe(0))
  it('maps 1 to 135°',   () => expect(panToAngle(1)).toBe(135))
  it('maps -1 to -135°', () => expect(panToAngle(-1)).toBe(-135))
  it('clamps > 1',       () => expect(panToAngle(1.5)).toBe(135))
  it('clamps < -1',      () => expect(panToAngle(-1.5)).toBe(-135))
  it('maps 0.5 to 67.5°', () => expect(panToAngle(0.5)).toBe(67.5))
})

describe('formatReadout', () => {
  it('0 → "C"',        () => expect(formatReadout(0)).toBe('C'))
  it('-0.2 → "L20"',   () => expect(formatReadout(-0.2)).toBe('L20'))
  it('0.35 → "R35"',   () => expect(formatReadout(0.35)).toBe('R35'))
  it('0.204 → "R20"',  () => expect(formatReadout(0.204)).toBe('R20'))
  it('1 → "R100"',     () => expect(formatReadout(1)).toBe('R100'))
  it('-1 → "L100"',    () => expect(formatReadout(-1)).toBe('L100'))
  it('near-zero negative → "C"', () => expect(formatReadout(-0.001)).toBe('C'))
})

describe('formatAriaValueText', () => {
  it('0 → "Center"',       () => expect(formatAriaValueText(0)).toBe('Center'))
  it('-0.2 → "Left 20"',   () => expect(formatAriaValueText(-0.2)).toBe('Left 20'))
  it('0.35 → "Right 35"',  () => expect(formatAriaValueText(0.35)).toBe('Right 35'))
})

describe('PanKnob accessibility', () => {
  const noop = vi.fn()

  it('has role="slider"', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider')).toBeDefined()
  })

  it('aria-valuemin=-1 aria-valuemax=1', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    const el = getByRole('slider')
    expect(el.getAttribute('aria-valuemin')).toBe('-1')
    expect(el.getAttribute('aria-valuemax')).toBe('1')
  })

  it('aria-valuenow reflects pan prop', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuenow')).toBe('0.5')
  })

  it('aria-valuetext "Center" at pan=0', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuetext')).toBe('Center')
  })

  it('aria-valuetext "Left 20" at pan=-0.2', () => {
    const { getByRole } = render(<PanKnob pan={-0.2} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-valuetext')).toBe('Left 20')
  })

  it('aria-label defaults to "Pan"', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Pan')
  })

  it('custom aria-label', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} aria-label="Track Pan" />)
    expect(getByRole('slider').getAttribute('aria-label')).toBe('Track Pan')
  })

  it('aria-disabled when disabled prop set', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('aria-disabled')).toBe('true')
  })

  it('tabIndex=0 by default', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('0')
  })

  it('tabIndex=-1 when disabled', () => {
    const { getByRole } = render(<PanKnob pan={0} onChange={noop} disabled />)
    expect(getByRole('slider').getAttribute('tabindex')).toBe('-1')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test -- PanKnob
```

Expected: FAIL — `Cannot find module './PanKnob'`.

- [ ] **Step 3: Create `src/components/PanKnob/PanKnob.tsx`**

```tsx
// src/components/PanKnob/PanKnob.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'

// ─── Pure utilities (exported for tests) ───────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** pan ∈ [−1, 1] → degrees ∈ [−135, 135] */
export function panToAngle(pan: number): number {
  return clamp(pan * 135, -135, 135)
}

/** Short visual readout: "L20" | "C" | "R35" */
export function formatReadout(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'C'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `L${pct}` : `R${pct}`
}

/** Long form for aria-valuetext: "Left 20" | "Center" | "Right 35" */
export function formatAriaValueText(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'Center'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `Left ${pct}` : `Right ${pct}`
}

// ─── Component ─────────────────────────────────────────────────────────────

export interface PanKnobProps {
  pan: number
  onChange: (pan: number) => void
  size?: 'sm' | 'md'
  /** Cap fill — any CSS color value (default: var(--accent)) */
  color?: string
  /** Double-click / keyboard-reset target (kit-wide convention). Default: 0 */
  resetValue?: number
  disabled?: boolean
  'aria-label'?: string
}

export function PanKnob({
  pan,
  onChange,
  size = 'md',
  color,
  resetValue = 0,
  disabled = false,
  'aria-label': ariaLabel = 'Pan',
}: PanKnobProps) {
  // Placeholder shell — SVG added in Task 3
  return (
    <div>
      <div
        role="slider"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={pan}
        aria-valuetext={formatAriaValueText(pan)}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        data-size={size}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/PanKnob/index.ts`**

```ts
// src/components/PanKnob/index.ts
export { PanKnob } from './PanKnob'
export type { PanKnobProps } from './PanKnob'
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm run test -- PanKnob
```

Expected: all new tests + existing tests PASS.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/PanKnob/
git commit -m "feat(PanKnob): pure utilities and ARIA component shell"
```

---

### Task 3: PanKnob — SVG visual rendering + CSS

Replace the placeholder `<div>` with the full two-layer SVG: static well + ticks, rotating grip + cap + pointer. Add `PanKnob.module.css` for all visual states.

**Files:**
- Modify: `src/components/PanKnob/PanKnob.tsx` (replace shell with SVG)
- Create: `src/components/PanKnob/PanKnob.module.css`
- Modify: `src/components/PanKnob/PanKnob.test.tsx` (add SVG render tests)

**Interfaces:**
- Consumes: `panToAngle(pan)` from Task 2
- Consumes: `useSpring(target, config)` from Task 1 (used from Task 4 onward; import now)

- [ ] **Step 1: Write the failing SVG tests**

```tsx
// Add to src/components/PanKnob/PanKnob.test.tsx:

describe('PanKnob rendering', () => {
  const noop = vi.fn()

  it('renders an SVG element', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('rotating group has correct transform at pan=0', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const body = container.querySelector('[data-testid="knob-body"]')
    expect(body?.getAttribute('style')).toContain('rotate(0deg)')
  })

  it('rotating group has correct transform at pan=1', () => {
    const { container } = render(<PanKnob pan={1} onChange={noop} />)
    const body = container.querySelector('[data-testid="knob-body"]')
    expect(body?.getAttribute('style')).toContain('rotate(135deg)')
  })

  it('rotating group has correct transform at pan=-0.5', () => {
    const { container } = render(<PanKnob pan={-0.5} onChange={noop} />)
    const body = container.querySelector('[data-testid="knob-body"]')
    expect(body?.getAttribute('style')).toContain('rotate(-67.5deg)')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('svg')?.getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size prop is sm', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} size="sm" />)
    expect(container.querySelector('svg')?.getAttribute('data-size')).toBe('sm')
  })

  it('renders 13 tick mark lines', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const ticks = container.querySelectorAll('[data-testid="tick"]')
    expect(ticks.length).toBe(13)
  })

  it('readout span is in the DOM', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="readout"]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test -- PanKnob
```

Expected: FAIL — no `[data-testid="knob-body"]` or `<svg>` in the placeholder shell.

- [ ] **Step 3: Create `src/components/PanKnob/PanKnob.module.css`**

```css
/* src/components/PanKnob/PanKnob.module.css */

.root {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.root[data-dragging] {
  cursor: grabbing;
}

.disabled {
  pointer-events: none;
  opacity: 0.4;
}

.knob {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  outline: none;
  touch-action: none;
}

.knob[data-size="sm"] {
  width: 32px;
  height: 32px;
}

/* Circular focus ring — keyboard-initiated focus only */
.knob:focus-visible {
  box-shadow: 0 0 0 2px var(--accent);
}

.readout {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  line-height: 1;
  height: 1em;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.root:hover .readout,
.root[data-dragging] .readout {
  opacity: 1;
}
```

- [ ] **Step 4: Replace `PanKnob.tsx` with full SVG implementation**

```tsx
// src/components/PanKnob/PanKnob.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { useSpring } from '../../motion/spring'
import styles from './PanKnob.module.css'

// ─── Pure utilities (exported for tests) ───────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function panToAngle(pan: number): number {
  return clamp(pan * 135, -135, 135)
}

export function formatReadout(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'C'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `L${pct}` : `R${pct}`
}

export function formatAriaValueText(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'Center'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `Left ${pct}` : `Right ${pct}`
}

// ─── Component ─────────────────────────────────────────────────────────────

export interface PanKnobProps {
  pan: number
  onChange: (pan: number) => void
  size?: 'sm' | 'md'
  color?: string
  resetValue?: number
  disabled?: boolean
  'aria-label'?: string
}

export function PanKnob({
  pan,
  onChange,
  size = 'md',
  color,
  resetValue = 0,
  disabled = false,
  'aria-label': ariaLabel = 'Pan',
}: PanKnobProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const panRef = useRef(pan)
  const onChangeRef = useRef(onChange)
  const uid = useId()
  const gradId = `jd-cap-${uid.replace(/:/g, '')}`

  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, pan: 0, shift: false })

  const [resetting, setResetting] = useState(false)
  const [resetSeed, setResetSeed] = useState(() => ({
    from: panToAngle(pan), key: 0, target: panToAngle(pan),
  }))

  const springAngle = useSpring(resetSeed.target, {
    stiffness: 200,
    damping: 30,
    from: resetSeed.from,
    key: resetSeed.key,
  })

  const displayAngle = resetting ? springAngle : panToAngle(pan)

  // Sync mutable refs every render so stable callbacks read current values
  useEffect(() => { panRef.current = pan })
  useEffect(() => { onChangeRef.current = onChange })

  // End reset mode once spring has settled
  useEffect(() => {
    if (resetting && Math.abs(springAngle - resetSeed.target) < 0.5) {
      setResetting(false)
    }
  }, [resetting, springAngle, resetSeed.target])

  // Native wheel listener — must be non-passive to call preventDefault()
  useEffect(() => {
    const el = svgRef.current!
    const onWheel = (e: WheelEvent) => {
      if (disabled) return
      e.preventDefault()
      const delta = clamp(-e.deltaY * 0.0015, -0.08, 0.08)
      onChangeRef.current(clamp(panRef.current + delta, -1, 1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [disabled])

  // Interaction handlers added in Task 4 — placeholders keep TypeScript happy
  function handlePointerDown(_e: React.PointerEvent) {}
  function handlePointerMove(_e: React.PointerEvent) {}
  function handlePointerUp() {}
  function handleDoubleClick() {}
  function handleKeyDown(_e: React.KeyboardEvent) {}

  const knurlCount = size === 'sm' ? 16 : 24
  const capColor = color ?? 'var(--accent)'

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-dragging={dragging || undefined}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 40 40"
        className={styles.knob}
        data-size={size}
        role="slider"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={pan}
        aria-valuetext={formatAriaValueText(pan)}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
        <defs>
          <radialGradient id={gradId} cx="38%" cy="28%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Static layer: recessed well ── */}
        <circle cx="20" cy="20" r="18" fill="var(--surface-2)" />
        <circle
          cx="20" cy="20" r="17.5"
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity="0.4"
        />

        {/* ── Static layer: 13 tick marks −135°..+135° at 22.5° steps ── */}
        {Array.from({ length: 13 }, (_, i) => {
          const deg = -135 + i * 22.5
          const rad = (deg * Math.PI) / 180
          const center = i === 6
          return (
            <line
              key={i}
              data-testid="tick"
              x1={20 + Math.sin(rad) * 15.5} y1={20 - Math.cos(rad) * 15.5}
              x2={20 + Math.sin(rad) * (center ? 17.5 : 16.5)}
              y2={20 - Math.cos(rad) * (center ? 17.5 : 16.5)}
              stroke={center ? 'var(--border-strong)' : 'var(--border)'}
              strokeWidth={center ? 1.5 : 0.8}
              shapeRendering="crispEdges"
            />
          )
        })}

        {/* ── Rotating layer: knurled grip + cap + pointer ── */}
        <g
          data-testid="knob-body"
          style={{
            transform: `rotate(${displayAngle}deg)`,
            transformOrigin: '20px 20px',
          }}
        >
          {/* Knurled grip lines — outer band only (r 10→14), no inner fill */}
          {Array.from({ length: knurlCount }, (_, i) => {
            const rad = ((360 / knurlCount) * i * Math.PI) / 180
            return (
              <line
                key={i}
                x1={20 + Math.sin(rad) * 10} y1={20 - Math.cos(rad) * 10}
                x2={20 + Math.sin(rad) * 14} y2={20 - Math.cos(rad) * 14}
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.5"
                shapeRendering="crispEdges"
              />
            )
          })}

          {/* Colored cap */}
          <circle cx="20" cy="20" r="9.5" fill={capColor} />
          {/* Soft top-highlight — radial gradient; no filter (no re-raster on rotate) */}
          <circle cx="20" cy="20" r="9.5" fill={`url(#${gradId})`} />

          {/* Pointer notch — uses accent-contrast so it's legible on any theme's accent */}
          <rect
            x="19" y="12.5" width="2" height="4" rx="1"
            fill="var(--accent-contrast)"
            stroke="var(--bg)" strokeWidth="0.5" strokeOpacity="0.4"
          />
        </g>
      </svg>

      <span className={styles.readout} data-testid="readout" aria-hidden="true">
        {formatReadout(pan)}
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — verify all pass**

```bash
npm run test -- PanKnob
```

Expected: all tests PASS (including new SVG render tests).

- [ ] **Step 6: Typecheck + build**

```bash
npx tsc --noEmit && npm run build
```

Expected: zero errors, successful build.

- [ ] **Step 7: Commit**

```bash
git add src/components/PanKnob/
git commit -m "feat(PanKnob): SVG rendering — well, ticks, rotating grip+cap+pointer"
```

---

### Task 4: PanKnob — interaction (drag, scroll, keyboard, reset)

Wire all event handlers: pointer drag (1:1, Shift+drag fine mode), keyboard (full map), double-click reset (spring settle). The native wheel listener was attached in Task 3's `useEffect`; this task completes the remaining handlers.

**Files:**
- Modify: `src/components/PanKnob/PanKnob.tsx` (replace placeholder handlers with real implementations)
- Modify: `src/components/PanKnob/PanKnob.test.tsx` (add keyboard, reset, and reduced-motion tests)

**Interfaces:**
- Consumes: `useSpring(target, { from, key })` from Task 1 — already imported

- [ ] **Step 1: Write the failing interaction tests**

```tsx
// Add to src/components/PanKnob/PanKnob.test.tsx:
import { fireEvent } from '@testing-library/react'

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

describe('PanKnob keyboard', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  function getSlider(pan: number) {
    const { getByRole } = render(<PanKnob pan={pan} onChange={noop} />)
    return getByRole('slider')
  }

  it('ArrowRight → +0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowRight' })
    expect(noop).toHaveBeenCalledWith(0.05)
  })
  it('ArrowLeft → -0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowLeft' })
    expect(noop).toHaveBeenCalledWith(-0.05)
  })
  it('ArrowUp → +0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowUp' })
    expect(noop).toHaveBeenCalledWith(0.05)
  })
  it('ArrowDown → -0.05', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowDown' })
    expect(noop).toHaveBeenCalledWith(-0.05)
  })
  it('Shift+ArrowRight → +0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowRight', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('Shift+ArrowLeft → -0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'ArrowLeft', shiftKey: true })
    expect(noop).toHaveBeenCalledWith(-0.25)
  })
  it('PageUp → +0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'PageUp' })
    expect(noop).toHaveBeenCalledWith(0.25)
  })
  it('PageDown → -0.25', () => {
    fireEvent.keyDown(getSlider(0), { key: 'PageDown' })
    expect(noop).toHaveBeenCalledWith(-0.25)
  })
  it('Home → -1', () => {
    fireEvent.keyDown(getSlider(0), { key: 'Home' })
    expect(noop).toHaveBeenCalledWith(-1)
  })
  it('End → +1', () => {
    fireEvent.keyDown(getSlider(0), { key: 'End' })
    expect(noop).toHaveBeenCalledWith(1)
  })
  it('ArrowRight at pan=1 does not exceed 1', () => {
    fireEvent.keyDown(getSlider(1), { key: 'ArrowRight' })
    const called = noop.mock.calls[0]?.[0]
    expect(called).toBeLessThanOrEqual(1)
  })
  it('ArrowLeft at pan=-1 does not go below -1', () => {
    fireEvent.keyDown(getSlider(-1), { key: 'ArrowLeft' })
    const called = noop.mock.calls[0]?.[0]
    expect(called).toBeGreaterThanOrEqual(-1)
  })
})

describe('PanKnob reset gesture', () => {
  const noop = vi.fn()
  beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

  it('double-click calls onChange(0) with default resetValue', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('double-click calls onChange(resetValue) with custom resetValue', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} resetValue={0.2} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(noop).toHaveBeenCalledWith(0.2)
  })

  it('Delete key calls onChange(0)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Delete' })
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('Backspace key calls onChange(0)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Backspace' })
    expect(noop).toHaveBeenCalledWith(0)
  })

  it('0 key calls onChange(resetValue)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} resetValue={-0.1} />)
    fireEvent.keyDown(getByRole('slider'), { key: '0' })
    expect(noop).toHaveBeenCalledWith(-0.1)
  })

  it('Delete with non-zero resetValue → onChange(resetValue)', () => {
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} resetValue={0.5} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Delete' })
    expect(noop).toHaveBeenCalledWith(0.5)
  })
})

describe('PanKnob reduced-motion', () => {
  it('reset calls onChange(resetValue) immediately under reduced-motion', () => {
    mockMatchMedia(true)
    const noop = vi.fn()
    const { getByRole } = render(<PanKnob pan={0.5} onChange={noop} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(noop).toHaveBeenCalledWith(0)
  })
})
```

- [ ] **Step 2: Run tests — verify the new ones fail**

```bash
npm run test -- PanKnob
```

Expected: keyboard and reset tests FAIL (placeholder handlers do nothing).

- [ ] **Step 3: Replace placeholder handlers in `PanKnob.tsx`**

In `src/components/PanKnob/PanKnob.tsx`, replace the four placeholder handler functions with:

```tsx
  function handleReset() {
    if (disabled) return
    onChange(resetValue)
    setResetSeed(prev => ({
      from: panToAngle(pan),   // current visual position before reset
      key: prev.key + 1,       // force re-seed even if from value is same
      target: panToAngle(resetValue),
    }))
    setResetting(true)
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { y: e.clientY, pan, shift: e.shiftKey }
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const dy = e.clientY - dragStart.current.y
    // Shift = fine mode (÷5 sensitivity)
    const sensitivity = dragStart.current.shift ? 0.0014 : 0.007
    const next = clamp(dragStart.current.pan + dy * -sensitivity, -1, 1)
    onChange(next)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleDoubleClick() {
    handleReset()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const step = e.shiftKey ? 0.25 : 0.05
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   next = clamp(pan + step, -1, 1); break
      case 'ArrowLeft':
      case 'ArrowDown': next = clamp(pan - step, -1, 1); break
      case 'PageUp':    next = clamp(pan + 0.25, -1, 1); break
      case 'PageDown':  next = clamp(pan - 0.25, -1, 1); break
      case 'Home':      next = -1; break
      case 'End':       next = 1;  break
      case 'Backspace':
      case 'Delete':
      case '0':         handleReset(); return
      default: return
    }
    e.preventDefault()
    if (next !== null) onChange(next)
  }
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm run test
```

Expected: all tests PASS — existing (spring + hashRoute + ThemeProvider) + all PanKnob tests.

- [ ] **Step 5: Typecheck + build**

```bash
npx tsc --noEmit && npm run build
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/PanKnob/PanKnob.tsx src/components/PanKnob/PanKnob.test.tsx
git commit -m "feat(PanKnob): drag, scroll, keyboard, and spring-settle reset"
```

---

### Task 5: PanKnob — demo + gallery registration

Register the component in the gallery. The sidebar entry auto-appears once the `.demo.tsx` file exports the correct `meta` object; remove the corresponding `PLANNED` stub.

**Files:**
- Create: `src/components/PanKnob/PanKnob.demo.tsx`
- Modify: `src/gallery/planned.ts` (remove PanKnob entry)

**Interfaces:**
- Consumes: `DemoMeta` from `src/gallery/registry.ts`
- Consumes: `DemoShell`, `StatesGrid`, `State`, `Playground` from `src/gallery/ui/`

- [ ] **Step 1: Create `src/components/PanKnob/PanKnob.demo.tsx`**

```tsx
// src/components/PanKnob/PanKnob.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State, REQUIRED_STATES } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { PanKnob } from './PanKnob'

export const meta: DemoMeta = {
  name: 'PanKnob',
  group: 'Primitives',
  route: '/pan-knob',
  order: 1,
}

// ── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Default">
        <PanKnob pan={0} onChange={noop} />
      </State>
      <State label="L40">
        <PanKnob pan={-0.4} onChange={noop} />
      </State>
      <State label="R75">
        <PanKnob pan={0.75} onChange={noop} />
      </State>
      <State label="sm size">
        <PanKnob pan={0.3} onChange={noop} size="sm" />
      </State>
      <State label="Custom color">
        <PanKnob pan={0} onChange={noop} color="var(--accent-green)" />
      </State>
      <State label="Disabled">
        <PanKnob pan={0.3} onChange={noop} disabled />
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [pan, setPan] = useState(0)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [color, setColor] = useState('')
  const [resetValue, setResetValue] = useState(0)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
        <div>
          <PanKnob
            pan={pan}
            onChange={setPan}
            size={size}
            color={color || undefined}
            resetValue={resetValue}
          />
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            marginTop: 'var(--space-2)',
            textAlign: 'center',
          }}>
            double-click to reset
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            pan: {pan.toFixed(2)}
            <input
              type="range" min={-1} max={1} step={0.01}
              value={pan}
              onChange={e => setPan(Number(e.target.value))}
              style={{ display: 'block', width: '140px' }}
            />
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            size
            <select value={size} onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}>
              <option value="md">md (40px)</option>
              <option value="sm">sm (32px)</option>
            </select>
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            color (CSS value)
            <input
              type="text"
              value={color}
              placeholder="var(--accent)"
              onChange={e => setColor(e.target.value)}
              style={{ display: 'block', width: '160px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
            />
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            resetValue: {resetValue}
            <input
              type="range" min={-1} max={1} step={0.01}
              value={resetValue}
              onChange={e => setResetValue(Number(e.target.value))}
              style={{ display: 'block', width: '140px' }}
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export (the gallery page) ────────────────────────────────────────

export default function PanKnobDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Remove PanKnob from `src/gallery/planned.ts`**

In `src/gallery/planned.ts`, delete the line:
```ts
  { name: 'PanKnob',  group: 'Primitives', route: '/pan-knob' },
```

- [ ] **Step 3: Build and verify gallery registration**

```bash
npm run build
```

Expected: build succeeds. The `PanKnob` entry should no longer appear as a dimmed item — it'll be discovered via `import.meta.glob` from the `.demo.tsx` file.

- [ ] **Step 4: Run all tests**

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PanKnob/PanKnob.demo.tsx src/gallery/planned.ts
git commit -m "feat(PanKnob): gallery demo + registration"
```

---

## DoD checklist (verify before calling the plan done)

- [ ] `npm run test` — all tests pass (including pre-existing spring / hashRoute / ThemeProvider tests)
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run build` — Vite build clean
- [ ] PanKnob appears as a live link in the gallery sidebar (not dimmed)
- [ ] Spring extend: `from` + `key` config accepted by `useSpring` without error
- [ ] Drag 1:1: visual rotation tracks pointer with no spring lag
- [ ] Double-click springs from current angle to reset target (not a snap)
- [ ] Keyboard full map functional (test in browser: focus knob, use arrows, Home/End, Delete)
- [ ] `:focus-visible` ring appears on Tab focus; disappears after click-drag
- [ ] Scroll works on trackpad without scrolling the page
- [ ] Disabled: no focus, no pointer response, dimmed
- [ ] Pointer notch legible in compare mode: default, tropicália, manuscript
- [ ] No hardcoded colours, sizes, durations, or fonts — tokens only
