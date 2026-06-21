# FxChip — Open Plugin, Drag Selection, Stronger Amber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three polish fixes to FxChip: suppress text-selection during drag, make the plugin name a button that fires `onOpenPlugin(id)`, and strengthen the partial-amber bloom so it reads clearly on par with the cyan active state.

**Architecture:** Fixes are layered CSS-then-TSX-then-CSS. Task 1 is pure CSS (one rule). Task 2 adds a required prop threading through three interfaces and converts `<span>` → `<button>`, with matching CSS. Task 3 is pure CSS (two rule edits). Tasks 1 and 3 are independent; Task 2 must land before Task 3 can verify final visual pass.

**Tech Stack:** React 18, CSS Modules, Vitest + @testing-library/react

## Global Constraints

- No new npm dependencies.
- All CSS values must use design tokens — no hard-coded hex. `--led-yellow` is the amber token.
- `onOpenPlugin` is a required prop on `FxChipProps`, consistent with the other callback props (`onRemove`, `onAdd`, etc.).
- The name element renders as `<button>` with `aria-label="Open {plugin.name}"`. The drag handle (`.handle`), not the name, owns pointer events for drag.
- Run `npm test -- --run` after each task; all tests must pass. Run `npm run build` for typecheck.
- Target files: `src/components/FxChip/FxChip.tsx`, `src/components/FxChip/FxChip.module.css`, `src/components/FxChip/FxChip.test.tsx`, `src/components/FxChip/FxChip.demo.tsx`.

---

### Task 1: Suppress text-selection in slot rows during drag

**Files:**
- Modify: `src/components/FxChip/FxChip.module.css`

**Interfaces:**
- Consumes: existing `.slot` class.
- Produces: slot rows never highlight text or icons during pointer drag.

- [ ] **Step 1: Add `user-select: none` to the `.slot` rule**

In `src/components/FxChip/FxChip.module.css`, find the `.slot` block:
```css
.slot {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  min-height: 28px;
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
}
```

- [ ] **Step 2: Run tests — expect all pass**

```bash
npm test -- --run
```

Expected: 462 tests pass. (CSS-only change.)

- [ ] **Step 3: Commit**

```bash
git add src/components/FxChip/FxChip.module.css
git commit -m "fix(FxChip): suppress text-selection in slot rows during drag"
```

---

### Task 2: Clickable plugin name → onOpenPlugin

**Files:**
- Modify: `src/components/FxChip/FxChip.tsx`
- Modify: `src/components/FxChip/FxChip.module.css`
- Modify: `src/components/FxChip/FxChip.test.tsx`
- Modify: `src/components/FxChip/FxChip.demo.tsx`

**Interfaces:**
- Consumes: `plugin.id` and `plugin.name` already available in `SlotRow`.
- Produces: `onOpenPlugin: (id: string) => void` prop on `FxChipProps`; `<button className={styles.nameBtn} aria-label="Open {name}">` in each slot row.

#### 2a — Write the failing test first (TDD)

- [ ] **Step 1: Add `onOpenPlugin` to `DEFAULT_PROPS` and write the failing test**

In `src/components/FxChip/FxChip.test.tsx`:

1. Add `onOpenPlugin: noop` to the `DEFAULT_PROPS` object:
```tsx
const DEFAULT_PROPS = {
  plugins: NO_PLUGINS,
  chainEnabled: false,
  onToggleChain: noop,
  onTogglePlugin: noop,
  onReorder: noop,
  onRemove: noop,
  onAdd: noop,
  onOpenPlugin: noop,
}
```

2. Add a new describe block at the end of the file (after `describe('FxChip partial state', ...)`):
```tsx
// ── onOpenPlugin ──────────────────────────────────────────────────────────────

describe('FxChip onOpenPlugin', () => {
  it('clicking the plugin name button fires onOpenPlugin with the plugin id', () => {
    const onOpenPlugin = vi.fn()
    render(
      <FxChip
        {...DEFAULT_PROPS}
        plugins={ONE_PLUGIN}
        chainEnabled
        onOpenPlugin={onOpenPlugin}
        defaultOpen
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open Reverb' }))
    expect(onOpenPlugin).toHaveBeenCalledOnce()
    expect(onOpenPlugin).toHaveBeenCalledWith('p1')
  })

  it('clicking the name button does not call onTogglePlugin or onRemove', () => {
    const onTogglePlugin = vi.fn()
    const onRemove = vi.fn()
    render(
      <FxChip
        {...DEFAULT_PROPS}
        plugins={ONE_PLUGIN}
        chainEnabled
        onTogglePlugin={onTogglePlugin}
        onRemove={onRemove}
        defaultOpen
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open Reverb' }))
    expect(onTogglePlugin).not.toHaveBeenCalled()
    expect(onRemove).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect new tests to FAIL**

```bash
npm test -- --run src/components/FxChip/FxChip.test.tsx
```

Expected: the two new tests fail (no `onOpenPlugin` prop exists yet, TypeScript error or runtime failure).

#### 2b — Implement the prop in FxChip.tsx

- [ ] **Step 3: Add `onOpenPlugin` to all three interfaces and wire through the component tree**

In `src/components/FxChip/FxChip.tsx`, make these changes:

**1. Add to `FxChipProps` (after `onAdd`):**
```tsx
export interface FxChipProps {
  plugins:         FxPlugin[]
  chainEnabled:    boolean
  onToggleChain:   (next: boolean) => void
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (fromIdx: number, toIdx: number) => void
  onRemove:        (id: string) => void
  onAdd:           () => void
  onOpenPlugin:    (id: string) => void
  size?:           'sm' | 'md'
  disabled?:       boolean
  defaultOpen?:    boolean
  'aria-label'?:   string
}
```

**2. Add to `SlotRowProps` (after `onRemove`):**
```tsx
interface SlotRowProps {
  plugin:          FxPlugin
  index:           number
  total:           number
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (fromIdx: number, toIdx: number) => void
  onRemove:        (id: string) => void
  onOpenPlugin:    (id: string) => void
  onAnnounce:      (msg: string) => void
  slotRef:         (el: HTMLDivElement | null) => void
  onDragStart:     (index: number, e: React.PointerEvent<HTMLDivElement>) => void
  onDragMove:      (e: React.PointerEvent<HTMLDivElement>) => void
  onDragEnd:       (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void
}
```

**3. Add to `ChainEditorProps` (after `onAdd`):**
```tsx
interface ChainEditorProps {
  plugins:         FxPlugin[]
  chainEnabled:    boolean
  onToggleChain:   (next: boolean) => void
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (fromIdx: number, toIdx: number) => void
  onRemove:        (id: string) => void
  onAdd:           () => void
  onOpenPlugin:    (id: string) => void
  masterLedRef:    React.RefObject<HTMLButtonElement | null>
}
```

**4. Update `SlotRow` destructuring and JSX** — replace the `<span className={styles.name}>` with a `<button>`:

```tsx
function SlotRow({
  plugin, index, total, onTogglePlugin, onReorder, onRemove, onOpenPlugin, onAnnounce,
  slotRef, onDragStart, onDragMove, onDragEnd, onPointerCancel,
}: SlotRowProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!e.altKey) return
    const t = e.target as HTMLElement
    if (t.classList.contains(styles.moveUp) || t.classList.contains(styles.moveDown)) return
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      onReorder(index, index - 1)
      onAnnounce(`${plugin.name} moved to position ${index} of ${total}`)
    }
    if (e.key === 'ArrowDown' && index < total - 1) {
      e.preventDefault()
      onReorder(index, index + 1)
      onAnnounce(`${plugin.name} moved to position ${index + 2} of ${total}`)
    }
  }

  return (
    <div
      ref={slotRef}
      className={styles.slot}
      data-slot-index={index}
      data-bypassed={!plugin.enabled || undefined}
      style={{ '--slot-color': slotColor(index) } as CSSProperties}
      onKeyDown={handleKeyDown}
    >
      <button
        className={styles.ledBtn}
        role="checkbox"
        aria-checked={plugin.enabled}
        aria-label={plugin.name}
        onClick={() => onTogglePlugin(plugin.id, !plugin.enabled)}
      />
      <button
        className={styles.nameBtn}
        aria-label={`Open ${plugin.name}`}
        onClick={() => onOpenPlugin(plugin.id)}
      >
        {plugin.name}
      </button>
      <button
        className={styles.moveUp}
        aria-label={`Move ${plugin.name} up`}
        disabled={index === 0}
        onClick={() => { onReorder(index, index - 1); onAnnounce(`${plugin.name} moved to position ${index} of ${total}`) }}
      >↑</button>
      <button
        className={styles.moveDown}
        aria-label={`Move ${plugin.name} down`}
        disabled={index === total - 1}
        onClick={() => { onReorder(index, index + 1); onAnnounce(`${plugin.name} moved to position ${index + 2} of ${total}`) }}
      >↓</button>
      <div
        className={styles.handle}
        aria-hidden
        data-testid="drag-handle"
        onPointerDown={e => onDragStart(index, e)}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onPointerCancel}
      >⠿</div>
      <button
        className={styles.removeBtn}
        aria-label={`Remove ${plugin.name}`}
        onClick={() => onRemove(plugin.id)}
      >×</button>
    </div>
  )
}
```

**5. Update `ChainEditor` destructuring and `SlotRow` render** — add `onOpenPlugin` to the destructure and pass it down:

```tsx
function ChainEditor({
  plugins, chainEnabled, onToggleChain, onTogglePlugin, onReorder, onRemove, onAdd, onOpenPlugin, masterLedRef,
}: ChainEditorProps) {
```

And in the `SlotRow` JSX inside `ChainEditor`:
```tsx
<SlotRow
  key={p.id}
  plugin={p}
  index={i}
  total={plugins.length}
  onTogglePlugin={onTogglePlugin}
  onReorder={onReorder}
  onRemove={onRemove}
  onOpenPlugin={onOpenPlugin}
  onAnnounce={setAnnouncement}
  slotRef={el => { slotRefs.current[i] = el }}
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}
  onDragEnd={handleDragEnd}
  onPointerCancel={handleDragEnd}
/>
```

**6. Update `FxChip` destructuring and `ChainEditor` render** — add `onOpenPlugin`:

```tsx
export function FxChip({
  plugins,
  chainEnabled,
  onToggleChain,
  onTogglePlugin,
  onReorder,
  onRemove,
  onAdd,
  onOpenPlugin,
  size = 'md',
  disabled,
  defaultOpen = false,
  'aria-label': ariaLabel = 'FX chain',
}: FxChipProps) {
```

And in the `ChainEditor` JSX:
```tsx
<ChainEditor
  plugins={plugins}
  chainEnabled={chainEnabled}
  onToggleChain={onToggleChain}
  onTogglePlugin={onTogglePlugin}
  onReorder={onReorder}
  onRemove={onRemove}
  onAdd={onAdd}
  onOpenPlugin={onOpenPlugin}
  masterLedRef={masterLedRef}
/>
```

#### 2c — Add CSS for `.nameBtn`

- [ ] **Step 4: Replace `.name` with `.nameBtn` in FxChip.module.css**

In `src/components/FxChip/FxChip.module.css`, find the entire `.name` block and `.slot[data-bypassed] .name` rule:
```css
/* ─── Plugin name ────────────────────────────────────────────────────────────── */

.name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--stage-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

.slot[data-bypassed] .name {
  color: color-mix(in srgb, var(--stage-text) 40%, transparent);
}
```

Replace with:
```css
/* ─── Plugin name button (click → open editor) ───────────────────────────────── */

.nameBtn {
  flex: 1;
  min-width: 0;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--stage-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  transition: color var(--dur-fast) var(--ease-out);
}

.nameBtn:hover {
  color: var(--text);
}

.nameBtn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: 2px;
  border-radius: 2px;
}

.slot[data-bypassed] .nameBtn {
  color: color-mix(in srgb, var(--stage-text) 40%, transparent);
}
```

#### 2d — Update demo

- [ ] **Step 5: Add `onOpenPlugin` stub to FxChip.demo.tsx**

In `src/components/FxChip/FxChip.demo.tsx`:

The existing `noop` const covers all no-op callbacks. Add `onOpenPlugin={noop}` to every `<FxChip>` instance in `StatesDemo`. There are 8 FxChip instances in StatesDemo — each currently ends with `onAdd={noop} />`. Change each one to `onAdd={noop} onOpenPlugin={noop} />`.

For `PlaygroundDemo`, the `<FxChip>` inside the playground already passes named handlers. Add `onOpenPlugin` right after `onAdd`:

```tsx
<FxChip
  plugins={plugins}
  chainEnabled={chainEnabled}
  onToggleChain={setChainEnabled}
  onTogglePlugin={handleTogglePlugin}
  onReorder={handleReorder}
  onRemove={handleRemove}
  onAdd={handleAdd}
  onOpenPlugin={id => console.log('open plugin', id)}
  size={size}
  disabled={disabled}
/>
```

#### 2e — Verify

- [ ] **Step 6: Run full test suite — expect all pass**

```bash
npm test -- --run
```

Expected: 464 tests pass (462 existing + 2 new `onOpenPlugin` tests).

- [ ] **Step 7: Typecheck**

```bash
npm run build 2>&1 | grep -E "^src.*error" | head -20
```

Expected: zero TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/FxChip/FxChip.tsx src/components/FxChip/FxChip.module.css src/components/FxChip/FxChip.test.tsx src/components/FxChip/FxChip.demo.tsx
git commit -m "feat(FxChip): add onOpenPlugin — plugin name is now a button that opens the editor"
```

---

### Task 3: Strengthen partial-amber bloom

**Files:**
- Modify: `src/components/FxChip/FxChip.module.css`

**Interfaces:**
- Consumes: `--led-yellow` token, existing `.root[data-state="partial"] .chip` and `.masterLed[data-state="partial"]` rules.
- Produces: amber partial state with a clearly visible bloom on par with the cyan all-active state.

The current amber bloom uses `0 0 8px 3px` spread with 35%/40% color-mix — the same geometry as the cyan active state. Yellow is perceptually less saturated on dark backgrounds than cyan; the amber needs a larger spread and higher opacity to appear equally present.

- [ ] **Step 1: Boost chip partial bloom**

In `src/components/FxChip/FxChip.module.css`, find:
```css
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
Replace with:
```css
.root[data-state="partial"] .chip {
  border-color: var(--led-yellow);
  box-shadow:
    0 0 0 1px var(--led-yellow),
    0 0 12px 5px color-mix(in srgb, var(--led-yellow) 55%, transparent);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-led-on) var(--ease-out);
}
```

Changes: `border-color` is now the full `--led-yellow` (was a 60% mix), outer glow is `12px 5px` at 55% (was `8px 3px` at 35%).

- [ ] **Step 2: Boost master LED partial bloom**

In `src/components/FxChip/FxChip.module.css`, find:
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
Replace with:
```css
.masterLed[data-state="partial"] {
  background: var(--led-yellow);
  box-shadow:
    0 0 0 1px var(--led-yellow),
    0 0 12px 5px color-mix(in srgb, var(--led-yellow) 55%, transparent);
  transition:
    background  var(--dur-led-on) var(--ease-out),
    box-shadow  var(--dur-led-on) var(--ease-out);
}
```

- [ ] **Step 3: Run tests — expect all pass**

```bash
npm test -- --run
```

Expected: 464 tests pass. (CSS-only change.)

- [ ] **Step 4: Commit**

```bash
git add src/components/FxChip/FxChip.module.css
git commit -m "fix(FxChip): strengthen partial-amber bloom — larger spread and higher opacity for visibility parity with cyan"
```

---

## Self-Review

**Spec coverage:**
1. ✅ Fix 1 — `user-select: none` + `-webkit-user-select: none` on `.slot` (Task 1).
2. ✅ Fix 2 — `onOpenPlugin(id)` required prop wired through all three components; name is `<button aria-label="Open {name}">` (Task 2). LED = bypass, name = open, handle = drag, ↑/↓ = keyboard reorder, × = remove — no conflicts. Demo stubbed with `console.log` in playground and `noop` in states grid.
3. ✅ Fix 3 — Stronger amber: `border-color: var(--led-yellow)` (full yellow, not mixed), `12px 5px 55%` glow (up from `8px 3px 35%`) on chip; matching bump on master LED (Task 3).
4. ✅ Existing tests stay green — `DEFAULT_PROPS` gains `onOpenPlugin: noop` so all existing test renders continue to typecheck. New tests: 2 assertions for `onOpenPlugin` firing.

**Placeholder scan:** None — all code shown in full, no TODOs.

**Type consistency:** `onOpenPlugin: (id: string) => void` is the signature used in all three interfaces (`FxChipProps`, `ChainEditorProps`, `SlotRowProps`) and in the test's `vi.fn()` call.
