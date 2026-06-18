# BrandMark — Design Spec
**Date:** 2026-06-18  
**Status:** Approved — ready for implementation plan

---

## Overview

A Jackdaw brand mark that fits the Chroma theme: warm cream surface, chroma spectrum petal fan, geometric SVG jackdaw head. Gallery demo in `Foundations → Brand mark`. Token-driven so it reskins with the active theme. The bird is built to be exportable as the real app icon.

---

## Goals

- Replace the all-black app icon with something that belongs to the Chroma identity
- Demonstrate the chroma spectrum in a single artifact (petal fan = spectrum ramp)
- Three interpretations for different use contexts (marketing, app icon, favicon)
- All colors from `--chroma-*`, `--bg`, `--stage` tokens — reskins across themes automatically

---

## File Layout

```
src/components/BrandMark/
  BrandMark.tsx           ← component with variant/size/stage props
  BrandMark.module.css    ← fan, pivot, petal, keyline, bird-wrapper styles
  BrandMark.demo.tsx      ← gallery demo (group: 'Foundations', order: 1)
  index.ts                ← barrel export
```

---

## Component API

```tsx
interface BrandMarkProps {
  variant?: 'full' | 'icon' | 'sigil'  // default: 'icon'
  size?: number                          // px, default: 256
  stage?: boolean                        // dark background (--stage) vs cream (--bg)
  className?: string
}
```

**Sizing:** A root `font-size: <size>px` is set on the wrapper `div`. All internal measurements use `em` units. Changing `size` scales the entire mark uniformly.

**Stage variant:** The `stage` prop adds a dark `--stage` background. The cream keyline on both the bird and petals keeps the mark readable on dark. The wrapper gets `--texture-stage` on dark vs `--texture-paper` on light.

---

## Interpretation A — Full Mark

**Anatomy:** Petal fan (splayed ~120° arc) + bird head centered above the pivot + wordmark "JACKDAW" below in Cabinet Grotesk.

**Sizing:** Designed for ≥300px. Shown in demo at 400px.

**Wordmark:**
- `font-family: var(--font-display)`, uppercase, `letter-spacing: 0.18em`, `font-weight: 700`
- Color: `var(--text)` on light, `var(--stage-text)` on dark
- Triangle-A: **timeboxed stretch goal.** If the two A's can be cleanly replaced with filled triangles (positioned pseudo-elements in `--chroma-red` for first A, `--chroma-teal` for second) without fighting Cabinet Grotesk's metrics, include them. If the baseline or spacing looks off, ship plain A's. Do not block A on this.

---

## Interpretation B — Icon Form

**Anatomy:** Same fan + bird, no wordmark. Square-croppable. The fan fills the lower ~55% of the square frame; bird head overlaps the fan's top.

**This is the primary deliverable** — designed to become the real app icon asset.

**Sizing:** Shown in demo at 512px, 128px, 64px on both cream and dark tiles. The 16px slot belongs to Interpretation C (see below); do not tune B to survive 16px.

**Background:** `--bg` with `--texture-paper` on light; `--stage` with `--texture-stage` on dark.

---

## Interpretation C — Sigil

**Anatomy:** A single `--chroma-teal` petal (pointing straight up) with the jackdaw eye (cream ring + `--stage` pupil) centered on it. No fan, no head silhouette — just the eye-petal icon.

**Owns the favicon / ≤16px slot.** At 16px a 5-petal fan + bird is illegible; the sigil remains readable.

**Demo layout:** B and C shown side by side at 16px so the contrast makes the size-ownership argument visually. No annotation needed — the comparison speaks for itself.

---

## Petal Fan (CSS)

**Shape:** Each petal is a `div` with `border-radius: 0 100% 0 100%` (asymmetric pointed oval — sharp bottom tip, rounded top). The default Cabinet dimensions: ~0.5em wide × 1.4em tall.

**Colors (5 petals, warm→cool):**
1. `--chroma-red`
2. `--chroma-orange`
3. `--chroma-yellow`
4. `--chroma-teal`
5. `--chroma-blue`

Green is skipped to maintain the warm→cool arc without a gap-hue interruption.

**Layout:** Petals share a common bottom-center pivot. Each is `position: absolute`, `transform-origin: 50% 100%`. The 5 petals are rotated evenly across a ~120° arc (–60° to +60° from vertical, 30° steps). In the `sigil` variant only the center petal is rendered.

**Cream keyline (petal gaps):** `box-shadow: 0 0 0 2px var(--bg)` on each petal. This follows the petal's rounded shape reliably (vs `outline`, which renders rectangular in some engines). The keyline also separates petals cleanly on the dark stage variant.

**Stacking order:** petals overlap front-to-back in fan order (center petal on top) via explicit `z-index`.

---

## Bird Head (inline SVG)

A single `<svg viewBox="0 0 100 120">` embedded directly in TSX. Sized via `width`/`height` attributes driven by the `em` root. Self-contained — no external file, no `<use>`, no sprite. Exportable verbatim as a standalone `.svg`.

**Elements:**
| Shape | Element | Fill |
|-------|---------|------|
| Crown (domed head) | `<circle>` with `<radialGradient>` | center: medium grey (`#888`), edge: charcoal (`#2a2a2a`) |
| Face + beak | `<polygon>` wedge | `var(--stage)` (charcoal on dark, near-black on light) |
| Cream keyline | SVG `stroke` on crown + face, `strokeWidth="3"` | `var(--bg)` |
| Eye ring | `<circle>` | `var(--bg)` (cream) |
| Pupil | `<circle>` | `var(--stage)` |

**Token wiring:** Face/beak fill and pupil fill reference `var(--stage)` via inline `style` (since SVG `fill` doesn't inherit CSS vars without explicit wiring). Eye ring and keyline reference `var(--bg)`. Crown uses hardcoded grey range — jackdaw grey is not a named theme token, and hardcoding is correct here (it's the bird's natural color, not a UI semantic).

**Contrast on dark stage:** The cream keyline (`--bg`) wraps both the crown and face, making the bird silhouette readable even when charcoal face sits on near-black `--stage`. This must be verified in the demo's dark tile during implementation.

**Exportability:** The SVG's fills will be a mix of CSS vars and hardcoded greys. For the export-to-icon path, a baked version (vars resolved to Chroma hex values) is a later step. The inline SVG's structure should be kept clean enough to copy out into a `.svg` file without modification.

---

## Gallery Demo Layout

```
DemoShell (meta: { name: 'Brand mark', group: 'Foundations', route: '/brand-mark', order: 1 })
│
├── Section: "Interpretations"
│   ├── Interpretation A (full mark, 400px, light)
│   ├── Interpretation B (icon, 256px, light + dark tile side by side)
│   └── Interpretation C (sigil, 128px, light + dark tile side by side)
│
├── Section: "App icon sizes" (Interpretation B only)
│   ├── Light row: 512px · 128px · 64px
│   └── Dark row:  512px · 128px · 64px
│
└── Section: "Favicon" (B vs C at 16px, side by side)
    ├── B at 16px (illegible — demonstrates the point)
    └── C at 16px (reads — sigil wins at favicon)
```

Each tile is a square container with `background: var(--bg)` or `background: var(--stage)`, `border-radius: var(--radius)`, `padding: var(--space-4)`, and a small label below in `--font-mono --text-xs --text-dim`.

---

## Token Usage Summary

| Token | Used by |
|-------|---------|
| `--chroma-red/orange/yellow/teal/blue` | Petal fills |
| `--bg` | Petal keyline shadow, eye ring, bird keyline stroke, light background tiles |
| `--stage` | Dark background tiles, bird face/beak fill, pupil fill |
| `--stage-text` | Wordmark on dark tiles |
| `--text` | Wordmark on light tiles |
| `--texture-paper` | Light background texture |
| `--texture-stage` | Dark background texture |
| `--font-display` | Wordmark (Interpretation A) |
| `--radius` | Tile corners |

No hardcoded hex values in CSS or JSX except the jackdaw's crown grey range (not a semantic token).

---

## Definition of Done

- [ ] `BrandMark` component renders all three variants at any `size` value
- [ ] All colors come from CSS custom properties (no hardcoded hex except crown grey)
- [ ] Gallery demo shows all three interpretations + size row + 16px comparison
- [ ] Mark is readable on both light (`--bg`) and dark (`--stage`) backgrounds
- [ ] Cream keyline present on bird and petals in both light and dark variants
- [ ] `typecheck`, `lint`, `test` all green (no new test file required — brand mark is static)
- [ ] Wordmark renders with plain A's at minimum; triangle-A is a stretch goal

---

## Out of Scope

- Exporting the bird as a standalone `.svg` file (later step)
- Baking CSS vars to hex for actual `.icns`/`.ico` generation (later step)
- Animation (not requested)
- Responsive breakpoints (size prop handles scaling)
