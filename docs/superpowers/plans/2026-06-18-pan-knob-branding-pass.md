# PanKnob Branding Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring PanKnob's visual language in line with the Fader — recessed stage well, real milled knurl, cast shadow, printed arc scale, and LED bloom on drag/focus — with no logic or API changes (one new optional prop only).

**Architecture:** CSS-only well via `background + box-shadow: inset` on the `.knob` SVG element (mirrors Fader's `.track` recipe); SVG structural edits to upgrade knurl to dark+bright line pairs and add a `.ledRing` circle; `--pan-accent` CSS custom property replaces direct `color` attribute for theme-safe accent.

**Tech Stack:** React + TypeScript, CSS Modules, inline SVG, Vitest + Testing Library.

## Global Constraints

- Visual-only changes (CSS + small JSX/SVG). No logic changes, no motion changes.
- Interaction fixes stay intact: reset spring seeds from current angle; wheel listener attaches once via ref.
- No breaking API changes. The only new prop allowed is optional `ticks?: number[]` — and we use the simpler hardcoded L/R silkscreen path (skip the prop).
- Token assignment must mirror Fader: cap color via `--pan-accent, var(--accent)` fallback; arc marks in `--text-muted`; center notch in `--border-strong`.
- `typecheck / lint / test` green at end.
- Verify in Compare mode: default, bowie, tropicalia, manuscript, ink.

---

### Task 1: Write new failing tests

**Files:**
- Modify: `src/components/PanKnob/PanKnob.test.tsx`

**Interfaces:**
- Consumes: existing `PanKnob` component (unchanged logic, same props)
- Produces: 3 new failing tests for ledRing, `--pan-accent`, and silkscreen labels

- [ ] **Step 1: Add three tests after the existing "PanKnob rendering" describe block**

In `src/components/PanKnob/PanKnob.test.tsx`, insert after line 97 (after the closing `})` of the `'PanKnob rendering'` describe):

```tsx
describe('PanKnob branding', () => {
  const noop = vi.fn()

  it('renders LED ring element', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    expect(container.querySelector('[data-testid="led-ring"]')).not.toBeNull()
  })

  it('sets --pan-accent CSS variable on root when color prop provided', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} color="#ff0000" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--pan-accent')).toBe('#ff0000')
  })

  it('renders L and R silkscreen labels', () => {
    const { container } = render(<PanKnob pan={0} onChange={noop} />)
    const labels = container.querySelectorAll('[data-testid="silkscreen-label"]')
    expect(labels.length).toBe(2)
  })
})
```

- [ ] **Step 2: Run new tests to verify they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/PanKnob/PanKnob.test.tsx --reporter=verbose 2>&1 | tail -30
```

Expected: 3 FAIL for the new `'PanKnob branding'` tests; all prior tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/PanKnob/PanKnob.test.tsx && git commit -m "test(PanKnob): add failing tests for branding pass (ledRing, --pan-accent, silkscreen)"
```

---

### Task 2: Update CSS — well, cast shadow, cap class, hover

**Files:**
- Modify: `src/components/PanKnob/PanKnob.module.css`

**Interfaces:**
- Consumes: `.root`, `.knob`, `.disabled`, `.readout` — existing class names unchanged
- Produces: `.cap` (new — fill via token), `.knobBody` (new — cast shadow), `.ledRing` (new — LED bloom), updated `.knob` (well background + box-shadow), updated hover rule

- [ ] **Step 1: Replace entire PanKnob.module.css with the new version**

```css
/* src/components/PanKnob/PanKnob.module.css */

.root {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.root[data-dragging] {
  cursor: grabbing;
}

.disabled {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Knob SVG — acts as the recessed well ─────────────────────────────────── */

.knob {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  outline: none;
  touch-action: none;
  /* Recessed dish well — same "milled into the panel" recipe as Fader track */
  background: var(--stage);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.7),
    inset 0 0 0 1px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
}

.knob[data-size="sm"] {
  width: 32px;
  height: 32px;
}

/* ─── Hover — subtle brightness on the cap only ─────────────────────────────── */

.root:hover .cap {
  filter: brightness(1.1);
}

/* ─── Focus ring — replaced by LED ring (ledRing handles it) ─────────────────── */

/* No external box-shadow ring; the SVG ledRing is the focus indicator */

/* ─── Cast shadow — makes the knob body stand up from the well ──────────────── */

.knobBody {
  filter:
    drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5))
    drop-shadow(0 1px 0 rgba(255, 255, 255, 0.12));
}

/* ─── Cap — colored face (fill via --pan-accent token) ──────────────────────── */

.cap {
  fill: var(--pan-accent, var(--accent));
}

/* ─── LED ring — edge ring + diffuse spill on drag / focus-visible ───────────── */
/* Incandescent feel: --dur-fast attack (symmetric, matching Fader) */

.ledRing {
  fill: none;
  stroke: color-mix(in srgb, var(--pan-accent, var(--accent)) 70%, transparent);
  opacity: 0;
  transition:
    opacity var(--dur-fast) var(--ease-out),
    filter var(--dur-fast) var(--ease-out);
}

/* prefers-reduced-motion: glow is kept (functional state) but jumps instantly
   because --dur-fast is zeroed in global.css for reduced-motion — no extra rule needed */

.root[data-dragging] .ledRing,
.knob:focus-visible .ledRing {
  opacity: 1;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--pan-accent, var(--accent)) 40%, transparent));
}

/* ─── Readout ─────────────────────────────────────────────────────────────── */

.readout {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: center;
  line-height: 1;
  height: 1em;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.root:hover .readout,
.root[data-dragging] .readout {
  opacity: 1;
}
```

- [ ] **Step 2: Run typecheck to verify CSS is syntactically valid (no TS errors from import)**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors relating to PanKnob.module.css (TypeScript doesn't parse CSS; just verifying the TS side still compiles).

- [ ] **Step 3: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/PanKnob/PanKnob.module.css && git commit -m "style(PanKnob): recessed well, cast shadow, LED ring classes, cap token"
```

---

### Task 3: Update PanKnob.tsx — remove old well, upgrade knurl, recolor ticks, add L/R labels, ledRing circle

**Files:**
- Modify: `src/components/PanKnob/PanKnob.tsx`

**Interfaces:**
- Consumes: `styles.cap`, `styles.knobBody`, `styles.ledRing` — new classes from Task 2
- Produces: updated SVG structure. All existing props, exports, data-testids, and interaction behavior are unchanged.

- [ ] **Step 1: Add `Fragment` to the React import**

In `src/components/PanKnob/PanKnob.tsx`, change line 2:

```tsx
import { Fragment, useEffect, useId, useRef, useState } from 'react'
```

- [ ] **Step 2: Remove `const capColor` and set `--pan-accent` on the root div**

Remove this line (currently `const capColor = color ?? 'var(--accent)'`):
```tsx
  const capColor = color ?? 'var(--accent)'
```

Change the root `<div>` JSX to pass `--pan-accent` as an inline CSS variable when `color` is provided. Find the return's opening div:

```tsx
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-dragging={dragging || undefined}
    >
```

Replace with:

```tsx
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-dragging={dragging || undefined}
      style={color ? { '--pan-accent': color } as React.CSSProperties : undefined}
    >
```

- [ ] **Step 3: Remove the two SVG well circles from the static layer**

Find and remove these two SVG elements (currently the first two children of the `<svg>`):

```tsx
        {/* ── Static layer: recessed well ── */}
        <circle cx="20" cy="20" r="18" fill="var(--surface-2)" />
        <circle
          cx="20" cy="20" r="17.5"
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity="0.4"
        />
```

Delete both circles and their comment — the CSS `background: var(--stage)` and `box-shadow` on `.knob` now handle the well.

- [ ] **Step 4: Update tick stroke colors — non-center from --border to --text-muted**

Find the tick `<line>` element:
```tsx
              stroke={center ? 'var(--border-strong)' : 'var(--border)'}
```

Replace with:
```tsx
              stroke={center ? 'var(--border-strong)' : 'var(--text-muted)'}
```

- [ ] **Step 5: Add L and R silkscreen labels after the tick Array.from block**

After the ticks `Array.from(...)` block (after its closing `})`), add:

```tsx
        {/* ── Static layer: silkscreen L / R labels ── */}
        <text
          data-testid="silkscreen-label"
          x="7.3"
          y="32.7"
          fontSize="2.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          aria-hidden="true"
        >L</text>
        <text
          data-testid="silkscreen-label"
          x="32.7"
          y="32.7"
          fontSize="2.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          aria-hidden="true"
        >R</text>
```

Coordinates derivation: deg=±135°, r=18 → x = 20 ± sin(135°)×18 ≈ 7.3 / 32.7; y = 20 + cos(45°)×18 ≈ 32.7 for both (bottom of arc).

- [ ] **Step 6: Upgrade the knurl from single dark lines to dark + bright paired grooves**

Replace the entire `{/* Knurled grip lines */}` `Array.from(...)` block:

Current:
```tsx
          {/* Knurled grip lines — outer band only (r 10→14), no inner fill */}
          {Array.from({ length: knurlCount }, (_, i) => {
            const rad = ((360 / knurlCount) * i * Math.PI) / 180
            return (
              <line
                key={i}
                x1={20 + Math.sin(rad) * 10} y1={20 - Math.cos(rad) * 10}
                x2={20 + Math.sin(rad) * 14} y2={20 - Math.cos(rad) * 14}
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.5"
                shapeRendering="crispEdges"
              />
            )
          })}
```

Replace with:
```tsx
          {/* Knurled grip — milled grooves: 1px dark shadow + 1px bright highlight per groove */}
          {Array.from({ length: knurlCount }, (_, i) => {
            const shadowRad = ((360 / knurlCount) * i * Math.PI) / 180
            const highlightRad = shadowRad + (1.5 * Math.PI) / 180
            return (
              <Fragment key={i}>
                <line
                  x1={20 + Math.sin(shadowRad) * 10} y1={20 - Math.cos(shadowRad) * 10}
                  x2={20 + Math.sin(shadowRad) * 14} y2={20 - Math.cos(shadowRad) * 14}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
                <line
                  x1={20 + Math.sin(highlightRad) * 10} y1={20 - Math.cos(highlightRad) * 10}
                  x2={20 + Math.sin(highlightRad) * 14} y2={20 - Math.cos(highlightRad) * 14}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  shapeRendering="crispEdges"
                />
              </Fragment>
            )
          })}
```

- [ ] **Step 7: Add className to the rotating group and update the cap circle**

Find the rotating `<g>` element:
```tsx
        <g
          data-testid="knob-body"
          style={{
            transform: `rotate(${displayAngle}deg)`,
            transformOrigin: '20px 20px',
          }}
        >
```

Replace with:
```tsx
        <g
          data-testid="knob-body"
          className={styles.knobBody}
          style={{
            transform: `rotate(${displayAngle}deg)`,
            transformOrigin: '20px 20px',
          }}
        >
```

Find the two cap circles (colored fill + gradient overlay):
```tsx
          {/* Colored cap */}
          <circle cx="20" cy="20" r="9.5" fill={capColor} />
          {/* Soft top-highlight — radial gradient; no filter (no re-raster on rotate) */}
          <circle cx="20" cy="20" r="9.5" fill={`url(#${gradId})`} />
```

Replace with (remove `fill={capColor}` attribute, add CSS class instead):
```tsx
          {/* Colored cap — fill via CSS .cap → var(--pan-accent, var(--accent)) */}
          <circle cx="20" cy="20" r="9.5" className={styles.cap} />
          {/* Soft top-highlight — radial gradient; no filter (no re-raster on rotate) */}
          <circle cx="20" cy="20" r="9.5" fill={`url(#${gradId})`} />
```

- [ ] **Step 8: Add the LED ring circle after the closing `</g>` of the rotating group**

After the `</g>` that closes the rotating group (before the `</svg>`), add:

```tsx
        {/* ── LED ring — edge ring + diffuse spill; CSS controls opacity ── */}
        <circle
          data-testid="led-ring"
          cx="20" cy="20" r="10.25"
          strokeWidth="1.5"
          className={styles.ledRing}
        />
```

- [ ] **Step 9: Run the tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run src/components/PanKnob/PanKnob.test.tsx --reporter=verbose 2>&1 | tail -40
```

Expected: all tests pass including the 3 new branding tests.

- [ ] **Step 10: Run typecheck + lint**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1 && echo "TS OK"
```

Expected: `TS OK` (no errors).

- [ ] **Step 11: Commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add src/components/PanKnob/PanKnob.tsx && git commit -m "feat(PanKnob): branding pass — recessed well, milled knurl, arc scale, LED ring, cast shadow"
```

---

### Task 4: Full verification

**Files:** read-only (no changes)

**Interfaces:**
- Consumes: finished `PanKnob.tsx` + `PanKnob.module.css` from Tasks 2–3
- Produces: all checks green

- [ ] **Step 1: Run the full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx vitest run --reporter=verbose 2>&1 | tail -50
```

Expected: all tests pass (PanKnob, Fader, Meter, spring, etc.).

- [ ] **Step 2: Run typecheck across the whole project**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Run lint**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npx eslint src/components/PanKnob/ 2>&1
```

Expected: no errors or warnings.

- [ ] **Step 4: Start dev server and visually verify in Compare mode**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && npm run dev
```

Open `http://localhost:5173` (or whichever port Vite uses).

Checklist:
- [ ] Navigate to PanKnob demo. The knob sits in a `--stage` recessed well with inner shadow.
- [ ] The knurl band shows paired dark/bright lines (milled look, not smooth glossy).
- [ ] Tick marks are `--text-muted` (muted); center notch is `--border-strong` (brighter, slightly longer).
- [ ] Tiny "L" and "R" silkscreen labels visible at the arc endpoints (bottom-left / bottom-right).
- [ ] Drag the knob: LED ring glows around the cap edge.
- [ ] Tab to the knob and use keyboard: LED ring glows on focus (`:focus-visible`).
- [ ] Release / blur: LED ring fades out.
- [ ] Switch to Compare mode (default, bowie, tropicalia, manuscript, ink): all 5 themes reskin cleanly via `--accent` / theme tokens — the custom-color state with `color="var(--accent-green)"` uses the green accent.
- [ ] sm size knob in the States grid looks proportionally correct.
- [ ] Disabled state is 40% opacity, no interaction.
- [ ] PanKnob and Fader on screen together read as hardware siblings (same depth language).

- [ ] **Step 5: Final commit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw && git add -p && git commit -m "chore(PanKnob): branding pass complete — all checks green"
```

(Only if there are any remaining unstaged changes from the dev-server verify step.)
