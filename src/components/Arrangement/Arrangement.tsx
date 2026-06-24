// src/components/Arrangement/Arrangement.tsx
import { useRef, useCallback, useState, type CSSProperties, type ReactNode } from 'react'
import { FolderSimple } from '@phosphor-icons/react'
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
  /** Folder tracks show a wider keyline and no arm/input controls. */
  isFolder?:    boolean
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
  /** Fires when a track's minimized (compact row) state changes via double-click. */
  onToggleMinimized?: (id: string, minimized: boolean) => void
  onClipMove?:        (trackId: string, intent: ClipMoveIntent) => void
  /**
   * Fires continuously while a clip is dragged, with the live pointer and the lane
   * resolved beneath it. A standalone `TrackLane` can't see its siblings — only the
   * arrangement hit-tests the whole lane stack — so this is where the consumer learns
   * the drop target to paint its own highlight / invalid-folder cue. `targetTrackId`
   * is the sibling lane under the pointer (or null past the stack); `invalid` is true
   * when that lane can't accept a clip (a folder/bus lane). The kit also paints its
   * own drop highlight so the gallery reads correctly with no consumer wiring.
   */
  onClipDragOver?:    (info: {
    clipId:        string
    clientX:       number
    clientY:       number
    targetTrackId: string | null
    invalid:       boolean
  }) => void
  onClipTrimStart?:   (trackId: string, intent: ClipTrimIntent) => void
  onClipTrimEnd?:     (trackId: string, intent: ClipTrimIntent) => void
  /**
   * Drag-to-set clip fades — bubbled from the lane with its `trackId`. `fadeIn` / `fadeOut`
   * are the clip's full fade state in seconds (the un-dragged side unchanged). The composite
   * adds no resolution of its own; it just tags the originating lane.
   */
  onClipSetFades?:    (trackId: string, clipId: string, fadeIn?: number, fadeOut?: number) => void
  onClipDelete?:      (trackId: string, clipId: string) => void
  /**
   * Fires whenever the cross-lane clip selection changes, with the full new
   * selection (clip ids spanning every lane). The arrangement owns this set
   * internally — seeded from the clips' `selected` flags — so the gallery works
   * standalone; the app mirrors it into its own selection model via this intent.
   */
  onSelectClips?:     (clipIds: string[]) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TRACK_HEIGHT    = 88
const DEFAULT_HEADER_WIDTH    = 200
const COLLAPSED_TRACK_HEIGHT  = 40

// ─── localStorage helpers (arrangement-scoped keys, separate from standalone) ─

function lsMinKey(id: string) { return `jackdaw.arrangement.${id}.minimized` }

function readArrangementMinimized(id: string): boolean {
  try { return localStorage.getItem(lsMinKey(id)) === 'true' } catch { return false }
}

function writeArrangementMinimized(id: string, v: boolean) {
  try { localStorage.setItem(lsMinKey(id), String(v)) } catch {}
}

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
  onToggleMinimized,
  onClipMove,
  onClipDragOver,
  onClipTrimStart,
  onClipTrimEnd,
  onClipSetFades,
  onClipDelete,
  onSelectClips,
}: ArrangementProps) {
  const scrollBoxRef     = useRef<HTMLDivElement>(null)
  const headersScrollRef = useRef<HTMLDivElement>(null)
  const lanesRef         = useRef<HTMLDivElement>(null)

  // ── Minimized state (localStorage-backed, arrangement-scoped) ──────────────
  const [minimizedTracks, setMinimizedTracks] = useState<Set<string>>(() => {
    const set = new Set<string>()
    tracks.forEach(t => { if (readArrangementMinimized(t.id)) set.add(t.id) })
    return set
  })

  function handleToggleMinimized(id: string, minimized: boolean) {
    setMinimizedTracks(prev => {
      const next = new Set(prev)
      if (minimized) next.add(id)
      else next.delete(id)
      return next
    })
    writeArrangementMinimized(id, minimized)
    onToggleMinimized?.(id, minimized)
  }

  // ── Cross-lane clip selection (owned here, seeded from clips' flags) ────────
  // A single SET spanning every lane is the source of truth for which clips read
  // as selected — shift-select reads/writes it, so a selection can straddle lanes.
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(() => {
    const set = new Set<string>()
    tracks.forEach(t => t.clips.forEach(c => { if (c.selected) set.add(c.clipId) }))
    return set
  })

  function commitSelection(next: Set<string>) {
    setSelectedClipIds(next)
    onSelectClips?.([...next])
  }

  // Plain click — replace the selection with this one clip, and focus its track
  // (mirrors empty-lane click, which also focuses the track).
  function handleClipSelect(trackId: string, clipId: string) {
    commitSelection(new Set([clipId]))
    onSelectTrack(trackId)
  }

  // Shift+click — toggle this clip in the cross-lane set; track focus is untouched.
  function handleClipShiftSelect(clipId: string) {
    const next = new Set(selectedClipIds)
    if (next.has(clipId)) next.delete(clipId)
    else next.add(clipId)
    commitSelection(next)
  }

  // ── Cross-track clip drag (composite-owned hit-test) ────────────────────────
  // A lane can't resolve a drop onto a sibling — only the composite sees the stack.
  // While a clip is dragged, each lane reports the live pointer up here; we hit-test
  // it against the lane rects to find the lane underneath, decide if it can accept a
  // clip (folder/bus lanes can't), paint that lane's highlight (live state), and stash
  // the verdict in a ref so the drop's onClipMove can inject the resolved trackId.
  interface DragResolve { originTrackId: string; targetTrackId: string | null; invalid: boolean }
  const dragResolvedRef = useRef<DragResolve | null>(null)
  const [dragOver, setDragOver] = useState<DragResolve & { clipId: string } | null>(null)

  const isFolderTrack = useCallback(
    (id: string | null) => id != null && (tracks.find(t => t.id === id)?.isFolder ?? false),
    [tracks],
  )

  // Resolve the lane whose vertical band contains clientY (DOM order = visual order).
  function laneAtClientY(clientY: number): string | null {
    const region = lanesRef.current
    if (!region) return null
    const lanes = region.querySelectorAll<HTMLElement>('[data-track-id]')
    for (const lane of lanes) {
      const rect = lane.getBoundingClientRect()
      if (clientY >= rect.top && clientY < rect.bottom) return lane.dataset.trackId ?? null
    }
    return null
  }

  function handleClipDragOver(
    originTrackId: string,
    info: { clipId: string; clientX: number; clientY: number },
  ) {
    const targetTrackId = laneAtClientY(info.clientY)
    const invalid       = isFolderTrack(targetTrackId)
    dragResolvedRef.current = { originTrackId, targetTrackId, invalid }
    setDragOver({ ...dragResolvedRef.current, clipId: info.clipId })
    onClipDragOver?.({ ...info, targetTrackId, invalid })
  }

  function handleClipDragEnd() {
    dragResolvedRef.current = null
    setDragOver(null)
  }

  // The drop highlight shows on the resolved sibling lane only (never the home lane).
  function dropTargetFor(trackId: string): 'valid' | 'invalid' | null {
    if (!dragOver || dragOver.targetTrackId !== trackId) return null
    if (dragOver.targetTrackId === dragOver.originTrackId) return null
    return dragOver.invalid ? 'invalid' : 'valid'
  }

  // Wrap a lane's move intent: inject the resolved sibling lane into intent.trackId
  // (a valid cross-track drop); a same-lane or invalid (folder) drop stays same-track.
  function handleClipMove(originTrackId: string, intent: ClipMoveIntent) {
    const r = dragResolvedRef.current
    const crossTrack =
      r != null &&
      r.originTrackId === originTrackId &&
      r.targetTrackId != null &&
      r.targetTrackId !== originTrackId &&
      !r.invalid
    onClipMove?.(originTrackId, crossTrack ? { ...intent, trackId: r!.targetTrackId! } : intent)
  }

  // ── Collapse all folders ────────────────────────────────────────────────────
  const folderTracks  = tracks.filter(t => t.isFolder)
  const hasFolders    = folderTracks.length > 0
  const allFoldersMin = hasFolders && folderTracks.every(t => minimizedTracks.has(t.id))

  function handleCollapseAllFolders() {
    const folderIds = folderTracks.map(t => t.id)
    const next      = !allFoldersMin
    setMinimizedTracks(prev => {
      const updated = new Set(prev)
      folderIds.forEach(id => {
        if (next) updated.add(id)
        else updated.delete(id)
      })
      return updated
    })
    folderIds.forEach(id => {
      writeArrangementMinimized(id, next)
      onToggleMinimized?.(id, next)
    })
  }

  // ── Per-track height ────────────────────────────────────────────────────────
  function rowHeight(track: ArrangementTrack): number {
    return minimizedTracks.has(track.id) ? COLLAPSED_TRACK_HEIGHT : trackHeight
  }

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
        {/* Ruler-height spacer; houses the collapse-all-folders control */}
        <div className={styles.rulerSpacer}>
          {hasFolders && (
            <button
              className={styles.collapseFoldersBtn}
              aria-label={allFoldersMin ? 'Expand all folders' : 'Collapse all folders'}
              aria-pressed={allFoldersMin}
              onClick={handleCollapseAllFolders}
              disabled={disabled}
            >
              <FolderSimple size={12} />
            </button>
          )}
        </div>

        {/* Vertically-synced scroll container (scrollbar hidden) */}
        <div ref={headersScrollRef} className={styles.headersScroll}>
          {tracks.map(track => (
            <div
              key={track.id}
              className={styles.headerRow}
              style={{ height: rowHeight(track) }}
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
                variant={track.isFolder ? 'folder' : 'track'}
                minimized={minimizedTracks.has(track.id)}
                onToggleMinimized={min => handleToggleMinimized(track.id, min)}
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
              ref={lanesRef}
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
                      clips={track.clips.map(c => ({
                        ...c,
                        selected: selectedClipIds.has(c.clipId),
                      }))}
                      bpm={bpm}
                      numerator={numerator}
                      denominator={denominator}
                      pxPerBeat={pxPerBeat}
                      division={division}
                      height={rowHeight(track)}
                      selected={focusedTrackId === track.id}
                      disabled={disabled}
                      dropTarget={dropTargetFor(track.id)}
                      onClipMove={onClipMove
                        ? intent => handleClipMove(track.id, intent)
                        : undefined}
                      onClipDragMove={info => handleClipDragOver(track.id, info)}
                      onClipDragEnd={handleClipDragEnd}
                      onClipTrimStart={onClipTrimStart
                        ? intent => onClipTrimStart!(track.id, intent)
                        : undefined}
                      onClipTrimEnd={onClipTrimEnd
                        ? intent => onClipTrimEnd!(track.id, intent)
                        : undefined}
                      onClipSetFades={onClipSetFades
                        ? (clipId, fadeIn, fadeOut) => onClipSetFades!(track.id, clipId, fadeIn, fadeOut)
                        : undefined}
                      onClipDelete={onClipDelete
                        ? clipId => onClipDelete!(track.id, clipId)
                        : undefined}
                      onClipSelect={clipId => handleClipSelect(track.id, clipId)}
                      onClipShiftSelect={handleClipShiftSelect}
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
