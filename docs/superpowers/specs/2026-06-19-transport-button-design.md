---
name: transport-button-design
description: TransportButton primitive — Play/Pause toggle, Stop, and Pause variants with hardware-family LED treatment
metadata:
  type: project
---

# TransportButton Design Spec

**Date:** 2026-06-19  
**Status:** Approved  
**Implements:** `prompts/ui-kit/transport-button.md`

---

## Overview

`TransportButton` is the playback-control primitive for the Jackdaw UI kit. It renders Play, Stop, and Pause as a single hardware-family component via a `variant` prop. The Play variant is a play/pause toggle: when `playing` is true, the icon swaps to Pause and the button lights with a green LED bloom. Stop and Pause are action buttons (momentary). `TransportBar` will compose this primitive.

---

## File Structure

```
src/components/TransportButton/
  TransportButton.tsx
  TransportButton.module.css
  TransportButton.demo.tsx
  TransportButton.test.tsx
  index.ts
```

Auto-registers in the gallery via `import.meta.glob` — no changes to `registry.ts` or `planned.ts`.

---

## Props

```typescript
export interface TransportButtonProps {
  variant: 'play' | 'stop' | 'pause'
  /** Controls icon swap and lit state for the play variant. Ignored for stop/pause. */
  playing?: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}
```

---

## DOM Shape

```tsx
<button
  className={styles.root}
  data-variant={variant}          // 'play' | 'stop' | 'pause'
  data-size={size}                // 'sm' | 'md'
  data-playing={playing || undefined}  // present only when lit (play variant)
  aria-label={resolvedLabel}      // see ARIA section
  disabled={disabled}
  onClick={onClick}
>
  <Icon aria-hidden="true" size={iconPx} />
</button>
```

No `aria-pressed` on any variant — all three are action buttons in the ARIA sense.

---

## Icon Selection

| variant | playing | Icon |
|---------|---------|------|
| `play`  | false   | `<Play />` |
| `play`  | true    | `<Pause />` |
| `stop`  | —       | `<Stop />` |
| `pause` | —       | `<Pause />` |

Icons are imported from `@phosphor-icons/react`. Size passed directly as a prop (`size={iconPx}`), one weight consistent with the kit.

---

## ARIA

**Relabeling pattern (no `aria-pressed`):**

All variants are action buttons — they describe what the click *does*, not a state the button holds. This is the standard media-player accessibility pattern.

| variant | playing | Default aria-label |
|---------|---------|-------------------|
| `play`  | false   | `"Play"` |
| `play`  | true    | `"Pause"` |
| `stop`  | —       | `"Stop"` |
| `pause` | —       | `"Pause"` |

The consumer can override via the `aria-label` prop (e.g., `"Pause playback"`, `"Play from cursor"`).

A screen reader user hears "Play button" → clicks → now hears "Pause button." That is unambiguous. No `aria-pressed` avoids the contradictory "Pause, toggle button, pressed" announcement that mixing label-flip with `aria-pressed` would produce.

---

## Sizes

| size | button    | icon |
|------|-----------|------|
| `md` | 36×36px   | 20px |
| `sm` | 28×28px   | 16px |

`border-radius: var(--radius)` (6px default) — rounded rectangle, matching the kit's interactive chip family.

---

## CSS States

### Idle (recessed well)

Same recipe as MuteSoloToggle chip off-state:

```css
background-color: var(--stage);
box-shadow:
  inset 0 2px 4px rgba(0,0,0,0.6),
  inset 0 0 0 1px rgba(0,0,0,0.35),
  0 0 0 1px var(--border);
color: var(--text-dim);
```

Slow decay transition (`--dur-led-off`) on background, box-shadow, color — incandescent-off feel.

### Hover

`filter: brightness(1.08)` on `:hover:not(:disabled)`.

### Pressed (`:active`)

`transform: translateY(1px)` + inset shadow compressed by 1px. Produces the hardware "1–2px give" without layout shift.

### Playing (`[data-playing]`, play variant only)

Fast attack (`--dur-led-on`) on background, box-shadow, color:

```css
background-color: color-mix(in srgb, var(--led-green) 18%, var(--stage));
box-shadow:
  inset 0 2px 4px rgba(0,0,0,0.5),
  inset 0 0 0 1px rgba(0,0,0,0.25),
  0 0 0 1px var(--led-green),
  0 0 8px 2px color-mix(in srgb, var(--led-green) 35%, transparent);
color: var(--led-green);
```

Green chosen over `--accent` (red) to avoid visual confusion with the arm/record button.

### Disabled

`pointer-events: none; opacity: 0.4` — matches ArmButton and MuteSoloToggle.

### Focus ring

Per-variant identity color, deliberate — consistent with kit precedent (ArmButton uses `--led-red`, MuteSoloToggle uses each chip's `--chip-led`):

- `play` variant: `outline: 2px solid color-mix(in srgb, var(--led-green) 70%, transparent)`
- `stop`/`pause`: `outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent)`

`outline-offset: 2px` on all.

### Reduced motion

`--dur-led-on` and `--dur-led-off` are zeroed in `global.css` under `prefers-reduced-motion: reduce`. No extra rules needed in this component.

---

## Demo

**Gallery meta:** `group: 'Primitives'`, `route: '/transport-button'`, `order: 10`

**States grid:**

| Label | State |
|-------|-------|
| Play (idle) | `variant="play" playing={false}` |
| Playing (lit) | `variant="play" playing={true}` — green bloom, Pause icon |
| Stop | `variant="stop"` |
| Pause | `variant="pause"` |
| Disabled | `variant="play" disabled` |
| sm | `variant="play" size="sm"` |

**Playground:** `variant` selector (play/stop/pause), `playing` checkbox (only visible when play selected), `disabled` checkbox, `size` toggle. Uses kit `Toggle`/`Checkbox` to dogfood.

---

## Tests

Pattern matches ArmButton tests. Key cases:

- Renders a `<button>`
- `data-variant` reflects prop
- `data-size` reflects prop (default `"md"`)
- `data-playing` present when `playing=true` + `variant="play"`, absent otherwise
- No `aria-pressed` attribute on any variant
- `aria-label` defaults: `"Play"` (play/stopped), `"Pause"` (play/playing), `"Stop"` (stop), `"Pause"` (pause)
- Custom `aria-label` prop overrides default
- Click fires `onClick`
- Disabled: click does not fire `onClick`

---

## Integration notes

- `TransportBar` will compose this. `playing` comes from `engine.frame.playing`.
- Maps to `transport.play` / `transport.stop` intents.
- The Record button shares this visual treatment — see the planned `record-mode` component.
