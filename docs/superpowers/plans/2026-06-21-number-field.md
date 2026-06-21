# NumberField Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tactile numeric input primitive — recessed `--font-mono` readout with ± steppers, drag-to-scrub, and type-to-edit — that replaces the ad-hoc BPM/time-sig widgets inline in TransportBar.

**Architecture:** Single component file with no sub-files. The root `<div>` is the recessed well; ± stepper `<button>`s sit at each end (tabIndex=-1, pointer-captured); the center `valueArea` toggles between a `role="spinbutton"` readout div (display mode) and a `<input type="text">` (edit mode). Drag is handled via pointer capture on the readout div; a < 3 px "non-drag" becomes a click-to-edit. All state is local; the caller provides `value`/`onChange`.

**Tech Stack:** React 18, TypeScript, CSS Modules, `@phosphor-icons/react` (Minus/Plus), Vitest + Testing Library (`fireEvent` only)

## Global Constraints

- Tokens only — no hardcoded colors; all theme vars via `var(--*)`.
- CSS Modules with `data-*` attributes for state (no class toggling).
- `fireEvent` in tests, never `userEvent`.
- `:focus-visible` only (never `:focus`).
- Sizes `sm` / `md` (default `md`).
- Phosphor icons, one weight via global `IconContext`.
- `tsc --noEmit` + `vitest run` + lint green before commit.
- Gallery auto-registers via `import.meta.glob` — no manual registry edits.

---

### Task 1: Scaffold index + stub component

**Files:**
- Create: `src/components/NumberField/NumberField.tsx` (stub)
- Create: `src/components/NumberField/NumberField.module.css` (empty)
- Create: `src/components/NumberField/index.ts`

- [ ] **Step 1: Create index.ts**

```ts
// src/components/NumberField/index.ts
export { NumberField } from './NumberField'
export type { NumberFieldProps } from './NumberField'
```

- [ ] **Step 2: Create CSS stub**

```css
/* src/components/NumberField/NumberField.module.css */
```

- [ ] **Step 3: Create component stub so TypeScript compiles**

```tsx
// src/components/NumberField/NumberField.tsx
import styles from './NumberField.module.css'

export interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  precision?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label': string
}

export function NumberField(_props: NumberFieldProps) {
  return <div className={styles.root} />
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && npx tsc --noEmit
```

Expected: no errors.

---

### Task 2: Write failing tests

**Files:**
- Create: `src/components/NumberField/NumberField.test.tsx`

- [ ] **Step 1: Write the full test file**

```tsx
// src/components/NumberField/NumberField.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { NumberField } from './NumberField'

const noop = vi.fn()

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('NumberField rendering', () => {
  it('renders role="spinbutton"', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton')).toBeInTheDocument()
  })

  it('aria-valuenow matches value', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuenow')).toBe('120')
  })

  it('aria-valuemin set when min provided', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} min={20} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuemin')).toBe('20')
  })

  it('aria-valuemax set when max provided', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} max={999} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuemax')).toBe('999')
  })

  it('formats value with default precision (0 for step=1)', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    // aria-valuetext carries the formatted string
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('120')
  })

  it('formats value with explicit precision', () => {
    const { getByRole } = render(
      <NumberField value={3.5} onChange={noop} precision={2} aria-label="Level" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('3.50')
  })

  it('aria-valuetext includes unit', () => {
    const { getByRole } = render(
      <NumberField value={-6} onChange={noop} precision={1} unit="dB" aria-label="Level" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('-6.0 dB')
  })

  it('renders unit text in the DOM', () => {
    const { getByText } = render(
      <NumberField value={-6} onChange={noop} unit="dB" aria-label="Level" />,
    )
    expect(getByText('dB')).toBeInTheDocument()
  })

  it('data-size="md" by default', () => {
    const { container } = render(
      <NumberField value={0} onChange={noop} aria-label="Val" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(
      <NumberField value={0} onChange={noop} size="sm" aria-label="Val" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('renders decrement button', () => {
    const { getByLabelText } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).toBeInTheDocument()
  })

  it('renders increment button', () => {
    const { getByLabelText } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).toBeInTheDocument()
  })

  it('decrement button disabled at min', () => {
    const { getByLabelText } = render(
      <NumberField value={20} onChange={noop} min={20} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).toBeDisabled()
  })

  it('increment button disabled at max', () => {
    const { getByLabelText } = render(
      <NumberField value={999} onChange={noop} max={999} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).toBeDisabled()
  })

  it('decrement button not disabled above min', () => {
    const { getByLabelText } = render(
      <NumberField value={121} onChange={noop} min={20} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).not.toBeDisabled()
  })

  it('increment button not disabled below max', () => {
    const { getByLabelText } = render(
      <NumberField value={120} onChange={noop} max={999} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).not.toBeDisabled()
  })

  it('aria-disabled set when disabled', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} disabled aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-disabled')).toBe('true')
  })

  it('data-disabled set when disabled', () => {
    const { container } = render(
      <NumberField value={120} onChange={noop} disabled aria-label="Tempo" />,
    )
    expect(container.firstChild).toHaveAttribute('data-disabled')
  })
})

// ─── Stepper buttons ──────────────────────────────────────────────────────────

describe('NumberField steppers', () => {
  it('pointerDown on increment calls onChange(value + step)', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.pointerDown(getByLabelText('Increase Tempo'))
    expect(onChange).toHaveBeenCalledWith(121)
  })

  it('pointerDown on decrement calls onChange(value - step)', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.pointerDown(getByLabelText('Decrease Tempo'))
    expect(onChange).toHaveBeenCalledWith(119)
  })

  it('increment clamps to max', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={999} onChange={onChange} max={999} step={1} aria-label="Tempo" />,
    )
    // button is disabled at max, so pointerDown on disabled button does nothing
    expect(getByLabelText('Increase Tempo')).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('decrement clamps to min', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={20} onChange={onChange} min={20} step={1} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('respects custom step on increment', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={0} onChange={onChange} step={5} aria-label="Val" />,
    )
    fireEvent.pointerDown(getByLabelText('Increase Val'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('respects custom step on decrement', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={10} onChange={onChange} step={5} aria-label="Val" />,
    )
    fireEvent.pointerDown(getByLabelText('Decrease Val'))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})

// ─── Keyboard (display mode) ──────────────────────────────────────────────────

describe('NumberField keyboard - display mode', () => {
  it('ArrowUp increments by step', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(121)
  })

  it('ArrowDown decrements by step', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(119)
  })

  it('ArrowUp clamps at max', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={999} onChange={onChange} max={999} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(999)
  })

  it('ArrowDown clamps at min', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={20} onChange={onChange} min={20} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(20)
  })

  it('Shift+ArrowUp uses fine step (step/10)', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={100} onChange={onChange} step={10} aria-label="Val" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowUp', shiftKey: true })
    expect(onChange).toHaveBeenCalledWith(101)
  })

  it('Enter starts edit mode — shows a text input', async () => {
    const { getByRole, findByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'Enter' })
    // After entering edit mode, spinbutton div is replaced by an input
    const input = await findByRole('textbox')
    expect(input).toBeInTheDocument()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe('NumberField edit mode', () => {
  function renderEditing(value = 120, props = {}) {
    const onChange = vi.fn()
    const utils = render(
      <NumberField value={value} onChange={onChange} aria-label="Tempo" {...props} />,
    )
    // Start edit by pressing Enter on spinbutton
    fireEvent.keyDown(utils.getByRole('spinbutton'), { key: 'Enter' })
    return { ...utils, onChange }
  }

  it('input pre-filled with current formatted value', async () => {
    const { findByRole } = renderEditing(120)
    const input = await findByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('120')
  })

  it('Enter in edit mode commits and calls onChange', async () => {
    const { findByRole, onChange } = renderEditing(120)
    const input = await findByRole('textbox')
    fireEvent.change(input, { target: { value: '140' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(140)
  })

  it('blur commits the edit', async () => {
    const { findByRole, onChange } = renderEditing(120)
    const input = await findByRole('textbox')
    fireEvent.change(input, { target: { value: '135' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(135)
  })

  it('Escape cancels without calling onChange', async () => {
    const { findByRole, onChange } = renderEditing(120)
    const input = await findByRole('textbox')
    fireEvent.change(input, { target: { value: '999' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('invalid entry on commit does not call onChange', async () => {
    const { findByRole, onChange } = renderEditing(120)
    const input = await findByRole('textbox')
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('commit clamps to min', async () => {
    const { findByRole, onChange } = renderEditing(120, { min: 20 })
    const input = await findByRole('textbox')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(20)
  })

  it('commit clamps to max', async () => {
    const { findByRole, onChange } = renderEditing(120, { max: 999 })
    const input = await findByRole('textbox')
    fireEvent.change(input, { target: { value: '5000' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(999)
  })
})

// ─── Drag ─────────────────────────────────────────────────────────────────────

describe('NumberField drag', () => {
  it('dragging up calls onChange with increased value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    const spinbutton = getByRole('spinbutton')
    fireEvent.pointerDown(spinbutton, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(spinbutton, { clientY: 90, pointerId: 1 })  // 10px up
    fireEvent.pointerUp(spinbutton, { pointerId: 1 })
    // Should have been called with 130 (120 + 10 * 1)
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toBeGreaterThan(120)
  })

  it('dragging down calls onChange with decreased value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    const spinbutton = getByRole('spinbutton')
    fireEvent.pointerDown(spinbutton, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(spinbutton, { clientY: 110, pointerId: 1 })  // 10px down
    fireEvent.pointerUp(spinbutton, { pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toBeLessThan(120)
  })
})
```

- [ ] **Step 2: Run tests to confirm they all fail (component is stub)**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && npx vitest run src/components/NumberField/NumberField.test.tsx 2>&1 | tail -20
```

Expected: many failures (stub returns empty div).

---

### Task 3: Implement NumberField.tsx

**Files:**
- Modify: `src/components/NumberField/NumberField.tsx`

- [ ] **Step 1: Write the full implementation**

```tsx
// src/components/NumberField/NumberField.tsx
import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from '@phosphor-icons/react'
import styles from './NumberField.module.css'

export interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  precision?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label': string
}

function clampNum(v: number, min?: number, max?: number): number {
  let r = v
  if (min !== undefined) r = Math.max(min, r)
  if (max !== undefined) r = Math.min(max, r)
  return r
}

function snapToStep(v: number, step: number): number {
  const factor = 1 / step
  return Math.round(v * factor) / factor
}

function derivePrecision(step: number): number {
  if (step >= 1) return 0
  return Math.max(0, Math.ceil(-Math.log10(step)))
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 10, md: 12 }

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  precision,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
}: NumberFieldProps) {
  const effectivePrecision = precision ?? derivePrecision(step)
  const formattedValue = value.toFixed(effectivePrecision)
  const ariaValueText = unit ? `${formattedValue} ${unit}` : formattedValue

  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const dragRef = useRef<{ y: number; value: number; moved: boolean } | null>(null)

  useEffect(() => { valueRef.current = value })
  useEffect(() => { onChangeRef.current = onChange })

  function applyValue(raw: number) {
    const snapped = snapToStep(raw, step)
    const clamped = clampNum(snapped, min, max)
    // Round to step precision to avoid floating-point drift (e.g. 0.1+0.2=0.30000…)
    const precise = parseFloat(clamped.toFixed(effectivePrecision))
    onChangeRef.current(precise)
  }

  function startEdit() {
    if (disabled) return
    setDraft(formattedValue)
    setEditing(true)
    requestAnimationFrame(() => {
      inputRef.current?.select()
    })
  }

  function commitEdit() {
    const n = parseFloat(draft)
    if (!isNaN(n)) {
      applyValue(n)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  function increment() {
    if (disabled || editing) return
    applyValue(valueRef.current + step)
  }

  function decrement() {
    if (disabled || editing) return
    applyValue(valueRef.current - step)
  }

  // ── Keyboard — display mode ───────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        applyValue(valueRef.current + (e.shiftKey ? step / 10 : step))
        break
      case 'ArrowDown':
        e.preventDefault()
        applyValue(valueRef.current - (e.shiftKey ? step / 10 : step))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        startEdit()
        break
      default:
        // Typing a digit/sign immediately seeds the draft and opens edit mode
        if (/^[-\d.]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
          setDraft(e.key)
          setEditing(true)
          requestAnimationFrame(() => {
            const input = inputRef.current
            if (input) {
              input.focus()
              input.setSelectionRange(1, 1)
            }
          })
        }
    }
  }

  // ── Keyboard — edit mode ──────────────────────────────────────────────────
  function handleEditKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        commitEdit()
        break
      case 'Escape':
        e.preventDefault()
        cancelEdit()
        break
      case 'ArrowUp':
        e.preventDefault()
        applyValue(valueRef.current + (e.shiftKey ? step / 10 : step))
        break
      case 'ArrowDown':
        e.preventDefault()
        applyValue(valueRef.current - (e.shiftKey ? step / 10 : step))
        break
    }
  }

  // ── Pointer drag ──────────────────────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || editing) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { y: e.clientY, value: valueRef.current, moved: false }
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const dy = dragRef.current.y - e.clientY  // up = positive = increase
    if (Math.abs(dy) >= 3) dragRef.current.moved = true
    const sensitivity = e.shiftKey ? 0.1 : 1.0
    applyValue(dragRef.current.value + dy * step * sensitivity)
  }

  function handlePointerUp() {
    if (!dragRef.current) return
    const { moved } = dragRef.current
    dragRef.current = null
    setIsDragging(false)
    if (!moved) startEdit()
  }

  const iconSize = ICON_SIZE[size]

  return (
    <div
      className={styles.root}
      data-size={size}
      data-disabled={disabled || undefined}
      data-dragging={isDragging || undefined}
      data-editing={editing || undefined}
    >
      <button
        type="button"
        className={styles.stepper}
        aria-label={`Decrease ${ariaLabel}`}
        disabled={disabled || atMin}
        tabIndex={-1}
        onPointerDown={e => { e.preventDefault(); decrement() }}
      >
        <Minus aria-hidden size={iconSize} />
      </button>

      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.valueArea}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.editInput}
            type="text"
            inputMode="decimal"
            aria-label={ariaLabel}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
          />
        ) : (
          <div
            className={styles.readout}
            role="spinbutton"
            aria-label={ariaLabel}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={ariaValueText}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
          >
            <span className={styles.valueText} aria-hidden="true">{formattedValue}</span>
          </div>
        )}
        {unit && <span className={styles.unit} aria-hidden="true">{unit}</span>}
      </div>

      <div className={styles.divider} aria-hidden="true" />

      <button
        type="button"
        className={styles.stepper}
        aria-label={`Increase ${ariaLabel}`}
        disabled={disabled || atMax}
        tabIndex={-1}
        onPointerDown={e => { e.preventDefault(); increment() }}
      >
        <Plus aria-hidden size={iconSize} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Run tests — should be mostly passing now**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && npx vitest run src/components/NumberField/NumberField.test.tsx 2>&1 | tail -30
```

Expected: all tests pass.

---

### Task 4: Implement NumberField.module.css

**Files:**
- Modify: `src/components/NumberField/NumberField.module.css`

- [ ] **Step 1: Write the full CSS**

```css
/* src/components/NumberField/NumberField.module.css */

/* ─── Root — the full recessed well ────────────────────────────────────────── */

.root {
  display: inline-flex;
  align-items: stretch;
  background: var(--stage);
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 1px var(--border);
  transition: box-shadow var(--dur-base) var(--ease-out);
}

/* ─── Focus ring — keyboard only, targets the spinbutton child ──────────────── */

/*
  :has() propagates the keyboard focus ring from the spinbutton div
  (which suppresses its own outline) to the whole recessed well.
  Same pattern as TextField's .field:has(:focus-visible).
*/
.root:has(.readout:focus-visible) {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 2px var(--accent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

/* Editing — accent ring while the user is typing (mirrors focus ring) */
.root[data-editing] {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 2px var(--accent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

/* ─── Disabled ───────────────────────────────────────────────────────────────── */

.root[data-disabled] {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Dragging cursor ────────────────────────────────────────────────────────── */

.root[data-dragging] {
  cursor: ns-resize;
}

/* ─── Sizes — the root height drives everything else via align-items:stretch ─── */

.root[data-size="md"] {
  height: 32px;
}

.root[data-size="sm"] {
  height: 24px;
}

/* ─── Stepper buttons ────────────────────────────────────────────────────────── */

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color var(--dur-base) var(--ease-out);
}

.stepper:hover:not(:disabled) {
  color: var(--text);
}

.stepper:disabled {
  color: var(--text-dim);
  cursor: default;
  opacity: 0.35;
}

.root[data-size="md"] .stepper {
  width: 24px;
}

.root[data-size="sm"] .stepper {
  width: 18px;
}

/* ─── Hairline divider between stepper and value area ───────────────────────── */

.divider {
  width: 1px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
  align-self: stretch;
}

/* ─── Value area — center flex slot holding readout/input + unit ─────────────── */

.valueArea {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}

.root[data-size="md"] .valueArea {
  padding: 0 var(--space-2);
  min-width: 52px;
}

.root[data-size="sm"] .valueArea {
  padding: 0 var(--space-1);
  min-width: 36px;
}

/* ─── Readout — the spinbutton target in display mode ────────────────────────── */

.readout {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
  cursor: ns-resize;
  outline: none;  /* ring on root via :has(.readout:focus-visible) */
  user-select: none;
}

/* ─── Value text — mono readout ──────────────────────────────────────────────── */

.valueText {
  font-family: var(--font-mono);
  color: var(--text);
  text-align: right;
  letter-spacing: -0.01em;
}

.root[data-size="md"] .valueText {
  font-size: var(--text-base);
}

.root[data-size="sm"] .valueText {
  font-size: var(--text-sm);
}

/* ─── Unit suffix ────────────────────────────────────────────────────────────── */

.unit {
  font-family: var(--font-mono);
  color: var(--text-dim);
  flex-shrink: 0;
}

.root[data-size="md"] .unit {
  font-size: var(--text-sm);
}

.root[data-size="sm"] .unit {
  font-size: var(--text-xs);
}

/* ─── Edit input ─────────────────────────────────────────────────────────────── */

.editInput {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-mono);
  color: var(--text);
  caret-color: var(--accent);
  text-align: right;
  padding: 0;
  width: 100%;
}

.root[data-size="md"] .editInput {
  font-size: var(--text-base);
}

.root[data-size="sm"] .editInput {
  font-size: var(--text-sm);
}
```

---

### Task 5: Write gallery demo

**Files:**
- Create: `src/components/NumberField/NumberField.demo.tsx`

- [ ] **Step 1: Write the demo**

```tsx
// src/components/NumberField/NumberField.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { NumberField } from './NumberField'

export const meta: DemoMeta = {
  name: 'NumberField',
  group: 'Primitives',
  route: '/number-field',
  order: 5,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Default">
        <NumberField value={120} onChange={noop} aria-label="Tempo" />
      </State>

      <State label="With unit">
        <NumberField value={-6} onChange={noop} precision={1} unit="dB" aria-label="Send level" />
      </State>

      <State label="BPM %">
        <NumberField value={75} onChange={noop} unit="%" aria-label="Percentage" />
      </State>

      <State label="Small">
        <NumberField value={4} onChange={noop} size="sm" unit="oct" aria-label="Octaves" />
      </State>

      <State label="At min (− disabled)">
        <NumberField value={20} onChange={noop} min={20} max={999} aria-label="Tempo at min" />
      </State>

      <State label="At max (+ disabled)">
        <NumberField value={999} onChange={noop} min={20} max={999} aria-label="Tempo at max" />
      </State>

      <State label="Focused">
        <NumberField value={120} onChange={noop} aria-label="Tempo focused" autoFocus />
      </State>

      <State label="Disabled">
        <NumberField value={120} onChange={noop} disabled aria-label="Disabled tempo" />
      </State>

      <State label="High precision">
        <NumberField value={0.707} onChange={noop} step={0.001} precision={3} aria-label="Fine value" />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState(120)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [showUnit, setShowUnit] = useState(true)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
        <NumberField
          value={value}
          onChange={setValue}
          min={20}
          max={999}
          step={1}
          unit={showUnit ? 'BPM' : undefined}
          disabled={disabled}
          size={size}
          aria-label="Playground tempo"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          <Toggle
            checked={showUnit}
            onChange={setShowUnit}
            size="sm"
            label="show unit"
          />
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md</option>
              <option value="sm">sm</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function NumberFieldDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

---

### Task 6: Verify and commit

- [ ] **Step 1: TypeScript check**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && npx vitest run 2>&1 | tail -20
```

Expected: all tests pass including new NumberField tests.

- [ ] **Step 3: Check lint**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && npx eslint src/components/NumberField/ --max-warnings 0 2>&1 | tail -20
```

Expected: no errors or warnings.

- [ ] **Step 4: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/number-field && git add src/components/NumberField/ && git commit -m "feat(NumberField): recessed mono readout with ± steppers, drag, and type-to-edit

Design decisions:
- Single recessed well contains both stepper buttons and value display (one
  coherent hardware instrument, not three separate pieces)
- Readout div carries role=spinbutton; replaces itself with <input type=text>
  in edit mode (cleaner ARIA — no spinbutton wrapper around a textbox)
- PointerDown < 3px movement → click-to-edit; ≥3px → drag scrub
- Steppers use tabIndex=-1 + onPointerDown+preventDefault to stay out of the
  tab order and avoid blurring the spinbutton
- Shift modifier halves drag sensitivity and coarsens arrow-key step (step÷10)
- precision defaults are derived from step (step=1→0dp, step=0.1→1dp, etc.)
- data-editing accent ring on root mirrors the focus-visible ring so the well
  stays lit while the user types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
