// src/lib/covers.ts
//
// The SHARED cover layer. A "cover" (an album sleeve, later a song take) can be one
// of three things: a flat COLOR, a CSS GRADIENT, or an IMAGE (a hosted url OR a
// data-URL from an upload). This module is the single source of truth for two things:
//
//   1. The typed CHOICE a picker emits (`CoverChoice`) — a discriminated union so the
//      host stores exactly what was picked and never has to guess "is this a color or
//      a url?". Attribution rides along on images (Unsplash credit).
//   2. The one render function (`coverStyle`) every cover-plate surface uses so a
//      color, a gradient, and an image all paint IDENTICALLY wherever a cover shows —
//      CollectionView's sleeve, WorkspaceCard's tile, and anything later. Without a
//      shared helper a gradient preset silently renders as nothing (a gradient string
//      is NOT a url()), which is the exact bug this kills.
//
// Presentational only: no network, no keys, no storage. The picker emits a choice; the
// host owns where it lives; these surfaces paint it.

/** Credit for an image cover (an Unsplash photo). Never shown for color/gradient. */
export interface CoverAttribution {
  /** The photographer's display name — "by <authorName>". */
  authorName: string
  /** Link to the author's profile, when the source provides one. */
  authorUrl?: string
  /** Link back to the photo on its source (e.g. the Unsplash page). */
  sourceUrl?: string
  /** The source's name — e.g. "Unsplash". */
  sourceName?: string
}

/**
 * The typed cover a picker emits. A discriminated union on `kind`:
 *  - `color`    → a flat CSS color (hex/token) painted as background-color.
 *  - `gradient` → a CSS gradient string painted as background-image (NOT url()-wrapped).
 *  - `image`    → a url OR data-URL painted as background-image: url(...), with optional credit.
 * The host stores the whole object; the picker never mutates it.
 */
export type CoverChoice =
  | { kind: 'color'; value: string }
  | { kind: 'gradient'; value: string }
  | { kind: 'image'; value: string; attribution?: CoverAttribution }

/** One image result from a host Unsplash search — rendered by the picker, never fetched by it. */
export interface CoverUnsplashResult {
  /** Stable id for the result (React key + de-dup). */
  id: string
  /** The full image url to use AS the cover when picked. */
  url: string
  /** A smaller url for the result-grid thumbnail. Falls back to `url` when absent. */
  thumbUrl?: string
  /** Photographer credit — carried onto the emitted choice. */
  attribution: CoverAttribution
  /** Alt text for the thumbnail, when the source supplies one. */
  alt?: string
}

/** The minimal shape `coverStyle` needs — every `CoverChoice` satisfies it. */
export interface CoverLike {
  kind: 'color' | 'gradient' | 'image'
  value: string
}

/**
 * The ONE render function every cover-plate surface uses. Returns the inline style that
 * paints a cover of any kind, so color / gradient / image all render identically:
 *   - color    → backgroundColor
 *   - gradient → backgroundImage (the gradient string verbatim — a gradient is already
 *                a <image>, wrapping it in url() would break it)
 *   - image    → backgroundImage: url("…") (a hosted url OR a data-URL)
 * A null/empty cover returns `{}` so the surface falls back to its own empty styling.
 */
export function coverStyle(cover?: CoverLike | null): React.CSSProperties {
  if (!cover || !cover.value) return {}
  switch (cover.kind) {
    case 'color':
      return { backgroundColor: cover.value }
    case 'gradient':
      return { backgroundImage: cover.value }
    case 'image':
      return { backgroundImage: `url("${cover.value}")` }
    default:
      return {}
  }
}

/** True when a cover carries something paintable — the surface is NOT empty. */
export function hasCover(cover?: CoverLike | null): boolean {
  return Boolean(cover && cover.value)
}
