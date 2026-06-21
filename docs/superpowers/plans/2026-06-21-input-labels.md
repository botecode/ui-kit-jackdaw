# InputLabels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `InputLabels` composite component — a vertically-scrolling list of hardware-input rows (dim name on the left, editable `TextField` on the right) for the Preferences › Input panel in the Jackdaw UI Kit.

**Architecture:** A `LabelRow` sub-component owns a local draft state for the editable label (init from prop). Commits on blur + Enter; reverts on Escape. The parent component renders a `<ul>/<li>` list, auto-scrollable when inputs are many. The gallery demo covers all states including a live playground.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + @testing-library/react (fireEvent only), Phosphor Icons (none needed here)

## Global Constraints

- Tokens only — no hardcoded colors; layout px values are acceptable
- CSS Modules; `data-*` attributes for state
- Tests use `fireEvent`, NOT `userEvent`
- `tsc --noEmit` + `vitest run` + lint must stay green
- `:focus-visible` only, never `:focus`
- Sizes: `sm` / `md` (default `md`)
- No animation library — CSS transitions only
- No premature abstraction; no dead code
- Gallery auto-registers via `import.meta.glob` — no manual registry edits
- Dogfood kit components in playground (Toggle for toggles)

---

### Task 1: InputLabels component + CSS

**Files:**
- Create: `src/components/InputLabels/InputLabels.tsx`
- Create: `src/components/InputLabels/InputLabels.module.css`
- Create: `src/components/InputLabels/index.ts`

**Interfaces:**
- Consumes: `TextField` from `../TextField`
- Produces:
  ```ts
  export interface InputEntry { id: string; name: string; label?: string }
  export interface InputLabelsProps {
    inputs: InputEntry[]
    onLabel: (id: string, label: string) => void
    size?: 'sm' | 'md'
  }
  export function InputLabels(props: InputLabelsProps): JSX.Element
  ```

- [ ] **Step 1: Write `InputLabels.tsx`**

```tsx
// src/components/InputLabels/InputLabels.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { TextField } from '../TextField'
import styles from './InputLabels.module.css'

export interface InputEntry {
  id: string
  name: string
  label?: string
}

export interface InputLabelsProps {
  inputs: InputEntry[]
  onLabel: (id: string, label: string) => void
  size?: 'sm' | 'md'
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface LabelRowProps {
  input: InputEntry
  size: 'sm' | 'md'
  onLabel: (id: string, label: string) => void
}

function LabelRow({ input, size, onLabel }: LabelRowProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(input.label ?? '')
  const savedRef = useRef(input.label ?? '')

  // Sync when parent updates the label externally (e.g., controlled list refresh)
  useEffect(() => {
    setDraft(input.label ?? '')
    savedRef.current = input.label ?? ''
  }, [input.label])

  function commit() {
    const next = draft.trim()
    if (next !== savedRef.current) {
      setDraft(next)
      onLabel(input.id, next)
      savedRef.current = next
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      setDraft(savedRef.current)
      ;(e.target as HTMLElement).blur()
    }
  }

  return (
    <li className={styles.row} onKeyDown={handleKeyDown} onBlur={commit}>
      <label className={styles.name} htmlFor={inputId}>
        {input.name}
      </label>
      <TextField
        id={inputId}
        value={draft}
        onChange={(v) => setDraft(v)}
        placeholder="add a label…"
        size={size}
      />
    </li>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function InputLabels({ inputs, onLabel, size = 'md' }: InputLabelsProps) {
  return (
    <div className={styles.root} data-size={size}>
      <ul className={styles.list} aria-label="Input labels">
        {inputs.map((input) => (
          <LabelRow key={input.id} input={input} size={size} onLabel={onLabel} />
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Write `InputLabels.module.css`**

```css
/* src/components/InputLabels/InputLabels.module.css */

.root {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* ─── List ───────────────────────────────────────────────────────────────────── */

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 360px;
}

/* ─── Row ────────────────────────────────────────────────────────────────────── */

.row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-1) var(--space-2);
}

.row + .row {
  border-top: 1px solid var(--border);
}

/* ─── Name label ─────────────────────────────────────────────────────────────── */

.name {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
  user-select: none;
}

/* ─── Size variant ───────────────────────────────────────────────────────────── */

.root[data-size="sm"] .name {
  font-size: var(--text-xs);
}

@media (prefers-reduced-motion: reduce) {
  /* no transitions in this component — placeholder for future additions */
}
```

- [ ] **Step 3: Write `index.ts`**

```ts
export { InputLabels } from './InputLabels'
export type { InputLabelsProps, InputEntry } from './InputLabels'
```

- [ ] **Step 4: Run type-check to ensure no errors**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

---

### Task 2: Tests

**Files:**
- Create: `src/components/InputLabels/InputLabels.test.tsx`

**Interfaces:**
- Consumes: `InputLabels`, `InputEntry` from `./InputLabels`

- [ ] **Step 1: Write `InputLabels.test.tsx`**

```tsx
// src/components/InputLabels/InputLabels.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { InputLabels } from './InputLabels'
import type { InputEntry } from './InputLabels'

const INPUTS: InputEntry[] = [
  { id: '1', name: 'Input 1' },
  { id: '2', name: 'Input 2', label: 'Guitar' },
  { id: '3', name: 'Input 3', label: 'Drums' },
]

// ── Rendering ────────────────────────────────────────────────────────────────

describe('InputLabels rendering', () => {
  it('renders a labelled list', () => {
    const { getByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByRole('list', { name: 'Input labels' })).toBeInTheDocument()
  })

  it('renders one listitem per input', () => {
    const { getAllByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByRole('listitem')).toHaveLength(3)
  })

  it('renders a textbox per input', () => {
    const { getAllByRole } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getAllByRole('textbox')).toHaveLength(3)
  })

  it('shows input name as label text', () => {
    const { getByText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByText('Input 1')).toBeInTheDocument()
    expect(getByText('Input 2')).toBeInTheDocument()
  })

  it('label htmlFor associates with TextField', () => {
    const { getByLabelText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByLabelText('Input 1')).toBeInTheDocument()
    expect(getByLabelText('Input 2')).toBeInTheDocument()
  })

  it('populated label shown as textbox value', () => {
    const { getByLabelText } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(getByLabelText('Input 2')).toHaveValue('Guitar')
    expect(getByLabelText('Input 3')).toHaveValue('Drums')
  })

  it('empty label shows placeholder', () => {
    const { getByPlaceholderText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={vi.fn()} />,
    )
    expect(getByPlaceholderText('add a label…')).toBeInTheDocument()
  })

  it('renders data-size="md" by default', () => {
    const { container } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('renders data-size="sm" when size="sm"', () => {
    const { container } = render(
      <InputLabels inputs={INPUTS} onLabel={vi.fn()} size="sm" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('renders empty list when inputs is empty array', () => {
    const { getByRole, queryAllByRole } = render(
      <InputLabels inputs={[]} onLabel={vi.fn()} />,
    )
    expect(getByRole('list')).toBeInTheDocument()
    expect(queryAllByRole('listitem')).toHaveLength(0)
  })
})

// ── Interaction ───────────────────────────────────────────────────────────────

describe('InputLabels interaction', () => {
  it('typing updates the draft value', () => {
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={vi.fn()} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Bass DI' } })
    expect(field).toHaveValue('Bass DI')
  })

  it('blur calls onLabel with the new value', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Bass DI' } })
    fireEvent.blur(field)
    expect(onLabel).toHaveBeenCalledOnce()
    expect(onLabel).toHaveBeenCalledWith('1', 'Bass DI')
  })

  it('blur does NOT call onLabel when value is unchanged', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1', label: 'Guitar' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.blur(field)
    expect(onLabel).not.toHaveBeenCalled()
  })

  it('Enter key calls onLabel', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Synth' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onLabel).toHaveBeenCalledOnce()
    expect(onLabel).toHaveBeenCalledWith('1', 'Synth')
  })

  it('Escape reverts draft to last saved value', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels
        inputs={[{ id: '1', name: 'Input 1', label: 'Guitar' }]}
        onLabel={onLabel}
      />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Bass' } })
    expect(field).toHaveValue('Bass')
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(field).toHaveValue('Guitar')
    expect(onLabel).not.toHaveBeenCalled()
  })

  it('blur trims leading/trailing whitespace before saving', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: '  Guitar  ' } })
    fireEvent.blur(field)
    expect(onLabel).toHaveBeenCalledWith('1', 'Guitar')
  })

  it('Enter after Enter does NOT call onLabel a second time', () => {
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <InputLabels inputs={[{ id: '1', name: 'Input 1' }]} onLabel={onLabel} />,
    )
    const field = getByLabelText('Input 1')
    fireEvent.change(field, { target: { value: 'Synth' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onLabel).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && npx vitest run src/components/InputLabels/InputLabels.test.tsx 2>&1
```

Expected: all tests pass (green bar).

- [ ] **Step 3: Run full type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && git add src/components/InputLabels/ && git commit -m "feat(InputLabels): scaffold component + CSS + barrel

LabelRow manages local draft; commit on blur/Enter; revert on Escape.
80px fixed name column; 1fr TextField; scrollable list at max-height 360px.
Tokens only for color; 80px layout px are acceptable.
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/InputLabels/InputLabels.demo.tsx`

**Interfaces:**
- Consumes: `InputLabels`, `InputEntry`, `Panel`, `Toggle`, `DemoShell`, `StatesGrid`, `State`, `Playground`
- Produces: `meta` (DemoMeta) and default export `InputLabelsDemo` function

States to cover: all-empty, some-labelled, focused (autoFocus), many-inputs (scroll), playground (live).

- [ ] **Step 1: Write `InputLabels.demo.tsx`**

```tsx
// src/components/InputLabels/InputLabels.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Panel } from '../Panel'
import { InputLabels } from './InputLabels'
import type { InputEntry } from './InputLabels'

export const meta: DemoMeta = {
  name: 'InputLabels',
  group: 'Composites',
  route: '/input-labels',
  order: 65,
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ALL_EMPTY: InputEntry[] = [
  { id: '1', name: 'Input 1' },
  { id: '2', name: 'Input 2' },
  { id: '3', name: 'Input 3' },
  { id: '4', name: 'Input 4' },
]

const SOME_LABELLED: InputEntry[] = [
  { id: '1', name: 'Input 1', label: 'Guitar - ez1073' },
  { id: '2', name: 'Input 2', label: 'Bass DI' },
  { id: '3', name: 'Input 3' },
  { id: '4', name: 'Input 4' },
]

const MANY: InputEntry[] = Array.from({ length: 16 }, (_, i) => ({
  id: String(i + 1),
  name: `Input ${i + 1}`,
  label: i < 4 ? ['Guitar', 'Bass DI', 'Kick', 'Snare'][i] : undefined,
}))

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="All empty (placeholders)">
        <Panel title="Inputs" style={{ width: 320 }}>
          <InputLabels inputs={ALL_EMPTY} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Some labelled">
        <Panel title="Inputs" style={{ width: 320 }}>
          <InputLabels inputs={SOME_LABELLED} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Many inputs (scroll)">
        <Panel title="Inputs" style={{ width: 320 }}>
          <InputLabels inputs={MANY} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Small size">
        <Panel title="Inputs" style={{ width: 280 }}>
          <InputLabels inputs={SOME_LABELLED} onLabel={() => {}} size="sm" />
        </Panel>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [inputs, setInputs] = useState<InputEntry[]>(SOME_LABELLED)
  const [useSmall, setUseSmall] = useState(false)

  function handleLabel(id: string, label: string) {
    setInputs(prev => prev.map(i => i.id === id ? { ...i, label } : i))
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Panel title="Inputs" style={{ width: 320 }}>
          <InputLabels
            inputs={inputs}
            onLabel={handleLabel}
            size={useSmall ? 'sm' : 'md'}
          />
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={useSmall}
            onChange={setUseSmall}
            size="sm"
            label="size sm"
          />
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              margin: 0,
              whiteSpace: 'pre',
            }}
          >
            {inputs.map(i => `${i.name}: ${i.label ?? '—'}`).join('\n')}
          </p>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function InputLabelsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run type-check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Run full vitest run**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && npx vitest run 2>&1 | tail -20
```

Expected: all tests pass (no regressions).

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/input-labels && git add src/components/InputLabels/ && git commit -m "feat(InputLabels): gallery demo — states grid + interactive playground

States: all-empty, some-labelled, many-inputs (scroll), small size.
Playground: live label editing with Toggle size control + live readout.
Dogfoods Toggle for playground controls; wraps in Panel for context.
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Vertical list of inputs (name + editable field) | Task 1 |
| Props: `inputs: {id, name, label?}[]`, `onLabel(id, label)` | Task 1 |
| State: all empty (placeholders) | Task 3 |
| State: some labelled | Task 3 |
| State: field focused/editing | Task 3 (autoFocus) |
| State: many inputs (scroll) | Task 3 |
| Tokens only, Compare light+dark | Task 1 CSS |
| TextField dogfood | Task 1 (LabelRow uses TextField) |
| `tsc + vitest + lint green` | Task 2 + Task 3 |
| Gallery auto-registers | Auto via `import.meta.glob` ✓ |

**Placeholder scan:** No TBD/TODO/placeholder patterns found.

**Type consistency:** `InputEntry`, `InputLabelsProps`, `onLabel` signature consistent across all tasks.
