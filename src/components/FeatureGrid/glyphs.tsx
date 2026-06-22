// src/components/FeatureGrid/glyphs.tsx
//
// Bespoke Chroma feature glyphs — custom inline SVG, NOT Phosphor. These are the
// audio/craft marks the marketing surface speaks in (waveform, the jackdaw eye,
// the automation breakpoint line…), drawn on one 24-grid with one stroke weight so
// they read as a family. They paint with `currentColor`, so the card drives their
// colour (recessed on-stage tone at rest → accent bloom on hover) with zero props.

import type { ReactElement } from 'react'

export type FeatureGlyph =
  | 'waveform'    // write / record
  | 'versions'    // version history (stacked takes)
  | 'share'       // share / collaborate (linked nodes)
  | 'fx'          // plugins / FX (a knob)
  | 'automation'  // automation (breakpoint curve)
  | 'local'       // files stay on your machine (shield)
  | 'eye'         // the jackdaw signature

// Each entry is the inner geometry; the wrapper supplies the shared svg attrs.
const GEOMETRY: Record<FeatureGlyph, ReactElement> = {
  waveform: (
    <>
      <path d="M4 9v6" />
      <path d="M8 5v14" />
      <path d="M12 8v8" />
      <path d="M16 3v18" />
      <path d="M20 10v4" />
    </>
  ),
  versions: (
    <>
      <path d="M4 8.5 12 4l8 4.5L12 13Z" />
      <path d="M4 12l8 4.5L20 12" />
      <path d="M4 15.5 12 20l8-4.5" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6" />
      <path d="m8.2 13.2 7.6 3.6" />
    </>
  ),
  fx: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 12V6.8" />
      <path d="m6.2 18.4 1.3-1.3" />
      <path d="m17.8 18.4-1.3-1.3" />
    </>
  ),
  automation: (
    <>
      <path d="M4 17 9 9l5 4 6-7" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  local: (
    <>
      <path d="M12 3 19 6v5c0 5-3.5 8.4-7 10-3.5-1.6-7-5-7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  eye: (
    <>
      <path d="M3 12c3-5 15-5 18 0-3 5-15 5-18 0Z" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="13" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
}

export const FEATURE_GLYPHS = Object.keys(GEOMETRY) as FeatureGlyph[]

export function Glyph({ name, className }: { name: FeatureGlyph; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GEOMETRY[name]}
    </svg>
  )
}
