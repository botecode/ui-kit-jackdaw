// src/components/TapeStrip/TapeStrip.tsx
//
// TapeStrip — the slim, read-only tape that rides on TOP of the studio view.
//
// It is a MAP you read and navigate, never an edit surface. Deliberately NOT the
// kit Arrangement (which bundles TrackHeader + TrackLane with clip drag/trim) — the
// instrument controls live in the cards below (LivingInstrumentCard), so the tape
// carries no track headers, only thin lanes. The single accent is reserved for the
// three things that carry live meaning: the playhead, the punch region, the active
// marker. Everything else stays calm ink over the warm --arrange-bg ground.
//
// The tape is a FIXED lane grid — a constant block of lanes (default 10) whose
// HEIGHT NEVER CHANGES as tracks are added. The first N lanes carry the N tracks
// (a color-pill in the track's colour + that track's clips); the remaining lanes
// sit empty (a neutral pill + an empty strip). Adding a track lights the next
// lane's pill — the tape stays the same height. This is the instrument panel the
// tape rides on, not a list that grows; a constant grid reads like hardware.
//
// Composes the lower-level kit pieces so every layer shares ONE coordinate origin:
//   • TimelineRuler (sm)  — bar reference; its onSeek scrubs the playhead (navigation)
//   • Playhead            — the play line spanning all lanes
//   • TimeSelection       — the punch region (the one interactive overlay)
//   • Clip                — each clip is a compact, NON-interactive picture of audio
//   • a slim marker layer — freeform alignment aids (read-mostly)
//
// A slim left gutter holds each lane's color-pill; the ruler, markers, clips, and
// overlays all start AFTER the gutter, so the one time→x origin is preserved.
//
// Clicking a track-backed lane (or a clip inside it) emits onSelectTrack(trackId) →
// the doorway to the drilldown room. Empty lanes are non-interactive. There is NO
// clip drag, trim, fade, or split anywhere here.

import { useCallback, useRef, type CSSProperties } from 'react'
import { secondsToX as rulerSecToX, xToSeconds as rulerXToSec } from '../TimelineRuler'
import { TimelineRuler } from '../TimelineRuler'
import { Playhead } from '../Playhead'
import { TimeSelection } from '../TimeSelection'
import type { SelectionRange } from '../TimeSelection'
import { Clip } from '../Clip'
import type { AnnotationItem } from '../AnnotationLane'
import styles from './TapeStrip.module.css'

export type { SelectionRange }

// ─── Per-track data shape (the tape only reads clips — no edit metadata) ──────

export interface TapeClip {
  clipId:        string
  startSeconds:  number
  lengthSeconds: number
  /** Amplitude values in [0, 1]. Absent → a flat block (still a picture of audio). */
  peaks?:        number[]
}

export interface TapeTrack {
  id:    string
  /** CSS color (token) — same colour as the track's card below; the lane's colour spine. */
  color: string
  clips: TapeClip[]
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface TapeStripProps {
  tracks: TapeTrack[]

  // Shared time mapping (one source of truth for ruler / clips / playhead / punch)
  bpm:             number
  numerator:       number
  denominator:     number
  pxPerBeat:       number
  durationSeconds: number

  // Playhead
  playheadSeconds:    number
  /** Imperative read for the rAF loop — called on every animation frame during play. */
  getPlayheadSeconds: () => number
  playing?:           boolean
  recording?:         boolean

  // Markers — freeform alignment aids (read-mostly). Editing is optional power-user.
  markers?:      AnnotationItem[]
  /** Click empty marker strip → add a marker at this time (seconds). Absent = read-only. */
  onMarkerAdd?:  (seconds: number) => void
  /** Drag a marker flag → new time (seconds). Absent = markers are not draggable. */
  onMarkerMove?: (id: string, seconds: number) => void

  // Punch region (the one interactive overlay)
  selection:          SelectionRange | null
  /** Drag the brackets/band → new range. Absent = the punch region is display-only. */
  onSelectionChange?: (range: SelectionRange) => void
  /** Clear the punch region. Absent = display-only. */
  onSelectionClear?:  () => void

  // Navigation — the doorway to the drilldown
  selectedTrackId?: string | null
  /** Click a lane/clip → select that track. Absent = lanes are display-only (no affordance). */
  onSelectTrack?:   (trackId: string) => void

  /**
   * Fixed lane count — the tape always renders at least this many lanes so its
   * HEIGHT never changes with track count. The first `tracks.length` lanes carry
   * the tracks (colored pill + clips); the rest sit empty (neutral pill). More
   * tracks than `laneCount` extend the grid by the same lane unit. Default 10.
   */
  laneCount?:    number

  /** Per-lane pixel height. Slim by default; smaller at size="sm". */
  laneHeight?:   number
  size?:         'sm' | 'md'
  'aria-label'?: string
}

// ─── Slim defaults — this is a map, not the workspace ─────────────────────────

const DEFAULT_LANE_HEIGHT: Record<'sm' | 'md', number> = { sm: 22, md: 30 }
const MIN_CLIP_WIDTH = 2 // px — a sliver clip is still a visible mark on the tape
const MARKER_DRAG_THRESHOLD = 3 // px — movement beyond this = a drag, not a click

const noop = () => {}

// ─── Marker flag ───────────────────────────────────────────────────────────────

interface MarkerFlagProps {
  item:       AnnotationItem
  x:          number
  draggable:  boolean
  onMove?:    (id: string, seconds: number) => void
  xToSeconds: (x: number) => number
  durationSeconds: number
}

function MarkerFlag({ item, x, draggable, onMove, xToSeconds, durationSeconds }: MarkerFlagProps) {
  const downRef = useRef<{ x: number; moved: boolean } | null>(null)

  function handlePointerDown(e: React.PointerEvent) {
    if (!draggable) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    downRef.current = { x: e.clientX, moved: false }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const down = downRef.current
    if (!down) return
    if (Math.abs(e.clientX - down.x) > MARKER_DRAG_THRESHOLD) down.moved = true
    if (!down.moved) return
    const stripX = x + (e.clientX - down.x)
    const secs = Math.max(0, Math.min(xToSeconds(stripX), durationSeconds))
    onMove?.(item.id, secs)
  }

  function handlePointerUp() {
    downRef.current = null
  }

  const label = item.text ? `Marker: ${item.text}` : 'Marker'

  return (
    <div
      className={styles.marker}
      data-testid="tape-marker"
      data-marker-id={item.id}
      data-draggable={draggable || undefined}
      style={{ left: x } as CSSProperties}
      role="img"
      aria-label={label}
      title={item.text}
      onPointerDown={handlePointerDown}
      onPointerMove={draggable ? handlePointerMove : undefined}
      onPointerUp={draggable ? handlePointerUp : undefined}
      onPointerCancel={draggable ? handlePointerUp : undefined}
    >
      <span className={styles.markerFlag} aria-hidden="true" />
      <span className={styles.markerStem} aria-hidden="true" />
      {item.text && <span className={styles.markerLabel}>{item.text}</span>}
    </div>
  )
}

// ─── TapeStrip ───────────────────────────────────────────────────────────────

export function TapeStrip({
  tracks,
  bpm,
  numerator,
  denominator,
  pxPerBeat,
  durationSeconds,
  playheadSeconds,
  getPlayheadSeconds,
  playing   = false,
  recording = false,
  markers   = [],
  onMarkerAdd,
  onMarkerMove,
  selection,
  onSelectionChange,
  onSelectionClear,
  selectedTrackId = null,
  onSelectTrack,
  laneCount = 10,
  laneHeight,
  size = 'md',
  'aria-label': ariaLabel = 'Tape',
}: TapeStripProps) {
  const markerStripRef = useRef<HTMLDivElement>(null)

  // One memoized time↔px mapping shared by ruler, clips, playhead, punch, markers.
  const secondsToX = useCallback((s: number) => rulerSecToX(s, pxPerBeat, bpm), [pxPerBeat, bpm])
  const xToSeconds = useCallback((x: number) => rulerXToSec(x, pxPerBeat, bpm), [pxPerBeat, bpm])

  const totalWidth = secondsToX(durationSeconds)
  const laneH      = laneHeight ?? DEFAULT_LANE_HEIGHT[size]

  // Fixed lane grid: always at least `laneCount` lanes so the tape height is
  // constant; >laneCount tracks extend it by the same unit. Lanes fill top-down —
  // slot i carries tracks[i], or null (empty lane) when there's no track there.
  const totalLanes = Math.max(laneCount, tracks.length)
  const laneSlots  = Array.from({ length: totalLanes }, (_, i) => tracks[i] ?? null)

  const selectable = !!onSelectTrack
  // The punch region is interactive only when both handlers are wired; otherwise it
  // renders display-only (disabled) — no dead drag affordance.
  const punchInteractive = !!onSelectionChange && !!onSelectionClear

  // ── Marker strip: click empty space → add at that time (only when wired) ─────
  function handleMarkerStripPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!onMarkerAdd) return
    // Ignore clicks that land on an existing marker (those are its own gesture).
    if ((e.target as HTMLElement).closest('[data-marker-id]')) return
    const rect = markerStripRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, e.clientX - rect.left)
    onMarkerAdd(Math.max(0, Math.min(xToSeconds(x), durationSeconds)))
  }

  function handleMarkerStripKeyDown(e: React.KeyboardEvent) {
    if (!onMarkerAdd) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Keyboard add lands at the playhead — the unambiguous "we are here".
      onMarkerAdd(Math.max(0, Math.min(playheadSeconds, durationSeconds)))
    }
  }

  const cssVars = {
    '--lane-height': `${laneH}px`,
    '--tape-width':  `${totalWidth}px`,
  } as CSSProperties

  return (
    <div
      className={styles.root}
      data-testid="tape-strip-root"
      data-size={size}
      data-playing={playing || undefined}
      data-recording={recording || undefined}
      style={cssVars}
      role="region"
      aria-label={ariaLabel}
    >
      <div className={styles.scroll}>
        <div className={styles.content}>
          {/* ── Bar reference; onSeek scrubs the playhead (navigation, allowed) ── */}
          <div className={styles.ruler}>
            <TimelineRuler
              bpm={bpm}
              numerator={numerator}
              denominator={denominator}
              pxPerBeat={pxPerBeat}
              durationSeconds={durationSeconds}
              size="sm"
            />
          </div>

          {/* ── Marker layer — freeform alignment aids. The full-width strip carries
                the hairline + Add affordance; an inner band offset by the gutter holds
                the flags so they share the clips' time→x origin. ── */}
          <div
            className={styles.markerStrip}
            data-testid="tape-marker-strip"
            data-addable={onMarkerAdd ? true : undefined}
            role={onMarkerAdd ? 'button' : undefined}
            tabIndex={onMarkerAdd ? 0 : undefined}
            aria-label={onMarkerAdd ? 'Add marker' : undefined}
            onKeyDown={onMarkerAdd ? handleMarkerStripKeyDown : undefined}
          >
            <div
              ref={markerStripRef}
              className={styles.markerStripInner}
              onPointerUp={onMarkerAdd ? handleMarkerStripPointerUp : undefined}
            >
              {markers.map(m => (
                <MarkerFlag
                  key={m.id}
                  item={m}
                  x={secondsToX(m.start)}
                  draggable={!!onMarkerMove}
                  onMove={onMarkerMove}
                  xToSeconds={xToSeconds}
                  durationSeconds={durationSeconds}
                />
              ))}
            </div>
          </div>

          {/* ── Fixed lane grid + shared overlays (one positioning context) ──
                A constant block of lanes; the first N carry the tracks (colored pill +
                clips), the rest sit empty (neutral pill). Height never changes. ── */}
          <div className={styles.lanes} data-testid="tape-lanes">
            {laneSlots.map((track, i) => {
              // Empty lane — neutral pill, empty strip, non-interactive. The pill takes
              // no --lane-color, so its CSS falls back to a calm border token.
              if (!track) {
                return (
                  <div
                    key={`lane-empty-${i}`}
                    className={styles.lane}
                    data-testid="tape-lane"
                    data-empty-lane
                    data-static
                    aria-hidden="true"
                  >
                    <span
                      className={styles.lanePill}
                      data-testid="tape-lane-pill"
                      data-neutral
                      aria-hidden="true"
                    />
                    <div className={styles.clipArea} />
                  </div>
                )
              }

              const selected = selectedTrackId === track.id
              const laneLabel = `Track ${track.id}, ${track.clips.length} clip${
                track.clips.length === 1 ? '' : 's'
              }`
              const laneVars = { '--lane-color': track.color } as CSSProperties

              const laneInner = (
                <>
                  {/* Color-pill — the lane's track-colour spine, in the gutter. */}
                  <span className={styles.lanePill} data-testid="tape-lane-pill" aria-hidden="true" />
                  <div className={styles.clipArea}>
                    <div className={styles.clipsLayer} aria-hidden="true">
                      {track.clips.map(clip => {
                        const left  = secondsToX(clip.startSeconds)
                        const right = secondsToX(clip.startSeconds + clip.lengthSeconds)
                        const width = Math.max(MIN_CLIP_WIDTH, right - left)
                        return (
                          <div
                            key={clip.clipId}
                            className={styles.clipSlot}
                            data-testid="tape-clip"
                            data-clip-id={clip.clipId}
                            style={{ left, width } as CSSProperties}
                          >
                            <Clip
                              peaks={clip.peaks ?? []}
                              color={track.color}
                              waveformColor="track"
                              fadeHandles={false}
                              state="recorded"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )

              // Selectable → a real navigation button (no dead affordance otherwise).
              // Action/navigation semantics: aria-current marks the open track — NOT
              // aria-pressed (that's the toggle model; mixing them is the banned case).
              return selectable ? (
                <button
                  key={track.id}
                  type="button"
                  className={styles.lane}
                  data-testid="tape-lane"
                  data-track-id={track.id}
                  data-selected={selected || undefined}
                  style={laneVars}
                  aria-label={laneLabel}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelectTrack!(track.id)}
                >
                  {laneInner}
                </button>
              ) : (
                <div
                  key={track.id}
                  className={styles.lane}
                  data-testid="tape-lane"
                  data-track-id={track.id}
                  data-selected={selected || undefined}
                  data-static
                  style={laneVars}
                  role="img"
                  aria-label={laneLabel}
                >
                  {laneInner}
                </div>
              )
            })}

            {/* Shared overlays — render once, span the full lane stack. */}
            <div className={styles.overlayLayer}>
              <Playhead
                seconds={playheadSeconds}
                getSeconds={getPlayheadSeconds}
                playing={playing}
                recording={recording}
                secondsToX={secondsToX}
              />
              <TimeSelection
                range={selection}
                secondsToX={secondsToX}
                xToSeconds={xToSeconds}
                durationSeconds={durationSeconds}
                onChange={onSelectionChange ?? noop}
                onClear={onSelectionClear ?? noop}
                disabled={!punchInteractive}
                size={size}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
