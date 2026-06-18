# ContextMenu Design Spec

**Date:** 2026-06-19
**Status:** Approved

## Goal

A generic right-click context menu primitive that reuses and upgrades the shared `Popover` shell with a portal + viewport-flip, anchored at the cursor rather than under a trigger. Proves the Popover abstraction generalises beyond its original trigger-anchored use cases.

## Scope

- Upgrade `Popover` with optional point-anchor + portal + viewport-flip (additive — no change to existing consumers)
- `ContextMenu` component: items with icons, shortcuts, separators, disabled, checked, danger
- `useContextMenu()` hook for wiring right-click events
- Flat menu only (no submenus in v1; `submenu?` field reserved on the type)
- Done criteria: InputSelect and FxChip existing tests pass unchanged after the Popover upgrade

---

## Section 1 — Files

```
src/components/Popover/Popover.tsx          ← upgrade (additive props only)
src/components/Popover/Popover.module.css   ← add .shellPortal class
src/components/ContextMenu/
  ContextMenu.tsx           ← component + useContextMenu hook
  ContextMenu.module.css
  ContextMenu.test.tsx
  ContextMenu.demo.tsx
  index.ts
```

---

## Section 2 — Popover Upgrade

### New prop (additive — all existing props unchanged)

```ts
anchor?: { x: number; y: number }
```

When `anchor` is **absent**: behavior is byte-for-byte identical to today. InputSelect and FxChip pass no `anchor` — zero regression.

When `anchor` is **present**:

1. Popover creates an internal `contentRef = useRef<HTMLDivElement>(null)`.
2. Renders via `createPortal(..., document.body)`.
3. Initial render: `visibility: hidden` to suppress flash while measuring.
4. `useLayoutEffect` (deps: `[anchor.x, anchor.y]`):
   - Reads `contentRef.current.getBoundingClientRect()` for menu `{ width, height }`.
   - Runs viewport-flip math (see below).
   - Sets `adjustedPos` state `{ left, top }`.
   - Clears `visibility: hidden`.
5. The portaled root div uses `position: fixed; left: {left}px; top: {top}px` via inline style.
6. **Close on scroll/resize** (not reposition): when `anchor` is present, adds `scroll` and `resize` event listeners on `window` that call `onClose`. A menu pinned to a stale point is worse than one that closes.

### Portal-aware outside-click

The existing mousedown handler checks:

```ts
!containerRef.current?.contains(e.target as Node)
```

In the portal case, the menu content is no longer a DOM descendant of `containerRef`, so this would dismiss the menu on its own clicks. Updated check:

```ts
!containerRef.current?.contains(e.target as Node) &&
!contentRef.current?.contains(e.target as Node)
```

When `anchor` is absent, `contentRef` is null and the second clause is always false — no change in behavior.

### Viewport-flip math

```ts
const MARGIN = 4  // px clearance from every viewport edge

function computePosition(
  anchorX: number, anchorY: number,
  menuW: number, menuH: number,
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = anchorX
  let top  = anchorY

  // Flip left if not enough room to the right
  if (left + menuW + MARGIN > vw) left = anchorX - menuW

  // Flip up if not enough room below
  if (top + menuH + MARGIN > vh) top  = anchorY - menuH

  // Clamp to viewport
  left = Math.max(MARGIN, Math.min(left, vw - menuW - MARGIN))
  top  = Math.max(MARGIN, Math.min(top,  vh - menuH - MARGIN))

  return { left, top }
}
```

`position: fixed` is viewport-relative, so raw `clientX/clientY` (the anchor coords) need no scroll offset math.

### Animation

`.shellPortal` composes with `.shell` for the `popover-in` keyframe so the menu still animates in. `prefers-reduced-motion` already zeroes `--dur-fast` globally — the animation is free.

### z-index

`z-index: 1000` on `.shellPortal`. The trigger-anchored `.shell` uses `z-index: 100`. No z-index tokens exist in the kit; 1000 clears every existing overlay.

---

## Section 3 — ContextMenu Types and Props

### Item types

```ts
export interface MenuItem {
  id:        string
  label:     string
  icon?:     React.ReactNode   // consumer supplies — any icon library; aria-hidden by ContextMenu
  shortcut?: string            // e.g. "⌘Z", rendered right-aligned, aria-hidden
  disabled?: boolean
  checked?:  boolean           // triggers role="menuitemcheckbox" + aria-checked
  danger?:   boolean           // label color: var(--danger)
  onSelect?: () => void
  submenu?:  MenuEntry[]       // v2 — reserved on the type, ignored in v1
}

export interface MenuSeparator {
  id:        string
  separator: true
}

export type MenuEntry = MenuItem | MenuSeparator
```

### Component props

```ts
export interface ContextMenuProps {
  items:      MenuEntry[]
  open:       boolean
  x:          number          // viewport coords (clientX from contextmenu event)
  y:          number          // viewport coords (clientY from contextmenu event)
  onClose:    () => void
  'aria-label'?: string       // default "Context menu"; set per-consumer for screen readers
}
```

---

## Section 4 — DOM Structure

```
{open && (
  <div ref={containerRef}>
    <Popover
      anchor={{ x, y }}
      containerRef={containerRef}
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <ul
        role="menu"
        aria-label="Context menu"
        className={styles.menu}
        ref={menuRef}
        onKeyDown={handleKeyDown}
      >
        {items.map(entry =>
          isSeparator(entry)
            ? <li key={entry.id} role="separator" className={styles.separator} />
            : <li
                key={entry.id}
                role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                aria-disabled={entry.disabled || undefined}
                aria-checked={entry.checked ?? undefined}
                data-danger={entry.danger || undefined}
                tabIndex={-1}
                className={styles.item}
                ref={el => { itemRefs.current[entry.id] = el }}
                onClick={() => handleSelect(entry)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(entry)
                  }
                }}
              >
                <span className={styles.leadSlot} aria-hidden>
                  {entry.checked ? <span className={styles.checkmark}>✓</span>
                   : entry.icon  ? entry.icon
                   : null}
                </span>
                <span className={styles.label}>{entry.label}</span>
                {entry.shortcut && (
                  <span className={styles.shortcut} aria-hidden>{entry.shortcut}</span>
                )}
              </li>
        )}
      </ul>
    </Popover>
  </div>
)}
```

**Focus return:** `returnFocusRef` is set to `document.activeElement as HTMLElement` at the moment `open` transitions to `true`. Popover's `onClose` path returns focus to it.

**Leading slot design:** The leading slot (`leadSlot`) has fixed width and holds either the checkmark (if `checked !== undefined`) or the icon (if provided). This ensures the label column stays aligned regardless of whether an item is checked or unchecked — no label shift on toggle.

---

## Section 5 — Keyboard Navigation + Accessibility

### Roving focus model

- `focusable`: items filtered to exclude only **separators** (disabled items stay in — APG pattern: focusable but not activatable)
- On open: `focusedIndex = 0`, programmatic `.focus()` on `focusable[0]`
- All `<li>` items: `tabIndex={-1}`; focus moved entirely via JS
- Separator `<li>` elements are not in `focusable`, never receive focus

### Key bindings (all on `onKeyDown` of the `<ul>`)

| Key | Behavior |
|---|---|
| `↓` | `focusedIndex = (i + 1) % focusable.length` (wrap) |
| `↑` | `focusedIndex = (i − 1 + n) % n` (wrap) |
| `Home` | `focusedIndex = 0` |
| `End` | `focusedIndex = focusable.length - 1` |
| `Enter` / `Space` | if not disabled: `item.onSelect?.()` then `onClose()`; if disabled: no-op |
| `Escape` | `onClose()` |
| `Tab` | `onClose()` (one tab stop — Tab exits the menu) |

`e.preventDefault()` on: `ArrowDown`, `ArrowUp`, `Home`, `End`, `Space` (prevents page scroll).

### ARIA

| Element | Role / Attribute |
|---|---|
| `<ul>` | `role="menu"` `aria-label="Context menu"` |
| Normal item | `role="menuitem"` |
| Checked item | `role="menuitemcheckbox"` `aria-checked={checked}` |
| Disabled item | `aria-disabled="true"` (not `disabled` attr — keeps element in focus model) |
| Separator | `role="separator"` |
| Icon | `aria-hidden="true"` |
| Shortcut | `aria-hidden="true"` |
| Checkmark glyph | `aria-hidden="true"` |

---

## Section 6 — `useContextMenu` Hook

```ts
export function useContextMenu() {
  const [state, setState] = useState<{ open: boolean; x: number; y: number }>({
    open: false, x: 0, y: 0,
  })

  const open  = (x: number, y: number) => setState({ open: true, x, y })
  const close = () => setState(s => ({ ...s, open: false }))

  const triggerProps = {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      open(e.clientX, e.clientY)
    },
  }

  return {
    open:     state.open,
    x:        state.x,
    y:        state.y,
    onClose:  close,
    triggerProps,
  }
}
```

The hook is optional. Consumers may manage `open/x/y/onClose` themselves for programmatic menus (e.g. keyboard-triggered context menus from a button).

---

## Section 7 — Testing (20 tests)

All tests use `fireEvent`, not `userEvent`. Portal content renders into `document.body` — `screen.getByRole('menu')` finds it.

| # | Test |
|---|---|
| 1 | Menu renders with `role="menu"` when `open=true` |
| 2 | Menu is absent from DOM when `open=false` |
| 3 | Regular items render as `role="menuitem"` |
| 4 | Separator renders as `role="separator"` |
| 5 | Disabled item has `aria-disabled="true"` and is focusable; Enter is a no-op |
| 6 | Checked item has `role="menuitemcheckbox"` + `aria-checked="true"` |
| 7 | Danger item has `data-danger` attribute |
| 8 | Clicking an item calls `onSelect` then `onClose` |
| 9 | Clicking a disabled item calls neither `onSelect` nor `onClose` |
| 10 | `Escape` keydown calls `onClose` |
| 11 | `ArrowDown` moves focus to next item; wraps at end |
| 12 | `ArrowUp` moves focus to previous item; wraps at start |
| 13 | `Home` / `End` jump to first / last focusable item |
| 14 | `useContextMenu` — `onContextMenu` event sets `open=true` + correct `x`/`y` |
| 15 | Mousedown outside menu calls `onClose` |
| 16 | Mousedown inside portaled menu does NOT call `onClose` |
| 17 | Flip: mock `getBoundingClientRect` + `window.innerWidth/innerHeight`; assert position flips left near right edge; flips up near bottom edge |
| 18 | Focus return: focus an element, open menu, close, assert focus returned to that element |
| 19 | Tab keydown closes the menu |
| 20 | First focusable item receives focus on open |

**Regression gate (not new tests — existing suites):** `InputSelect` and `FxChip` test files must pass unchanged after the Popover upgrade, proving the `anchor`-absent path is byte-for-byte identical.

---

## Section 8 — Demo

### States grid (6 cards, 220px wide each)

1. **Basic** — 4 plain items
2. **Icons + shortcuts** — Phosphor icons + shortcut strings right-aligned
3. **Mixed** — separator between two groups; one disabled, one checked, one danger item
4. **Near right edge** — opens at `x: window.innerWidth - 16` to force a leftward flip
5. **Near bottom edge** — opens at `y: window.innerHeight - 16` to force an upward flip
6. **Near corner** — opens at `{ x: window.innerWidth - 16, y: window.innerHeight - 16 }` to flip both axes

Edge-flip demos open at viewport-edge coordinates (not card position) so the flip actually triggers against the real viewport.

### Playground

A fake track-row surface where right-click opens the live menu at the cursor. Uses `useContextMenu()`. Kit controls (Toggle, Fader): toggle item `disabled` / `checked` / `danger`; vary item count (3–8).

### DemoMeta

```ts
export const meta: DemoMeta = {
  name:  'ContextMenu',
  group: 'Primitives',
  route: '/context-menu',
  order: 9,
}
```

---

## Done =

`ContextMenu` opens at the cursor on right-click as a recessed stage-tone menu; items support icons, shortcuts, separators, disabled (focusable, APG-compliant), checkable, and destructive; full `role="menu"` + roving keyboard (↑↓ Home/End Enter/Space Tab Escape) + outside-click close; reuses the shared `Popover` shell upgraded with portal + viewport-flip (no clipping, flips at edges, closes on scroll/resize); InputSelect and FxChip stay green after the Popover upgrade; reduced-motion respected; reskins across themes via `--danger` token; `typecheck` / `lint` / `test` green.
