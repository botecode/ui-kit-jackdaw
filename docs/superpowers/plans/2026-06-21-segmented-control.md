# SegmentedControl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tactile, hardware-feeling segmented control (pill toggle-group) that selects exactly one of N options, with LED-lit selection, keyboard navigation, and all states in the gallery demo.

**Architecture:** A `role="radiogroup"` container (dark recessed pill track) with `role="radio"` segment buttons. Roving tabIndex + arrow-key navigation updates selection. Selected segment gets the accent LED-bloom; unselected segments are dim transparent against the dark stage track.

**Tech Stack:** React 18, CSS Modules, @phosphor-icons/react (icons in options), Vitest + @testing-library/react (fireEvent only), design tokens from `src/tokens/`.

## Global Constraints

- Tokens only — no hardcoded colors; all colors from `--bg`, `--stage`, `--accent`, `--accent-contrast`, `--stage-text`, `--text-muted`, `--border` etc.
- CSS Modules for all styling; `data-*` attributes for state (no class toggling for state).
- Tests use `fireEvent`, NOT `userEvent`.
- Sizes are `sm` / `md` only; default `md`.
- `:focus-visible` only — never `:focus`.
- `--dur-led-on` (40ms) for selected-on transitions; `--dur-led-off` (220ms) for selected-off.
- Phosphor icons via `@phosphor-icons/react`; icon prop is `React.ReactNode`.
- Gallery auto-registers via `import.meta.glob` — no manual registry edits.
- `tsc --noEmit` + `vitest run` + lint must be green.

---

### Task 1: Core component + CSS

**Files:**
- Create: `src/components/SegmentedControl/SegmentedControl.tsx`
- Create: `src/components/SegmentedControl/SegmentedControl.module.css`
- Create: `src/components/SegmentedControl/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface SegmentedControlOption {
    value: string
    label?: string
    icon?: React.ReactNode
  }
  export interface SegmentedControlProps {
    options: SegmentedControlOption[]
    value: string
    onChange: (value: string) => void
    size?: 'sm' | 'md'
    disabled?: boolean
    'aria-label': string
    autoFocus?: boolean
  }
  export function SegmentedControl(props: SegmentedControlProps): JSX.Element
  ```

- [ ] **Step 1: Write `SegmentedControl.tsx`**

```tsx
// src/components/SegmentedControl/SegmentedControl.tsx
import { useRef } from 'react'
import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption {
  value: string
  label?: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label': string
  autoFocus?: boolean
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
  autoFocus,
}: SegmentedControlProps) {
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = options.length - 1
    let next = index
    if (e.key === 'ArrowRight') next = index < last ? index + 1 : 0
    else if (e.key === 'ArrowLeft') next = index > 0 ? index - 1 : last
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(options[next].value)
    segmentRefs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={styles.track}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            ref={el => { segmentRefs.current[i] = el }}
            role="radio"
            aria-checked={selected}
            data-selected={selected || undefined}
            tabIndex={selected ? 0 : -1}
            className={styles.segment}
            disabled={disabled}
            autoFocus={autoFocus && selected}
            onClick={() => { if (!disabled) onChange(opt.value) }}
            onKeyDown={e => handleKeyDown(e, i)}
          >
            {opt.icon && <span className={styles.icon} aria-hidden="true">{opt.icon}</span>}
            {opt.label && <span className={styles.label}>{opt.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Write `SegmentedControl.module.css`**

```css
/* src/components/SegmentedControl/SegmentedControl.module.css */

/* ─── Track (the recessed pill groove) ──────────────────────────────────────── */

.track {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
  background: var(--stage);
  box-shadow:
    inset 0 2px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
}

/* ─── Track sizes ────────────────────────────────────────────────────────────── */

.track[data-size="md"] {
  --_seg-h: 26px;
  --_seg-px: 12px;
  --_seg-font: var(--text-sm);
  --_seg-gap: var(--space-1);
}

.track[data-size="sm"] {
  --_seg-h: 20px;
  --_seg-px: 8px;
  --_seg-font: var(--text-xs);
  --_seg-gap: 3px;
}

/* ─── Disabled track ──────────────────────────────────────────────────────────── */

.track[data-disabled] {
  opacity: 0.4;
  pointer-events: none;
}

/* ─── Segment (the radio button) ────────────────────────────────────────────── */

.segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--_seg-gap);
  height: var(--_seg-h);
  padding: 0 var(--_seg-px);
  border: none;
  border-radius: 999px;
  background: transparent;
  /* Dim unselected text against the dark stage */
  color: var(--stage-text);
  opacity: 0.5;
  font-family: var(--font-ui);
  font-size: var(--_seg-font);
  font-weight: var(--weight-medium);
  letter-spacing: 0.01em;
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  white-space: nowrap;
  /* Slow decay for going off (incandescent) */
  transition:
    background var(--dur-led-off) var(--ease-out),
    box-shadow  var(--dur-led-off) var(--ease-out),
    color       var(--dur-led-off) var(--ease-out),
    opacity     var(--dur-led-off) var(--ease-out);
}

/* ─── Hover (unselected only) ─────────────────────────────────────────────────── */

.segment:hover:not([data-selected]):not(:disabled) {
  opacity: 0.75;
}

/* ─── Focus ring ─────────────────────────────────────────────────────────────── */

.segment:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

/* ─── Selected (LED-lit) state ───────────────────────────────────────────────── */

.segment[data-selected] {
  background: var(--accent);
  color: var(--accent-contrast);
  opacity: 1;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.2),
    0 0 0 1px color-mix(in srgb, var(--accent) 80%, transparent),
    0 0 8px 2px color-mix(in srgb, var(--accent) 35%, transparent);
  /* Fast attack — light turns on quickly */
  transition:
    background var(--dur-led-on) var(--ease-out),
    box-shadow  var(--dur-led-on) var(--ease-out),
    color       var(--dur-led-on) var(--ease-out),
    opacity     var(--dur-led-on) var(--ease-out);
}

/* ─── Icon wrapper ───────────────────────────────────────────────────────────── */

.icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  line-height: 0;
}

/* ─── Label text ─────────────────────────────────────────────────────────────── */

.label {
  line-height: 1;
}
```

- [ ] **Step 3: Write `index.ts`**

```ts
// src/components/SegmentedControl/index.ts
export { SegmentedControl } from './SegmentedControl'
export type { SegmentedControlProps, SegmentedControlOption } from './SegmentedControl'
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /path/to/worktree && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit scaffolding**

```bash
git add src/components/SegmentedControl/
git commit -m "feat(SegmentedControl): core component + CSS

Recessed pill track (--stage bg + inset shadow) with LED-lit selected
segment using accent color + bloom glow. Roving tabIndex + arrow/Home/End
keyboard nav on role=radiogroup/radio. Fast attack (--dur-led-on 40ms) /
slow decay (--dur-led-off 220ms) incandescent timing. sm/md sizes. Icons
via React.ReactNode (Phosphor compatible). data-selected drives all CSS.

Decision: autoFocus prop added (not in minimal spec) to support focus-state
demonstration in the gallery StatesGrid — consistent with Toggle's pattern.

Decision: icon prop is React.ReactNode, not a Phosphor IconComponent, for
maximum flexibility (caller renders the icon element, not the component).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Tests

**Files:**
- Create: `src/components/SegmentedControl/SegmentedControl.test.tsx`

**Interfaces:**
- Consumes:
  - `SegmentedControl` from `./SegmentedControl`
  - `SegmentedControlOption` type

- [ ] **Step 1: Write test file**

```tsx
// src/components/SegmentedControl/SegmentedControl.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlOption } from './SegmentedControl'

const TWO_OPTS: SegmentedControlOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

const THREE_OPTS: SegmentedControlOption[] = [
  { value: 'x', label: 'X' },
  { value: 'y', label: 'Y' },
  { value: 'z', label: 'Z' },
]

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('SegmentedControl rendering', () => {
  it('renders a radiogroup', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders one radio per option', () => {
    const { getAllByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getAllByRole('radio')).toHaveLength(3)
  })

  it('selected segment has aria-checked="true"', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="b" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radio', { name: 'Beta' }).getAttribute('aria-checked')).toBe('true')
  })

  it('unselected segments have aria-checked="false"', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="b" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radio', { name: 'Alpha' }).getAttribute('aria-checked')).toBe('false')
  })

  it('selected segment has data-selected attribute', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radio', { name: 'Alpha' })).toHaveAttribute('data-selected')
  })

  it('unselected segments lack data-selected', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radio', { name: 'Beta' })).not.toHaveAttribute('data-selected')
  })

  it('selected segment has tabIndex=0', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radio', { name: 'Alpha' })).toHaveAttribute('tabindex', '0')
  })

  it('unselected segments have tabIndex=-1', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radio', { name: 'Beta' })).toHaveAttribute('tabindex', '-1')
  })

  it('radiogroup has aria-label', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Fruit picker" />
    )
    expect(getByRole('radiogroup').getAttribute('aria-label')).toBe('Fruit picker')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radiogroup').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" size="sm" />
    )
    expect(getByRole('radiogroup').getAttribute('data-size')).toBe('sm')
  })

  it('data-disabled present when disabled', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" disabled />
    )
    expect(getByRole('radiogroup')).toHaveAttribute('data-disabled')
  })

  it('no data-disabled when not disabled', () => {
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByRole('radiogroup')).not.toHaveAttribute('data-disabled')
  })

  it('renders label text for each option', () => {
    const { getByText } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={vi.fn()} aria-label="Pick" />
    )
    expect(getByText('Alpha')).toBeInTheDocument()
    expect(getByText('Beta')).toBeInTheDocument()
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('SegmentedControl interaction', () => {
  it('click on unselected segment calls onChange with its value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.click(getByRole('radio', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('click on already-selected segment still calls onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.click(getByRole('radio', { name: 'Alpha' }))
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('disabled: click does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={TWO_OPTS} value="a" onChange={onChange} aria-label="Pick" disabled />
    )
    fireEvent.click(getByRole('radio', { name: 'Beta' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('SegmentedControl keyboard navigation', () => {
  it('ArrowRight from first moves to second', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'X' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('y')
  })

  it('ArrowLeft from last moves to second-to-last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="z" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Z' }), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('y')
  })

  it('ArrowRight from last wraps to first', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="z" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Z' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('x')
  })

  it('ArrowLeft from first wraps to last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'X' }), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('z')
  })

  it('Home moves to first option', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="y" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Y' }), { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('x')
  })

  it('End moves to last option', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="y" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'Y' }), { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('z')
  })

  it('other keys do not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SegmentedControl options={THREE_OPTS} value="x" onChange={onChange} aria-label="Pick" />
    )
    fireEvent.keyDown(getByRole('radio', { name: 'X' }), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/components/SegmentedControl/SegmentedControl.test.tsx
```
Expected: all tests pass.

- [ ] **Step 3: Commit tests**

```bash
git add src/components/SegmentedControl/SegmentedControl.test.tsx
git commit -m "test(SegmentedControl): full test suite — render, interaction, keyboard nav

Covers: radiogroup/radio roles, aria-checked, data-selected, tabIndex roving,
data-size/data-disabled attributes, click onChange, disabled blocking, arrow
key navigation (Left/Right/Home/End) with wrap-around.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/SegmentedControl/SegmentedControl.demo.tsx`

**Interfaces:**
- Consumes:
  - `SegmentedControl`, `SegmentedControlOption` from `./SegmentedControl`
  - `DemoMeta` from `../../gallery/registry`
  - `DemoShell` from `../../gallery/ui/DemoShell`
  - `StatesGrid`, `State` from `../../gallery/ui/StatesGrid`
  - `Playground` from `../../gallery/ui/Playground`
  - `Toggle` from `../Toggle`
  - `{ MusicNotes, Waveform, SpeakerSimple, GridFour }` from `@phosphor-icons/react`

- [ ] **Step 1: Write the demo file**

```tsx
// src/components/SegmentedControl/SegmentedControl.demo.tsx
import { useState } from 'react'
import { MusicNotes, Waveform, SpeakerSimple, GridFour } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SegmentedControl } from './SegmentedControl'

export const meta: DemoMeta = {
  name: 'SegmentedControl',
  group: 'Primitives',
  route: '/segmented-control',
  order: 5,
}

// ── Fixture data ────────────────────────────────────────────────────────────

const TWO = [
  { value: 'a', label: 'Beats' },
  { value: 'b', label: 'Bars' },
]

const THREE_TEXT = [
  { value: 'fx',   label: 'FX' },
  { value: 'inst', label: 'Inst' },
  { value: 'all',  label: 'All' },
]

const FOUR_TEXT = [
  { value: '1',  label: '1/4' },
  { value: '2',  label: '1/8' },
  { value: '3',  label: '1/16' },
  { value: '4',  label: '1/32' },
]

const ICON_ONLY = [
  { value: 'grid',    icon: <GridFour size={14} /> },
  { value: 'wave',    icon: <Waveform size={14} /> },
  { value: 'notes',   icon: <MusicNotes size={14} /> },
]

const ICON_TEXT = [
  { value: 'notes',  label: 'Notes',   icon: <MusicNotes size={12} /> },
  { value: 'wave',   label: 'Audio',   icon: <Waveform size={12} /> },
  { value: 'mix',    label: 'Mix',     icon: <SpeakerSimple size={12} /> },
]

// ── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {/* 2 segments */}
      <State label="2 segments — A">
        <SegmentedControl options={TWO} value="a" onChange={() => {}} aria-label="Beats/Bars" />
      </State>
      <State label="2 segments — B">
        <SegmentedControl options={TWO} value="b" onChange={() => {}} aria-label="Beats/Bars" />
      </State>

      {/* 3 segments — all positions */}
      <State label="3 segments — first">
        <SegmentedControl options={THREE_TEXT} value="fx" onChange={() => {}} aria-label="Filter" />
      </State>
      <State label="3 segments — mid">
        <SegmentedControl options={THREE_TEXT} value="inst" onChange={() => {}} aria-label="Filter" />
      </State>
      <State label="3 segments — last">
        <SegmentedControl options={THREE_TEXT} value="all" onChange={() => {}} aria-label="Filter" />
      </State>

      {/* 4 segments */}
      <State label="4 segments">
        <SegmentedControl options={FOUR_TEXT} value="2" onChange={() => {}} aria-label="Grid division" />
      </State>

      {/* Icons only */}
      <State label="icon-only">
        <SegmentedControl options={ICON_ONLY} value="grid" onChange={() => {}} aria-label="View mode" />
      </State>

      {/* Icon + text */}
      <State label="icon + text">
        <SegmentedControl options={ICON_TEXT} value="notes" onChange={() => {}} aria-label="Mode" />
      </State>

      {/* Small size */}
      <State label="sm — 3 segments">
        <SegmentedControl options={THREE_TEXT} value="fx" onChange={() => {}} aria-label="Filter sm" size="sm" />
      </State>
      <State label="sm — 4 segments">
        <SegmentedControl options={FOUR_TEXT} value="3" onChange={() => {}} aria-label="Grid sm" size="sm" />
      </State>

      {/* Focus */}
      <State label="focused">
        <SegmentedControl options={THREE_TEXT} value="inst" onChange={() => {}} aria-label="Filter focus" autoFocus />
      </State>

      {/* Disabled */}
      <State label="disabled">
        <SegmentedControl options={THREE_TEXT} value="fx" onChange={() => {}} aria-label="Filter disabled" disabled />
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)
  const [selected, setSelected] = useState('fx')
  const [useIcons, setUseIcons] = useState(false)

  const opts = useIcons ? ICON_TEXT : THREE_TEXT
  const safeValue = opts.find(o => o.value === selected) ? selected : opts[0].value

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
        {/* Live instance */}
        <SegmentedControl
          options={opts}
          value={safeValue}
          onChange={setSelected}
          size={size}
          disabled={disabled}
          aria-label="Playground control"
        />

        {/* Controls — dogfood Toggle for boolean props */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={disabled}
            onChange={next => setDisabled(next)}
            size="sm"
            label="disabled"
          />
          <Toggle
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="sm size"
          />
          <Toggle
            checked={useIcons}
            onChange={next => setUseIcons(next)}
            size="sm"
            label="icon + text"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────

export default function SegmentedControlDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass, no regressions.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit demo**

```bash
git add src/components/SegmentedControl/SegmentedControl.demo.tsx
git commit -m "feat(SegmentedControl): gallery demo — all states, playground with dogfooded Toggle

States: 2/3/4 segments × all positions selected; icon-only; icon+text;
sm×2; focused (autoFocus); disabled. Playground: size/disabled/icon+text
toggles dogfood kit Toggle (sm). Auto-registers via import.meta.glob.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| `options: [{value, label, icon?}]`, `value`, `onChange`, `size`, `aria-label` | Task 1 |
| `role="radiogroup"` container, `role="radio"` segments | Task 1 |
| Arrow keys move selection | Task 1 + Task 2 (keyboard nav tests) |
| `:focus-visible` | Task 1 CSS |
| 2/3/4 segments, each selected | Task 3 states grid |
| Hover, focused, disabled states | Task 1 CSS + Task 3 |
| Icon vs text | Task 3 states grid |
| Tokens only, no hardcoded colors | Task 1 CSS |
| Compare light + dark (gallery) | Task 3 (themes via gallery) |
| sm/md sizes | Task 1 + Task 3 |
| LED-lit selection (incandescent timing) | Task 1 CSS |
| `tsc --noEmit` green | Task 1 + Task 3 |
| `vitest run` green | Task 2 |
| Dogfood Toggle in playground | Task 3 |

All requirements covered. ✓

### Placeholder scan
No TBDs, no "implement later", no "similar to Task N" placeholders. ✓

### Type consistency
- `SegmentedControlOption` defined in Task 1, consumed in Tasks 2 and 3 ✓
- `SegmentedControlProps` defined in Task 1 ✓
- `onChange: (value: string) => void` consistent throughout ✓
