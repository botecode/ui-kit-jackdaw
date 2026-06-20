# EditCursor — Design Spec

**Date:** 2026-06-20
**Status:** Approved — ready for implementation

---

## Overview

`EditCursor` is the "we are here" stationary marker for the Jackdaw timeline. It marks where playback starts, where edits land, where paste and new recordings are inserted. It is the quiet, fixed counterpart to the sweeping `Playhead`.

**Split-cursor model (Reaper-style, decided):** Play starts *from* the edit cursor; the play line sweeps away. Stop returns the play line *to* the edit cursor. This is what lets you replay a section while edits always land at a fixed point. Contract grounding: `transport.seek {seconds}` = "Set the cursor — Play and Record start from this position."

---

## Architecture

### Positioning model

Identical to `Playhead`, minus the rAF sweep channel:

- Root: `position: absolute; top: 0; bottom: 0; left: 0; width: 0; overflow: visible; pointer-events: none; will-change: transform`
- Position written imperatively: `rootRef.current.style.transform = translateX(${x}px)` via `useEffect`
- DPR-snap: `x = Math.round(secondsToX(seconds) * dpr) / dpr` — line never straddles a device pixel boundary
- **No rAF loop.** EditCursor is push-only — it moves solely on user action (click-to-place, drag, arrow-key). `onSeek` is the single output.

### Children

```
.root (zero-width abs, translateX)
├── .line (pointer-events: none — the vertical rule)
└── .handleWrap (pointer-events: auto — focusable, role="slider", focus ring)
    └── .handle (clip-path triangle, aria-hidden — visual only)
```

The `handleWrap` / `handle` split is structurally required: `clip-path` clips the entire paint box including `outline` and `box-shadow`. Putting `role="slider"` and `:focus-visible` on the clipped element would clip the focus ring — an a11y failure. The unclipped `handleWrap` carries all interactive and aria attributes; the clipped triangle `handle` is `aria-hidden`.

### Props

```ts
interface EditCursorProps {
  seconds: number                    // current cursor position; drives park effect
  secondsToX: (s: number) => number  // caller-supplied projection (absorbs zoom + scroll) — memoize
  durationSeconds?: number           // fallback: 3600 — drives aria-valuemax and clamp ceiling
  onSeek: (seconds: number) => void  // emits on drag, arrow-key, Home/End
  disabled?: boolean                 // true → tabIndex=-1, aria-disabled, pointer-events off, events suppressed
  'aria-label'?: string              // default: "Edit cursor"
  step?: number                      // small arrow-key nudge in seconds; default: 1.0
  largeStep?: number                 // Page Up/Down nudge in seconds; default: 10.0
}
```

`onSeek` maps to `transport.seek {seconds}` in the app. Drag, arrow-key, and caller ruler-click all funnel here. No gesture batching needed — `transport.seek` is a discrete locate, not a continuous gesture.

### Park effect

```ts
useEffect(() => {
  const el = rootRef.current
  if (!el) return
  const dpr = window.devicePixelRatio || 1
  const x = Math.round(secondsToX(seconds) * dpr) / dpr
  el.style.transform = `translateX(${x}px)`
}, [seconds, secondsToX])
```

No `playing` guard — unlike Playhead, there is no rAF channel to suppress.

**No `secondsToXRef`.** Playhead needed a ref so its live rAF loop could read the latest projection without restarting. EditCursor has no loop — `secondsToX` lives in deps and the effect calls it directly. Porting the ref here is inert scaffolding.

---

## Interaction

### Keyboard (`handleWrap` receives `onKeyDown`)

| Key | Action |
|-----|--------|
| `→` | `onSeek(clamp(seconds + step, 0, max))` |
| `←` | `onSeek(clamp(seconds - step, 0, max))` |
| `PageUp` | `onSeek(clamp(seconds + largeStep, 0, max))` |
| `PageDown` | `onSeek(clamp(seconds - largeStep, 0, max))` |
| `Home` | `onSeek(0)` |
| `End` | `onSeek(max)` |

`max = durationSeconds ?? 3600`. `e.preventDefault()` on all matched keys to prevent scroll.

All paths **disabled when `disabled` prop is true** — no `onSeek` emitted.

### Drag (pointer capture on `handleWrap`)

1. `pointerdown` → `e.currentTarget.setPointerCapture(e.pointerId)` + record `startClientX` + current `seconds`
2. `pointermove` → compute delta in pixels → convert to seconds via inverse projection → `onSeek(clamp(result, 0, max))`
3. `pointerup` / `pointercancel` → release capture

Drag is 1:1 with the pointer. No momentum. Any decorative settle-on-release pulse is suppressed under `prefers-reduced-motion`.

All drag events **suppressed when `disabled`**.

**Drag inverse projection.** On `pointerdown`, record `startClientX` and `startSeconds`. Derive `pxPerSecond = secondsToX(1) - secondsToX(0)` (two-point sample — cancels any scroll offset, assumes linearity only). On `pointermove`: `deltaSeconds = (e.clientX - startClientX) / pxPerSecond`, result `clamp(startSeconds + deltaSeconds, 0, max)`. This derives the scale from the projection passed in rather than hardcoding the caller's formula — preserving the "EditCursor never knows the projection's internals" contract.

### Clamp invariant

Every path that calls `onSeek` clamps to `[0, max]` before calling.

---

## Visual / CSS

### Z-index

Edit cursor: `z-index: 49`. Playhead: `z-index: 50`. The sweeping play line always reads on top when they meet.

### Line

- Width: 1px (vs. Playhead's 1.5px)
- Style: dashed via `repeating-linear-gradient(to bottom, var(--ec-line) 0 4px, transparent 4px 8px)` — gradient dashes stay locked to the line under translateX, unlike `border-style: dashed` which would re-anchor
- Color: `--ec-line: var(--text-dim)`
- **No glow, no `box-shadow`** — the playhead's incandescent halo is intentionally absent
- `transform: translateX(-50%)` to center on the root

**Implementation-time check (day one):** Verify the line is findable over clip bodies (colored `background-color` + texture), not just over bare `--arrange-bg`, in Compare across light and dark themes. Three compounding "quiet" choices (1px, dashed, `--text-dim`, no glow) can push the line past "calm" into "invisible" over certain clip colors. If it disappears, add a hairline contrast edge — explicitly **not** the playhead's bloom — using `--ec-line` alias so it's a one-line CSS change with no API impact.

### Handle (caret)

**Vertical position:** `top: 20px` on `handleWrap` — places the caret base exactly where the Playhead cap ends (cap is `top: 0; height: 20px`). The caret at 9px tall spans y=20–29px, dipping 5px below the 24px ruler band into the first lane. This reads as "pointing into the content" and ensures full visual separation from the playhead cap at the stopped/co-located moment.

**Shape:** `clip-path: polygon(0 0, 100% 0, 50% 100%)` on `.handle` (the aria-hidden visual child). Proportioned ~20px wide × 9px tall — ≈120° point angle. Clearly obtuse: reads "location pin / insertion point," not a rotated play glyph.

**Color:** `--ec-handle: var(--text-muted)` — one rung stronger than `--ec-line: var(--text-dim)` so the handle reads grabbable, not disabled.

**Surface treatment (implied-soft-light, no bevel):**
```css
background: linear-gradient(
  to bottom,
  color-mix(in srgb, white 14%, var(--ec-handle)) 0%,
  var(--ec-handle) 45%,
  color-mix(in srgb, black 12%, var(--ec-handle)) 100%
);
```

No `border-radius` (the clip-path defines the silhouette).

**`handleWrap`:** Sized to the caret footprint (`width: 20px; height: 9px`) with `transform: translateX(-50%)`. Carries `role="slider"`, `tabIndex`, `aria-*`, pointer/key handlers.

**Focus ring on `handleWrap`:**
```css
.handleWrap:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);
  outline-offset: 3px;
  border-radius: 2px;
}
```

No clip-path on `handleWrap` — ring is never clipped.

**Co-location: verify the stopped state.** With Playhead cap above (y=0–20, z=50) and EditCursor caret below (y=20–29, z=49) at the same x, the two handles should read as stacked distinct markers. The stopped state is when the edit cursor is the active reference — verify in the demo that the caret is fully legible in cell 5 (co-located / stopped).

### Disabled state

```css
.root[data-disabled] .handleWrap {
  pointer-events: none;
  opacity: 0.4;
}
```

### Reduced-motion

EditCursor has no continuous animation. Relocation is a placement (instant jump). Any decorative settle pulse: `transition: none` under `@media (prefers-reduced-motion: reduce)`.

---

## Accessibility

- `role="slider"` on `handleWrap`
- `aria-valuemin={0}`
- `aria-valuemax={durationSeconds ?? 3600}`
- `aria-valuenow={seconds}`
- `aria-valuetext={formatTime(seconds)}` — human-readable (e.g. "0:04" / "4.0 seconds") so screen readers announce something meaningful, not just "4"
- `aria-label={props['aria-label'] ?? 'Edit cursor'}`
- `aria-disabled={disabled || undefined}`
- `tabIndex={disabled ? -1 : 0}`
- `:focus-visible` ring on `handleWrap` (unclipped)

---

## Demo

**States grid — 6 cells:**

1. **At 0** — caret parked at timeline start
2. **Mid-timeline** — caret at ~⅓ of duration
3. **Near end** — caret near right boundary
4. **Focused** — focus ring visible; rendered via a forced `data-focused` attribute / CSS class on `handleWrap`, **not `autoFocus`** (which grabs document focus and scrolls the gallery on mount)
5. **Co-located / stopped** — real `Playhead` + `EditCursor` at the same `seconds`, the key legibility test: two visually distinct markers at the same x; caret point visible below the play cap
6. **Playing** — real `Playhead` sweeping from the edit cursor's `seconds`; `EditCursor` stationary; demonstrates the split-cursor contract

**Playground:**

Shared state: `seconds` (edit cursor position), `playing`, `pxPerSecond` (zoom).

Fixture clock: seeded from `seconds` on Play start — **not from 0**. This ensures the Playhead sweep begins from the edit cursor's current position, demonstrating the transport.seek contract.

During Play: the fixture clock advances `Playhead.getSeconds` only. **`setSeconds` is never called from the clock.** The edit cursor stays frozen. The only ways `seconds` changes during Play are ruler-click, handle-drag, or arrow-key — all of which also call `onSeek` and would be deliberate re-placements.

On Stop: `setPlaying(false)`, `Playhead` parks back to `seconds` (which hasn't moved during Play).

**Two readouts during Play:** edit-cursor position (frozen, labeled "edit") and live Playhead position (moving, labeled "play") — makes the divergence visible to a reviewer.

Controls: `TransportButton` Play/Stop, `Fader` for zoom, ruler click → `onSeek`, handle drag → `onSeek`, arrow-key nudge → `onSeek`.

---

## Tests

### Rendering
- Root, line, `handleWrap`, `handle` children exist (each with `data-testid`)
- **Structural focus-ring guard:** `handleWrap` carries `role="slider"` and is the focusable element; clipped `handle` child is `aria-hidden`. This pins the wrapper/clip-path separation against regression — moving `role`/`tabIndex` back onto the clipped element would re-clip the ring without breaking any other test.

### ARIA
- `aria-valuemin=0`, `aria-valuemax={durationSeconds ?? 3600}`, `aria-valuenow=seconds`, `aria-valuetext` (formatted string)
- `aria-label` defaults to "Edit cursor"
- With `durationSeconds` absent: `aria-valuemax=3600`, `End` key fires `onSeek(3600)`

### Park channel (DPR=1 in jsdom, no rounding complication)
- Mount: `translateX(secondsToX(seconds)px)` written
- Re-parks when `seconds` prop changes
- Re-parks when `secondsToX` reference changes (zoom)
- **No rAF started** — `requestAnimationFrame` must not be called (park is fully synchronous via `useEffect`)

### Keyboard (stub `onSeek` with `vi.fn()`)
- `→` fires `onSeek(seconds + step)`, `←` fires `onSeek(seconds - step)`
- `PageUp` fires `onSeek(seconds + largeStep)`, `PageDown` fires `onSeek(seconds - largeStep)`
- `Home` fires `onSeek(0)`, `End` fires `onSeek(max)`
- Arrow/Page clamp to `[0, max]` (test at boundaries: seconds=0 + `←` stays at 0, seconds=max + `→` stays at max)

### Drag
- `pointerdown` calls `setPointerCapture` (optional but cheap — verifies capture is wired)
- `pointermove` fires `onSeek` with seconds derived via two-point scale: `pxPerSecond = secondsToX(1) - secondsToX(0)`, `result = clamp(startSeconds + deltaPx / pxPerSecond, 0, max)`. Test asserts the value, not a hardcoded pixel constant, so the assertion stays honest when `secondsToX` changes.
- `pointerup` stops `onSeek` calls
- Result is clamped to `[0, max]`

### Disabled — complete no-op
- `tabIndex=-1`, `aria-disabled` set
- `→`, `←`, `PageDown`, `PageUp`, `Home`, `End` fire **no** `onSeek`
- Drag (`pointerdown → pointermove`) fires **no** `onSeek`

### `durationSeconds` fallback
- With prop absent: `aria-valuemax=3600`, `End` → `onSeek(3600)`
- With prop present: `aria-valuemax=durationSeconds`, `End` → `onSeek(durationSeconds)`

---

## File structure

```
src/components/EditCursor/
├── EditCursor.tsx
├── EditCursor.module.css
├── EditCursor.test.tsx
├── EditCursor.demo.tsx
└── index.ts
```

Barrel export: `EditCursor`, `EditCursorProps`.

---

## Out of scope (later, on app migration)

- Wiring `transport.seek` — the demo uses a stub `onSeek`
- App-level paste / record / play-start landing at the edit cursor (current app uses one cursor; revisit on migration)
- Grid-aware nudge step (snap-to-beat via BPM) — `step`/`largeStep` props leave the door open without requiring it
