// src/components/FeatureGrid/types.ts
//
// The data shapes the marketing site feeds the grid. These are presentational
// (the web surface, not the bridge contract): a feature is a glyph + a title + a
// blurb, and optionally one call-to-action link. Typed so the site drops its
// content array straight in.

import type { FeatureGlyph } from './glyphs'

export interface FeatureLink {
  /** Visible call-to-action text, e.g. "See versioning". */
  label: string
  /** Where the link points — a real href so it works without JS. */
  href: string
}

export interface FeatureItem {
  /** Stable key for the list (slug or id). */
  id: string
  /** Which bespoke Chroma glyph fronts the card. */
  glyph: FeatureGlyph
  title: string
  /** One or two short sentences. */
  blurb: string
  /** Optional call-to-action. Omit for a plain info tile. */
  link?: FeatureLink
}
