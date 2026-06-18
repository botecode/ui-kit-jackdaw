# ContextMenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the shared `Popover` shell with portal + viewport-flip, then build a `ContextMenu` primitive that opens at the cursor, supports icons/shortcuts/separators/disabled/checked/danger items, and closes on Escape/outside-click/scroll.

**Architecture:** Additive `anchor?: { x; y }` prop on `Popover` — when present, the shell `createPortal`s to `document.body`, measures itself in `useLayoutEffect`, runs viewport-flip math, and closes on scroll/resize; when absent, existing behavior is byte-for-byte identical. `ContextMenu` wraps `Popover`, drives a `role="menu"` with APG-compliant roving focus (disabled items focusable but inert), and exports a `useContextMenu()` hook for right-click wiring.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vite, Vitest + @testing-library/react (`fireEvent`, not `userEvent`), `react-dom` (already installed — `createPortal`).

## Global Constraints

- All tests use `fireEvent`, never `userEvent`
- Token-only CSS — `var(--…)` and `color-mix()` only; no hard-coded hex or rgba
- `npx tsc --noEmit` must pass after every task
- `npx vitest run` must pass after every task — including **InputSelect and FxChip suites** after Task 1
- No new npm dependencies (react-dom is already installed)
- Disabled items are **focusable but inert** (APG pattern) — not skipped by arrow-key nav
- `submenu?` is typed on `MenuItem` but ignored in v1 (`// v2`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/Popover/Popover.tsx` | Modify | Add `anchor` prop, portal branch, viewport-flip |
| `src/components/Popover/Popover.module.css` | Modify | Add `.shellPortal` class |
| `src/components/ContextMenu/ContextMenu.tsx` | Create | Component + `useContextMenu` hook |
| `src/components/ContextMenu/ContextMenu.module.css` | Create | Menu + item styles |
| `src/components/ContextMenu/ContextMenu.test.tsx` | Create | 20 tests |
| `src/components/ContextMenu/index.ts` | Create | Public exports |
| `src/components/ContextMenu/ContextMenu.demo.tsx` | Create | States grid + playground |
| `src/gallery/planned.ts` | Modify | Remove ContextMenu entry |

---

### Task 1: Upgrade Popover — portal + viewport-flip

The existing `Popover` has `position: absolute` and no portal. This task adds an optional `anchor` prop. When present: portal to `document.body`, measure + flip, close on scroll/resize. When absent: zero changes to InputSelect and FxChip paths.

**Files:**
- Modify: `src/components/Popover/Popover.tsx`
- Modify: `src/components/Popover/Popover.module.css`

**Interfaces:**

```ts
// Updated PopoverProps (backward-compatible — all existing props unchanged)
export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }   // NEW
}
```

- [ ] **Step 1: Write the full updated `Popover.tsx`**

Replace `src/components/Popover/Popover.tsx` with:

```tsx
// src/components/Popover/Popover.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Popover.module.css'

export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }
}

const MARGIN = 4

function computePosition(
  anchorX: number,
  anchorY: number,
  menuW:   number,
  menuH:   number,
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = anchorX
  let top  = anchorY

  if (left + menuW + MARGIN > vw) left = anchorX - menuW
  if (top  + menuH + MARGIN > vh) top  = anchorY - menuH

  left = Math.max(MARGIN, Math.min(left, vw - menuW - MARGIN))
  top  = Math.max(MARGIN, Math.min(top,  vh - menuH - MARGIN))

  return { left, top }
}

export function Popover({
  containerRef,
  onClose,
  children,
  className,
  anchor,
}: PopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Outside-click: close when mousedown is outside both containerRef AND contentRef.
  // The second check is essential for portaled content — the portaled div is not a
  // DOM descendant of containerRef, so without it every click inside the menu would
  // be treated as "outside" and dismiss it immediately.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !contentRef.current?.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [containerRef, onClose])

  // Escape key
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  // Scroll/resize → close (portaled only). Repositioning a stale point is worse than closing.
  useEffect(() => {
    if (!anchor) return
    function handle() { onClose() }
    window.addEventListener('scroll', handle, { capture: true })
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, { capture: true })
      window.removeEventListener('resize', handle)
    }
  }, [anchor, onClose])

  // Measure + position. Deps are the raw coords, not the anchor object, because
  // anchor is created inline on every render (new object reference each time).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!anchor || !contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    setPos(computePosition(anchor.x, anchor.y, rect.width, rect.height))
  }, [anchor?.x, anchor?.y])

  // ── Portal (point-anchored) branch ────────────────────────────────────────
  if (anchor) {
    const shellClass = className
      ? `${styles.shell} ${styles.shellPortal} ${className}`
      : `${styles.shell} ${styles.shellPortal}`

    const style: React.CSSProperties = pos
      ? { left: pos.left, top: pos.top, visibility: 'visible' }
      : { visibility: 'hidden' }

    return createPortal(
      <div ref={contentRef} className={shellClass} style={style}>
        {children}
      </div>,
      document.body,
    )
  }

  // ── Trigger-anchored branch (unchanged from before this task) ─────────────
  return (
    <div className={className ? `${styles.shell} ${className}` : styles.shell}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Update `Popover.module.css`**

Replace `src/components/Popover/Popover.module.css` with:

```css
/* src/components/Popover/Popover.module.css */

.shell {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  min-width: 100%;
  z-index: 100;
  animation: popover-in var(--dur-fast) var(--ease-out) both;
}

/* Portal variant — comes after .shell so its declarations win when both are applied.
   position: fixed + z-index override .shell. .shell's animation still applies.
   top/left are overridden by the inline style from computePosition. */
.shellPortal {
  position: fixed;
  min-width: unset;
  z-index: 1000;
}

@keyframes popover-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass — especially `InputSelect` and `FxChip` suites (the anchor-absent path must be byte-for-byte unchanged). No new ContextMenu tests exist yet.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Popover/Popover.tsx src/components/Popover/Popover.module.css
git commit -m "feat(Popover): add anchor prop — portal + viewport-flip for point-anchored overlays"
```

---

### Task 2: ContextMenu rendering + tests 1–9

Creates the `ContextMenu` component with full item rendering (all item types) and 9 structural tests. No keyboard navigation yet — that is Task 3.

**Files:**
- Create: `src/components/ContextMenu/index.ts`
- Create: `src/components/ContextMenu/ContextMenu.tsx`
- Create: `src/components/ContextMenu/ContextMenu.module.css`
- Create: `src/components/ContextMenu/ContextMenu.test.tsx`

**Produces (consumed by Task 3):**

```ts
export type MenuEntry = MenuItem | MenuSeparator
export interface MenuItem {
  id: string; label: string; icon?: React.ReactNode; shortcut?: string
  disabled?: boolean; checked?: boolean; danger?: boolean
  onSelect?: () => void; submenu?: MenuEntry[]   // v2 — reserved
}
export interface MenuSeparator { id: string; separator: true }
export interface ContextMenuProps {
  items: MenuEntry[]; open: boolean; x: number; y: number
  onClose: () => void; 'aria-label'?: string
}
export function ContextMenu(props: ContextMenuProps): React.ReactElement | null
export function isSeparator(e: MenuEntry): e is MenuSeparator
```

- [ ] **Step 1: Write the 9 failing tests**

Create `src/components/ContextMenu/ContextMenu.test.tsx`:

```tsx
// src/components/ContextMenu/ContextMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'
import type { MenuEntry } from './ContextMenu'

const ITEMS: MenuEntry[] = [
  { id: 'cut',    label: 'Cut'   },
  { id: 'copy',   label: 'Copy'  },
  { id: 'paste',  label: 'Paste' },
]

const BASE = { items: ITEMS, open: true, x: 100, y: 100, onClose: vi.fn() }

beforeEach(() => vi.clearAllMocks())

describe('ContextMenu — rendering', () => {
  it('renders role="menu" when open=true', () => {
    render(<ContextMenu {...BASE} />)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<ContextMenu {...BASE} open={false} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('regular items render as role="menuitem"', () => {
    render(<ContextMenu {...BASE} />)
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByRole('menuitem', { name: 'Cut' })).toBeInTheDocument()
  })

  it('separator renders as role="separator"', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 's', separator: true },
      { id: 'b', label: 'B' },
    ]
    render(<ContextMenu {...BASE} items={items} />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('disabled item has aria-disabled="true"', () => {
    const items: MenuEntry[] = [{ id: 'd', label: 'Delete', disabled: true }]
    render(<ContextMenu {...BASE} items={items} />)
    expect(screen.getByRole('menuitem', { name: 'Delete' }))
      .toHaveAttribute('aria-disabled', 'true')
  })

  it('checked item has role="menuitemcheckbox" and aria-checked="true"', () => {
    const items: MenuEntry[] = [{ id: 'c', label: 'Show Grid', checked: true }]
    render(<ContextMenu {...BASE} items={items} />)
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show Grid' })
    expect(item).toHaveAttribute('aria-checked', 'true')
  })

  it('danger item has data-danger attribute', () => {
    const items: MenuEntry[] = [{ id: 'del', label: 'Delete Track', danger: true }]
    render(<ContextMenu {...BASE} items={items} />)
    expect(screen.getByRole('menuitem', { name: 'Delete Track' }))
      .toHaveAttribute('data-danger')
  })

  it('clicking an item calls onSelect then onClose', () => {
    const onSelect = vi.fn()
    const onClose  = vi.fn()
    const items: MenuEntry[] = [{ id: 'a', label: 'Cut', onSelect }]
    render(<ContextMenu items={items} open x={100} y={100} onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking a disabled item calls neither onSelect nor onClose', () => {
    const onSelect = vi.fn()
    const onClose  = vi.fn()
    const items: MenuEntry[] = [{ id: 'a', label: 'Cut', onSelect, disabled: true }]
    render(<ContextMenu items={items} open x={100} y={100} onClose={onClose} />)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cut' }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: FAIL — `Cannot find module './ContextMenu'`

- [ ] **Step 3: Create `src/components/ContextMenu/index.ts`**

```ts
// src/components/ContextMenu/index.ts
export { ContextMenu, useContextMenu } from './ContextMenu'
export type { ContextMenuProps, MenuEntry, MenuItem, MenuSeparator } from './ContextMenu'
```

Note: `useContextMenu` is added in Task 3. TypeScript will error until Task 3 adds it — either add a placeholder export in Task 3, or export it here after Task 3 completes. For now, remove `useContextMenu` from this line and add it in Task 3.

Correct `index.ts` for Task 2:

```ts
// src/components/ContextMenu/index.ts
export { ContextMenu } from './ContextMenu'
export type { ContextMenuProps, MenuEntry, MenuItem, MenuSeparator } from './ContextMenu'
```

- [ ] **Step 4: Create `src/components/ContextMenu/ContextMenu.tsx`**

```tsx
// src/components/ContextMenu/ContextMenu.tsx
import { useRef } from 'react'
import styles from './ContextMenu.module.css'
import { Popover } from '../Popover'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id:        string
  label:     string
  icon?:     React.ReactNode
  shortcut?: string
  disabled?: boolean
  checked?:  boolean
  danger?:   boolean
  onSelect?: () => void
  submenu?:  MenuEntry[]   // v2 — reserved, not implemented
}

export interface MenuSeparator {
  id:        string
  separator: true
}

export type MenuEntry = MenuItem | MenuSeparator

export interface ContextMenuProps {
  items:         MenuEntry[]
  open:          boolean
  x:             number
  y:             number
  onClose:       () => void
  'aria-label'?: string
}

export function isSeparator(e: MenuEntry): e is MenuSeparator {
  return 'separator' in e && (e as MenuSeparator).separator === true
}

// ── ContextMenu ───────────────────────────────────────────────────────────────

export function ContextMenu({
  items,
  open,
  x,
  y,
  onClose,
  'aria-label': ariaLabel = 'Context menu',
}: ContextMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef      = useRef<HTMLUListElement>(null)
  const itemRefs     = useRef<Record<string, HTMLLIElement | null>>({})

  if (!open) return null

  return (
    <div ref={containerRef}>
      <Popover anchor={{ x, y }} containerRef={containerRef} onClose={onClose}>
        <ul
          role="menu"
          aria-label={ariaLabel}
          className={styles.menu}
          ref={menuRef}
        >
          {items.map(entry =>
            isSeparator(entry) ? (
              <li key={entry.id} role="separator" className={styles.separator} />
            ) : (
              <li
                key={entry.id}
                role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                aria-disabled={entry.disabled || undefined}
                aria-checked={entry.checked ?? undefined}
                data-danger={entry.danger || undefined}
                tabIndex={-1}
                className={styles.item}
                ref={el => { itemRefs.current[entry.id] = el }}
                onClick={() => {
                  if (entry.disabled) return
                  entry.onSelect?.()
                  onClose()
                }}
              >
                <span className={styles.leadSlot} aria-hidden>
                  {entry.checked !== undefined
                    ? (entry.checked
                        ? <span className={styles.checkmark}>✓</span>
                        : null)
                    : (entry.icon ?? null)}
                </span>
                <span className={styles.label}>{entry.label}</span>
                {entry.shortcut && (
                  <span className={styles.shortcut} aria-hidden>{entry.shortcut}</span>
                )}
              </li>
            )
          )}
        </ul>
      </Popover>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/ContextMenu/ContextMenu.module.css`**

```css
/* src/components/ContextMenu/ContextMenu.module.css */

.menu {
  list-style: none;
  margin: 0;
  padding: var(--space-1) 0;
  min-width: 180px;
  background: var(--stage);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  outline: none;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
}

.separator {
  height: 1px;
  background: var(--border);
  margin: var(--space-1) 0;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  color: var(--text);
  cursor: default;
  user-select: none;
}

.item:hover:not([aria-disabled]),
.item:focus {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  outline: none;
}

.item[aria-disabled] {
  color: var(--text-muted);
}

.item[data-danger] {
  color: var(--danger);
}

.item[data-danger]:hover:not([aria-disabled]),
.item[data-danger]:focus {
  background: color-mix(in srgb, var(--danger) 15%, transparent);
}

/* Leading slot — fixed width so label stays aligned whether item is
   checked or unchecked. Holds checkmark OR icon, never both. */
.leadSlot {
  width: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.checkmark {
  color: var(--accent);
  font-size: var(--text-sm);
}

.label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shortcut {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-left: var(--space-4);
  flex-shrink: 0;
}
```

- [ ] **Step 6: Run tests — verify all 9 pass**

```bash
npx vitest run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: 9 passed (9)

- [ ] **Step 7: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 8: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add src/components/ContextMenu/
git commit -m "feat(ContextMenu): scaffold — item rendering, separators, disabled, checked, danger + 9 tests"
```

---

### Task 3: Keyboard nav + focus management + `useContextMenu` + tests 10–20

Adds roving-focus keyboard navigation, focus capture/return, and the `useContextMenu` hook. Appends 11 tests to the existing file (total: 20).

**Files:**
- Modify: `src/components/ContextMenu/ContextMenu.tsx`
- Modify: `src/components/ContextMenu/ContextMenu.test.tsx`
- Modify: `src/components/ContextMenu/index.ts` (add `useContextMenu` export)

**Consumes from Task 2:** `ContextMenu.tsx` with `itemRefs`, `containerRef`, `isSeparator`, all item types.

- [ ] **Step 1: Append the 11 failing tests**

Add this block at the end of `ContextMenu.test.tsx` (after the existing describe block):

```tsx
describe('ContextMenu — keyboard navigation', () => {
  it('Escape keydown calls onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Tab keydown calls onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the first item on open', () => {
    const items: MenuEntry[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'A' }))
  })

  it('ArrowDown moves focus to the next item; wraps at end', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    const menu = screen.getByRole('menu')
    const [a, b, c] = screen.getAllByRole('menuitem')

    expect(document.activeElement).toBe(a)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(b)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(c)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })  // wraps
    expect(document.activeElement).toBe(a)
  })

  it('ArrowUp moves focus to the previous item; wraps at start', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    const menu = screen.getByRole('menu')
    const [a, b] = screen.getAllByRole('menuitem')

    expect(document.activeElement).toBe(a)
    fireEvent.keyDown(menu, { key: 'ArrowUp' })   // wraps to b
    expect(document.activeElement).toBe(b)
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(a)
  })

  it('Home / End jump to first / last item', () => {
    const items: MenuEntry[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]
    render(<ContextMenu items={items} open x={100} y={100} onClose={vi.fn()} />)
    const menu = screen.getByRole('menu')
    const [a, , c] = screen.getAllByRole('menuitem')

    fireEvent.keyDown(menu, { key: 'End' })
    expect(document.activeElement).toBe(c)
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(document.activeElement).toBe(a)
  })
})

describe('ContextMenu — outside-click and portal containment', () => {
  it('mousedown outside the menu calls onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    fireEvent.mouseDown(outside)
    expect(onClose).toHaveBeenCalledTimes(1)
    document.body.removeChild(outside)
  })

  it('mousedown inside the portaled menu does NOT call onClose', () => {
    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)
    fireEvent.mouseDown(screen.getByRole('menuitem', { name: 'A' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('flips left near right edge and up near bottom edge', () => {
    const origW = window.innerWidth
    const origH = window.innerHeight
    Object.defineProperty(window, 'innerWidth',  { value: 400, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true, writable: true })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 200, height: 150,
      top: 0, left: 0, right: 200, bottom: 150, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    // Anchor near right+bottom corner; menu should flip left and up
    render(
      <ContextMenu
        items={[{ id: 'a', label: 'A' }]}
        open
        x={390}
        y={280}
        onClose={vi.fn()}
      />
    )

    // Flip left: 390 + 200 + 4 = 594 > 400 → left = 390 - 200 = 190; clamp → 190
    // Flip up:  280 + 150 + 4 = 434 > 300 → top  = 280 - 150 = 130; clamp → 130
    const portalDiv = screen.getByRole('menu').parentElement!
    expect(portalDiv.style.left).toBe('190px')
    expect(portalDiv.style.top).toBe('130px')

    Object.defineProperty(window, 'innerWidth',  { value: origW, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: origH, configurable: true, writable: true })
    vi.restoreAllMocks()
  })

  it('returns focus to the previously focused element on close', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    expect(document.activeElement).toBe(button)

    const onClose = vi.fn()
    render(<ContextMenu items={[{ id: 'a', label: 'A' }]} open x={100} y={100} onClose={onClose} />)

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(document.activeElement).toBe(button)

    document.body.removeChild(button)
  })
})

describe('ContextMenu — useContextMenu hook', () => {
  it('onContextMenu event opens the menu at cursor coords', () => {
    function Wrapper() {
      const menu = useContextMenu()
      return (
        <>
          <div data-testid="surface" {...menu.triggerProps} />
          {menu.open && (
            <div data-testid="coords">{menu.x},{menu.y}</div>
          )}
        </>
      )
    }
    render(<Wrapper />)
    fireEvent.contextMenu(screen.getByTestId('surface'), { clientX: 42, clientY: 88 })
    expect(screen.getByTestId('coords').textContent).toBe('42,88')
  })
})
```

Also add `useContextMenu` to the import at the top of the test file:

```tsx
import { ContextMenu, useContextMenu } from './ContextMenu'
```

- [ ] **Step 2: Run tests — verify 11 new tests fail**

```bash
npx vitest run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: 9 pass (from Task 2), 11 fail (no keyboard handler, no focus effect, no hook)

- [ ] **Step 3: Update `ContextMenu.tsx` with keyboard nav, focus management, and hook**

Replace `src/components/ContextMenu/ContextMenu.tsx` with the full version:

```tsx
// src/components/ContextMenu/ContextMenu.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './ContextMenu.module.css'
import { Popover } from '../Popover'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id:        string
  label:     string
  icon?:     React.ReactNode
  shortcut?: string
  disabled?: boolean
  checked?:  boolean
  danger?:   boolean
  onSelect?: () => void
  submenu?:  MenuEntry[]   // v2 — reserved
}

export interface MenuSeparator {
  id:        string
  separator: true
}

export type MenuEntry = MenuItem | MenuSeparator

export interface ContextMenuProps {
  items:         MenuEntry[]
  open:          boolean
  x:             number
  y:             number
  onClose:       () => void
  'aria-label'?: string
}

export function isSeparator(e: MenuEntry): e is MenuSeparator {
  return 'separator' in e && (e as MenuSeparator).separator === true
}

// ── useContextMenu ────────────────────────────────────────────────────────────

export function useContextMenu() {
  const [state, setState] = useState<{ open: boolean; x: number; y: number }>({
    open: false, x: 0, y: 0,
  })

  function close() { setState(s => ({ ...s, open: false })) }

  const triggerProps = {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      setState({ open: true, x: e.clientX, y: e.clientY })
    },
  }

  return { open: state.open, x: state.x, y: state.y, onClose: close, triggerProps }
}

// ── ContextMenu ───────────────────────────────────────────────────────────────

export function ContextMenu({
  items,
  open,
  x,
  y,
  onClose,
  'aria-label': ariaLabel = 'Context menu',
}: ContextMenuProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const menuRef       = useRef<HTMLUListElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const itemRefs      = useRef<Record<string, HTMLLIElement | null>>({})
  const [focusedIndex, setFocusedIndex] = useState(0)

  // All non-separator items are focusable — including disabled (APG pattern:
  // disabled items are reachable but inert on activation).
  const focusable = items.filter((e): e is MenuItem => !isSeparator(e))

  // Capture the currently focused element before it moves to the menu.
  // useLayoutEffect fires before useEffect so the capture happens before
  // the focus-on-open effect below moves focus to the first item.
  useLayoutEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement
  }, []) // empty deps — component only mounts when open=true

  // Focus the first item on open.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const first = focusable[0]
    if (first) {
      itemRefs.current[first.id]?.focus()
      setFocusedIndex(0)
    }
  }, []) // empty deps — intentional: run once on mount

  if (!open) return null

  function handleClose() {
    returnFocusRef.current?.focus()
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const n = focusable.length
    if (n === 0) return

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = (focusedIndex + 1) % n
        setFocusedIndex(next)
        itemRefs.current[focusable[next].id]?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = (focusedIndex - 1 + n) % n
        setFocusedIndex(prev)
        itemRefs.current[focusable[prev].id]?.focus()
        break
      }
      case 'Home': {
        e.preventDefault()
        setFocusedIndex(0)
        itemRefs.current[focusable[0].id]?.focus()
        break
      }
      case 'End': {
        e.preventDefault()
        const last = n - 1
        setFocusedIndex(last)
        itemRefs.current[focusable[last].id]?.focus()
        break
      }
      case ' ': {
        e.preventDefault()
        const item = focusable[focusedIndex]
        if (item && !item.disabled) { item.onSelect?.(); handleClose() }
        break
      }
      case 'Enter': {
        const item = focusable[focusedIndex]
        if (item && !item.disabled) { item.onSelect?.(); handleClose() }
        break
      }
      case 'Escape':
      case 'Tab': {
        handleClose()
        break
      }
    }
  }

  return (
    <div ref={containerRef}>
      <Popover anchor={{ x, y }} containerRef={containerRef} onClose={handleClose}>
        <ul
          role="menu"
          aria-label={ariaLabel}
          className={styles.menu}
          ref={menuRef}
          onKeyDown={handleKeyDown}
        >
          {items.map((entry, _i) =>
            isSeparator(entry) ? (
              <li key={entry.id} role="separator" className={styles.separator} />
            ) : (
              <li
                key={entry.id}
                role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                aria-disabled={entry.disabled || undefined}
                aria-checked={entry.checked ?? undefined}
                data-danger={entry.danger || undefined}
                tabIndex={-1}
                className={styles.item}
                ref={el => { itemRefs.current[entry.id] = el }}
                onFocus={() => {
                  const idx = focusable.findIndex(f => f.id === entry.id)
                  if (idx >= 0) setFocusedIndex(idx)
                }}
                onClick={() => {
                  if (entry.disabled) return
                  entry.onSelect?.()
                  handleClose()
                }}
              >
                <span className={styles.leadSlot} aria-hidden>
                  {entry.checked !== undefined
                    ? (entry.checked
                        ? <span className={styles.checkmark}>✓</span>
                        : null)
                    : (entry.icon ?? null)}
                </span>
                <span className={styles.label}>{entry.label}</span>
                {entry.shortcut && (
                  <span className={styles.shortcut} aria-hidden>{entry.shortcut}</span>
                )}
              </li>
            )
          )}
        </ul>
      </Popover>
    </div>
  )
}
```

Key differences from Task 2 version:
- Added `useLayoutEffect` (capture focus target) and `useEffect` (focus first item on mount)
- Added `[focusedIndex, setFocusedIndex]` state
- Added `focusable` derived array (non-separator items, including disabled)
- Added `handleClose` (focus return + onClose)
- Added `handleKeyDown` on `<ul>`
- Added `onFocus` on each `<li>` to sync `focusedIndex` when focus moves without keyboard
- `onClose` in `<Popover>` is now `handleClose` (not `onClose` directly)
- `onClick` on items now calls `handleClose()` instead of `onClose()`

- [ ] **Step 4: Update `index.ts` to export `useContextMenu`**

```ts
// src/components/ContextMenu/index.ts
export { ContextMenu, useContextMenu } from './ContextMenu'
export type { ContextMenuProps, MenuEntry, MenuItem, MenuSeparator } from './ContextMenu'
```

- [ ] **Step 5: Run tests — verify all 20 pass**

```bash
npx vitest run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: 20 passed (20)

- [ ] **Step 6: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/components/ContextMenu/ContextMenu.tsx \
        src/components/ContextMenu/ContextMenu.test.tsx \
        src/components/ContextMenu/index.ts
git commit -m "feat(ContextMenu): keyboard nav, roving focus, useContextMenu hook — 20 tests passing"
```

---

### Task 4: Demo + planned.ts cleanup

Creates the gallery demo with 6 state cards (including edge-flip demos that open at real viewport-edge coordinates) and a live playground using `useContextMenu`.

**Files:**
- Create: `src/components/ContextMenu/ContextMenu.demo.tsx`
- Modify: `src/gallery/planned.ts`

**Consumes from Tasks 1–3:** `ContextMenu`, `useContextMenu`, `MenuEntry` from `./ContextMenu`; `Toggle` from `../Toggle`; `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery UI; `DemoMeta` from gallery registry.

- [ ] **Step 1: Check gallery UI component import paths**

Before writing the demo, verify the actual import paths by reading one existing demo (e.g., `src/components/FxChip/FxChip.demo.tsx`):

```bash
head -20 /Users/fernandofeitosa/dev/ui-jackdaw/src/components/FxChip/FxChip.demo.tsx
```

Use the same import paths for `DemoShell`, `StatesGrid`, `State`, `Playground`, and `DemoMeta`.

- [ ] **Step 2: Create `src/components/ContextMenu/ContextMenu.demo.tsx`**

```tsx
// src/components/ContextMenu/ContextMenu.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ContextMenu, useContextMenu } from './ContextMenu'
import type { MenuEntry } from './ContextMenu'

export const meta: DemoMeta = {
  name:  'ContextMenu',
  group: 'Primitives',
  route: '/context-menu',
  order: 9,
}

// ── Shared item sets ──────────────────────────────────────────────────────────

const BASIC_ITEMS: MenuEntry[] = [
  { id: 'cut',    label: 'Cut',    onSelect: () => {} },
  { id: 'copy',   label: 'Copy',   onSelect: () => {} },
  { id: 'paste',  label: 'Paste',  onSelect: () => {} },
  { id: 'delete', label: 'Delete', onSelect: () => {} },
]

const RICH_ITEMS: MenuEntry[] = [
  { id: 'undo',   label: 'Undo',   shortcut: '⌘Z',   onSelect: () => {} },
  { id: 'redo',   label: 'Redo',   shortcut: '⌘⇧Z',  onSelect: () => {} },
  { id: 'sep1',   separator: true },
  { id: 'cut',    label: 'Cut',    shortcut: '⌘X',   onSelect: () => {} },
  { id: 'copy',   label: 'Copy',   shortcut: '⌘C',   onSelect: () => {} },
  { id: 'paste',  label: 'Paste',  shortcut: '⌘V',   onSelect: () => {} },
]

const MIXED_ITEMS: MenuEntry[] = [
  { id: 'rename', label: 'Rename',      onSelect: () => {} },
  { id: 'mute',   label: 'Mute Track',  checked: true,   onSelect: () => {} },
  { id: 'sep1',   separator: true },
  { id: 'lock',   label: 'Lock',        disabled: true,  onSelect: () => {} },
  { id: 'delete', label: 'Delete Track', danger: true,   onSelect: () => {} },
]

// ── Simple state card: button opens menu at fixed coords ──────────────────────

function MenuCard({
  label,
  items,
  x = 20,
  y = 20,
}: {
  label: string
  items: MenuEntry[]
  x?: number
  y?: number
}) {
  const [open, setOpen] = useState(false)
  return (
    <State label={label}>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--stage)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-1) var(--space-3)',
        }}
      >
        Open menu
      </button>
      <ContextMenu items={items} open={open} x={x} y={y} onClose={() => setOpen(false)} aria-label={label} />
    </State>
  )
}

// ── Edge-flip card: coords evaluated at click time against real viewport ──────

function EdgeCard({ label, getCoords }: { label: string; getCoords: () => { x: number; y: number } }) {
  const [state, setState] = useState({ open: false, x: 0, y: 0 })
  return (
    <State label={label}>
      <button
        onClick={() => {
          const { x, y } = getCoords()
          setState({ open: true, x, y })
        }}
        style={{
          background: 'var(--stage)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-1) var(--space-3)',
        }}
      >
        Open at edge
      </button>
      <ContextMenu
        items={BASIC_ITEMS}
        open={state.open}
        x={state.x}
        y={state.y}
        onClose={() => setState(s => ({ ...s, open: false }))}
        aria-label={label}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <MenuCard label="Basic"             items={BASIC_ITEMS} x={20} y={20} />
      <MenuCard label="Shortcuts"         items={RICH_ITEMS}  x={20} y={20} />
      <MenuCard label="Mixed (sep / disabled / checked / danger)" items={MIXED_ITEMS} x={20} y={20} />
      <EdgeCard
        label="Near right edge (flips left)"
        getCoords={() => ({ x: window.innerWidth - 16, y: 200 })}
      />
      <EdgeCard
        label="Near bottom edge (flips up)"
        getCoords={() => ({ x: 200, y: window.innerHeight - 16 })}
      />
      <EdgeCard
        label="Near corner (flips both)"
        getCoords={() => ({ x: window.innerWidth - 16, y: window.innerHeight - 16 })}
      />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const menu = useContextMenu()

  const [item1Disabled, setItem1Disabled] = useState(false)
  const [item2Checked,  setItem2Checked]  = useState(false)
  const [item3Danger,   setItem3Danger]   = useState(false)

  const items: MenuEntry[] = [
    { id: 'rename', label: 'Rename',      disabled: item1Disabled, onSelect: () => {} },
    { id: 'mute',   label: 'Mute Track',  checked: item2Checked ? true : undefined, onSelect: () => setItem2Checked(c => !c) },
    { id: 'sep1',   separator: true },
    { id: 'delete', label: 'Delete Track', danger: item3Danger,   onSelect: () => {} },
  ]

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Right-click surface */}
        <div
          {...menu.triggerProps}
          style={{
            width: 240,
            height: 64,
            background: 'var(--stage)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            cursor: 'context-menu',
            userSelect: 'none',
          }}
          role="region"
          aria-label="Right-click surface"
        >
          Right-click anywhere here
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={item1Disabled} onChange={next => setItem1Disabled(next)} size="sm" label="Rename — disabled" />
          <Toggle checked={item2Checked}  onChange={next => setItem2Checked(next)}  size="sm" label="Mute — checked" />
          <Toggle checked={item3Danger}   onChange={next => setItem3Danger(next)}   size="sm" label="Delete — danger" />
        </div>
      </div>

      <ContextMenu
        items={items}
        open={menu.open}
        x={menu.x}
        y={menu.y}
        onClose={menu.onClose}
        aria-label="Track options"
      />
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function ContextMenuDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 3: Remove ContextMenu from `src/gallery/planned.ts`**

Delete this line from the `PLANNED` array:

```ts
{ name: 'ContextMenu', group: 'Primitives', route: '/context-menu' },
```

No other entries in planned.ts should be touched.

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass, no regressions

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ContextMenu/ContextMenu.demo.tsx \
        src/gallery/planned.ts
git commit -m "feat(ContextMenu): gallery demo — states grid, edge-flip showcase, interactive playground"
```
