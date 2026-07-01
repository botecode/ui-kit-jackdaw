// src/components/CoverPicker/presets.ts
//
// The bundled GALLERY presets. Fixed hex values, NOT theme tokens — a cover is
// CONTENT the host stores, not chrome, so a picked sleeve must look the same in
// every theme (the same reasoning ColorSwatch uses for its fixed DEFAULT_PALETTE).
// Colors and gradients are both drawn from the six Chroma track colors so the shelf
// reads as one family. "Textures" are tokenless CSS pattern gradients (crosshatch /
// weave / dot-grid) — they render through the SAME background-image path as any
// gradient (no binary assets to bundle, still themeable-proof), so the picker stays
// pure and unit-testable.

import type { CoverChoice } from '../../lib/covers'

/** A pre-made tile in the gallery grid. `choice` is exactly what onPick emits. */
export interface CoverPreset {
  /** Stable id (React key + selection match). */
  id: string
  /** Human label — the tile's accessible name ("Peach", "Sunset gradient"). */
  label: string
  /** The typed cover this tile applies. */
  choice: CoverChoice
}

// The six Chroma track colors (mirrors --track-color-1..6 / ColorSwatch.DEFAULT_PALETTE)
// plus two warm neutrals so a plain, quiet sleeve is one click away.
const C = {
  peach: '#e8a87c',
  sage: '#7ec8a4',
  sky: '#7eb8d4',
  purple: '#c4a0e4',
  amber: '#e4c84a',
  coral: '#e47a7a',
  cream: '#efe7db',
  ink: '#26242f',
}

export const DEFAULT_COLOR_PRESETS: CoverPreset[] = [
  { id: 'color-peach', label: 'Peach', choice: { kind: 'color', value: C.peach } },
  { id: 'color-sage', label: 'Sage', choice: { kind: 'color', value: C.sage } },
  { id: 'color-sky', label: 'Sky', choice: { kind: 'color', value: C.sky } },
  { id: 'color-purple', label: 'Lavender', choice: { kind: 'color', value: C.purple } },
  { id: 'color-amber', label: 'Amber', choice: { kind: 'color', value: C.amber } },
  { id: 'color-coral', label: 'Coral', choice: { kind: 'color', value: C.coral } },
  { id: 'color-cream', label: 'Cream', choice: { kind: 'color', value: C.cream } },
  { id: 'color-ink', label: 'Ink', choice: { kind: 'color', value: C.ink } },
]

export const DEFAULT_GRADIENT_PRESETS: CoverPreset[] = [
  { id: 'grad-sunset', label: 'Sunset', choice: { kind: 'gradient', value: `linear-gradient(135deg, ${C.amber}, ${C.coral})` } },
  { id: 'grad-dusk', label: 'Dusk', choice: { kind: 'gradient', value: `linear-gradient(135deg, ${C.purple}, ${C.sky})` } },
  { id: 'grad-meadow', label: 'Meadow', choice: { kind: 'gradient', value: `linear-gradient(135deg, ${C.sage}, ${C.amber})` } },
  { id: 'grad-tide', label: 'Tide', choice: { kind: 'gradient', value: `linear-gradient(160deg, ${C.sky}, ${C.sage})` } },
  { id: 'grad-ember', label: 'Ember', choice: { kind: 'gradient', value: `linear-gradient(135deg, ${C.coral}, ${C.purple})` } },
  { id: 'grad-peachcream', label: 'Peach cream', choice: { kind: 'gradient', value: `linear-gradient(180deg, ${C.peach}, ${C.cream})` } },
]

// Textures = CSS pattern gradients emitted as `kind: 'gradient'`. Layered background
// strings render verbatim through coverStyle's background-image path.
export const DEFAULT_TEXTURE_PRESETS: CoverPreset[] = [
  {
    id: 'tex-crosshatch',
    label: 'Crosshatch',
    choice: {
      kind: 'gradient',
      value:
        `repeating-linear-gradient(45deg, ${C.peach}, ${C.peach} 6px, ${C.coral} 6px, ${C.coral} 12px)`,
    },
  },
  {
    id: 'tex-weave',
    label: 'Weave',
    choice: {
      kind: 'gradient',
      value:
        `repeating-linear-gradient(0deg, ${C.sage} 0 8px, ${C.sky} 8px 16px), ` +
        `repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 8px, transparent 8px 16px)`,
    },
  },
  {
    id: 'tex-dotgrid',
    label: 'Dot grid',
    choice: {
      kind: 'gradient',
      value:
        `radial-gradient(${C.cream} 1.6px, transparent 1.7px), ` +
        `linear-gradient(135deg, ${C.purple}, ${C.sky})`,
    },
  },
  {
    id: 'tex-sunburst',
    label: 'Sunburst',
    choice: {
      kind: 'gradient',
      value:
        `repeating-conic-gradient(from 0deg at 50% 50%, ${C.amber} 0deg 12deg, ${C.peach} 12deg 24deg)`,
    },
  },
]
