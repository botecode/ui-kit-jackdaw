// src/components/WorkspaceCard/WorkspaceCard.tsx
//
// Why this isn't a webpage: a Home gallery card here is a physical sleeve in a rack, not a
// CMS tile. It's dead flat — no shadow, no gradient, no floating "card" lift. The cover is a
// solid colour field (or art) that fills a band, the body is warm --surface paper, and the
// whole thing is one keyline you can pick up: hover doesn't levitate it, it darkens the
// hairline border the way light catches a raised edge. A collection (album) reads as more
// than one record without a single extra pixel of chrome — two offset hairline sleeves peek
// out behind the cover, a stack you could thumb through. The corner tag is a real little
// label plate (dogfooded Badge on a solid backing so it stays legible over any cover), and
// the optional preview stud is a recessed play button that only wakes on hover/focus — the
// peek-without-opening gesture. Every surface reskins through tokens, so the same card is
// cream in Chroma and ink-black in Ink with zero new colour.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - DESIGN.md is absent from this checkout, so "the three workspaces" detail couldn't be read.
//   Resolved the kind split from the card brief + CollectionView (the album page this card
//   opens): kind 'song' → tag "SONG"; kind 'collection' → tag "ALBUM · N" (count) + the
//   stacked-sleeve cue. Spoken kind maps collection→"album" to match the tag.
// - Radius: the brief sketches "12px for cards", but the kit's --radius is a per-theme
//   identity token (2px Ink → 10px Bubblegum). Hardcoding 12px would break the reskin and the
//   tokens-only rule, so the card uses var(--radius) like CollectionView (the sleeve it links
//   to). One source of truth for corner softness.
// - Nested-button trap: the card is a button (onOpen), but onPreview is also a button — a
//   button inside a button is invalid HTML. So the root is a div; the open control is a
//   full-bleed button that carries the aria-label, and preview is a SIBLING button overlaid
//   in the cover corner (no stopPropagation games — separate DOM nodes). One ARIA model each:
//   both are action buttons that relabel, no aria-pressed; `selected` is reflected as
//   aria-current on the open button (a gallery selection, not a toggle).
// - size sm/md is the kit's baseline size axis (every sibling has it), not a novel variant —
//   sm gives a denser Home grid. Default md.
import { Play } from '@phosphor-icons/react'
import { Badge } from '../Badge'
import { coverStyle, type CoverChoice } from '../../lib/covers'
import styles from './WorkspaceCard.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────────

/** What the card stands for — a single song workspace or a collection (album) of songs. */
export type WorkspaceKind = 'song' | 'collection'

export interface WorkspaceCardProps {
  /** Song workspace vs. collection (album). Drives the tag + the stacked-sleeve cue. */
  kind: WorkspaceKind
  /** The name shown under the cover and spoken in the label. */
  title: string
  /** Cover art url. Takes precedence over coverColor when both are set. */
  cover?: string
  /** A flat cover colour (a token or CSS colour) when there's no art. */
  coverColor?: string
  /**
   * The typed cover to paint — a color, a CSS gradient, OR an image (url/data-URL),
   * from the shared CoverPicker contract. Wins over `cover`/`coverColor` and renders
   * through the ONE shared `coverStyle` helper so every cover kind paints identically.
   */
  coverValue?: CoverChoice | null
  /** A short meta line, e.g. "Take 7 · today" (song) or "Album · 6 tracks" (collection). */
  subtitle?: string
  /** Track count for a collection — shown in the "ALBUM · N" tag. Ignored for songs. */
  count?: number
  /** Open the workspace (enter the song / the album page). */
  onOpen: () => void
  /** Optional peek-without-opening — reveals a recessed play stud on the cover. */
  onPreview?: () => void
  /** Marks this card as the current selection in the gallery. */
  selected?: boolean
  size?: 'sm' | 'md'
  className?: string
  /** Overrides the default "<title>, <kind>" label on the open control. */
  'aria-label'?: string
}

// ─── Pure helpers (unit-tested) ─────────────────────────────────────────────────────

/** The word spoken for a kind — collection reads as "album" to match the tag. */
export function kindNoun(kind: WorkspaceKind): string {
  return kind === 'collection' ? 'album' : 'song'
}

/** The corner tag text: "SONG", or "ALBUM · N" / "ALBUM" when a count is present/absent. */
export function tagLabel(kind: WorkspaceKind, count?: number): string {
  if (kind === 'song') return 'SONG'
  return count != null && count > 0 ? `ALBUM · ${count}` : 'ALBUM'
}

// ─── Component ──────────────────────────────────────────────────────────────────────

export function WorkspaceCard({
  kind,
  title,
  cover,
  coverColor,
  coverValue,
  subtitle,
  count,
  onOpen,
  onPreview,
  selected = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: WorkspaceCardProps) {
  // Resolve the cover: typed `coverValue` wins, then a legacy image, then a color.
  // One shared helper paints color / gradient / image identically (a gradient is a
  // background-image, not a background-color — the exact bug the helper prevents).
  const resolvedCover: CoverChoice | null =
    coverValue ??
    (cover ? { kind: 'image', value: cover } : coverColor ? { kind: 'color', value: coverColor } : null)
  const label = ariaLabel ?? `${title}, ${kindNoun(kind)}`

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-kind={kind}
      data-size={size}
      data-selected={selected || undefined}
    >
      {/* The open control — a full-bleed button carrying the whole card. */}
      <button
        type="button"
        className={styles.open}
        onClick={onOpen}
        aria-label={label}
        aria-current={selected ? 'true' : undefined}
      >
        <span
          className={styles.cover}
          data-empty={resolvedCover ? undefined : ''}
          style={coverStyle(resolvedCover)}
        >
          {/* Empty-cover mark — flat well + a faint kind glyph, never a broken image. */}
          {!resolvedCover && (kind === 'collection' ? <StackGlyph /> : <WaveGlyph />)}

          {/* Corner tag — dogfooded Badge on a solid plate so it reads over any cover. */}
          <span className={styles.tag}>
            <Badge variant="label" size={size}>{tagLabel(kind, count)}</Badge>
          </span>
        </span>

        <span className={styles.body}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
      </button>

      {/* Preview stud — a sibling button (not nested), wakes on hover/focus. */}
      {onPreview && (
        <button
          type="button"
          className={styles.preview}
          onClick={onPreview}
          aria-label={`Preview ${title}`}
        >
          <Play weight="fill" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// ─── Bespoke glyphs ──────────────────────────────────────────────────────────────────

/** Empty song cover: a quiet sound wave — a take with no art yet. */
function WaveGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 48 24" fill="none" aria-hidden="true">
      {[6, 12, 18, 24, 30, 36, 42].map((x, i) => {
        const h = [8, 16, 10, 22, 12, 18, 7][i]
        return (
          <rect
            key={x}
            x={x - 1.25}
            y={12 - h / 2}
            width="2.5"
            height={h}
            rx="1.25"
            fill="currentColor"
            opacity={0.45}
          />
        )
      })}
    </svg>
  )
}

/** Empty collection cover: stacked sleeves — more than one record. */
function StackGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="9" y="13" width="26" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <rect x="13" y="9" width="26" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
    </svg>
  )
}
