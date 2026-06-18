# MuteSoloToggle — Design Spec

> Phase 2 · Primitive controls · Jackdaw UI Kit

---

## 1. What this is

`MuteSoloToggle` is the track's **M / S** pair — two related toggles in one component. They share a
component because Solo changes how Mute *reads*: when another track is soloed, this track is implicitly
silenced even though its own Mute button is off, and the M chip must show that.

The component is fully **controlled and dumb** — it receives state props and fires raw events. All
resolution logic (exclusive-solo, undo grouping, audio routing) lives in the host app.

It belongs to the same hardware family as `Fader`, `Meter`, and `PanKnob`: recessed-off, LED glow when
active, silkscreen letters.

---

## 2. API

```ts
interface MuteSoloToggleProps {
  muted: boolean
  soloed: boolean
  onToggleMute: (e: React.MouseEvent<HTMLButtonElement>) => void
  onToggleSolo: (e: React.MouseEvent<HTMLButtonElement>) => void

  anySoloActive?: boolean            // when true, drives silenced-by-solo display on M chip
  size?: 'sm' | 'md'                // default 'md'
  orientation?: 'stacked' | 'inline' // default 'stacked' (M over S, matching a track header)
  disabled?: boolean
  muteLabel?: string                 // aria-label for M button; default 'Mute'
  soloLabel?: string                 // aria-label for S button; default 'Solo'
}
```

### Callback contract

`onToggleMute` and `onToggleSolo` receive the raw `React.MouseEvent`. The host inspects `e.altKey` /
`e.metaKey` to implement exclusive-solo (Alt/Cmd-click). The component reports intent and resolves
nothing.

Keyboard-triggered clicks (`Enter` / `Space` on a focused button) produce a synthetic `MouseEvent` with
`altKey: false, metaKey: false` — correct, since exclusive-solo is mouse-only by convention.

### `isSilencedBySolo` helper

```ts
export function isSilencedBySolo(
  muted: boolean,
  soloed: boolean,
  anySoloActive: boolean | undefined
): boolean {
  return !!anySoloActive && !soloed && !muted
}
```

Derived in the component, exported as a pure function for testing. An explicitly muted track is **not**
silenced-by-solo — it is simply muted. When `muted=true`, this returns `false` regardless of
`anySoloActive`, and the M chip shows its lit mute state (not the hatch).

---

## 3. File structure

```
src/components/MuteSoloToggle/
  MuteSoloToggle.tsx          ← component + isSilencedBySolo export
  MuteSoloToggle.module.css   ← all styles
  MuteSoloToggle.demo.tsx     ← gallery page (DemoMeta + states grid + playground)
  MuteSoloToggle.test.tsx     ← unit + integration tests
  index.ts                    ← barrel export
```

One component file, no sub-components extracted. `Chip` is not split out — `MuteSoloToggle` is the only
consumer, and the M chip has unique silenced-state behavior the S chip does not.

---

## 4. Visual design

### 4.1 Chip anatomy

```
root [data-orientation="stacked|inline"] [data-size="md|sm"]
  button.chip [data-variant="mute"] [data-active?] [data-silenced?]
    span aria-hidden   →  "M"
  button.chip [data-variant="solo"] [data-active?]
    span aria-hidden   →  "S"
```

Letter spans are `aria-hidden="true"` — decorative silkscreen. The button's `aria-label` carries the
full accessible name.

### 4.2 Sizes

| `size` | chip W × H | font token |
|--------|-----------|------------|
| `md`   | 28 × 20px | `--text-sm` (11px) |
| `sm`   | 22 × 16px | `--text-xs` (10px) |

Gap between chips: 2px (stacked), 3px (inline). Font: `--font-mono`, tracked uppercase — silkscreen feel.

### 4.3 LED color routing

Per-variant CSS custom property, scoped to `.chip`:

```css
.chip[data-variant="mute"] { --chip-led: var(--led-red); }
.chip[data-variant="solo"] { --chip-led: var(--led-yellow); }
```

All lit-state rules reference `--chip-led`, so both chips share the same transition and glow rules.

### 4.4 Off state (no `data-active`)

```css
background: var(--stage);
box-shadow:
  inset 0 2px 4px rgba(0,0,0,0.6),
  inset 0 0 0 1px rgba(0,0,0,0.35),
  0 0 0 1px var(--border);
color: var(--text-dim);
```

Same recessed-well recipe as Fader track and PanKnob well. Letter reads at low contrast — quiet at rest.

### 4.5 Lit state (`data-active`)

```css
background: color-mix(in srgb, var(--chip-led) 18%, var(--stage));
box-shadow:
  inset 0 2px 4px rgba(0,0,0,0.5),
  inset 0 0 0 1px rgba(0,0,0,0.25),
  0 0 0 1px var(--chip-led),
  0 0 8px 2px color-mix(in srgb, var(--chip-led) 35%, transparent);
color: var(--chip-led);
transition:
  background var(--dur-led-on) var(--ease-out),
  box-shadow  var(--dur-led-on) var(--ease-out),
  color       var(--dur-led-on) var(--ease-out);
```

Off → on: `--dur-led-on` (40ms) fast attack. On → off: `--dur-led-off` (220ms) slow incandescent
decay. CSS cascade handles this: the base `.chip` rule uses `var(--dur-led-off)` as its transition
duration; the `.chip[data-active]` rule overrides the duration to `var(--dur-led-on)`. When the chip
becomes active the fast transition fires immediately; when it loses `data-active` the override is
gone and the slow decay takes over. Both variables are zeroed by `prefers-reduced-motion` in
`global.css`; no extra rule needed here.

Mute lit → red LED (`--led-red`). Solo lit → yellow LED (`--led-yellow`). Both-on → both chips
simultaneously lit in their respective colors. The audio resolution is the app's responsibility.

### 4.6 Silenced-by-solo state (`data-silenced` on M chip)

Applied when `isSilencedBySolo(muted, soloed, anySoloActive)` is true.

```css
background-color: var(--stage);
background-image: repeating-linear-gradient(
  45deg,
  transparent 0px, transparent 3px,
  color-mix(in srgb, var(--text) 18%, transparent) 3px,
  color-mix(in srgb, var(--text) 18%, transparent) 4px
);
color: var(--text-dim);
/* box-shadow stays as off-state — no LED glow */
```

`background-image` (hatch) and `box-shadow` (glow) are independent layers and never interfere:
hover/focus adds a ring without disturbing the hatch; a focused silenced chip works correctly.

The stripes use `var(--text)` at 18% opacity — a **theme-aware neutral** that reads as a mid-tone
on both dark surfaces (default `--stage` ≈ black) and light surfaces (Chroma/manuscript cream).
Verify in Compare across light + dark themes.

No pulse, no animation. The static hatch is intentional — animated "blinking M" (as seen in Logic)
is the precise UX pattern we are rejecting. It reads as "blocked / inactive" without looking like an
error or a mystery.

**Precedence:** `isSilencedBySolo` returns `false` when `muted=true`, so an explicitly muted track
shows its lit mute state, not the hatch. The DOM will never have both `data-active` and `data-silenced`
on the same chip simultaneously.

### 4.7 Focus ring

```css
.chip:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--chip-led, var(--accent)) 70%, transparent);
  outline-offset: 2px;
}
```

M chip in focus → red ring. S chip in focus → yellow ring. Off-state fallback → `var(--accent)`.
`:focus-visible` only, matching the kit convention.

### 4.8 Hover

```css
.chip:hover:not(:disabled) {
  filter: brightness(1.08);
}
```

Consistent with Fader cap hover. No structural change.

### 4.9 Disabled

```css
.root.disabled {
  pointer-events: none;
  opacity: 0.4;
}
```

Matches the kit-wide disabled recipe.

---

## 5. Accessibility

| element | attribute | value |
|---------|-----------|-------|
| M button | `aria-pressed` | `muted` |
| M button | `aria-label` | `muteLabel` (default `"Mute"`) — or `"Mute (silenced by solo)"` when silenced |
| M button | `title` | `"Silenced by solo"` when silenced, absent otherwise |
| S button | `aria-pressed` | `soloed` |
| S button | `aria-label` | `soloLabel` (default `"Solo"`) |
| M/S letter spans | `aria-hidden` | `"true"` |

The `muteLabel` / `soloLabel` props are plain component props — they are **not** spread onto DOM
elements and do not appear as HTML attributes by that name.

When `silencedBySolo` is true, the M chip's `aria-label` becomes `"Mute (silenced by solo)"`. This
ensures the state is not a purely visual cue; screen readers announce it, and the `title` provides
mouse-hover tooltip discovery for sighted users.

Keyboard: `Enter` / `Space` fire `onClick` natively on `<button>`. No `onKeyDown` handler needed.

---

## 6. Demo (gallery page)

### States grid — 8 cells

| label | `muted` | `soloed` | `anySoloActive` | purpose |
|-------|---------|---------|----------------|---------|
| Both off | false | false | false | baseline / recessed |
| Muted | true | false | false | red LED |
| Soloed | false | true | false | yellow LED |
| Both on | true | true | false | both lit simultaneously |
| Silenced by solo | false | false | true | M hatch; S off |
| Muted + any solo active | true | false | true | M lit mute, not hatch — precedence proof |
| Disabled | false | false | false | disabled prop |
| sm + inline | false | true | false | size + orientation variant |

All 8 cells must be present. "Both on" and "Muted + any solo active" are the visual proofs of the
precedence logic and must not be omitted.

### Playground controls

Live toggles for: `muted`, `soloed`, `anySoloActive`, `disabled`. Selects for `orientation` and
`size`. Controls use `<input type="checkbox">` / `<select>` directly (no Fader needed — no continuous
value).

### Gallery registration

```ts
export const meta: DemoMeta = {
  name: 'MuteSoloToggle',
  group: 'Primitives',
  route: '/mute-solo-toggle',
  order: 2,
}
```

---

## 7. Tests

### Pure utility — `isSilencedBySolo` truth table

| muted | soloed | anySoloActive | expected |
|-------|--------|---------------|---------|
| false | false | false | false |
| false | false | true  | **true** |
| true  | false | true  | false (explicit mute wins) |
| false | true  | true  | false (soloed track isn't silenced) |
| true  | true  | true  | false |

### Rendering

- Renders two buttons
- M button has `aria-pressed="false"` when `muted=false`; `"true"` when `muted=true`
- S button has `aria-pressed="false"` when `soloed=false`; `"true"` when `soloed=true`
- M button has `data-active` when `muted=true`
- S button has `data-active` when `soloed=true`
- M button has `data-silenced` when `isSilencedBySolo` is true
- **Precedence integration:** when `muted=true, anySoloActive=true` → M has `data-active`, does **not** have `data-silenced`

### Labels

- M button default `aria-label` is `"Mute"`
- M button `aria-label` is `"Mute (silenced by solo)"` when silenced
- M button has `title="Silenced by solo"` when silenced; no `title` otherwise
- S button default `aria-label` is `"Solo"`
- Custom `muteLabel` / `soloLabel` are applied

### Interaction

- Click M → `onToggleMute` called with the MouseEvent
- Click S → `onToggleSolo` called with the MouseEvent
- Disabled → neither callback fires on click

---

## 8. Done criteria

- `MuteSoloToggle` reads instantly: recessed when off, Solo glows yellow, Mute glows red/amber,
  silenced-by-solo shows the theme-aware hatch (not a glow, not a pulse)
- "Muted + any solo active" renders lit mute — not hatch — confirming precedence
- Both-on renders both chips lit simultaneously
- Exclusive-solo is left to the app (raw event passed through)
- `prefers-reduced-motion` respected (LED transitions zero via global.css)
- Reskins across all themes — verify hatch legibility on light + dark in Compare
- `typecheck / lint / test` green
