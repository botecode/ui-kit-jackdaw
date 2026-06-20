# Playhead — Design Spec

**Date:** 2026-06-20
**Status:** Approved — ready for implementation planning

---

## Overview

The `Playhead` is the moving play cursor: a thin vertical line that sweeps across the timeline during playback, with a tactile handle cap seated in the ruler band. It renders at whatever position it is told and owns no concept of "home." Orchestration (sweep-from-edit-cursor, return-on-stop) is app wiring.

Split-cursor model: `Playhead` = moving play line only. The stationary edit cursor is a separate future primitive (`edit-cursor`). Keep this boundary clean.

---

## Architecture

### DOM structure

```
<div class="root" data-testid="playhead-root" ref={rootRef} aria-hidden data-playing? data-recording? data-interactive?>
  <div class="line" data-testid="playhead-line" />
  <div class="handle" data-testid="playhead-handle" />   ← ::before gloss, ::after seam
</div>
```

The root is zero-width (`width: 0; overflow: visible`), `position: absolute; top: 0; left: 0; bottom: 0`. The rAF or park effect writes `rootRef.current.style.transform = translateX(${x}px)`. The line and handle both extend from `left: 0` and are horizontally centered via `transform: translateX(-50%)` — so both are centered on the root's left edge, which is the playhead position. The caller places a `position: relative` container spanning ruler + lanes and renders `<Playhead />` inside it.

**Critical stacking constraint:** the Playhead's DOM ancestor must be a sibling of the lane layer at the timeline root, **not** a descendant of any clip element or clip container that may create a stacking context (via `transform`, `filter`, or `opacity < 1` during drag). A clip's stacking context caps at z-index 1–10; the playhead lives at z-index 50 and must be unreachable from below.

### Two-channel position model

Two props carry position, one duty each:

| Channel | Prop | Used when | Mechanism |
|---|---|---|---|
| Push (park) | `seconds: number` | Stopped / seek-while-stopped | `useEffect` dependency triggers DOM write |
| Pull (live) | `getSeconds: () => number` | Playing | rAF calls on every tick |

**Invariant:** both channels **must derive from the same authoritative source** (`engine.frame.seconds`). The engine emits a frame on stop/seek (push → `seconds`) and streams while playing (pull → `getSeconds`), both off `engine.frame.seconds`. Do not feed `getSeconds` from a free-running clock and `seconds` from the engine — that silently reintroduces the loop-wrap and seek-while-playing bugs the split is designed to prevent.

**Why not one channel?**
- A pull-only channel (`getSeconds` always) cannot notify on a stopped seek because no rAF is running.
- A push-only channel (`seconds` prop updated at 30 Hz) causes ~30 React re-renders per second.
- Push + pull resolves both: push for discrete events, pull for continuous sweep. Two channels, one source.

### rAF loop

```ts
// secondsToX and getSeconds kept in refs so zoom changes during playback
// are reflected on the next tick without restarting the loop.
const secondsToXRef = useRef(secondsToX)
const getSecondsRef = useRef(getSeconds)
useEffect(() => { secondsToXRef.current = secondsToX })
useEffect(() => { getSecondsRef.current = getSeconds })

useEffect(() => {
  if (!playing) {
    // Park — pull channel is idle; push channel (seconds prop) drives position.
    const dpr = window.devicePixelRatio || 1
    const x = Math.round(secondsToXRef.current(seconds) * dpr) / dpr
    rootRef.current!.style.transform = `translateX(${x}px)`
    return
  }
  let raf: number
  function tick() {
    const dpr = window.devicePixelRatio || 1
    const raw = secondsToXRef.current(getSecondsRef.current())
    const x   = Math.round(raw * dpr) / dpr
    rootRef.current!.style.transform = `translateX(${x}px)`
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}, [playing, seconds])  // seconds in deps so stop→park fires on the correct value
```

Loop wrap (`getSeconds` returns a value smaller than the previous tick) and seek-while-playing (large jump in `getSeconds`) both render correctly: the loop reads authoritative truth on every tick.

**No internal dead-reckoning clock.** Do not replace `getSecondsRef.current()` with a free-running `s0 + elapsed` expression. Such a clock ignores loop boundaries and seeks-while-playing. If smoothing between engine ticks is ever needed, it may only be used as a cosmetic inter-sample fill that re-anchors to each incoming `getSeconds()` value — never as a source of truth.

### `getSeconds` is NOT called while stopped

The park path reads from `seconds` (the push prop), not from `getSeconds()`. `getSeconds` is pull-only, called exclusively inside the rAF tick. This enforces channel separation: a caller that provides only `seconds` (no live clock) for a purely-parked indicator is a valid use case.

### Zoom during playback

`secondsToX` changes (zoom) are reflected on the next rAF tick via `secondsToXRef`. The rAF loop does **not** restart. The ref pattern is the same one `Meter.tsx` uses for its `valueRef`.

### Device-pixel crispness

```ts
const dpr = window.devicePixelRatio || 1
const x = Math.round(rawX * dpr) / dpr
```

The 1.5px line at 2× DPR = 3 physical pixels (crisp). The `Math.round` snapping ensures the line doesn't straddle a physical pixel boundary while moving.

---

## Props

```ts
export interface PlayheadProps {
  /**
   * Park/seek position in seconds. Changes on seek-while-stopped, on stop, on locate.
   * Triggers a single synchronous park write via useEffect.
   *
   * Note: pass a memoized `secondsToX` (useCallback) or any secondsToX change will
   * re-trigger the park effect on every parent render.
   */
  seconds: number

  /**
   * Imperative read for the rAF loop during playback. Called on every animation frame.
   * Must derive from the same source as `seconds` — see two-channel invariant above.
   * Typically: `useCallback(() => engineRef.current.frame.seconds, [])`
   */
  getSeconds: () => number

  /** When true: rAF loop runs and sweeps the line. When false: line is parked at `seconds`. */
  playing?: boolean

  /** When true: line and handle take the --led-red-core / --led-red recording tint. */
  recording?: boolean

  /**
   * Seconds → pixel offset from the timeline container's left edge.
   * Absorbs zoom, scroll, and any viewport offset. The Playhead never computes projection.
   * Scroll while stopped produces a new secondsToX reference → park effect re-fires → correct.
   * If anyone ever scrolls via a parent CSS transform without producing a new secondsToX
   * reference, the stopped playhead will desync. The projection must own scroll.
   *
   * Memoize with useCallback to avoid spurious park re-fires.
   */
  secondsToX: (s: number) => number

  /**
   * Reserved for scrub interaction — not wired until the split-cursor interaction
   * decision lands. When provided: handle becomes pointer-events: auto, cursor: grab.
   * When absent: handle is pointer-events: none (no dead affordance on un-wired interaction).
   *
   * NOTE: wiring onScrub also requires revisiting the aria model. The root is aria-hidden
   * while non-interactive (correct today). An interactive handle inside aria-hidden is an
   * a11y bug — the moment onScrub is provided, the root must exit aria-hidden and the
   * handle must adopt the slider model: role="slider", aria-valuemin/max/now in seconds,
   * arrow-key nudge → onScrub, :focus-visible ring on the handle. Do not ship scrub
   * without the aria flip.
   */
  onScrub?: (seconds: number) => void
}
```

---

## Visual / CSS

### Z-index layer map (timeline)

| Layer | z-index | Contents |
|---|---|---|
| Clip/grid content | 1–10 | labels (3), badges (4), split seams (10) |
| **Timeline overlay** | **50** | **Playhead** (and any future sweep overlays) |
| FxChip expanded | 200–201 | |
| Popovers / menus / dialogs | 1000+ | |

The playhead at z-index 50 is unreachable from a clip stacking context (1–10), and never covers open menus (1000+).

### Color tokens (component-scoped variables)

```css
.root {
  --ph-line: var(--led-orange);
  --ph-cap:  var(--led-orange);
  --ph-glow: var(--led-orange);
}
.root[data-recording] {
  --ph-line: var(--led-red-core);
  --ph-cap:  var(--led-red-core);
  --ph-glow: var(--led-red);
}
```

`--led-orange` is the correct unclaimed warm LED tier: red = record, yellow = solo, cyan = FX, green = done. `--led-orange-core` is intentionally not used as the line body: it is a lighter tint (`#FBA462`) that may lose contrast on light-theme arrange backgrounds; `--led-orange` (`#FA7437`, more saturated) is preferred.

**Playing vs recording distinction:** orange → red is a small hue shift. The line color change is reinforcement, not the primary record signal (the lit record button carries that load). Verify play vs record are clearly distinct in Compare. If contrast is marginal, differentiate with glow weight (heavier `box-shadow` blur radius on recording), not a hue jump. Keep `--led-orange` as the play color.

### Line (`.line`)

```
position: absolute; top: 0; bottom: 0; left: 0;
width: 1.5px;
transform: translateX(-50%);
background: var(--ph-line);
pointer-events: none;
box-shadow: 0 0 4px 1px color-mix(in srgb, var(--ph-glow) 45%, transparent);
z-index: 1;  /* within root — below handle */
```

Glow via `box-shadow` — static, not animated, survives `prefers-reduced-motion`.

### Handle (`.handle`)

```
position: absolute; top: 0; left: 0;
width: 16px; height: 20px;
border-radius: 3px;
transform: translateX(-50%);
z-index: 2;  /* within root — above line */

/* Vertical grip grooves — perpendicular to horizontal travel direction.
   Byte-for-byte the fader cap's horizontal orientation recipe. */
background:
  repeating-linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.22) 0px,
    rgba(0, 0, 0, 0.22) 1px,
    rgba(255, 255, 255, 0.07) 1px,
    rgba(255, 255, 255, 0.07) 2px,
    transparent 2px,
    transparent 5px
  ),
  var(--ph-cap);

box-shadow:
  0 2px 5px rgba(0, 0, 0, 0.5),
  0 1px 0 rgba(255, 255, 255, 0.12);
```

Verify the 0.07 white stripe reads over `--led-orange` on both dark and light backgrounds in Compare. If the warm cap washes out the groove texture, clamp to 0.09–0.11.

**Pointer-events:** `none` by default. `auto` only when `onScrub` is provided (conveyed via `data-interactive` attribute on root). A grab-affordance shape that blocks clicks is worse than no affordance.

```css
/* .handle default */
pointer-events: none;

/* when scrub is wired */
.root[data-interactive] .handle {
  pointer-events: auto;
  cursor: grab;
}
```

### Handle gloss (`.handle::before`)

```
content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
background: radial-gradient(ellipse at 38% 28%, rgba(255, 255, 255, 0.22) 0%, transparent 65%);
```

Identical to fader cap gloss. Direct material sibling.

### Center seam (`.handle::after`)

```
content: ''; position: absolute;
top: 15%;   /* small crafted inset — cap reads as capped, not ruled */
bottom: 0;  /* flush — seam meets the line as it re-emerges into the lanes */
left: 50%; transform: translateX(-50%);
width: 1.5px;  /* matches line width exactly */
background: rgba(255, 255, 255, 0.65);
border-radius: 1px;
box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.3);
pointer-events: none;
```

**Alignment invariant:** line center = `root.left + 0` (translateX −50% of 1.5px). Handle center = `root.left + 0` (translateX −50% of 16px). Seam center = `handle.left + 50%` (translateX −50% of 1.5px) = handle center = root.left + 0. All three share the same horizontal center. No offset possible from geometry.

The seam's `rgba(255, 255, 255, 0.65)` reads as contrast on both orange and red cap bodies.

### `prefers-reduced-motion`

The sweep rAF continues under reduced motion — it conveys position, which is functional, not decorative. The comment in `global.css` already establishes this: "Functional motion (playhead, meters) is kept." No suppression needed. Glow box-shadow is static (no `animation`/`transition`). Nothing to add to the CSS.

Manual verification step: toggle OS reduced-motion, confirm the sweep persists and no decorative animation fires.

---

## Demo (`Playhead.demo.tsx`)

### Fixture clock hook

```ts
function useFixtureClock(playing: boolean, loopEnd = 30) {
  const secondsRef = useRef(0)
  // getSeconds is a stable callback — never changes reference, zero re-renders
  const getSeconds = useCallback(() => secondsRef.current, [])
  // resetClock is called by the stop handler so next Play starts from 0, not last position
  const resetClock = useCallback(() => { secondsRef.current = 0 }, [])

  useEffect(() => {
    if (!playing) return
    let raf: number, last = performance.now()
    function tick(now: number) {
      secondsRef.current = (secondsRef.current + (now - last) / 1000) % loopEnd
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, loopEnd])

  return { getSeconds, resetClock }
}
```

No `setState` — zero re-renders while playing. `secondsRef` is the live clock; `getSeconds` is the pull channel. This mirrors the engine pattern exactly.

### Both channels exercised

The playground maintains `seconds` state (the push/park channel) alongside the fixture clock:

```ts
const [playing, setPlaying]     = useState(false)
const [recording, setRecording] = useState(false)
const [seconds, setSeconds]     = useState(0)                   // park channel — the push prop
const { getSeconds, resetClock } = useFixtureClock(playing)

function handlePlay()  { setPlaying(true) }
function handleStop()  { setPlaying(false); setSeconds(0); resetClock() }  // park path + clock reset
function handleSeek(s: number) { setSeconds(s) }                // seek-while-stopped and while-playing
```

On Stop: `playing` → false (rAF cancels), `seconds` → 0 (park effect fires, line returns to 0). The park path is proven in the demo, not hidden.

### Seek affordance

The playground includes a ruler strip. Clicking it calls `handleSeek(clickX / pxPerSecond)`, exercising seek-while-stopped and seek-while-playing from the same control. Label: "click ruler to seek."

### States grid (5 cells)

1. **stopped / parked** — `playing={false}`, `seconds={4}`, positioned at ~20% width
2. **playing — sweeping** — fixture clock live, `playing={true}`, 30s loop
3. **recording** — same sweep, `recording={true}`, red tint
4. **near end of project** — `playing={false}`, `seconds={28}` (93% of 30s)
5. **reduced-motion** — `playing={true}`, fixture clock live; label: "functional motion kept — verify in OS settings"

Cells 2, 3, 5 are self-contained components that each hold their own `playing` state and fixture clock.

### Playground layout

- Fake ruler (24px, `--rail-bg`, tick marks every 4s, clickable for seek)
- 3 lane bands (each 48px, `--arrange-bg`, static color blocks simulating clips)
- `TransportButton` variant="play"/"stop" pair
- `Fader` (horizontal, 8–80 px/s range) for zoom — `secondsToX` is `useCallback((s) => s * pxPerSecond, [pxPerSecond])`
- `Checkbox` for recording
- Space Mono time readout: the **one** place that reads seconds for display via a `useEffect([seconds])` that fires only when the park channel updates

---

## Tests (`Playhead.test.tsx`)

### Rendering
- Renders root with `data-testid="playhead-root"` and `aria-hidden="true"`
- Renders line element
- Renders handle with `data-testid="playhead-handle"`

### State attributes
- `data-playing` absent when `playing=false`
- `data-playing` present when `playing=true`
- `data-recording` absent by default
- `data-recording` present when `recording=true`
- `data-interactive` absent when `onScrub` not provided
- `data-interactive` present when `onScrub` is provided

### Pointer events (via `data-interactive`)
- Handle is `pointer-events: none` (no `data-interactive`) by default
- Handle is `pointer-events: auto` (has `data-interactive`) when `onScrub` provided

### Static positioning (park channel)
- Writes `translateX` on mount from `seconds` + `secondsToX`
- Re-parks when `seconds` prop changes while stopped
- Re-parks when `secondsToX` reference changes while stopped

### rAF — playing
- Starts rAF when `playing` becomes true (spy on `requestAnimationFrame`)
- Cancels rAF when `playing` becomes false
- Cancels rAF on unmount while playing (unmount-leak guard)
- Calls `getSeconds` on each rAF tick; transform reflects result

### Source-of-truth invariant (the architecture regression guard)
- `getSeconds` returning a decreasing value (loop wrap: 29 → 1) causes the transform to follow on the next tick — not stuck at the last monotonic position
- `getSeconds` returning a large forward jump (seek-while-playing: 4 → 20) causes the transform to reflect the new position on the next tick

These two tests enforce the B-over-A decision. If someone replaces `getSeconds()` with a free-running internal clock, these tests fail. They must never be removed.

### Channel separation
- `getSeconds` is NOT called while `playing=false`; park writes without a rAF loop
- Park (`seconds` change while stopped) does not start a new rAF loop

### Zoom during playback
- `secondsToX` reference change while playing is reflected on the next rAF tick
- `requestAnimationFrame` is NOT re-initialized when `secondsToX` changes mid-sweep (the ref pattern, not a loop restart)

### Accessibility
- Root has `aria-hidden="true"`

---

## File structure

```
src/components/Playhead/
  Playhead.tsx
  Playhead.module.css
  Playhead.test.tsx
  Playhead.demo.tsx
  index.ts
```

---

## Done criteria

- [ ] Playhead sweeps via GPU `transform` driven by `getSeconds()` on rAF
- [ ] Parks correctly at `seconds` when stopped, including after seek-while-stopped
- [ ] Loop wrap and seek-while-playing follow `getSeconds()` on next tick (source-of-truth tests green)
- [ ] Handle is `pointer-events: none` until `onScrub` provided
- [ ] 1.5px line stays crisp (DPR-snapped translateX) at any zoom level
- [ ] Never eats clicks on clips beneath it (root + line are `pointer-events: none`)
- [ ] Recording tint visible on line + handle across all themes
- [ ] Stays clearly above clips (z-index 50) including during clip drag (transform/opacity < 1)
- [ ] Never covers open popovers/menus (z-index < 1000)
- [ ] Reskins correctly across all themes and in Compare
- [ ] Play vs recording are clearly distinct in Compare (verify glow weight if hue alone is marginal)
- [ ] Orange grooves/gloss read correctly over `--led-orange` body on both dark and light themes
- [ ] Functional sweep persists under `prefers-reduced-motion` (manual OS setting toggle)
- [ ] `typecheck`, `lint`, `test` all green
- [ ] `secondsToX` is documented as requiring `useCallback` in the JSDoc
