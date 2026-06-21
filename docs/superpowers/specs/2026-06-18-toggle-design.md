# Toggle — Design Spec

**Date:** 2026-06-18
**Component:** `Toggle`
**Phase:** 2 — Primitive Controls
**Status:** Approved

---

## 1. Purpose

The kit's standard boolean switch — a pill-shaped hardware toggle that replaces native checkboxes in the gallery playgrounds. Distinct from `MuteSoloToggle` (the track M/S pair) and `ArmButton` (record arm). Same hardware family as `Fader` / `Meter` / `PanKnob` / `ArmButton` / `MuteSoloToggle`: recessed off, LED bloom when on, token-driven transitions.

---

## 2. Structure

A single `<button role="switch" aria-checked>`. The pill and knob are purely presentational spans inside — no nested interactive elements. The button is the only focusable, clickable element.

```tsx
<button
  role="switch"
  aria-checked={checked}
  className={styles.root}
  data-size={size}
  data-checked={checked || undefined}
  disabled={disabled}
  onClick={handleClick}
  style={color ? { '--_toggle-accent': color } as React.CSSProperties : undefined}
>
  {label && <span className={styles.label}>{label}</span>}
  <span className={styles.pill} aria-hidden="true">
    <span className={styles.knob} />
  </span>
</button>
```

**Accessible name:** if `label` is present, its text content becomes the button's accessible name automatically. If omitted (icon-only use), `aria-label` must be passed.

**No `overflow: hidden` on `.pill`.** The knob's outer glow and drop-shadow extend beyond the track edge — clipping would chop the bloom. The knob positions absolutely inside `.pill`, which is `position: relative` but never `overflow: hidden`.

---

## 3. Visual system

### Track (`.pill`)

| State | Appearance |
|---|---|
| Off | `background: var(--stage)`, inset shadow — recessed well, same recipe as mute chip / Fader channel |
| On | `background: var(--_toggle-accent, var(--accent))` + outer LED glow `box-shadow` |
| Disabled | `opacity: 0.4` on root, `pointer-events: none` |

Track shape: `border-radius: 999px`. Border: `0 0 0 1px var(--border)` via outer box-shadow layer (keeps the border inside the shadow list, same pattern as mute chip).

### Knob (`.knob`)

| State | Appearance |
|---|---|
| Off | Positioned left, `background: var(--text-dim)`, matte, no outer glow. Cast shadow via `filter: drop-shadow(...)` so it sits above the track. Subtle catch-light via `radial-gradient` background-image. |
| On | Positioned right via `transform: translateX(offset)`, `background: color-mix(in srgb, var(--_toggle-accent, var(--accent)) 90%, white)` (LED core color), outer bloom `box-shadow`. |

Knurl highlight: `background-image: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.22), transparent 55%)` layered over the solid background — same "catch light" idiom as the Fader cap's SVG radial gradient, done in CSS.

### Transition timing — intentional asymmetry

**Turning on:**
- Knob `transform`: `--dur-led-on` (40ms fast snap)
- Track `background` + `box-shadow`: `--dur-led-on` (40ms fast attack)
- Knob `background` + `box-shadow`: `--dur-led-on` (40ms fast attack)

**Turning off:**
- Knob `transform`: `--dur-led-on` (40ms fast snap — knob always snaps, both directions)
- Track `background` + `box-shadow`: `--dur-led-off` (220ms slow decay — lamp cools)
- Knob `background` + `box-shadow`: `--dur-led-off` (220ms slow decay)

**This asymmetry is deliberate.** "Turning off" reads as: knob snaps left immediately, then the light slowly cools behind it — the incandescent fade-off feel. The knob itself snaps fast in both directions because a switch physically throws fast; only the LED glow has the asymmetric timing. Do not "fix" the knob to `--dur-led-off` on the off direction — that would make the throw feel sluggish.

Both `--dur-led-on` and `--dur-led-off` are zeroed in `global.css` under `prefers-reduced-motion` — knob snaps, bloom still appears, no extra rules needed in the component.

The knob's `transform` and its glow/`background` ride the **same** duration token so the mechanical throw and the light-up land as a single event, not two sequential ones.

---

## 4. Sizing

| `size` | Track (w×h) | Knob diameter | Knob offset (off→on) |
|---|---|---|---|
| `md` (default) | 44×24px | 18px | 0 → 20px |
| `sm` | 32×18px | 13px | 0 → 13px |

Knob is centered vertically in the track. Horizontal positions: off = 3px from left edge; on = 3px from right edge (offset = track-width − knob-size − 6px).

---

## 5. Props

```tsx
export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean, e: React.MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'           // default 'md'
  disabled?: boolean
  label?: string               // visible text; becomes button's accessible name
  'aria-label'?: string        // required when label is omitted
  color?: string               // CSS value; overrides --accent via --_toggle-accent
}
```

`color` wires identically to `PanKnob`: `style={{ '--_toggle-accent': color }}` on the root when present; CSS falls back to `var(--accent)` when the custom property is absent.

---

## 6. Accessibility

- `role="switch"` + `aria-checked={checked}` — announces switch semantics and state
- `<button>` element — Space and Enter toggle natively, no JS key handling needed
- Accessible name: visible `label` text when present; `aria-label` prop otherwise
- Focus ring: `outline: 2px solid color-mix(in srgb, var(--_toggle-accent, var(--accent)) 70%, transparent)`, `outline-offset: 2px`, `:focus-visible` only (no mouse ring)
- Hover: `filter: brightness(1.08)` on root `:hover:not(:disabled)` — consistent with the family
- Disabled: `disabled` attribute on `<button>` (native semantics) + `opacity: 0.4`

---

## 7. Demo

### States grid

| Label | Props |
|---|---|
| Off | `checked={false}` |
| On | `checked={true}` |
| Disabled off | `checked={false} disabled` |
| Disabled on | `checked={true} disabled` |
| Small | `checked={true} size="sm"` |
| Focus | `checked={false}` + `autoFocus` |
| With label | `checked={true} label="Reverb"` |

### Playground

Live controls: `checked`, `disabled` (both wired as `Toggle` instances — dogfood), `size` (native `<select>`, stays native since Toggle is boolean-only).

The playground uses `Toggle` for its own `checked` and `disabled` controls (dogfood — each component demos itself). Gallery playground controls in other components' demos (`armed`, `muted`, `disabled` ticks) are selection ticks and belong to `Checkbox` when it lands — not Toggle's domain.

---

## 8. Files

```
src/components/Toggle/
  Toggle.tsx
  Toggle.module.css
  Toggle.demo.tsx
  Toggle.test.tsx
  index.ts
```

`meta` route: `/toggle`, group: `Primitives`, order: 4 (after `ArmButton`).

---

## 9. Done criteria

- Pill reads as hardware switch: recessed + quiet off, accent track + LED-bloom-on
- Knob has knurl catch-light and cast shadow
- Knob snaps fast (both directions); track glow decays slowly on off (intentional asymmetry)
- `prefers-reduced-motion`: knob snaps, glow still appears, no slide animation
- No `overflow: hidden` on track — knob glow and drop-shadow never clipped
- `role="switch"` + `aria-checked` + keyboard + `:focus-visible` correct
- `color` prop overrides accent across themes (verify in Compare: light + dark)
- Playground uses `Toggle` for `checked` and `disabled` controls (dogfood)
- `typecheck / lint / test` green
