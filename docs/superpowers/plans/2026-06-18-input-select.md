# InputSelect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `InputSelect` primitive — the track's audio-input picker — with two trigger variants (`field` and `chip`) sharing one themed dropdown, plus a reusable `ListboxPopover` that FXChip and ContextMenu can later adopt.

**Architecture:** Three files carry the weight: `ListboxPopover.tsx` (pure presentational listbox overlay + scroll-to-active), `InputSelect.tsx` (both trigger variants, all state — open/activeId/keyboard/outside-click), and their companion CSS modules. The `ListboxPopover` is deliberately uncoupled from "inputs" (it only knows `{ id, label }[]`) so it extracts cleanly when FXChip lands. The `field` trigger is a recessed full-row control (Fader-channel DNA); the `chip` trigger is a compact pill that sits in a track corner like the future FXChip. Both open the exact same listbox. Positioning is `position: absolute` under a `position: relative` root — no JS coordinate math needed in the gallery context.

**Tech Stack:** React 19 (`useId`, `useRef`, `useState`, `useEffect`), TypeScript 5 (strict), CSS Modules, Vitest 4 + @testing-library/react.

## Global Constraints

- Zero new runtime dependencies — no portal libraries, no floating-ui, no icon packages.
- CSS Modules only — no hardcoded colours, sizes, or durations; all via CSS custom properties from `global.css` / theme tokens.
- `prefers-reduced-motion`: `--dur-fast` is zeroed to `0ms` in `global.css` → dropdown open/close animation becomes instant, no extra CSS needed.
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` — TypeScript will reject unused imports/vars.
- File-size cap: no images, no heavy deps, no generated assets.
- Typecheck: `npx tsc --noEmit`. Lint: `npx tsc --noEmit` (no separate linter configured). Tests: `npx vitest run`.

---

## File Map

```
src/components/InputSelect/
  ListboxPopover.tsx        — presentational listbox overlay (no state, no outside-click)
  ListboxPopover.module.css — popover panel, option rows, selected check, active highlight
  InputSelect.tsx           — both trigger variants + all state management
  InputSelect.module.css    — field trigger, chip trigger, IN tag, caret, root container
  InputSelect.test.tsx      — full test suite (covers ListboxPopover via integration)
  InputSelect.demo.tsx      — states grid (both variants) + playground (Toggle dogfood)
  index.ts                  — barrel export
```

---

## Task 1: ListboxPopover — the shared themed dropdown

**Files:**
- Create: `src/components/InputSelect/ListboxPopover.tsx`
- Create: `src/components/InputSelect/ListboxPopover.module.css`

**Interfaces:**
- Produces:
  ```ts
  export interface ListboxOption { id: string; label: string }
  export interface ListboxPopoverProps {
    id: string             // goes on the listbox element; trigger sets aria-controls to this
    options: ListboxOption[]
    selectedId: string | null
    activeId: string | null   // keyboard-highlighted row (not yet selected)
    onSelect: (id: string) => void
  }
  export function ListboxPopover(props: ListboxPopoverProps): JSX.Element
  ```
- Consumed by: Task 2 (`InputSelect.tsx`)

---

- [ ] **Step 1: Write `ListboxPopover.tsx`**

Create `src/components/InputSelect/ListboxPopover.tsx`:

```tsx
// src/components/InputSelect/ListboxPopover.tsx
import { useEffect, useRef } from 'react'
import styles from './ListboxPopover.module.css'

export interface ListboxOption {
  id: string
  label: string
}

export interface ListboxPopoverProps {
  id: string
  options: ListboxOption[]
  selectedId: string | null
  activeId: string | null
  onSelect: (id: string) => void
}

export function ListboxPopover({ id, options, selectedId, activeId, onSelect }: ListboxPopoverProps) {
  const optionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (activeId) {
      optionRefs.current.get(activeId)?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeId])

  return (
    <div
      id={id}
      className={styles.popover}
      role="listbox"
      aria-activedescendant={activeId ? `${id}-${activeId}` : undefined}
    >
      {options.map(opt => (
        <div
          key={opt.id}
          id={`${id}-${opt.id}`}
          ref={el => {
            if (el) optionRefs.current.set(opt.id, el)
            else optionRefs.current.delete(opt.id)
          }}
          className={styles.option}
          role="option"
          aria-selected={opt.id === selectedId}
          data-active={opt.id === activeId || undefined}
          onMouseDown={e => {
            e.preventDefault()
            onSelect(opt.id)
          }}
        >
          <span className={styles.check} aria-hidden="true">✓</span>
          <span className={styles.label}>{opt.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `ListboxPopover.module.css`**

Create `src/components/InputSelect/ListboxPopover.module.css`:

```css
/* src/components/InputSelect/ListboxPopover.module.css */

/* ─── Popover panel ─────────────────────────────────────────────────────────── */

.popover {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  min-width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: var(--menu-bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  z-index: 100;
  padding: 4px 0;
  /* Open animation — zeroed by prefers-reduced-motion via --dur-fast */
  animation: popover-in var(--dur-fast) var(--ease-out) both;
}

@keyframes popover-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Option row ────────────────────────────────────────────────────────────── */

.option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  min-height: 28px;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  transition: background var(--dur-fast) var(--ease-out);
}

.option:hover,
.option[data-active] {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

/* ─── Check mark (column-stable: always present, invisible when unselected) ── */

.check {
  flex-shrink: 0;
  width: 14px;
  font-size: var(--text-xs);
  color: var(--accent);
  opacity: 0;
  line-height: 1;
}

.option[aria-selected="true"] .check {
  opacity: 1;
}

/* ─── Label text ────────────────────────────────────────────────────────────── */

.label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/InputSelect/ListboxPopover.tsx src/components/InputSelect/ListboxPopover.module.css
git commit -m "feat(InputSelect): add ListboxPopover — shared themed dropdown overlay"
```

---

## Task 2: InputSelect component + tests

**Files:**
- Create: `src/components/InputSelect/InputSelect.tsx`
- Create: `src/components/InputSelect/InputSelect.module.css`
- Create: `src/components/InputSelect/InputSelect.test.tsx`
- Create: `src/components/InputSelect/index.ts`

**Interfaces:**
- Consumes: `ListboxPopover`, `ListboxOption` from `./ListboxPopover`
- Produces:
  ```ts
  export type { ListboxOption as InputSelectOption }
  export interface InputSelectProps {
    value: string | null
    onChange: (id: string) => void
    options: ListboxOption[]
    variant?: 'field' | 'chip'   // default 'field'
    placeholder?: string          // default '—'
    size?: 'sm' | 'md'           // default 'md'
    disabled?: boolean
    showInTag?: boolean           // field variant only: shows "IN" silkscreen label
    'aria-label'?: string
    defaultOpen?: boolean         // gallery use only — opens on mount
  }
  export function InputSelect(props: InputSelectProps): JSX.Element
  ```

---

- [ ] **Step 1: Write the failing tests**

Create `src/components/InputSelect/InputSelect.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { InputSelect } from './InputSelect'

const OPTIONS = [
  { id: 'in-1', label: 'Input 1' },
  { id: 'in-2', label: 'Input 2' },
  { id: 'in-3', label: 'Input 3' },
]
const noop = vi.fn()

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('InputSelect rendering', () => {
  it('renders a button with aria-haspopup="listbox"', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.getByRole('button').getAttribute('aria-haspopup')).toBe('listbox')
  })

  it('aria-expanded="false" when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  })

  it('shows placeholder when value is null', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} placeholder="—" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows selected option label when value is set', () => {
    render(<InputSelect value="in-2" onChange={noop} options={OPTIONS} />)
    expect(screen.getByText('Input 2')).toBeInTheDocument()
  })

  it('data-variant="field" by default', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(container.firstChild).toHaveAttribute('data-variant', 'field')
  })

  it('data-variant="chip" when variant="chip"', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} variant="chip" />)
    expect(container.firstChild).toHaveAttribute('data-variant', 'chip')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<InputSelect value={null} onChange={noop} options={OPTIONS} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('button is disabled when disabled=true', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders "IN" tag when showInTag=true and variant="field"', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} showInTag />)
    expect(screen.getByText('IN')).toBeInTheDocument()
  })

  it('does not render "IN" tag when showInTag=false', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.queryByText('IN')).not.toBeInTheDocument()
  })

  it('listbox not rendered when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Open/close ──────────────────────────────────────────────────────────────

describe('InputSelect open/close', () => {
  it('clicking the button opens the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('aria-expanded="true" when open', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  })

  it('clicking the button again closes the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clicking outside closes the listbox', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <InputSelect value={null} onChange={noop} options={OPTIONS} />
      </div>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('disabled: clicking does not open the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('defaultOpen=true opens on mount', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} defaultOpen />)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

// ─── Listbox content ─────────────────────────────────────────────────────────

describe('InputSelect listbox content', () => {
  it('renders all options as role="option"', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} defaultOpen />)
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('selected option has aria-selected="true"', () => {
    render(<InputSelect value="in-2" onChange={noop} options={OPTIONS} defaultOpen />)
    const selected = screen.getByRole('option', { name: /Input 2/ })
    expect(selected.getAttribute('aria-selected')).toBe('true')
  })

  it('unselected options have aria-selected="false"', () => {
    render(<InputSelect value="in-2" onChange={noop} options={OPTIONS} defaultOpen />)
    const unselected = screen.getByRole('option', { name: /Input 1/ })
    expect(unselected.getAttribute('aria-selected')).toBe('false')
  })
})

// ─── Selection ───────────────────────────────────────────────────────────────

describe('InputSelect selection', () => {
  it('clicking an option calls onChange with its id', () => {
    const onChange = vi.fn()
    render(<InputSelect value={null} onChange={onChange} options={OPTIONS} defaultOpen />)
    fireEvent.mouseDown(screen.getByRole('option', { name: /Input 3/ }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('in-3')
  })

  it('selecting an option closes the listbox', () => {
    render(<InputSelect value={null} onChange={vi.fn()} options={OPTIONS} defaultOpen />)
    fireEvent.mouseDown(screen.getByRole('option', { name: /Input 1/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── Keyboard ────────────────────────────────────────────────────────────────

describe('InputSelect keyboard', () => {
  it('Enter opens the listbox when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Space opens the listbox when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('ArrowDown opens the listbox when closed', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Escape closes the listbox', () => {
    render(<InputSelect value={null} onChange={noop} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ArrowDown moves active option down', () => {
    render(<InputSelect value="in-1" onChange={noop} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    const opts = screen.getAllByRole('option')
    expect(opts[1]).toHaveAttribute('data-active')
  })

  it('Enter selects the active option and closes', () => {
    const onChange = vi.fn()
    render(<InputSelect value="in-1" onChange={onChange} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('in-2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ArrowUp moves active option up', () => {
    render(<InputSelect value="in-3" onChange={noop} options={OPTIONS} defaultOpen />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowUp' })
    const opts = screen.getAllByRole('option')
    expect(opts[2]).toHaveAttribute('data-active')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/InputSelect/InputSelect.test.tsx
```

Expected: FAIL — `InputSelect` not found.

- [ ] **Step 3: Write `InputSelect.tsx`**

Create `src/components/InputSelect/InputSelect.tsx`:

```tsx
// src/components/InputSelect/InputSelect.tsx
import { useEffect, useId, useRef, useState } from 'react'
import styles from './InputSelect.module.css'
import { ListboxPopover } from './ListboxPopover'
import type { ListboxOption } from './ListboxPopover'

export type { ListboxOption as InputSelectOption }

export interface InputSelectProps {
  value: string | null
  onChange: (id: string) => void
  options: ListboxOption[]
  variant?: 'field' | 'chip'
  placeholder?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  showInTag?: boolean
  'aria-label'?: string
  defaultOpen?: boolean
}

export function InputSelect({
  value,
  onChange,
  options,
  variant = 'field',
  placeholder = '—',
  size = 'md',
  disabled,
  showInTag,
  'aria-label': ariaLabel = 'Input select',
  defaultOpen = false,
}: InputSelectProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [activeId, setActiveId] = useState<string | null>(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const selectedOption = options.find(o => o.id === value) ?? null
  const displayLabel = selectedOption?.label ?? placeholder

  function openMenu() {
    if (disabled) return
    setActiveId(value)
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleSelect(id: string) {
    onChange(id)
    closeMenu()
  }

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        openMenu()
      }
      return
    }
    const idx = options.findIndex(o => o.id === activeId)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveId(options[Math.min(idx + 1, options.length - 1)]?.id ?? activeId)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveId(options[Math.max(idx - 1, 0)]?.id ?? activeId)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeId) handleSelect(activeId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
    }
  }

  const triggerClass = variant === 'chip' ? styles.chip : styles.field

  return (
    <div
      ref={containerRef}
      className={styles.root}
      data-variant={variant}
      data-size={size}
      data-open={open || undefined}
    >
      <button
        ref={triggerRef}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={open ? closeMenu : openMenu}
        onKeyDown={handleKeyDown}
      >
        {variant === 'field' && showInTag && (
          <span className={styles.inTag} aria-hidden="true">IN</span>
        )}
        <span className={styles.displayLabel} data-muted={!selectedOption || undefined}>
          {displayLabel}
        </span>
        <span className={styles.caret} aria-hidden="true">▾</span>
      </button>
      {open && (
        <ListboxPopover
          id={listboxId}
          options={options}
          selectedId={value}
          activeId={activeId}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `InputSelect.module.css`**

Create `src/components/InputSelect/InputSelect.module.css`:

```css
/* src/components/InputSelect/InputSelect.module.css */

/* ─── Root (positioning context for the absolute popover) ──────────────────── */

.root {
  position: relative;
  display: inline-flex;
  flex-direction: column;
}

/* ─── Field trigger — recessed full-row control ────────────────────────────── */

/*
  Shares the "recessed well" visual language with Fader's channel: --stage background,
  deep inset shadow, --border ring. Accent border lights up on focus/open.
*/

.field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 0 var(--space-2);
  background: var(--stage);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  transition: border-color var(--dur-fast) var(--ease-out);
}

.root[data-size="md"] .field { min-height: 28px; }
.root[data-size="sm"] .field { min-height: 24px; }

.field:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.field:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.field:focus-visible {
  border-color: var(--accent);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 1px var(--accent);
  outline: none;
}

/* Accent border while open — matches focus-visible ring */
.root[data-open] .field {
  border-color: var(--accent);
}

/* ─── "IN" silkscreen tag ──────────────────────────────────────────────────── */

/*
  Space Mono (--font-mono) with tight tracked uppercase = the silkscreen label look.
  Separator hairline keeps it visually distinct from the label text.
*/

.inTag {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  flex-shrink: 0;
  padding-right: var(--space-2);
  border-right: 1px solid var(--border);
  line-height: 1;
}

/* ─── Display label (selected value or placeholder) ────────────────────────── */

.displayLabel {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  line-height: 1;
}

.displayLabel[data-muted] {
  color: var(--text-dim);
}

/* ─── Dropdown caret ───────────────────────────────────────────────────────── */

.caret {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
  color: var(--text-dim);
  transition: transform var(--dur-fast) var(--ease-out);
}

.root[data-open] .caret {
  transform: rotate(180deg);
}

/* ─── Chip trigger — compact pill (FX chip sibling) ───────────────────────── */

/*
  Mirror FXChip's look: --surface-2 base, 999px pill radius, muted text.
  Accent outline on focus; accent border while open.
*/

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    background   var(--dur-fast) var(--ease-out);
}

.chip:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.chip:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: color-mix(in srgb, var(--surface-2) 80%, var(--border));
}

.chip:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
}

.root[data-open] .chip {
  border-color: var(--accent);
}
```

- [ ] **Step 5: Write `index.ts`**

Create `src/components/InputSelect/index.ts`:

```ts
// src/components/InputSelect/index.ts
export { InputSelect } from './InputSelect'
export type { InputSelectProps, InputSelectOption } from './InputSelect'
```

- [ ] **Step 6: Run tests — all should pass**

```bash
npx vitest run src/components/InputSelect/InputSelect.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/InputSelect/InputSelect.tsx src/components/InputSelect/InputSelect.module.css src/components/InputSelect/InputSelect.test.tsx src/components/InputSelect/index.ts
git commit -m "feat(InputSelect): field + chip triggers with shared listbox, full a11y + keyboard"
```

---

## Task 3: Demo + planned.ts cleanup

**Files:**
- Create: `src/components/InputSelect/InputSelect.demo.tsx`
- Modify: `src/gallery/planned.ts` — remove the `InputSelect` entry

**Interfaces:**
- Consumes: `InputSelect`, `InputSelectOption` from `./InputSelect`; `Toggle` from `../Toggle`; `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery UI

---

- [ ] **Step 1: Write `InputSelect.demo.tsx`**

Create `src/components/InputSelect/InputSelect.demo.tsx`:

```tsx
// src/components/InputSelect/InputSelect.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { InputSelect } from './InputSelect'
import type { InputSelectOption } from './InputSelect'

export const meta: DemoMeta = {
  name: 'InputSelect',
  group: 'Primitives',
  route: '/input-select',
  order: 7,
}

const BASIC_OPTIONS: InputSelectOption[] = [
  { id: 'in-1', label: 'Input 1' },
  { id: 'in-2', label: 'Input 2' },
  { id: 'in-3', label: 'Input 3 (Guitar)' },
  { id: 'in-4', label: 'Input 4' },
]

const LONG_OPTIONS: InputSelectOption[] = Array.from({ length: 16 }, (_, i) => ({
  id: `in-${i + 1}`,
  label: i === 0 ? 'Input 1 (Vocal mic)' : `Input ${i + 1}`,
}))

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      {/* ── field variant column ── */}
      <State label="field · empty">
        <div style={{ width: 180 }}>
          <InputSelect value={null} onChange={noop} options={BASIC_OPTIONS} />
        </div>
      </State>
      <State label="field · selected">
        <div style={{ width: 180 }}>
          <InputSelect value="in-3" onChange={noop} options={BASIC_OPTIONS} />
        </div>
      </State>
      <State label="field · IN tag">
        <div style={{ width: 180 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} showInTag />
        </div>
      </State>
      <State label="field · open">
        <div style={{ width: 180, paddingBottom: 140 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} defaultOpen />
        </div>
      </State>
      <State label="field · sm">
        <div style={{ width: 160 }}>
          <InputSelect value="in-2" onChange={noop} options={BASIC_OPTIONS} size="sm" />
        </div>
      </State>
      <State label="field · disabled">
        <div style={{ width: 180 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} disabled />
        </div>
      </State>
      <State label="field · long list">
        <div style={{ width: 180, paddingBottom: 220 }}>
          <InputSelect value="in-1" onChange={noop} options={LONG_OPTIONS} defaultOpen />
        </div>
      </State>
      <State label="field · focus">
        <div style={{ width: 180 }}>
          <InputSelect value={null} onChange={noop} options={BASIC_OPTIONS} aria-label="Focus demo" />
        </div>
      </State>

      {/* ── chip variant column ── */}
      <State label="chip · empty">
        <InputSelect value={null} onChange={noop} options={BASIC_OPTIONS} variant="chip" />
      </State>
      <State label="chip · selected">
        <InputSelect value="in-3" onChange={noop} options={BASIC_OPTIONS} variant="chip" />
      </State>
      <State label="chip · open">
        <div style={{ paddingBottom: 140 }}>
          <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} variant="chip" defaultOpen />
        </div>
      </State>
      <State label="chip · disabled">
        <InputSelect value="in-1" onChange={noop} options={BASIC_OPTIONS} variant="chip" disabled />
      </State>

      {/* ── chip in mock track corner (FX chip sibling) ── */}
      <State label="chip in track corner">
        <div
          style={{
            width: 200,
            height: 36,
            background: 'var(--strip-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-1)',
            padding: '0 var(--space-2)',
            paddingBottom: 80,
          }}
        >
          {/* Fake FX chip for sibling comparison */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            REVERB
          </div>
          <InputSelect value="in-2" onChange={noop} options={BASIC_OPTIONS} variant="chip" aria-label="Audio input" />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState<string | null>('in-1')
  const [variant, setVariant] = useState<'field' | 'chip'>('field')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)
  const [showInTag, setShowInTag] = useState(false)
  const [optionCount, setOptionCount] = useState(4)

  const options = LONG_OPTIONS.slice(0, optionCount)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live instance */}
        <div style={{ minWidth: 200 }}>
          <InputSelect
            value={value}
            onChange={v => setValue(v)}
            options={options}
            variant={variant}
            size={size}
            disabled={disabled}
            showInTag={showInTag}
            aria-label="Playground input select"
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={variant === 'chip'}
            onChange={next => setVariant(next ? 'chip' : 'field')}
            size="sm"
            label="variant=chip"
          />
          <Toggle
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size=sm"
          />
          <Toggle
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          <Toggle
            checked={showInTag}
            onChange={setShowInTag}
            size="sm"
            label="showInTag (field only)"
          />
          <Toggle
            checked={value === null}
            onChange={next => setValue(next ? null : 'in-1')}
            size="sm"
            label="no selection (placeholder)"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            options
            <input
              type="range"
              min={1}
              max={16}
              value={optionCount}
              onChange={e => setOptionCount(Number(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{optionCount}</span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function InputSelectDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Remove `InputSelect` from `planned.ts`**

Open `src/gallery/planned.ts`. Remove the line:

```ts
  { name: 'InputSelect',              group: 'Primitives',  route: '/input-select' },
```

(The component now auto-appears via `import.meta.glob` from its `.demo.tsx` file.)

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS, zero failures.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/InputSelect/InputSelect.demo.tsx src/gallery/planned.ts
git commit -m "feat(InputSelect): gallery demo — states grid (field + chip + track corner) + playground"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task covering it |
|---|---|
| Two trigger variants: `field` (full-row recessed field) | Task 2 — `InputSelect.tsx` + `.field` CSS |
| Two trigger variants: `chip` (compact pill, FX sibling) | Task 2 — `InputSelect.tsx` + `.chip` CSS |
| Custom listbox (button + popover, not native `<select>`) | Task 1 + Task 2 |
| `field`: optional leading "IN" tag (silkscreen, tracked) | Task 2 — `showInTag` + `.inTag` |
| `field`: recessed `--surface-2`/`--stage` inset | Task 2 — `.field` uses `var(--stage)` + inset shadow |
| `chip`: pill sized like FXChip top-right corner | Task 2 — `.chip` CSS; Task 3 — "chip in track corner" state |
| Popover: anchored under trigger on panel/stage surface | Task 1 — `position: absolute; top: 100% + 2px` |
| Popover: selected row marked (check / accent bar) | Task 1 — `.check` opacity + `.option[aria-selected]` |
| Popover: hovered/active row accent-highlighted | Task 1 — `.option[data-active]` + `.option:hover` |
| Popover: fast open transition | Task 1 — `animation: popover-in var(--dur-fast)` |
| `prefers-reduced-motion` → instant | Task 1 — implicit (`--dur-fast` zeroed in `global.css`) |
| Closes on select | Task 2 — `handleSelect` calls `closeMenu()` |
| Closes on outside-click | Task 2 — `document mousedown` listener |
| Closes on Esc | Task 2 — `handleKeyDown` Escape branch |
| Empty placeholder `—` in `--muted` | Task 2 — `displayLabel[data-muted]` → `var(--text-dim)` |
| Disabled: dimmed, not openable | Task 2 — `disabled` prop; `:disabled` CSS |
| Props: `value`, `onChange`, `options` | Task 2 — props interface |
| Props: `variant`, `placeholder`, `size`, `disabled`, `showInTag`, `aria-label` | Task 2 — props interface |
| Keyboard: Enter/Space/↓ opens | Task 2 — `handleKeyDown` closed branch |
| Keyboard: ↑/↓ move active option | Task 2 — `handleKeyDown` open branch |
| Keyboard: Enter selects, Esc closes | Task 2 — `handleKeyDown` open branch |
| Focus returns to trigger on close | Task 2 — `closeMenu` calls `triggerRef.current?.focus()` |
| Long lists scroll in popover | Task 1 — `max-height: 200px; overflow-y: auto` |
| Active option stays in view | Task 1 — `scrollIntoView({ block: 'nearest' })` |
| `aria-haspopup="listbox"` + `aria-expanded` | Task 2 — button attributes |
| `role="listbox"` + `role="option"` + `aria-selected` | Task 1 — `ListboxPopover` |
| `:focus-visible` only | Task 2 — `:focus-visible` rules in CSS |
| Demo: both variants side by side | Task 3 — `StatesDemo` |
| Demo: chip in mock track corner next to fake FX chip | Task 3 — "chip in track corner" state |
| Demo: selected, empty, open, disabled, sm, focus, long list, IN tag | Task 3 — `StatesGrid` states |
| Playground: Toggle dogfood | Task 3 — `PlaygroundDemo` uses `Toggle` |
| Playground: vary option count | Task 3 — range slider changes `optionCount` |
| Dropdown structured to extract for FXChip + ContextMenu | Task 1 — `ListboxPopover` uncoupled from "inputs" |
| Reskins across themes (Compare) | CSS vars only — no hardcoded colours |
| `typecheck` / `lint` / `test` green | Task 2 Step 7 + Task 3 Steps 3–4 |

### Placeholder scan

No "TBD", "TODO", or "implement later" present. All code blocks are complete.

### Type consistency

- `ListboxOption` defined in `ListboxPopover.tsx`, re-exported from `InputSelect.tsx` as `InputSelectOption`
- `ListboxPopoverProps.onSelect: (id: string) => void` matches `InputSelect`'s `handleSelect(id: string)`
- `activeId: string | null` flows from `InputSelect` state → `ListboxPopover` prop → `data-active` attr and `aria-activedescendant`
- Tests use `screen.getAllByRole('option')` — matches `role="option"` in `ListboxPopover`
- Tests use `fireEvent.mouseDown` for option click (matches `onMouseDown` handler in `ListboxPopover`)
