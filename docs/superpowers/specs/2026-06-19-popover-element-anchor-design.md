# Popover Element-Anchor Design Spec

**Date:** 2026-06-19
**Status:** Approved

## Goal

Portal the trigger-anchored `Popover` path so `InputSelect` and `FxChip` dropdowns escape `overflow: hidden`
ancestors (e.g. `TrackHeader`). Adds `anchorRef` to `Popover`, deletes the CSS-absolute no-anchor branch,
migrates both consumers. The point-anchor / ContextMenu path is unchanged.

---

## Section 1 — Files changed

```
src/components/Popover/Popover.tsx          ← add anchorRef branch, delete no-anchor branch, dev guard
src/components/Popover/Popover.module.css   ← collapse .shell + .shellPortal → single .shell
src/components/Popover/Popover.test.tsx     ← new (7 tests)
src/components/InputSelect/InputSelect.tsx  ← add anchorRef={triggerRef}
src/components/FxChip/FxChip.tsx           ← add anchorRef={triggerRef}
```

No changes to InputSelect or FxChip CSS, keyboard, or ARIA.

---

## Section 2 — Popover API

### Updated interface

```ts
export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }             // point-anchor — ContextMenu
  anchorRef?:      React.RefObject<HTMLElement | null>  // element-anchor — InputSelect, FxChip
}
```

### Dev guard — exactly one prop required

```ts
if (import.meta.env.DEV) {
  if (anchor && anchorRef)
    throw new Error('Popover: pass anchor or anchorRef, not both')
  if (!anchor && !anchorRef)
    throw new Error('Popover: one of anchor or anchorRef is required')
}
```

Passing both or neither throws in dev. In production the guard is compiled away.

### Shared machinery (both portaled paths)

- `contentRef = useRef<HTMLDivElement>(null)` — attached to the portaled root div
- **Outside-click:** checks `containerRef.current?.contains(target) || contentRef.current?.contains(target)`
  — same dual-check the point-anchor path already uses so portal clicks are not treated as outside
- **Escape key:** `document.addEventListener('keydown', ...)` → `onClose()` — shared

---

## Section 3 — Point-anchor path (`anchor` prop)

Behaviour is byte-for-byte identical to the ContextMenu task. The only mechanical change: it now applies
`styles.shell` (singular) because `.shell` and `.shellPortal` collapse into one class (see Section 5).

- Initial render: `visibility: hidden`
- `useLayoutEffect` (deps `[anchor.x, anchor.y]`): reads `contentRef.current.getBoundingClientRect()`, runs
  `computePosition(anchor.x, anchor.y, w, h)`, sets `pos` state, clears `visibility`
- Scroll/resize: **close** (not reposition) — a stale point is worse than a closed menu

---

## Section 4 — Element-anchor path (`anchorRef` prop)

### Flash prevention

Initial render is `visibility: hidden`. Position and `visibility: visible` are set together in the same
`useLayoutEffect` pass — the element never paints at `(0, 0)` or any default position before measurement.

```ts
const [pos, setPos] = useState<{ left: number; top: number; minWidth: number } | null>(null)

// deps: anchorRef identity — fires once on mount (ref is stable)
useLayoutEffect(() => {
  if (!anchorRef?.current || !contentRef.current) return
  const tRect = anchorRef.current.getBoundingClientRect()
  const cRect = contentRef.current.getBoundingClientRect()
  setPos(computeElementPosition(tRect, cRect.width, cRect.height))
}, [anchorRef])

const style: React.CSSProperties = pos
  ? { left: pos.left, top: pos.top, minWidth: pos.minWidth, visibility: 'visible' }
  : { visibility: 'hidden' }
```

### Position formula

```ts
const MARGIN = 4  // px clearance from every viewport edge

function computeElementPosition(
  triggerRect: DOMRect,
  menuW: number,
  menuH: number,
): { left: number; top: number; minWidth: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = triggerRect.left
  let top  = triggerRect.bottom + 2   // 2px gap — matches old CSS top: calc(100% + 2px)

  // Flip up when no room below
  if (top + menuH + MARGIN > vh) top = triggerRect.top - menuH - 2

  // Clamp to viewport
  left = Math.max(MARGIN, Math.min(left, vw - menuW - MARGIN))
  top  = Math.max(MARGIN, Math.min(top,  vh - menuH - MARGIN))

  return { left, top, minWidth: triggerRect.width }
}
```

- `left = triggerRect.left` — aligns dropdown to trigger's left edge
- `top = triggerRect.bottom + 2` — opens just below trigger, identical gap to the CSS-absolute path
- `minWidth = triggerRect.width` — dropdown is at least as wide as the trigger (matches old `min-width: 100%`)
- Flip up when `top + menuH + MARGIN > vh`
- Horizontal clamp keeps the dropdown inside the viewport

### rAF-throttled reposition on scroll/resize

Element-anchor **repositions** (not closes) on scroll/resize, because the anchor is a live element that moves
with its scroll context.

```ts
useEffect(() => {
  if (!anchorRef) return
  let rafId: number | null = null

  function schedule() {
    if (rafId !== null) return          // already queued — drop extra events in same frame
    rafId = requestAnimationFrame(() => {
      rafId = null
      const trigger = anchorRef.current
      const content = contentRef.current
      if (!trigger || !content) return
      const tRect = trigger.getBoundingClientRect()
      const cRect = content.getBoundingClientRect()
      setPos(computeElementPosition(tRect, cRect.width, cRect.height))
    })
  }

  window.addEventListener('scroll', schedule, { capture: true })  // capture catches nested scrollers
  window.addEventListener('resize', schedule)
  return () => {
    window.removeEventListener('scroll', schedule, { capture: true })
    window.removeEventListener('resize', schedule)
    if (rafId !== null) cancelAnimationFrame(rafId)  // prevent stale rAF after unmount
  }
}, [anchorRef])
```

One rAF fires per animation frame regardless of how many scroll events the browser dispatches.

### Portal target — themed mount, not bare body

```ts
const portalTarget = usePortalTarget()
// ...
createPortal(<div ref={contentRef} ...>{children}</div>, portalTarget ?? document.body)
```

**Must use `usePortalTarget()`** — the ThemeProvider renders a portal root inside its token scope. Portaling to
bare `document.body` would drop InputSelect/FxChip out of the theme-token scope and their surfaces (`var(--stage)`
etc.) would not resolve. This is the same fix ContextMenu required.

---

## Section 5 — CSS changes

The CSS-absolute `.shell` declarations and `.shellPortal` override are gone. Both portaled paths use one class:

```css
/* Popover.module.css */
.shell {
  position: fixed;
  z-index: 1000;
  animation: popover-in var(--dur-fast) var(--ease-out) both;
}

@keyframes popover-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

`left` / `top` / `min-width` come from the inline `style` prop on the portaled div. `z-index: 1000` was already
on `.shellPortal`; it now applies to both paths.

---

## Section 6 — Consumer migrations

### InputSelect

```tsx
// before
<Popover
  containerRef={containerRef as React.RefObject<HTMLElement>}
  returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
  onClose={closeMenu}
>

// after — one line added
<Popover
  containerRef={containerRef as React.RefObject<HTMLElement>}
  returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
  anchorRef={triggerRef as React.RefObject<HTMLElement>}
  onClose={closeMenu}
>
```

### FxChip

```tsx
// before
<Popover
  containerRef={containerRef as React.RefObject<HTMLElement>}
  returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
  onClose={closeMenu}
>

// after — one line added
<Popover
  containerRef={containerRef as React.RefObject<HTMLElement>}
  returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
  anchorRef={triggerRef as React.RefObject<HTMLElement>}
  onClose={closeMenu}
>
```

`containerRef` stays — the outside-click handler still needs it to recognise clicks on the trigger as "inside."

---

## Section 7 — Tests

### Regression gate (existing suites — zero changes)

`InputSelect.test.tsx`, `FxChip.test.tsx`, and `ContextMenu.test.tsx` pass unchanged. These prove:
- Consumer migration didn't change observable behaviour
- Point-anchor (ContextMenu) path is unaffected

### New: `Popover.test.tsx` (7 tests)

| # | Test |
|---|---|
| 1 | **No-clip / portal:** render Popover with `anchorRef` inside a `div` with `overflow: hidden`; assert portaled div is a child of the portal target (body or ThemeProvider mount), not of the overflow container |
| 2 | **Opens below trigger:** mock `anchorRef.current.getBoundingClientRect()` → `{left:50, bottom:100, top:80, width:120}`; assert `style.left = "50px"`, `style.top = "102px"`, `style.minWidth = "120px"` |
| 3 | **Flip up:** trigger rect `{bottom: 590, top: 570}`, `window.innerHeight = 600`, menu height 100 → assert `top = 570 - 100 - 2 = 468` (opens above) |
| 4 | **Clamp horizontal:** trigger `left: -10`, menu width 100 → `left` clamped to `MARGIN` (4px) |
| 5 | **rAF reposition on scroll:** open with one rect, fire `scroll` event, update mock rect, advance rAF; assert `pos` updated to new coordinates |
| 6 | **Dev throw — both props:** passing `anchor` + `anchorRef` throws in test env |
| 7 | **Dev throw — neither prop:** passing neither throws |

---

## Done =

`Popover` requires exactly one of `anchor` or `anchorRef` (dev throws on both or neither); the CSS-absolute
no-anchor branch is deleted; `anchorRef` portals into the ThemeProvider themed mount, renders hidden until
measured in the same `useLayoutEffect` pass, positions at trigger's bottom-left with `minWidth = triggerRect.width`,
flips up when space is short, clamps to viewport, and repositions rAF-throttled on scroll/resize (point-anchor
path continues to close); `InputSelect` and `FxChip` migrated with one added prop each — dropdowns visually
identical but no longer clipped; `.shell` + `.shellPortal` collapsed to a single `.shell`; three existing suites
green; seven new tests cover portal, position, flip, clamp, reposition, and both dev guards.
