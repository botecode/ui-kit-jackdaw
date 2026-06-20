# RepeatToggle — Design Spec

**Date:** 2026-06-20
**Component:** `RepeatToggle`
**Phase:** 2 — Primitive Controls
**Status:** Approved

---

## 1. Purpose

The transport bar's loop on/off toggle. Pairs with `transport.setLoopEnabled` — when lit, playback will loop the loop region. Sibling of `TransportButton` in both hardware family and visual language: same recessed well, same LED bloom construction, same size tokens, same fast-attack/slow-decay timing. Distinct from `Toggle` (pill switch, `role="switch"`) and all other boolean controls.

**Contract mapping:** write side — `onToggle(next)` → `transport.setLoopEnabled(next)` (toggles looping without resetting the stored loop range; do not wire to `transport.setLoop`, which sets the range). Read side — the `repeating` prop is driven by `transport.loop.enabled` from the discrete `transport.loop` event; it is **not** read from `engine.frame` (the ~30Hz playhead stream, which does not carry loop state).

---

## 2. Structure

A single `<button type="button">` containing one `Repeat` icon (`aria-hidden`). No label text, no child spans beyond the icon. No variant or relabel machinery — `RepeatToggle` has one stable label and one LED color.

```tsx
<button
  type="button"
  className={styles.root}
  data-size={size}
  data-repeating={repeating || undefined}
  aria-label={ariaLabel ?? 'Loop'}
  aria-pressed={repeating}
  disabled={disabled}
  onClick={() => onToggle(!repeating)}
>
  <Repeat aria-hidden size={ICON_SIZE[size]} />
</button>
```

**Icon:** `Repeat` from `@phosphor-icons/react`. No explicit `weight` prop — inherits the global `IconContext` weight, same as `TransportButton`'s icons. Do not use `RepeatOnce` (carries "loop a single item once" badge meaning) or `ArrowsClockwise` (reads as reload/refresh in every UI vocabulary it appears in).

**Accessible name:** `aria-label` prop, defaulting to `"Loop"`. The label is **stable** — it does not flip when `repeating` changes. `aria-pressed` handles state announcement. Flipping the label while `aria-pressed` is in play reintroduces the "Pause, pressed" contradiction; avoid it.

---

## 3. Props

```tsx
export interface RepeatToggleProps {
  repeating: boolean
  onToggle: (next: boolean) => void
  size?: 'sm' | 'md'       // default 'md'
  disabled?: boolean
  'aria-label'?: string    // default 'Loop'
}
```

`onToggle(next)` takes only the next boolean — no event arg. `TransportButton.onClick` passes the event because callers may need it for routing; `RepeatToggle` is a pure boolean toggle and no caller needs the synthetic event.

---

## 4. Visual system

### Recessed well (off state)

Identical to `TransportButton`:

```css
background-color: var(--stage);
box-shadow:
  inset 0 2px 4px rgba(0, 0, 0, 0.6),
  inset 0 0 0 1px rgba(0, 0, 0, 0.35),
  0 0 0 1px var(--border);
color: var(--text-dim);
```

Transition rides `--dur-led-off` (slow decay) — the base rule. This is what "turning off" uses.

### LED bloom (on state, `[data-repeating]`)

`TransportButton`'s exact 4-layer recipe, `--led-green` → `--accent`. Same percentages, same shadow layers, same icon color. Identical depth/layering to the play button — the two pills read as siblings, not cousins.

```css
background-color: color-mix(in srgb, var(--accent) 18%, var(--stage));
box-shadow:
  inset 0 2px 4px rgba(0, 0, 0, 0.5),
  inset 0 0 0 1px rgba(0, 0, 0, 0.25),
  0 0 0 1px var(--accent),
  0 0 8px 2px color-mix(in srgb, var(--accent) 35%, transparent);
color: var(--accent);
/* Fast attack — overrides base decay */
transition:
  background-color var(--dur-led-on) var(--ease-out),
  box-shadow       var(--dur-led-on) var(--ease-out),
  color            var(--dur-led-on) var(--ease-out);
```

**Note on `--accent` as LED source:** `--accent` was authored as a warm UI accent (fills, text), not tuned as an LED the way the `--led-*` family was. At `18%` tint + `35%` glow it should read fine — `Toggle` already lights with `--accent` — but verify the bloom in **Compare across light and dark themes**. If it reads weak or muddy on either, that is the signal to eventually introduce a real `--led-accent` token. Do not add one now (YAGNI; no generic accent LED exists yet, and one component does not justify it).

### Pressed state (`:active`)

Deeper inset shadow, `translateY(1px)`. Separate `[data-repeating]:active` selector preserves the bloom on press — required to win the specificity fight against `:active` (same pattern as `TransportButton`'s `[data-playing]:active` rule):

```css
.root[data-repeating]:active:not(:disabled) {
  background-color: color-mix(in srgb, var(--accent) 18%, var(--stage));
  box-shadow:
    inset 0 3px 5px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--accent),
    0 0 8px 2px color-mix(in srgb, var(--accent) 35%, transparent);
  color: var(--accent);
}
```

### Hover

`filter: brightness(1.08)` on `:hover:not(:disabled)` — consistent with `TransportButton`.

### Disabled

`disabled` attribute on `<button>` — native semantics, truly keyboard-inert, announced correctly. CSS `opacity: 0.4; pointer-events: none` as belt-and-suspenders.

### Focus ring

`:focus-visible` only:

```css
outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
outline-offset: 2px;
```

### Sizes

| `size` | Width × Height | Icon px |
|---|---|---|
| `md` (default) | 36 × 36 px | 20 |
| `sm` | 28 × 28 px | 16 |

---

## 5. CSS provenance

The CSS file (`RepeatToggle.module.css`) is written clean for `RepeatToggle` — not a copy-paste of `TransportButton.module.css` with edits. It contains only rules that apply: recessed well, sizes, hover, disabled, focus ring, LED bloom, active state. No play/pause variant rules, no green-specific selectors, no inert branches.

One comment at the top of the file marks the deliberate architectural choice:

```css
/* revisit shared base if a 3rd transport pill appears */
```

---

## 6. Accessibility

| Concern | Resolution |
|---|---|
| Role | `<button type="button">` — native button semantics |
| Toggle state | `aria-pressed={repeating}` — announces true/false on change |
| Accessible name | `aria-label="Loop"` (stable; never flips) |
| Icon | `<Repeat aria-hidden>` — decorative, excluded from a11y tree |
| Keyboard | Space and Enter toggle natively; no JS key handling |
| Focus indicator | `:focus-visible` ring, accent-tinted |
| Disabled | Native `disabled` attribute — keyboard-inert, announced by screen readers |

---

## 7. Demo

### States grid

| Label | Props |
|---|---|
| Off | `repeating={false}` |
| On (lit) | `repeating={true}` |
| Disabled | `repeating={false} disabled` |
| Disabled on | `repeating={true} disabled` |
| sm | `repeating={true} size="sm"` |

### Playground

Live `RepeatToggle` instance that toggles on click. `Checkbox` kit controls for `repeating` and `disabled`. Native `<select>` for `size`.

**Shared debt note:** `TransportButton.demo.tsx` also uses a native `<select>` for its size control. When we swap to `InputSelect` dogfood, fix both demos in the same pass — do not fix one in isolation.

Gallery: `group: 'Primitives'`, `route: '/repeat-toggle'`, `order: 11` (after `TransportButton` at 10).

---

## 8. Files

```
src/components/RepeatToggle/
  RepeatToggle.tsx
  RepeatToggle.module.css
  RepeatToggle.demo.tsx
  RepeatToggle.test.tsx
  index.ts
```

---

## 9. Done criteria

- Recessed-off, accent-LED-bloom-on — reads as a transport loop toggle alongside `TransportButton`
- `aria-pressed` correct; `aria-label` stable at `"Loop"` — does not flip on state change
- `Repeat` icon rendered at global `IconContext` weight (no explicit `weight` prop)
- Bloom construction matches `TransportButton`'s 4-layer recipe exactly (recolored, not approximated)
- **Verify bloom in Compare on light and dark themes** — bloom must not read weak or muddy; flag if it does
- `:active` preserves LED bloom (specificity fix in place)
- `prefers-reduced-motion`: snap (timing tokens zeroed in `global.css`), glow still appears
- `disabled={disabled}` on `<button>` — keyboard-inert, not CSS-only
- `typecheck / lint / test` green
