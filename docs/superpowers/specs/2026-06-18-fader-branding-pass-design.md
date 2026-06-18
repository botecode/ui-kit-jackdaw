# Fader Branding Pass — Design Spec

**Date:** 2026-06-18  
**Scope:** Visual overhaul of the existing `Fader` component — no API additions except `ticks?`, no logic changes, no motion changes. `typecheck / lint / test` green at the end.

---

## What already exists (do not change)

- `Fader.tsx` — component logic, props, pointer/keyboard/wheel interaction, spring reset/detent-snap. **Unchanged.**
- `faderScales.ts` — `linearScale`, `dbScale`, `clamp`, `quantizeValue`. **Unchanged.**
- `Fader.test.tsx` — all existing tests cover interaction + ARIA; none test visual structure so the DOM changes below are test-safe. **Passes as-is.**
- `Fader.demo.tsx` — playground already uses horizontal `Fader`s as its own controls (dogfooded). Demo meta already has `route: '/fader'`, `order: 2`. **Unchanged except adding `ticks` prop to the main dB fader states/playground.**
- `PanKnob.demo.tsx` — already uses `<Fader orientation="horizontal">` for pan and resetValue controls. **No further dogfooding needed.**
- Duplicate sidebar entry: Fader is not in `planned.ts`, so the duplicate is likely already resolved. Verify in gallery during implementation; if a duplicate entry appears, remove from `planned.ts`.

---

## New prop

```ts
// in FaderProps
ticks?: number[]
```

An array of values (in the same unit as `min`/`max`) the component maps through `scale.toPosition()` and renders as major tick marks on the scale strip. The consumer decides what to mark. The unity notch is identified by matching against `detent.value` (if provided) among the `ticks` array.

**Example usage:**
```tsx
// Main dB fader in the demo
<Fader
  value={volume}
  min={-60} max={6}
  scale={dbScale()}
  detent={{ value: 0 }}
  ticks={[6, 0, -6, -12, -24, -60]}
/>

// Horizontal playground controls — no ticks (short control, no clutter)
<Fader orientation="horizontal" ... />
```

---

## DOM changes (Fader.tsx)

### 1. Remove `.fill`
Delete `<div className={styles.fill} style={...} />` from the render. No test references it.

### 2. Move `--detent-pos` to `.track`
Currently the `--detent-pos` CSS variable is set as inline style on the `.detentTick` child. Move it to the `.track` element so descendant elements and pseudo-elements can inherit it without needing separate prop threading.

```tsx
// Before: --detent-pos on .detentTick only
// After:  --detent-pos on .track, available to both .detentTick and .scale children
<div
  ref={trackRef}
  className={styles.track}
  style={detent ? { '--detent-pos': detentPosition } as React.CSSProperties : undefined}
  ...
>
```

### 3. Add `.scale` strip with `.tickMark` children
Inside `.track`, after `.detentTick` and before `.cap`:

```tsx
{ticks && ticks.length > 0 && (
  <div className={styles.scale} aria-hidden="true">
    {ticks.map(tickValue => {
      const pos = clamp(effectiveScale.toPosition(tickValue, min, max), 0, 1)
      const isUnity = detent != null && tickValue === detent.value
      return (
        <div
          key={tickValue}
          className={isUnity ? `${styles.tickMark} ${styles.tickUnity}` : styles.tickMark}
          style={{ '--tick-pos': pos } as React.CSSProperties}
        />
      )
    })}
  </div>
)}
```

---

## CSS changes (Fader.module.css)

### Remove `.fill` styles entirely

### `.track` — recessed milled channel

```css
.track {
  position: relative;
  background: var(--stage);
  border-radius: 3px;
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.7),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
  flex-shrink: 0;
}
```

The `box-shadow` recipe is borrowed from `Meter`'s `.well` — the same "stage well" feel.

### `.scale` — printed scale strip

The `.scale` element is absolutely positioned *beside* the track (right of the channel for vertical, below for horizontal), matching the full track dimension on the travel axis.

```css
/* Vertical: strip to the right */
.root[data-orientation='vertical'] .scale {
  position: absolute;
  left: calc(100% + 3px);
  top: 0;
  bottom: 0;
  width: 10px;
}

/* Horizontal: strip below */
.root[data-orientation='horizontal'] .scale {
  position: absolute;
  top: calc(100% + 3px);
  left: 0;
  right: 0;
  height: 10px;
}
```

### `.tickMark` — major mark

```css
.tickMark {
  position: absolute;
  background: var(--text-muted);
}

/* Vertical: horizontal line at (1 - --tick-pos) * 100% from top */
.root[data-orientation='vertical'] .tickMark {
  left: 0;
  width: 6px;
  height: 1px;
  top: calc((1 - var(--tick-pos, 0)) * 100%);
}

/* Horizontal: vertical line at --tick-pos * 100% from left */
.root[data-orientation='horizontal'] .tickMark {
  top: 0;
  height: 6px;
  width: 1px;
  left: calc(var(--tick-pos, 0) * 100%);
}
```

### `.tickUnity` — unity / 0 dB notch (emphasis)

```css
.tickUnity {
  background: var(--border-strong);
}

/* Slightly wider mark for the unity notch */
.root[data-orientation='vertical'] .tickUnity    { width: 9px; height: 2px; }
.root[data-orientation='horizontal'] .tickUnity  { height: 9px; width: 2px; }
```

### `.cap` — dimensional knurled cap

**Knurl grooves run perpendicular to the travel axis** — horizontal ridges on a vertical fader (the grip direction), vertical ridges when horizontal.

```css
/* Vertical cap knurl: 0deg = horizontal grooves */
.root[data-orientation='vertical'] .cap {
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.22) 0px,
      rgba(0, 0, 0, 0.22) 1px,
      rgba(255, 255, 255, 0.07) 1px,
      rgba(255, 255, 255, 0.07) 2px,
      transparent 2px,
      transparent 5px
    ),
    var(--fader-accent, var(--accent));
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.12);
  /* positioning stays the same as current */
}

/* Horizontal cap knurl: 90deg = vertical grooves */
.root[data-orientation='horizontal'] .cap {
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
    var(--fader-accent, var(--accent));
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.12);
}
```

The 5px pitch (1px dark + 1px highlight + 3px flat) makes the knurl read as milled at all sizes.

**Base transition for the LED bloom:**
```css
.cap {
  /* ... existing position/size rules ... */
  transition: box-shadow var(--dur-fast) var(--ease-out);
}
```

### LED bloom — active / focused states

```css
.root:is([data-dragging], :focus-visible) .cap {
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 1.5px color-mix(in srgb, var(--fader-accent, var(--accent)) 70%, transparent),
    0 0 12px 4px color-mix(in srgb, var(--fader-accent, var(--accent)) 30%, transparent);
}
```

- First two layers: the same cast shadow — keeps depth even when glowing
- `0 0 0 1.5px` ring: the hot LED edge
- `0 0 12px 4px` bloom: diffuse light spill

`prefers-reduced-motion` zeroes `--dur-fast` → the glow jumps instantly instead of fading. The glow itself remains because it signals an active functional state (dragging / keyboard focus), not purely decoration.

**Note on LED family:** The Meter uses the full `--led-*` core→body+glow recipe. The fader bloom uses `--accent` via `color-mix` for simplicity. If later sessions align all "lit" elements under one recipe (e.g., by giving `Fader` a `--fader-led` token pointing at the theme's accent LED triplet), that can be layered in. Not in scope for this pass.

### Focus ring / bloom composition

The root's `:focus-visible` ring (`box-shadow: 0 0 0 2px var(--accent)` on `.root`) and the cap's bloom are on different elements, so they don't fight. On keyboard focus the user sees both: the outer focus halo on the root, and the inner cap glow. Visual composition should be eyeballed in the gallery.

---

## Demo updates (Fader.demo.tsx)

Add `ticks={[6, 0, -6, -12, -24, -60]}` to the vertical dB fader instances in `StatesDemo` and `PlaygroundDemo`. Horizontal playground controls do **not** get `ticks` (too short, looks cluttered). The `detent={{ value: 0 }}` already present means the 0 dB tick renders with `.tickUnity` emphasis automatically.

---

## Testing

Existing tests all pass unchanged. Optionally add:
```ts
it('renders .scale element when ticks prop provided', () => {
  const { container } = render(
    <Fader value={0} onChange={noop} ticks={[0, -6, -60]} min={-60} max={6} />
  )
  expect(container.querySelectorAll('[data-testid="fader-tick"]').length).toBe(3)
})
```
(Requires adding `data-testid="fader-tick"` to each `.tickMark` div in the JSX — optional but good coverage.)

---

## Definition of Done

- `Fader` on Chroma reads as Hologram hardware: dark recessed channel, printed scale with major marks at real dB values + emphasized 0 dB notch, dimensional knurled cap with cast shadow, LED bloom on drag/focus — no colored fill
- All themes reskin cleanly via tokens (verify in Compare mode: default, bowie, tropicalia, manuscript, ink)
- Single Fader entry in sidebar (verify, remove from `planned.ts` if duplicate found)
- Existing `typecheck / lint / test` green
- Optional: `data-testid="fader-tick"` + render test for scale strip
