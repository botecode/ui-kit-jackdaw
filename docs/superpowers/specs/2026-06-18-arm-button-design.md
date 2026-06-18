# ArmButton — Design Spec

**Date:** 2026-06-18
**Component:** `ArmButton`
**Phase:** 2 — Primitive Controls
**Status:** Approved

---

## 1. Purpose

The track's record-arm toggle: the round button that lights up when a track is armed for recording. Same hardware family as `Fader` / `Meter` / `PanKnob` / `MuteSoloToggle` (recessed-off, LED glow when active, tokens). When armed, it literally reproduces the Jackdaw logo eye — a pale ring encircling a lit red record-dot — making this button the brand mark in motion.

---

## 2. Structure

A single native `<button>` element. No wrapper div — it is one control. Empty body; accessible name comes entirely from `aria-label`.

```tsx
<button
  className={styles.root}
  data-size={size}
  data-armed={armed || undefined}
  data-recording={recording || undefined}
  aria-pressed={armed}
  aria-label={ariaLabel}
  disabled={disabled}
  onClick={onToggle}
/>
```

**Ring** = the button's own circular `border`. **Dot** = `::before` pseudo-element, centered absolutely inside. No DOM children.

State is driven entirely by `data-*` attributes on the root button; CSS selectors handle all visual transitions.

---

## 3. Visual system

### Ring (border on button)

`1.5px solid var(--text-dim)` — constant across all states. Never changes color. The pale ring of the logo eye, reads on `--stage` black in every theme.

### Dot (`::before`)

| State | Dot appearance |
|---|---|
| Off (not armed) | `background: var(--stage)`, inset shadow — recessed well, same recipe as mute chip |
| Armed | `background: color-mix(in srgb, var(--led-red) 25%, var(--stage))` + LED bloom `box-shadow` |
| Recording | Armed base + `@keyframes arm-pulse` cycling only the `box-shadow` glow |
| Disabled | `opacity: 0.4` on root, `pointer-events: none` |

### LED transitions

Same incandescent recipe as `MuteSoloToggle`:
- Attack: `var(--dur-led-on)` (40ms) — fast, snap to lit
- Decay: `var(--dur-led-off)` (220ms) — slow, incandescent fade-off
- Both zero under `prefers-reduced-motion` (handled globally in `tokens/global.css`)

### Pulse animation (`data-armed][data-recording`)

```css
@keyframes arm-pulse {
  0%, 100% { box-shadow: /* armed-level glow */ ; }
  50%       { box-shadow: /* ~1.5× brighter glow */ ; }
}
```

- Duration: `2s ease-in-out infinite`
- Animates **only `box-shadow`** (the glow radius/opacity). No `background` change, no `transform`. `box-shadow` is composited — no layout reflow, ring stays rock-steady.
- CSS selector: `.root[data-armed][data-recording]::before` — pulse only activates when both armed and recording, so a host sending `recording=true` without `armed=true` renders nothing odd.
- Under `@media (prefers-reduced-motion: reduce)`: `animation: none`, dot holds the brighter-peak glow value as a steady state (brighter red, no movement).

### `recording` state contract

`recording=true` semantically implies `armed=true` — a track cannot be recording if it isn't armed. The CSS enforces this structurally (`.root[data-armed][data-recording]`). Hosts must pass `armed=true` whenever `recording=true`; the component documents this requirement in its prop types.

---

## 4. Sizing

| `size` | Button | Dot | Gap (each side) |
|---|---|---|---|
| `md` (default) | 28×28px | 14×14px | 7px |
| `sm` | 20×20px | 10×10px | 5px |

Ring border: `1.5px` for both sizes.

---

## 5. Props

```tsx
export interface ArmButtonProps {
  /** Whether the track is armed for recording. */
  armed: boolean
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  /**
   * Whether live recording is actively happening on this track.
   * Drives the pulse animation. Implies armed=true — set both when recording.
   */
  recording?: boolean
  size?: 'sm' | 'md'        // default 'md'
  disabled?: boolean
  'aria-label'?: string      // default 'Arm for recording'
}
```

Destructured: `'aria-label': ariaLabel = 'Arm for recording'`.

---

## 6. Accessibility

- `aria-pressed={armed}` — announces toggle state to screen readers
- `role="button"` implicit from `<button>` — Enter/Space fire natively
- Focus ring: `outline: 2px solid color-mix(in srgb, var(--led-red) 70%, transparent)`, `outline-offset: 2px`, applied via `:focus-visible` (no mouse focus ring)
- Hover: `filter: brightness(1.08)` on root, consistent with mute/solo chip

---

## 7. Demo

### States grid

| Label | Props |
|---|---|
| Off | `armed={false}` |
| Armed | `armed={true}` |
| Recording | `armed={true} recording={true}` |
| Disabled | `armed={false} disabled` |
| sm (armed) | `armed={true} size="sm"` |
| Focus | `armed={false}` + forced `:focus-visible` |

### Playground

Controls: `armed` checkbox, `recording` checkbox, `disabled` checkbox, `size` select.

Layout: show an armed button and a recording button side by side so the steady-vs-pulse difference is immediately visible. Below: the interactive playground instance.

---

## 8. Files

```
src/components/ArmButton/
  ArmButton.tsx
  ArmButton.module.css
  ArmButton.demo.tsx
  ArmButton.test.tsx
  index.ts
```

`meta` route: `/arm-button`, group: `Primitives`, order: 3 (after `MuteSoloToggle`).

---

## 9. Done criteria

- Renders as recessed ring+dot off, lit red record-dot armed, pulsing glow recording
- Ring unchanged across states; only the dot changes
- Pulse animates only `box-shadow`; ring stays static
- `prefers-reduced-motion` → steady brighter red, no animation
- Round shape distinct from square mute chip
- `aria-pressed`, `aria-label`, `:focus-visible` correct
- Reskins across all themes — verify in Compare on default + manuscript (light)
- `typecheck / lint / test` green
