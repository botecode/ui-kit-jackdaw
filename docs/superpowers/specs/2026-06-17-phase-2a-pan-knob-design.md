# PanKnob — Design Spec

> Phase 2 · Primitive controls · Jackdaw UI Kit

---

## 1. What this is

`PanKnob` is a Chroma-Console-inspired rotary control for stereo panning (−1..1). It is a **signature
tactile control** — one of the few places in the kit where craft is explicitly spent on depth and texture.
It is presentational: receives `pan` and fires `onChange`; the host wires that to `track.setPan`.

This component also establishes the **kit-wide reset convention** (see §4.4): double-click (or a keyboard
reset key) returns any value control to its neutral default. `Fader` and future controls inherit this
pattern with their own `resetValue`.

---

## 2. API

```ts
interface PanKnobProps {
  pan: number                // −1..1, −1 = hard left, 0 = center, +1 = hard right
  onChange: (pan: number) => void  // fires on every drag move, scroll, and keyboard step
  size?: 'sm' | 'md'        // default 'md'
  color?: string             // cap fill — any CSS color value; defaults to var(--accent)
  resetValue?: number        // double-click / keyboard-reset target; default 0
  disabled?: boolean
  'aria-label'?: string      // default 'Pan'
}
```

**`onChange` contract:** fires on every pointermove during drag, on each scroll event, on each key
press. The **host** is responsible for rAF-coalescing if needed for the bridge. An `onChangeCommit`
(pointerup) is a future addition for undo-grouping; do not build it in Phase 2.

---

## 3. SVG rendering

### 3.1 Single viewBox, two CSS sizes

Author geometry at `viewBox="0 0 40 40"`. CSS `width` / `height` sizes the rendered output:

```css
.knob { width: 40px; height: 40px; }              /* md — default */
.knob[data-size="sm"] { width: 32px; height: 32px; }
```

React renders one SVG element; the browser scales the rasterized output.

### 3.2 Layer split

```
<svg viewBox="0 0 40 40">
  <!-- Static layer: stays fixed -->
  <g class="well">
    <!-- recessed well ring + shadow — visual depth behind the knob body -->
  </g>
  <g class="ticks">
    <!-- 13 tick marks at −135°, −112.5°, …, 0°, …, +135° -->
    <!-- center tick (0°) is 2× height and stroke = --border-strong -->
  </g>

  <!-- Rotating layer: rotates together as one body -->
  <g class="body" style="transform: rotate(Xdeg); transform-origin: 20px 20px">
    <!-- knurled grip ring (outer ~35% of radius, 24/16 radial lines) -->
    <!-- colored cap (circle, fill = color prop) with radial-gradient highlight -->
    <!-- pointer notch (short rectangle at top of cap, fill = --accent-contrast) -->
  </g>
</svg>
```

**Why the grip rotates with the cap:** on a real knob the grip *is* the part you turn; rotating the entire
body (grip + cap + pointer) reads as an authentic knob, not a decorative collar with a spinning button.

### 3.3 Token map

| Element | Token |
|---|---|
| Well background / collar | `--surface-2` |
| Well shadow (inner ring) | `box-shadow` using `--border` at low opacity |
| Tick marks (outer 12) | `--border` |
| Center detent tick | `--border-strong`, 2× taller |
| Knurl lines | `--border` at 0.5 opacity, `shape-rendering: crispEdges` |
| Cap fill | `color` prop (default: `var(--accent)`) |
| Cap highlight | radial gradient from cap color → 15% white at top-left |
| Pointer notch | `var(--accent-contrast)` |
| Pointer hairline stroke | `var(--bg)` at 0.4 opacity — survives on light caps |
| Readout text | `--text-muted`, `--font-mono`, `--text-xs` |

**Why `--accent-contrast` for the pointer:** the theme system guarantees this color is legible on
`--accent`. In default it is `#fff` (white on amber), in tropicália it is `#2a1a0a` (near-black on hot
pink). The hairline `--bg` stroke adds extra safety for custom `color` props. Verify in compare mode
against manuscript and tropicália — those are the light-cap stress tests.

### 3.4 Knurl density

24 radial lines in the outer 35% of the radius (do not extend to centre). At CSS `width: 32px` (sm),
the SVG is downscaled and fine lines moiré — reduce to 16 lines via a `data-size="sm"` branch or a
second `<defs>` pattern. `shape-rendering: crispEdges` on all knurl strokes.

### 3.5 Rotation formula

```ts
// pan ∈ [−1, 1] → degrees ∈ [−135, 135]
export function panToAngle(pan: number): number {
  return Math.max(-135, Math.min(135, pan * 135))
}
```

The SVG `.body` group receives `style={{ transform: `rotate(${angle}deg)` }}` with
`transformOrigin: '20px 20px'` (centre of the 40×40 viewBox).

---

## 4. Interaction

### 4.1 Vertical drag (1:1, no spring)

```
pointerdown  → capture pointer, record startY + startPan
pointermove  → Δy = e.clientY − startY (negative = upward = rightward)
               newPan = clamp(startPan + Δy * −0.007, −1, 1)
               onChange(newPan)
pointerup    → release capture
```

Drag is **strictly 1:1**. No spring, no momentum. The visual rotation tracks the pointer exactly because
the SVG reads the committed `pan` prop on each re-render.

**Shift+drag** (fine mode): multiply sensitivity by 0.2 (effective 0.0014 per pixel — ~714px for full
sweep). Check `e.shiftKey` on each pointermove.

### 4.2 Scroll wheel (native listener, not React `onWheel`)

React attaches `onWheel` as a passive listener — `preventDefault()` silently does nothing. Attach a
native listener via `useEffect` **once** (`[]` deps). Read current `pan` and `onChange` through refs
inside the handler — never close over them directly (re-attaching on every `pan` change drops events
mid-stream and churns the event system on every scroll tick).

```ts
const panRef = useRef(pan)
const onChangeRef = useRef(onChange)
useEffect(() => { panRef.current = pan })          // sync ref every render (no deps needed)
useEffect(() => { onChangeRef.current = onChange })

useEffect(() => {
  const el = svgRef.current!
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = Math.max(-0.08, Math.min(0.08, -e.deltaY * 0.0015))
    onChangeRef.current(Math.max(-1, Math.min(1, panRef.current + delta)))
  }
  el.addEventListener('wheel', onWheel, { passive: false })
  return () => el.removeEventListener('wheel', onWheel)
}, [])   // attach once — values come from refs, not the closure
```

Scale by actual `deltaY` (not `Math.sign`) to handle trackpad streams correctly. Cap at ±0.08 per event.

### 4.3 Keyboard (`role="slider"`)

```
ArrowRight / ArrowUp     → +0.05
ArrowLeft / ArrowDown    → −0.05
Shift + Arrow            → ±0.25 (coarse)
PageUp                   → +0.25
PageDown                 → −0.25
Home                     → −1
End                      → +1
Backspace / Delete / 0   → resetValue (triggers reset settle, see §4.4)
```

All values clamped to [−1, 1] before firing `onChange`.

ARIA attributes on the SVG element:
```tsx
role="slider"
aria-valuemin={-1}
aria-valuemax={1}
aria-valuenow={pan}
aria-valuetext={formatReadout(pan)}   // e.g. "Left 20", "Center", "Right 35"
aria-label={props['aria-label'] ?? 'Pan'}
aria-disabled={disabled}
tabIndex={disabled ? -1 : 0}
```

### 4.4 Double-click reset (kit-wide convention)

Both double-click and the keyboard reset keys (`Backspace`, `Delete`, `0`) reset the control to
`resetValue` (default: 0). This is the **kit-wide interaction convention**: every value control in
Jackdaw resets to its neutral default on double-click or keyboard reset. `Fader` will inherit this with
`resetValue = 0` (unity / 0 dB).

**Settlement animation (spring, reset only):**

The reset uses `useSpring` from `src/motion/spring.ts` to animate the visual angle. Spring parameters:
stiffness 200, damping 30 (ζ ≈ 1.06 — firm settle, zero overshoot). Tune for a "mixer-board
mechanical" feel — weighted, ~200ms, no elasticity. If it reads too soft, a near-linear travel with a
firm ease-out stop is an acceptable alternative.

**Critical:** the spring drives **only the visual rotation** during reset. The committed value
(`onChange(resetValue)`) is emitted **once** at the start of the gesture, not on each spring tick. Drag
and external `pan` prop changes always snap the visual directly — no spring lag.

**`prefers-reduced-motion`:** snap visual to `resetValue * 135` instantly. No animation.

#### Required `useSpring` extension: seeded start position

The existing `useSpring(target)` maintains internal `{ pos, vel }` state that persists across renders.
Without seeding, the spring's `pos` is stale (wherever it last settled) when a reset fires — so the
knob snaps to near-zero and "settles" over nothing instead of gliding from the current drag position to
the reset target.

Extend `useSpring` to accept `from` and `key` in config:

```ts
// Extended signature (src/motion/spring.ts)
interface Config {
  stiffness?: number
  damping?: number
  from?: number   // when provided, seeds state.current = { pos: from, vel: 0 }
  key?: number    // increment to force re-seed even when 'from' value is unchanged
}
```

In the hook's `useEffect`, before starting the RAF loop:
```ts
if (config?.from !== undefined) {
  state.current = { pos: config.from, vel: 0 }
}
```

Both `config.from` and `config.key` must be in the effect dependency array so a change triggers
the re-seed. This is a shared primitive — **Fader's reset-to-unity will use the exact same extension.**

**Implementation sketch (PanKnob):**

```ts
const [resetting, setResetting] = useState(false)
// resetSeed tracks the start position and a key to force re-seeding on repeated resets
const [resetSeed, setResetSeed] = useState<{ from: number; key: number; target: number }>({
  from: pan * 135, key: 0, target: pan * 135,
})

const springAngle = useSpring(resetSeed.target, {
  stiffness: 200,
  damping: 30,
  from: resetSeed.from,
  key: resetSeed.key,
})

// Display angle: spring only during active reset, direct otherwise
const displayAngle = resetting ? springAngle : pan * 135

// Detect spring settling to end reset mode
useEffect(() => {
  if (resetting && Math.abs(springAngle - resetSeed.target) < 0.5) {
    setResetting(false)
  }
}, [resetting, springAngle, resetSeed.target])

function handleReset() {
  const currentAngle = pan * 135        // capture where we actually are right now
  const targetAngle = (resetValue ?? 0) * 135
  onChange(resetValue ?? 0)             // commit immediately
  setResetSeed(prev => ({
    from: currentAngle,
    key: prev.key + 1,                  // force re-seed even if from value is the same
    target: targetAngle,
  }))
  setResetting(true)
}
```

---

## 5. Value readout

Format function:

```ts
export function formatReadout(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'C'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `L${pct}` : `R${pct}`
}
// formatReadout(0)     → "C"
// formatReadout(-0.2)  → "L20"
// formatReadout(0.204) → "R20"    (rounds to nearest integer)
// formatReadout(1)     → "R100"
```

The readout `<span>` lives **below the SVG** in the component's DOM, always reserving its line height
(no layout shift). Visible when `:hover` or `[data-dragging]`. CSS:

```css
.readout {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  height: var(--text-xs);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.root:hover .readout,
.root[data-dragging] .readout { opacity: 1; }
```

The full `aria-valuetext` for screen readers uses the long form ("Left 20", "Center", "Right 35") even
though the visual readout shows the short form ("L20", "C", "R35").

---

## 6. States

| State | Visual treatment |
|---|---|
| Default | Normal rendering |
| Hover | Readout fades in; subtle cap brightness lift (+5% lightness) |
| Focus (keyboard) | `box-shadow: 0 0 0 2px var(--accent)` on `:focus-visible` ONLY (not `:focus`) with `border-radius: 50%` on the wrapper div — circular ring |
| Active / dragging | `data-dragging` attr set; readout visible; cap slightly brighter |
| Disabled | `pointer-events: none`, `tabIndex={-1}`, cap + collar at 40% opacity, no readout |

**`:focus-visible` is required, not `:focus`.** Clicking to drag must not leave a ring behind.

---

## 7. File structure

```
src/components/PanKnob/
  PanKnob.tsx           # component + helpers (panToAngle, formatReadout, clamp)
  PanKnob.module.css    # CSS Modules, tokens only — no hardcoded values
  PanKnob.demo.tsx      # gallery demo (meta export + StatesGrid + Playground)
  index.ts              # export { PanKnob } from './PanKnob'
```

Demo meta:
```ts
export const meta: DemoMeta = {
  name: 'PanKnob',
  group: 'Primitives',
  route: '/pan-knob',
  order: 1,
}
```

---

## 8. Demo

**StatesGrid (5 cells):**
- Default `pan=0`
- Hover (visual class applied)
- Focus (`:focus-visible` ring visible)
- Active/dragging (`data-dragging` applied)
- Disabled `pan=0.3 disabled`

**Playground controls:**
- `pan`: range input −1..1 step 0.01
- `size`: radio sm / md
- `color`: text input (CSS color value)
- `resetValue`: number input

**Compare mode:** verify in default, tropicália (light cream bg, hot-pink accent → near-black pointer),
and manuscript (warm white bg, blue accent → white pointer). Tropicália is the primary stress test for
pointer contrast on a light cap. Both should render without any visual ambiguity in the pointer notch.

**Gallery hint:** display a one-line "double-click to reset" hint in the Playground. The settle should
be visible and feel mechanical, not springy.

---

## 9. Tests (`PanKnob.test.tsx`)

Pure-function and keyboard tests. Do not simulate drag — that belongs in Playwright E2E tests.

```ts
describe('panToAngle', () => {
  it('maps 0 to 0°',    () => expect(panToAngle(0)).toBe(0))
  it('maps 1 to 135°',  () => expect(panToAngle(1)).toBe(135))
  it('maps -1 to -135°',() => expect(panToAngle(-1)).toBe(-135))
  it('clamps > 1',      () => expect(panToAngle(1.5)).toBe(135))
  it('clamps < -1',     () => expect(panToAngle(-1.5)).toBe(-135))
})

describe('formatReadout', () => {
  it('0 → C',           () => expect(formatReadout(0)).toBe('C'))
  it('-0.2 → L20',      () => expect(formatReadout(-0.2)).toBe('L20'))
  it('0.35 → R35',      () => expect(formatReadout(0.35)).toBe('R35'))
  it('0.204 → R20',     () => expect(formatReadout(0.204)).toBe('R20'))  // rounds
  it('1 → R100',        () => expect(formatReadout(1)).toBe('R100'))
  it('-1 → L100',       () => expect(formatReadout(-1)).toBe('L100'))
})

describe('keyboard interaction', () => {
  // render with pan=0, spy on onChange
  it('ArrowRight → +0.05')
  it('ArrowLeft → -0.05')
  it('ArrowUp → +0.05')
  it('ArrowDown → -0.05')
  it('Shift+ArrowRight → +0.25')
  it('PageUp → +0.25')
  it('PageDown → -0.25')
  it('Home → -1')
  it('End → +1')
  it('Delete → resetValue (default 0)')
  it('Backspace → resetValue (default 0)')
  it('0 key → resetValue (default 0)')
  it('Delete with resetValue=0.5 → 0.5')
  it('ArrowRight at pan=1 → onChange not called with value > 1')
  it('ArrowLeft at pan=-1 → onChange not called with value < -1')
})

describe('accessibility', () => {
  it('has role=slider')
  it('has aria-valuemin=-1, aria-valuemax=1')
  it('aria-valuetext is "Center" at pan=0')
  it('aria-valuetext is "Left 20" at pan=-0.2')
  it('aria-disabled when disabled prop set')
})

describe('reset gesture', () => {
  it('double-click calls onChange(0) with default resetValue')
  it('double-click calls onChange(resetValue) with custom resetValue prop')
  it('Backspace calls onChange(resetValue)')
  it('Delete calls onChange(resetValue)')
  it('0 key calls onChange(resetValue)')
})

describe('prefers-reduced-motion', () => {
  // mock window.matchMedia to return matches: true, then verify reset snaps
  it('reset snaps immediately to resetValue without animation under reduced-motion')
})
```

---

## 10. DoD checklist

- [ ] Renders correctly in default, tropicália, and manuscript (compare mode)
- [ ] Pointer notch legible on all 14 themes in compare mode
- [ ] Drag is 1:1 — no spring lag during mouse/touch drag
- [ ] Scroll works on trackpad (delta-scaled, not sign-based)
- [ ] Double-click reset springs to `resetValue`, feels mechanical not elastic
- [ ] `prefers-reduced-motion`: reset snaps instantly
- [ ] Full keyboard map functional
- [ ] `:focus-visible` ring appears; no ring left after click-drag
- [ ] `disabled` state: fully inert (no pointer events, no keyboard focus)
- [ ] No hardcoded colors, sizes, durations, or font values — tokens only
- [ ] `npx tsc --noEmit` clean
- [ ] All tests pass
