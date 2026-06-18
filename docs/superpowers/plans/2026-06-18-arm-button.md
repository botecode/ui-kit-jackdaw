# ArmButton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `ArmButton` primitive — the track record-arm toggle that visually reproduces the Jackdaw logo eye (pale ring + red dot) when armed.

**Architecture:** Single native `<button>` element; the button border is the ring and a `::before` pseudo-element is the inner dot. State is driven entirely by `data-armed` / `data-recording` / `data-size` attributes on the root; CSS handles all transitions. The `arm-pulse` keyframe animation references CSS custom properties shared with the static armed rule to guarantee a seamless transition into the pulse (no visible jump when `data-recording` is added).

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + Testing Library, Vite gallery.

## Global Constraints

- CSS Modules + CSS vars only — no Tailwind, no inline styles, no CSS-in-JS
- Token names must match the `ThemeTokens` interface in `src/tokens/types.ts` exactly
- `border-radius: 50%` — round shape distinguishes from the square mute chip
- `@keyframes arm-pulse` animates **only `box-shadow`** — no `background`, no `transform`, no layout reflow
- `.root[data-armed][data-recording]::before` — dual selector enforces recording-implies-armed structurally
- `prefers-reduced-motion`: animation `none`, hold `--_arm-glow-peak` as steady state
- `typecheck / lint / test` green before shipping
- File: `src/components/ArmButton/` — new directory, 5 files total

---

## File Map

| File | Responsibility |
|---|---|
| `src/components/ArmButton/ArmButton.tsx` | Component + props interface |
| `src/components/ArmButton/ArmButton.module.css` | Ring, dot, all states, pulse animation |
| `src/components/ArmButton/ArmButton.test.tsx` | Rendering + interaction unit tests |
| `src/components/ArmButton/ArmButton.demo.tsx` | Gallery demo: states grid + playground |
| `src/components/ArmButton/index.ts` | Public barrel export |

---

### Task 1: Scaffold — stub component + full test suite (red phase)

**Files:**
- Create: `src/components/ArmButton/ArmButton.module.css` (empty placeholder — lets TypeScript import resolve)
- Create: `src/components/ArmButton/ArmButton.tsx` (stub — just enough to compile)
- Create: `src/components/ArmButton/ArmButton.test.tsx` (full test suite)

**Interfaces:**
- Produces: `ArmButtonProps` interface, `ArmButton` stub export — consumed by Task 2 (implementation) and Task 3 (demo)

---

- [ ] **Step 1: Create the empty CSS module**

Create `src/components/ArmButton/ArmButton.module.css`:

```css
/* src/components/ArmButton/ArmButton.module.css */
/* Placeholder — filled in Task 2 */
.root {}
```

- [ ] **Step 2: Create the stub component**

Create `src/components/ArmButton/ArmButton.tsx`:

```tsx
// src/components/ArmButton/ArmButton.tsx
import styles from './ArmButton.module.css'

export interface ArmButtonProps {
  /** Whether the track is armed for recording. */
  armed: boolean
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  /**
   * Whether live recording is actively happening on this track.
   * Drives the pulse animation. Requires armed=true — set both when recording.
   */
  recording?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

export function ArmButton(_props: ArmButtonProps) {
  return <button className={styles.root} />
}
```

- [ ] **Step 3: Write the full test suite**

Create `src/components/ArmButton/ArmButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ArmButton } from './ArmButton'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('ArmButton rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('aria-pressed="false" when armed=false', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed="true" when armed=true', () => {
    const { getByRole } = render(<ArmButton armed onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('default aria-label is "Arm for recording"', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Arm for recording')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <ArmButton armed={false} onToggle={noop} aria-label="Arm track" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Arm track')
  })

  it('has data-armed when armed=true', () => {
    const { getByRole } = render(<ArmButton armed onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-armed')
  })

  it('no data-armed when armed=false', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-armed')
  })

  it('has data-recording when recording=true', () => {
    const { getByRole } = render(<ArmButton armed recording onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-recording')
  })

  it('no data-recording when recording=false', () => {
    const { getByRole } = render(<ArmButton armed recording={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-recording')
  })

  it('no data-recording when recording omitted', () => {
    const { getByRole } = render(<ArmButton armed onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-recording')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(
      <ArmButton armed={false} onToggle={noop} size="sm" />,
    )
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('ArmButton interaction', () => {
  it('clicking fires onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<ArmButton armed={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('disabled: clicking does not fire onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <ArmButton armed={false} onToggle={onToggle} disabled />,
    )
    fireEvent.click(getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run tests — expect failures**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/ArmButton/ArmButton.test.tsx
```

Expected output: multiple FAIL lines. The stub renders a bare `<button>` with no props wired up, so `aria-pressed`, `aria-label`, `data-*` attributes, and `disabled` are all missing. **This is correct — red phase.** Proceed to Task 2.

---

### Task 2: Implement component + CSS (green phase)

**Files:**
- Modify: `src/components/ArmButton/ArmButton.tsx` (full implementation)
- Modify: `src/components/ArmButton/ArmButton.module.css` (complete styles)

**Interfaces:**
- Consumes: `ArmButtonProps` from Task 1
- Produces: fully working `ArmButton` — consumed by Task 3 (demo)

---

- [ ] **Step 1: Implement ArmButton.tsx**

Replace the entire contents of `src/components/ArmButton/ArmButton.tsx`:

```tsx
// src/components/ArmButton/ArmButton.tsx
import styles from './ArmButton.module.css'

export interface ArmButtonProps {
  /** Whether the track is armed for recording. */
  armed: boolean
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  /**
   * Whether live recording is actively happening on this track.
   * Drives the pulse animation. Requires armed=true — set both when recording.
   */
  recording?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
  autoFocus?: boolean
}

export function ArmButton({
  armed,
  onToggle,
  recording,
  size = 'md',
  disabled,
  autoFocus,
  'aria-label': ariaLabel = 'Arm for recording',
}: ArmButtonProps) {
  return (
    <button
      className={styles.root}
      data-size={size}
      data-armed={armed || undefined}
      data-recording={recording || undefined}
      aria-pressed={armed}
      aria-label={ariaLabel}
      disabled={disabled}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      onClick={onToggle}
    />
  )
}
```

- [ ] **Step 2: Run tests — expect green**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/ArmButton/ArmButton.test.tsx
```

Expected: all tests PASS. If any fail, check that `data-armed={armed || undefined}` (not `data-armed={armed}`) — the `|| undefined` pattern removes the attribute entirely when false, matching `toHaveAttribute` / `not.toHaveAttribute` assertions.

- [ ] **Step 3: Write the CSS**

Replace the entire contents of `src/components/ArmButton/ArmButton.module.css`:

```css
/* src/components/ArmButton/ArmButton.module.css */

/*
  --_arm-glow-base and --_arm-glow-peak are defined on .root so that:
  - The static [data-armed]::before rule and the @keyframes 0%/100% both reference
    --_arm-glow-base — guaranteeing identical values, so adding data-recording causes
    no visible jump into the pulse.
  - --_arm-glow-peak is used at the keyframe 50% AND in the reduced-motion steady rule.
*/

/* ─── Root (the ring) ─────────────────────────────────────────────────────── */

.root {
  --_arm-glow-base: 0 0 8px 3px color-mix(in srgb, var(--led-red) 40%, transparent);
  --_arm-glow-peak: 0 0 14px 5px color-mix(in srgb, var(--led-red) 60%, transparent);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--text-dim);
  background: transparent;
  cursor: pointer;
  outline: none;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}

/* ─── Sizes ───────────────────────────────────────────────────────────────── */

.root[data-size="md"] { width: 28px; height: 28px; }
.root[data-size="sm"] { width: 20px; height: 20px; }

/* ─── Dot (::before) ─────────────────────────────────────────────────────── */

.root::before {
  content: '';
  display: block;
  border-radius: 50%;
  /* Off state: recessed well — same recipe as mute/solo chip */
  background: var(--stage);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.7),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35);
  /* Slow decay — incandescent off */
  transition:
    background var(--dur-led-off) var(--ease-out),
    box-shadow  var(--dur-led-off) var(--ease-out);
}

.root[data-size="md"]::before { width: 14px; height: 14px; }
.root[data-size="sm"]::before { width: 10px; height: 10px; }

/* ─── Armed state ─────────────────────────────────────────────────────────── */

.root[data-armed]::before {
  background: color-mix(in srgb, var(--led-red) 25%, var(--stage));
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--led-red),
    var(--_arm-glow-base);
  /* Fast attack — overrides decay transition from base rule */
  transition:
    background var(--dur-led-on) var(--ease-out),
    box-shadow  var(--dur-led-on) var(--ease-out);
}

/* ─── Recording: pulse the dot glow only ─────────────────────────────────── */

/*
  0%/100% box-shadow is identical to [data-armed]::before — uses the same
  --_arm-glow-base custom property, so the transition into the pulse is seamless.
  Only box-shadow animates; background and transform are untouched (no reflow).
*/
@keyframes arm-pulse {
  0%, 100% {
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(0, 0, 0, 0.2),
      0 0 0 1px var(--led-red),
      var(--_arm-glow-base);
  }
  50% {
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.4),
      inset 0 0 0 1px rgba(0, 0, 0, 0.2),
      0 0 0 1px var(--led-red),
      var(--_arm-glow-peak);
  }
}

/*
  Dual selector: recording-implies-armed is enforced structurally.
  A stray recording=true without armed=true renders no animation.
*/
.root[data-armed][data-recording]::before {
  animation: arm-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .root[data-armed][data-recording]::before {
    animation: none;
    /* Steady brighter red — no motion, but clearly active */
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.4),
      inset 0 0 0 1px rgba(0, 0, 0, 0.2),
      0 0 0 1px var(--led-red),
      var(--_arm-glow-peak);
  }
}

/* ─── Disabled ────────────────────────────────────────────────────────────── */

.root:disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Hover ───────────────────────────────────────────────────────────────── */

.root:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* ─── Focus ring ──────────────────────────────────────────────────────────── */

.root:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--led-red) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run full test suite again to confirm no regressions**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/ArmButton/ArmButton.test.tsx
```

Expected: all tests still PASS (CSS changes don't affect unit tests, but confirm nothing broke).

- [ ] **Step 5: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/ArmButton/ArmButton.tsx src/components/ArmButton/ArmButton.module.css src/components/ArmButton/ArmButton.test.tsx && git commit -m "feat: add ArmButton primitive — ring+dot record-arm toggle"
```

---

### Task 3: Demo + export + full verification

**Files:**
- Create: `src/components/ArmButton/ArmButton.demo.tsx`
- Create: `src/components/ArmButton/index.ts`

**Interfaces:**
- Consumes: `ArmButton`, `ArmButtonProps` from Tasks 1–2
- Consumes: `DemoMeta` from `src/gallery/registry.ts`
- Consumes: `DemoShell` from `src/gallery/ui/DemoShell`
- Consumes: `StatesGrid`, `State` from `src/gallery/ui/StatesGrid`
- Consumes: `Playground` from `src/gallery/ui/Playground`

---

- [ ] **Step 1: Write the demo**

Create `src/components/ArmButton/ArmButton.demo.tsx`:

```tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ArmButton } from './ArmButton'

export const meta: DemoMeta = {
  name: 'ArmButton',
  group: 'Primitives',
  route: '/arm-button',
  order: 3,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off">
        <ArmButton armed={false} onToggle={noop} />
      </State>
      <State label="Armed">
        <ArmButton armed onToggle={noop} />
      </State>
      <State label="Recording">
        <ArmButton armed recording onToggle={noop} />
      </State>
      <State label="Disabled">
        <ArmButton armed={false} disabled onToggle={noop} />
      </State>
      <State label="sm (armed)">
        <ArmButton armed size="sm" onToggle={noop} />
      </State>
      <State label="Focus">
        {/* autoFocus demonstrates :focus-visible ring in the gallery */}
        <ArmButton armed={false} onToggle={noop} autoFocus />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [armed, setArmed] = useState(false)
  const [recording, setRecording] = useState(false)
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
        {/* Left: interactive instance + a pinned armed+recording for steady-vs-pulse comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
          <ArmButton
            armed={armed}
            recording={recording}
            disabled={disabled}
            size={size}
            onToggle={() => setArmed(a => !a)}
          />
          <ArmButton
            armed
            recording
            size={size}
            onToggle={() => {}}
            aria-label="Recording (pinned demo)"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            <input type="checkbox" checked={armed} onChange={e => setArmed(e.target.checked)} />
            armed
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={recording} onChange={e => setRecording(e.target.checked)} />
            recording
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} />
            disabled
          </label>
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (28×28px)</option>
              <option value="sm">sm (20×20px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ArmButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Write the barrel export**

Create `src/components/ArmButton/index.ts`:

```ts
// src/components/ArmButton/index.ts
export { ArmButton } from './ArmButton'
export type { ArmButtonProps } from './ArmButton'
```

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit
```

Expected: no errors. `autoFocus` is already in `ArmButtonProps` (added in Task 2 Step 1) and forwarded to the `<button>`, so the demo's `autoFocus` usage compiles cleanly.

- [ ] **Step 4: Run the full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run
```

Expected: all tests pass, including the ArmButton suite and all pre-existing suites.

- [ ] **Step 5: Verify in the gallery**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npm run dev
```

Open the gallery. Navigate to **Primitives → ArmButton**. Verify:

- [ ] Off state: visible pale ring, recessed dark dot inside
- [ ] Armed state: dot fills red with LED bloom glow; ring unchanged
- [ ] Recording state: dot glow pulses continuously; ring stays static; transition from armed to recording is seamless (no jump)
- [ ] Disabled: both states visually dimmed
- [ ] sm (armed): proportionally smaller, same visual language
- [ ] Focus: record-red focus ring visible around the button ring
- [ ] Playground: interactive armed/recording/disabled/size controls work; pinned recording instance always pulses beside the interactive one
- [ ] Compare mode (5 themes): armed dot reads as red record-dot across all themes; ring reads on every background; verify manuscript (light theme) explicitly

- [ ] **Step 6: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/ArmButton/ArmButton.demo.tsx src/components/ArmButton/index.ts && git commit -m "feat: add ArmButton gallery demo and barrel export"
```
