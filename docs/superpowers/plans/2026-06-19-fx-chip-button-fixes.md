# FxChip Button Fixes + Row Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two correctness bugs in FxChip (missing `type="button"` on all slot buttons; Alt+Arrow keydown guard not excluding `nameBtn`) and add slot row hover that matches the InputSelect golden overlay.

**Architecture:** Two tasks. Task 1 is TSX-only: add `type="button"` to every `<button>` in FxChip.tsx, and add `styles.nameBtn` (and `styles.removeBtn`) to the Alt+Arrow exclusion guard. Task 2 is CSS-only: add `transition: background` to the `.slot` base rule, add a `.slot:hover` golden-overlay rule matching InputSelect exactly, and remove the `.nameBtn:hover` color change so text stays `--stage-text` on hover (matching InputSelect).

**Tech Stack:** React 18, CSS Modules, Vitest + @testing-library/react

## Global Constraints

- No new npm dependencies.
- All CSS values use design tokens — no hard-coded hex.
- Hover overlay token: `color-mix(in srgb, var(--accent) 15%, transparent)` — the exact same value used in `ListboxPopover.module.css` and `ContextMenu.module.css`.
- Text color on slot row hover stays `var(--stage-text)` — unchanged, matching InputSelect behavior.
- Run `npm test -- --run` after each task. 482 tests must pass as baseline; Task 1 adds one new test (483 total).
- Run `npm run build` after Task 1 to verify no TypeScript errors.
- Target files: `src/components/FxChip/FxChip.tsx`, `src/components/FxChip/FxChip.module.css`, `src/components/FxChip/FxChip.test.tsx`.

---

### Task 1: Add `type="button"` to all buttons + fix Alt+Arrow guard

**Files:**
- Modify: `src/components/FxChip/FxChip.tsx`
- Modify: `src/components/FxChip/FxChip.test.tsx`

**Interfaces:**
- Consumes: existing `styles.nameBtn`, `styles.removeBtn`, `styles.moveUp`, `styles.moveDown` class names.
- Produces: every `<button>` in FxChip.tsx has `type="button"`; `handleKeyDown` skips reorder when focus is on `nameBtn` or `removeBtn`.

#### 1a — Write the failing test first (TDD)

- [ ] **Step 1: Add the failing test for Alt+Arrow on nameBtn**

In `src/components/FxChip/FxChip.test.tsx`, add one test to the existing `describe('FxChip chain editor — keyboard reorder', ...)` block (currently contains the Alt+ArrowUp test). Add it right after the existing test:

```tsx
  it('Alt+ArrowUp on name button does NOT call onReorder', () => {
    const onReorder = vi.fn()
    render(
      <FxChip
        {...DEFAULT_PROPS}
        plugins={MIXED_PLUGINS}
        chainEnabled
        onReorder={onReorder}
        defaultOpen
      />
    )
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Open Compressor' }),
      { key: 'ArrowUp', altKey: true }
    )
    expect(onReorder).not.toHaveBeenCalled()
  })
```

Note: `MIXED_PLUGINS` is already defined at module scope in the test file (line ~109): `[{ id:'p1', name:'Reverb', enabled:true }, { id:'p2', name:'Compressor', enabled:false }]`.

- [ ] **Step 2: Run test — expect it to FAIL**

```bash
npm test -- --run src/components/FxChip/FxChip.test.tsx
```

Expected: the new "Alt+ArrowUp on name button does NOT call onReorder" test fails (onReorder IS called — the bug).

#### 1b — Implement both fixes in FxChip.tsx

- [ ] **Step 3: Add `type="button"` to every `<button>` and fix the guard**

In `src/components/FxChip/FxChip.tsx`, make the following changes:

**Fix keydown guard (line 113)** — add `nameBtn` and `removeBtn` to the exclusion list:
```tsx
// BEFORE:
if (t.classList.contains(styles.moveUp) || t.classList.contains(styles.moveDown)) return

// AFTER:
if (
  t.classList.contains(styles.moveUp) ||
  t.classList.contains(styles.moveDown) ||
  t.classList.contains(styles.nameBtn) ||
  t.classList.contains(styles.removeBtn)
) return
```

**MasterLED button (line ~65)** — add `type="button"`:
```tsx
<button
  type="button"
  ref={ledRef}
  role="checkbox"
  aria-checked={ariaChecked}
  aria-label="FX chain"
  data-state={masterState}
  className={styles.masterLed}
  onClick={() => onToggle(!chainEnabled)}
/>
```

**ledBtn (line ~135)** — add `type="button"`:
```tsx
<button
  type="button"
  className={styles.ledBtn}
  role="checkbox"
  aria-checked={plugin.enabled}
  aria-label={plugin.name}
  onClick={() => onTogglePlugin(plugin.id, !plugin.enabled)}
/>
```

**nameBtn (line ~142)** — add `type="button"`:
```tsx
<button
  type="button"
  className={styles.nameBtn}
  aria-label={`Open ${plugin.name}`}
  onClick={() => onOpenPlugin(plugin.id)}
>
  {plugin.name}
</button>
```

**moveUp (line ~149)** — add `type="button"`:
```tsx
<button
  type="button"
  className={styles.moveUp}
  aria-label={`Move ${plugin.name} up`}
  disabled={index === 0}
  onClick={() => { onReorder(index, index - 1); onAnnounce(`${plugin.name} moved to position ${index} of ${total}`) }}
>↑</button>
```

**moveDown (line ~155)** — add `type="button"`:
```tsx
<button
  type="button"
  className={styles.moveDown}
  aria-label={`Move ${plugin.name} down`}
  disabled={index === total - 1}
  onClick={() => { onReorder(index, index + 1); onAnnounce(`${plugin.name} moved to position ${index + 2} of ${total}`) }}
>↓</button>
```

**removeBtn (line ~170)** — add `type="button"`:
```tsx
<button
  type="button"
  className={styles.removeBtn}
  aria-label={`Remove ${plugin.name}`}
  onClick={() => onRemove(plugin.id)}
>×</button>
```

**addRow (line ~292)** — add `type="button"`:
```tsx
<button type="button" className={styles.addRow} onClick={onAdd}>+ Add plugin…</button>
```

**chip trigger (line ~366)** — add `type="button"`:
```tsx
<button
  type="button"
  ref={triggerRef}
  className={styles.chip}
  aria-haspopup="dialog"
  aria-expanded={open}
  aria-label={ariaLabel}
  disabled={disabled}
  onClick={open ? closeMenu : openMenu}
  onKeyDown={handleKeyDown}
>
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test -- --run src/components/FxChip/FxChip.test.tsx
```

Expected: 483 tests pass (482 existing + 1 new). The Alt+Arrow-on-nameBtn test now passes.

- [ ] **Step 5: Typecheck**

```bash
npm run build 2>&1 | grep -E "error TS" | head -20
```

Expected: zero TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/FxChip/FxChip.tsx src/components/FxChip/FxChip.test.tsx
git commit -m "fix(FxChip): add type=button to all buttons; exclude nameBtn from Alt+Arrow reorder guard"
```

---

### Task 2: Slot row hover — golden overlay matching InputSelect

**Files:**
- Modify: `src/components/FxChip/FxChip.module.css`

**Interfaces:**
- Consumes: `var(--accent)` token; existing `.slot`, `.nameBtn` rules.
- Produces: slot rows highlight with `color-mix(in srgb, var(--accent) 15%, transparent)` on hover — identical to `ListboxPopover .option:hover`. Text color stays `var(--stage-text)` on hover (no change), matching InputSelect.

- [ ] **Step 1: Add `transition: background` to the `.slot` base rule**

In `src/components/FxChip/FxChip.module.css`, find the `.slot` rule:
```css
.slot {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  min-height: 28px;
  user-select: none;
  -webkit-user-select: none;
}
```
Replace with:
```css
.slot {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  min-height: 28px;
  user-select: none;
  -webkit-user-select: none;
  transition: background var(--dur-fast) var(--ease-out);
}
```

- [ ] **Step 2: Add the `.slot:hover` golden-overlay rule**

In `src/components/FxChip/FxChip.module.css`, immediately after the `.slot + .slot` rule (after the separator line rule), add:
```css
.slot:hover {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}
```

- [ ] **Step 3: Remove `.nameBtn:hover { color: var(--text); }`**

In `src/components/FxChip/FxChip.module.css`, find and remove:
```css
.nameBtn:hover {
  color: var(--text);
}
```

The `.nameBtn` text stays `var(--stage-text)` on hover — the slot-level background provides the affordance, matching InputSelect exactly where text color does not change on hover.

- [ ] **Step 4: Run full test suite — expect all pass**

```bash
npm test -- --run
```

Expected: 483 tests pass. (Pure CSS change; no behaviour change detectable by JSDOM.)

- [ ] **Step 5: Commit**

```bash
git add src/components/FxChip/FxChip.module.css
git commit -m "fix(FxChip): slot row hover matches InputSelect golden overlay — same accent-15% background, stable text color"
```

---

## Self-Review

**Spec coverage:**
1. ✅ Drag text-selection — `user-select: none` already on `.slot` (prior session). No change needed.
2. ✅ `onOpenPlugin` — already implemented (prior session). No change needed.
3. ✅ Stronger amber — already implemented (prior session). No change needed.
4. ✅ Fix 4 — `.slot:hover` with `color-mix(in srgb, var(--accent) 15%, transparent)` matching InputSelect (Task 2).
5. ✅ Bug C1 — `type="button"` on all 8 buttons (Task 1).
6. ✅ Bug C2 — `nameBtn` + `removeBtn` added to Alt+Arrow guard; test added (Task 1).

**Placeholder scan:** None — all code blocks are complete.

**Type consistency:** `styles.nameBtn` and `styles.removeBtn` are existing class names from `FxChip.module.css`; the guard references them by the same names used in the JSX.
