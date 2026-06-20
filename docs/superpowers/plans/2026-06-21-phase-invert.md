# PhaseInvert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `PhaseInvert` — a recessed-off / LED-lit-on polarity-flip toggle button with a custom ø SVG glyph, wired into `FocusedTrackDetailPanel`.

**Architecture:** Single `<button>` with `aria-pressed`, `data-inverted` attribute for CSS state, and an inline SVG ø glyph (circle + diagonal slash). LED bloom on `--accent` (warm amber — not a semantic LED color, matching other generic production-mode toggles like RepeatToggle). After building the primitive, replace the Phase/Polarity placeholder `AdvancedSlot` in `FocusedTrackDetailPanel` with the real control.

**Tech Stack:** React 18, TypeScript, CSS Modules, CSS custom properties, Vitest + Testing Library (`fireEvent` — never `userEvent`).

## Global Constraints

- Tokens only — no hardcoded colors; verify in Compare light + dark.
- CSS Modules; `data-*` attributes for state (no class juggling).
- `fireEvent` only (not `userEvent`) in tests.
- `npx tsc --noEmit` + `npx vitest run` + lint green before commit.
- Sizes: `sm`/`md` only (default `md`). `:focus-visible` only (never `:focus`).
- Glyph: custom inline SVG (bespoke audio glyph — NOT Phosphor).
- ARIA: `aria-pressed` toggle model with stable label "Invert phase".
- Auto-registered via `import.meta.glob` — no manual registry edits.
- All states in gallery demo: off, inverted, hover, focused, disabled (off + inverted), sm/md.
- Integration must keep existing `FocusedTrackDetailPanel` tests green (update, don't break).

---

### Task 1: PhaseInvert primitive (component + CSS + tests + demo + index)

**Files:**
- Create: `src/components/PhaseInvert/PhaseInvert.tsx`
- Create: `src/components/PhaseInvert/PhaseInvert.module.css`
- Create: `src/components/PhaseInvert/PhaseInvert.test.tsx`
- Create: `src/components/PhaseInvert/PhaseInvert.demo.tsx`
- Create: `src/components/PhaseInvert/index.ts`

**Interfaces:**
- Produces: `PhaseInvert({ inverted, onToggle, size?, disabled?, aria-label?, autoFocus? })` and `PhaseInvertProps` type exported from `index.ts`.

- [ ] **Step 1: Write the test file**

`src/components/PhaseInvert/PhaseInvert.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PhaseInvert } from './PhaseInvert'

describe('PhaseInvert rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('aria-pressed="false" when inverted=false', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed="true" when inverted=true', () => {
    const { getByRole } = render(<PhaseInvert inverted onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('default aria-label is "Invert phase"', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Invert phase')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <PhaseInvert inverted={false} onToggle={noop} aria-label="Phase flip" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Phase flip')
  })

  it('has data-inverted when inverted=true', () => {
    const { getByRole } = render(<PhaseInvert inverted onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-inverted')
  })

  it('no data-inverted when inverted=false', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-inverted')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} size="sm" />)
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })

  it('renders an SVG glyph inside', () => {
    const { container } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('PhaseInvert interaction', () => {
  it('clicking fires onToggle with next=true when not inverted', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('clicking fires onToggle with next=false when inverted', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<PhaseInvert inverted onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('disabled: clicking does not fire onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <PhaseInvert inverted={false} onToggle={onToggle} disabled />,
    )
    fireEvent.click(getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && npx vitest run src/components/PhaseInvert/PhaseInvert.test.tsx 2>&1 | tail -20
```
Expected: error — module not found.

- [ ] **Step 3: Write the component**

`src/components/PhaseInvert/PhaseInvert.tsx`:
```tsx
import styles from './PhaseInvert.module.css'

export interface PhaseInvertProps {
  inverted: boolean
  onToggle: (next: boolean) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
  autoFocus?: boolean
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 12, md: 16 }

function PhaseGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="3.8" y1="12.2"
        x2="12.2" y2="3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PhaseInvert({
  inverted,
  onToggle,
  size = 'md',
  disabled,
  'aria-label': ariaLabel = 'Invert phase',
  autoFocus,
}: PhaseInvertProps) {
  return (
    <button
      type="button"
      className={styles.root}
      data-size={size}
      data-inverted={inverted || undefined}
      aria-pressed={inverted}
      aria-label={ariaLabel}
      disabled={disabled}
      autoFocus={autoFocus}
      onClick={() => onToggle(!inverted)}
    >
      <PhaseGlyph size={ICON_SIZE[size]} />
    </button>
  )
}
```

- [ ] **Step 4: Write the CSS**

`src/components/PhaseInvert/PhaseInvert.module.css`:
```css
/* ─── Root (recessed well) ─────────────────────────────────────────────────── */

/*
  accent = the kit's warm amber. Not a semantic LED color (red/green/cyan/yellow
  are taken for arm/play/FX/solo). Phase-invert and the future automation button
  share this "production-mode lit toggle" treatment — consistent with RepeatToggle.
*/

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

/* ─── Sizes ─────────────────────────────────────────────────────────────────── */

.root[data-size="md"] { width: 28px; height: 28px; }
.root[data-size="sm"] { width: 20px; height: 20px; }

/* ─── Hover ─────────────────────────────────────────────────────────────────── */

.root:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* ─── Active press ──────────────────────────────────────────────────────────── */

.root:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
}

/* Preserve LED bloom on press when inverted */
.root[data-inverted]:active:not(:disabled) {
  background-color: color-mix(in srgb, var(--accent) 18%, var(--stage));
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--accent),
    0 0 8px 2px color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--accent);
}

/* ─── Inverted — accent LED bloom ───────────────────────────────────────────── */

.root[data-inverted] {
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

/* ─── Disabled ──────────────────────────────────────────────────────────────── */

.root:disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Focus ring ────────────────────────────────────────────────────────────── */

.root:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Write the index**

`src/components/PhaseInvert/index.ts`:
```ts
export { PhaseInvert } from './PhaseInvert'
export type { PhaseInvertProps } from './PhaseInvert'
```

- [ ] **Step 6: Write the gallery demo**

`src/components/PhaseInvert/PhaseInvert.demo.tsx`:
```tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { PhaseInvert } from './PhaseInvert'
import { Checkbox } from '../Checkbox'

export const meta: DemoMeta = {
  name: 'PhaseInvert',
  group: 'Primitives',
  route: '/phase-invert',
  order: 4,
}

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off (recessed)">
        <PhaseInvert inverted={false} onToggle={noop} />
      </State>
      <State label="Inverted (lit ø)">
        <PhaseInvert inverted onToggle={noop} />
      </State>
      <State label="Focus">
        <PhaseInvert inverted={false} onToggle={noop} autoFocus />
      </State>
      <State label="Disabled (off)">
        <PhaseInvert inverted={false} onToggle={noop} disabled />
      </State>
      <State label="Disabled (inverted)">
        <PhaseInvert inverted onToggle={noop} disabled />
      </State>
      <State label="sm — off">
        <PhaseInvert inverted={false} onToggle={noop} size="sm" />
      </State>
      <State label="sm — inverted">
        <PhaseInvert inverted onToggle={noop} size="sm" />
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [inverted, setInverted] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
          <PhaseInvert
            inverted={inverted}
            onToggle={setInverted}
            disabled={disabled}
            size={size}
          />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}>
            {inverted ? 'ø on' : 'ø off'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox checked={inverted} onChange={setInverted} size="sm" label="inverted" />
          <Checkbox checked={disabled} onChange={setDisabled} size="sm" label="disabled" />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
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

export default function PhaseInvertDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && npx vitest run src/components/PhaseInvert/PhaseInvert.test.tsx 2>&1 | tail -20
```
Expected: all 13 tests PASS.

- [ ] **Step 8: Type check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && git add src/components/PhaseInvert/ && git commit -m "feat(PhaseInvert): recessed-off/LED-lit-on ø polarity toggle

Custom inline SVG glyph (circle + diagonal slash — bespoke audio symbol, not Phosphor).
LED color: --accent (warm amber) — not a semantic LED; red/green/cyan/yellow are taken.
Phase-invert and the future automation button share this production-mode treatment,
consistent with RepeatToggle's --accent bloom recipe.

aria-pressed toggle model, stable label 'Invert phase'.
incandescent timing: fast attack (--dur-led-on) / slow decay (--dur-led-off).
All states in gallery: off, inverted, focus, disabled (off+inverted), sm/md.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Wire PhaseInvert into FocusedTrackDetailPanel

**Files:**
- Modify: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx`
- Modify: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.module.css`
- Modify: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.test.tsx`
- Modify: `src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.demo.tsx`

**Interfaces:**
- Consumes: `PhaseInvert` from `../PhaseInvert`
- Track shape gains optional `phaseInverted?: boolean` (defaults to `false` in component)
- Panel gains optional `onTogglePhase?: (next: boolean) => void`

- [ ] **Step 1: Update FocusedTrackDetailPanel.tsx**

Add `phaseInverted?: boolean` to the `track` shape in `FocusedTrackDetailPanelProps`.
Add `onTogglePhase?: (next: boolean) => void` to the panel props.
Import `PhaseInvert`.
Replace the Phase/Polarity `AdvancedSlot` with a real phase row.
Add `advancedPhaseRow` CSS class to the row (row layout instead of column).

In `FocusedTrackDetailPanel.tsx`, apply these changes:

1. Add to imports (after existing imports):
```tsx
import { PhaseInvert } from '../PhaseInvert'
```

2. Update `track` shape inside `FocusedTrackDetailPanelProps`:
```tsx
  track: {
    id: string
    name: string
    color: string
    kind: 'audio' | 'folder'
    armed: boolean
    muted: boolean
    soloed: boolean
    volumeDb: number
    pan: number
    phaseInverted?: boolean   // ← add this
  }
```

3. Add optional prop to `FocusedTrackDetailPanelProps`:
```tsx
  onTogglePhase?: (next: boolean) => void
```

4. Destructure new prop in the function signature:
```tsx
export function FocusedTrackDetailPanel({
  track,
  // … existing props …
  disabled = false,
  onTogglePhase,           // ← add
}: FocusedTrackDetailPanelProps) {
```

5. Replace the Phase/Polarity AdvancedSlot in the JSX (inside the Advanced Panel):
```tsx
{/* was: <AdvancedSlot label="Phase / Polarity" description="Invert signal polarity per channel" /> */}
<div className={`${styles.advancedSlot} ${styles.advancedPhaseRow}`}>
  <span className={styles.slotLabel}>Phase</span>
  <PhaseInvert
    inverted={track.phaseInverted ?? false}
    onToggle={onTogglePhase ?? (() => {})}
    size="sm"
    disabled={disabled}
  />
</div>
```

- [ ] **Step 2: Update FocusedTrackDetailPanel.module.css**

Add the `advancedPhaseRow` modifier after the `.advancedSlot` block:
```css
/* Phase row: label left, toggle right — overrides column layout of .advancedSlot */
.advancedPhaseRow {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
```

- [ ] **Step 3: Update FocusedTrackDetailPanel.test.tsx**

Update the test that checks for "Phase / Polarity" text (it no longer exists — replaced by the PhaseInvert button):

Change the test named `'renders all four advanced slot placeholders'`:
```tsx
it('renders advanced panel with Phase control, Sidechain, Automation, Routing', () => {
  render(<FocusedTrackDetailPanel {...makeProps()} />)
  expect(screen.getByText('Sidechain')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /invert phase/i })).toBeInTheDocument()
  expect(screen.getByText('Automation')).toBeInTheDocument()
  expect(screen.getByText('Routing')).toBeInTheDocument()
})
```

Add a new test for the phase toggle interaction (after the existing tests in the `structure` describe block):
```tsx
it('calls onTogglePhase when PhaseInvert is clicked', () => {
  const onTogglePhase = vi.fn()
  render(<FocusedTrackDetailPanel {...makeProps({ onTogglePhase })} />)
  fireEvent.click(screen.getByRole('button', { name: /invert phase/i }))
  expect(onTogglePhase).toHaveBeenCalledWith(true)
})

it('renders PhaseInvert as pressed when track.phaseInverted=true', () => {
  render(<FocusedTrackDetailPanel {...makeProps({
    track: { ...TRACK, phaseInverted: true },
  })} />)
  const btn = screen.getByRole('button', { name: /invert phase/i })
  expect(btn.getAttribute('aria-pressed')).toBe('true')
})
```

- [ ] **Step 4: Update FocusedTrackDetailPanel.demo.tsx**

Add `phaseInverted` to the TRACK constants and wire up `onTogglePhase` in the playground:

```tsx
// In TRACK_VOCAL, add:
phaseInverted: false,

// In TRACK_DRUMS, add:
phaseInverted: false,
```

In the Playground demo, add state + handler and pass to panel:
```tsx
const [phaseInverted, setPhaseInverted] = useState(false)
// … and pass to panel:
track={{ ...track, phaseInverted }}
onTogglePhase={setPhaseInverted}
```

- [ ] **Step 5: Run all tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && npx vitest run 2>&1 | tail -30
```
Expected: all suites PASS (including PhaseInvert + FocusedTrackDetailPanel).

- [ ] **Step 6: Type check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/phase-invert && git add src/components/FocusedTrackDetailPanel/ && git commit -m "feat(FocusedTrackDetailPanel): wire PhaseInvert into Advanced panel

Replace Phase/Polarity placeholder AdvancedSlot with real PhaseInvert control.
track.phaseInverted? optional (defaults false) — non-breaking.
onTogglePhase? optional — non-breaking.
advancedPhaseRow CSS modifier: row layout (label left, toggle right).
Tests updated: placeholder check → button role check + interaction tests.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
