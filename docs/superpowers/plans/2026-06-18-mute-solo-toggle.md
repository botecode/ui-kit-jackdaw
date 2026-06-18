# MuteSoloToggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `MuteSoloToggle` component — a controlled M/S toggle pair for track headers with LED-recipe lit states, a theme-aware diagonal hatch for the silenced-by-solo state, and full accessibility.

**Architecture:** A single React component wrapping two native `<button>` elements. All visual state is communicated via `data-*` attributes consumed by CSS Modules. LED color is routed through a `--chip-led` CSS custom property set per variant. The silenced-by-solo state is derived from props (never a separate prop) via an exported pure helper `isSilencedBySolo`.

**Tech Stack:** React 19 + TypeScript, CSS Modules, Vitest + @testing-library/react, Vite gallery (auto-discovered via `import.meta.glob`).

## Global Constraints

- CSS Modules only — no Tailwind, no inline styles except `style=` for CSS custom property injection.
- Token usage: `--stage`, `--border`, `--text-dim`, `--text`, `--accent`, `--led-red`, `--led-yellow`, `--font-mono`, `--text-sm`, `--text-xs`, `--dur-led-on`, `--dur-led-off`, `--ease-out`, `--radius`. All are defined in `src/tokens/global.css` or injected by `ThemeProvider`.
- `prefers-reduced-motion`: LED transition durations (`--dur-led-on`, `--dur-led-off`) are zeroed in `global.css` under `@media (prefers-reduced-motion: reduce)` — no component-level rule needed.
- Focus: `:focus-visible` only, never `:focus`.
- Disabled: `pointer-events: none; opacity: 0.4` on the root — same as Fader, PanKnob.
- Gallery: `DemoMeta` exported as `meta`, route `/mute-solo-toggle`, group `'Primitives'`, order `2`.
- Run tests: `npm test` (vitest). Run typecheck: `npx tsc --noEmit`. Run lint: `npx eslint src/` if ESLint is present (check first; skip if not configured).
- Spec: `docs/superpowers/specs/2026-06-18-mute-solo-toggle-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/MuteSoloToggle/MuteSoloToggle.tsx` | Create | Component + `isSilencedBySolo` export |
| `src/components/MuteSoloToggle/MuteSoloToggle.module.css` | Create | All visual styles |
| `src/components/MuteSoloToggle/MuteSoloToggle.test.tsx` | Create | All unit + integration tests |
| `src/components/MuteSoloToggle/MuteSoloToggle.demo.tsx` | Create | Gallery demo page |
| `src/components/MuteSoloToggle/index.ts` | Create | Barrel export |

---

## Task 1: `isSilencedBySolo` pure helper

**Files:**
- Create: `src/components/MuteSoloToggle/MuteSoloToggle.tsx`
- Create: `src/components/MuteSoloToggle/MuteSoloToggle.test.tsx`

**Interfaces:**
- Produces: `export function isSilencedBySolo(muted: boolean, soloed: boolean, anySoloActive: boolean | undefined): boolean`

---

- [ ] **Step 1: Create the test file with the `isSilencedBySolo` truth table**

```tsx
// src/components/MuteSoloToggle/MuteSoloToggle.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MuteSoloToggle, isSilencedBySolo } from './MuteSoloToggle'

describe('isSilencedBySolo', () => {
  it('returns false when anySoloActive=false', () => {
    expect(isSilencedBySolo(false, false, false)).toBe(false)
  })
  it('returns false when anySoloActive=undefined', () => {
    expect(isSilencedBySolo(false, false, undefined)).toBe(false)
  })
  it('returns true when anySoloActive=true, not muted, not soloed', () => {
    expect(isSilencedBySolo(false, false, true)).toBe(true)
  })
  it('returns false when muted=true (explicit mute wins over silenced)', () => {
    expect(isSilencedBySolo(true, false, true)).toBe(false)
  })
  it('returns false when soloed=true', () => {
    expect(isSilencedBySolo(false, true, true)).toBe(false)
  })
  it('returns false when both muted and soloed', () => {
    expect(isSilencedBySolo(true, true, true)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests — expect FAIL (module not found)**

```bash
npm test -- MuteSoloToggle
```

Expected: `Error: Cannot find module './MuteSoloToggle'`

- [ ] **Step 3: Create `MuteSoloToggle.tsx` with only the helper**

```tsx
// src/components/MuteSoloToggle/MuteSoloToggle.tsx

export function isSilencedBySolo(
  muted: boolean,
  soloed: boolean,
  anySoloActive: boolean | undefined,
): boolean {
  return !!anySoloActive && !soloed && !muted
}
```

- [ ] **Step 4: Run the helper tests — expect PASS**

```bash
npm test -- MuteSoloToggle
```

Expected: 6 tests pass under `isSilencedBySolo`.

- [ ] **Step 5: Commit**

```bash
git add src/components/MuteSoloToggle/MuteSoloToggle.tsx \
        src/components/MuteSoloToggle/MuteSoloToggle.test.tsx
git commit -m "feat(MuteSoloToggle): add isSilencedBySolo pure helper + tests"
```

---

## Task 2: Component DOM structure + CSS skeleton

**Files:**
- Modify: `src/components/MuteSoloToggle/MuteSoloToggle.tsx`
- Create: `src/components/MuteSoloToggle/MuteSoloToggle.module.css`
- Create: `src/components/MuteSoloToggle/index.ts`
- Modify: `src/components/MuteSoloToggle/MuteSoloToggle.test.tsx`

**Interfaces:**
- Consumes: `isSilencedBySolo(muted, soloed, anySoloActive)` from Task 1
- Produces:
  ```ts
  export interface MuteSoloToggleProps {
    muted: boolean
    soloed: boolean
    onToggleMute: (e: React.MouseEvent<HTMLButtonElement>) => void
    onToggleSolo: (e: React.MouseEvent<HTMLButtonElement>) => void
    anySoloActive?: boolean
    size?: 'sm' | 'md'
    orientation?: 'stacked' | 'inline'
    disabled?: boolean
    muteLabel?: string
    soloLabel?: string
  }
  export function MuteSoloToggle(props: MuteSoloToggleProps): JSX.Element
  ```

---

- [ ] **Step 1: Add all component tests to the test file**

Append after the `isSilencedBySolo` describe block:

```tsx
// ─── Rendering ──────────────────────────────────────────────────────────────

describe('MuteSoloToggle rendering', () => {
  const noop = vi.fn()

  it('renders two buttons', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')).toHaveLength(2)
  })

  it('M button aria-pressed="false" when muted=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-pressed')).toBe('false')
  })

  it('M button aria-pressed="true" when muted=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('S button aria-pressed="false" when soloed=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('false')
  })

  it('S button aria-pressed="true" when soloed=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('true')
  })

  it('M button default aria-label is "Mute"', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Mute')
  })

  it('S button default aria-label is "Solo"', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1].getAttribute('aria-label')).toBe('Solo')
  })

  it('muteLabel / soloLabel override defaults', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle
        muted={false} soloed={false}
        onToggleMute={noop} onToggleSolo={noop}
        muteLabel="Track Mute" soloLabel="Track Solo"
      />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Track Mute')
    expect(getAllByRole('button')[1].getAttribute('aria-label')).toBe('Track Solo')
  })

  it('M button has data-active when muted=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).toHaveAttribute('data-active')
  })

  it('M button has no data-active when muted=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).not.toHaveAttribute('data-active')
  })

  it('S button has data-active when soloed=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1]).toHaveAttribute('data-active')
  })

  it('S button has no data-active when soloed=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1]).not.toHaveAttribute('data-active')
  })

  it('M button has data-silenced when anySoloActive=true, not muted, not soloed', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).toHaveAttribute('data-silenced')
  })

  it('M button has no data-silenced when not silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).not.toHaveAttribute('data-silenced')
  })

  it('precedence: muted=true + anySoloActive=true → data-active, NOT data-silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    const mButton = getAllByRole('button')[0]
    expect(mButton).toHaveAttribute('data-active')
    expect(mButton).not.toHaveAttribute('data-silenced')
  })

  it('M aria-label is "Mute (silenced by solo)" when silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Mute (silenced by solo)')
  })

  it('M has title="Silenced by solo" when silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('title')).toBe('Silenced by solo')
  })

  it('M has no title when not silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).not.toHaveAttribute('title')
  })

  it('root data-orientation="stacked" by default', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-orientation')).toBe('stacked')
  })

  it('root data-orientation="inline" when orientation="inline"', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} orientation="inline" onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-orientation')).toBe('inline')
  })

  it('root data-size="md" by default', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('md')
  })

  it('root data-size="sm" when size="sm"', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} size="sm" onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('sm')
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('MuteSoloToggle interaction', () => {
  it('clicking M fires onToggleMute with the event', () => {
    const onToggleMute = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={onToggleMute} onToggleSolo={vi.fn()} />
    )
    fireEvent.click(getAllByRole('button')[0])
    expect(onToggleMute).toHaveBeenCalledOnce()
  })

  it('clicking S fires onToggleSolo with the event', () => {
    const onToggleSolo = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={vi.fn()} onToggleSolo={onToggleSolo} />
    )
    fireEvent.click(getAllByRole('button')[1])
    expect(onToggleSolo).toHaveBeenCalledOnce()
  })

  it('disabled: clicking M does not fire onToggleMute', () => {
    const onToggleMute = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} disabled onToggleMute={onToggleMute} onToggleSolo={vi.fn()} />
    )
    fireEvent.click(getAllByRole('button')[0])
    expect(onToggleMute).not.toHaveBeenCalled()
  })

  it('disabled: clicking S does not fire onToggleSolo', () => {
    const onToggleSolo = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} disabled onToggleMute={vi.fn()} onToggleSolo={onToggleSolo} />
    )
    fireEvent.click(getAllByRole('button')[1])
    expect(onToggleSolo).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the new tests — expect FAIL**

```bash
npm test -- MuteSoloToggle
```

Expected: `MuteSoloToggle` is not a function / component tests fail (no component exported yet).

- [ ] **Step 3: Implement the full component in `MuteSoloToggle.tsx`**

Replace the entire file contents:

```tsx
// src/components/MuteSoloToggle/MuteSoloToggle.tsx
import styles from './MuteSoloToggle.module.css'

// ─── Pure utility ───────────────────────────────────────────────────────────

export function isSilencedBySolo(
  muted: boolean,
  soloed: boolean,
  anySoloActive: boolean | undefined,
): boolean {
  return !!anySoloActive && !soloed && !muted
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface MuteSoloToggleProps {
  muted: boolean
  soloed: boolean
  onToggleMute: (e: React.MouseEvent<HTMLButtonElement>) => void
  onToggleSolo: (e: React.MouseEvent<HTMLButtonElement>) => void
  anySoloActive?: boolean
  size?: 'sm' | 'md'
  orientation?: 'stacked' | 'inline'
  disabled?: boolean
  muteLabel?: string
  soloLabel?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MuteSoloToggle({
  muted,
  soloed,
  onToggleMute,
  onToggleSolo,
  anySoloActive,
  size = 'md',
  orientation = 'stacked',
  disabled = false,
  muteLabel = 'Mute',
  soloLabel = 'Solo',
}: MuteSoloToggleProps) {
  const silenced = isSilencedBySolo(muted, soloed, anySoloActive)

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={size}
    >
      <button
        className={styles.chip}
        data-variant="mute"
        data-active={muted || undefined}
        data-silenced={silenced || undefined}
        aria-pressed={muted}
        aria-label={silenced ? `${muteLabel} (silenced by solo)` : muteLabel}
        title={silenced ? 'Silenced by solo' : undefined}
        onClick={onToggleMute}
        disabled={disabled}
      >
        <span aria-hidden="true">M</span>
      </button>
      <button
        className={styles.chip}
        data-variant="solo"
        data-active={soloed || undefined}
        aria-pressed={soloed}
        aria-label={soloLabel}
        onClick={onToggleSolo}
        disabled={disabled}
      >
        <span aria-hidden="true">S</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create the CSS skeleton (off state + sizes + orientation)**

```css
/* src/components/MuteSoloToggle/MuteSoloToggle.module.css */

/* ─── Root ─────────────────────────────────────────────────────────────────── */

.root {
  display: inline-flex;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
}

.root[data-orientation="stacked"] {
  flex-direction: column;
  gap: 2px;
}

.root[data-orientation="inline"] {
  flex-direction: row;
  gap: 3px;
}

.disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Chip base ─────────────────────────────────────────────────────────────── */

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  padding: 0;

  /* Recessed well — same recipe as Fader track and PanKnob well */
  background-color: var(--stage);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 0 1px var(--border);
  color: var(--text-dim);
}

/* ─── Sizes ─────────────────────────────────────────────────────────────────── */

.root[data-size="md"] .chip {
  width: 28px;
  height: 20px;
  font-size: var(--text-sm);
}

.root[data-size="sm"] .chip {
  width: 22px;
  height: 16px;
  font-size: var(--text-xs);
}
```

- [ ] **Step 5: Create `index.ts`**

```ts
// src/components/MuteSoloToggle/index.ts
export { MuteSoloToggle, isSilencedBySolo } from './MuteSoloToggle'
export type { MuteSoloToggleProps } from './MuteSoloToggle'
```

- [ ] **Step 6: Run all tests — expect PASS**

```bash
npm test -- MuteSoloToggle
```

Expected: all tests in both `isSilencedBySolo` and `MuteSoloToggle` describe blocks pass (≈ 28 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/MuteSoloToggle/
git commit -m "feat(MuteSoloToggle): scaffold component, DOM structure, CSS skeleton"
```

---

## Task 3: CSS visual states (LED lit, hatch, focus, hover, transitions)

**Files:**
- Modify: `src/components/MuteSoloToggle/MuteSoloToggle.module.css`

**No new tests:** all visual state rules are CSS-only — existing `data-*` attribute tests from Task 2 already verify the DOM side. The note from the spec to confirm: the **base `.chip` rule must have a `transition` declaration using `--dur-led-off`** so the on→off decay animates. The `[data-active]` override switches it to `--dur-led-on` for fast attack.

---

- [ ] **Step 1: Add LED color routing, lit state, transitions, hatch, focus, and hover to the CSS**

Append to `MuteSoloToggle.module.css` (after the existing `.root[data-size="sm"] .chip` rule):

```css
/* ─── LED color routing ─────────────────────────────────────────────────────── */

.chip[data-variant="mute"] { --chip-led: var(--led-red); }
.chip[data-variant="solo"] { --chip-led: var(--led-yellow); }

/* ─── Decay transition on base chip (slow — incandescent off) ──────────────── */
/*
  This MUST be on the base rule so removing [data-active] triggers the slow decay.
  [data-active] below overrides the duration to --dur-led-on (fast attack).
  Both vars are zeroed by prefers-reduced-motion in global.css — no rule needed here.
*/
.chip {
  transition:
    background var(--dur-led-off) var(--ease-out),
    box-shadow  var(--dur-led-off) var(--ease-out),
    color       var(--dur-led-off) var(--ease-out);
}

/* ─── Lit state ─────────────────────────────────────────────────────────────── */

.chip[data-active] {
  background-color: color-mix(in srgb, var(--chip-led) 18%, var(--stage));
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 1px var(--chip-led),
    0 0 8px 2px color-mix(in srgb, var(--chip-led) 35%, transparent);
  color: var(--chip-led);
  /* Fast attack — overrides decay duration from base .chip rule */
  transition:
    background var(--dur-led-on) var(--ease-out),
    box-shadow  var(--dur-led-on) var(--ease-out),
    color       var(--dur-led-on) var(--ease-out);
}

/* ─── Silenced by solo ─────────────────────────────────────────────────────── */
/*
  background-image (hatch) is independent of box-shadow (glow) — they never fight.
  Focus ring and hover brightness apply on top without disturbing the hatch.
  --text at 18% is a theme-aware neutral: reads on dark (--stage ≈ black) and
  light (Chroma/manuscript cream) surfaces. Verify in Compare.
*/

.chip[data-silenced] {
  background-color: var(--stage);
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0px, transparent 3px,
    color-mix(in srgb, var(--text) 18%, transparent) 3px,
    color-mix(in srgb, var(--text) 18%, transparent) 4px
  );
  color: var(--text-dim);
  /* No glow: box-shadow remains as the off-state value inherited from .chip */
}

/* ─── Hover ─────────────────────────────────────────────────────────────────── */

.chip:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* ─── Focus ring ────────────────────────────────────────────────────────────── */

.chip:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--chip-led, var(--accent)) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Verify tests still pass (no regressions from CSS-only changes)**

```bash
npm test -- MuteSoloToggle
```

Expected: all tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/MuteSoloToggle/MuteSoloToggle.module.css
git commit -m "feat(MuteSoloToggle): add LED lit states, hatch, focus, hover, transition recipe"
```

---

## Task 4: Demo page

**Files:**
- Create: `src/components/MuteSoloToggle/MuteSoloToggle.demo.tsx`

**Interfaces:**
- Consumes: `MuteSoloToggle` from `./MuteSoloToggle`
- Consumes: `DemoShell` from `../../gallery/ui/DemoShell`
- Consumes: `StatesGrid`, `State` from `../../gallery/ui/StatesGrid`
- Consumes: `Playground` from `../../gallery/ui/Playground`

---

- [ ] **Step 1: Create the demo file**

```tsx
// src/components/MuteSoloToggle/MuteSoloToggle.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { MuteSoloToggle } from './MuteSoloToggle'

export const meta: DemoMeta = {
  name: 'MuteSoloToggle',
  group: 'Primitives',
  route: '/mute-solo-toggle',
  order: 2,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Both off">
        <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Muted">
        <MuteSoloToggle muted soloed={false} onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Soloed">
        <MuteSoloToggle muted={false} soloed onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Both on">
        <MuteSoloToggle muted soloed onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Silenced by solo">
        <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Muted + any solo active">
        {/* Explicit mute wins — M shows lit mute, not hatch */}
        <MuteSoloToggle muted soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Disabled">
        <MuteSoloToggle muted={false} soloed={false} disabled onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="sm + inline">
        <MuteSoloToggle muted={false} soloed size="sm" orientation="inline" onToggleMute={noop} onToggleSolo={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [muted, setMuted] = useState(false)
  const [soloed, setSoloed] = useState(false)
  const [anySoloActive, setAnySoloActive] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [orientation, setOrientation] = useState<'stacked' | 'inline'>('stacked')
  const [size, setSize] = useState<'sm' | 'md'>('md')

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <MuteSoloToggle
          muted={muted}
          soloed={soloed}
          anySoloActive={anySoloActive}
          disabled={disabled}
          orientation={orientation}
          size={size}
          onToggleMute={() => setMuted(m => !m)}
          onToggleSolo={() => setSoloed(s => !s)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            <input type="checkbox" checked={muted} onChange={e => setMuted(e.target.checked)} />
            muted
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={soloed} onChange={e => setSoloed(e.target.checked)} />
            soloed
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={anySoloActive} onChange={e => setAnySoloActive(e.target.checked)} />
            anySoloActive
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} />
            disabled
          </label>
          <label style={labelStyle}>
            orientation
            <select
              value={orientation}
              onChange={e => setOrientation(e.target.value as 'stacked' | 'inline')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="stacked">stacked</option>
              <option value="inline">inline</option>
            </select>
          </label>
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (28×20px)</option>
              <option value="sm">sm (22×16px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function MuteSoloToggleDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run all tests — expect PASS**

```bash
npm test -- MuteSoloToggle
```

Expected: all tests pass (no regressions from adding the demo file).

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Check whether ESLint is configured, run if present**

```bash
ls /Users/fernandofeitosa/dev/ui-jackdaw/eslint.config* /Users/fernandofeitosa/dev/ui-jackdaw/.eslintrc* 2>/dev/null \
  && npx eslint src/components/MuteSoloToggle/ \
  || echo "ESLint not configured — skip"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/MuteSoloToggle/MuteSoloToggle.demo.tsx
git commit -m "feat(MuteSoloToggle): add gallery demo — states grid + playground"
```

---

## Done criteria (from spec)

- [ ] `MuteSoloToggle` reads instantly: recessed off, Solo glows yellow, Mute glows red, silenced-by-solo shows diagonal hatch (not a glow, not a pulse)
- [ ] "Muted + any solo active" renders lit mute — not hatch — confirming `isSilencedBySolo` precedence
- [ ] Both-on renders both chips lit simultaneously
- [ ] Exclusive-solo is left to the app (raw event passed through)
- [ ] `prefers-reduced-motion` respected (LED transitions zero via `global.css`)
- [ ] Reskins across themes — verify hatch legibility on light + dark in Compare (manual check)
- [ ] `typecheck / lint / test` green
