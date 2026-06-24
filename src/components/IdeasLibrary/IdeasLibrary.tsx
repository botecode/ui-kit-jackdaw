// src/components/IdeasLibrary/IdeasLibrary.tsx
//
// Why this isn't a webpage: ideas live in a recessed --stage trough, each card a warm --surface
// tile that lights with a green LED bloom (incandescent timing) when it previews — not a hover
// highlight. A multi-clip idea reads as a little clip RACK: a recessed groove holding tactile
// clip tiles, each with its own grip and its own LED-lit play. Drag is a physical grip, not a
// "drag me" affordance; "Play all" is a recessed pill that lights, not a CTA button. The whole
// thing reskins through every theme via tokens — it's an instrument shelf, not a media list.
import { useState } from 'react'
import { MagnifyingGlass, DotsSixVertical, Play, Stop, Trash, Lightbulb } from '@phosphor-icons/react'
import { encode } from 'uqr'
import { Clip } from '../Clip'
import { TextField } from '../TextField'
import { BrandMark } from '../BrandMark'
import styles from './IdeasLibrary.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type IdeaKind   = 'clip' | 'voice' | 'lyric'
export type IdeaOrigin = 'project' | 'app'

/** One clip inside a multi-clip idea (e.g. a stem stack saved together). */
export interface IdeaClip {
  id: string
  name: string
  /** Normalised amplitude values [0, 1] for the chip's waveform preview */
  peaks?: number[]
  durationSec?: number
}

export interface Idea {
  id: string
  name: string
  // Existing clip-only fields — now optional (clips keep them, voice/lyric don't)
  bpm?: number
  /** "Song name / Track name" — which project/track it came from */
  source?: string
  labels?: string[]
  /** Musical key + mode, e.g. "C minor" */
  scale?: string
  /** Normalised amplitude values [0, 1] for the waveform preview */
  peaks?: number[]
  // New fields
  kind?: IdeaKind    // defaults to 'clip' when absent
  origin?: IdeaOrigin // defaults to 'project' when absent
  durationSec?: number                 // voice recordings only
  text?: string                        // lyric ideas only
  /**
   * Ordered clips for a multi-clip idea. Present + non-empty ⇒ the idea renders as a group card
   * ("Play all" + per-clip chips). Absent/empty ⇒ the classic single-clip card (back-compat).
   * Group-level metadata (bpm/labels/scale/source) still drives filtering.
   */
  clips?: IdeaClip[]
}

export interface IdeasLibraryProps {
  ideas: Idea[]
  onPlay: (id: string) => void
  onDragToProject: (id: string) => void
  onLabel: (id: string, labels: string[]) => void
  onDelete: (id: string) => void
  appSyncUrl: string        // QR code target URL
  onGetApp?: () => void     // optional callback for QR panel CTA
  // Multi-clip ideas — fired only when an idea carries `clips`. The kit just signals the intent;
  // sequential-vs-layered playback and timeline placement are the consumer's call.
  /** Play a single clip within a multi-clip idea. */
  onPlayClip?: (ideaId: string, clipId: string) => void
  /** Drag a single clip (not the whole idea) into the project. */
  onDragClipToProject?: (ideaId: string, clipId: string) => void
}

/** What is currently previewing: a whole idea (clipId null) or one clip within it. */
type PlayTarget = { ideaId: string; clipId: string | null }

function isTarget(t: PlayTarget | null, ideaId: string, clipId: string | null): boolean {
  return t !== null && t.ideaId === ideaId && t.clipId === clipId
}

function isGroupIdea(idea: Idea): boolean {
  return (idea.kind ?? 'clip') === 'clip' && (idea.clips?.length ?? 0) > 0
}

type BpmBand = 'all' | 'slow' | 'mid' | 'fast'
type KindBand = 'all' | 'clip' | 'voice' | 'lyric'

// ─── Filtering helpers ────────────────────────────────────────────────────────

function matchesBpm(bpm: number, band: BpmBand): boolean {
  if (band === 'slow') return bpm < 80
  if (band === 'mid')  return bpm >= 80 && bpm < 130
  if (band === 'fast') return bpm >= 130
  return true
}

function filterIdeas(
  ideas: Idea[],
  search: string,
  kindBand: KindBand,
  bpmBand: BpmBand,
  labelFilter: string | null,
  scaleFilter: string | null,
): Idea[] {
  const q = search.toLowerCase().trim()
  return ideas.filter(idea => {
    const kind = idea.kind ?? 'clip'
    // Kind filter
    if (kindBand !== 'all' && kind !== kindBand) return false
    // BPM filter only applies to clips
    if (kind === 'clip' && !matchesBpm(idea.bpm ?? 0, bpmBand)) return false
    // Label/scale filters only on clips
    if (kind === 'clip' && labelFilter !== null && !(idea.labels ?? []).includes(labelFilter)) return false
    if (kind === 'clip' && scaleFilter !== null && idea.scale !== scaleFilter) return false
    // Search: check name + source? + scale? + labels? + text?
    if (q) {
      const hit =
        idea.name.toLowerCase().includes(q) ||
        (idea.source?.toLowerCase().includes(q) ?? false) ||
        (idea.scale?.toLowerCase().includes(q) ?? false) ||
        (idea.labels?.some(l => l.toLowerCase().includes(q)) ?? false) ||
        (idea.text?.toLowerCase().includes(q) ?? false)
      if (!hit) return false
    }
    return true
  })
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort()
}

// ─── BPM Segmented Control ────────────────────────────────────────────────────

const BPM_BANDS: { value: BpmBand; label: string }[] = [
  { value: 'all',  label: 'All' },
  { value: 'slow', label: '< 80' },
  { value: 'mid',  label: '80–130' },
  { value: 'fast', label: '130+' },
]

interface BpmSegmentedProps {
  value: BpmBand
  onChange: (v: BpmBand) => void
}

function BpmSegmented({ value, onChange }: BpmSegmentedProps) {
  return (
    <div
      className={styles.segmented}
      role="radiogroup"
      aria-label="BPM filter"
    >
      {BPM_BANDS.map(band => (
        <button
          key={band.value}
          role="radio"
          aria-checked={value === band.value}
          className={styles.segmentedBtn}
          data-active={value === band.value || undefined}
          onClick={() => onChange(band.value)}
        >
          {band.label}
        </button>
      ))}
    </div>
  )
}

// ─── Kind Segmented Control ───────────────────────────────────────────────────

const KIND_BANDS: { value: KindBand; label: string }[] = [
  { value: 'all',   label: 'All' },
  { value: 'clip',  label: 'Clips' },
  { value: 'voice', label: 'Voice recordings' },
  { value: 'lyric', label: 'Lyrics' },
]

interface KindSegmentedProps {
  value: KindBand
  onChange: (v: KindBand) => void
}

function KindSegmented({ value, onChange }: KindSegmentedProps) {
  return (
    <div
      className={styles.kindSegmented}
      role="radiogroup"
      aria-label="Kind filter"
    >
      {KIND_BANDS.map(band => (
        <button
          key={band.value}
          role="radio"
          aria-checked={value === band.value}
          className={styles.kindSegmentedBtn}
          data-active={value === band.value || undefined}
          onClick={() => onChange(band.value)}
        >
          {band.label}
        </button>
      ))}
    </div>
  )
}

// ─── Custom SVG Glyphs ────────────────────────────────────────────────────────

function PhoneGlyph({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 14" fill="none" aria-hidden="true">
      <rect x="1" y="0.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="3.5" y="11" width="3" height="1" rx="0.5" fill="currentColor"/>
    </svg>
  )
}

function LyricGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path d="M1 1C1 1 1 4 4 4L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 1C7 1 7 4 10 4L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

// ─── QR Code SVG ─────────────────────────────────────────────────────────────

function QrCodeSvg({ url, size = 120 }: { url: string; size?: number }) {
  const qr = encode(url, { border: 1, ecc: 'M' })
  const modules  = qr.size
  const cellSize = size / modules
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={styles.qrSvg}
      aria-label="Scan QR code to get the app"
      role="img"
    >
      {qr.data.flatMap((row, r) =>
        row.map((dark, c) =>
          dark ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="currentColor"
            />
          ) : null
        )
      )}
    </svg>
  )
}

// ─── QR Empty Panel ───────────────────────────────────────────────────────────

interface QrEmptyPanelProps {
  kind: 'voice' | 'lyric'
  appSyncUrl: string
  onGetApp?: () => void
}

function QrEmptyPanel({ kind, appSyncUrl, onGetApp }: QrEmptyPanelProps) {
  const copy = kind === 'voice'
    ? { title: 'No voice recordings yet', hint: 'Capture voice memos on the go — scan to get the Jackdaw app' }
    : { title: 'No captured lyrics yet', hint: 'Capture lyrics on the go — scan to get the Jackdaw app' }
  return (
    <div className={styles.qrPanel} data-testid={`qr-empty-${kind}`}>
      <BrandMark variant="mark" size={28} />
      <div className={styles.qrCode}>
        <QrCodeSvg url={appSyncUrl} size={96} />
      </div>
      <div className={styles.qrMeta}>
        <span className={styles.qrTitle}>{copy.title}</span>
        <span className={styles.qrHint}>{copy.hint}</span>
        {onGetApp && (
          <button className={styles.qrBtn} onClick={onGetApp}>
            Get the app
          </button>
        )}
      </div>
    </div>
  )
}

// ─── IdeaCard ─────────────────────────────────────────────────────────────────

interface IdeaCardProps {
  idea: Idea
  playing: boolean
  dragging: boolean
  onPlay: () => void
  onStop: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDelete: () => void
}

function IdeaCard({
  idea,
  playing,
  dragging,
  onPlay,
  onStop,
  onDragStart,
  onDragEnd,
  onDelete,
}: IdeaCardProps) {
  function handleDragKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Keyboard alternative to dragging: fire the callback directly
      const syntheticDrag = { dataTransfer: { setData: () => {}, effectAllowed: 'copy' } } as unknown as React.DragEvent
      onDragStart(syntheticDrag)
    }
  }

  return (
    <article
      className={styles.card}
      data-playing={playing || undefined}
      data-dragging={dragging || undefined}
    >
      {/* ── Drag handle ──────────────────────────────────────────────────── */}
      <div
        className={styles.dragHandle}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label={`Drag ${idea.name} to project`}
        role="button"
        tabIndex={0}
        onKeyDown={handleDragKeyDown}
        data-testid="drag-handle"
      >
        <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
      </div>

      {/* ── Waveform + play overlay ──────────────────────────────────────── */}
      <div className={styles.waveformArea}>
        <div className={styles.waveformClip}>
          <Clip peaks={idea.peaks ?? []} color="var(--accent)" />
        </div>
        <button
          className={styles.playBtn}
          onClick={playing ? onStop : onPlay}
          aria-label={playing ? `Stop ${idea.name}` : `Play ${idea.name}`}
          data-playing={playing || undefined}
          data-testid="play-btn"
        >
          {playing
            ? <Stop  size={14} weight="fill" aria-hidden="true" />
            : <Play  size={14} weight="fill" aria-hidden="true" />
          }
        </button>
      </div>

      {/* ── Metadata ──────────────────────────────────────────────────────── */}
      <div className={styles.meta}>
        <span className={styles.name}>{idea.name}</span>

        <div className={styles.badges}>
          {idea.bpm !== undefined && (
            <span className={styles.bpmBadge} aria-label={`${idea.bpm} BPM`}>
              {idea.bpm}<span className={styles.bpmUnit}> BPM</span>
            </span>
          )}
          {idea.scale !== undefined && (
            <span className={styles.scaleBadge}>{idea.scale}</span>
          )}
        </div>

        {idea.source !== undefined && (
          <span className={styles.source}>{idea.source}</span>
        )}

        {(idea.labels ?? []).length > 0 && (
          <div className={styles.labelList} aria-label="Labels">
            {(idea.labels ?? []).map(l => (
              <span key={l} className={styles.labelChip}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete ────────────────────────────────────────────────────────── */}
      <button
        className={styles.deleteBtn}
        onClick={onDelete}
        aria-label={`Delete ${idea.name}`}
        data-testid="delete-btn"
      >
        <Trash size={12} weight="bold" aria-hidden="true" />
      </button>
    </article>
  )
}

// ─── GroupCard (multi-clip idea) ───────────────────────────────────────────────

interface GroupCardProps {
  idea: Idea
  /** Library-wide play target — so the card knows if play-all or one of its clips is rolling. */
  playing: PlayTarget | null
  dragging: PlayTarget | null
  onPlayAll: () => void
  onStop: () => void
  onPlayClip: (clipId: string) => void
  onDragAllStart: (e: React.DragEvent) => void
  onDragAllEnd: () => void
  onDragClipStart: (e: React.DragEvent, clipId: string) => void
  onDragClipEnd: () => void
  onDelete: () => void
}

function GroupCard({
  idea,
  playing,
  dragging,
  onPlayAll,
  onStop,
  onPlayClip,
  onDragAllStart,
  onDragAllEnd,
  onDragClipStart,
  onDragClipEnd,
  onDelete,
}: GroupCardProps) {
  const clips        = idea.clips ?? []
  const playingAll   = isTarget(playing, idea.id, null)
  const draggingAll  = isTarget(dragging, idea.id, null)

  function handleDragKeyDown(e: React.KeyboardEvent<HTMLDivElement>, fire: (e: React.DragEvent) => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Keyboard alternative to dragging: fire the callback directly
      const syntheticDrag = { dataTransfer: { setData: () => {}, effectAllowed: 'copy' } } as unknown as React.DragEvent
      fire(syntheticDrag)
    }
  }

  return (
    <article
      className={styles.groupCard}
      data-playing={playingAll || undefined}
      data-dragging={draggingAll || undefined}
      data-testid="group-card"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.groupHeader}>
        {/* Whole-idea drag handle */}
        <div
          className={styles.dragHandle}
          draggable
          onDragStart={onDragAllStart}
          onDragEnd={onDragAllEnd}
          aria-label={`Drag ${idea.name} to project`}
          role="button"
          tabIndex={0}
          onKeyDown={e => handleDragKeyDown(e, onDragAllStart)}
          data-testid="drag-handle"
        >
          <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
        </div>

        {/* Metadata */}
        <div className={styles.meta}>
          <span className={styles.name}>{idea.name}</span>

          <div className={styles.badges}>
            <span className={styles.groupCount} aria-label={`${clips.length} clips`}>
              {clips.length} clips
            </span>
            {idea.bpm !== undefined && (
              <span className={styles.bpmBadge} aria-label={`${idea.bpm} BPM`}>
                {idea.bpm}<span className={styles.bpmUnit}> BPM</span>
              </span>
            )}
            {idea.scale !== undefined && (
              <span className={styles.scaleBadge}>{idea.scale}</span>
            )}
          </div>

          {idea.source !== undefined && (
            <span className={styles.source}>{idea.source}</span>
          )}

          {(idea.labels ?? []).length > 0 && (
            <div className={styles.labelList} aria-label="Labels">
              {(idea.labels ?? []).map(l => (
                <span key={l} className={styles.labelChip}>{l}</span>
              ))}
            </div>
          )}
        </div>

        {/* Play all */}
        <button
          className={styles.playAllBtn}
          onClick={playingAll ? onStop : onPlayAll}
          aria-label={playingAll ? `Stop all clips in ${idea.name}` : `Play all clips in ${idea.name}`}
          data-playing={playingAll || undefined}
          data-testid="play-all-btn"
        >
          {playingAll
            ? <Stop size={12} weight="fill" aria-hidden="true" />
            : <Play size={12} weight="fill" aria-hidden="true" />
          }
          <span>{playingAll ? 'Stop all' : 'Play all'}</span>
        </button>

        {/* Delete */}
        <button
          className={styles.deleteBtn}
          onClick={onDelete}
          aria-label={`Delete ${idea.name}`}
          data-testid="delete-btn"
        >
          <Trash size={12} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {/* ── Clip rack ──────────────────────────────────────────────────────── */}
      <div className={styles.clipStrip} role="list" aria-label={`Clips in ${idea.name}`}>
        {clips.map(clip => {
          const clipPlaying = isTarget(playing, idea.id, clip.id)
          return (
            <div
              key={clip.id}
              className={styles.clipChip}
              role="listitem"
              data-playing={clipPlaying || undefined}
              data-dragging={isTarget(dragging, idea.id, clip.id) || undefined}
              data-testid="clip-chip"
            >
              <div className={styles.clipChipWave}>
                <Clip peaks={clip.peaks ?? []} color="var(--accent)" />
              </div>
              <div className={styles.clipChipRow}>
                <div
                  className={styles.clipGrip}
                  draggable
                  onDragStart={e => onDragClipStart(e, clip.id)}
                  onDragEnd={onDragClipEnd}
                  aria-label={`Drag ${clip.name} to project`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => handleDragKeyDown(e, ev => onDragClipStart(ev, clip.id))}
                  data-testid="clip-drag-handle"
                >
                  <DotsSixVertical size={12} weight="bold" aria-hidden="true" />
                </div>
                <span className={styles.clipName}>{clip.name}</span>
                <button
                  className={styles.clipPlayBtn}
                  onClick={clipPlaying ? onStop : () => onPlayClip(clip.id)}
                  aria-label={clipPlaying ? `Stop ${clip.name}` : `Play ${clip.name}`}
                  data-playing={clipPlaying || undefined}
                  data-testid="clip-play-btn"
                >
                  {clipPlaying
                    ? <Stop size={11} weight="fill" aria-hidden="true" />
                    : <Play size={11} weight="fill" aria-hidden="true" />
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

// ─── VoiceCard ────────────────────────────────────────────────────────────────

interface VoiceCardProps {
  idea: Idea
  playing: boolean
  dragging: boolean
  onPlay: () => void
  onStop: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDelete: () => void
}

function VoiceCard({
  idea,
  playing,
  dragging,
  onPlay,
  onStop,
  onDragStart,
  onDragEnd,
  onDelete,
}: VoiceCardProps) {
  function formatDuration(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleDragKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const syntheticDrag = { dataTransfer: { setData: () => {}, effectAllowed: 'copy' } } as unknown as React.DragEvent
      onDragStart(syntheticDrag)
    }
  }

  return (
    <article
      className={styles.card}
      data-playing={playing || undefined}
      data-dragging={dragging || undefined}
    >
      {/* ── Drag handle ──────────────────────────────────────────────────── */}
      <div
        className={styles.dragHandle}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label={`Drag ${idea.name} to project`}
        role="button"
        tabIndex={0}
        onKeyDown={handleDragKeyDown}
        data-testid="drag-handle"
      >
        <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
      </div>

      {/* ── Waveform + play overlay ──────────────────────────────────────── */}
      <div className={styles.waveformArea}>
        <div className={styles.waveformClip}>
          <Clip peaks={idea.peaks ?? []} color="var(--accent)" />
        </div>
        <button
          className={styles.playBtn}
          onClick={playing ? onStop : onPlay}
          aria-label={playing ? `Stop ${idea.name}` : `Play ${idea.name}`}
          data-playing={playing || undefined}
          data-testid="play-btn"
        >
          {playing
            ? <Stop  size={14} weight="fill" aria-hidden="true" />
            : <Play  size={14} weight="fill" aria-hidden="true" />
          }
        </button>
      </div>

      {/* ── Metadata ──────────────────────────────────────────────────────── */}
      <div className={styles.meta}>
        <span className={styles.name}>{idea.name}</span>

        <div className={styles.badges}>
          {idea.durationSec !== undefined && (
            <span className={styles.duration}>
              {formatDuration(idea.durationSec)}
            </span>
          )}
          {idea.origin === 'app' && (
            <span className={styles.appTag} data-testid="app-tag">
              <PhoneGlyph size={10} />
              From app
            </span>
          )}
        </div>
      </div>

      {/* ── Delete ────────────────────────────────────────────────────────── */}
      <button
        className={styles.deleteBtn}
        onClick={onDelete}
        aria-label={`Delete ${idea.name}`}
        data-testid="delete-btn"
      >
        <Trash size={12} weight="bold" aria-hidden="true" />
      </button>
    </article>
  )
}

// ─── LyricCard ────────────────────────────────────────────────────────────────

interface LyricCardProps {
  idea: Idea
  dragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDelete: () => void
}

function LyricCard({
  idea,
  dragging,
  onDragStart,
  onDragEnd,
  onDelete,
}: LyricCardProps) {
  function handleDragKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const syntheticDrag = { dataTransfer: { setData: () => {}, effectAllowed: 'copy' } } as unknown as React.DragEvent
      onDragStart(syntheticDrag)
    }
  }

  return (
    <article
      className={styles.card}
      data-dragging={dragging || undefined}
    >
      {/* ── Drag handle ──────────────────────────────────────────────────── */}
      <div
        className={styles.dragHandle}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label={`Drag ${idea.name} to project`}
        role="button"
        tabIndex={0}
        onKeyDown={handleDragKeyDown}
        data-testid="drag-handle"
      >
        <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
      </div>

      {/* ── Lyric content ─────────────────────────────────────────────────── */}
      <div className={styles.lyricArea}>
        <div className={styles.badges}>
          <span className={styles.lyricGlyph}>
            <LyricGlyph size={12} />
          </span>
          <span className={styles.name}>{idea.name}</span>
          {idea.origin === 'app' && (
            <span className={styles.appTag} data-testid="app-tag">
              <PhoneGlyph size={10} />
              From app
            </span>
          )}
        </div>

        {idea.text && (
          <p className={styles.lyricText}>{idea.text}</p>
        )}
      </div>

      {/* ── Delete ────────────────────────────────────────────────────────── */}
      <button
        className={styles.deleteBtn}
        onClick={onDelete}
        aria-label={`Delete ${idea.name}`}
        data-testid="delete-btn"
      >
        <Trash size={12} weight="bold" aria-hidden="true" />
      </button>
    </article>
  )
}

// ─── IdeasLibrary ─────────────────────────────────────────────────────────────

export function IdeasLibrary({
  ideas,
  onPlay,
  onDragToProject,
  onDelete,
  appSyncUrl,
  onGetApp,
  onPlayClip,
  onDragClipToProject,
}: IdeasLibraryProps) {
  const [search,      setSearch]      = useState('')
  const [kindBand,    setKindBand]    = useState<KindBand>('all')
  const [bpmBand,     setBpmBand]     = useState<BpmBand>('all')
  const [labelFilter, setLabelFilter] = useState<string | null>(null)
  const [scaleFilter, setScaleFilter] = useState<string | null>(null)
  // One preview selection across the whole library — clipId null = the whole idea (play-all).
  const [playing,     setPlaying]     = useState<PlayTarget | null>(null)
  const [dragging,    setDragging]    = useState<PlayTarget | null>(null)

  const showClipFilters = kindBand === 'all' || kindBand === 'clip'
  const clipIdeas = ideas.filter(i => (i.kind ?? 'clip') === 'clip')
  const allLabels = uniqueSorted(clipIdeas.flatMap(i => i.labels ?? []))
  const allScales = uniqueSorted(clipIdeas.map(i => i.scale).filter((s): s is string => s !== undefined))
  const filtered  = filterIdeas(ideas, search, kindBand, bpmBand, labelFilter, scaleFilter)
  const hasActiveFilters = bpmBand !== 'all' || labelFilter !== null || scaleFilter !== null

  function handlePlay(id: string) {
    setPlaying({ ideaId: id, clipId: null })
    onPlay(id)
  }

  function handlePlayClip(ideaId: string, clipId: string) {
    setPlaying({ ideaId, clipId })
    onPlayClip?.(ideaId, clipId)
  }

  function handleStop() {
    setPlaying(null)
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragging({ ideaId: id, clipId: null })
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/jackdaw-idea', id)
      e.dataTransfer.effectAllowed = 'copy'
    }
    onDragToProject(id)
  }

  function handleDragClipStart(e: React.DragEvent, ideaId: string, clipId: string) {
    setDragging({ ideaId, clipId })
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/jackdaw-idea', ideaId)
      e.dataTransfer.setData('application/jackdaw-idea-clip', clipId)
      e.dataTransfer.effectAllowed = 'copy'
    }
    onDragClipToProject?.(ideaId, clipId)
  }

  function handleDragEnd() {
    setDragging(null)
  }

  function handleClearFilters() {
    setBpmBand('all')
    setLabelFilter(null)
    setScaleFilter(null)
  }

  function toggleLabelFilter(label: string) {
    setLabelFilter(prev => (prev === label ? null : label))
  }

  function toggleScaleFilter(scale: string) {
    setScaleFilter(prev => (prev === scale ? null : scale))
  }

  return (
    <section className={styles.root} aria-label="Ideas Library">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Ideas</h2>
          <div className={styles.searchWrap}>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search ideas…"
              type="search"
              size="sm"
              aria-label="Search ideas"
              leading={<MagnifyingGlass size={12} aria-hidden="true" />}
            />
          </div>
        </div>

        {/* ── Kind segmented — above BPM filter ────────────────────────── */}
        <div className={styles.kindRow}>
          <KindSegmented value={kindBand} onChange={setKindBand} />
        </div>

        {showClipFilters && (
          <div className={styles.filterRow}>
            <BpmSegmented value={bpmBand} onChange={setBpmBand} />

            {allLabels.length > 0 && (
              <div className={styles.filterGroup} role="group" aria-label="Label filter">
                {allLabels.map(l => (
                  <button
                    key={l}
                    className={styles.filterChip}
                    data-active={labelFilter === l || undefined}
                    aria-pressed={labelFilter === l}
                    onClick={() => toggleLabelFilter(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}

            {allScales.length > 0 && (
              <div className={styles.filterGroup} role="group" aria-label="Scale filter">
                {allScales.map(s => (
                  <button
                    key={s}
                    className={styles.filterChip}
                    data-active={scaleFilter === s || undefined}
                    aria-pressed={scaleFilter === s}
                    onClick={() => toggleScaleFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <button
                className={styles.clearBtn}
                onClick={handleClearFilters}
                aria-label="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      <div className={styles.list} role="list" data-testid="ideas-list">
        {ideas.length === 0 && (
          <div className={styles.empty} data-testid="empty-initial">
            <Lightbulb
              className={styles.emptyIcon}
              size={28}
              weight="thin"
              aria-hidden="true"
            />
            <span className={styles.emptyTitle}>No ideas yet</span>
            <span className={styles.emptyHint}>Save a riff to start your library.</span>
          </div>
        )}

        {ideas.length > 0 && filtered.length === 0 && (
          (() => {
            // QR empty: kind-specific filter active, no search
            if ((kindBand === 'voice' || kindBand === 'lyric') && !search) {
              return <QrEmptyPanel kind={kindBand} appSyncUrl={appSyncUrl} onGetApp={onGetApp} />
            }
            // No matches: search or clip/all filter
            return (
              <div className={styles.empty} data-testid="empty-search">
                <span className={styles.emptyTitle}>No matches</span>
                <span className={styles.emptyHint}>Try a different search or filter.</span>
              </div>
            )
          })()
        )}

        {filtered.map(idea => (
          <div key={idea.id} role="listitem">
            {(() => {
              const kind = idea.kind ?? 'clip'
              if (isGroupIdea(idea)) return (
                <GroupCard
                  idea={idea}
                  playing={playing}
                  dragging={dragging}
                  onPlayAll={() => handlePlay(idea.id)}
                  onStop={handleStop}
                  onPlayClip={clipId => handlePlayClip(idea.id, clipId)}
                  onDragAllStart={e => handleDragStart(e, idea.id)}
                  onDragAllEnd={handleDragEnd}
                  onDragClipStart={(e, clipId) => handleDragClipStart(e, idea.id, clipId)}
                  onDragClipEnd={handleDragEnd}
                  onDelete={() => onDelete(idea.id)}
                />
              )
              if (kind === 'voice') return (
                <VoiceCard
                  idea={idea}
                  playing={isTarget(playing, idea.id, null)}
                  dragging={isTarget(dragging, idea.id, null)}
                  onPlay={() => handlePlay(idea.id)}
                  onStop={handleStop}
                  onDragStart={e => handleDragStart(e, idea.id)}
                  onDragEnd={handleDragEnd}
                  onDelete={() => onDelete(idea.id)}
                />
              )
              if (kind === 'lyric') return (
                <LyricCard
                  idea={idea}
                  dragging={isTarget(dragging, idea.id, null)}
                  onDragStart={e => handleDragStart(e, idea.id)}
                  onDragEnd={handleDragEnd}
                  onDelete={() => onDelete(idea.id)}
                />
              )
              return (
                <IdeaCard
                  idea={idea}
                  playing={isTarget(playing, idea.id, null)}
                  dragging={isTarget(dragging, idea.id, null)}
                  onPlay={() => handlePlay(idea.id)}
                  onStop={handleStop}
                  onDragStart={e => handleDragStart(e, idea.id)}
                  onDragEnd={handleDragEnd}
                  onDelete={() => onDelete(idea.id)}
                />
              )
            })()}
          </div>
        ))}
      </div>
    </section>
  )
}
