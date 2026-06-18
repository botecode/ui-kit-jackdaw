# Fader Branding Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the `Fader` component's visual style to read as Hologram hardware — dark recessed milled channel, printed tick scale with emphasis on the unity (0 dB) notch, dimensional knurled cap with cast shadow, LED bloom on active/focus — all via theme tokens so every theme reskins cleanly.

**Architecture:** Pure visual overhaul. Logic, API (except one new `ticks?` prop), scales, motion, and existing tests are unchanged. Changes are concentrated in `Fader.module.css` (major rewrite) and `Fader.tsx` (remove fill JSX, move `--detent-pos` to `.track`, add scale JSX, add `ticks` prop). No new files.

**Tech Stack:** React 19, CSS Modules, CSS custom properties, Vitest 4 + @testing-library/react, TypeScript 6.

## Global Constraints

- CSS Modules + CSS custom properties only — no Tailwind, no inline styles except for CSS variable values passed via the `style` prop
- All colors through theme tokens — no hardcoded hex values in component CSS
- `npx tsc --noEmit` must pass
- `npx vitest run` must pass (all existing + new tests green)
- Existing `data-testid` values `fader-track`, `fader-cap`, `fader-readout`, `fader-detent` must not change — existing tests depend on them
- No changes to `faderScales.ts` or `spring.ts`

---

## File Map

| File | Change |
|------|--------|
| `src/components/Fader/Fader.tsx` | Remove fill JSX; move `--detent-pos` to `.track`; add `ticks?` prop; add `.scale` + `.tickMark` JSX with `data-testid="fader-tick"` and `data-unity` |
| `src/components/Fader/Fader.module.css` | Remove `.fill`; update `.track` (dark channel); add `.scale`, `.tickMark`, `.tickUnity`; update `.cap` (knurl + shadow + bloom) |
| `src/components/Fader/Fader.test.tsx` | Add `describe('Fader scale strip', ...)` block with 3 new tests |
| `src/components/Fader/Fader.demo.tsx` | Add `ticks={[6, 0, -6, -12, -24, -60]}` to vertical dB fader usages |

---

### Task 1: Remove fill + recessed channel

**Files:**
- Modify: `src/components/Fader/Fader.tsx` (remove fill div)
- Modify: `src/components/Fader/Fader.module.css` (remove `.fill` block; update `.track`)

**Interfaces:**
- Produces: `.track` now renders as a dark recessed slot with no fill element; all existing tests still pass

- [ ] **Step 1: Remove the fill `<div>` from Fader.tsx**

  In the render, inside the `<div ref={trackRef} ...>` block, delete these lines:
  ```tsx
  <div
    className={styles.fill}
    style={{
      '--pos': displayPosition,
      '--fader-accent': capColor,
    } as React.CSSProperties}
  />
  ```

- [ ] **Step 2: Remove `.fill` CSS from Fader.module.css**

  Delete the entire `/* ─── Fill ─── */` section (the `.fill`, `.root[data-orientation='vertical'] .fill`, and `.root[data-orientation='horizontal'] .fill` rules).

- [ ] **Step 3: Update `.track` to the recessed channel style**

  Replace the existing `.track` rule:
  ```css
  .track {
    position: relative;
    background: var(--surface-2);
    border-radius: 3px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
    flex-shrink: 0;
  }
  ```
  With:
  ```css
  .track {
    position: relative;
    background: var(--stage);
    border-radius: 3px;
    box-shadow:
      inset 0 2px 6px rgba(0, 0, 0, 0.7),
      inset 0 0 0 1px rgba(0, 0, 0, 0.4),
      0 0 0 1px var(--border);
    flex-shrink: 0;
  }
  ```
  The `box-shadow` recipe mirrors `Meter`'s `.well` — deep inner shadow reads as carved panel, outer `0 0 0 1px var(--border)` separates it from the chassis on any theme.

- [ ] **Step 4: Run tests**

  ```bash
  npx vitest run
  ```
  Expected: all existing tests pass. No fill-related tests exist, so nothing should break.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/Fader/Fader.tsx src/components/Fader/Fader.module.css
  git commit -m "refactor(Fader): remove fill bar, darken channel to recessed stage slot"
  ```

---

### Task 2: Scale strip + tick marks (TDD)

**Files:**
- Modify: `src/components/Fader/Fader.tsx` (add `ticks` prop; move `--detent-pos` to `.track`; add scale JSX)
- Modify: `src/components/Fader/Fader.module.css` (add `.scale`, `.tickMark`, `.tickUnity`)
- Modify: `src/components/Fader/Fader.test.tsx` (3 new tests)

**Interfaces:**
- Consumes: `effectiveScale.toPosition(tickValue, min, max)` → number 0–1 (already available in component scope)
- Produces:
  - `ticks?: number[]` added to `FaderProps`
  - `data-testid="fader-tick"` on each rendered tick `<div>`
  - `data-unity="true"` on the tick whose value matches `detent.value`

- [ ] **Step 1: Write 3 failing tests**

  Append this block to `src/components/Fader/Fader.test.tsx` (after the last `describe` block, before the file ends):

  ```ts
  // ─── Scale strip ─────────────────────────────────────────────────────────────

  describe('Fader scale strip', () => {
    const noop = vi.fn()
    beforeEach(() => { noop.mockReset(); mockMatchMedia(false) })

    it('renders tick marks when ticks prop is provided', () => {
      const { getAllByTestId } = render(
        <Fader value={0} onChange={noop} ticks={[6, 0, -6]} min={-60} max={6} scale={dbScale()} />,
      )
      expect(getAllByTestId('fader-tick')).toHaveLength(3)
    })

    it('renders no tick marks when ticks prop is absent', () => {
      const { container } = render(<Fader value={0.5} onChange={noop} />)
      expect(container.querySelector('[data-testid="fader-tick"]')).toBeNull()
    })

    it('marks the unity tick with data-unity when its value matches detent.value', () => {
      const { container } = render(
        <Fader
          value={0}
          onChange={noop}
          ticks={[6, 0, -6]}
          min={-60}
          max={6}
          scale={dbScale()}
          detent={{ value: 0 }}
        />,
      )
      const unityTick = container.querySelector('[data-testid="fader-tick"][data-unity="true"]')
      expect(unityTick).not.toBeNull()
    })
  })
  ```

- [ ] **Step 2: Run tests to confirm they fail**

  ```bash
  npx vitest run
  ```
  Expected: 3 new tests fail. Look for failures in `Fader scale strip` block. All other tests still pass.

- [ ] **Step 3: Add `ticks` to `FaderProps` in Fader.tsx**

  In the `FaderProps` interface, add after the `format?` line:
  ```ts
  ticks?: number[]
  ```

  In the destructured props of the `Fader` function, add after `format`:
  ```ts
  ticks,
  ```

- [ ] **Step 4: Move `--detent-pos` from `.detentTick` to `.track` in Fader.tsx**

  The `--detent-pos` CSS variable is currently set as inline style on `.detentTick`. CSS custom properties inherit from parent to child, so moving it to `.track` (the parent) makes it available to both `.detentTick` and the new `.scale` children.

  Find the `<div ref={trackRef} className={styles.track} ...>` opening tag. It currently looks like:
  ```tsx
  <div
    ref={trackRef}
    className={styles.track}
    data-testid="fader-track"
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
  >
  ```

  Replace with (adds the `style` prop):
  ```tsx
  <div
    ref={trackRef}
    className={styles.track}
    data-testid="fader-track"
    style={detent ? { '--detent-pos': detentPosition } as React.CSSProperties : undefined}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
  >
  ```

  Then find the `.detentTick` JSX and remove its `style` prop:
  ```tsx
  {detent && (
    <div
      className={styles.detentTick}
      data-testid="fader-detent"
    />
  )}
  ```
  (Was: `style={{ '--detent-pos': detentPosition } as React.CSSProperties}` — remove that attribute.)

- [ ] **Step 5: Add scale JSX to Fader.tsx**

  Inside the `<div ref={trackRef} ...>`, after the `.detentTick` block and before the `.cap` div, add:

  ```tsx
  {ticks && ticks.length > 0 && (
    <div className={styles.scale} aria-hidden="true">
      {ticks.map(tickValue => {
        const pos = clamp(effectiveScale.toPosition(tickValue, min, max), 0, 1)
        const isUnity = detent != null && tickValue === detent.value
        return (
          <div
            key={tickValue}
            className={isUnity ? `${styles.tickMark} ${styles.tickUnity}` : styles.tickMark}
            style={{ '--tick-pos': pos } as React.CSSProperties}
            data-testid="fader-tick"
            data-unity={isUnity ? 'true' : undefined}
          />
        )
      })}
    </div>
  )}
  ```

- [ ] **Step 6: Add scale CSS to Fader.module.css**

  Add the following new section after the `/* ─── Detent tick ─── */` block and before `/* ─── Cap ─── */`:

  ```css
  /* ─── Scale strip (printed tick marks beside the channel) ───────────────── */

  .scale {
    position: absolute;
    pointer-events: none;
  }

  /* Vertical: strip to the right of the channel */
  .root[data-orientation='vertical'] .scale {
    left: calc(100% + 3px);
    top: 0;
    bottom: 0;
    width: 10px;
  }

  /* Horizontal: strip below the channel */
  .root[data-orientation='horizontal'] .scale {
    top: calc(100% + 3px);
    left: 0;
    right: 0;
    height: 10px;
  }

  /* ─── Tick mark (major) ──────────────────────────────────────────────────── */

  .tickMark {
    position: absolute;
    background: var(--text-muted);
  }

  /* Vertical: horizontal hairline at (1 − tick-pos) × 100% from top */
  .root[data-orientation='vertical'] .tickMark {
    left: 0;
    width: 6px;
    height: 1px;
    top: calc((1 - var(--tick-pos, 0)) * 100%);
  }

  /* Horizontal: vertical hairline at tick-pos × 100% from left */
  .root[data-orientation='horizontal'] .tickMark {
    top: 0;
    height: 6px;
    width: 1px;
    left: calc(var(--tick-pos, 0) * 100%);
  }

  /* ─── Unity / detent notch (emphasis) ───────────────────────────────────── */

  .tickUnity {
    background: var(--border-strong);
  }

  .root[data-orientation='vertical'] .tickUnity   { width: 9px; height: 2px; }
  .root[data-orientation='horizontal'] .tickUnity { height: 9px; width: 2px; }
  ```

- [ ] **Step 7: Run tests to confirm they pass**

  ```bash
  npx vitest run
  ```
  Expected: all 3 new `Fader scale strip` tests pass. All existing tests continue to pass.

- [ ] **Step 8: Typecheck**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 9: Commit**

  ```bash
  git add src/components/Fader/Fader.tsx src/components/Fader/Fader.module.css src/components/Fader/Fader.test.tsx
  git commit -m "feat(Fader): add ticks prop + printed scale strip with unity emphasis"
  ```

---

### Task 3: Cap knurl + cast shadow + LED bloom

**Files:**
- Modify: `src/components/Fader/Fader.module.css` (update `.cap` orientation blocks; add transition + bloom rules)

**Interfaces:**
- Consumes: `--fader-accent` CSS variable (already set as inline style on `.cap` in existing JSX — no changes needed)
- Produces: cap renders with dimensional knurl, cast shadow, and LED bloom on `[data-dragging]` or `:focus-visible`

- [ ] **Step 1: Replace the vertical `.cap` background + add shadow**

  Find the `/* Vertical: ... */` `.cap` rule in Fader.module.css. The current `background` has a single knurl gradient (shadow-only, no highlight). Replace the entire vertical `.cap` rule:

  ```css
  /* Vertical: horizontal grooves perpendicular to travel direction */
  .root[data-orientation='vertical'] .cap {
    left: 50%;
    transform: translateX(-50%);
    width: var(--cap-width);
    height: var(--cap-length);
    top: calc((1 - var(--pos, 0)) * (100% - var(--cap-length)));
    background:
      repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.22) 0px,
        rgba(0, 0, 0, 0.22) 1px,
        rgba(255, 255, 255, 0.07) 1px,
        rgba(255, 255, 255, 0.07) 2px,
        transparent 2px,
        transparent 5px
      ),
      var(--fader-accent, var(--accent));
    box-shadow:
      0 2px 5px rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.12);
  }
  ```

  The gradient pitch is 5px (1px dark groove + 1px highlight + 3px flat). `0deg` means horizontal stripes, which run perpendicular to the vertical travel direction — the correct grip orientation.

- [ ] **Step 2: Replace the horizontal `.cap` background + add shadow**

  Replace the entire horizontal `.cap` rule:

  ```css
  /* Horizontal: vertical grooves perpendicular to travel direction */
  .root[data-orientation='horizontal'] .cap {
    top: 50%;
    transform: translateY(-50%);
    height: var(--cap-width);
    width: var(--cap-length);
    left: calc(var(--pos, 0) * (100% - var(--cap-length)));
    background:
      repeating-linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.22) 0px,
        rgba(0, 0, 0, 0.22) 1px,
        rgba(255, 255, 255, 0.07) 1px,
        rgba(255, 255, 255, 0.07) 2px,
        transparent 2px,
        transparent 5px
      ),
      var(--fader-accent, var(--accent));
    box-shadow:
      0 2px 5px rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.12);
  }
  ```

  `90deg` means vertical stripes, perpendicular to horizontal travel.

- [ ] **Step 3: Add transition to the base `.cap` rule + LED bloom**

  Find the base `.cap` rule:
  ```css
  .cap {
    position: absolute;
    border-radius: 3px;
    z-index: 2;
    pointer-events: none;
  }
  ```

  Replace with:
  ```css
  .cap {
    position: absolute;
    border-radius: 3px;
    z-index: 2;
    pointer-events: none;
    transition: box-shadow var(--dur-fast) var(--ease-out);
  }
  ```

  Then add the LED bloom rule immediately after:
  ```css
  /* LED bloom — active (drag) or keyboard-focused state */
  .root:is([data-dragging], :focus-visible) .cap {
    box-shadow:
      0 2px 5px rgba(0, 0, 0, 0.5),
      0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 1.5px color-mix(in srgb, var(--fader-accent, var(--accent)) 70%, transparent),
      0 0 12px 4px color-mix(in srgb, var(--fader-accent, var(--accent)) 30%, transparent);
  }
  ```

  The first two layers preserve the cast shadow. The `color-mix` layers are the LED ring + diffuse bloom. `--dur-fast` is 80ms normally, 0ms when `prefers-reduced-motion: reduce` — so the glow still appears in reduced-motion (it's a functional active-state cue), just jumps to the final state instantly.

- [ ] **Step 4: Run tests**

  ```bash
  npx vitest run
  ```
  Expected: all tests pass. CSS changes don't affect any existing test assertions.

- [ ] **Step 5: Typecheck**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/Fader/Fader.module.css
  git commit -m "feat(Fader): dimensional knurl cap, cast shadow, LED bloom on active/focus"
  ```

---

### Task 4: Demo update

**Files:**
- Modify: `src/components/Fader/Fader.demo.tsx` (add `ticks` prop to vertical dB fader instances)

**Interfaces:**
- Consumes: `ticks?: number[]` prop from Task 2

- [ ] **Step 1: Add `ticks` to each vertical dB Fader in StatesDemo**

  In `StatesDemo`, every `<Fader>` that uses `scale={db}` and renders vertically needs `ticks={[6, 0, -6, -12, -24, -60]}`. That covers all states except the `"Horizontal"` state (which intentionally gets no ticks — short control). 

  Update each relevant `<Fader>` in the `StatesGrid`:

  ```tsx
  // Unity (0 dB)
  <Fader value={0} onChange={noop} min={-60} max={6} scale={db} resetValue={0}
    ticks={[6, 0, -6, -12, -24, -60]} />

  // -6 dB
  <Fader value={-6} onChange={noop} min={-60} max={6} scale={db} resetValue={0}
    ticks={[6, 0, -6, -12, -24, -60]} />

  // -∞ (−60 dB)
  <Fader value={-60} onChange={noop} min={-60} max={6} scale={db} resetValue={0}
    ticks={[6, 0, -6, -12, -24, -60]} />

  // +6 dB
  <Fader value={6} onChange={noop} min={-60} max={6} scale={db} resetValue={0}
    ticks={[6, 0, -6, -12, -24, -60]} />

  // sm size
  <Fader value={0} onChange={noop} min={-60} max={6} scale={db} size="sm" resetValue={0}
    ticks={[6, 0, -6, -12, -24, -60]} />

  // Custom color
  <Fader value={0} onChange={noop} min={-60} max={6} scale={db} color="var(--accent-green)"
    resetValue={0} ticks={[6, 0, -6, -12, -24, -60]} />
  ```

  The `"Horizontal"` and `"Disabled"` states do **not** get `ticks` — horizontal is a short control where ticks would be cramped, and disabled keeps it clean.

- [ ] **Step 2: Add `ticks` to the main vertical fader in PlaygroundDemo**

  In `PlaygroundDemo`, find the large `size="lg"` vertical fader and add the prop:
  ```tsx
  <Fader
    value={volume}
    onChange={setVolume}
    min={-60}
    max={6}
    scale={db}
    detent={{ value: 0 }}
    resetValue={resetVal}
    aria-label="Volume"
    size="lg"
    ticks={[6, 0, -6, -12, -24, -60]}
  />
  ```

  The horizontal `Fader`s in the playground controls section do **not** get `ticks`.

- [ ] **Step 3: Run tests + typecheck**

  ```bash
  npx vitest run && npx tsc --noEmit
  ```
  Expected: all pass.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/Fader/Fader.demo.tsx
  git commit -m "feat(Fader): add ticks prop to vertical dB faders in demo"
  ```

---

### Task 5: Gallery verification

**Files:** None — visual/manual verification only.

- [ ] **Step 1: Start the dev server**

  ```bash
  npm run dev
  ```
  Open the gallery in the browser (typically `http://localhost:5173`).

- [ ] **Step 2: Navigate to the Fader demo**

  In the sidebar, confirm there is **exactly one** `Fader` entry under Primitives. If a duplicate appears, check `src/gallery/planned.ts` — if `Fader` is listed there, remove that entry, then save and verify the sidebar updates to a single entry.

- [ ] **Step 3: Verify Chroma theme — channel**

  Switch the stage to the `chroma` theme. The Fader channel should:
  - Read as a **dark milled slot** (near-black, deep inner shadow) not a surface-colored bar
  - Show **no colored fill** below the cap — cap position alone shows the value
  - Show **tick marks** to the right of the channel, with the `0 dB` mark visibly heavier and darker than the others

- [ ] **Step 4: Verify Chroma theme — cap and LED bloom**

  - The cap should have a **dimensional look**: knurl ridges visible, soft highlight on the top face, visible cast shadow separating it from the channel floor
  - The pointer line (`--accent-contrast`) should be clearly visible at the cap center
  - Click and hold the cap — the **LED bloom** should appear (warm glow ring + diffuse light spill around the cap)
  - Tab to focus the fader — both the **root focus ring** (2px `--accent` outline around the whole control) and the **cap bloom** should appear simultaneously; they should compose cleanly (ring on root, bloom on cap, no visual fighting)

- [ ] **Step 5: Compare mode — verify all 5 themes**

  Switch to Compare mode in the gallery. The 5-theme tile (default, bowie, tropicalia, manuscript, ink) should each show:
  - The dark channel reads on both light themes (default, manuscript) and dark themes (ink, nocturne) — `--stage` is the correct dark well token for all themes
  - Cap color changes per theme's `--accent` token
  - Tick marks visible but appropriately muted via `--text-muted`
  - Unity notch emphasis via `--border-strong` reads without clashing on any theme

- [ ] **Step 6: Keyboard interaction sanity check**

  Click a fader to focus it, then:
  - `ArrowUp` / `ArrowDown` — cap moves, value changes
  - `Shift+Arrow` — fine movement
  - `Home` / `End` — cap jumps to min/max
  - `Delete` — cap springs back to `resetValue` with the spring animation

- [ ] **Step 7: Reduced-motion check**

  In DevTools, enable `prefers-reduced-motion: reduce` (Rendering tab → Emulate). Click/drag the cap — the LED bloom should appear **immediately** (no fade-in transition) and disappear immediately on release. The bloom itself should still be visible.

- [ ] **Step 8: Stop dev server and run final checks**

  ```bash
  npx vitest run && npx tsc --noEmit
  ```
  Expected: all pass.

- [ ] **Step 9: Commit any fixes from gallery review**

  If you made any tweaks during gallery verification:
  ```bash
  git add -p
  git commit -m "fix(Fader): gallery review tweaks"
  ```

---

## Self-Review Checklist

- [x] Fill removed from JSX + CSS (Task 1)
- [x] `.track` uses `--stage` + deep inner shadow (Task 1)
- [x] `ticks?: number[]` prop added to `FaderProps` (Task 2)
- [x] `--detent-pos` moved to `.track` — inherited by `.detentTick` and `.scale` children (Task 2)
- [x] `.scale` absolutely positioned beside the channel (right for vertical, below for horizontal) (Task 2)
- [x] `.tickMark` positioned via `scale.toPosition()` → `--tick-pos` CSS var (Task 2)
- [x] Unity notch (`.tickUnity`) identified by `tickValue === detent.value`, uses `--border-strong` (Task 2)
- [x] `data-testid="fader-tick"` + `data-unity="true"` for test coverage (Task 2)
- [x] 3 new tests, TDD sequence respected (Task 2)
- [x] Knurl grooves perpendicular to travel (0deg vertical / 90deg horizontal) (Task 3)
- [x] Cast shadow on base `.cap` rule (Task 3)
- [x] LED bloom via `color-mix` on `[data-dragging]`/`:focus-visible` (Task 3)
- [x] Transition on `.cap` respects `prefers-reduced-motion` via `--dur-fast` zero-out (Task 3)
- [x] Demo: vertical dB faders get `ticks`; horizontal controls do not (Task 4)
- [x] Gallery: single sidebar entry, Compare mode, keyboard, reduced-motion (Task 5)
