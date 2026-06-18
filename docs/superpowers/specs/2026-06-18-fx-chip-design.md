# FxChip — Design Spec

**Date:** 2026-06-18
**Component:** `FxChip`
**Phase:** 2 — Primitive Controls
**Status:** Approved

---

## 1. Purpose

The track's FX control: a compact pill in the track's top-right corner, sibling of the `InputSelect` chip. Shows the state of the track's VST3 plugin chain and opens a Chroma Console panel editor. Same hardware family as the rest of the kit (recessed pill, LED bloom when active, tokens, silkscreen label). Unblocks `TrackHeader`.

---

## 2. Architecture overview

Three units, one new shared primitive:

```
src/components/Popover/      ← new generic shell (Section 3)
src/components/InputSelect/  ← refactored onto <Popover> (Section 3)
src/components/FxChip/       ← new component (Sections 4–7)
```

---

## 3. `Popover` shell (new primitive)

**Files:** `src/components/Popover/Popover.tsx`, `Popover.module.css`, `index.ts`

A semantics-agnostic anchored overlay shell. Owns: CSS-absolute positioning, `popover-in` enter animation, `mousedown` outside-click, `Escape` key, focus-return to trigger on close. Owns nothing else — no `role`, no content knowledge.

### Props

```tsx
interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement>   // root wrapping trigger + popover
  returnFocusRef:  React.RefObject<HTMLElement>   // element to focus when closed
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
}
```

**Outside-click:** `mousedown` listener on `document`; click is "outside" when `containerRef.current` does not contain the event target. Because `containerRef` wraps both the trigger button and the popover panel, a `mousedown` on the trigger is inside — the trigger's own `onClick` toggle fires normally without self-closing.

**Esc key:** `keydown` listener on `document`; calls `onClose()`.

**Focus return:** `onClose()` calls `returnFocusRef.current?.focus()`.

**Positioning (CSS-absolute, first pass):**
```css
position: absolute;
top: calc(100% + 2px);
left: 0;
min-width: 100%;
```
Positioning is a private implementation detail — the consumer API does not expose the strategy. This defers two guardrails intentionally:
```
// TODO: portal + viewport-flip when a clipped/low anchor needs it (FxChip in a real track corner)
```
When a consumer needs clip-escape or edge-flip, the internals swap without touching any consumer API.

**Animation:** the existing `popover-in` keyframe from `ListboxPopover.module.css` moves here:
```css
@keyframes popover-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.popover { animation: popover-in var(--dur-fast) var(--ease-out) both; }
```
Zeroed globally by `prefers-reduced-motion` via `--dur-fast: 0ms`.

### InputSelect refactor

`ListboxPopover` is refactored to use `<Popover>` as its shell. The `role="listbox"` content, option rows, and `activeId` scroll-into-view stay inside `ListboxPopover`. The `mousedown` outside-click `useEffect` currently in `InputSelect` is removed — `Popover` owns it now. `ListboxPopover.test.tsx` must stay green.

---

## 4. The chip (trigger)

A single recessed pill button. Mirrors `InputSelect variant="chip"` exactly — same tokens, same geometry.

### Visual states

Driven by `data-state` on the root `<div>`:

| `data-state` | Condition | Appearance |
|---|---|---|
| `"empty"` | `plugins.length === 0` | `--surface-2` fill, `--border` ring, `--text-muted` label `+ FX` — quiet, low-contrast |
| `"active"` | plugins present + `chainEnabled` | `--led-cyan` bloom on `box-shadow`, accent-tinted border |
| `"bypassed"` | plugins present + `!chainEnabled` | Full opacity, `--surface-2` fill, `--border` ring, no bloom, label crisp — recessed-off, looks clickable |
| (open) | `data-open` attribute | Accent border (`var(--accent)`) regardless of active/bypassed state |
| (disabled) | native `disabled` on `<button>` | `opacity: 0.4`, `pointer-events: none` |

**Bypassed ≠ disabled:** bypassed is a live "off" you can click; disabled is inert. Never use opacity to represent both.

### LED bloom (active state)

```css
/* attack — fast */
[data-state="active"] .chip {
  box-shadow:
    0 0 0 1px var(--led-cyan),
    0 0 8px 3px color-mix(in srgb, var(--led-cyan) 35%, transparent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);   /* 40ms */
}
/* decay — slow */
[data-state="empty"] .chip,
[data-state="bypassed"] .chip {
  transition: box-shadow var(--dur-led-off) var(--ease-out);  /* 220ms */
}
```

### Label logic

Computed in the component, not CSS:

| Condition | Label |
|---|---|
| `plugins.length === 0` | `+ FX` |
| `plugins.length === 1` | `FX` |
| `plugins.length >= 2` | `FX ${count}` |

First-plugin-name abbreviation deferred to v2.

### Chip markup

```tsx
<div
  ref={containerRef}
  className={styles.root}
  data-state={chipState}
  data-open={open || undefined}
  data-size={size}
>
  <button
    ref={triggerRef}
    className={styles.chip}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={open ? closeMenu : openMenu}
    onKeyDown={handleKeyDown}
  >
    <span className={styles.label}>{chipLabel}</span>
  </button>
  {open && (
    <Popover containerRef={containerRef} returnFocusRef={triggerRef} onClose={closeMenu}>
      <ChainEditor … />
    </Popover>
  )}
</div>
```

Keyboard on trigger: `Enter` / `Space` / `↓` opens; `Esc` closes (handled by Popover shell).

### Sizes

| `size` | Height |
|---|---|
| `md` (default) | 24px (matches InputSelect chip) |
| `sm` | 20px |

---

## 5. Chain editor (inside Popover)

Composed with the existing `Panel` primitive. The chain editor IS a Chroma Console panel.

```tsx
<div role="dialog" aria-label="FX chain" className={styles.chainDialog}>
  <Panel
    tone="stage"
    padding="sm"
    headerLead={<MasterLED chainEnabled={chainEnabled} plugins={plugins} onToggle={onToggleChain} />}
    title="FX"
  >
    {plugins.length === 0
      ? <p className={styles.empty}>No effects yet — add one.</p>
      : <div className={styles.slotList}>
          {plugins.map((p, i) => <SlotRow key={p.id} plugin={p} index={i} … />)}
        </div>
    }
    {/* Separate hidden live region — DOM reorders don't trigger aria-live; only text updates do */}
    <div className={styles.srAnnounce} aria-live="polite" aria-atomic="true">{announcement}</div>
    <button className={styles.addRow} onClick={onAdd}>+ Add plugin…</button>
  </Panel>
</div>
```

`role="dialog"` and `aria-label` sit on a wrapper `<div>` — Panel does not accept these props (it doesn't spread `...rest`), so the dialog landmark wraps the Panel. The wrapper `<div>` is `className={styles.chainDialog}` which adds no visual style — Panel's border/shadow/background defines the visual frame.

Initial focus on open: the master LED button (`masterLedRef`). Wired in `FxChip` via `useEffect(() => { if (open) masterLedRef.current?.focus() }, [open])`.

### Master LED

A local component in `FxChip.tsx`, not exported.

```tsx
<button
  ref={masterLedRef}        // receives initial focus when dialog opens
  role="checkbox"
  aria-checked={chainEnabled ? (someBypassedPlugins ? 'mixed' : true) : false}
  aria-label="FX chain"
  data-state={masterState}  // "active" | "partial" | "off"
  className={styles.masterLed}
  onClick={() => onToggleChain(!chainEnabled)}
/>
```

`someBypassedPlugins` = `chainEnabled && plugins.some(p => !p.enabled)`.

Visual states:

| `data-state` | Appearance |
|---|---|
| `"active"` | `--led-cyan` fill + bloom, fast attack |
| `"partial"` | dim `--led-cyan` fill (50% opacity), no bloom |
| `"off"` | `--stage` fill, inset shadow (recessed-off) |

Round shape (~10px), fast-attack (`--dur-led-on`) / slow-decay (`--dur-led-off`) on `box-shadow`.

Clicking always calls `onToggleChain(!chainEnabled)` — binary toggle. Partial visual state is display-only.

### Slot row

```tsx
<div
  className={styles.slot}
  data-bypassed={!plugin.enabled || undefined}
  style={{ '--slot-color': slotColor(index) } as CSSProperties}
  onKeyDown={handleSlotKeyDown}
>
  <button
    className={styles.ledBtn}
    role="checkbox"
    aria-checked={plugin.enabled}
    aria-label={plugin.name}
    onClick={() => onTogglePlugin(plugin.id, !plugin.enabled)}
  />
  <span className={styles.name}>{plugin.name}</span>
  <button className={styles.moveUp}   aria-label={`Move ${plugin.name} up`}   onClick={() => onReorder(index, index - 1)} />
  <button className={styles.moveDown} aria-label={`Move ${plugin.name} down`} onClick={() => onReorder(index, index + 1)} />
  <div   className={styles.handle}    aria-hidden />
  <button className={styles.removeBtn} aria-label={`Remove ${plugin.name}`} onClick={() => onRemove(plugin.id)} />
</div>
```

**`slotColor(index)`:**
```ts
const CHROMA_CYCLE = [
  '--chroma-red', '--chroma-orange', '--chroma-yellow', '--chroma-green',
  '--chroma-teal', '--chroma-blue', '--chroma-purple',
] as const

function slotColor(index: number): string {
  return `var(${CHROMA_CYCLE[index % CHROMA_CYCLE.length]})`
}
```

**LED square states:**
- `aria-checked={true}` (plugin enabled): filled `var(--slot-color)` + bloom `0 0 6px 2px color-mix(in srgb, var(--slot-color) 40%, transparent)`. Fast attack.
- `data-bypassed` on row (plugin disabled): LED recessed-off (`--stage` fill, inset shadow). Plugin name dims. Slow decay.

**Row layout at rest:** `[ LED square ] [ name ] [ ↑ ] [ ↓ ] [ ⠿ handle ] [ × ]`

`↑` / `↓` are always in the DOM (keyboard-accessible) but visually hidden at rest:
```css
.moveUp, .moveDown { opacity: 0; transition: opacity var(--dur-fast) var(--ease-out); }
.slot:hover .moveUp,
.slot:hover .moveDown,
.slot:focus-within .moveUp,
.slot:focus-within .moveDown { opacity: 1; }
```
The transition starts at the same frame as focus, so the focus ring and the button are visible simultaneously.

**↑ / ↓ boundaries:** disabled at list edges (`index === 0` for ↑, `index === plugins.length - 1` for ↓).

**Tab order:** natural DOM order throughout the dialog — no nested tab-cycling within rows.

**`Alt+↑` / `Alt+↓`:** `handleSlotKeyDown` checks `e.altKey`. Fires `onReorder(index, index ± 1)`. Sets `announcement` state to `"{name} moved to position {n} of {total}"`, which the hidden `aria-live="polite"` region renders as text — this is the correct pattern since DOM reorders do not trigger live region reads.

### Drag-to-reorder

Pointer event sequence on the drag handle:

1. `pointerdown` → `setPointerCapture(e.pointerId)`, record `dragIndex` + `startY`
2. `pointermove` → iterate slot `getBoundingClientRect()` to find `hoverIndex` (cursor past midpoint of adjacent slot); render:
   - `position: fixed` ghost clone of the dragged row at cursor Y, constrained to panel top/bottom
   - 2px `--accent`-colored insertion line between slots
3. `pointerup` → call `onReorder(dragIndex, hoverIndex)`, clear drag state

`prefers-reduced-motion`: ghost snaps (no CSS transition on `top`), insertion line appears instantly.

---

## 6. Props

```tsx
export interface FxChipProps {
  plugins:        Array<{ id: string; name: string; enabled: boolean }>
  chainEnabled:   boolean
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (fromIdx: number, toIdx: number) => void
  onRemove:       (id: string) => void
  onAdd:          () => void
  size?:          'sm' | 'md'
  disabled?:      boolean
  'aria-label'?:  string
}
```

Default `aria-label`: `'FX chain'`.

---

## 7. Demo

### States grid

Each state renders the chip in a mock track corner alongside a real `InputSelect variant="chip"` so the two read as siblings.

| Label | Setup |
|---|---|
| empty | `plugins=[]` |
| 1 plugin, active | 1 enabled plugin, `chainEnabled=true` |
| several active (`FX 4`) | 4 enabled plugins, `chainEnabled=true` |
| bypassed chain | 4 plugins, `chainEnabled=false` |
| some plugins bypassed | mixed `enabled`, `chainEnabled=true` |
| open | popover visible, `defaultOpen` |
| disabled | `disabled` |
| sm | `size="sm"` |

### Playground

Controls (kit `Toggle`/`Checkbox` dogfood): add/remove plugins (stub list: Reverb, Compressor, EQ, Chorus, Delay, Saturation), toggle individual plugin bypass, toggle master bypass, flip `disabled`, flip `size`.

`meta`: route `/fx-chip`, group `Primitives`, order 8 (after `InputSelect`).

---

## 8. Tests

`FxChip.test.tsx`:

| Test | Description |
|---|---|
| Label: empty | Chip renders `+ FX` when `plugins=[]` |
| Label: 1 plugin | Chip renders `FX` |
| Label: 4 plugins | Chip renders `FX 4` |
| Open/close | Click opens popover; click again closes |
| Esc closes | Esc fires `onClose`, focus returns to trigger |
| Outside-click closes | Mousedown outside container closes popover |
| `onToggleChain` | Click master LED calls `onToggleChain` |
| `onTogglePlugin` | Click slot LED calls `onTogglePlugin(id, next)` |
| `onRemove` | Click × calls `onRemove(id)` |
| `onAdd` | Click "Add plugin…" calls `onAdd` |
| Keyboard reorder | `Alt+↑` on focused row calls `onReorder(from, to)` |
| Drag reorder | `pointerdown` handle → `pointermove` past midpoint → `pointerup` calls `onReorder(from, to)` |
| `disabled` | Disabled prop prevents popover opening |
| ARIA master — active | `aria-checked=true` when all enabled + chain on |
| ARIA master — partial | `aria-checked="mixed"` when some bypassed + chain on |
| ARIA master — off | `aria-checked=false` when chain off |
| Slot ARIA | Slot LED has `role="checkbox"`, `aria-checked={enabled}`, `aria-label={name}` |
| `slotColor` | Slot 0 renders `var(--chroma-red)`, slot 7 wraps to `var(--chroma-red)` |
| Empty state | `plugins=[]` shows "No effects yet" and no slot rows |
| Initial focus | Opening dialog focuses master LED |

`ListboxPopover.test.tsx` must stay green — it is the regression guard for the Popover shell refactor.

---

## 9. Files

```
src/components/Popover/
  Popover.tsx
  Popover.module.css
  index.ts

src/components/InputSelect/
  InputSelect.tsx           ← remove outside-click useEffect (moves to Popover)
  ListboxPopover.tsx        ← refactored onto <Popover> shell
  ListboxPopover.module.css ← unchanged

src/components/FxChip/
  FxChip.tsx
  FxChip.module.css
  FxChip.demo.tsx
  FxChip.test.tsx
  index.ts

src/gallery/planned.ts      ← remove FxChip entry (auto-discovered via glob)
```

---

## 10. Done criteria

- Chip reads as a lit hardware indicator: recessed `+ FX` when empty, `--led-cyan` count + bloom when active, full-opacity recessed-off when bypassed
- Chain editor opens as Chroma Console panel (Panel primitive, `tone="stage"`)
- Master LED correctly tri-states: lit / partial / off; `aria-checked` matches
- Slot LEDs cycle chroma spectrum; lit = enabled, recessed = bypassed; `aria-checked` matches
- Pointer drag reorder: ghost + insertion line, snaps under `prefers-reduced-motion`
- `Alt+↑/↓` keyboard reorder with `aria-live` announcement
- `InputSelect` refactored onto shared `Popover` shell; its tests stay green
- Reskins across all themes — verify in Compare on default + one light theme
- Sits as a visual sibling of InputSelect chip in the mock track corner
- `typecheck` / `lint` / `test` green
