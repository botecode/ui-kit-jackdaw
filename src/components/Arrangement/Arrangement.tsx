// src/components/Arrangement/Arrangement.tsx
import { useRef, useCallback, type CSSProperties, type ReactNode } from 'react'
import { TrackHeader } from '../TrackHeader'
import type { InputSelectOption } from '../InputSelect'
import type { FxPlugin } from '../FxChip'
import { TrackLane } from '../TrackLane'
import type { ClipInfo, ClipMoveIntent, ClipTrimIntent } from '../TrackLane'
import { TimelineRuler } from '../TimelineRuler'
import { secondsToX as rulerSecToX, xToSeconds as rulerXToSec } from '../TimelineRuler'
import { Playhead } from '../Playhead'
import { EditCursor } from '../EditCursor'
import { TimeSelection } from '../TimeSelection'
import type { SelectionRange } from '../TimeSelection'
import type { Division } from '../TimelineGrid'
import styles from './Arrangement.module.css'

export type { SelectionRange }

// ─── Per-track data shape ─────────────────────────────────────────────────────

export interface ArrangementTrack {
  id:           string
  name:         string
  color:        string
  type:         'audio' | 'midi' | 'instrument'
  armed:        boolean
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  inputId:      string | null
  plugins:      FxPlugin[]
  chainEnabled: boolean
  clips:        ClipInfo[]
  meterLevel?:  number
  meterLevelL?: number
  meterLevelR?: number
  clipping?:    boolean
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ArrangementProps {
  tracks:             ArrangementTrack[]
  // Shared time mapping
  bpm:                number
  numerator:          number
  denominator:        number
  pxPerBeat:          number
  division:           Division
  durationSeconds:    number
  // Playhead
  playheadSeconds:    number
  /** Imperative read for the rAF loop — called on every animation frame during play. */
  getPlayheadSeconds: () => number
  playing?:           boolean
  recording?:         boolean
  // Edit cursor
  cursorSeconds:      number
  // Time selection
  selection:          SelectionRange | null
  // Focus
  focusedTrackId?:    string | null
  // Display config
  inputOptions:       InputSelectOption[]
  anySoloActive?:     boolean
  showAllMeters?:     boolean
  disabled?:          boolean
  trackHeight?:       number
  headerWidth?:       number
  /** Slot for the focused-track detail panel; renders below the lane stack. */
  detailPanel?:       ReactNode
  // Callbacks — typed against the real bridge intent contract
  onSelectTrack:      (id: string) => void
  onSeek:             (seconds: number) => void
  onSelectRange:      (range: SelectionRange) => void
  onClearSelection:   () => void
  onRenameTrack:      (id: string, name: string) => void
  onArmTrack:         (id: string) => void
  onMuteTrack:        (id: string) => void
  onSoloTrack:        (id: string) => void
  onVolumeTrack:      (id: string, db: number) => void
  onPanTrack:         (id: string, pan: number) => void
  onSelectInput:      (id: string, inputId: string) => void
  onToggleChain:      (id: string, next: boolean) => void
  onTogglePlugin:     (id: string, pluginId: string, next: boolean) => void
  onReorderPlugin:    (id: string, from: number, to: number) => void
  onRemovePlugin:     (id: string, pluginId: string) => void
  onAddPlugin:        (id: string) => void
  onOpenPlugin:       (id: string, pluginId: string) => void
  onToggleFolder?:    (id: string) => void
  onClipMove?:        (trackId: string, intent: ClipMoveIntent) => void
  onClipTrimStart?:   (trackId: string, intent: ClipTrimIntent) => void
  onClipTrimEnd?:     (trackId: string, intent: ClipTrimIntent) => void
  onClipDelete?:      (trackId: string, clipId: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TRACK_HEIGHT = 88
const DEFAULT_HEADER_WIDTH = 200

// ─── Arrangement ──────────────────────────────────────────────────────────────

export function Arrangement({
  tracks,
  bpm,
  numerator,
  denominator,
  pxPerBeat,
  division,
  durationSeconds,
  playheadSeconds,
  getPlayheadSeconds,
  playing           = false,
  recording         = false,
  cursorSeconds,
  selection,
  focusedTrackId    = null,
  inputOptions,
  anySoloActive     = false,
  showAllMeters     = false,
  disabled          = false,
  trackHeight       = DEFAULT_TRACK_HEIGHT,
  headerWidth       = DEFAULT_HEADER_WIDTH,
  detailPanel,
  onSelectTrack,
  onSeek,
  onSelectRange,
  onClearSelection,
  onRenameTrack,
  onArmTrack,
  onMuteTrack,
  onSoloTrack,
  onVolumeTrack,
  onPanTrack,
  onSelectInput,
  onToggleChain,
  onTogglePlugin,
  onReorderPlugin,
  onRemovePlugin,
  onAddPlugin,
  onOpenPlugin,
  onToggleFolder,
  onClipMove,
  onClipTrimStart,
  onClipTrimEnd,
  onClipDelete,
}: ArrangementProps) {
  const scrollBoxRef     = useRef<HTMLDivElement>(null)
  const headersScrollRef = useRef<HTMLDivElement>(null)

  // Memoized time↔px mapping — one source of truth shared by ruler, playhead,
  // edit-cursor, time-selection. Recreates only when zoom/bpm changes.
  const secondsToX = useCallback(
    (s: number) => rulerSecToX(s, pxPerBeat, bpm),
    [pxPerBeat, bpm],
  )
  const xToSeconds = useCallback(
    (x: number) => rulerXToSec(x, pxPerBeat, bpm),
    [pxPerBeat, bpm],
  )

  const totalWidth = secondsToX(durationSeconds)
  const isEmpty    = tracks.length === 0

  // Sync header-column vertical scroll with main timeline scroll (one-way: JS only).
  // The header column uses overflow-y:scroll with a hidden scrollbar so scrollTop
  // can be set programmatically. Users can only scroll via the timeline pane.
  function handleScrollBoxScroll() {
    const box     = scrollBoxRef.current
    const headers = headersScrollRef.current
    if (!box || !headers) return
    headers.scrollTop = box.scrollTop
  }

  const cssVars = {
    '--header-width': `${headerWidth}px`,
    '--ruler-height': '32px',
    '--track-height': `${trackHeight}px`,
  } as CSSProperties

  return (
    <div
      className={styles.root}
      data-testid="arrangement-root"
      data-empty={isEmpty || undefined}
      data-playing={playing || undefined}
      data-disabled={disabled || undefined}
      style={cssVars}
      role="region"
      aria-label="Arrangement"
    >
      {/* ── Left: track header column ───────────────────────────────────────── */}
      <div
        className={styles.headersColumn}
        role="group"
        aria-label="Track headers"
      >
        {/* Spacer aligns vertically with the TimelineRuler row */}
        <div className={styles.rulerSpacer} aria-hidden="true" />

        {/* Vertically-synced scroll container (scrollbar hidden) */}
        <div ref={headersScrollRef} className={styles.headersScroll}>
          {tracks.map(track => (
            <div
              key={track.id}
              className={styles.headerRow}
              style={{ height: trackHeight }}
            >
              <TrackHeader
                track={{
                  id:           track.id,
                  name:         track.name,
                  color:        track.color,
                  type:         track.type,
                  armed:        track.armed,
                  muted:        track.muted,
                  soloed:       track.soloed,
                  volumeDb:     track.volumeDb,
                  pan:          track.pan,
                  inputId:      track.inputId,
                  plugins:      track.plugins,
                  chainEnabled: track.chainEnabled,
                  selected:     focusedTrackId === track.id,
                }}
                inputOptions={inputOptions}
                anySoloActive={anySoloActive}
                showAllMeters={showAllMeters}
                meterLevel={track.meterLevel}
                meterLevelL={track.meterLevelL}
                meterLevelR={track.meterLevelR}
                clipping={track.clipping}
                disabled={disabled}
                onSelect={() => onSelectTrack(track.id)}
                onRename={name => onRenameTrack(track.id, name)}
                onArm={() => onArmTrack(track.id)}
                onMute={() => onMuteTrack(track.id)}
                onSolo={() => onSoloTrack(track.id)}
                onVolume={db => onVolumeTrack(track.id, db)}
                onPan={pan => onPanTrack(track.id, pan)}
                onSelectInput={inputId => onSelectInput(track.id, inputId)}
                onToggleChain={next => onToggleChain(track.id, next)}
                onTogglePlugin={(pluginId, next) => onTogglePlugin(track.id, pluginId, next)}
                onReorder={(from, to) => onReorderPlugin(track.id, from, to)}
                onRemovePlugin={pluginId => onRemovePlugin(track.id, pluginId)}
                onAddPlugin={() => onAddPlugin(track.id)}
                onOpenPlugin={pluginId => onOpenPlugin(track.id, pluginId)}
                onToggleFolder={onToggleFolder ? () => onToggleFolder!(track.id) : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: scrollable timeline ──────────────────────────────────────── */}
      <div className={styles.timelineArea}>
        <div
          ref={scrollBoxRef}
          className={styles.scrollBox}
          onScroll={handleScrollBoxScroll}
        >
          <div
            className={styles.scrollContent}
            style={{ width: totalWidth }}
          >
            {/* Ruler — sticky to viewport top, scrolls horizontally with content */}
            <div className={styles.stickyRuler}>
              <TimelineRuler
                bpm={bpm}
                numerator={numerator}
                denominator={denominator}
                pxPerBeat={pxPerBeat}
                durationSeconds={durationSeconds}
                onSeek={onSeek}
                size="md"
              />
            </div>

            {/* Lanes + arrangement-level overlays */}
            <div
              className={styles.lanesRegion}
              data-testid="arrangement-lanes"
              data-empty={isEmpty || undefined}
            >
              {isEmpty ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyMessage}>No tracks</p>
                </div>
              ) : (
                <>
                  {tracks.map(track => (
                    <TrackLane
                      key={track.id}
                      trackId={track.id}
                      clips={track.clips}
                      bpm={bpm}
                      numerator={numerator}
                      denominator={denominator}
                      pxPerBeat={pxPerBeat}
                      division={division}
                      height={trackHeight}
                      selected={focusedTrackId === track.id}
                      disabled={disabled}
                      onClipMove={onClipMove
                        ? intent => onClipMove!(track.id, intent)
                        : undefined}
                      onClipTrimStart={onClipTrimStart
                        ? intent => onClipTrimStart!(track.id, intent)
                        : undefined}
                      onClipTrimEnd={onClipTrimEnd
                        ? intent => onClipTrimEnd!(track.id, intent)
                        : undefined}
                      onClipDelete={onClipDelete
                        ? clipId => onClipDelete!(track.id, clipId)
                        : undefined}
                      // Clicking empty lane space seeks + selects this track.
                      onSetCursor={s => {
                        onSeek(s)
                        onSelectTrack(track.id)
                      }}
                    />
                  ))}

                  {/* Shared overlays — render once, span full lane height */}
                  <div className={styles.overlayLayer}>
                    <Playhead
                      seconds={playheadSeconds}
                      getSeconds={getPlayheadSeconds}
                      playing={playing}
                      recording={recording}
                      secondsToX={secondsToX}
                    />
                    <EditCursor
                      seconds={cursorSeconds}
                      secondsToX={secondsToX}
                      durationSeconds={durationSeconds}
                      onSeek={onSeek}
                      disabled={disabled}
                      aria-label="Edit cursor"
                    />
                    <TimeSelection
                      range={selection}
                      secondsToX={secondsToX}
                      xToSeconds={xToSeconds}
                      durationSeconds={durationSeconds}
                      onChange={onSelectRange}
                      onClear={onClearSelection}
                      disabled={disabled}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detail panel slot — home for FocusedTrackDetailPanel when built */}
        {detailPanel != null && (
          <div className={styles.detailSlot} data-testid="arrangement-detail-slot">
            {detailPanel}
          </div>
        )}
      </div>
    </div>
  )
}
