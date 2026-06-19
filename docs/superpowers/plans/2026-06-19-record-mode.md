# RecordMode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `RecordMode` — a global Record button (idle/armed/recording, red LED family) paired with a 2-mode menu (Normal / Loop-punch) that reuses `ContextMenu` on the dark `--stage` surface.

**Architecture:** A single composite component renders a record `<button>` and a caret `<button>` in a flex row; the caret opens a point-anchored `ContextMenu` with two `menuitemradio` items. `ContextMenu` receives a minimal additive extension (`role?: 'menuitemradio'` on `MenuItem`) to support radio semantics without touching existing behaviour.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + @testing-library/react, @phosphor-icons/react

## Global Constraints

- Tokens only — no hardcoded colours; all design tokens from `ThemeTokens` (`--led-red`, `--led-red-deep`, `--stage`, `--stage-2`, `--text`, `--text-dim`, `--border`, `--radius`, `--space-1`, `--dur-led-on`, `--dur-led-off`, `--ease-out`, `--dur-base`)
- CSS Modules only — no inline styles in components, no Tailwind
- One Phosphor icon weight — no `weight` prop on icons; use default weight throughout
- `size` prop supports `'sm' | 'md'` only
- `typecheck` / `lint` / `test` must be green after every commit
- File-size cap: keep files focused; no monoliths

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/ContextMenu/ContextMenu.tsx` | **Modify** | Add `role?: 'menuitemradio'` to `MenuItem`; update render logic |
| `src/components/ContextMenu/ContextMenu.test.tsx` | **Modify** | Add regression tests for `menuitemradio` field |
| `src/components/RecordMode/RecordMode.tsx` | **Create** | Component: record button + caret button + ContextMenu wiring |
| `src/components/RecordMode/RecordMode.module.css` | **Create** | All visual states (idle/armed/recording, bloom animation, badge, caret) |
| `src/components/RecordMode/RecordMode.test.tsx` | **Create** | Tests 1–19 (spec §Tests) |
| `src/components/RecordMode/RecordMode.demo.tsx` | **Create** | StatesGrid + PlaygroundDemo |
| `src/components/RecordMode/index.ts` | **Create** | Barrel export |

---

## Task 1: ContextMenu — menuitemradio support

**Files:**
- Modify: `src/components/ContextMenu/ContextMenu.tsx`
- Modify: `src/components/ContextMenu/ContextMenu.test.tsx`

**Interfaces:**
- Produces: `MenuItem.role?: 'menuitemradio'` field — RecordMode uses this in Task 3

---

- [ ] **Step 1: Write the failing tests**

Append this `describe` block to the end of `src/components/ContextMenu/ContextMenu.test.tsx`:

```tsx
describe('ContextMenu — menuitemradio extension', () => {
  it('item with role="menuitemradio" renders as menuitemradio', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'Normal',     role: 'menuitemradio', checked: true  },
      { id: 'b', label: 'Loop/punch', role: 'menuitemradio', checked: false },
    ]
    render(<ContextMenu {...BASE} items={items} />)
    const radios = screen.getAllByRole('menuitemradio')
    expect(radios).toHaveLength(2)
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('existing items without role field are unaffected', () => {
    // Regular item still menuitem
    render(<ContextMenu {...BASE} items={[{ id: 'x', label: 'Cut' }]} />)
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeInTheDocument()

    // Checked item without role field still menuitemcheckbox
    render(<ContextMenu
      {...BASE}
      items={[{ id: 'y', label: 'Show Grid', checked: true }]}
    />)
    expect(screen.getByRole('menuitemcheckbox', { name: 'Show Grid' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx vitest run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: the two new tests FAIL (ContextMenu has no `role` field yet); all existing tests PASS.

- [ ] **Step 3: Add `role` to `MenuItem` in ContextMenu.tsx**

In `src/components/ContextMenu/ContextMenu.tsx`, add the field to the `MenuItem` interface after `checked?`:

```ts
role?: 'menuitemradio'
```

So the interface becomes:

```ts
export interface MenuItem {
  id:        string
  label:     string
  icon?:     React.ReactNode
  shortcut?: string
  disabled?: boolean
  checked?:  boolean
  role?:     'menuitemradio'   // ← add this line
  danger?:   boolean
  onSelect?: () => void
  submenu?:  MenuEntry[]
}
```

- [ ] **Step 4: Update the render logic in ContextMenu.tsx**

Find this line in the `<li>` render (inside the `items.map`):

```tsx
role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
```

Replace it with:

```tsx
role={entry.role ?? (entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem')}
```

- [ ] **Step 5: Run all ContextMenu tests to confirm they pass**

```bash
npx vitest run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: all tests PASS including the two new ones.

- [ ] **Step 6: Typecheck + lint**

```bash
npx tsc --noEmit && npx eslint src/components/ContextMenu/ContextMenu.tsx src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ContextMenu/ContextMenu.tsx src/components/ContextMenu/ContextMenu.test.tsx
git commit -m "feat(ContextMenu): add opt-in menuitemradio role to MenuItem"
```

---

## Task 2: RecordMode — record button

Build the record button, label resolution, loop-punch badge, and all visual CSS states. No caret or menu yet — those come in Task 3.

**Files:**
- Create: `src/components/RecordMode/RecordMode.tsx`
- Create: `src/components/RecordMode/RecordMode.module.css`
- Create: `src/components/RecordMode/RecordMode.test.tsx`
- Create: `src/components/RecordMode/index.ts`

**Interfaces:**
- Consumes: nothing from Task 1 yet (menu is Task 3)
- Produces: `RecordMode`, `RecordModeProps`, `RecordModeState`, `RecordModeValue` — used by Task 3 and Task 4

---

- [ ] **Step 1: Create the barrel export**

Create `src/components/RecordMode/index.ts`:

```ts
export { RecordMode } from './RecordMode'
export type { RecordModeProps } from './RecordMode'
```

- [ ] **Step 2: Write the failing tests (tests 1–8)**

Create `src/components/RecordMode/RecordMode.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordMode } from './RecordMode'

const noop = vi.fn()
beforeEach(() => vi.clearAllMocks())

const BASE = {
  state:          'idle'   as const,
  mode:           'normal' as const,
  onToggleRecord: noop,
  onSelectMode:   noop,
}

describe('RecordMode — record button', () => {
  it('renders without crash', () => {
    render(<RecordMode {...BASE} />)
    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument()
  })

  it('idle + normal: aria-pressed=false, no badge, label="Record"', () => {
    render(<RecordMode {...BASE} state="idle" mode="normal" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('[data-testid="record-loop-badge"]')).not.toBeInTheDocument()
  })

  it('armed: aria-pressed=true, label="Record"', () => {
    render(<RecordMode {...BASE} state="armed" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('recording: aria-pressed=true, label="Recording"', () => {
    render(<RecordMode {...BASE} state="recording" />)
    const btn = screen.getByRole('button', { name: 'Recording' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('loop-punch mode: badge rendered, label includes "(loop-punch)"', () => {
    render(<RecordMode {...BASE} mode="loop-punch" />)
    expect(screen.getByRole('button', { name: 'Record (loop-punch)' })).toBeInTheDocument()
    expect(document.querySelector('[data-testid="record-loop-badge"]')).toBeInTheDocument()
  })

  it('normal mode: no badge rendered', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    expect(document.querySelector('[data-testid="record-loop-badge"]')).not.toBeInTheDocument()
  })

  it('recording + loop-punch: label="Recording (loop-punch)"', () => {
    render(<RecordMode {...BASE} state="recording" mode="loop-punch" />)
    expect(screen.getByRole('button', { name: 'Recording (loop-punch)' })).toBeInTheDocument()
  })

  it('record button click fires onToggleRecord', () => {
    const onToggleRecord = vi.fn()
    render(<RecordMode {...BASE} onToggleRecord={onToggleRecord} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    expect(onToggleRecord).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npx vitest run src/components/RecordMode/RecordMode.test.tsx
```

Expected: all 8 tests FAIL (module doesn't exist yet).

- [ ] **Step 4: Create RecordMode.tsx (record button only)**

Create `src/components/RecordMode/RecordMode.tsx`:

```tsx
// src/components/RecordMode/RecordMode.tsx
import { useRef, useState } from 'react'
import { Record, ArrowsClockwise, CaretDown } from '@phosphor-icons/react'
import styles from './RecordMode.module.css'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'

export type RecordModeState = 'idle' | 'armed' | 'recording'
export type RecordModeValue = 'normal' | 'loop-punch'

export interface RecordModeProps {
  state:           RecordModeState
  mode:            RecordModeValue
  onToggleRecord:  (e: React.MouseEvent<HTMLButtonElement>) => void
  onSelectMode:    (mode: RecordModeValue) => void
  size?:           'sm' | 'md'
  disabled?:       boolean
  'aria-label'?:   string
}

const ICON_SIZE:  Record<'sm' | 'md', number> = { sm: 16, md: 20 }
const CARET_SIZE: Record<'sm' | 'md', number> = { sm: 10, md: 12 }
const BADGE_SIZE: Record<'sm' | 'md', number> = { sm: 6,  md: 8  }

function resolveLabel(
  state:    RecordModeState,
  mode:     RecordModeValue,
  override: string | undefined,
): string {
  if (override) return override
  const base   = state === 'recording' ? 'Recording' : 'Record'
  const suffix = mode  === 'loop-punch' ? ' (loop-punch)' : ''
  return base + suffix
}

export function RecordMode({
  state,
  mode,
  onToggleRecord,
  onSelectMode,
  size     = 'md',
  disabled,
  'aria-label': ariaLabel,
}: RecordModeProps) {
  const caretRef       = useRef<HTMLButtonElement>(null)
  const closeTimeRef   = useRef(0)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [menuPos,  setMenuPos]    = useState({ x: 0, y: 0 })

  const label     = resolveLabel(state, mode, ariaLabel)
  const iconSize  = ICON_SIZE[size]
  const caretSize = CARET_SIZE[size]
  const badgeSize = BADGE_SIZE[size]

  function openMenu() {
    // Guard: if the Popover's outside-click mousedown fired on the caret just
    // before this click event, closeMenu() set closeTimeRef — skip the reopen.
    // 300 ms is well beyond the mousedown→click window (<100 ms).
    if (Date.now() - closeTimeRef.current < 300) return
    caretRef.current?.focus() // WebKit: mouse click doesn't focus <button>
    const rect = caretRef.current!.getBoundingClientRect()
    setMenuPos({ x: rect.left, y: rect.bottom + 2 })
    setMenuOpen(true)
  }

  function closeMenu() {
    closeTimeRef.current = Date.now()
    setMenuOpen(false)
  }

  const menuItems: MenuEntry[] = [
    {
      id:       'normal',
      label:    'Normal',
      role:     'menuitemradio',
      checked:  mode === 'normal',
      onSelect: () => onSelectMode('normal'),
    },
    {
      id:       'loop-punch',
      label:    'Loop / punch',
      role:     'menuitemradio',
      checked:  mode === 'loop-punch',
      onSelect: () => onSelectMode('loop-punch'),
    },
  ]

  return (
    <div className={styles.root} data-size={size}>
      <button
        className={styles.recordBtn}
        data-state={state}
        data-size={size}
        aria-pressed={state !== 'idle'}
        aria-label={label}
        disabled={disabled}
        onClick={onToggleRecord}
      >
        <Record aria-hidden size={iconSize} />
        {mode === 'loop-punch' && (
          <span className={styles.badge} data-testid="record-loop-badge" aria-hidden>
            <ArrowsClockwise size={badgeSize} />
          </span>
        )}
      </button>
      <button
        ref={caretRef}
        className={styles.caret}
        data-size={size}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Record mode"
        disabled={disabled}
        onClick={openMenu}
      >
        <CaretDown aria-hidden size={caretSize} />
      </button>
      {menuOpen && (
        <ContextMenu
          items={menuItems}
          open
          x={menuPos.x}
          y={menuPos.y}
          onClose={closeMenu}
          aria-label="Record mode"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create RecordMode.module.css**

Create `src/components/RecordMode/RecordMode.module.css`:

```css
/* src/components/RecordMode/RecordMode.module.css */

/*
  --_rec-glow-base / --_rec-glow-peak are scoped to .recordBtn so the static
  [data-state="recording"] box-shadow and @keyframes 0%/100% share the exact
  same value — no visual jump when the pulse animation starts.
  --_rec-glow-peak drives the 50% keyframe and the reduced-motion steady state.
*/

/* ─── Root (flex row) ──────────────────────────────────────────────────────── */

.root {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

/* ─── Record button ────────────────────────────────────────────────────────── */

.recordBtn {
  --_rec-glow-base:
    0 0 0 2px var(--led-red),
    0 0 8px 3px color-mix(in srgb, var(--led-red) 40%, transparent);
  --_rec-glow-peak:
    0 0 0 2px var(--led-red),
    0 0 16px 6px color-mix(in srgb, var(--led-red) 60%, transparent),
    0 0 28px 10px color-mix(in srgb, var(--led-red) 25%, transparent);

  position: relative;
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

  /* Idle: recessed well, dim ring, warm-red icon */
  background-color: var(--stage);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 0 1.5px var(--text-dim);
  color: var(--led-red);

  /* Slow decay — incandescent off */
  transition:
    background-color var(--dur-led-off) var(--ease-out),
    box-shadow       var(--dur-led-off) var(--ease-out),
    color            var(--dur-led-off) var(--ease-out);
}

/* ─── Record button sizes ──────────────────────────────────────────────────── */

.recordBtn[data-size="md"] { width: 36px; height: 36px; }
.recordBtn[data-size="sm"] { width: 28px; height: 28px; }

/* ─── Armed: matte-red fill, 2 px red ring, white icon — "ready" ───────────── */

/*
  Flat matte-red surface. The icon switches to --text (white) to contrast against
  the deep-red fill. No outer glow — the bloom only activates at recording.
  Armed vs recording: matte flat vs bloom pulsing.
*/
.recordBtn[data-state="armed"] {
  background-color: var(--led-red-deep);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 2px var(--led-red);
  color: var(--text);
  /* Fast attack — overrides decay from base rule */
  transition:
    background-color var(--dur-led-on) var(--ease-out),
    box-shadow       var(--dur-led-on) var(--ease-out),
    color            var(--dur-led-on) var(--ease-out);
}

/* ─── Recording: same fill + pulsing bloom — "rolling" ─────────────────────── */

/*
  @keyframes 0%/100% box-shadow = this rule's static value — no jump on start.
  Armed→recording: the 2 px ring in --_rec-glow-base matches the armed ring,
  so the transition adds the outer glow smoothly without the ring flickering.
*/
.recordBtn[data-state="recording"] {
  background-color: var(--led-red-deep);
  box-shadow: var(--_rec-glow-base);
  color: var(--text);
  animation: rec-btn-pulse 2s ease-in-out infinite;
  transition:
    background-color var(--dur-led-on) var(--ease-out),
    box-shadow       var(--dur-led-on) var(--ease-out),
    color            var(--dur-led-on) var(--ease-out);
}

@keyframes rec-btn-pulse {
  0%, 100% { box-shadow: var(--_rec-glow-base); }
  50%       { box-shadow: var(--_rec-glow-peak); }
}

@media (prefers-reduced-motion: reduce) {
  .recordBtn[data-state="recording"] {
    animation: none;
    /* Hold peak bloom — the bloom (not the pulse) is the armed vs recording signal */
    box-shadow: var(--_rec-glow-peak);
  }
}

/* ─── Hover ────────────────────────────────────────────────────────────────── */

.recordBtn:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* ─── Pressed ──────────────────────────────────────────────────────────────── */

.recordBtn:active:not(:disabled) {
  transform: translateY(1px);
}

/* Preserve red context during press (specificity: 0,3,0 beats [data-state] 0,2,0) */
.recordBtn[data-state="armed"]:active:not(:disabled) {
  background-color: color-mix(in srgb, var(--led-red-deep) 90%, black);
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    0 0 0 2px var(--led-red);
  color: var(--text);
}

.recordBtn[data-state="recording"]:active:not(:disabled) {
  background-color: color-mix(in srgb, var(--led-red-deep) 90%, black);
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.3),
    var(--_rec-glow-base);
  color: var(--text);
}

/* ─── Disabled ─────────────────────────────────────────────────────────────── */

.recordBtn:disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Focus ring — record-red identity ────────────────────────────────────── */

.recordBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--led-red) 70%, transparent);
  outline-offset: 2px;
}

/* ─── Loop-punch badge ─────────────────────────────────────────────────────── */

/*
  Visible only when mode=loop-punch (rendered conditionally in TSX).
  --text (near-white) contrasts on both the dark idle background and the red
  armed/recording fill. aria-hidden; mode is communicated via aria-label.
*/
.badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--text);
  line-height: 1;
}

/* ─── Caret button ─────────────────────────────────────────────────────────── */

.caret {
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

  transition:
    background-color var(--dur-base) var(--ease-out),
    box-shadow       var(--dur-base) var(--ease-out);
}

.caret[data-size="md"] { width: 20px; height: 36px; }
.caret[data-size="sm"] { width: 16px; height: 28px; }

.caret:hover:not(:disabled) {
  background-color: var(--stage-2);
}

.caret:active:not(:disabled) {
  transform: translateY(1px);
}

.caret:disabled {
  pointer-events: none;
  opacity: 0.4;
}

.caret:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--led-red) 70%, transparent);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Run tests 1–8 to confirm they pass**

```bash
npx vitest run src/components/RecordMode/RecordMode.test.tsx
```

Expected: all 8 tests PASS.

- [ ] **Step 7: Typecheck + lint**

```bash
npx tsc --noEmit && npx eslint src/components/RecordMode/RecordMode.tsx src/components/RecordMode/RecordMode.module.css
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/RecordMode/
git commit -m "feat(RecordMode): record button — idle/armed/recording states, red LED bloom, loop-punch badge"
```

---

## Task 3: RecordMode — caret + mode menu

**Note:** The RecordMode.tsx from Task 2 already contains the full component including the caret and ContextMenu. This task adds the tests for that wiring (tests 9–19) and verifies everything passes. If during implementation you discover the caret or menu behaviour doesn't match, fix it in RecordMode.tsx now.

**Files:**
- Modify: `src/components/RecordMode/RecordMode.test.tsx`

**Interfaces:**
- Consumes: `MenuItem.role` from Task 1; `RecordMode` from Task 2

---

- [ ] **Step 1: Write the failing tests (tests 9–19)**

Append to `src/components/RecordMode/RecordMode.test.tsx`:

```tsx
describe('RecordMode — caret + mode menu', () => {
  it('caret click opens the menu and caret is focused', () => {
    render(<RecordMode {...BASE} />)
    const caret = screen.getByRole('button', { name: 'Record mode' })
    fireEvent.click(caret)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(caret).toHaveAttribute('aria-expanded', 'true')
    // caret.focus() is called in openMenu — verify caret is focused
    expect(document.activeElement).toBe(caret)
  })

  it('Escape closes the menu and returns focus to the caret', () => {
    render(<RecordMode {...BASE} />)
    const caret = screen.getByRole('button', { name: 'Record mode' })
    fireEvent.click(caret)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(caret)
  })

  it('selecting an item closes the menu and returns focus to the caret', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    const caret = screen.getByRole('button', { name: 'Record mode' })
    fireEvent.click(caret)
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(caret)
  })

  // NOTE: Tests 9–11 rely on jsdom focusing buttons on click (Chrome behaviour).
  // They guard general focus-return but cannot reproduce the WebKit "click
  // doesn't focus a button" quirk. The WebKit fix lives in the explicit
  // `caretRef.current?.focus()` call in openMenu() — verify it in a real browser.

  it('"Normal" click fires onSelectMode("normal") and closes menu', () => {
    const onSelectMode = vi.fn()
    render(<RecordMode {...BASE} mode="loop-punch" onSelectMode={onSelectMode} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Normal' }))
    expect(onSelectMode).toHaveBeenCalledWith('normal')
    expect(onSelectMode).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('"Loop / punch" click fires onSelectMode("loop-punch") and closes menu', () => {
    const onSelectMode = vi.fn()
    render(<RecordMode {...BASE} mode="normal" onSelectMode={onSelectMode} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
    expect(onSelectMode).toHaveBeenCalledWith('loop-punch')
    expect(onSelectMode).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('mode=normal: "Normal" is aria-checked=true, "Loop / punch" is aria-checked=false', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.getByRole('menuitemradio', { name: 'Normal' }))
      .toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
      .toHaveAttribute('aria-checked', 'false')
  })

  it('mode=loop-punch: "Loop / punch" is aria-checked=true, "Normal" is aria-checked=false', () => {
    render(<RecordMode {...BASE} mode="loop-punch" />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
      .toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Normal' }))
      .toHaveAttribute('aria-checked', 'false')
  })

  it('disabled=true: both buttons have disabled attribute', () => {
    render(<RecordMode {...BASE} disabled />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('disabled=true: caret click does NOT open the menu', () => {
    render(<RecordMode {...BASE} disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('disabled=true: record button click does NOT fire onToggleRecord', () => {
    const onToggleRecord = vi.fn()
    render(<RecordMode {...BASE} disabled onToggleRecord={onToggleRecord} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    expect(onToggleRecord).not.toHaveBeenCalled()
  })

  it('size=sm applies data-size=sm on container', () => {
    const { container } = render(<RecordMode {...BASE} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })
})
```

- [ ] **Step 2: Run the new tests to confirm they fail (or partially pass)**

```bash
npx vitest run src/components/RecordMode/RecordMode.test.tsx
```

Expected: tests 1–8 PASS. Tests 9–19 may fail if the caret/menu wiring in RecordMode.tsx needs adjustment. Fix any failures in RecordMode.tsx now.

**Common failure modes to watch for:**
- `aria-expanded` renders as the string `"false"` (boolean false) — check `aria-expanded={menuOpen}` is correctly bound
- Focus return failing — verify `caretRef.current?.focus()` is in `openMenu` before `setMenuOpen(true)`
- Disabled click still fires — native `<button disabled>` blocks click natively; if test fails, ensure `disabled` is applied to both `<button>` elements

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS across all components.

- [ ] **Step 4: Typecheck + lint**

```bash
npx tsc --noEmit && npx eslint src/components/RecordMode/
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/RecordMode/RecordMode.test.tsx src/components/RecordMode/RecordMode.tsx
git commit -m "test(RecordMode): caret, menu open/close, focus-return, disabled invariants"
```

---

## Task 4: RecordMode — demo

**Files:**
- Create: `src/components/RecordMode/RecordMode.demo.tsx`

**Interfaces:**
- Consumes: `RecordMode`, `RecordModeProps`, `RecordModeState`, `RecordModeValue` from Task 2

---

- [ ] **Step 1: Create the demo file**

Create `src/components/RecordMode/RecordMode.demo.tsx`:

```tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { RecordMode } from './RecordMode'
import type { RecordModeState, RecordModeValue } from './RecordMode'

export const meta: DemoMeta = {
  name:  'RecordMode',
  group: 'Primitives',
  route: '/record-mode',
  order: 11,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Idle">
        <RecordMode state="idle" mode="normal" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Armed">
        <RecordMode state="armed" mode="normal" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Recording">
        <RecordMode state="recording" mode="normal" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Loop-punch (idle)">
        <RecordMode state="idle" mode="loop-punch" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Loop-punch (armed)">
        <RecordMode state="armed" mode="loop-punch" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Disabled">
        <RecordMode state="idle" mode="normal" disabled onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="sm">
        <RecordMode state="idle" mode="normal" size="sm" onToggleRecord={noop} onSelectMode={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  // Cycle idle → armed → recording → idle on record click
  const [state,    setState]    = useState<RecordModeState>('idle')
  const [mode,     setMode]     = useState<RecordModeValue>('normal')
  const [disabled, setDisabled] = useState(false)
  const [size,     setSize]     = useState<'sm' | 'md'>('md')

  const cycle: Record<RecordModeState, RecordModeState> = {
    idle:      'armed',
    armed:     'recording',
    recording: 'idle',
  }

  const labelStyle: React.CSSProperties = {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <RecordMode
          state={state}
          mode={mode}
          disabled={disabled}
          size={size}
          onToggleRecord={() => setState(s => cycle[s])}
          onSelectMode={setMode}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            state
            <select
              value={state}
              onChange={e => setState(e.target.value as RecordModeState)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="idle">idle</option>
              <option value="armed">armed</option>
              <option value="recording">recording</option>
            </select>
          </label>
          <label style={labelStyle}>
            mode
            <select
              value={mode}
              onChange={e => setMode(e.target.value as RecordModeValue)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="normal">normal</option>
              <option value="loop-punch">loop-punch</option>
            </select>
          </label>
          <Checkbox
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          <label style={labelStyle}>
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

export default function RecordModeDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in the dev server**

```bash
npx vite
```

Navigate to the RecordMode gallery entry. Verify:
- StatesGrid shows all 7 states (idle / armed / recording / loop-punch idle / loop-punch armed / disabled / sm)
- Idle button shows a warm-red Record icon on dark background
- Armed button shows matte-red fill with 2 px red ring and white icon
- Recording button shows the same fill plus the pulsing bloom animation
- Loop-punch cells show the `ArrowsClockwise` corner badge in white
- Playground `state` select + record click both cycle states correctly
- Playground `mode` select switches the badge on/off and updates the menu checkmark
- Caret opens the menu; selecting a mode closes it and updates the badge/label
- Disabled state disables both buttons; caret does not open the menu

- [ ] **Step 5: Commit**

```bash
git add src/components/RecordMode/RecordMode.demo.tsx
git commit -m "feat(RecordMode): demo — states grid + playground"
```

---

## Self-Review Checklist

All spec requirements mapped to tasks:

| Spec requirement | Task |
|---|---|
| `state` union prop | Task 2 (RecordMode.tsx props) |
| `mode` prop | Task 2 |
| `onToggleRecord` / `onSelectMode` | Task 2 |
| `size` sm/md | Task 2 (CSS) |
| `disabled` on both buttons | Task 2 (TSX) + Task 3 (tests 16–18) |
| Idle visual (recessed, --text-dim ring, --led-red icon) | Task 2 (CSS) |
| Armed visual (--led-red-deep fill, 2 px ring, --text icon) | Task 2 (CSS) |
| Recording bloom animation (no-jump, prefers-reduced-motion) | Task 2 (CSS) |
| Loop-punch badge (--text, corner, aria-hidden) | Task 2 (TSX + CSS) |
| aria-label resolution (Record / Recording / mode suffix) | Task 2 (`resolveLabel`) |
| aria-pressed={state !== 'idle'} | Task 2 |
| WebKit caret.focus() fix | Task 2 (openMenu) |
| Close guard (timestamp ref) | Task 2 (openMenu/closeMenu) |
| ContextMenu menuitemradio extension | Task 1 |
| 2 radio items, exactly-one checked | Task 2 (menuItems derived from mode prop) |
| Esc / outside-click / Tab close | ContextMenu (existing) |
| Focus-return tests (9–11) with jsdom caveat | Task 3 |
| Disabled behavioural tests (17–18) | Task 3 |
| ContextMenu regression tests (20–21) | Task 1 |
| Demo — states grid + playground | Task 4 |
| typecheck / lint / test green | Every task (Steps 6–7) |
