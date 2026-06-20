# EditCursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `EditCursor` primitive — a stationary, keyboard/drag-interactive timeline marker that shows where playback starts and where edits, paste, and new recordings land.

**Architecture:** Zero-width absolute root (Playhead geometry), position written via push-only `useEffect` + DPR-snap, no rAF. Handle is a two-element structure: unclipped `handleWrap` (role="slider", focus ring, events) wrapping a `clip-path` triangle `.handle` (aria-hidden). Drag uses pointer capture with a two-point inverse projection from `secondsToX`. No `secondsToXRef` — park effect calls `secondsToX` directly with it in deps.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest 4, `@testing-library/react` 16, `@testing-library/jest-dom` 6

## Global Constraints

- CSS Modules only — token refs only for colors; `--ec-line` aliases `--text-dim`, `--ec-handle` aliases `--text-muted`
- No new entries in `src/tokens/types.ts` or any theme file
- **No `requestAnimationFrame`** anywhere in this component (push-only)
- `z-index: 49` on root — one below Playhead's `z-index: 50`
- Explicit Vitest imports in test files: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`
- TypeScript `noUnusedLocals` and `noUnusedParameters` are `true` — prefix unused params with `_`
- Verify green before every commit: `npx tsc --noEmit && npx vitest run`
- Spec: `docs/superpowers/specs/2026-06-20-edit-cursor-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/components/EditCursor/EditCursor.tsx` | Component + `formatTime` helper |
| `src/components/EditCursor/EditCursor.module.css` | All visual styling |
| `src/components/EditCursor/index.ts` | Barrel export |
| `src/components/EditCursor/EditCursor.test.tsx` | All tests |
| `src/components/EditCursor/EditCursor.demo.tsx` | Gallery demo |

---

### Task 1: Scaffold + Rendering + ARIA

**Files:**
- Create: `src/components/EditCursor/EditCursor.tsx`
- Create: `src/components/EditCursor/EditCursor.module.css`
- Create: `src/components/EditCursor/index.ts`
- Create: `src/components/EditCursor/EditCursor.test.tsx`

**Interfaces:**
- Produces: `EditCursor(props: EditCursorProps)` and `EditCursorProps` — consumed by all later tasks and the demo

---

- [ ] **Step 1.1 — Create the stub files**

`src/components/EditCursor/EditCursor.module.css` — empty file to satisfy CSS Module import:
```css
/* EditCursor.module.css — filled in Task 5 */
.root {}
.line {}
.handleWrap {}
.handle {}
```

`src/components/EditCursor/index.ts`:
```ts
export { EditCursor } from './EditCursor'
export type { EditCursorProps } from './EditCursor'
```

`src/components/EditCursor/EditCursor.tsx` — minimal stub (renders one div; enough to compile):
```tsx
import styles from './EditCursor.module.css'

export interface EditCursorProps {
  seconds: number
  secondsToX: (s: number) => number
  durationSeconds?: number
  onSeek: (seconds: number) => void
  disabled?: boolean
  'aria-label'?: string
  step?: number
  largeStep?: number
}

export function EditCursor(_props: EditCursorProps) {
  return <div className={styles.root} data-testid="edit-cursor-root" />
}
```

- [ ] **Step 1.2 — Write the failing tests**

`src/components/EditCursor/EditCursor.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditCursor } from './EditCursor'

const noop = () => {}
const identity = (s: number) => s * 10

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('EditCursor rendering', () => {
  it('renders root with data-testid="edit-cursor-root"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-root')).not.toBeNull()
  })

  it('renders line with data-testid="edit-cursor-line"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-line')).not.toBeNull()
  })

  it('renders handleWrap with data-testid="edit-cursor-handle-wrap"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap')).not.toBeNull()
  })

  it('renders handle with data-testid="edit-cursor-handle"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle')).not.toBeNull()
  })

  it('handle is a child of handleWrap', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    const handle = screen.getByTestId('edit-cursor-handle')
    expect(wrap.contains(handle)).toBe(true)
  })
})

// ─── Structural focus-ring guard ──────────────────────────────────────────────
// These two tests pin the handleWrap/clip-path separation so that moving
// role/tabIndex back onto the clipped element re-clips the focus ring and
// breaks the tests — the regression we explicitly designed out.

describe('EditCursor structural focus-ring guard', () => {
  it('handleWrap carries role="slider" (the focusable, unclipped element)', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    expect(wrap).toHaveAttribute('role', 'slider')
  })

  it('handle (clip-path child) is aria-hidden', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    const handle = screen.getByTestId('edit-cursor-handle')
    expect(handle).toHaveAttribute('aria-hidden', 'true')
  })
})

// ─── ARIA ─────────────────────────────────────────────────────────────────────

describe('EditCursor ARIA', () => {
  it('aria-valuemin=0', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuemin', '0')
  })

  it('aria-valuemax=durationSeconds when provided', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} durationSeconds={120} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuemax', '120')
  })

  it('aria-valuemax=3600 when durationSeconds absent', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuemax', '3600')
  })

  it('aria-valuenow=seconds', () => {
    render(<EditCursor seconds={7} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuenow', '7')
  })

  it('aria-valuetext is a human-readable formatted string, not just the raw number', () => {
    render(<EditCursor seconds={4} secondsToX={identity} onSeek={noop} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    const text = wrap.getAttribute('aria-valuetext')
    expect(text).not.toBe('4')
    expect(text).toBe('0:04.0')
  })

  it('aria-label defaults to "Edit cursor"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-label', 'Edit cursor')
  })

  it('aria-label uses provided value', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} aria-label="Loop start" />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-label', 'Loop start')
  })

  it('tabIndex=0 by default', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('tabindex', '0')
  })

  it('tabIndex=-1 and aria-disabled when disabled', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} disabled />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    expect(wrap).toHaveAttribute('tabindex', '-1')
    expect(wrap).toHaveAttribute('aria-disabled', 'true')
  })
})
```

- [ ] **Step 1.3 — Run tests to confirm they fail**

```bash
npx vitest run src/components/EditCursor/EditCursor.test.tsx
```

Expected: most tests fail with "Cannot find element" or attribute-not-present errors. The root render test may pass (stub renders a root div), but line/handleWrap/handle/aria tests will fail.

- [ ] **Step 1.4 — Implement the component**

Replace `src/components/EditCursor/EditCursor.tsx` entirely:

```tsx
import { useEffect, useRef } from 'react'
import styles from './EditCursor.module.css'

export interface EditCursorProps {
  seconds: number
  secondsToX: (s: number) => number
  durationSeconds?: number
  onSeek: (seconds: number) => void
  disabled?: boolean
  'aria-label'?: string
  step?: number
  largeStep?: number
}

function formatTime(s: number): string {
  const m    = Math.floor(s / 60)
  const sec  = String(Math.floor(s % 60)).padStart(2, '0')
  const frac = Math.floor((s % 1) * 10)
  return `${m}:${sec}.${frac}`
}

export function EditCursor({
  seconds,
  secondsToX,
  durationSeconds,
  onSeek,
  disabled = false,
  'aria-label': ariaLabel = 'Edit cursor',
  step      = 1.0,
  largeStep = 10.0,
}: EditCursorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startClientX: number
    startSeconds: number
    pxPerSecond: number
  } | null>(null)

  const max = durationSeconds ?? 3600

  function clamp(v: number): number {
    return Math.max(0, Math.min(v, max))
  }

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const dpr = window.devicePixelRatio || 1
    const x   = Math.round(secondsToX(seconds) * dpr) / dpr
    el.style.transform = `translateX(${x}px)`
  }, [seconds, secondsToX])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight': next = clamp(seconds + step);      break
      case 'ArrowLeft':  next = clamp(seconds - step);      break
      case 'PageUp':     next = clamp(seconds + largeStep); break
      case 'PageDown':   next = clamp(seconds - largeStep); break
      case 'Home':       next = 0;                          break
      case 'End':        next = max;                        break
      default:           return
    }
    e.preventDefault()
    onSeek(next)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pxPerSecond = secondsToX(1) - secondsToX(0)
    if (pxPerSecond === 0) return
    dragRef.current = { startClientX: e.clientX, startSeconds: seconds, pxPerSecond }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !dragRef.current) return
    const { startClientX, startSeconds, pxPerSecond } = dragRef.current
    const deltaSeconds = (e.clientX - startClientX) / pxPerSecond
    onSeek(clamp(startSeconds + deltaSeconds))
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="edit-cursor-root"
      data-disabled={disabled || undefined}
    >
      <div className={styles.line} data-testid="edit-cursor-line" />
      <div
        className={styles.handleWrap}
        data-testid="edit-cursor-handle-wrap"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={seconds}
        aria-valuetext={formatTime(seconds)}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className={styles.handle} data-testid="edit-cursor-handle" aria-hidden="true" />
      </div>
    </div>
  )
}
```

- [ ] **Step 1.5 — Run tests to confirm they pass**

```bash
npx vitest run src/components/EditCursor/EditCursor.test.tsx
```

Expected: all tests in the rendering, structural guard, and ARIA suites pass.

- [ ] **Step 1.6 — Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.7 — Commit**

```bash
git add src/components/EditCursor/
git commit -m "feat(EditCursor): scaffold — interface, DOM structure, ARIA"
```

---

### Task 2: Park Channel

**Files:**
- Modify: `src/components/EditCursor/EditCursor.test.tsx` — add park channel suite

**Interfaces:**
- Consumes: `EditCursor` from Task 1
- The park effect is already implemented in Task 1; these tests pin it against regression

---

- [ ] **Step 2.1 — Write failing park channel tests**

First, update the existing vitest import at the top of `EditCursor.test.tsx` to add `vi, beforeEach, afterEach`:
```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

Then append to the file:

```tsx
// ─── Park channel ─────────────────────────────────────────────────────────────
// DPR = 1 in jsdom so Math.round(x * 1) / 1 = x — no rounding complication.

describe('EditCursor park channel', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn())
    vi.stubGlobal('cancelAnimationFrame',  vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('writes translateX on mount from seconds + secondsToX', () => {
    render(<EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />)
    const el = screen.getByTestId('edit-cursor-root') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')
  })

  it('re-parks when seconds prop changes', () => {
    const { rerender } = render(
      <EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />
    )
    const el = screen.getByTestId('edit-cursor-root') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')

    rerender(<EditCursor seconds={12} secondsToX={s => s * 10} onSeek={noop} />)
    expect(el.style.transform).toBe('translateX(120px)')
  })

  it('re-parks when secondsToX reference changes (zoom)', () => {
    const { rerender } = render(
      <EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />
    )
    const el = screen.getByTestId('edit-cursor-root') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')

    rerender(<EditCursor seconds={5} secondsToX={s => s * 20} onSeek={noop} />)
    expect(el.style.transform).toBe('translateX(100px)')
  })

  it('does not start a requestAnimationFrame loop', () => {
    const rafSpy = vi.fn()
    vi.stubGlobal('requestAnimationFrame', rafSpy)
    render(<EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />)
    expect(rafSpy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2.2 — Run to confirm tests pass (they should — park effect is already implemented)**

```bash
npx vitest run src/components/EditCursor/EditCursor.test.tsx
```

Expected: all park channel tests pass. If any fail, check that the `useEffect` in `EditCursor.tsx` correctly lists `[seconds, secondsToX]` in its deps array and calls `secondsToX(seconds)` directly (not via a ref).

- [ ] **Step 2.3 — Commit**

```bash
git add src/components/EditCursor/EditCursor.test.tsx
git commit -m "test(EditCursor): park channel — translateX write, zoom re-park, no rAF"
```

---

### Task 3: Keyboard Interaction

**Files:**
- Modify: `src/components/EditCursor/EditCursor.test.tsx` — add keyboard suite

**Interfaces:**
- Consumes: `EditCursor` from Task 1 (keyboard handler already implemented)

---

- [ ] **Step 3.1 — Write keyboard tests**

First, update the two import lines at the top of `EditCursor.test.tsx`:

```tsx
// add fireEvent to the RTL import:
import { render, screen, fireEvent } from '@testing-library/react'

// add EditCursorProps to the component import:
import { EditCursor, type EditCursorProps } from './EditCursor'
```

Then append to the file:

```tsx
// ─── Keyboard interaction ─────────────────────────────────────────────────────

describe('EditCursor keyboard', () => {
  function setup(seconds: number, opts: Partial<EditCursorProps> = {}) {
    const onSeek = vi.fn()
    render(
      <EditCursor
        seconds={seconds}
        secondsToX={s => s * 10}
        onSeek={onSeek}
        durationSeconds={30}
        step={1}
        largeStep={5}
        {...opts}
      />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    return { onSeek, wrap }
  }

  it('ArrowRight fires onSeek(seconds + step)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(11)
  })

  it('ArrowLeft fires onSeek(seconds - step)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(9)
  })

  it('PageUp fires onSeek(seconds + largeStep)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'PageUp' })
    expect(onSeek).toHaveBeenCalledWith(15)
  })

  it('PageDown fires onSeek(seconds - largeStep)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'PageDown' })
    expect(onSeek).toHaveBeenCalledWith(5)
  })

  it('Home fires onSeek(0)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'Home' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('End fires onSeek(durationSeconds)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'End' })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('End fires onSeek(3600) when durationSeconds absent', () => {
    const onSeek = vi.fn()
    render(<EditCursor seconds={0} secondsToX={s => s * 10} onSeek={onSeek} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.keyDown(wrap, { key: 'End' })
    expect(onSeek).toHaveBeenCalledWith(3600)
  })

  it('ArrowRight clamps to max at upper boundary', () => {
    const { onSeek, wrap } = setup(29)   // 29 + 1 = 30 = max
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(30)

    onSeek.mockClear()
    // At max, ArrowRight stays at max
    const { onSeek: onSeek2, wrap: wrap2 } = setup(30)
    fireEvent.keyDown(wrap2, { key: 'ArrowRight' })
    expect(onSeek2).toHaveBeenCalledWith(30)
  })

  it('ArrowLeft clamps to 0 at lower boundary', () => {
    const { onSeek, wrap } = setup(0)
    fireEvent.keyDown(wrap, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('PageUp clamps to max', () => {
    const { onSeek, wrap } = setup(28)  // 28 + 5 = 33 → clamped to 30
    fireEvent.keyDown(wrap, { key: 'PageUp' })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('PageDown clamps to 0', () => {
    const { onSeek, wrap } = setup(2)   // 2 - 5 = -3 → clamped to 0
    fireEvent.keyDown(wrap, { key: 'PageDown' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })
})

// ─── Disabled — keyboard no-op ────────────────────────────────────────────────

describe('EditCursor disabled keyboard no-op', () => {
  function setupDisabled() {
    const onSeek = vi.fn()
    render(
      <EditCursor
        seconds={10}
        secondsToX={s => s * 10}
        onSeek={onSeek}
        durationSeconds={30}
        disabled
      />
    )
    return { onSeek, wrap: screen.getByTestId('edit-cursor-handle-wrap') }
  }

  it('ArrowRight fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('PageUp fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'PageUp' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('Home fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'Home' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('End fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'End' })
    expect(onSeek).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3.2 — Run tests**

```bash
npx vitest run src/components/EditCursor/EditCursor.test.tsx
```

Expected: all keyboard tests pass. If they fail, check that `handleKeyDown` uses `switch (e.key)` with exact string matches and calls `e.preventDefault()` before returning.

- [ ] **Step 3.3 — Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3.4 — Commit**

```bash
git add src/components/EditCursor/EditCursor.test.tsx
git commit -m "test(EditCursor): keyboard — arrow/page nudge, clamp at boundaries, disabled no-op"
```

---

### Task 4: Drag Interaction

**Files:**
- Modify: `src/components/EditCursor/EditCursor.test.tsx` — add drag suite

**Interfaces:**
- Consumes: `EditCursor` from Task 1 (drag handlers already implemented)

---

- [ ] **Step 4.1 — Write drag tests**

Append to `src/components/EditCursor/EditCursor.test.tsx`:

```tsx
// ─── Drag interaction ─────────────────────────────────────────────────────────
//
// secondsToX = s => s * 20  →  pxPerSecond = secondsToX(1) - secondsToX(0) = 20
// Move 40px right from startClientX=100 → deltaSeconds = 40/20 = 2
// startSeconds=5 → result = 7

describe('EditCursor drag', () => {
  const secondsToX = (s: number) => s * 20  // 20 px/s; pxPerSecond = 20

  it('pointerdown calls setPointerCapture with the pointerId', () => {
    render(
      <EditCursor seconds={5} secondsToX={secondsToX} onSeek={noop} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    const captureSpy = vi.spyOn(wrap, 'setPointerCapture').mockImplementation(() => {})
    fireEvent.pointerDown(wrap, { pointerId: 42, clientX: 100 })
    expect(captureSpy).toHaveBeenCalledWith(42)
  })

  it('pointermove fires onSeek derived from two-point scale', () => {
    const onSeek = vi.fn()
    render(
      <EditCursor seconds={5} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    // pxPerSecond = 20(1) - 20(0) = 20; start=5, move 40px → +2s → 7
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 140 })
    expect(onSeek).toHaveBeenCalledWith(7)
  })

  it('drag result clamps to max', () => {
    const onSeek = vi.fn()
    render(
      // seconds=29, move 80px right → +4s = 33 → clamped to 30
      <EditCursor seconds={29} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 0 })
    fireEvent.pointerMove(wrap, { clientX: 80 })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('drag result clamps to 0', () => {
    const onSeek = vi.fn()
    render(
      // seconds=1, move 60px left → -3s = -2 → clamped to 0
      <EditCursor seconds={1} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 40 })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('pointerup stops onSeek calls', () => {
    const onSeek = vi.fn()
    render(
      <EditCursor seconds={5} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 140 })
    expect(onSeek).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(wrap)
    fireEvent.pointerMove(wrap, { clientX: 180 })  // move after release — no new call
    expect(onSeek).toHaveBeenCalledTimes(1)
  })
})

// ─── Disabled — drag no-op ────────────────────────────────────────────────────

describe('EditCursor disabled drag no-op', () => {
  it('pointerDown + pointerMove fires no onSeek when disabled', () => {
    const onSeek = vi.fn()
    render(
      <EditCursor
        seconds={5}
        secondsToX={s => s * 20}
        onSeek={onSeek}
        durationSeconds={30}
        disabled
      />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 140 })
    expect(onSeek).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4.2 — Run tests**

```bash
npx vitest run src/components/EditCursor/EditCursor.test.tsx
```

Expected: all drag tests pass. If the `setPointerCapture` spy test fails with "not a function," check that jsdom provides `setPointerCapture` on HTMLElement; `vi.spyOn` replaces it with a mock so the implementation can still call it without error.

If the two-point scale test fails, verify `handlePointerDown` computes `pxPerSecond = secondsToX(1) - secondsToX(0)` (not `secondsToX(0)` alone or a hardcoded constant).

- [ ] **Step 4.3 — Typecheck + run all tests**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: no TypeScript errors, all existing suites plus drag pass.

- [ ] **Step 4.4 — Commit**

```bash
git add src/components/EditCursor/EditCursor.test.tsx
git commit -m "test(EditCursor): drag — pointer capture, two-point inverse, clamp, disabled no-op"
```

---

### Task 5: CSS Visual Layer

**Files:**
- Modify: `src/components/EditCursor/EditCursor.module.css` — full visual styles

No new tests — visual correctness verified in the gallery via Compare. The day-one check is: verify the dashed line remains findable over clip bodies (colored content) across light and dark themes in Compare. If it disappears, add a hairline contrast edge using `--ec-line` (a one-line change).

---

- [ ] **Step 5.1 — Write the full CSS**

Replace `src/components/EditCursor/EditCursor.module.css` entirely:

```css
/* src/components/EditCursor/EditCursor.module.css */

/* ─── Color aliases ──────────────────────────────────────────────────────────
   Internal aliases over existing tokens — no new ThemeTokens entries.
   --ec-line is intentionally dimmer than --ec-handle so the line reads
   "quiet reference" and the handle reads "grabbable" (not disabled).         */

.root {
  --ec-line:   var(--text-dim);
  --ec-handle: var(--text-muted);

  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 0;
  overflow: visible;
  pointer-events: none;
  will-change: transform;
  /* One below Playhead's z-index: 50. Sweeping play line always reads on top. */
  z-index: 49;
}

/* ─── Line ───────────────────────────────────────────────────────────────────
   1px (vs. Playhead's 1.5px) + dashed (vs. solid) + no glow = matte, calm.
   Gradient-dash technique: dashes stay locked to the line under translateX,
   unlike border-style:dashed which re-anchors on every paint.

   DAY-ONE CHECK: verify line is findable over clip bodies (colored clip
   backgrounds) across light and dark themes in Compare. If it disappears,
   add a hairline contrast edge here using --ec-line.                         */

.line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  transform: translateX(-50%);
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    var(--ec-line)  0    4px,
    transparent     4px  8px
  );
}

/* ─── Handle wrapper ─────────────────────────────────────────────────────────
   Focusable, UNCLIPPED. clip-path on this element would clip outline and
   box-shadow — an a11y failure. role="slider"/tabIndex/aria-* live here;
   the .handle child carries the clip-path triangle.

   top:20px — just below the Playhead cap (top:0, height:20px) so the caret
   clears the cap entirely at co-location, point dipping into the first lane
   — reads "pointing into content." Distinct vertical position = clean
   separation at the stopped/co-located state that matters most.             */

.handleWrap {
  position: absolute;
  top: 20px;
  left: 0;
  width: 20px;
  height: 9px;
  transform: translateX(-50%);
  pointer-events: auto;
  cursor: grab;
  outline: none;
}

/* Focus ring on the unclipped wrapper — never clipped by the triangle child. */

.handleWrap:focus-visible,
.handleWrap[data-focused] {
  outline: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  outline-offset: 3px;
  border-radius: 2px;
}

/* ─── Handle triangle ────────────────────────────────────────────────────────
   clip-path defines the silhouette — ~20×9px gives ≈120° point angle
   (obtuse, reads "location pin / insertion point," not a ▶ play glyph).
   Gradient: soft-light treatment — lighter top, solid mid, slightly darker
   bottom — no bevel (brand forbids it). aria-hidden: visual only.           */

.handle {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, white 14%, var(--ec-handle)) 0%,
    var(--ec-handle) 45%,
    color-mix(in srgb, black 12%, var(--ec-handle)) 100%
  );
  pointer-events: none;
}

/* ─── Disabled ───────────────────────────────────────────────────────────────
   pointer-events:none prevents drag. The component's event handlers also
   guard on the disabled prop — two-layer defense.                            */

.root[data-disabled] .handleWrap {
  pointer-events: none;
  opacity: 0.4;
  cursor: default;
}

/* ─── Reduced-motion ─────────────────────────────────────────────────────────
   EditCursor has no continuous animation — relocation is an instant jump.
   Any future decorative settle pulse on the handle must be suppressed here.  */

@media (prefers-reduced-motion: reduce) {
  .handleWrap {
    transition: none;
  }
}
```

- [ ] **Step 5.2 — Run all tests (CSS Modules are mocked; tests must still pass)**

```bash
npx vitest run
```

Expected: all tests green. CSS changes don't affect test results (CSS Modules return stub class names in jsdom).

- [ ] **Step 5.3 — Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5.4 — Commit**

```bash
git add src/components/EditCursor/EditCursor.module.css
git commit -m "style(EditCursor): dashed line, obtuse caret at top:20, focus ring, disabled, z-49"
```

---

### Task 6: Demo

**Files:**
- Create: `src/components/EditCursor/EditCursor.demo.tsx`

The demo auto-registers in the gallery via `import.meta.glob` — no changes to `registry.ts` or `planned.ts`.

**Interfaces:**
- Consumes: `EditCursor` (Task 1), `Playhead` from `../Playhead`, `TransportButton` from `../TransportButton`, `Fader` from `../Fader`
- Consumes: `DemoShell`, `StatesGrid`, `State` from `../../gallery/ui/*`, `Playground` from `../../gallery/ui/Playground`

---

- [ ] **Step 6.1 — Write the demo file**

Create `src/components/EditCursor/EditCursor.demo.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell }        from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }        from '../../gallery/ui/Playground'
import { TransportButton }   from '../TransportButton'
import { Fader }             from '../Fader'
import { Playhead }          from '../Playhead'
import { EditCursor }        from './EditCursor'

export const meta: DemoMeta = {
  name:  'EditCursor',
  group: 'Primitives',
  route: '/edit-cursor',
  order: 14,
}

// ─── Fixture clock ───────────────────────────────────────────────────────────
// Separate from setSeconds — the clock advances only during play.
// seedClock(s) sets the internal counter so the sweep starts from `s` on Play,
// not from 0. setSeconds is never called from inside this clock.

function useFixtureClock(playing: boolean) {
  const secondsRef = useRef(0)
  const getSeconds = useCallback(() => secondsRef.current, [])
  const seedClock  = useCallback((s: number) => { secondsRef.current = s }, [])

  useEffect(() => {
    if (!playing) return
    let raf: number
    let last = performance.now()
    function tick(now: number) {
      secondsRef.current += (now - last) / 1000
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return { getSeconds, seedClock }
}

// ─── Timeline backdrop (shared across states and playground) ─────────────────

const RULER_H     = 24
const LANE_H      = 48
const LANE_COUNT  = 3
const TOTAL_H     = RULER_H + LANE_H * LANE_COUNT
const TRACK_COLORS = ['var(--track-color-3)', 'var(--track-color-2)', 'var(--track-color-1)']
const DURATION    = 30

function TimelineBackdrop({
  width,
  pxPerSecond,
  onRulerClick,
}: {
  width: number
  pxPerSecond: number
  onRulerClick?: (s: number) => void
}) {
  const ticks = [0, 5, 10, 15, 20, 25, 30]

  return (
    <div style={{ position: 'relative', width, height: TOTAL_H, flexShrink: 0 }}>
      {/* Ruler */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: RULER_H,
          background: 'var(--rail-bg)',
          borderBottom: '1px solid var(--border)',
          cursor: onRulerClick ? 'col-resize' : 'default',
          overflow: 'hidden',
        }}
        onClick={onRulerClick
          ? (e) => {
              const x = e.clientX - e.currentTarget.getBoundingClientRect().left
              onRulerClick(Math.max(0, Math.min(x / pxPerSecond, DURATION)))
            }
          : undefined
        }
      >
        {ticks.map(s => {
          const x = s * pxPerSecond
          if (x > width) return null
          return (
            <div key={s} style={{ position: 'absolute', left: x, top: 0, bottom: 0, pointerEvents: 'none' }}>
              <div style={{ width: 1, height: 6, background: 'var(--border-strong)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginLeft: 2 }}>
                {s}s
              </span>
            </div>
          )
        })}
      </div>

      {/* Lanes */}
      {TRACK_COLORS.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: RULER_H + i * LANE_H, left: 0, right: 0, height: LANE_H,
          background: 'var(--arrange-bg)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            position: 'absolute', top: 4, left: 8,
            width: Math.min(60 + i * 50, width - 16), bottom: 4,
            borderRadius: 3,
            background: `color-mix(in srgb, ${color} 18%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)`,
          }} />
        </div>
      ))}
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  const W           = 260
  const pxPerSecond = 8
  const secondsToX  = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])

  // Cell 6: sweeping playhead (uses fixture clock)
  const [playing6, setPlaying6] = useState(true)
  const { getSeconds: getSecs6, seedClock: seed6 } = useFixtureClock(playing6)
  useEffect(() => { seed6(10) }, [seed6])  // start sweep from edit cursor at 10s

  // Cell 4: expose a ref to force the focus ring via data-focused attribute
  const cell4Ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const wrap = cell4Ref.current?.querySelector('[data-testid="edit-cursor-handle-wrap"]')
    if (wrap) (wrap as HTMLElement).setAttribute('data-focused', 'true')
  }, [])

  function cell(content: React.ReactNode) {
    return (
      <div style={{ position: 'relative', width: W, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
        {content}
      </div>
    )
  }

  return (
    <StatesGrid>
      {/* 1. At 0 */}
      <State label="at 0 — parked at start">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={0} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 2. Mid-timeline */}
      <State label="mid-timeline — ⅓ in (10s)">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 3. Near end */}
      <State label="near end (28s)">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={28} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 4. Focused — data-focused attr, not autoFocus (no scroll-yank) */}
      <State label="focused — ring visible (no autoFocus)">
        <div ref={cell4Ref}>
          {cell(<>
            <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
            <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
          </>)}
        </div>
      </State>

      {/* 5. Co-located / stopped — key legibility test */}
      <State label="co-located / stopped — two distinct markers, same x">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <Playhead seconds={10} getSeconds={() => 10} playing={false} secondsToX={secondsToX} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 6. Playing — play line sweeps, edit cursor stationary */}
      <State label="playing — play line sweeps from edit cursor (10s)">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <Playhead seconds={10} getSeconds={getSecs6} playing={playing6} secondsToX={secondsToX} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
        <button
          type="button"
          onClick={() => {
            if (playing6) { setPlaying6(false); seed6(10) }
            else { seed6(10); setPlaying6(true) }
          }}
          style={{
            marginTop: 'var(--space-2)',
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
            background: 'none', border: '1px solid var(--border-strong)', borderRadius: 3,
            padding: '2px 8px', cursor: 'pointer',
          }}
        >
          {playing6 ? 'stop' : 'play'}
        </button>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────
//
// SPLIT-CURSOR CONTRACT:
//   - `seconds` = edit cursor position (frozen during play)
//   - On Play: seedClock(seconds) starts the clock from the edit cursor;
//     setSeconds is NEVER called from the clock
//   - On Stop: Playhead parks back to `seconds` (unchanged during play)
//   - Two readouts during play: "edit" (frozen) + "play" (live from clock)

function PlaygroundDemo() {
  const W = 440

  const [seconds,      setSeconds]      = useState(5)
  const [playing,      setPlaying]      = useState(false)
  const [pxPerSecond,  setPxPerSecond]  = useState(12)

  const secondsToX = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])
  const { getSeconds, seedClock } = useFixtureClock(playing)

  // Live playhead position for the "play" readout — rAF-driven, separate from
  // `seconds` so the edit cursor state is never overwritten by the sweep.
  const [livePlaySecs, setLivePlaySecs] = useState(0)
  useEffect(() => {
    if (!playing) return
    let raf: number
    function tick() { setLivePlaySecs(getSeconds()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, getSeconds])

  function handlePlay() {
    seedClock(seconds)  // seed from edit cursor before starting sweep
    setPlaying(true)
  }

  function handleStop() {
    setPlaying(false)
    // Playhead.seconds = seconds (unchanged during play) — no explicit park needed
  }

  function handleSeek(s: number) {
    setSeconds(Math.max(0, Math.min(s, DURATION)))
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Timeline */}
        <div style={{ position: 'relative', width: W, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} onRulerClick={handleSeek} />
          <Playhead
            seconds={seconds}
            getSeconds={getSeconds}
            playing={playing}
            secondsToX={secondsToX}
          />
          <EditCursor
            seconds={seconds}
            secondsToX={secondsToX}
            durationSeconds={DURATION}
            onSeek={handleSeek}
          />
        </div>

        {/* Transport */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <TransportButton
            variant="play"
            playing={playing}
            onClick={playing ? handleStop : handlePlay}
          />
          <TransportButton variant="stop" onClick={handleStop} />

          {/* Two readouts — show the split during play */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              edit: <span style={{ color: 'var(--text)' }}>{seconds.toFixed(2)}s</span>
            </span>
            {playing && (
              <span style={{ color: 'var(--text-muted)' }}>
                play: <span style={{ color: 'var(--led-orange)' }}>{livePlaySecs.toFixed(2)}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Zoom fader */}
        <label style={labelStyle}>
          zoom: {pxPerSecond} px/s
          <div style={{ marginTop: 'var(--space-1)' }}>
            <Fader
              value={pxPerSecond}
              onChange={setPxPerSecond}
              min={4}
              max={40}
              orientation="horizontal"
              aria-label="Zoom px/s"
            />
          </div>
        </label>

        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Click the ruler or drag the caret to place the edit cursor.
          Play sweeps the orange line <em>from</em> the caret; Stop returns it.
          "edit" readout stays frozen during play — "play" shows the live sweep.
          Arrow/Page keys nudge the caret while focused.
        </p>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function EditCursorDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 6.2 — Typecheck**

```bash
npx tsc --noEmit
```

Common issues:
- If `DemoShell`, `StatesGrid`, `State`, or `Playground` aren't exported from their modules, check the actual export names with `grep -r "export" src/gallery/ui/`.
- If `TransportButton` props don't match, check `src/components/TransportButton/TransportButton.tsx`.
- If `Fader` `size` prop is required, add `size="sm"` or remove it.

- [ ] **Step 6.3 — Run all tests**

```bash
npx vitest run
```

Expected: all tests green. The demo file is excluded from test runs (no `.test.` in the name).

- [ ] **Step 6.4 — Start dev server and verify in the gallery**

```bash
npm run dev
```

Open `http://localhost:5273` and navigate to **Primitives → EditCursor**. Verify:

**States grid:**
- [ ] Cell 1: caret visible at x=0
- [ ] Cell 2: caret at ~⅓ of the timeline
- [ ] Cell 3: caret near the right edge
- [ ] Cell 4: focus ring visible around the caret without stealing document focus
- [ ] Cell 5 (co-located / stopped): playhead cap and edit cursor caret both visible at the same x — two visually distinct markers, cap above, caret below
- [ ] Cell 6 (playing): orange play line sweeps while the edit cursor stays stationary; play/stop button works

**Playground:**
- [ ] Click the ruler → caret jumps to that position, "edit" readout updates
- [ ] Drag the caret → "edit" readout updates live
- [ ] Press Play → "play" readout appears and sweeps from the edit cursor's position
- [ ] "edit" readout stays frozen while "play" sweeps — split-cursor contract visible
- [ ] Press Stop → play line parks back to edit cursor; "play" readout disappears
- [ ] Focus the caret (Tab or click) and press arrow keys → "edit" position nudges
- [ ] Zoom fader → both Playhead and EditCursor reposition together

**Compare across themes:** toggle through light and dark themes and verify:
- [ ] The dashed line is findable over the colored clip bodies (not just empty lane background)
- [ ] The caret reads grabbable (not disabled-grey) in all themes
- [ ] The focus ring is visible and contrasts with all backgrounds

- [ ] **Step 6.5 — Commit**

```bash
git add src/components/EditCursor/EditCursor.demo.tsx
git commit -m "feat(EditCursor): demo — states grid (co-located, playing), playground with split-cursor contract"
```

---

## Final verification

- [ ] `npx tsc --noEmit` — no errors
- [ ] `npx vitest run` — all suites green
- [ ] Gallery: EditCursor appears in Primitives sidebar at position 14
- [ ] Co-located cell (cell 5) shows two distinct markers at the same x
- [ ] Playing cell (cell 6) shows the split — edit stays frozen, play sweeps
- [ ] Playground "edit" readout never updates during play unless you drag/click/arrow the caret
