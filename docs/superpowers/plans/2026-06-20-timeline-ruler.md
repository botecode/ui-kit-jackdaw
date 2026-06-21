# TimelineRuler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `TimelineRuler` — the bar/beat ruler strip + live musical grid + shared horizontal coordinate system that all timeline components (Playhead, loop band, Clip, etc.) mount onto.

**Architecture:** A single component with two rendering zones — a narrow ruler strip (bar/beat labels + CSS gradient tick lines, seek surface) and a flex-filling grid zone (repeating-linear-gradient driven by `--beat-px`). All coordinate math lives in a pure `rulerMath.ts` file. The root element sets `--beat-px` and `--bar-beats` as CSS custom properties so descendant components can read the grid without re-deriving it.

**Tech Stack:** React 19, TypeScript 6, CSS Modules, Vitest + @testing-library/react (`fireEvent`), no motion library (only CSS transitions + rAF where needed).

## Global Constraints

- CSS Modules + CSS vars only — no Tailwind, no CSS-in-JS, no hardcoded colors
- Tokens only for colors — use existing `--border`, `--border-strong`, `--text-dim`, `--arrange-bg`, `--strip-mini-timeline`, `--texture-paper`, `--accent`; never hardcode hex
- `--texture-paper` is `none` in dark/non-Chroma themes — multiply-blend it always; it disappears when `none`
- Tests use `fireEvent` (not `userEvent`) — this is the project standard
- Gallery order: `group: 'Primitives'`, `order: 13`, `route: '/timeline-ruler'`
- `typecheck` / `lint` / `test` green before each commit
- `denominator` prop accepted for real-app API compatibility but not used in grid math (numerator drives bar-line period)

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/components/TimelineRuler/rulerMath.ts` | Pure coordinate functions: `secondsToX`, `xToSeconds`, `snapXToGrid`, `formatBarsBeats`, `buildBarMarks` |
| `src/components/TimelineRuler/TimelineRuler.tsx` | Component: ruler strip + grid, pointer seek, keyboard, ARIA |
| `src/components/TimelineRuler/TimelineRuler.module.css` | CSS: strip, ticks, grid gradients, Chroma texture, lane rules |
| `src/components/TimelineRuler/TimelineRuler.test.tsx` | Math unit tests + component interaction tests |
| `src/components/TimelineRuler/TimelineRuler.demo.tsx` | Gallery demo: states grid + playground |
| `src/components/TimelineRuler/index.ts` | Barrel: exports component, props type, and coordinate helpers |

---

## Task 1: `rulerMath.ts` — coordinate math + math tests (TDD)

**Files:**
- Create: `src/components/TimelineRuler/TimelineRuler.test.tsx`
- Create: `src/components/TimelineRuler/rulerMath.ts`

**Interfaces produced:**
```typescript
export interface BarMark { x: number; bar: number }
export function beatsPerSecond(bpm: number): number
export function secondsToX(seconds: number, pxPerBeat: number, bpm: number): number
export function xToSeconds(x: number, pxPerBeat: number, bpm: number): number
export function snapXToGrid(x: number, pxPerBeat: number): number
export function formatBarsBeats(seconds: number, bpm: number, numerator: number): string
export function buildBarMarks(durationSeconds: number, bpm: number, numerator: number, pxPerBeat: number): BarMark[]
```

- [ ] **Step 1: Write the failing math tests**

Create `src/components/TimelineRuler/TimelineRuler.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  beatsPerSecond,
  secondsToX,
  xToSeconds,
  snapXToGrid,
  formatBarsBeats,
  buildBarMarks,
} from './rulerMath'

// ─── beatsPerSecond ────────────────────────────────────────────────────────────

describe('beatsPerSecond', () => {
  it('120 BPM → 2 bps',  () => expect(beatsPerSecond(120)).toBe(2))
  it('60 BPM → 1 bps',   () => expect(beatsPerSecond(60)).toBe(1))
  it('90 BPM → 1.5 bps', () => expect(beatsPerSecond(90)).toBe(1.5))
})

// ─── secondsToX ───────────────────────────────────────────────────────────────

describe('secondsToX', () => {
  it('0s → 0px',                   () => expect(secondsToX(0, 64, 120)).toBe(0))
  it('1s at 120 BPM 64px → 128px', () => expect(secondsToX(1, 64, 120)).toBe(128))
  it('0.5s at 120 BPM 64px → 64px',() => expect(secondsToX(0.5, 64, 120)).toBe(64))
  it('1s at 60 BPM 64px → 64px',   () => expect(secondsToX(1, 64, 60)).toBe(64))
})

// ─── xToSeconds ───────────────────────────────────────────────────────────────

describe('xToSeconds', () => {
  it('0px → 0s',                   () => expect(xToSeconds(0, 64, 120)).toBe(0))
  it('128px at 120 BPM 64px → 1s', () => expect(xToSeconds(128, 64, 120)).toBeCloseTo(1))
  it('64px at 120 BPM 64px → 0.5s',() => expect(xToSeconds(64, 64, 120)).toBeCloseTo(0.5))
  it('round-trips with secondsToX', () => {
    const t = 2.317
    expect(xToSeconds(secondsToX(t, 48, 100), 48, 100)).toBeCloseTo(t, 10)
  })
  it('pxPerBeat=0 returns 0 (guard)',() => expect(xToSeconds(64, 0, 120)).toBe(0))
})

// ─── snapXToGrid ──────────────────────────────────────────────────────────────

describe('snapXToGrid', () => {
  it('exact beat → unchanged', () => expect(snapXToGrid(64, 64)).toBe(64))
  it('70px (closer to 64) → 64px', () => expect(snapXToGrid(70, 64)).toBe(64))
  it('100px (closer to 128) → 128px', () => expect(snapXToGrid(100, 64)).toBe(128))
  it('32px (equidistant, rounds up) → 64px', () => expect(snapXToGrid(32, 64)).toBe(64))
  it('0px → 0px', () => expect(snapXToGrid(0, 64)).toBe(0))
  it('pxPerBeat=0 returns x unchanged', () => expect(snapXToGrid(70, 0)).toBe(70))
})

// ─── formatBarsBeats ──────────────────────────────────────────────────────────

describe('formatBarsBeats', () => {
  it('0s, 4/4, 120 BPM → "bar 1, beat 1"', () =>
    expect(formatBarsBeats(0, 120, 4)).toBe('bar 1, beat 1'))

  it('0.5s, 120 BPM (1 beat elapsed), 4/4 → "bar 1, beat 2"', () =>
    expect(formatBarsBeats(0.5, 120, 4)).toBe('bar 1, beat 2'))

  it('2s, 120 BPM (4 beats elapsed), 4/4 → "bar 2, beat 1"', () =>
    expect(formatBarsBeats(2, 120, 4)).toBe('bar 2, beat 1'))

  it('1s, 120 BPM (2 beats), 3/4 → "bar 1, beat 3"', () =>
    expect(formatBarsBeats(1, 120, 3)).toBe('bar 1, beat 3'))

  it('1.5s, 120 BPM (3 beats), 3/4 → "bar 2, beat 1"', () =>
    expect(formatBarsBeats(1.5, 120, 3)).toBe('bar 2, beat 1'))
})

// ─── buildBarMarks ────────────────────────────────────────────────────────────

describe('buildBarMarks', () => {
  it('returns bar marks starting at x=0, bar=1', () => {
    const marks = buildBarMarks(4, 120, 4, 64)
    // durationSeconds=4, bps=2, totalBeats=8, bars=2+1 buffer = 3
    expect(marks[0]).toEqual({ x: 0, bar: 1 })
  })

  it('bar 2 at x = numerator × pxPerBeat', () => {
    const marks = buildBarMarks(4, 120, 4, 64)
    expect(marks[1]).toEqual({ x: 256, bar: 2 }) // 4 beats × 64px
  })

  it('returns at least 1 mark even for tiny durations', () => {
    const marks = buildBarMarks(0.1, 120, 4, 64)
    expect(marks.length).toBeGreaterThanOrEqual(1)
  })

  it('3/4 time: bar spacing = 3 × pxPerBeat', () => {
    const marks = buildBarMarks(4, 120, 3, 48)
    // 4s × 2bps = 8 beats, bars = ceil(8/3)+1 = 4
    expect(marks[1]).toEqual({ x: 144, bar: 2 }) // 3 × 48
  })

  it('6/8 time: bar spacing = 6 × pxPerBeat', () => {
    const marks = buildBarMarks(8, 90, 6, 32)
    // 8s × 1.5bps = 12 beats, bars = ceil(12/6)+1 = 3
    expect(marks[1]).toEqual({ x: 192, bar: 2 }) // 6 × 32
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/TimelineRuler/TimelineRuler.test.tsx 2>&1 | head -30
```

Expected: FAIL — "Cannot find module './rulerMath'"

- [ ] **Step 3: Implement `rulerMath.ts`**

Create `src/components/TimelineRuler/rulerMath.ts`:

```typescript
export interface BarMark {
  x: number
  bar: number
}

export function beatsPerSecond(bpm: number): number {
  return bpm / 60
}

export function secondsToX(seconds: number, pxPerBeat: number, bpm: number): number {
  return seconds * beatsPerSecond(bpm) * pxPerBeat
}

export function xToSeconds(x: number, pxPerBeat: number, bpm: number): number {
  if (pxPerBeat <= 0 || bpm <= 0) return 0
  return x / (beatsPerSecond(bpm) * pxPerBeat)
}

export function snapXToGrid(x: number, pxPerBeat: number): number {
  if (pxPerBeat <= 0) return x
  return Math.round(x / pxPerBeat) * pxPerBeat
}

export function formatBarsBeats(seconds: number, bpm: number, numerator: number): string {
  const totalBeats = seconds * beatsPerSecond(bpm)
  const bar  = Math.floor(totalBeats / numerator) + 1
  const beat = Math.floor(totalBeats % numerator) + 1
  return `bar ${bar}, beat ${beat}`
}

export function buildBarMarks(
  durationSeconds: number,
  bpm: number,
  numerator: number,
  pxPerBeat: number,
): BarMark[] {
  const bps       = beatsPerSecond(bpm)
  const totalBars = Math.ceil(durationSeconds * bps / numerator) + 1
  return Array.from({ length: totalBars }, (_, i) => ({
    x:   i * numerator * pxPerBeat,
    bar: i + 1,
  }))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/TimelineRuler/TimelineRuler.test.tsx 2>&1 | tail -10
```

Expected: all math tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TimelineRuler/rulerMath.ts src/components/TimelineRuler/TimelineRuler.test.tsx
git commit -m "feat(TimelineRuler): add coordinate math (rulerMath.ts) + tests"
```

---

## Task 2: Component + CSS + Barrel (TDD — write component tests first)

**Files:**
- Modify: `src/components/TimelineRuler/TimelineRuler.test.tsx` (append component section)
- Create: `src/components/TimelineRuler/TimelineRuler.tsx`
- Create: `src/components/TimelineRuler/TimelineRuler.module.css`
- Create: `src/components/TimelineRuler/index.ts`

**Interfaces consumed:** All exports from `rulerMath.ts` (Task 1)

**Interfaces produced:**
```typescript
export interface TimelineRulerProps {
  bpm: number
  numerator: number
  denominator: number   // API compat — accepted but not used in grid math
  pxPerBeat: number
  durationSeconds: number
  onSeek?: (seconds: number) => void
  snap?: boolean
  size?: 'sm' | 'md'
  showLaneRules?: boolean
}
export function TimelineRuler(props: TimelineRulerProps): JSX.Element
```

Root element sets:
- CSS var `--beat-px = ${pxPerBeat}px` (inherited by Playhead, Clip, loop band)
- CSS var `--bar-beats = ${numerator}`
- `width = ${totalWidth}px` (totalWidth = `secondsToX(durationSeconds, pxPerBeat, bpm)`)
- `data-testid="timeline-ruler"`

Strip element: `data-testid="ruler-strip"`

- [ ] **Step 1: Append component tests to `TimelineRuler.test.tsx`**

Add after the existing math tests:

```typescript
import { render, fireEvent } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { TimelineRuler } from './TimelineRuler'

const BASE = {
  bpm:             120,
  numerator:       4,
  denominator:     4,
  pxPerBeat:       64,
  durationSeconds: 8,
}

function mockRootRect(container: HTMLElement) {
  const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
  root.getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0, top: 0, right: 512, bottom: 48, width: 512, height: 48,
    toJSON: () => {},
  } as DOMRect)
  return root
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('TimelineRuler rendering', () => {
  it('renders without crash', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toBeInTheDocument()
  })

  it('role="slider" with aria-label="Timeline"', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider', { name: 'Timeline' })).toBeInTheDocument()
  })

  it('aria-valuemin=0', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  })

  it('aria-valuemax=durationSeconds', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} durationSeconds={10} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuemax', '10')
  })

  it('aria-valuenow starts at 0', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
  })

  it('aria-valuetext starts at "bar 1, beat 1"', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuetext', 'bar 1, beat 1')
  })

  it('sets --beat-px CSS var on root', () => {
    const { container } = render(<TimelineRuler {...BASE} pxPerBeat={48} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
    expect(root.style.getPropertyValue('--beat-px')).toBe('48px')
  })

  it('sets --bar-beats CSS var on root', () => {
    const { container } = render(<TimelineRuler {...BASE} numerator={3} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
    expect(root.style.getPropertyValue('--bar-beats')).toBe('3')
  })

  it('sets width to totalWidth (secondsToX(duration, pxPerBeat, bpm))', () => {
    // bpm=120, pxPerBeat=64, duration=8s → 8 × 2bps × 64px = 1024px
    const { container } = render(<TimelineRuler {...BASE} durationSeconds={8} pxPerBeat={64} bpm={120} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
    expect(root.style.width).toBe('1024px')
  })

  it('renders bar labels (bar 1, bar 2, …)', () => {
    const { getAllByText } = render(<TimelineRuler {...BASE} />)
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })

  it('data-size="md" by default', () => {
    const { container } = render(<TimelineRuler {...BASE} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root?.getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<TimelineRuler {...BASE} size="sm" />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root?.getAttribute('data-size')).toBe('sm')
  })

  it('no data-lane-rules by default', () => {
    const { container } = render(<TimelineRuler {...BASE} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root).not.toHaveAttribute('data-lane-rules')
  })

  it('data-lane-rules when showLaneRules=true', () => {
    const { container } = render(<TimelineRuler {...BASE} showLaneRules />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root).toHaveAttribute('data-lane-rules')
  })
})

// ─── Seek interaction ─────────────────────────────────────────────────────────

describe('TimelineRuler seek', () => {
  it('pointerDown on strip calls onSeek', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 64, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledTimes(1)
  })

  it('pointerDown at 128px → 1s (bpm=120, pxPerBeat=64)', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 128, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(1)
  })

  it('pointerMove while dragging calls onSeek with new position', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 0, pointerId: 1 })
    fireEvent.pointerMove(strip, { clientX: 192, pointerId: 1 })
    // 192px → 192/(2×64) = 1.5s
    expect(onSeek).toHaveBeenLastCalledWith(1.5)
  })

  it('seek is clamped to [0, durationSeconds]', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} durationSeconds={4} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    // 9999px is way past durationSeconds=4
    fireEvent.pointerDown(strip, { clientX: 9999, pointerId: 1 })
    const called = onSeek.mock.calls[0][0]
    expect(called).toBeLessThanOrEqual(4)
  })

  it('snap=true snaps pointer to nearest beat', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} snap onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    // 70px → nearest beat at 64px → 64/(2×64) = 0.5s
    fireEvent.pointerDown(strip, { clientX: 70, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(0.5)
  })

  it('snap=false does NOT snap (70px → ~0.546s, not exactly 0.5)', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} snap={false} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 70, pointerId: 1 })
    const called = onSeek.mock.calls[0][0]
    expect(called).not.toBe(0.5)
    expect(called).toBeCloseTo(70 / (2 * 64), 5)
  })

  it('updates aria-valuenow after seek', () => {
    const { container, getByRole } = render(<TimelineRuler {...BASE} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 128, pointerId: 1 })
    expect(getByRole('slider')).toHaveAttribute('aria-valuenow', '1')
  })

  it('updates aria-valuetext to bars:beats after seek', () => {
    const { container, getByRole } = render(<TimelineRuler {...BASE} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    // 128px → 1s, 120 BPM → 2 beats elapsed → bar 1 beat 3
    fireEvent.pointerDown(strip, { clientX: 128, pointerId: 1 })
    expect(getByRole('slider')).toHaveAttribute('aria-valuetext', 'bar 1, beat 3')
  })

  it('no onSeek prop → no crash on pointer down', () => {
    const { container } = render(<TimelineRuler {...BASE} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    expect(() => fireEvent.pointerDown(strip, { clientX: 64, pointerId: 1 })).not.toThrow()
  })
})

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('TimelineRuler keyboard', () => {
  it('ArrowRight seeks forward by one beat', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    // beatSeconds = 60/120 = 0.5s
    expect(onSeek).toHaveBeenCalledWith(0.5)
  })

  it('ArrowLeft at start stays at 0', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('ArrowRight twice → 1s (0.5s + 0.5s)', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenLastCalledWith(1)
  })

  it('ArrowRight past durationSeconds is clamped', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} durationSeconds={0.3} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    expect(onSeek.mock.calls[0][0]).toBeLessThanOrEqual(0.3)
  })

  it('non-arrow key does not call onSeek', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Space' })
    expect(onSeek).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify component tests fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/TimelineRuler/TimelineRuler.test.tsx 2>&1 | grep -E "FAIL|Cannot find" | head -5
```

Expected: FAIL — "Cannot find module './TimelineRuler'"

- [ ] **Step 3: Implement `TimelineRuler.module.css`**

Create `src/components/TimelineRuler/TimelineRuler.module.css`:

```css
/* ─── Root ────────────────────────────────────────────────────────────────────── */

/*
  Root is the timeline coordinate origin.
  --beat-px and --bar-beats are set via inline style by the component.
  Descendants (Playhead, Clip, loop band) read --beat-px to position themselves.
  Width is set to totalWidth (secondsToX(duration)) via inline style.
*/

.root {
  position: relative;
  display: flex;
  flex-direction: column;
  outline: none;
  user-select: none;
  -webkit-user-select: none;

  /* Internal grid line colors — delegate to existing tokens (theme-neutral) */
  --_bar-line:  var(--border-strong);
  --_beat-line: var(--border);
}

.root:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  outline-offset: -2px;
}

/* ─── Ruler strip ─────────────────────────────────────────────────────────────── */

/*
  The seek surface. CSS gradient handles bar/beat tick lines.
  DOM children are only bar number labels (much fewer elements than rendering every beat tick).
*/

.strip {
  position: relative;
  flex-shrink: 0;
  background-color: var(--strip-mini-timeline);
  background-image:
    repeating-linear-gradient(
      to right,
      var(--_bar-line)  0px,
      var(--_bar-line)  1.5px,
      transparent       1.5px,
      transparent       calc(var(--beat-px) * var(--bar-beats))
    ),
    repeating-linear-gradient(
      to right,
      var(--_beat-line) 0px,
      var(--_beat-line) 1px,
      transparent       1px,
      transparent       var(--beat-px)
    );
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  cursor: col-resize;
}

.root[data-size="md"] .strip { height: 24px; }
.root[data-size="sm"] .strip { height: 20px; }

.root:not([data-dragging]):hover .strip {
  background-color: color-mix(in srgb, var(--strip-mini-timeline) 88%, var(--accent) 12%);
}

.root[data-dragging] .strip {
  background-color: color-mix(in srgb, var(--strip-mini-timeline) 80%, var(--accent) 20%);
}

/* ─── Bar number labels ───────────────────────────────────────────────────────── */

.barLabel {
  position: absolute;
  top: 3px;
  left: 3px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  white-space: nowrap;
  pointer-events: none;
  line-height: 1;
}

.root[data-size="md"] .barLabel { font-size: var(--text-xs); }
.root[data-size="sm"] .barLabel { font-size: 9px; }

/* ─── Musical grid ────────────────────────────────────────────────────────────── */

/*
  Two-gradient stack + optional paper texture (see below).
  All periods keyed off --beat-px and --bar-beats set on root.
  Reflow = one CSS var update; no re-layout, no JS.

  Stacking order (painter's algorithm — last listed = bottom):
    1. Texture  (multiply-blended: faint grain in Chroma, invisible/none in dark themes)
    2. Bar lines (heavier vertical rule every numerator beats)
    3. Beat lines (lighter vertical rule every beat)
    [4. Lane rules (optional horizontal stripes)]
*/

.grid {
  flex: 1;
  min-height: 0;
  background-color: var(--arrange-bg);
  background-image:
    var(--texture-paper),
    repeating-linear-gradient(
      to right,
      var(--_bar-line)  0px,
      var(--_bar-line)  1.5px,
      transparent       1.5px,
      transparent       calc(var(--beat-px) * var(--bar-beats))
    ),
    repeating-linear-gradient(
      to right,
      var(--_beat-line) 0px,
      var(--_beat-line) 1px,
      transparent       1px,
      transparent       var(--beat-px)
    );
  background-repeat: repeat;
  background-size: 200px 200px, auto, auto;
  /*
    multiply: blends texture grain onto the background-color.
    In Chroma: cream paper + low-opacity noise → subtle grain.
    In other themes: --texture-paper is `none` (no pixels) → multiply has nothing to blend.
  */
  background-blend-mode: multiply, normal, normal;
}

/* ─── Lane rules (optional horizontal ledger rows) ────────────────────────────── */

.root[data-lane-rules] .grid {
  background-image:
    var(--texture-paper),
    repeating-linear-gradient(
      to right,
      var(--_bar-line)  0px,
      var(--_bar-line)  1.5px,
      transparent       1.5px,
      transparent       calc(var(--beat-px) * var(--bar-beats))
    ),
    repeating-linear-gradient(
      to right,
      var(--_beat-line) 0px,
      var(--_beat-line) 1px,
      transparent       1px,
      transparent       var(--beat-px)
    ),
    repeating-linear-gradient(
      to bottom,
      transparent                              0px,
      transparent                              calc(var(--lane-height, 48px) - 1px),
      var(--border)                            calc(var(--lane-height, 48px) - 1px),
      var(--border)                            var(--lane-height, 48px)
    );
  background-repeat: repeat;
  background-size: 200px 200px, auto, auto, auto;
  background-blend-mode: multiply, normal, normal, normal;
}
```

- [ ] **Step 4: Implement `TimelineRuler.tsx`**

Create `src/components/TimelineRuler/TimelineRuler.tsx`:

```typescript
import { useRef, useState, useEffect } from 'react'
import {
  secondsToX,
  xToSeconds,
  snapXToGrid,
  formatBarsBeats,
  buildBarMarks,
} from './rulerMath'
import styles from './TimelineRuler.module.css'

export type { BarMark } from './rulerMath'
export { secondsToX, xToSeconds, snapXToGrid, formatBarsBeats } from './rulerMath'

export interface TimelineRulerProps {
  bpm: number
  numerator: number
  /** Accepted for real-app API compat; beat period is numerator, not denominator. */
  denominator: number
  pxPerBeat: number
  durationSeconds: number
  onSeek?: (seconds: number) => void
  snap?: boolean
  size?: 'sm' | 'md'
  showLaneRules?: boolean
}

export function TimelineRuler({
  bpm,
  numerator,
  pxPerBeat,
  durationSeconds,
  onSeek,
  snap = false,
  size = 'md',
  showLaneRules = false,
}: TimelineRulerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [seekSeconds, setSeekSeconds] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Mutable refs — keep handlers stable across re-renders
  const bpmRef       = useRef(bpm)
  const pxPerBeatRef = useRef(pxPerBeat)
  const snapRef      = useRef(snap)
  const onSeekRef    = useRef(onSeek)
  const seekRef      = useRef(0)

  useEffect(() => { bpmRef.current = bpm })
  useEffect(() => { pxPerBeatRef.current = pxPerBeat })
  useEffect(() => { snapRef.current = snap })
  useEffect(() => { onSeekRef.current = onSeek })

  function commit(secs: number) {
    const clamped = Math.max(0, Math.min(secs, durationSeconds))
    setSeekSeconds(clamped)
    seekRef.current = clamped
    onSeekRef.current?.(clamped)
  }

  function seekFromClientX(clientX: number) {
    const rect = rootRef.current!.getBoundingClientRect()
    let x = Math.max(0, clientX - rect.left)
    if (snapRef.current) x = snapXToGrid(x, pxPerBeatRef.current)
    commit(xToSeconds(x, pxPerBeatRef.current, bpmRef.current))
  }

  // ── Pointer seek ──────────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
    seekFromClientX(e.clientX)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    seekFromClientX(e.clientX)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  // ── Keyboard seek ─────────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    const beatSeconds = 60 / bpmRef.current
    let next: number | null = null

    switch (e.key) {
      case 'ArrowRight': next = seekRef.current + beatSeconds; break
      case 'ArrowLeft':  next = seekRef.current - beatSeconds; break
      default: return
    }

    e.preventDefault()
    let x = secondsToX(next, pxPerBeatRef.current, bpmRef.current)
    if (snapRef.current) x = snapXToGrid(x, pxPerBeatRef.current)
    commit(xToSeconds(x, pxPerBeatRef.current, bpmRef.current))
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalWidth = secondsToX(durationSeconds, pxPerBeat, bpm)
  const barMarks   = buildBarMarks(durationSeconds, bpm, numerator, pxPerBeat)
  const ariaText   = formatBarsBeats(seekSeconds, bpm, numerator)

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="timeline-ruler"
      data-size={size}
      data-dragging={dragging || undefined}
      data-lane-rules={showLaneRules || undefined}
      role="slider"
      aria-label="Timeline"
      aria-valuemin={0}
      aria-valuemax={durationSeconds}
      aria-valuenow={seekSeconds}
      aria-valuetext={ariaText}
      tabIndex={0}
      style={{
        '--beat-px':   `${pxPerBeat}px`,
        '--bar-beats': String(numerator),
        width:         `${totalWidth}px`,
      } as React.CSSProperties}
      onKeyDown={handleKeyDown}
    >
      {/* ── Ruler strip (seek surface + bar/beat labels) ── */}
      <div
        className={styles.strip}
        data-testid="ruler-strip"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {barMarks.map(({ x, bar }) => (
          <span
            key={bar}
            className={styles.barLabel}
            style={{ left: x } as React.CSSProperties}
          >
            {bar}
          </span>
        ))}
      </div>

      {/* ── Musical grid (repeating-gradient — reflows via CSS var update) ── */}
      <div className={styles.grid} aria-hidden="true" />
    </div>
  )
}
```

- [ ] **Step 5: Create `index.ts`**

Create `src/components/TimelineRuler/index.ts`:

```typescript
export { TimelineRuler } from './TimelineRuler'
export type { TimelineRulerProps } from './TimelineRuler'
export { secondsToX, xToSeconds, snapXToGrid, formatBarsBeats } from './TimelineRuler'
export type { BarMark } from './TimelineRuler'
```

- [ ] **Step 6: Run tests — all must pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/TimelineRuler/TimelineRuler.test.tsx 2>&1 | tail -15
```

Expected: all tests PASS

- [ ] **Step 7: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/components/TimelineRuler/
git commit -m "feat(TimelineRuler): component + CSS grid + barrel export"
```

---

## Task 3: Demo — States grid + Playground

**Files:**
- Create: `src/components/TimelineRuler/TimelineRuler.demo.tsx`

**Interfaces consumed:**
- `TimelineRuler` from `./TimelineRuler`
- `secondsToX`, `formatBarsBeats` from `./TimelineRuler`
- `Fader` from `../Fader`
- `Toggle` from `../Toggle`
- `ThemeProvider` from `../../theme/ThemeProvider`
- `DemoShell`, `StatesGrid`, `State`, `Playground` from gallery

- [ ] **Step 1: Create `TimelineRuler.demo.tsx`**

Create `src/components/TimelineRuler/TimelineRuler.demo.tsx`:

```typescript
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { TimelineRuler, secondsToX, formatBarsBeats } from './TimelineRuler'

export const meta: DemoMeta = {
  name:  'TimelineRuler',
  group: 'Primitives',
  route: '/timeline-ruler',
  order: 13,
}

// ─── Shared scroll wrapper for all states ─────────────────────────────────────

function RulerWrap({ height, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div style={{
      overflow:    'hidden',
      height:      height ?? 80,
      border:      '1px solid var(--border)',
      borderRadius:'var(--radius)',
      display:     'flex',
      flexDirection:'column',
      width:       360,
    }}>
      {children}
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Low zoom (16px/beat)">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={16} durationSeconds={16} />
        </RulerWrap>
      </State>

      <State label="Med zoom (48px/beat)">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="High zoom (80px/beat)">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={80} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="3/4 time">
        <RulerWrap>
          <TimelineRuler bpm={100} numerator={3} denominator={4} pxPerBeat={48} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="6/8 time (6 beats/bar)">
        <RulerWrap>
          <TimelineRuler bpm={90} numerator={6} denominator={8} pxPerBeat={32} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="Snap on">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} snap />
        </RulerWrap>
      </State>

      <State label="sm size">
        <RulerWrap height={56}>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} size="sm" />
        </RulerWrap>
      </State>

      <State label="With lane rules">
        <RulerWrap height={120}>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} showLaneRules />
        </RulerWrap>
      </State>

      <State label="Chroma (paper) vs Ink (dark)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>chroma</span>
            <ThemeProvider theme="chroma">
              <RulerWrap height={80}>
                <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} showLaneRules />
              </RulerWrap>
            </ThemeProvider>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>ink</span>
            <ThemeProvider theme="ink">
              <RulerWrap height={80}>
                <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} showLaneRules />
              </RulerWrap>
            </ThemeProvider>
          </div>
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [pxPerBeat,    setPxPerBeat]    = useState(48)
  const [bpm,          setBpm]          = useState(120)
  const [numerator,    setNumerator]    = useState(4)
  const [snap,         setSnap]         = useState(false)
  const [showLaneRules,setShowLaneRules]= useState(false)
  const [seekSecs,     setSeekSecs]     = useState(0)

  const DURATION = 8
  const bps           = bpm / 60
  const clipStartBeats = numerator          // bar 2 start
  const clipX          = clipStartBeats * pxPerBeat
  const clipW          = 2 * pxPerBeat     // 2 beats wide
  const playheadX      = secondsToX(seekSecs, pxPerBeat, bpm)
  const totalWidth     = secondsToX(DURATION, pxPerBeat, bpm)

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
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Timeline view */}
        <div style={{
          flex:         '1 1 360px',
          overflow:     'auto',
          maxWidth:     560,
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <TimelineRuler
            bpm={bpm}
            numerator={numerator}
            denominator={4}
            pxPerBeat={pxPerBeat}
            durationSeconds={DURATION}
            snap={snap}
            showLaneRules={showLaneRules}
            onSeek={setSeekSecs}
          />

          {/* Fake arrangement lane — proves secondsToX coordinate system */}
          <div style={{
            position:   'relative',
            width:      totalWidth,
            height:     showLaneRules ? 48 * 3 : 96,
            background: 'var(--arrange-bg)',
          }}>
            {/* Fake clip at bar 2, 2 beats long */}
            <div
              aria-label="demo clip"
              style={{
                position:    'absolute',
                left:        clipX,
                top:         showLaneRules ? 6 : 12,
                width:       clipW,
                height:      showLaneRules ? 36 : 48,
                background:  'color-mix(in srgb, var(--accent) 18%, transparent)',
                border:      '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                borderRadius:'var(--radius)',
              }}
            />

            {/* Fake playhead — positioned via secondsToX mapping */}
            <div
              aria-hidden="true"
              style={{
                position:      'absolute',
                left:          playheadX,
                top:           0,
                width:         1.5,
                height:        '100%',
                background:    'var(--accent)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0 }}>
          <label style={labelStyle}>
            px/beat ({pxPerBeat})
            <Fader
              value={pxPerBeat}
              onChange={v => setPxPerBeat(Math.max(8, Math.round(v)))}
              min={8}
              max={120}
              orientation="horizontal"
              size="sm"
              aria-label="Pixels per beat"
            />
          </label>

          <label style={labelStyle}>
            BPM ({bpm})
            <Fader
              value={bpm}
              onChange={v => setBpm(Math.round(v))}
              min={40}
              max={220}
              orientation="horizontal"
              size="sm"
              aria-label="BPM"
            />
          </label>

          <label style={labelStyle}>
            beats/bar
            <select
              value={numerator}
              onChange={e => setNumerator(Number(e.target.value))}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </label>

          <Toggle checked={snap}          onChange={setSnap}          label="snap"       size="sm" />
          <Toggle checked={showLaneRules} onChange={setShowLaneRules} label="lane rules" size="sm" />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
          }}>
            seek: {formatBarsBeats(seekSecs, bpm, numerator)}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────

export default function TimelineRulerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run 2>&1 | tail -15
```

Expected: all tests PASS

- [ ] **Step 4: Start dev server and verify in gallery**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npm run dev
```

Open `http://localhost:5173` → navigate to TimelineRuler in the Primitives group.

Verify:
- [ ] States grid renders: zoom levels, time signatures, snap, sm size, lane rules visible
- [ ] Chroma state shows subtle paper texture on grid; Ink state shows dark grid without paper bleed
- [ ] Playground: px/beat slider zooms the grid (gradient period changes)
- [ ] Playground: BPM slider changes beat density
- [ ] Playground: beats/bar select changes bar line period (3/4 has bar lines every 3 beats, 6/8 every 6)
- [ ] Playground: click + drag on ruler moves the playhead
- [ ] Playground: snap toggle — with snap on, playhead jumps to nearest beat
- [ ] Playground: seek readout shows correct bars:beats
- [ ] Playground: fake clip stays correctly positioned as zoom changes (proof of coordinate system)
- [ ] Compare mode (5 themes simultaneously): each theme shows the grid cleanly; no paper-colored bleed in dark themes

- [ ] **Step 5: Commit**

```bash
git add src/components/TimelineRuler/TimelineRuler.demo.tsx
git commit -m "feat(TimelineRuler): demo — states grid + playground with seek proof"
```

---

## Self-Review Checklist

### Spec coverage

| Spec requirement | Covered by |
|-----------------|------------|
| Ruler strip with bar labels + beat ticks | CSS gradients in `.strip` + `barMarks` DOM labels |
| Live musical grid (repeating-linear-gradient, reflows on change) | `.grid` in CSS, `--beat-px` + `--bar-beats` vars |
| Coordinate system: `pxPerBeat` as `--beat-px` | Inline style on root, inherited by descendants |
| `secondsToX`, `xToSeconds`, `snapXToGrid` exported | `rulerMath.ts` + barrel export |
| Props: `bpm`, `numerator`, `denominator`, `pxPerBeat`, `durationSeconds` | `TimelineRulerProps` ✓ |
| `onSeek?(seconds)` — click/drag seeks | `handlePointerDown` + `handlePointerMove` ✓ |
| `snap?: boolean` — onSeek snaps to grid | `snapXToGrid` in `seekFromClientX` ✓ |
| `size?: 'sm' \| 'md'` | `data-size` attribute + CSS ✓ |
| Chroma "paper timeline" treatment | `--texture-paper` multiply-blend in `.grid` CSS ✓ |
| Tokens only, dark themes don't bleed | `--texture-paper: none` in dark themes → no bleed ✓ |
| Click/drag → seek; keyboard arrows nudge by one beat | `handlePointerDown/Move` + `handleKeyDown` ✓ |
| `:focus-visible` ring | `.root:focus-visible` in CSS ✓ |
| `role="slider"` with `aria-valuetext` in bars:beats | `formatBarsBeats` → `aria-valuetext` ✓ |
| Demo: zoom levels, time sigs, snap, light/dark comparison | All States in `StatesDemo` ✓ |
| Demo: playground with fake playhead + clip via coordinate system | `PlaygroundDemo` ✓ |
| `prefers-reduced-motion`: reflow is instant (not animated) | Grid uses CSS vars, no CSS transitions on grid; `--dur-*` tokens zeroed by media query in global.css ✓ |

### No gaps found.
