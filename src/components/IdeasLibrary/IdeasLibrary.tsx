// src/components/IdeasLibrary/IdeasLibrary.tsx
//
// Why this isn't a webpage: the Ideas nest used to be a wall of near-blank swatch tiles that
// "didn't tell you anything." It's now a SoundCloud-style SETLIST printed on the warm paper face.
// One CONTINUOUS player sits at the top — a full waveform you scrub, a real transport
// (prev · play/pause · next), and the position readout for whatever idea is rolling — and it plays
// idea-after-idea down the list. Below it the ideas are dense, informative rows (a record's
// tracklist, not a grid of cards): a mono index that becomes a play stud on hover, the idea's name
// and the SOURCE it came from, a printed-ink mini waveform, the BPM/scale/tag chips, and — always —
// the m:ss DURATION as the trailing stat. The now-playing row lights with the one warm accent, the
// same now-playing spine CollectionView uses. Group by tag and the rows fold into labelled
// "folders," each with a "play this tag" stud that starts that cluster as the queue. It carries NO
// audio: it renders the host's reported position and emits play/skip/seek intents, and it reskins
// paper → Ink through tokens. A setlist you pick up and play, not a database of blank cards.
//
// Decisions (headless, resolved against KIT-LEAD.md — no human in the loop):
//  • CONTROLLED + presentational, like CollectionView. The host owns audio + the queue; the kit
//    renders { nowPlayingId, positionSeconds, isPlaying } and emits { onPlay(id), onNext, onPrev,
//    onSeek, onEnded }. No internal play latch anymore (the old uncontrolled preview state is gone) —
//    so it drops into the app's continuous-playback wiring with zero rework.
//  • onPlay(id) is the ONE play/toggle intent (mirrors CollectionView.onPlayTrack): a row stud, the
//    top play/pause (via nowPlayingId), and "play this tag" (via the cluster's first idea) all fire
//    it. The card's callback list has no onPause, so toggling pause routes through onPlay(nowPlayingId)
//    — the host flips isPlaying. Row/transport play buttons RELABEL Play⇄Pause with no aria-pressed
//    (KIT-LEAD §5, one ARIA model).
//  • onEnded is fired PRESENTATIONALLY: when the host has driven the now-playing position to (or past)
//    the idea's duration while isPlaying, the kit emits onEnded ONCE so the host advances. That is the
//    kit's honest half of "host advances" — it only reads the position prop it's given (never computes
//    audio). The queue/auto-advance bookkeeping stays the host's (out of scope for the kit).
//  • DURATION comes from the DATA, never audio: idea.durationSec, else the longest clip in a stack
//    (layered stems play together, so the stack's length is the max, not the sum), else unknown → the
//    row and seeker show the honest em-dash. Lyrics have no duration and no play stud.
//  • REUSE over reinvention: the top player composes <ClipPlayer> (the shared peaks→SVG waveform +
//    scrub + seeker + times, paper register) flanked by prev/next studs — "reuse Seeker + the
//    waveform/transport bits." Rows draw the mini waveform with the shared <Clip>. No new waveform code.
//  • Rows, not tiles: the whole library is one recessed paper WELL of setlist rows (the calm-paper
//    guarantee holds — never the dark --stage). Multi-clip ideas keep their per-clip affordances as
//    indented sub-rows (per-clip play + drag grip). Voice = a row with its waveform; lyric = a row with
//    a text excerpt (no waveform/duration).
//  • Group-by-tag is a dogfooded kit <Toggle>. Clustering runs AFTER the existing search/kind/bpm/
//    label/scale filters; an idea with multiple tags appears under each; untagged ideas collect in a
//    trailing "Untagged" folder so nothing silently disappears.
import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass, DotsSixVertical, Play, Pause, Trash, Lightbulb, CaretRight, SkipBack, SkipForward } from '@phosphor-icons/react'
import { encode } from 'uqr'
import { Clip } from '../Clip'
import { ClipPlayer } from '../ClipPlayer'
import { TextField } from '../TextField'
import { Toggle } from '../Toggle'
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
  /**
   * Playable length in seconds. Drives the row's m:ss stat and the top player's seeker. Any
   * playable kind may carry it (originally voice-only). Absent on a stack ⇒ derived from the
   * longest clip; absent everywhere ⇒ the row/seeker show the em-dash (no fake 0:00).
   */
  durationSec?: number
  text?: string                        // lyric ideas only
  /**
   * Ordered clips for a multi-clip idea. Present + non-empty ⇒ the idea renders as a stack row
   * with per-clip sub-rows. Absent/empty ⇒ the classic single-clip row (back-compat).
   * Group-level metadata (bpm/labels/scale/source) still drives filtering.
   */
  clips?: IdeaClip[]
}

export interface IdeasLibraryProps {
  ideas: Idea[]
  // ── Continuous player (controlled) ──────────────────────────────────────────
  /** The idea currently loaded in the top player + lit in the list. Null ⇒ nothing playing. */
  nowPlayingId?: string | null
  /** Elapsed position of the now-playing idea, seconds. The host drives this at transport rate. */
  positionSeconds?: number
  /** Whether the now-playing idea is actually rolling (vs paused). Defaults true when one is loaded. */
  isPlaying?: boolean
  /**
   * Play / toggle an idea. A row stud, the top play/pause, and "play this tag" all fire it. When the
   * id is already the now-playing idea the host toggles pause/resume; otherwise it starts that idea
   * (and, for a tag stud, the cluster) as the queue.
   */
  onPlay: (id: string) => void
  /** Transport → skip to the next idea in the current (filtered/clustered) list. Absent ⇒ disabled. */
  onNext?: () => void
  /** Transport → skip to the previous idea. Absent ⇒ disabled. */
  onPrev?: () => void
  /** Scrub the now-playing idea to an absolute position (seconds). Absent ⇒ the seeker is display-only. */
  onSeek?: (seconds: number) => void
  /** Fired once when the now-playing idea reaches its end so the host can advance the queue. */
  onEnded?: () => void
  // ── Existing intents (unchanged) ────────────────────────────────────────────
  onDragToProject: (id: string) => void
  onLabel: (id: string, labels: string[]) => void
  onDelete: (id: string) => void
  appSyncUrl: string        // QR code target URL
  onGetApp?: () => void     // optional callback for QR panel CTA
  /** Play a single clip within a multi-clip idea. */
  onPlayClip?: (ideaId: string, clipId: string) => void
  /** Drag a single clip (not the whole idea) into the project. */
  onDragClipToProject?: (ideaId: string, clipId: string) => void
}

function ideaKind(idea: Idea): IdeaKind {
  return idea.kind ?? 'clip'
}

function isGroupIdea(idea: Idea): boolean {
  return ideaKind(idea) === 'clip' && (idea.clips?.length ?? 0) > 0
}

/** A row is playable (gets a play stud + waveform + duration) unless it's a lyric. */
function isPlayable(idea: Idea): boolean {
  return ideaKind(idea) !== 'lyric'
}

/**
 * The idea's playable length in seconds — from the data, never audio. Explicit durationSec wins;
 * a stack falls back to its LONGEST clip (layered stems play together); otherwise it's unknown.
 */
export function ideaDurationSec(idea: Idea): number | undefined {
  if (idea.durationSec != null && Number.isFinite(idea.durationSec)) return idea.durationSec
  const clips = idea.clips ?? []
  const clipDurs = clips
    .map(c => c.durationSec)
    .filter((d): d is number => d != null && Number.isFinite(d))
  if (clipDurs.length > 0) return Math.max(...clipDurs)
  return undefined
}

/** seconds → m:ss. Unknown/negative → an em-dash placeholder (honest "no length"). */
export function formatDuration(sec: number | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '–:––'
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** Peaks for a row's mini waveform — a stack borrows its first clip's peaks when it has none. */
function rowPeaks(idea: Idea): number[] {
  if (idea.peaks && idea.peaks.length > 0) return idea.peaks
  const first = idea.clips?.find(c => (c.peaks?.length ?? 0) > 0)
  return first?.peaks ?? []
}

type BpmBand = 'all' | 'slow' | 'mid' | 'fast'
type KindBand = 'all' | 'clip' | 'voice' | 'lyric'

const UNTAGGED = '__untagged__'

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
    const kind = ideaKind(idea)
    // Kind filter
    if (kindBand !== 'all' && kind !== kindBand) return false
    // BPM filter only applies to clips
    if (kind === 'clip' && !matchesBpm(idea.bpm ?? 0, bpmBand)) return false
    // Label/scale filters only on clips
    if (kind === 'clip' && labelFilter !== null && !(idea.labels ?? []).includes(labelFilter)) return false
    if (kind === 'clip' && scaleFilter !== null && idea.scale !== scaleFilter) return false
    // Search: name + source + scale + labels + text
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

/** A tag "folder": its label + the ideas filed under it (an idea with many tags is in each). */
interface Cluster {
  tag: string
  ideas: Idea[]
}

/**
 * Group the filtered ideas by tag. Every label an idea carries files it under that tag; ideas with
 * no labels collect in a trailing "Untagged" folder so nothing silently drops. Tags sort A→Z,
 * Untagged last.
 */
function clusterByTag(ideas: Idea[]): Cluster[] {
  const byTag = new Map<string, Idea[]>()
  let hasUntagged = false
  for (const idea of ideas) {
    const labels = idea.labels ?? []
    if (labels.length === 0) {
      hasUntagged = true
      byTag.set(UNTAGGED, [...(byTag.get(UNTAGGED) ?? []), idea])
      continue
    }
    for (const label of labels) {
      byTag.set(label, [...(byTag.get(label) ?? []), idea])
    }
  }
  const tags = uniqueSorted([...byTag.keys()].filter(t => t !== UNTAGGED))
  const clusters = tags.map(tag => ({ tag, ideas: byTag.get(tag) ?? [] }))
  if (hasUntagged) clusters.push({ tag: UNTAGGED, ideas: byTag.get(UNTAGGED) ?? [] })
  return clusters
}

// ─── BPM Segmented Control ────────────────────────────────────────────────────

const BPM_BANDS: { value: BpmBand; label: string }[] = [
  { value: 'all',  label: 'All' },
  { value: 'slow', label: '< 80' },
  { value: 'mid',  label: '80–130' },
  { value: 'fast', label: '130+' },
]

function BpmSegmented({ value, onChange }: { value: BpmBand; onChange: (v: BpmBand) => void }) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label="BPM filter">
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

function KindSegmented({ value, onChange }: { value: KindBand; onChange: (v: KindBand) => void }) {
  return (
    <div className={styles.kindSegmented} role="radiogroup" aria-label="Kind filter">
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

/** A tiny three-bar "now playing" pulse that replaces the index on the live row. */
function PlayingBars() {
  return (
    <svg className={styles.playingBars} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect className={styles.bar} x="1"    y="3" width="2.5" height="6"  rx="1" fill="currentColor" />
      <rect className={styles.bar} x="4.75" y="1" width="2.5" height="10" rx="1" fill="currentColor" />
      <rect className={styles.bar} x="8.5"  y="4" width="2.5" height="4"  rx="1" fill="currentColor" />
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
            <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="currentColor" />
          ) : null
        )
      )}
    </svg>
  )
}

function QrEmptyPanel({ kind, appSyncUrl, onGetApp }: { kind: 'voice' | 'lyric'; appSyncUrl: string; onGetApp?: () => void }) {
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
          <button className={styles.qrBtn} onClick={onGetApp}>Get the app</button>
        )}
      </div>
    </div>
  )
}

// ─── NowPlayingPlayer — the continuous player up top ───────────────────────────
//
// The waveform + play/pause + scrub + times is the shared <ClipPlayer> (paper register); we flank it
// with prev/next transport studs and a name/source header. play/pause routes to onPlay(nowPlayingId)
// so a single intent covers "resume", "pause", and "restart this idea".

interface NowPlayingPlayerProps {
  idea: Idea
  positionSeconds: number
  isPlaying: boolean
  onPlay: () => void
  onNext?: () => void
  onPrev?: () => void
  onSeek?: (seconds: number) => void
}

function NowPlayingPlayer({ idea, positionSeconds, isPlaying, onPlay, onNext, onPrev, onSeek }: NowPlayingPlayerProps) {
  return (
    <div className={styles.player} data-testid="now-playing-player" data-playing={isPlaying || undefined}>
      <div className={styles.playerHead}>
        <span className={styles.playerTag} aria-hidden="true">Now playing</span>
        <span className={styles.playerName}>{idea.name}</span>
        {idea.source && <span className={styles.playerSource}>{idea.source}</span>}
      </div>
      <div className={styles.playerTransport}>
        <button
          type="button"
          className={styles.skip}
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Previous idea"
          data-testid="transport-prev"
        >
          <SkipBack weight="fill" aria-hidden="true" />
        </button>

        <ClipPlayer
          peaks={rowPeaks(idea)}
          positionSeconds={positionSeconds}
          durationSeconds={ideaDurationSec(idea)}
          isPlaying={isPlaying}
          label={idea.name}
          onPlayPause={onPlay}
          onSeek={onSeek}
          idPrefix="ideas-nowplaying"
        />

        <button
          type="button"
          className={styles.skip}
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next idea"
          data-testid="transport-next"
        >
          <SkipForward weight="fill" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ─── Row chrome shared by every kind ───────────────────────────────────────────

function DragGrip({ label, onDragStart, onDragEnd, testid = 'drag-handle' }: {
  label: string
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  testid?: string
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Keyboard alternative to dragging: fire directly, then clear the transient drag state
      // (no real dragend arrives for the keyboard path).
      const synthetic = { dataTransfer: { setData: () => {}, effectAllowed: 'copy' } } as unknown as React.DragEvent
      onDragStart(synthetic)
      onDragEnd()
    }
  }
  return (
    <div
      className={styles.grip}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={label}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid={testid}
    >
      <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
    </div>
  )
}

/** The number→play cue: mono index at rest, a play/pause stud on hover/focus, bars when live. */
function PlayCue({ index, playable, playing, live, name, onPlay }: {
  index: number
  playable: boolean
  playing: boolean
  live: boolean
  name: string
  onPlay: () => void
}) {
  return (
    <span className={styles.cue}>
      <span className={styles.index} aria-hidden="true">
        {live ? <PlayingBars /> : String(index + 1).padStart(2, '0')}
      </span>
      {playable && (
        <button
          type="button"
          className={styles.playStud}
          data-playing={playing || undefined}
          onClick={onPlay}
          aria-label={playing ? `Pause ${name}` : `Play ${name}`}
          data-testid="play-btn"
        >
          {playing ? <Pause weight="fill" aria-hidden="true" /> : <Play weight="fill" aria-hidden="true" />}
        </button>
      )}
    </span>
  )
}

function MetaChips({ idea }: { idea: Idea }) {
  const labels = idea.labels ?? []
  return (
    <div className={styles.chips}>
      {isGroupIdea(idea) && (
        <span className={styles.stackChip} aria-label={`${idea.clips?.length ?? 0} clips`}>
          {idea.clips?.length ?? 0} clips
        </span>
      )}
      {idea.bpm !== undefined && (
        <span className={styles.bpmBadge} aria-label={`${idea.bpm} BPM`}>
          {idea.bpm}<span className={styles.bpmUnit}> BPM</span>
        </span>
      )}
      {idea.scale !== undefined && <span className={styles.scaleBadge}>{idea.scale}</span>}
      {idea.origin === 'app' && (
        <span className={styles.appTag} data-testid="app-tag">
          <PhoneGlyph size={10} />From app
        </span>
      )}
      {labels.map(l => (
        <span key={l} className={styles.labelChip}>{l}</span>
      ))}
    </div>
  )
}

// ─── TrackRow — one setlist row (clip / voice / stack / lyric) ──────────────────

interface TrackRowProps {
  idea: Idea
  index: number
  live: boolean          // now-playing idea
  isPlaying: boolean     // and actually rolling (vs paused)
  onPlay: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDelete: () => void
  onPlayClip: (clipId: string) => void
  onDragClipStart: (e: React.DragEvent, clipId: string) => void
  onDragClipEnd: () => void
  liveClipId: string | null   // a clip within this stack is the now-playing target
}

function TrackRow({
  idea, index, live, isPlaying, onPlay, onDragStart, onDragEnd, onDelete,
  onPlayClip, onDragClipStart, onDragClipEnd, liveClipId,
}: TrackRowProps) {
  const kind     = ideaKind(idea)
  const playable = isPlayable(idea)
  const group    = isGroupIdea(idea)
  const rowLive  = live && liveClipId == null
  const duration = playable ? formatDuration(ideaDurationSec(idea)) : ''

  return (
    <li
      className={styles.row}
      data-row
      data-kind={kind}
      data-group={group || undefined}
      data-now-playing={rowLive || undefined}
      data-testid="idea-row"
    >
      <div className={styles.rowMain}>
        <DragGrip label={`Drag ${idea.name} to project`} onDragStart={onDragStart} onDragEnd={onDragEnd} />

        <PlayCue
          index={index}
          playable={playable}
          playing={rowLive && isPlaying}
          live={rowLive && isPlaying}
          name={idea.name}
          onPlay={onPlay}
        />

        <div className={styles.rowText}>
          <span className={styles.rowTitle}>
            {kind === 'lyric' && (
              <span className={styles.lyricGlyph} aria-hidden="true"><LyricGlyph size={12} /></span>
            )}
            <span className={styles.name}>{idea.name}</span>
          </span>
          {idea.source && <span className={styles.source}>{idea.source}</span>}
          <MetaChips idea={idea} />
        </div>

        {/* The printed-ink mini waveform (playable) or the lyric excerpt (lyric). */}
        {kind === 'lyric' ? (
          idea.text ? <p className={styles.lyricText}>{idea.text}</p> : <span className={styles.wavePlaceholder} />
        ) : (
          <div className={styles.rowWave} aria-hidden="true">
            <Clip peaks={rowPeaks(idea)} color="var(--accent)" />
          </div>
        )}

        <span className={styles.duration} data-testid="row-duration">
          {playable ? duration : '—'}
        </span>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onDelete}
          aria-label={`Delete ${idea.name}`}
          data-testid="delete-btn"
        >
          <Trash size={12} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {/* Multi-clip stacks keep their per-clip affordances as indented sub-rows. */}
      {group && (
        <ul className={styles.clipSubList} aria-label={`Clips in ${idea.name}`}>
          {(idea.clips ?? []).map(clip => {
            const clipLive = live && liveClipId === clip.id
            return (
              <li
                key={clip.id}
                className={styles.clipSubRow}
                data-now-playing={clipLive || undefined}
                data-testid="clip-sub-row"
              >
                <DragGrip
                  label={`Drag ${clip.name} to project`}
                  onDragStart={e => onDragClipStart(e, clip.id)}
                  onDragEnd={onDragClipEnd}
                  testid="clip-drag-handle"
                />
                <button
                  type="button"
                  className={styles.clipPlayStud}
                  data-playing={(clipLive && isPlaying) || undefined}
                  onClick={() => onPlayClip(clip.id)}
                  aria-label={clipLive && isPlaying ? `Pause ${clip.name}` : `Play ${clip.name}`}
                  data-testid="clip-play-btn"
                >
                  {clipLive && isPlaying
                    ? <Pause size={11} weight="fill" aria-hidden="true" />
                    : <Play size={11} weight="fill" aria-hidden="true" />}
                </button>
                <span className={styles.clipName}>{clip.name}</span>
                <div className={styles.clipWave} aria-hidden="true">
                  <Clip peaks={clip.peaks ?? []} color="var(--accent)" />
                </div>
                <span className={styles.clipDuration}>{formatDuration(clip.durationSec)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

// ─── ClusterHeader — a tag "folder" header with a play-this-tag stud ────────────

function ClusterHeader({ tag, count, onPlayTag, canPlay }: {
  tag: string
  count: number
  onPlayTag: () => void
  canPlay: boolean
}) {
  const label = tag === UNTAGGED ? 'Untagged' : tag
  return (
    <div className={styles.clusterHead} data-testid="cluster-head">
      <CaretRight size={12} weight="bold" aria-hidden="true" className={styles.clusterCaret} />
      <span className={styles.clusterName}>{label}</span>
      <span className={styles.clusterCount}>{count}</span>
      {canPlay && (
        <button
          type="button"
          className={styles.clusterPlay}
          onClick={onPlayTag}
          aria-label={`Play ${label}`}
          data-testid="cluster-play"
        >
          <Play size={11} weight="fill" aria-hidden="true" />
          <span>Play tag</span>
        </button>
      )}
    </div>
  )
}

// ─── IdeasLibrary ─────────────────────────────────────────────────────────────

export function IdeasLibrary({
  ideas,
  nowPlayingId = null,
  positionSeconds = 0,
  isPlaying,
  onPlay,
  onNext,
  onPrev,
  onSeek,
  onEnded,
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
  const [groupByTag,  setGroupByTag]  = useState(false)
  // A now-playing target may be a whole idea OR one clip inside a stack. We derive the clip target
  // from the id: if nowPlayingId matches a clip id within a stack, that clip is lit.
  const rolling = isPlaying ?? (nowPlayingId != null)

  const showClipFilters = kindBand === 'all' || kindBand === 'clip'
  const clipIdeas = ideas.filter(i => ideaKind(i) === 'clip')
  const allLabels = uniqueSorted(clipIdeas.flatMap(i => i.labels ?? []))
  const allScales = uniqueSorted(clipIdeas.map(i => i.scale).filter((s): s is string => s !== undefined))
  const filtered  = filterIdeas(ideas, search, kindBand, bpmBand, labelFilter, scaleFilter)
  const hasActiveFilters = bpmBand !== 'all' || labelFilter !== null || scaleFilter !== null

  // Resolve what's playing from the FULL list (a playing idea may be filtered out of the view).
  const nowPlaying     = nowPlayingId != null ? ideas.find(i => i.id === nowPlayingId) ?? null : null
  const nowPlayingClip = resolveClipTarget(ideas, nowPlayingId)

  // ── Presentational end-of-track → onEnded (host advances) ─────────────────────
  // We only read the position prop the host gives us; we never compute audio. Fire once when the
  // now-playing idea's position reaches its duration while rolling; re-arm when it moves off the end.
  const endedFiredRef = useRef<string | null>(null)
  useEffect(() => {
    const dur = nowPlaying ? ideaDurationSec(nowPlaying) : undefined
    const atEnd = rolling && nowPlayingId != null && dur != null && positionSeconds >= dur
    if (atEnd && endedFiredRef.current !== nowPlayingId) {
      endedFiredRef.current = nowPlayingId
      onEnded?.()
    } else if (!atEnd) {
      endedFiredRef.current = null
    }
  }, [nowPlaying, nowPlayingId, positionSeconds, rolling, onEnded])

  function handleDragStart(e: React.DragEvent, id: string) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/jackdaw-idea', id)
      e.dataTransfer.effectAllowed = 'copy'
    }
    onDragToProject(id)
  }

  function handleDragClipStart(e: React.DragEvent, ideaId: string, clipId: string) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/jackdaw-idea', ideaId)
      e.dataTransfer.setData('application/jackdaw-idea-clip', clipId)
      e.dataTransfer.effectAllowed = 'copy'
    }
    onDragClipToProject?.(ideaId, clipId)
  }

  function handleClearFilters() {
    setBpmBand('all')
    setLabelFilter(null)
    setScaleFilter(null)
  }

  const clusters = groupByTag ? clusterByTag(filtered) : null

  function renderRow(idea: Idea, index: number) {
    return (
      <TrackRow
        key={idea.id}
        idea={idea}
        index={index}
        live={nowPlayingId != null && (idea.id === nowPlayingId || nowPlayingClip?.ideaId === idea.id)}
        isPlaying={rolling}
        liveClipId={nowPlayingClip?.ideaId === idea.id ? nowPlayingClip.clipId : null}
        onPlay={() => onPlay(idea.id)}
        onDragStart={e => handleDragStart(e, idea.id)}
        onDragEnd={() => {}}
        onDelete={() => onDelete(idea.id)}
        onPlayClip={clipId => (onPlayClip ? onPlayClip(idea.id, clipId) : onPlay(idea.id))}
        onDragClipStart={(e, clipId) => handleDragClipStart(e, idea.id, clipId)}
        onDragClipEnd={() => {}}
      />
    )
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
              tone="surface"
              aria-label="Search ideas"
              leading={<MagnifyingGlass size={12} aria-hidden="true" />}
            />
          </div>
        </div>

        <div className={styles.kindRow}>
          <KindSegmented value={kindBand} onChange={setKindBand} />
          <Toggle
            checked={groupByTag}
            onChange={setGroupByTag}
            size="sm"
            label="Group by tag"
          />
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
                    onClick={() => setLabelFilter(labelFilter === l ? null : l)}
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
                    onClick={() => setScaleFilter(scaleFilter === s ? null : s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <button className={styles.clearBtn} onClick={handleClearFilters} aria-label="Clear all filters">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── The continuous player — sits above the setlist ───────────────────── */}
      {nowPlaying && (
        <NowPlayingPlayer
          idea={nowPlaying}
          positionSeconds={positionSeconds}
          isPlaying={rolling}
          onPlay={() => onPlay(nowPlaying.id)}
          onNext={onNext}
          onPrev={onPrev}
          onSeek={onSeek}
        />
      )}

      {/* ── The setlist ──────────────────────────────────────────────────────── */}
      <div className={styles.list} data-testid="ideas-list">
        {ideas.length === 0 && (
          <div className={styles.empty} data-testid="empty-initial">
            <Lightbulb className={styles.emptyIcon} size={28} weight="thin" aria-hidden="true" />
            <span className={styles.emptyTitle}>No ideas yet</span>
            <span className={styles.emptyHint}>Save a riff to start your library.</span>
          </div>
        )}

        {ideas.length > 0 && filtered.length === 0 && (
          (kindBand === 'voice' || kindBand === 'lyric') && !search
            ? <QrEmptyPanel kind={kindBand} appSyncUrl={appSyncUrl} onGetApp={onGetApp} />
            : (
              <div className={styles.empty} data-testid="empty-search">
                <span className={styles.emptyTitle}>No matches</span>
                <span className={styles.emptyHint}>Try a different search or filter.</span>
              </div>
            )
        )}

        {filtered.length > 0 && (
          clusters
            ? clusters.map(cluster => (
                <section key={cluster.tag} className={styles.cluster} data-testid="cluster">
                  <ClusterHeader
                    tag={cluster.tag}
                    count={cluster.ideas.length}
                    canPlay={cluster.ideas.some(isPlayable)}
                    onPlayTag={() => {
                      const first = cluster.ideas.find(isPlayable)
                      if (first) onPlay(first.id)
                    }}
                  />
                  <ol className={styles.rows} aria-label={cluster.tag === UNTAGGED ? 'Untagged' : cluster.tag}>
                    {cluster.ideas.map((idea, i) => renderRow(idea, i))}
                  </ol>
                </section>
              ))
            : (
              <ol className={styles.rows} aria-label="Ideas">
                {filtered.map((idea, i) => renderRow(idea, i))}
              </ol>
            )
        )}
      </div>
    </section>
  )
}

/** Find whether the now-playing id points at a clip inside a stack; if so, which idea+clip. */
function resolveClipTarget(ideas: Idea[], nowPlayingId: string | null): { ideaId: string; clipId: string } | null {
  if (nowPlayingId == null) return null
  for (const idea of ideas) {
    const clip = idea.clips?.find(c => c.id === nowPlayingId)
    if (clip) return { ideaId: idea.id, clipId: clip.id }
  }
  return null
}
