# FxChip Polish Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three polish fixes for FxChip + InputSelect: unify popover surfaces to dark `--stage`, hide reorder arrows until keyboard-focused and fix the drag insertion line, and signal a partially-bypassed chain with amber on both the chip trigger and master LED.

**Architecture:** Pure CSS + minimal TSX logic changes. Fix 1 touches only `ListboxPopover.module.css`. Fix 2 touches `FxChip.module.css` (CSS selector swap) and `FxChip.tsx` (ghost left position + remove insertion-line guard). Fix 3 touches `FxChip.tsx` (derive `partial` chipState) and `FxChip.module.css` (amber token rules). Tests cover the data-attribute-based assertions that JSDOM can verify.

**Tech Stack:** React 18, CSS Modules, Vitest + @testing-library/react

## Global Constraints

- No new dependencies.
- All themes define `--stage`, `--stage-text`, `--led-yellow` tokens — use these, never hard-code hex.
- `--led-yellow` is the amber token (FCEF3D in default theme); use it everywhere the spec says "amber" or "attention".
- Run `npm test -- --run` to verify all tests pass after each commit. Run `npm run build` for typecheck.
- Target files: `src/components/InputSelect/ListboxPopover.module.css`, `src/components/FxChip/FxChip.module.css`, `src/components/FxChip/FxChip.tsx`, `src/components/FxChip/FxChip.test.tsx`.

---

### Task 1: Unify InputSelect popover to dark `--stage` surface

**Files:**
- Modify: `src/components/InputSelect/ListboxPopover.module.css`

**Interfaces:**
- Consumes: design tokens `--stage`, `--stage-text`, `--accent` (already in use by ContextMenu).
- Produces: `ListboxPopover` visually matches `ContextMenu` — dark background, on-stage text, accent highlight.

Context: `ContextMenu.module.css` uses `background: var(--stage)` and `color: var(--stage-text)` for its menu + items. `ListboxPopover.module.css` currently uses `var(--menu-bg)` for background and `var(--text)` for option text. The goal is to make them match.

- [ ] **Step 1: Read the current file**

```
src/components/InputSelect/ListboxPopover.module.css
```

Current state:
```css
.listbox {
  background: var(--menu-bg);
  ...
}
.option {
  color: var(--text);
  ...
}
.option:hover,
.option[data-active] {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.check {
  color: var(--accent);
  ...
}
```

- [ ] **Step 2: Update `.listbox` background to `--stage`**

In `src/components/InputSelect/ListboxPopover.module.css`, change line:
```css
  background: var(--menu-bg);
```
to:
```css
  background: var(--stage);
```

- [ ] **Step 3: Update `.option` text color to `--stage-text`**

In `src/components/InputSelect/ListboxPopover.module.css`, change:
```css
  color: var(--text);
```
to:
```css
  color: var(--stage-text);
```

- [ ] **Step 4: Update active/hover highlight to 15% (matching ContextMenu)**

In `src/components/InputSelect/ListboxPopover.module.css`, change:
```css
.option:hover,
.option[data-active] {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
```
to:
```css
.option:hover,
.option[data-active] {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}
```

- [ ] **Step 5: Run existing tests — expect all pass**

```bash
npm test -- --run
```

Expected: 457 tests pass, 0 failures. (CSS-only change; no logic changed.)

- [ ] **Step 6: Commit**

```bash
git add src/components/InputSelect/ListboxPopover.module.css
git commit -m "fix(InputSelect): unify listbox popover to dark --stage surface"
```

---

### Task 2: Reorder UX — focus-only arrows + fix drag insertion line

**Files:**
- Modify: `src/components/FxChip/FxChip.module.css`
- Modify: `src/components/FxChip/FxChip.tsx`

**Interfaces:**
- Consumes: existing `dragState`, `panelRef`, `slotRefs` in `ChainEditor`.
- Produces: arrows visible only when slot has keyboard focus; ghost tracks cursor X; insertion line always shown during drag.

#### 2a — Hide arrows unless keyboard-focused

Currently `.slot:hover .moveUp` shows arrows on hover. Replace with `:has(:focus-visible)`.

- [ ] **Step 1: Swap the CSS selector for arrow visibility**

In `src/components/FxChip/FxChip.module.css`, find:
```css
.slot:hover .moveUp,
.slot:hover .moveDown,
.slot:focus-within .moveUp,
.slot:focus-within .moveDown {
  opacity: 1;
}
```
Replace with:
```css
.slot:has(:focus-visible) .moveUp,
.slot:has(:focus-visible) .moveDown {
  opacity: 1;
}
```

This uses CSS `:has()` (baseline-available in all modern browsers since Chrome 105 / Firefox 121 / Safari 15.4). The arrows are now invisible on hover and appear only when a child element (including the arrow buttons themselves) receives keyboard focus.

- [ ] **Step 2: Run tests — expect all pass**

```bash
npm test -- --run
```

Expected: 457 tests pass. (CSS-only change; JSDOM ignores `:has()`.)

#### 2b — Fix drag ghost X position

The ghost element is `position: fixed` and currently has no `left` style, defaulting to `left: 0` (left edge of viewport). It should align with the panel.

- [ ] **Step 3: Read the ghost render in FxChip.tsx**

File: `src/components/FxChip/FxChip.tsx` lines 287–296:
```tsx
{dragState && !dragState.reducedMotion && (
  <div
    className={styles.ghost}
    style={{ top: dragState.ghostY, width: panelRef.current?.getBoundingClientRect().width ?? 220 }}
    aria-hidden
  >
    {plugins[dragState.dragIndex]?.name}
  </div>
)}
```

- [ ] **Step 4: Add `left` position to ghost style**

In `src/components/FxChip/FxChip.tsx`, change the ghost render block from:
```tsx
{dragState && !dragState.reducedMotion && (
  <div
    className={styles.ghost}
    style={{ top: dragState.ghostY, width: panelRef.current?.getBoundingClientRect().width ?? 220 }}
    aria-hidden
  >
    {plugins[dragState.dragIndex]?.name}
  </div>
)}
```
to:
```tsx
{dragState && !dragState.reducedMotion && (
  <div
    className={styles.ghost}
    style={{
      top:   dragState.ghostY,
      left:  panelRef.current?.getBoundingClientRect().left ?? 0,
      width: panelRef.current?.getBoundingClientRect().width ?? 220,
    }}
    aria-hidden
  >
    {plugins[dragState.dragIndex]?.name}
  </div>
)}
```

#### 2c — Always show insertion line during drag

Currently the insertion line is gated: `dragState.hoverIndex !== dragState.dragIndex`. This hides it when hovering over the dragged slot's own position (a common starting position). Remove the guard so the line always shows where the drop will land.

- [ ] **Step 5: Remove the `hoverIndex !== dragIndex` guard**

In `src/components/FxChip/FxChip.tsx`, find the insertion line block (around line 273–279):
```tsx
{dragState && !dragState.reducedMotion && dragState.hoverIndex !== dragState.dragIndex && (
  <div
    className={styles.insertionLine}
    style={{ top: getInsertionLineY(dragState.hoverIndex) }}
    aria-hidden
  />
)}
```
Change to:
```tsx
{dragState && !dragState.reducedMotion && (
  <div
    className={styles.insertionLine}
    style={{ top: getInsertionLineY(dragState.hoverIndex) }}
    aria-hidden
  />
)}
```

- [ ] **Step 6: Run tests — expect all pass**

```bash
npm test -- --run
```

Expected: 457 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/FxChip/FxChip.module.css src/components/FxChip/FxChip.tsx
git commit -m "fix(FxChip): focus-only reorder arrows, fix ghost X and insertion line"
```

---

### Task 3: Amber partial state on chip trigger and master LED

**Files:**
- Modify: `src/components/FxChip/FxChip.tsx`
- Modify: `src/components/FxChip/FxChip.module.css`
- Modify: `src/components/FxChip/FxChip.test.tsx`

**Interfaces:**
- Consumes: `--led-yellow` design token (amber); existing `chipState`, `masterState` data attributes.
- Produces: `data-state="partial"` on `.root` when chain is enabled but ≥1 plugin bypassed; amber bloom on chip trigger and master LED in that state.

The current `chipState` only has `'empty' | 'active' | 'bypassed'`. The master LED already derives `'partial'` but the chip's `data-state` doesn't reflect it — so CSS for `.root[data-state="partial"] .chip` was never written.

#### 3a — Derive `partial` chipState in TSX

- [ ] **Step 1: Write the failing test for chip `data-state="partial"`**

In `src/components/FxChip/FxChip.test.tsx`, add a new describe block after the existing ones:

```tsx
// ── Partial state (amber) ──────────────────────────────────────────────────────

describe('FxChip partial state', () => {
  const MIXED_PLUGINS: FxPlugin[] = [
    { id: 'p1', name: 'Reverb',     enabled: true  },
    { id: 'p2', name: 'Compressor', enabled: false },
  ]

  it('root data-state="partial" when chainEnabled and some plugins bypassed', () => {
    const { container } = render(
      <FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled />
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'partial')
  })

  it('root data-state="active" when chainEnabled and all plugins enabled', () => {
    const { container } = render(
      <FxChip {...DEFAULT_PROPS} plugins={ONE_PLUGIN} chainEnabled />
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'active')
  })

  it('root data-state="bypassed" when chainEnabled=false (regardless of plugin state)', () => {
    const { container } = render(
      <FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled={false} />
    )
    expect(container.firstChild).toHaveAttribute('data-state', 'bypassed')
  })

  it('master LED data-state="partial" when chainEnabled and some plugins bypassed', () => {
    render(
      <FxChip {...DEFAULT_PROPS} plugins={MIXED_PLUGINS} chainEnabled defaultOpen />
    )
    const master = screen.getByRole('checkbox', { name: 'FX chain' })
    expect(master).toHaveAttribute('data-state', 'partial')
  })
})
```

- [ ] **Step 2: Run tests — expect new tests to FAIL**

```bash
npm test -- --run src/components/FxChip/FxChip.test.tsx
```

Expected: the `data-state="partial"` assertions fail because chipState doesn't produce `'partial'` yet.

- [ ] **Step 3: Add `partial` to `chipState` derivation in FxChip.tsx**

In `src/components/FxChip/FxChip.tsx`, find the `chipState` line in the `FxChip` function (around line 320):
```tsx
const chipState = plugins.length === 0 ? 'empty' : chainEnabled ? 'active' : 'bypassed'
```
Replace with:
```tsx
const someBypassedPlugins = chainEnabled && plugins.some(p => !p.enabled)
const chipState =
  plugins.length === 0  ? 'empty'
  : !chainEnabled       ? 'bypassed'
  : someBypassedPlugins ? 'partial'
  :                       'active'
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test -- --run src/components/FxChip/FxChip.test.tsx
```

Expected: all FxChip tests pass including the new partial-state assertions.

#### 3b — Add amber CSS for partial state

- [ ] **Step 5: Add amber chip rule to FxChip.module.css**

In `src/components/FxChip/FxChip.module.css`, after the `.root[data-state="active"] .chip` block and before `.root[data-open] .chip`, add:

```css
/* ─── Partial: amber attention (chain on, ≥1 plugin bypassed) ───────────────── */

.root[data-state="partial"] .chip {
  border-color: color-mix(in srgb, var(--led-yellow) 60%, var(--border));
  box-shadow:
    0 0 0 1px var(--led-yellow),
    0 0 8px 3px color-mix(in srgb, var(--led-yellow) 35%, transparent);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-led-on) var(--ease-out);
}
```

- [ ] **Step 6: Replace dim-cyan masterLed partial with amber**

In `src/components/FxChip/FxChip.module.css`, find:
```css
.masterLed[data-state="partial"] {
  background: color-mix(in srgb, var(--led-cyan) 45%, var(--stage));
  box-shadow: none;
}
```
Replace with:
```css
.masterLed[data-state="partial"] {
  background: var(--led-yellow);
  box-shadow:
    0 0 0 1px var(--led-yellow),
    0 0 8px 3px color-mix(in srgb, var(--led-yellow) 40%, transparent);
  transition:
    background  var(--dur-led-on) var(--ease-out),
    box-shadow  var(--dur-led-on) var(--ease-out);
}
```

- [ ] **Step 7: Run full test suite**

```bash
npm test -- --run
```

Expected: all 460+ tests pass (the 3 new partial-state tests + all existing).

- [ ] **Step 8: Typecheck**

```bash
npm run build 2>&1 | grep -E "error|warning" | head -20
```

Expected: zero TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/FxChip/FxChip.tsx src/components/FxChip/FxChip.module.css src/components/FxChip/FxChip.test.tsx
git commit -m "feat(FxChip): amber partial state on chip trigger and master LED when chain has bypassed plugins"
```

---

## Self-Review

**Spec coverage:**
1. ✅ Fix 1 — InputSelect dropdown adopts `--stage` surface + on-stage text colors (Task 1).
2. ✅ Fix 2 — Arrows hidden on hover, shown on keyboard focus only (Task 2a). Ghost X fixed (Task 2b). Insertion line always shown during drag (Task 2c).
3. ✅ Fix 3 — `partial` chipState + amber token on chip trigger and master LED (Task 3).
4. ✅ Verify: existing FxChip / InputSelect suites stay green (each task ends with a test run). New tests for partial amber added (Task 3, Step 1).

**Placeholder scan:** None — all code shown in full.

**Type consistency:** `chipState` only uses string literals; no new TypeScript types introduced.
