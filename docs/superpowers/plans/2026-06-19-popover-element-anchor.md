# Popover Element-Anchor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `anchorRef` to `Popover` so trigger-anchored dropdowns (`InputSelect`, `FxChip`) portal into the themed mount and escape `overflow: hidden` ancestors, while the point-anchor / ContextMenu path stays unchanged.

**Architecture:** Three tasks in dependency order — write failing tests first (TDD), then implement the element-anchor branch in `Popover` while collapsing CSS to one class, then migrate both consumers; a final task adds the dev guard after both consumers are migrated (guard can't land first or their tests throw). The no-anchor CSS-absolute branch is deleted; passing neither prop is loud, not silent.

**Tech Stack:** React 18, TypeScript, Vite, Vitest + @testing-library/react, CSS Modules.

## Global Constraints

- All tests run with `npm test` (vitest). Typecheck runs with `npx tsc --noEmit`. No separate lint script exists.
- Dev guard uses `import.meta.env.DEV` (kit standard, NOT `process.env.NODE_ENV`).
- Portal target is `usePortalTarget() ?? document.body` — **never bare `document.body` without the fallback** — so themed consumers get `var(--stage)` etc.
- `position: fixed` + inline `left`/`top`/`minWidth` style — never inline `position: absolute`.
- `MARGIN = 4` (px) viewport clearance, unchanged from the point-anchor path.
- Capture-phase scroll listener (`{ capture: true }`) catches nested scrollers.
- `cancelAnimationFrame` in cleanup prevents stale rAF after unmount.
- No changes to InputSelect or FxChip keyboard, ARIA, or state logic — one added prop each.
- `returnFocusRef` stays in `PopoverProps` but Popover does not use it internally (consumers manage their own focus return in `closeMenu()`).

---

### Task 1: Add `anchorRef` to `PopoverProps` and write failing Popover tests

**Files:**
- Modify: `src/components/Popover/Popover.tsx` — add `anchorRef` field to interface only
- Create: `src/components/Popover/Popover.test.tsx` — 7 new tests

**Interfaces:**
- Produces: `Popover.test.tsx` with 7 tests (all failing at end of this task — implementation comes in Task 2 + 4)

- [ ] **Step 1: Add `anchorRef` to `PopoverProps` so tests compile**

In `src/components/Popover/Popover.tsx`, add the field to the interface only — no implementation change:

```ts
export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }
  anchorRef?:      React.RefObject<HTMLElement | null>   // ← add this line
}
```

- [ ] **Step 2: Create `Popover.test.tsx` with all 7 tests**

Create `src/components/Popover/Popover.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { Popover } from './Popover'

// jsdom default viewport: 1024 × 768

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Test 1: portal escape ─────────────────────────────────────────────────────

describe('Popover anchorRef — portal', () => {
  it('portals content outside an overflow:hidden ancestor', () => {
    const triggerEl = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    render(
      <div data-testid="clip" style={{ overflow: 'hidden' }}>
        <Popover
          containerRef={{ current: containerEl }}
          anchorRef={{ current: triggerEl }}
          onClose={vi.fn()}
        >
          <div data-testid="content">hello</div>
        </Popover>
      </div>,
    )

    const content  = screen.getByTestId('content')
    const clipDiv  = screen.getByTestId('clip')
    expect(clipDiv.contains(content)).toBe(false)
    expect(document.body.contains(content)).toBe(true)

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 2: position below trigger ───────────────────────────────────────────

describe('Popover anchorRef — position', () => {
  it('positions below trigger, aligns left, sets minWidth from trigger width', () => {
    const triggerEl  = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 50, bottom: 100, top: 80, width: 120, height: 20,
            right: 170, x: 50, y: 80, toJSON: () => ({}),
          } as DOMRect
        }
        // content div
        return {
          left: 0, top: 0, bottom: 50, right: 80, width: 80, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    // left=50 (trigger.left, no clamp needed)
    // top=102 (trigger.bottom 100 + 2px gap)
    // minWidth=120 (trigger.width)
    expect(shell.style.left).toBe('50px')
    expect(shell.style.top).toBe('102px')
    expect(shell.style.minWidth).toBe('120px')
    expect(shell.style.visibility).toBe('visible')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 3: flip up ───────────────────────────────────────────────────────────

describe('Popover anchorRef — flip', () => {
  it('flips up when menu would overflow bottom of viewport', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    const origH = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true, writable: true })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 50, bottom: 590, top: 570, width: 120, height: 20,
            right: 170, x: 50, y: 570, toJSON: () => ({}),
          } as DOMRect
        }
        // content: 100px tall — would overflow below (590+2+100+4 = 696 > 600)
        return {
          left: 0, top: 0, bottom: 100, right: 80, width: 80, height: 100,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    // flip up: top = triggerRect.top - menuH - 2 = 570 - 100 - 2 = 468
    expect(shell.style.top).toBe('468px')

    Object.defineProperty(window, 'innerHeight', { value: origH, configurable: true, writable: true })
    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 4: horizontal clamp ──────────────────────────────────────────────────

describe('Popover anchorRef — clamp', () => {
  it('clamps left edge to MARGIN (4px) when trigger overflows viewport left', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: -10, bottom: 30, top: 10, width: 80, height: 20,
            right: 70, x: -10, y: 10, toJSON: () => ({}),
          } as DOMRect
        }
        return {
          left: 0, top: 0, bottom: 50, right: 100, width: 100, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    // left=-10 → clamped to max(4, -10) = 4
    expect(shell.style.left).toBe('4px')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 5: rAF reposition on scroll ─────────────────────────────────────────

describe('Popover anchorRef — reposition', () => {
  it('repositions on scroll event via requestAnimationFrame', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    let rafCallback: FrameRequestCallback | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    // Initial position: left=50
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 50, bottom: 100, top: 80, width: 120, height: 20,
            right: 170, x: 50, y: 80, toJSON: () => ({}),
          } as DOMRect
        }
        return {
          left: 0, top: 0, bottom: 50, right: 80, width: 80, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    expect(shell.style.left).toBe('50px')

    // Update mock to new position: left=200
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 200, bottom: 100, top: 80, width: 120, height: 20,
            right: 320, x: 200, y: 80, toJSON: () => ({}),
          } as DOMRect
        }
        return {
          left: 0, top: 0, bottom: 50, right: 80, width: 80, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    fireEvent.scroll(window)

    // Advance rAF — fires the reposition callback
    act(() => { rafCallback?.(0) })

    expect(shell.style.left).toBe('200px')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 6: dev throw — both props ────────────────────────────────────────────

describe('Popover dev guard', () => {
  it('throws in dev when both anchor and anchorRef are passed', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    expect(() =>
      render(
        <Popover
          containerRef={{ current: containerEl }}
          anchor={{ x: 10, y: 10 }}
          anchorRef={{ current: triggerEl }}
          onClose={vi.fn()}
        >
          <div>hello</div>
        </Popover>,
      ),
    ).toThrow('Popover: pass anchor or anchorRef, not both')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })

  // ── Test 7: dev throw — neither prop ────────────────────────────────────────

  it('throws in dev when neither anchor nor anchorRef is passed', () => {
    const containerEl = document.createElement('div')
    document.body.appendChild(containerEl)

    expect(() =>
      render(
        <Popover
          containerRef={{ current: containerEl }}
          onClose={vi.fn()}
        >
          <div>hello</div>
        </Popover>,
      ),
    ).toThrow('Popover: one of anchor or anchorRef is required')

    document.body.removeChild(containerEl)
  })
})
```

- [ ] **Step 3: Run tests to confirm they all fail**

```bash
npm test -- --run src/components/Popover/Popover.test.tsx
```

Expected: **7 FAIL** — tests 1–5 fail because the element-anchor branch doesn't exist yet; tests 6–7 fail because the dev guard doesn't exist yet. Any import errors mean the interface change in Step 1 wasn't saved.

- [ ] **Step 4: Commit**

```bash
git add src/components/Popover/Popover.tsx src/components/Popover/Popover.test.tsx
git commit -m "test(Popover): failing tests for anchorRef portal branch + dev guard"
```

---

### Task 2: Implement element-anchor branch + collapse CSS

**Files:**
- Modify: `src/components/Popover/Popover.module.css` — collapse `.shell` + `.shellPortal` → single `.shell`
- Modify: `src/components/Popover/Popover.tsx` — `computeElementPosition`, element-anchor branch, update point-anchor branch

**Interfaces:**
- Consumes: `anchorRef?: React.RefObject<HTMLElement | null>` from Task 1
- Produces: fully functional `anchorRef` portal path; tests 1–5 pass; ContextMenu tests stay green

- [ ] **Step 1: Collapse CSS — replace the two classes with one**

Replace the entire contents of `src/components/Popover/Popover.module.css`:

```css
/* src/components/Popover/Popover.module.css */

/* Single portal class — both anchor paths use position:fixed.
   left / top / min-width come from the inline style set by Popover.tsx. */
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

- [ ] **Step 2: Rewrite `Popover.tsx` with full implementation**

Replace the entire file `src/components/Popover/Popover.tsx`:

```tsx
// src/components/Popover/Popover.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './Popover.module.css'

export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }
  anchorRef?:      React.RefObject<HTMLElement | null>
}

const MARGIN = 4

// Point-anchor position: place menu at (anchorX, anchorY), flip + clamp to viewport.
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

// Element-anchor position: align to trigger bottom-left; flip up; clamp to viewport.
function computeElementPosition(
  triggerRect: DOMRect,
  menuW:       number,
  menuH:       number,
): { left: number; top: number; minWidth: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = triggerRect.left
  let top  = triggerRect.bottom + 2   // 2px gap — matches old CSS top: calc(100% + 2px)

  if (top + menuH + MARGIN > vh) top = triggerRect.top - menuH - 2

  left = Math.max(MARGIN, Math.min(left, vw - menuW - MARGIN))
  top  = Math.max(MARGIN, Math.min(top,  vh - menuH - MARGIN))

  return { left, top, minWidth: triggerRect.width }
}

export function Popover({
  containerRef,
  onClose,
  children,
  className,
  anchor,
  anchorRef,
}: PopoverProps) {
  const contentRef  = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; minWidth?: number } | null>(null)
  const portalTarget  = usePortalTarget()

  // Outside-click: close when mousedown is outside both containerRef AND contentRef.
  // The second check is essential for portaled content — the portaled div is not a
  // DOM descendant of containerRef, so without it every click inside would dismiss it.
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

  // Point-anchor: close on scroll/resize — a stale point is worse than a closed menu.
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

  // Point-anchor: measure + position. Deps are raw coords, not the anchor object,
  // because anchor is created inline on every render (new reference each time).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!anchor || !contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    setPos(computePosition(anchor.x, anchor.y, rect.width, rect.height))
  }, [anchor?.x, anchor?.y])

  // Element-anchor: initial measure + position in one pass — never paints at (0,0).
  useLayoutEffect(() => {
    if (!anchorRef?.current || !contentRef.current) return
    const tRect = anchorRef.current.getBoundingClientRect()
    const cRect = contentRef.current.getBoundingClientRect()
    setPos(computeElementPosition(tRect, cRect.width, cRect.height))
  }, [anchorRef])

  // Element-anchor: rAF-throttled reposition on scroll/resize.
  // One rAF per frame regardless of how many scroll events the browser dispatches.
  useEffect(() => {
    if (!anchorRef) return
    let rafId: number | null = null

    function schedule() {
      if (rafId !== null) return          // already queued — drop extra events
      rafId = requestAnimationFrame(() => {
        rafId = null
        const trigger = anchorRef!.current
        const content = contentRef.current
        if (!trigger || !content) return
        const tRect = trigger.getBoundingClientRect()
        const cRect = content.getBoundingClientRect()
        setPos(computeElementPosition(tRect, cRect.width, cRect.height))
      })
    }

    window.addEventListener('scroll', schedule, { capture: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [anchorRef])

  const shellClass = className ? `${styles.shell} ${className}` : styles.shell

  // `minWidth: undefined` is silently dropped by React — no style attribute emitted.
  const style: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, minWidth: pos.minWidth, visibility: 'visible' }
    : { visibility: 'hidden' }

  return createPortal(
    <div ref={contentRef} className={shellClass} style={style}>
      {children}
    </div>,
    portalTarget ?? document.body,
  )
}
```

- [ ] **Step 3: Run Popover tests — expect 5 pass, 2 fail**

```bash
npm test -- --run src/components/Popover/Popover.test.tsx
```

Expected: tests 1–5 **PASS**, tests 6–7 **FAIL** (`throws in dev when both…` / `throws in dev when neither…`). The guard lands in Task 4.

- [ ] **Step 4: Run ContextMenu tests — they must stay green**

```bash
npm test -- --run src/components/ContextMenu/ContextMenu.test.tsx
```

Expected: **20 PASS** — proves the point-anchor path is unaffected by the CSS collapse and the unified `createPortal` call.

- [ ] **Step 5: Commit**

```bash
git add src/components/Popover/Popover.module.css src/components/Popover/Popover.tsx
git commit -m "feat(Popover): element-anchor portal branch + CSS collapse to single .shell"
```

---

### Task 3: Migrate `InputSelect` and `FxChip` to `anchorRef`

**Files:**
- Modify: `src/components/InputSelect/InputSelect.tsx` — add `anchorRef={triggerRef}`
- Modify: `src/components/FxChip/FxChip.tsx` — add `anchorRef={triggerRef}`

**Interfaces:**
- Consumes: `anchorRef` prop from Task 2
- Produces: both consumers portaled; their existing test suites stay green

- [ ] **Step 1: Migrate InputSelect**

In `src/components/InputSelect/InputSelect.tsx`, find the `<Popover>` block (line ~121) and add `anchorRef`:

```tsx
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
        >
          <ListboxPopover
            id={listboxId}
            options={options}
            selectedId={value}
            activeId={activeId}
            onSelect={handleSelect}
          />
        </Popover>
      )}
```

`containerRef` stays — the outside-click handler needs it to recognise clicks on the root div (which wraps the trigger) as "inside."

- [ ] **Step 2: Run InputSelect tests**

```bash
npm test -- --run src/components/InputSelect/InputSelect.test.tsx
```

Expected: **all pass** (exact same count as before — no test added or removed). If any fail, the Popover element-anchor implementation has a regression.

- [ ] **Step 3: Migrate FxChip**

In `src/components/FxChip/FxChip.tsx`, find the `<Popover>` block inside `FxChip` (line ~359) and add `anchorRef`:

```tsx
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
        >
          <ChainEditor
            plugins={plugins}
            chainEnabled={chainEnabled}
            onToggleChain={onToggleChain}
            onTogglePlugin={onTogglePlugin}
            onReorder={onReorder}
            onRemove={onRemove}
            onAdd={onAdd}
            masterLedRef={masterLedRef}
          />
        </Popover>
      )}
```

- [ ] **Step 4: Run FxChip tests**

```bash
npm test -- --run src/components/FxChip/FxChip.test.tsx
```

Expected: **all pass**.

- [ ] **Step 5: Commit**

```bash
git add src/components/InputSelect/InputSelect.tsx src/components/FxChip/FxChip.tsx
git commit -m "feat(InputSelect,FxChip): migrate to anchorRef — dropdowns now portal out of overflow"
```

---

### Task 4: Add dev guard + full suite verification

**Files:**
- Modify: `src/components/Popover/Popover.tsx` — add `import.meta.env.DEV` guard

**Interfaces:**
- Consumes: migrated consumers from Task 3 (both pass `anchorRef` — guard won't throw for them)
- Produces: all 7 Popover tests green; full suite green; typecheck clean

- [ ] **Step 1: Add the dev guard to `Popover.tsx`**

Open `src/components/Popover/Popover.tsx`. Locate the `Popover` function. The destructuring pattern ends with `}: PopoverProps) {`. Immediately after that line — before the first `const contentRef` — insert the guard block. The top of the function should look exactly like this after the edit:

```tsx
export function Popover({
  containerRef,
  onClose,
  children,
  className,
  anchor,
  anchorRef,
}: PopoverProps) {
  if (import.meta.env.DEV) {
    if (anchor && anchorRef)
      throw new Error('Popover: pass anchor or anchorRef, not both')
    if (!anchor && !anchorRef)
      throw new Error('Popover: one of anchor or anchorRef is required')
  }

  const contentRef  = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; minWidth?: number } | null>(null)
  const portalTarget  = usePortalTarget()
  // ... (all useEffect / useLayoutEffect hooks from Task 2 follow here, unchanged)
```

The 6-line `if (import.meta.env.DEV) { … }` block is the only insertion. Nothing else in the file changes.

- [ ] **Step 2: Run Popover tests — all 7 must pass**

```bash
npm test -- --run src/components/Popover/Popover.test.tsx
```

Expected: **7 PASS**. Tests 6 and 7 (dev throws) now pass because the guard is in place. Vitest runs with `import.meta.env.DEV === true`.

- [ ] **Step 3: Run the full test suite**

```bash
npm test -- --run
```

Expected: **all pass** — Popover (7), ContextMenu (20), InputSelect (all), FxChip (all). If any consumer test throws `"Popover: one of anchor or anchorRef is required"`, it means that consumer's `<Popover>` call is still missing `anchorRef` — go back to Task 3.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: **0 errors**. Common issues and fixes:
- `anchorRef!.current` in the rAF handler — the `!` is correct because the `if (!anchorRef) return` guard at the top of the `useEffect` ensures `anchorRef` is defined when `schedule` is invoked.
- `minWidth: pos.minWidth` — `minWidth?: number` in the `pos` type; `undefined` is a valid `CSSProperties` value (React drops it from the style attribute).

- [ ] **Step 5: Commit**

```bash
git add src/components/Popover/Popover.tsx
git commit -m "feat(Popover): dev guard — exactly one of anchor/anchorRef required"
```
