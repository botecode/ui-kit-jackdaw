# RepeatToggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `RepeatToggle` transport primitive — the loop on/off button for the transport bar, LED-lit with `--accent` when repeating.

**Architecture:** Single `<button type="button" aria-pressed>` containing a `Repeat` Phosphor icon. CSS Modules port `TransportButton`'s recessed-well and 4-layer LED-bloom recipe exactly, substituting `--accent` for `--led-green`. No variant machinery, no relabel logic — one stable "Loop" label, one LED color, `aria-pressed` handles state announcement. Written clean for this component (not a copy-paste of TransportButton with edits).

**Tech Stack:** React 19, TypeScript 5 (strict), CSS Modules, `@phosphor-icons/react`, Vitest 4 + `@testing-library/react`.

## Global Constraints

- Zero new runtime dependencies — no animation libs, no external packages.
- CSS Modules only — no hardcoded colours, sizes, or durations; all via CSS custom properties from `src/tokens/`.
- `prefers-reduced-motion`: `--dur-led-on` and `--dur-led-off` are zeroed in `global.css` — no extra rules needed in the component file.
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` — TypeScript will reject unused imports/vars.
- Typecheck: `npx tsc --noEmit`. Tests: `npx vitest run`. Lint: `npm run lint`.
- Icon weight is NOT set explicitly on the `<Repeat>` element — it inherits the global `IconContext` weight, same as `TransportButton`.
- `aria-label` default is `"Loop"` (stable, never flips — `aria-pressed` announces state).
- `onToggle(next: boolean)` — no event arg in the signature.
- CSS provenance comment at top of `.module.css`: `/* revisit shared base if a 3rd transport pill appears */`

---

## File Map

```
src/components/RepeatToggle/
  RepeatToggle.tsx          — component (props, structure, click handler)
  RepeatToggle.module.css   — all visual states, sizes, LED bloom
  RepeatToggle.test.tsx     — rendering + interaction tests
  RepeatToggle.demo.tsx     — states grid + playground
  index.ts                  — barrel export
```

---

## Task 1: Component + Test Suite (TDD)

**Files:**
- Create: `src/components/RepeatToggle/RepeatToggle.tsx`
- Create: `src/components/RepeatToggle/RepeatToggle.test.tsx`

**Interfaces:**
- Produces: `RepeatToggle(props: RepeatToggleProps): JSX.Element`, `RepeatToggleProps` — consumed by Task 3 (demo)

---

- [ ] **Step 1: Write the failing tests**

Create `src/components/RepeatToggle/RepeatToggle.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { RepeatToggle } from './RepeatToggle'

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('RepeatToggle rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('aria-pressed="false" when repeating=false', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed="true" when repeating=true', () => {
    const { getByRole } = render(<RepeatToggle repeating onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('no data-repeating when repeating=false', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-repeating')
  })

  it('data-repeating present when repeating=true', () => {
    const { getByRole } = render(<RepeatToggle repeating onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-repeating')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} size="sm" />)
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })

  it('default aria-label is "Loop"', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Loop')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <RepeatToggle repeating={false} onToggle={noop} aria-label="Toggle loop" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Toggle loop')
  })

  it('disabled attribute present when disabled=true', () => {
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={noop} disabled />)
    expect(getByRole('button')).toBeDisabled()
  })
})

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('RepeatToggle interaction', () => {
  it('click calls onToggle(true) when repeating=false', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('click calls onToggle(false) when repeating=true', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<RepeatToggle repeating onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('disabled: click does not call onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<RepeatToggle repeating={false} onToggle={onToggle} disabled />)
    expect(getByRole('button')).toBeDisabled()
    fireEvent.click(getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/components/RepeatToggle/RepeatToggle.test.tsx
```

Expected: all tests fail with "Cannot find module './RepeatToggle'".

- [ ] **Step 3: Write RepeatToggle.tsx**

Create `src/components/RepeatToggle/RepeatToggle.tsx`:

```tsx
import { Repeat } from '@phosphor-icons/react'
import styles from './RepeatToggle.module.css'

export interface RepeatToggleProps {
  repeating: boolean
  onToggle: (next: boolean) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

export function RepeatToggle({
  repeating,
  onToggle,
  size = 'md',
  disabled,
  'aria-label': ariaLabel = 'Loop',
}: RepeatToggleProps) {
  return (
    <button
      type="button"
      className={styles.root}
      data-size={size}
      data-repeating={repeating || undefined}
      aria-label={ariaLabel}
      aria-pressed={repeating}
      disabled={disabled}
      onClick={() => onToggle(!repeating)}
    >
      <Repeat aria-hidden size={ICON_SIZE[size]} />
    </button>
  )
}
```

Note: `RepeatToggle.module.css` does not exist yet — create a temporary empty file to unblock the type check:

```bash
touch src/components/RepeatToggle/RepeatToggle.module.css
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/components/RepeatToggle/RepeatToggle.test.tsx
```

Expected: all 13 tests pass.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/RepeatToggle/RepeatToggle.tsx src/components/RepeatToggle/RepeatToggle.test.tsx src/components/RepeatToggle/RepeatToggle.module.css
git commit -m "feat(RepeatToggle): component scaffold + full test suite"
```

---

## Task 2: CSS Visual System

**Files:**
- Modify: `src/components/RepeatToggle/RepeatToggle.module.css` (replace the empty file from Task 1)

**Interfaces:**
- Consumes: `data-size`, `data-repeating` attributes from `RepeatToggle.tsx` (Task 1)
- Reference: `src/components/TransportButton/TransportButton.module.css` — the LED bloom recipe is ported from here, with `--led-green` → `--accent`. The output file is written clean for `RepeatToggle`, not copy-pasted with edits.

---

- [ ] **Step 1: Write RepeatToggle.module.css**

Replace `src/components/RepeatToggle/RepeatToggle.module.css` with the full visual system:

```css
/* src/components/RepeatToggle/RepeatToggle.module.css */
/* revisit shared base if a 3rd transport pill appears */

/* ─── Root (recessed well) ───────────────────────────────────────────────────── */

.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  outline: none;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;

  background-color: var(--stage);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 0 1px var(--border);
  color: var(--text-dim);

  /* Slow decay — incandescent off */
  transition:
    background-color var(--dur-led-off) var(--ease-out),
    box-shadow       var(--dur-led-off) var(--ease-out),
    color            var(--dur-led-off) var(--ease-out);
}

/* ─── Sizes ───────────────────────────────────────────────────────────────────── */

.root[data-size="md"] { width: 36px; height: 36px; }
.root[data-size="sm"] { width: 28px; height: 28px; }

/* ─── Hover ───────────────────────────────────────────────────────────────────── */

.root:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* ─── Pressed ─────────────────────────────────────────────────────────────────── */

.root:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
}

/* Preserve LED bloom on press — :active (0,3,0) beats [data-repeating] (0,2,0) without this */
.root[data-repeating]:active:not(:disabled) {
  background-color: color-mix(in srgb, var(--accent) 18%, var(--stage));
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--accent),
    0 0 8px 2px color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--accent);
}

/* ─── Repeating — accent LED bloom ──────────────────────────────────────────── */
/*
  TransportButton's 4-layer recipe ported exactly, --led-green → --accent.
  Same percentages (18% tint, 35% glow), same shadow layers — identical depth/
  layering so the two pills read as siblings, not cousins.
  Fast attack on in; slow decay on out (the base .root rule handles the out).
*/

.root[data-repeating] {
  background-color: color-mix(in srgb, var(--accent) 18%, var(--stage));
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 1px var(--accent),
    0 0 8px 2px color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--accent);
  /* Fast attack */
  transition:
    background-color var(--dur-led-on) var(--ease-out),
    box-shadow       var(--dur-led-on) var(--ease-out),
    color            var(--dur-led-on) var(--ease-out);
}

/* ─── Disabled ────────────────────────────────────────────────────────────────── */

.root:disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Focus ring ──────────────────────────────────────────────────────────────── */

.root:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Run tests — confirm they still pass**

```bash
npx vitest run src/components/RepeatToggle/RepeatToggle.test.tsx
```

Expected: all 13 tests pass (CSS changes don't affect DOM/aria structure).

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/RepeatToggle/RepeatToggle.module.css
git commit -m "feat(RepeatToggle): CSS visual system — recessed well, accent LED bloom, active/focus states"
```

---

## Task 3: Demo + Barrel Export

**Files:**
- Create: `src/components/RepeatToggle/RepeatToggle.demo.tsx`
- Create: `src/components/RepeatToggle/index.ts`

**Interfaces:**
- Consumes: `RepeatToggle`, `RepeatToggleProps` from `RepeatToggle.tsx` (Task 1)
- Consumes: `DemoMeta`, `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery (existing)
- Consumes: `Checkbox` from `../Checkbox` (existing, used for boolean playground controls)

---

- [ ] **Step 1: Write RepeatToggle.demo.tsx**

Create `src/components/RepeatToggle/RepeatToggle.demo.tsx`:

```tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { RepeatToggle } from './RepeatToggle'

export const meta: DemoMeta = {
  name: 'RepeatToggle',
  group: 'Primitives',
  route: '/repeat-toggle',
  order: 11,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off">
        <RepeatToggle repeating={false} onToggle={noop} />
      </State>
      <State label="On (lit)">
        <RepeatToggle repeating onToggle={noop} />
      </State>
      <State label="Disabled">
        <RepeatToggle repeating={false} onToggle={noop} disabled />
      </State>
      <State label="Disabled on">
        <RepeatToggle repeating onToggle={noop} disabled />
      </State>
      <State label="sm">
        <RepeatToggle repeating size="sm" onToggle={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [repeating, setRepeating] = useState(false)
  const [disabled, setDisabled] = useState(false)
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
        <RepeatToggle
          repeating={repeating}
          onToggle={setRepeating}
          disabled={disabled}
          size={size}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox
            checked={repeating}
            onChange={setRepeating}
            size="sm"
            label="repeating"
          />
          <Checkbox
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          {/* Native <select> matches TransportButton.demo.tsx — shared debt,
              fix both when we migrate playground controls to InputSelect */}
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36×36px)</option>
              <option value="sm">sm (28×28px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function RepeatToggleDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Write index.ts**

Create `src/components/RepeatToggle/index.ts`:

```ts
export { RepeatToggle } from './RepeatToggle'
export type { RepeatToggleProps } from './RepeatToggle'
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass, including the 13 RepeatToggle tests.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Visual verification in dev server**

```bash
npm run dev
```

Verify each of these in the gallery:

1. **RepeatToggle appears in sidebar** under Primitives at position 11, after TransportButton (auto-discovered via `import.meta.glob`)
2. **States grid:** off — recessed pill, dim icon; on — accent tint + outer glow + accent icon; disabled variants — dimmed; sm — smaller button
3. **Bloom parity:** compare RepeatToggle "on" state against TransportButton "playing" state — both should read as the same button shape, same depth, same glow spread (different colors: accent vs green)
4. **Playground:** clicking the live button toggles its state; Checkbox controls for `repeating` and `disabled` are wired; `size` select switches between md and sm
5. **Compare mode:** open Compare (all themes) and verify the bloom reskins correctly — accent color and glow should match each theme's `--accent`. **Pay particular attention to light themes** — `--accent` was authored as a warm UI accent, not tuned as an LED. If the bloom reads weak or muddy on any theme, note it (eventual `--led-accent` token signal; do not add now)
6. **reduced-motion:** open browser DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → toggle — bloom should still appear (glow is functional, not decorative), only timing animations suppressed

- [ ] **Step 7: Commit**

```bash
git add src/components/RepeatToggle/RepeatToggle.demo.tsx src/components/RepeatToggle/index.ts
git commit -m "feat(RepeatToggle): demo + barrel export — states grid, playground, gallery registered"
```

---

## Self-Review

**Spec coverage:**
- ✅ Transport loop toggle — recessed off, accent LED bloom on — Tasks 1 + 2
- ✅ `Repeat` icon, no explicit `weight` (inherits `IconContext`) — Task 1, `<Repeat aria-hidden size={ICON_SIZE[size]} />`
- ✅ `repeating: boolean`, `onToggle(next)`, `size`, `disabled`, `aria-label` props — Task 1 `RepeatToggleProps`
- ✅ `aria-pressed={repeating}` — Task 1
- ✅ Stable `"Loop"` label, never flips — Task 1 `ariaLabel = 'Loop'`, no relabel logic
- ✅ `disabled={disabled}` native attribute (not CSS-only) — Task 1
- ✅ TransportButton 4-layer bloom recipe ported exactly, `--led-green` → `--accent` — Task 2
- ✅ Fast-attack/slow-decay asymmetry — Task 2 base `.root` transition + `[data-repeating]` override
- ✅ `:active` specificity fix preserves bloom on press — Task 2 `[data-repeating]:active`
- ✅ `prefers-reduced-motion`: zeroed in `global.css`, no extra rules needed — Global Constraints
- ✅ CSS provenance comment — Task 2 top-of-file comment
- ✅ CSS file written clean (no inert branches) — Task 2 contains only applicable rules
- ✅ Hover `filter: brightness(1.08)` — Task 2
- ✅ `:focus-visible` ring, accent-tinted — Task 2
- ✅ States grid: off, on, disabled, disabled-on, sm — Task 3
- ✅ Playground: `Checkbox` for boolean controls, native `<select>` for size (shared-debt comment in code) — Task 3
- ✅ Gallery `meta` route `/repeat-toggle`, group `Primitives`, order `11` — Task 3
- ✅ Verify bloom in Compare on light AND dark — Task 3 Step 6 visual verification
- ✅ `typecheck / lint / test` green — Tasks 1, 3

**Placeholder scan:** No TBDs, no "similar to Task N" references. All code blocks are complete and self-contained.

**Type consistency:** `RepeatToggleProps` defined once in `RepeatToggle.tsx`. `onToggle: (next: boolean) => void` — matches test assertions `toHaveBeenCalledWith(true)` and `toHaveBeenCalledWith(false)` (no event arg). `ICON_SIZE` record used in both TSX and consistent with sizes in CSS (`data-size="md"` → `36×36`, `data-size="sm"` → `28×28`).
