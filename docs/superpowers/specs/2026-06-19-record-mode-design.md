# RecordMode Design

Global Record button + 2-mode selector (Normal / Loop-punch). Transport-family primitive, red LED language, reuses the shared ContextMenu on the dark `--stage` surface.

---

## Scope

Single composite component `RecordMode`. The record button and caret trigger are internal — not exported separately. `RecordButton` as a standalone export is out of scope (YAGNI; split if a future transport strip needs it).

ContextMenu receives one additive field (`role?: 'menuitemradio'` on `MenuItem`). No other shared components are modified.

---

## Props

```tsx
export interface RecordModeProps {
  state: 'idle' | 'armed' | 'recording'
  mode: 'normal' | 'loop-punch'
  onToggleRecord: (e: React.MouseEvent<HTMLButtonElement>) => void
  onSelectMode: (mode: 'normal' | 'loop-punch') => void
  size?: 'sm' | 'md'        // default: 'md'
  disabled?: boolean
  'aria-label'?: string     // overrides the auto-resolved label
}
```

`state` is a union, not a boolean pair, so `recording` without `armed` is unrepresentable at the type level.

---

## DOM Structure

```
<div class="root" data-size>
  <button class="recordBtn" data-state data-size
          aria-pressed aria-label>
    <RecordIcon aria-hidden />
    {mode === 'loop-punch' &&
      <span class="badge" aria-hidden><ArrowsClockwiseIcon /></span>}
  </button>
  <button ref={caretRef} class="caret"
          aria-haspopup="menu" aria-expanded aria-label="Record mode"
          disabled={disabled}>
    <CaretDownIcon aria-hidden />
  </button>
  {menuOpen && (
    <ContextMenu items={menuItems} open x={menuPos.x} y={menuPos.y} onClose={closeMenu}
                 aria-label="Record mode" />
  )}
</div>
```

---

## aria-label Resolution

The record button's label carries both the rolling state and the active mode:

| state | mode | resolved label |
|---|---|---|
| idle | normal | "Record" |
| idle | loop-punch | "Record (loop-punch)" |
| armed | normal | "Record" |
| armed | loop-punch | "Record (loop-punch)" |
| recording | normal | "Recording" |
| recording | loop-punch | "Recording (loop-punch)" |

`aria-pressed={state !== 'idle'}` — pressed means engaged (armed OR recording). Consistent with ArmButton. "Recording, pressed" is coherent; the label change handles the armed → recording distinction for screen readers without an `aria-live` interruption.

The `aria-label` prop overrides the resolved label if provided.

---

## Visual Design

### Sizes

| size | record button | caret button | record icon | caret icon | badge icon |
|---|---|---|---|---|---|
| md | 36 × 36 px | 20 × 36 px | 20 px | 12 px | 8 px |
| sm | 28 × 28 px | 16 × 28 px | 16 px | 10 px | 6 px |

Container: `display: flex; align-items: center; gap: var(--space-1)` (4 px).

### Record Button States

| state | background | border | box-shadow | icon color | transition |
|---|---|---|---|---|---|
| idle | `--stage` | 1.5 px `--text-dim` | none | `--led-red` | `--dur-led-off` |
| armed | `--led-red-deep` | 2 px `--led-red` | none | `--text` | `--dur-led-on` |
| recording | `--led-red-deep` | 2 px `--led-red` | pulsing red bloom | `--text` | `--dur-led-on` |
| disabled | any of above | — | — | opacity: 0.4 | — |

Icon color is `--led-red` at idle (reads as "record" on the dark `--stage` background, not a generic gray circle) and `--text` (near-white) at armed/recording (contrasts against the `--led-red-deep` fill).

### Recording Bloom Animation

2 s pulse keyframe. Uses `--_rec-glow-base` and `--_rec-glow-peak` CSS custom properties so the 0 %/100 % keyframe value matches the static `box-shadow` of the armed state exactly — no visible jump when the animation starts or stops.

`prefers-reduced-motion`: `--dur-led-on` / `--dur-led-off` are zeroed globally. Recording holds peak bloom without pulsing. No per-component rule needed.

### Caret Button States

| state | background |
|---|---|
| idle | `--stage` |
| hover | `--stage-2` |
| pressed | `--stage` |
| disabled | opacity: 0.4; pointer-events: none |

### Focus Rings

Both the record button and the caret use `--led-red` at 70 % opacity. Same red LED family identity, matching ArmButton's focus treatment.

### Loop-Punch Mode Badge

- Position: `absolute; bottom: 2 px; right: 2 px` on the record button
- Icon: `ArrowsClockwise` (Phosphor)
- Color: `--text` (near-white) — contrasts on both dark idle background and red armed/recording fill; one color, no state-dependent logic
- `aria-hidden` — mode is communicated via the record button's `aria-label`
- **Visible only when `mode === 'loop-punch'`.** Normal mode has no indicator (the default is obvious; a permanent "NORM" label is clutter).

All tokens (`--stage`, `--stage-2`, `--led-red`, `--led-red-deep`, `--led-red-core`, `--text`, `--text-dim`, `--dur-led-on`, `--dur-led-off`) are declared in `ThemeTokens`. RecordMode introduces no new tokens.

---

## Mode Menu

### ContextMenu Extension

Add one optional field to `MenuItem` (additive, backward-compatible):

```tsx
role?: 'menuitemradio'
```

Render logic becomes:

```tsx
role={entry.role ?? (entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem')}
```

Existing items without the `role` field are unaffected. ContextMenu's existing tests stay green.

### Menu Items

```tsx
const menuItems: MenuEntry[] = [
  {
    id: 'normal',
    label: 'Normal',
    role: 'menuitemradio',
    checked: mode === 'normal',
    onSelect: () => onSelectMode('normal'),
  },
  {
    id: 'loop-punch',
    label: 'Loop / punch',
    role: 'menuitemradio',
    checked: mode === 'loop-punch',
    onSelect: () => onSelectMode('loop-punch'),
  },
]
```

Exactly one `checked: true` at all times. RecordMode derives from the `mode` prop — single source of truth.

### Menu Open / Trigger

On caret click:

```tsx
function openMenu() {
  caretRef.current?.focus()  // WebKit: mouse click doesn't focus <button>;
                             // without this, ContextMenu captures <body> and
                             // focus leaks to the body on close.
  const rect = caretRef.current!.getBoundingClientRect()
  setMenuPos({ x: rect.left, y: rect.bottom + 2 })
  setMenuOpen(true)
}
```

Point-anchor (not element-anchor). Menu closes on scroll — acceptable for a small transient mode picker. The explicit `caret.focus()` before ContextMenu mounts ensures `document.activeElement` is deterministically the caret in all browsers.

---

## Keyboard + ARIA

### Keyboard Table

| Event | Context | Behavior |
|---|---|---|
| Space / Enter | record button | fires `onToggleRecord` |
| Space / Enter / click | caret button | opens menu, ContextMenu auto-focuses first item |
| ArrowDown / Up / Home / End | inside menu | ContextMenu roving focus |
| Space / Enter | menu item | selects mode, closes menu, returns focus to caret |
| Escape | inside menu | closes menu, returns focus to caret |
| Tab | inside menu | closes menu (ContextMenu Tab handler) |
| Outside mousedown | — | Popover outside-click closes menu |

Focus return on close is handled by ContextMenu's existing `useLayoutEffect` capture of `document.activeElement` at mount time. The `caret.focus()` call before ContextMenu mounts makes the captured element deterministically the caret.

### ARIA Tree

```
<div>
  <button aria-pressed={state !== 'idle'}
          aria-label="Record | Record (loop-punch) | Recording | Recording (loop-punch)">
  <button aria-haspopup="menu" aria-expanded aria-label="Record mode">
  <!-- portaled: -->
  <ul role="menu" aria-label="Record mode">
    <li role="menuitemradio" aria-checked="true | false">Normal</li>
    <li role="menuitemradio" aria-checked="true | false">Loop / punch</li>
  </ul>
```

---

## Files

```
src/components/RecordMode/
├── RecordMode.tsx
├── RecordMode.module.css
├── RecordMode.test.tsx
├── RecordMode.demo.tsx
└── index.ts

src/components/ContextMenu/ContextMenu.tsx    ← additive MenuItem.role field
src/components/ContextMenu/ContextMenu.test.tsx  ← regression test for new field
```

---

## Tests

### RecordMode.test.tsx

1. Renders without crash (idle, normal)
2. `state=idle` → `aria-pressed=false`, no badge, label="Record"
3. `state=armed` → `aria-pressed=true`, label="Record"
4. `state=recording` → `aria-pressed=true`, label="Recording"
5. `mode=loop-punch` → badge rendered, label includes "(loop-punch)"
6. `mode=normal` → no badge rendered
7. `state=recording, mode=loop-punch` → label="Recording (loop-punch)"
8. Record button click fires `onToggleRecord`
9. Caret click → menu opens (`aria-expanded=true`), caret is focused
10. Escape → menu closes, focus returns to caret
11. Item select → menu closes, focus returns to caret
12. "Normal" click → `onSelectMode('normal')` called, menu closes
13. "Loop / punch" click → `onSelectMode('loop-punch')` called, menu closes
14. `mode=normal` → "Normal" `aria-checked=true`, "Loop / punch" `aria-checked=false`
15. `mode=loop-punch` → "Loop / punch" `aria-checked=true`, "Normal" `aria-checked=false`
16. `disabled=true` → record button has `disabled`, caret has `disabled`
17. `disabled=true` + caret click → menu does NOT open
18. `disabled=true` + record button click → `onToggleRecord` NOT called
19. `size=sm` → `data-size=sm` on container

**Note on focus-return tests (9–11):** jsdom focuses `<button>` on click (Chrome behavior), so these tests pass regardless of whether `caretRef.current?.focus()` is present. They guard general focus-return, not the WebKit case. The WebKit fix ("mouse click doesn't focus a button") is verified by the explicit `caret.focus()` call existing in the source and confirmed via a manual browser check in the app.

### ContextMenu.test.tsx (additive regression)

20. A `MenuItem` with `role: 'menuitemradio'` renders `role="menuitemradio"` on the `<li>`
21. Existing items without `role` continue to render `menuitem` / `menuitemcheckbox` as before

---

## Demo

**StatesDemo (StatesGrid):**
idle | armed | recording | loop-punch/idle (badge visible) | menu open | disabled | sm

**PlaygroundDemo:** `state` select, `mode` select, `disabled` checkbox, `size` select. Plus a live instance that cycles idle → armed → recording → idle on click for feel-testing.

---

## Done Criteria

- `RecordMode` renders the global Record button (idle / armed / recording, red LED family, distinct from `ArmButton`)
- 2-mode menu (Normal / Loop-punch) reusing ContextMenu on the dark `--stage` surface
- Active mode visible at rest only when non-default: corner `ArrowsClockwise` glyph, `aria-hidden`, `--text` color
- `aria-label` carries the active mode for SR: "Record (loop-punch)" / "Recording (loop-punch)"
- WebKit focus-return: `caret.focus()` called before menu opens
- Keyboard + ARIA complete (`menuitemradio`, exactly-one-checked, full Esc/Tab/outside-click coverage)
- Reskins across themes (token-only, no hardcoded colors)
- `typecheck` / `lint` / `test` green
