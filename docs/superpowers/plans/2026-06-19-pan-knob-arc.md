# PanKnob Value Arc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recessed range-arc groove, a lit value-arc sweeping from center to current pan, and a center detent tick to `PanKnob` so pan position is legible at small sizes — without changing the API or drag behavior.

**Architecture:** All three new elements are static SVG `<path>` / `<line>` elements drawn in a new arc layer inside the existing SVG, outside the rotating knob body (r=18 vs knob r≤14). A new exported `arcPath` utility computes SVG path `d` strings from degree ranges. The value arc is conditionally rendered when `|pan| > 0.005`; at center it is absent (empty groove + center tick reads as "center").

**Tech Stack:** React + TypeScript, SVG arcs via `stroke` paths, CSS Module custom-property tokens (`--pan-accent`, `--accent`, `--border-strong`, `--text-dim`).

## Global Constraints

- `viewBox="0 0 40 40"`, center `(20, 20)`, arc radius `r=18` (inside 20px max radius) — all coordinates must be within the viewBox.
- No new npm packages.
- `color` prop (`--pan-accent` CSS var) flows through to value arc stroke — same token as cap + LED ring.
- `prefers-reduced-motion`: durations are already zeroed via `--dur-fast` in `global.css`; no extra rules needed.
- SVG arc angles are measured **clockwise from top** (matching existing `panToAngle` convention).
- `panToAngle(pan)` returns degrees in `[-135, 135]`; the same range is the range arc span.
- `displayAngle` (spring-animated) is only for the rotating knob body; the arc uses `panToAngle(pan)` (data value).
- `aria-hidden="true"` on decorative arc elements.
- All existing tests must stay green.

---

## File Map

| File | Change |
|------|--------|
| `src/components/PanKnob/PanKnob.tsx` | Export `arcPath` utility; add arc SVG elements |
| `src/components/PanKnob/PanKnob.module.css` | Add `.rangeArc`, `.valueArc`, `.centerTick` classes |
| `src/components/PanKnob/PanKnob.test.tsx` | Add tests for `arcPath` + arc element presence/behavior |
| `src/components/PanKnob/PanKnob.demo.tsx` | Add arc showcase section (hard L / center / hard R, both sizes) |

---

### Task 1: `arcPath` utility — TDD

**Files:**
- Modify: `src/components/PanKnob/PanKnob.tsx` (add export)
- Modify: `src/components/PanKnob/PanKnob.test.tsx` (add `arcPath` suite)

**Interfaces:**
- Produces: `arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string`
  - Returns an SVG `d` string: `M <sx> <sy> A <r> <r> 0 <largeArc> <sweep> <ex> <ey>`
  - Angles: 0° = top, positive = clockwise, negative = counter-clockwise
  - All coordinates rounded to 4 decimal places
  - `largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0`
  - `sweep = (toDeg - fromDeg) > 0 ? 1 : 0`

- [ ] **Step 1: Write failing tests for `arcPath`**

Add this `describe` block to `src/components/PanKnob/PanKnob.test.tsx` (after the existing `formatAriaValueText` suite, before `PanKnob rendering`):

```tsx
describe('arcPath', () => {
  it('starts at top for fromDeg=0 (M 20 2)', () => {
    const d = arcPath(20, 20, 18, 0, 90)
    expect(d).toMatch(/^M 20 2 /)
  })

  it('clockwise sweep=1 when toDeg > fromDeg', () => {
    const d = arcPath(20, 20, 18, 0, 90)
    // "A 18 18 0 <large> 1 ..."
    expect(d).toContain('A 18 18 0 0 1 ')
  })

  it('counter-clockwise sweep=0 when toDeg < fromDeg', () => {
    const d = arcPath(20, 20, 18, 0, -90)
    expect(d).toContain('A 18 18 0 0 0 ')
  })

  it('large-arc=1 when |toDeg - fromDeg| > 180', () => {
    // range arc: -135 to 135 = 270°
    const d = arcPath(20, 20, 18, -135, 135)
    expect(d).toContain('A 18 18 0 1 1 ')
  })

  it('large-arc=0 when |toDeg - fromDeg| <= 180', () => {
    // value arc at full right: 0 to 135 = 135°
    const d = arcPath(20, 20, 18, 0, 135)
    expect(d).toContain('A 18 18 0 0 1 ')
  })

  it('range arc starts at bottom-left (−135°)', () => {
    // sin(-135°) = -0.7071, cos(-135°) = -0.7071
    // sx = 20 + 18*(-0.7071) = 7.2721, sy = 20 - 18*(-0.7071) = 32.7279
    const d = arcPath(20, 20, 18, -135, 135)
    expect(d).toMatch(/^M 7\.272\d* 32\.727\d* /)
  })

  it('value arc at pan=1 ends at bottom-right (+135°)', () => {
    // sin(135°) = 0.7071, cos(135°) = -0.7071
    // ex = 20 + 18*(0.7071) = 32.7279, ey = 20 - 18*(-0.7071) = 32.7279
    const d = arcPath(20, 20, 18, 0, 135)
    expect(d).toMatch(/32\.727\d* 32\.727\d*$/)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/PanKnob/PanKnob.test.tsx 2>&1 | tail -20
```

Expected: FAIL with `arcPath is not a function` or similar.

- [ ] **Step 3: Implement `arcPath` in `PanKnob.tsx`**

Add after the existing `formatAriaValueText` function (before the `// ─── Component` comment):

```tsx
export function arcPath(
  cx: number, cy: number, r: number, fromDeg: number, toDeg: number,
): string {
  const r4 = (n: number) => Math.round(n * 10000) / 10000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const sx = r4(cx + r * Math.sin(toRad(fromDeg)))
  const sy = r4(cy - r * Math.cos(toRad(fromDeg)))
  const ex = r4(cx + r * Math.sin(toRad(toDeg)))
  const ey = r4(cy - r * Math.cos(toRad(toDeg)))
  const dAngle = toDeg - fromDeg
  const largeArc = Math.abs(dAngle) > 180 ? 1 : 0
  const sweep = dAngle > 0 ? 1 : 0
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`
}
```

Also add `arcPath` to the import in `PanKnob.test.tsx`:

```tsx
import { PanKnob, panToAngle, formatReadout, formatAriaValueText, clamp, arcPath } from './PanKnob'
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/PanKnob/PanKnob.test.tsx 2>&1 | tail -20
```

Expected: All `arcPath` tests PASS, all existing tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PanKnob/PanKnob.tsx src/components/PanKnob/PanKnob.test.tsx
git commit -m "feat(PanKnob): export arcPath SVG arc utility + tests"
```

---

### Task 2: Arc SVG elements in component + CSS

**Files:**
- Modify: `src/components/PanKnob/PanKnob.tsx` (add arc layer to SVG)
- Modify: `src/components/PanKnob/PanKnob.module.css` (add `.rangeArc`, `.valueArc`, `.centerTick`)
- Modify: `src/components/PanKnob/PanKnob.test.tsx` (add arc element tests)

**Interfaces:**
- Consumes: `arcPath` from Task 1, `panToAngle` (existing), `pan` prop (existing)
- New `data-testid` attributes: `"range-arc"`, `"value-arc"`, `"center-tick"`

- [ ] **Step 1: Write failing tests for arc elements**

Add this suite to `PanKnob.test.tsx` after the `PanKnob branding` suite:

```tsx
describe('PanKnob arc elements', () => {
  const noop = vi.fn()

  it('range arc is always present', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="range-arc"]')).not.toBeNull()
  })

  it('center tick is always present', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="center-tick"]')).not.toBeNull()
  })

  it('value arc is absent at pan=0 (center reads as empty)', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).toBeNull()
  })

  it('value arc is present at pan=1 (full right)', () => {
    const { container } = render(<PanKnob pan={1} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).not.toBeNull()
  })

  it('value arc is present at pan=-1 (full left)', () => {
    const { container } = render(<PanKnob pan={-1} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).not.toBeNull()
  })

  it('value arc at pan=1 sweeps clockwise (sweep=1 in d attribute)', () => {
    const { container } = render(<PanKnob pan={1} onChange={noop} />)
    const arc = container.querySelector('[data-testid="value-arc"]')!
    // arcPath(20,20,18,0,135) → "... A 18 18 0 0 1 ..."
    expect(arc.getAttribute('d')).toContain('A 18 18 0 0 1 ')
  })

  it('value arc at pan=-1 sweeps counter-clockwise (sweep=0 in d attribute)', () => {
    const { container } = render(<PanKnob pan={-1} onChange={noop} />)
    const arc = container.querySelector('[data-testid="value-arc"]')!
    // arcPath(20,20,18,0,-135) → "... A 18 18 0 0 0 ..."
    expect(arc.getAttribute('d')).toContain('A 18 18 0 0 0 ')
  })

  it('value arc d attribute starts at top-center (M 20 2)', () => {
    const { container } = render(<PanKnob pan={0.5} onChange={noop} />)
    const arc = container.querySelector('[data-testid="value-arc"]')!
    expect(arc.getAttribute('d')).toMatch(/^M 20 2 /)
  })

  it('range arc d attribute uses full sweep A 18 18 0 1 1 (270°)', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const arc = container.querySelector('[data-testid="range-arc"]')!
    expect(arc.getAttribute('d')).toContain('A 18 18 0 1 1 ')
  })

  it('arc elements are aria-hidden', () => {
    const { container } = render(<PanKnob pan={0.5} onChange={noop} />)
    expect(container.querySelector('[data-testid="range-arc"]')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('[data-testid="center-tick"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('value arc is absent at pan near-zero (-0.001)', () => {
    const { container } = render(<PanKnob pan={-0.001} onChange={noop} />)
    expect(container.querySelector('[data-testid="value-arc"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/PanKnob/PanKnob.test.tsx 2>&1 | grep -E "FAIL|pass|fail" | tail -10
```

Expected: New arc element tests FAIL, existing tests still PASS.

- [ ] **Step 3: Add CSS classes to `PanKnob.module.css`**

Add before the final `/* ─── Readout ───` section:

```css
/* ─── Arc layer: range groove + value arc + center tick ─────────────────── */

.rangeArc {
  fill: none;
  stroke: var(--border-strong);
  stroke-linecap: round;
  opacity: 0.55;
}

.valueArc {
  fill: none;
  stroke: var(--pan-accent, var(--accent));
  stroke-linecap: round;
  opacity: 0.9;
}

.centerTick {
  stroke: var(--border-strong);
  stroke-linecap: round;
  opacity: 0.8;
}
```

- [ ] **Step 4: Add arc SVG elements to `PanKnob.tsx`**

Add two constants just before the `return` statement:

```tsx
const ARC_R = 18
const ARC_C = 20  // center x and y
```

Inside the SVG, replace:

```tsx
        {/* ── Static layer: silkscreen L / R labels ── */}
```

with (insert the arc layer AFTER the L/R labels):

Find the closing of the L/R `<text>` block (after the `R` label `</text>`) and insert immediately after:

```tsx
        {/* ── Arc layer: range groove + value arc + center tick ── */}
        <path
          data-testid="range-arc"
          aria-hidden="true"
          d={arcPath(ARC_C, ARC_C, ARC_R, -135, 135)}
          className={styles.rangeArc}
          strokeWidth="1.5"
        />
        <line
          data-testid="center-tick"
          aria-hidden="true"
          x1={ARC_C} y1={ARC_C - ARC_R - 1.5}
          x2={ARC_C} y2={ARC_C - ARC_R + 1.5}
          className={styles.centerTick}
          strokeWidth="1.5"
        />
        {Math.abs(pan) > 0.005 && (
          <path
            data-testid="value-arc"
            aria-hidden="true"
            d={arcPath(ARC_C, ARC_C, ARC_R, 0, panToAngle(pan))}
            className={styles.valueArc}
            strokeWidth="1.5"
          />
        )}
```

The exact insertion point: after line 227 (`</text>` closing the R label), before line 229 (`{/* ── Rotating layer`).

- [ ] **Step 5: Run tests to confirm they all pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/PanKnob/PanKnob.test.tsx 2>&1 | tail -20
```

Expected: ALL tests PASS (zero failures). If any test fails, check that `ARC_R = 18`, `ARC_C = 20`, and the conditional uses `Math.abs(pan) > 0.005`.

- [ ] **Step 6: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1 | tail -20
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/PanKnob/PanKnob.tsx src/components/PanKnob/PanKnob.module.css src/components/PanKnob/PanKnob.test.tsx
git commit -m "feat(PanKnob): add range arc groove, value arc, center tick for legibility at sm"
```

---

### Task 3: Update demo

**Files:**
- Modify: `src/components/PanKnob/PanKnob.demo.tsx`

**Goal:** Make the arc visible in the gallery: show hard L / center / hard R at both sizes so the arc reads at a glance. Replace the generic `sm size` state with an explicit arc showcase section.

- [ ] **Step 1: Update `StatesDemo` in `PanKnob.demo.tsx`**

Replace the entire `StatesDemo` function with:

```tsx
function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Default (C)">
        <PanKnob pan={0} onChange={noop} />
      </State>
      <State label="L100 (full left)">
        <PanKnob pan={-1} onChange={noop} />
      </State>
      <State label="L40">
        <PanKnob pan={-0.4} onChange={noop} />
      </State>
      <State label="R75">
        <PanKnob pan={0.75} onChange={noop} />
      </State>
      <State label="R100 (full right)">
        <PanKnob pan={1} onChange={noop} />
      </State>
      <State label="sm — C">
        <PanKnob pan={0} onChange={noop} size="sm" />
      </State>
      <State label="sm — L60">
        <PanKnob pan={-0.6} onChange={noop} size="sm" />
      </State>
      <State label="sm — R60">
        <PanKnob pan={0.6} onChange={noop} size="sm" />
      </State>
      <State label="Custom color">
        <PanKnob pan={0.3} onChange={noop} color="var(--accent-green)" />
      </State>
      <State label="Disabled">
        <PanKnob pan={0.3} onChange={noop} disabled />
      </State>
    </StatesGrid>
  )
}
```

- [ ] **Step 2: Run full test suite and typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run 2>&1 | tail -20
npx tsc --noEmit 2>&1 | tail -10
```

Expected: All tests PASS, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PanKnob/PanKnob.demo.tsx
git commit -m "chore(PanKnob): expand demo to showcase arc across L/C/R at both sizes"
```

---

### Task 4: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run 2>&1 | tail -30
```

Expected: All suites PASS.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1
```

Expected: No output (zero errors).

- [ ] **Step 3: Lint**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx eslint src/components/PanKnob/ 2>&1
```

Expected: No errors. If warnings appear, note them — fix only errors.

- [ ] **Step 4: Verify in dev server**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vite --port 5273 &
```

Open `http://localhost:5273` and navigate to PanKnob. Confirm:
- Range arc (faint groove) visible at both `md` and `sm` sizes
- Value arc sweeps from center toward R when pan > 0, toward L when pan < 0
- At pan=0, only the groove and center tick are visible (no value arc)
- Center tick (small line at 12-o'clock) clearly marks center
- Value arc uses the knob's color (`color` prop) in the Custom color state
- Compare renders correctly across light/dark themes

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Range arc (groove) ±135° | Task 2 |
| Value arc from center to pan position | Task 2 |
| Clockwise for R, counter-clockwise for L | Task 2 (arcPath sweep logic) |
| At pan=0 value arc is empty | Task 2 (conditional render) |
| Center detent tick | Task 2 |
| Uses `color` prop (via --pan-accent) | Task 2 (CSS `.valueArc`) |
| No API changes | Tasks 2 (additive only) |
| Drag / onChange unchanged | Not touched |
| Reduced-motion: no extra rules needed | Global CSS already zeroes `--dur-fast` |
| SVG stroke path, no raster | Task 2 (pure SVG `<path>`) |
| Demo: hard L / center / hard R + both sizes | Task 3 |
| Tests: value arc for pan=-1,0,1 + center tick | Task 2 |
| Existing drag/onChange tests green | Task 2 (Step 5) |
| typecheck / lint / test green | Task 4 |

**Placeholder scan:** None found — all steps have concrete code.

**Type consistency:** `arcPath` exported in Task 1, imported in test file in Task 1 (same signature used in Task 2 SVG elements). `ARC_R=18`, `ARC_C=20` constants match the geometry in test assertions (`M 20 2`, `A 18 18`).
