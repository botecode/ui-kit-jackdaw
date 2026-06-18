# BrandMark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `BrandMark` component (CSS token fan + inline SVG bird) and a gallery demo page (Foundations → Brand mark) showing three interpretations at multiple sizes on light and dark backgrounds.

**Architecture:** Em-relative sizing (root `font-size: {size}px`, all internal measurements in `em`) means a single `size` prop scales everything. The fan is 5 CSS `div` petals rotated around a shared bottom pivot; the bird is a self-contained inline SVG with `currentColor`-compatible fills via CSS custom property vars. Three variants — `icon` (primary, app icon candidate), `full` (+ wordmark), `sigil` (single petal + eye, owns ≤16px) — are handled by JSX conditional rendering.

**Tech Stack:** React + TypeScript, CSS Modules, Vite, Vitest + `@testing-library/react`

## Global Constraints

- All petal fill colors from `--chroma-*` CSS custom properties — no hardcoded hex for theme colors.
- Bird grey range (`--brand-crown`, `--brand-crown-deep`, `--brand-ink`) are fixed brand colors defined as local CSS vars on the component root — not theme tokens, intentionally constant.
- `--brand-eye` and `--brand-keyline` map to `var(--bg)` — cream that adapts with the theme.
- `box-shadow: 0 0 0 2px var(--brand-keyline)` for petal gaps — never `outline` (renders rectangular in some engines).
- Petal SVG stroke `strokeWidth` in the bird SVG provides the cream keyline around the bird silhouette.
- No raster images. No external SVG files. No `<use>` or sprites.
- `npm run build` (tsc + vite) must pass. `npm test` must pass.
- Bird SVG structure must be clean enough to copy verbatim into a standalone `.svg` file later.
- Spec: `docs/superpowers/specs/2026-06-18-brand-mark-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/BrandMark/BrandMark.tsx` | Component: variant/size/stage props, fan + bird + sigil JSX |
| Create | `src/components/BrandMark/BrandMark.module.css` | Brand vars, root sizing, fan layout, petal geometry, bird wrapper, sigil eye |
| Create | `src/components/BrandMark/BrandMark.test.tsx` | Smoke tests: all three variants render without throwing |
| Create | `src/components/BrandMark/BrandMark.demo.tsx` | Gallery demo: Interpretations + App icon sizes + Favicon comparison |
| Create | `src/components/BrandMark/index.ts` | Barrel export |

---

### Task 1: CSS module — brand vars + fan geometry

**Files:**
- Create: `src/components/BrandMark/BrandMark.module.css`

**Interfaces:**
- Produces: `.root`, `.root[data-variant]`, `.root[data-stage]`, `.fanPivot`, `.petal`, `.bird`, `.wordmark`, `.sigilEye`, `.sigilEyeRing`, `.sigilEyePupil` — consumed by `BrandMark.tsx` in Task 2.

- [ ] **Step 1: Create the CSS module**

Create `src/components/BrandMark/BrandMark.module.css` with:

```css
/* src/components/BrandMark/BrandMark.module.css */

/* ─── Fixed brand identity vars ─────────────────────────────────────────────
   These are the jackdaw's own colours — not theme semantic tokens.
   Defined here so they're tweakable in one place if the bird is ever recoloured.
   --brand-eye and --brand-keyline map to --bg so the cream adapts per theme.      */
.root {
  --brand-crown:      #8a8a8a;
  --brand-crown-deep: #2a2a2a;
  --brand-ink:        #1a1a18;
  --brand-eye:        var(--bg);
  --brand-keyline:    var(--bg);
}

/* ─── Root wrapper ───────────────────────────────────────────────────────── */

.root {
  display:   inline-block;
  position:  relative;
  /* em-relative: font-size is set via inline style to the `size` prop (px).
     All internal measurements below use em so the whole mark scales uniformly. */
}

/* Variant-specific dimensions (in em units, so they scale with font-size). */
.root[data-variant="icon"]  { width: 1em; height: 1em; }
.root[data-variant="full"]  { width: 1em; height: 1.4em; }
.root[data-variant="sigil"] { width: 0.36em; height: 0.58em; }

/* Light surface: paper texture. Dark stage: scanline texture. */
.root:not([data-stage]) {
  background:       var(--bg);
  background-image: var(--texture-paper);
  background-blend-mode: multiply;
}
.root[data-stage] {
  background:       var(--stage);
  background-image: var(--texture-stage);
  background-blend-mode: multiply;
}

/* ─── Fan pivot ──────────────────────────────────────────────────────────── */

/* Zero-size anchor at bottom-centre. Petals position relative to this. */
.fanPivot {
  position:  absolute;
  bottom:    0.1em;
  left:      50%;
  transform: translateX(-50%);
  width:     0;
  height:    0;
}

/* ─── Petals ─────────────────────────────────────────────────────────────── */

.petal {
  position:        absolute;
  bottom:          0;          /* sits on the pivot */
  left:            -0.09em;   /* half of 0.18em width → centres on pivot */
  width:           0.18em;
  height:          0.52em;
  border-radius:   0 100% 0 100%;
  transform-origin: 50% 100%;  /* rotate around bottom centre */
  /* Cream separator — box-shadow follows the rounded shape (outline does not) */
  box-shadow:      0 0 0 2px var(--brand-keyline);
}

/* Rotation + colour + stacking: centre petal (yellow) on top */
.petal:nth-child(1) { background: var(--chroma-red);    rotate: -60deg; z-index: 1; }
.petal:nth-child(2) { background: var(--chroma-orange); rotate: -30deg; z-index: 2; }
.petal:nth-child(3) { background: var(--chroma-yellow); rotate:   0deg; z-index: 3; }
.petal:nth-child(4) { background: var(--chroma-teal);   rotate:  30deg; z-index: 2; }
.petal:nth-child(5) { background: var(--chroma-blue);   rotate:  60deg; z-index: 1; }

/* ─── Bird wrapper ───────────────────────────────────────────────────────── */

/* Positions the SVG bird centred in the upper portion, overlapping the fan. */
.bird {
  position:  absolute;
  top:       0.06em;
  left:      50%;
  transform: translateX(-50%);
  width:     0.44em;
  /* Height is auto — SVG maintains its 100:120 aspect ratio.
     At 0.44em wide, height = 0.44 × (120/100) = 0.528em.
     It overlaps the fan pivot by roughly 0.1em — intentional. */
  display:   block;
  z-index:   10; /* in front of all petals */
}

/* ─── Wordmark (Interpretation A only) ──────────────────────────────────── */

.wordmark {
  position:       absolute;
  bottom:         0.04em;
  left:           50%;
  transform:      translateX(-50%);
  white-space:    nowrap;
  font-family:    var(--font-display);
  font-weight:    700;
  font-size:      0.12em;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color:          var(--text);
  z-index:        10;
}

.root[data-stage] .wordmark {
  color: var(--stage-text);
}

/* Triangle-A stretch goal: hide the letter, overlay ▲ glyph */
.wordmarkA {
  display:  inline-block;
  position: relative;
  color:    transparent;
  /* Cabinet Grotesk's A still contributes to letter-spacing — intentional */
}

.wordmarkA::before {
  content:     '▲';
  position:    absolute;
  inset:       0;
  display:     flex;
  align-items: flex-end;
  justify-content: center;
  font-size:   0.78em;
  line-height: 1;
  bottom:      0.05em;
}

.wordmarkA1::before { color: var(--chroma-red);  }
.wordmarkA2::before { color: var(--chroma-teal); }

/* ─── Sigil eye ──────────────────────────────────────────────────────────── */

/* The eye sits above the fanPivot on the single sigil petal. */
.sigilEye {
  position:  absolute;
  bottom:    0.32em;
  left:      50%;
  transform: translateX(-50%);
  width:     0.14em;
  height:    0.14em;
  z-index:   10;
}

.sigilEyeRing {
  position:      absolute;
  inset:         0;
  border-radius: 50%;
  background:    var(--brand-eye);
}

.sigilEyePupil {
  position:      absolute;
  inset:         22%;
  border-radius: 50%;
  background:    var(--brand-ink);
}
```

- [ ] **Step 2: Commit CSS scaffold**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/BrandMark/BrandMark.module.css
git commit -m "feat(BrandMark): CSS module — brand vars, fan geometry, bird wrapper"
```

---

### Task 2: BrandMark component (TDD)

**Files:**
- Create: `src/components/BrandMark/BrandMark.test.tsx`
- Create: `src/components/BrandMark/BrandMark.tsx`

**Interfaces:**
- Consumes: `.root`, `.fanPivot`, `.petal`, `.bird`, `.wordmark`, `.wordmarkA`, `.wordmarkA1`, `.wordmarkA2`, `.sigilEye`, `.sigilEyeRing`, `.sigilEyePupil` from Task 1.
- Produces: `export function BrandMark(props: BrandMarkProps)`, `export type { BrandMarkProps }` — consumed by Task 3 (demo).

- [ ] **Step 1: Write the failing smoke tests**

Create `src/components/BrandMark/BrandMark.test.tsx`:

```tsx
// src/components/BrandMark/BrandMark.test.tsx
import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('renders icon variant without throwing', () => {
    render(<BrandMark variant="icon" size={64} />)
  })

  it('renders full variant without throwing', () => {
    render(<BrandMark variant="full" size={128} />)
  })

  it('renders sigil variant without throwing', () => {
    render(<BrandMark variant="sigil" size={32} />)
  })

  it('renders stage (dark) variant without throwing', () => {
    render(<BrandMark variant="icon" size={64} stage />)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm test -- --run BrandMark.test 2>&1 | tail -10
```

Expected: FAIL — `BrandMark` is not defined.

- [ ] **Step 3: Implement BrandMark component**

Create `src/components/BrandMark/BrandMark.tsx`:

```tsx
// src/components/BrandMark/BrandMark.tsx
import styles from './BrandMark.module.css'

export interface BrandMarkProps {
  variant?: 'full' | 'icon' | 'sigil'
  size?: number
  stage?: boolean
  className?: string
}

// ─── Bird head (inline SVG) ────────────────────────────────────────────────
// Self-contained: no external file, no <use>. Copy this SVG verbatim to export
// a standalone .svg. Fills are CSS vars so the bird reskins in the gallery;
// greys are hardcoded fixed brand colours (not theme tokens — intentional).
function BirdHead() {
  return (
    <svg
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={styles.bird}
    >
      <defs>
        {/* Gradient id is unique-ish — multiple BrandMark instances on one page
            will re-declare it, but identical declarations are harmless. */}
        <radialGradient id="jd-crown" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#8a8a8a" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </radialGradient>
      </defs>

      {/* Crown: grey domed head */}
      <circle
        cx="50" cy="42" r="34"
        fill="url(#jd-crown)"
        stroke="var(--bg)" strokeWidth="3"
      />

      {/* Face + beak: charcoal polygon — trapezoidal face tapering to a pointed beak */}
      <polygon
        points="20,52 80,52 72,82 60,118 40,118 28,82"
        fill="var(--stage)"
        stroke="var(--bg)" strokeWidth="3" strokeLinejoin="round"
      />

      {/* Eye ring: pale cream — sits at intersection of crown and face */}
      <circle cx="50" cy="40" r="10" fill="var(--bg)" />

      {/* Pupil: dark centre */}
      <circle cx="50" cy="40" r="6"  fill="var(--stage)" />
    </svg>
  )
}

// ─── Petal colours (warm → cool, green skipped) ───────────────────────────
const PETAL_COLORS = [
  'var(--chroma-red)',
  'var(--chroma-orange)',
  'var(--chroma-yellow)',
  'var(--chroma-teal)',
  'var(--chroma-blue)',
] as const

// ─── BrandMark ────────────────────────────────────────────────────────────
export function BrandMark({
  variant = 'icon',
  size = 256,
  stage = false,
  className,
}: BrandMarkProps) {
  const showAllPetals = variant !== 'sigil'  // icon + full get the 5-petal fan
  const showBird      = variant !== 'sigil'  // icon + full get the SVG bird
  const showWordmark  = variant === 'full'
  const showSigil     = variant === 'sigil'

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-stage={stage || undefined}
      style={{ fontSize: size }}
      role="img"
      aria-label="Jackdaw brand mark"
    >
      {/* ── Petal fan — always rendered; icon/full get 5 petals, sigil gets 1 ── */}
      <div className={styles.fanPivot}>
        {showAllPetals
          ? PETAL_COLORS.map((color, i) => (
              <div key={i} className={styles.petal} style={{ background: color }} />
            ))
          : /* sigil: single centre petal in teal per spec */
            <div className={styles.petal} style={{ background: 'var(--chroma-teal)' }} />
        }
      </div>

      {/* ── Bird head SVG ─────────────────────────────────────────────── */}
      {showBird && <BirdHead />}

      {/* ── Sigil eye ─────────────────────────────────────────────────── */}
      {showSigil && (
        <div className={styles.sigilEye}>
          <div className={styles.sigilEyeRing} />
          <div className={styles.sigilEyePupil} />
        </div>
      )}

      {/* ── Wordmark (Interpretation A) ───────────────────────────────── */}
      {showWordmark && (
        <div className={styles.wordmark}>
          {/* Triangle-A stretch goal: if ▲ glyphs look misaligned in Cabinet
              Grotesk, replace with plain spans: <span>J</span><span>A</span>…  */}
          <span>J</span>
          <span className={`${styles.wordmarkA} ${styles.wordmarkA1}`}>A</span>
          <span>CKD</span>
          <span className={`${styles.wordmarkA} ${styles.wordmarkA2}`}>A</span>
          <span>W</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm test -- --run BrandMark.test 2>&1 | tail -10
```

Expected: 4 tests PASS.

- [ ] **Step 5: Check typecheck is clean**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Spot-check visually in dev server**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm run dev
```

Open `http://localhost:5173`. The demo page doesn't exist yet (that's Task 3), so just check there are no console errors on startup.

- [ ] **Step 7: Commit component + tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/BrandMark/BrandMark.tsx src/components/BrandMark/BrandMark.test.tsx
git commit -m "feat(BrandMark): component — fan + SVG bird + sigil, all three variants"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/BrandMark/BrandMark.demo.tsx`

**Interfaces:**
- Consumes: `BrandMark`, `BrandMarkProps` from Task 2; `DemoShell` from `../../gallery/ui/DemoShell`.
- Produces: `export const meta: DemoMeta` + `export default BrandMarkDemo` — auto-discovered by `registry.ts` glob.

- [ ] **Step 1: Create the demo file**

Create `src/components/BrandMark/BrandMark.demo.tsx`:

```tsx
// src/components/BrandMark/BrandMark.demo.tsx
import type { ReactNode } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { BrandMark } from './BrandMark'

export const meta: DemoMeta = {
  name:  'Brand mark',
  group: 'Foundations',
  route: '/brand-mark',
  order: 1,
}

// ─── Shared tile helper ───────────────────────────────────────────────────

function Tile({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      {children}
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'var(--text-xs)',
        color:         'var(--text-dim)',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── Section A: Interpretations ───────────────────────────────────────────

function InterpretationsSection() {
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        Interpretations
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {/* A: Full mark — light only (wordmark needs readable bg) */}
        <Tile label="A — Full mark (400px)">
          <BrandMark variant="full" size={400} />
        </Tile>

        {/* B: Icon — light + dark side by side */}
        <Tile label="B — Icon / light (256px)">
          <BrandMark variant="icon" size={256} />
        </Tile>
        <Tile label="B — Icon / dark (256px)">
          <BrandMark variant="icon" size={256} stage />
        </Tile>

        {/* C: Sigil — light + dark side by side */}
        <Tile label="C — Sigil / light (128px)">
          <BrandMark variant="sigil" size={128} />
        </Tile>
        <Tile label="C — Sigil / dark (128px)">
          <BrandMark variant="sigil" size={128} stage />
        </Tile>
      </div>
    </section>
  )
}

// ─── Section B: App icon sizes (Interpretation B) ────────────────────────

function AppIconSizesSection() {
  const SIZES = [512, 128, 64] as const
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        App icon sizes — Interpretation B
      </h2>
      {/* Light row */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {SIZES.map(s => (
          <Tile key={s} label={`${s}px / light`}>
            <BrandMark variant="icon" size={s} />
          </Tile>
        ))}
      </div>
      {/* Dark row */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {SIZES.map(s => (
          <Tile key={s} label={`${s}px / dark`}>
            <BrandMark variant="icon" size={s} stage />
          </Tile>
        ))}
      </div>
    </section>
  )
}

// ─── Section C: Favicon (16px — B vs C side by side) ─────────────────────

function FaviconSection() {
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        Favicon — 16px ownership
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end' }}>
        <Tile label="B icon — 16px (illegible)">
          <BrandMark variant="icon" size={16} />
        </Tile>
        <Tile label="C sigil — 16px (reads)">
          <BrandMark variant="sigil" size={16} />
        </Tile>
        <Tile label="C sigil — 16px / dark (reads)">
          <BrandMark variant="sigil" size={16} stage />
        </Tile>
      </div>
    </section>
  )
}

// ─── Default export ───────────────────────────────────────────────────────

export default function BrandMarkDemo() {
  return (
    <DemoShell meta={meta}>
      <InterpretationsSection />
      <AppIconSizesSection />
      <FaviconSection />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Open gallery and visually verify**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm run dev
```

Open `http://localhost:5173`. Navigate to **Foundations → Brand mark**.

Checklist:
- [ ] Three interpretations render in the Interpretations section
- [ ] App icon sizes row shows B at 512, 128, 64 on both light and dark
- [ ] Favicon section shows B (mush) and C (readable petal dot) side by side at 16px
- [ ] Dark tiles: bird silhouette is readable — cream keyline holds the shape against `--stage`
- [ ] Petals: cream separators visible between all 5 petals
- [ ] Fan follows warm→cool left to right (red, orange, yellow, teal, blue)
- [ ] Wordmark (Interpretation A) renders; assess triangle-A alignment — revert to plain A's if misaligned

**If triangle-A looks off:** In `BrandMark.tsx`, replace the wordmark JSX with plain letters:
```tsx
{showWordmark && (
  <div className={styles.wordmark}>
    JACKDAW
  </div>
)}
```

- [ ] **Step 3: Commit demo**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/BrandMark/BrandMark.demo.tsx
git commit -m "feat(BrandMark): gallery demo — interpretations, app icon sizes, favicon comparison"
```

---

### Task 4: Barrel export + final verification

**Files:**
- Create: `src/components/BrandMark/index.ts`

**Interfaces:**
- Produces: public export of `BrandMark` and `BrandMarkProps`.

- [ ] **Step 1: Write barrel export**

Create `src/components/BrandMark/index.ts`:

```ts
// src/components/BrandMark/index.ts
export { BrandMark } from './BrandMark'
export type { BrandMarkProps } from './BrandMark'
```

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npm test -- --run 2>&1 | tail -15
```

Expected: all tests pass, including the 4 BrandMark smoke tests.

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit barrel + confirm DoD**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git add src/components/BrandMark/index.ts
git commit -m "feat(BrandMark): barrel export — BrandMark component ready"
```

Confirm DoD before closing:
- [ ] All three variants render at any `size` value
- [ ] All petal colors from `--chroma-*` tokens (no hardcoded hex)
- [ ] Brand vars (`--brand-crown`, `--brand-crown-deep`, `--brand-ink`) defined at component root
- [ ] `--brand-eye` and `--brand-keyline` map to `var(--bg)` (adapts per theme)
- [ ] Cream keyline visible on petals and bird on both light and dark backgrounds
- [ ] B at 16px is visually illegible; C at 16px reads as a coloured dot
- [ ] `npm test -- --run` green
- [ ] `npx tsc --noEmit` clean

---

## Tuning Notes (for implementer)

**If bird proportions look off:** The SVG viewBox is `0 0 100 120`. Adjust the `crown` circle (`cx`, `cy`, `r`) and face `polygon` points directly — the coordinate space is straightforward (100 units wide = full bird width). Eye position is `cx="50" cy="40"`.

**If petals look too wide/narrow:** Adjust `.petal` `width` and `height` in the CSS module. The 5° rotation spacing (–60 to +60, 30° steps) is locked to the `:nth-child` rules — changing just `width`/`height` won't break the fan geometry.

**If the sigil petal looks wrong:** The sigil uses the single center petal at 0° rotation. In `BrandMark.tsx`, the sigil renders `var(--chroma-teal)` per spec; the `.petal:nth-child` rules won't apply since there's only one petal (no CSS `:nth-child(3)` needed — it just gets the base `.petal` styles at 0° rotation naturally since `rotate` defaults to 0).

**If the bird is invisible on dark stage:** The cream keyline (`stroke="var(--bg)"`) on the crown circle and face polygon provides the silhouette on dark. If it still reads poorly, increase `strokeWidth` from `3` to `4` or `5` — this is a visual judgment call.

**Triangle-A baseline:** Cabinet Grotesk's uppercase A has a specific cap height. The `▲` glyph at `font-size: 0.78em` with `align-items: flex-end` attempts to sit at cap height. If it's too high or too low, adjust `bottom` on `::before` or remove the stretch goal entirely (`JACKDAW` plain is the correct baseline).
