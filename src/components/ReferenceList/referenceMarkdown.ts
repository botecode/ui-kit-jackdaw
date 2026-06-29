// src/components/ReferenceList/referenceMarkdown.ts
//
// References persist as markdown — one item per line — so they round-trip as plain
// text and can be edited as markdown elsewhere (matches the "References (markdown)"
// data model). This module is the lossless bridge between that text and the
// card-forward RefItem[] the list renders.
//
// Line grammar (one reference per non-blank line):
//   ![label](url)   → an image reference
//   [label](url)    → a labelled link / media / file
//   url             → a bare link / media / file (no label)
// Anything that classifies as YouTube/Spotify carries an embedUrl so the card can
// become a real player. Classification is pure + offline — no scraping (the app
// layer enriches link cards via `meta`; absence is a graceful fallback).

// Classification + embed-src generation now live in the shared embed render layer
// (src/lib/embeds.ts) so there is ONE implementation behind every markdown surface
// — Notes, Lyrics, Chords/Tabs, References, Collection notes. ReferenceList keeps
// its own card UI, but the url→kind/embedUrl logic is shared.
import { classifyEmbed, youtubeId, spotifyPath, type EmbedKind } from '../../lib/embeds'

export { youtubeId, spotifyPath }

export type RefKind = EmbedKind

export interface RefItem {
  /** Stable per-position id: `ref-${index}`. References are order-defined in markdown. */
  id: string
  /** 0-based position in the list. */
  index: number
  kind: RefKind
  /** The href / src — exactly as written, so it round-trips. */
  url: string
  /** Display label; empty string when the line was a bare url. */
  label: string
  /** Player embed src for youtube/spotify; undefined for other kinds. */
  embedUrl?: string
  /** A preview image derivable offline (YouTube thumb / the image itself). */
  thumbnail?: string
}

/** Classify a url into a card kind + any offline-derivable embed/thumbnail. */
export function classify(url: string): Pick<RefItem, 'kind' | 'embedUrl' | 'thumbnail'> {
  return classifyEmbed(url)
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/
const LINK_LINE = /^\[([^\]]*)\]\(([^)]+)\)$/

/** Parse one markdown line (already trimmed, non-blank) into a positioned RefItem. */
function parseLine(line: string, index: number): RefItem {
  const id = `ref-${index}`

  const img = line.match(IMAGE_LINE)
  if (img) {
    const url = img[2].trim()
    return { id, index, kind: 'image', url, label: img[1], thumbnail: url }
  }

  const link = line.match(LINK_LINE)
  if (link) {
    const url = link[2].trim()
    return { id, index, url, label: link[1], ...classify(url) }
  }

  // Bare line: the whole thing is the url (label empty).
  return { id, index, url: line, label: '', ...classify(line) }
}

/** Markdown string → ordered RefItem[]. Blank lines are dropped. */
export function parseReferences(markdown: string): RefItem[] {
  return markdown
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(parseLine)
}

/** Serialize one item back to its canonical markdown line. */
export function serializeItem(item: Pick<RefItem, 'kind' | 'url' | 'label'>): string {
  if (item.kind === 'image') return `![${item.label}](${item.url})`
  return item.label ? `[${item.label}](${item.url})` : item.url
}

/** Ordered RefItem[] → canonical markdown string (one line per item). */
export function serializeReferences(items: Array<Pick<RefItem, 'kind' | 'url' | 'label'>>): string {
  return items.map(serializeItem).join('\n')
}

/** Build a fresh, unpositioned item from a pasted/typed url (kind auto-detected). */
export function itemFromUrl(url: string, label = ''): Pick<RefItem, 'kind' | 'url' | 'label'> {
  const trimmed = url.trim()
  return { url: trimmed, label, kind: classify(trimmed).kind }
}
