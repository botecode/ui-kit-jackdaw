// src/components/CollectionView/CollectionView.tsx
//
// Why this isn't a webpage: the Album page is a record sleeve, not a CMS page. It reads
// in the order a physical release does — header, then the side, then the liner. A warm
// cover plate (a flat color field or art, never a drop-shadowed "card"), the title set
// in display type, and a mono meta stamp — ALBUM · N · run-time — read like the spine of
// a physical release. Directly under it, the tracklist IS the record: dense bordered rows
// (a setlist, not a grid of cards), each with a physical grip you drag — or arrow-key — to
// resequence, a mono index and run-time, and a recessed play stud that lights green (the
// kit's rolling semantic) when its track is the one playing. The hero, the main action.
// The concept notes sit last, as a footer below a hairline keyline — the liner note in
// the same warm editor as the scrapbook (SongNotesEditor), supporting the side, never
// above it. One accent carries the now-playing spine and the Play-album action; the whole
// sleeve reskins through tokens. A setlist you can pick up, not a database table.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - Ordering is fully CONTROLLED. `tracks` is the source of truth from the host; the
//   component never mutates it — drag and arrow-key both only emit onReorder(from,to) and
//   wait for the host to re-render the new order. (ReferenceList owns markdown; here the
//   host owns the track list, so we stay a pure intent surface — no double source.)
// - "Play album" emits the host intent onPlayAll (the host plays each song's auto-render
//   master in order — there's no audio here). When the host wires only onPlayTrack, we
//   fall back to playing the first track in the current order so the action is never dead.
// - Play uses the GREEN rolling LED (semantic: play ≠ record), the now-playing row + the
//   Play-album action use the warm --accent — one accent, as the card asks.
// - Row play is an action button (relabels "Play <title>"/"Pause <title>", no aria-pressed);
//   the grip is a labelled "Reorder <title> (use arrow keys)" button — one ARIA model each.
// - Width-robust at any container: a host (the DAW collection page) can hand the
//   sleeve the full viewport, so the root caps to an album-column reading width and
//   centres — it stays one coherent sleeve at 400 / 700 / 1600px, never sprawling.
//   The header is flex (not a fixed 3-col grid): the back button is optional, and a
//   grid put the stretchy column on the cover and flung the title to the far edge
//   when back was present. Flex keeps title+meta grouped with the cover, play trailing.
// - The album player gets a position seeker (kit-player-seeker): when a track is
//   playing, a "Now playing" transport strip sits below the header with the shared
//   <Seeker> showing position vs. that track's duration, scrubbable when the host
//   wires onSeek (display-only otherwise). It uses --accent (the now-playing spine
//   color), one seeker shared with MasterPlayer — not a second inline copy. The
//   per-row play studs stay for picking the track; the strip is the position scrub.
import { useEffect, useId, useRef, useState } from 'react'
import { Play, Pause, CaretLeft, DotsSixVertical } from '@phosphor-icons/react'
import { SongNotesEditor } from '../SongNotesEditor'
import { Seeker } from '../Seeker'
import { Badge } from '../Badge'
import styles from './CollectionView.module.css'

// ─── Types ──────────────────────────────────────────────────────────────────────

/** A song in the collection. Matches the app's track shape: stable id, title, length. */
export interface CollectionTrack {
  id: string
  title: string
  /** Run-time of the song's auto-render master, in seconds. */
  durationSeconds: number
}

export interface CollectionViewProps {
  /** Album title — set in display type at the head of the sleeve. */
  title: string
  /** Cover art url. Takes precedence over coverColor when both are set. */
  cover?: string
  /** A flat cover color (a token or CSS color) when there's no art. */
  coverColor?: string
  /** Concept notes (markdown). Source of truth for the editor. */
  notes: string
  onNotesChange: (markdown: string) => void
  /** The tracklist, in play order. Source of truth — the host owns ordering. */
  tracks: CollectionTrack[]
  /** Emitted with the move intent; the host re-renders `tracks` in the new order. */
  onReorder: (fromIndex: number, toIndex: number) => void
  /** Play a single song (its auto-render master). */
  onPlayTrack: (id: string) => void
  /** Play the whole album in the current order. Falls back to onPlayTrack(first). */
  onPlayAll?: () => void
  /** Open a song in Jackdaw Studio. */
  onOpenSong: (id: string) => void
  /** The id of the song currently playing, if any — highlights its row. */
  nowPlayingId?: string | null
  /**
   * Elapsed position of the now-playing track, seconds — feeds the album seeker.
   * Only meaningful with `nowPlayingId` set. The host drives this at transport rate.
   */
  positionSeconds?: number
  /**
   * Whether the now-playing track is actually rolling (vs paused) — lights the
   * seeker's played portion. Defaults to true while there's a now-playing track.
   */
  isPlaying?: boolean
  /**
   * Seek within the now-playing track to an absolute position in seconds.
   * Absent → the album seeker is display-only (shows position, not scrubbable).
   */
  onSeek?: (seconds: number) => void
  /** Back to the collections shelf. The control only renders when provided. */
  onBack?: () => void
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

// ─── Pure helpers (unit-tested) ──────────────────────────────────────────────────

/** Seconds → M:SS (minutes uncapped: 24:18). Clamps negatives to 0:00. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Total run-time of an album, in seconds. */
export function totalDuration(tracks: CollectionTrack[]): number {
  return tracks.reduce((sum, t) => sum + Math.max(0, t.durationSeconds), 0)
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function CollectionView({
  title,
  cover,
  coverColor,
  notes,
  onNotesChange,
  tracks,
  onReorder,
  onPlayTrack,
  onPlayAll,
  onOpenSong,
  nowPlayingId = null,
  positionSeconds = 0,
  isPlaying,
  onSeek,
  onBack,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: CollectionViewProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const listRef = useRef<HTMLOListElement>(null)
  const pendingGripFocus = useRef<number | null>(null)
  const titleId = useId()
  const notesId = useId()

  // After a keyboard reorder the host re-renders with the moved row at a new index.
  // Return focus to the grip at its new position so arrow-key resequencing continues.
  useEffect(() => {
    if (pendingGripFocus.current == null) return
    const i = pendingGripFocus.current
    pendingGripFocus.current = null
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-grip][data-index="${i}"]`)
      ?.focus()
  })

  function move(from: number, to: number) {
    if (to < 0 || to >= tracks.length || from === to) return
    onReorder(from, to)
  }

  function playAlbum() {
    if (!tracks.length) return
    if (onPlayAll) onPlayAll()
    else onPlayTrack(tracks[0].id)
  }

  const total = totalDuration(tracks)
  const metaLabel = `ALBUM · ${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} · ${formatDuration(total)}`

  // The album player's seeker tracks the now-playing song's position. It only
  // surfaces once a track is playing — there's nothing to scrub otherwise.
  const nowPlaying = nowPlayingId != null ? tracks.find(t => t.id === nowPlayingId) ?? null : null

  return (
    <section
      className={className ? `${styles.root} ${className}` : styles.root}
      data-size={size}
      aria-label={ariaLabel ?? `${title} — album`}
    >
      {/* ── Header: cover + title + meta + play ─────────────────────────────── */}
      <header className={styles.header}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack} aria-label="Back to collections">
            <CaretLeft aria-hidden="true" />
          </button>
        )}

        <div
          className={styles.cover}
          data-cover
          data-empty={!cover && !coverColor ? '' : undefined}
          style={
            {
              ...(coverColor ? { ['--cover-color']: coverColor } : null),
              ...(cover ? { backgroundImage: `url("${cover}")` } : null),
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {!cover && <RecordGlyph />}
        </div>

        <div className={styles.headMeta}>
          <h1 className={styles.title} id={titleId}>{title}</h1>
          <Badge variant="label" tone="default" size={size}>
            {metaLabel}
          </Badge>
        </div>

        <button
          type="button"
          className={styles.playAll}
          onClick={playAlbum}
          disabled={!tracks.length}
          aria-label="Play album"
        >
          <Play weight="fill" aria-hidden="true" />
          <span>Play album</span>
        </button>
      </header>

      {/* ── Now-playing transport — the album player's position seeker ───────── */}
      {nowPlaying && (
        <div className={styles.nowPlaying} data-now-playing-bar>
          <span className={styles.nowPlayingLabel}>
            <span className={styles.nowPlayingTag} aria-hidden="true">Now playing</span>
            <span className={styles.nowPlayingTitle}>{nowPlaying.title}</span>
          </span>
          <Seeker
            idPrefix="collection-seek"
            label={`Seek — ${nowPlaying.title}`}
            positionSeconds={positionSeconds}
            durationSeconds={nowPlaying.durationSeconds}
            isPlaying={isPlaying ?? true}
            onSeek={onSeek}
            size={size}
          />
        </div>
      )}

      {/* ── Tracklist — the hero, directly under the header ──────────────────── */}
      {tracks.length === 0 ? (
        <p className={styles.empty}>No tracks yet — add songs to build the album.</p>
      ) : (
        <ol className={styles.list} ref={listRef} aria-label="Tracklist">
          {tracks.map((track, index) => {
            const playing = nowPlayingId === track.id
            return (
              <li
                key={track.id}
                className={styles.row}
                data-row
                data-now-playing={playing ? '' : undefined}
                data-dragging={dragIndex === index || undefined}
                data-over={overIndex === index && dragIndex !== index || undefined}
                draggable
                onDragStart={e => {
                  setDragIndex(index)
                  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnter={() => dragIndex != null && setOverIndex(index)}
                onDragOver={e => e.preventDefault()}
                onDragEnd={() => {
                  setDragIndex(null)
                  setOverIndex(null)
                }}
                onDrop={e => {
                  e.preventDefault()
                  if (dragIndex != null && dragIndex !== index) move(dragIndex, index)
                  setDragIndex(null)
                  setOverIndex(null)
                }}
              >
                <button
                  type="button"
                  className={styles.grip}
                  data-grip
                  data-index={index}
                  aria-label={`Reorder ${track.title} (use arrow keys)`}
                  onKeyDown={e => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      pendingGripFocus.current = index - 1
                      move(index, index - 1)
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      pendingGripFocus.current = index + 1
                      move(index, index + 1)
                    }
                  }}
                >
                  <DotsSixVertical aria-hidden="true" />
                </button>

                <span className={styles.index} aria-hidden="true">
                  {playing ? <PlayingBars /> : String(index + 1).padStart(2, '0')}
                </span>

                <button
                  type="button"
                  className={styles.trackTitle}
                  onClick={() => onOpenSong(track.id)}
                  aria-label={`Open ${track.title}`}
                >
                  {track.title}
                </button>

                <span className={styles.duration}>{formatDuration(track.durationSeconds)}</span>

                <button
                  type="button"
                  className={styles.play}
                  data-playing={playing || undefined}
                  onClick={() => onPlayTrack(track.id)}
                  aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
                >
                  {playing ? <Pause weight="fill" aria-hidden="true" /> : <Play weight="fill" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {/* ── Concept notes — the liner, a footer below the side ───────────────── */}
      <footer className={styles.notes} data-notes>
        <label className={styles.notesLabel} id={notesId}>Notes</label>
        <SongNotesEditor
          value={notes}
          onChange={onNotesChange}
          aria-label="Album notes"
          placeholder="What this record is — the concept, the order, what you're going for…"
        />
      </footer>
    </section>
  )
}

// ─── Bespoke glyphs ──────────────────────────────────────────────────────────────

/** The empty-cover mark: concentric record grooves — a sleeve with no art yet. */
function RecordGlyph() {
  return (
    <svg className={styles.recordGlyph} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

/** A tiny three-bar "now playing" pulse that replaces the index on the live row. */
function PlayingBars() {
  return (
    <svg className={styles.playingBars} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect className={styles.bar} x="1" y="3" width="2.5" height="6" rx="1" fill="currentColor" />
      <rect className={styles.bar} x="4.75" y="1" width="2.5" height="10" rx="1" fill="currentColor" />
      <rect className={styles.bar} x="8.5" y="4" width="2.5" height="4" rx="1" fill="currentColor" />
    </svg>
  )
}
