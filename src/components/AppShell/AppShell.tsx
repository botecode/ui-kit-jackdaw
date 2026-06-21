// src/components/AppShell/AppShell.tsx
import {
  PenNib, MusicNotes, Lightbulb,
  ClockCounterClockwise, ChatText, GearSix,
} from '@phosphor-icons/react'
import { NavRail } from '../NavRail'
import type { NavRailItem } from '../NavRail'
import { TransportBar } from '../TransportBar'
import type { RecordModeState, RecordModeValue } from '../RecordMode'
import { Arrangement } from '../Arrangement'
import type { ArrangementTrack } from '../Arrangement'
import { AnnotationLane } from '../AnnotationLane'
import type { AnnotationItem, AnnotationType } from '../AnnotationLane'
import { FocusedTrackDetailPanel } from '../FocusedTrackDetailPanel'
import type { ClipInfo, ClipMoveIntent, ClipTrimIntent } from '../TrackLane'
import type { FxPlugin } from '../FxChip'
import { Mixer } from '../Mixer'
import type { MixerChannel, MixerMaster } from '../Mixer'
import { CommentsPanel } from '../CommentsPanel'
import type { Comment, AudioRef } from '../CommentsPanel'
import { Versions } from '../Versions'
import type { VersionEntry, VersionDiff } from '../Versions'
import { IdeasLibrary } from '../IdeasLibrary'
import type { Idea } from '../IdeasLibrary'
import { ToastProvider } from '../Toast'
import type { InputSelectOption } from '../InputSelect'
import type { SelectionRange } from '../TimeSelection'
import type { Division } from '../TimelineGrid'
import styles from './AppShell.module.css'

// ── Nav section ───────────────────────────────────────────────────────────────

export type NavSection =
  | 'arrange'
  | 'write'
  | 'comments'
  | 'versions'
  | 'ideas'
  | 'settings'

const NAV_ITEMS: NavRailItem[] = [
  { id: 'write',    icon: PenNib,               label: 'Write' },
  { id: 'arrange',  icon: MusicNotes,            label: 'Arrangement' },
  { id: 'ideas',    icon: Lightbulb,             label: 'Ideas' },
  { id: 'versions', icon: ClockCounterClockwise, label: 'Versions' },
  { id: 'comments', icon: ChatText,              label: 'Comments' },
]

const FOOTER_NAV_ITEMS: NavRailItem[] = [
  { id: 'settings', icon: GearSix, label: 'Settings' },
]

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AppShellProps {
  // ── Navigation ──────────────────────────────────────────────────────────
  activeSection:      NavSection
  onSelectSection:    (s: NavSection) => void

  // ── Transport ────────────────────────────────────────────────────────────
  playing:            boolean
  recording:          boolean
  playheadSeconds:    number
  getPlayheadSeconds: () => number
  bpm:                number
  numerator:          number
  denominator:        number
  loopEnabled:        boolean
  recordState:        RecordModeState
  recordMode:         RecordModeValue
  selectionStart:     number
  selectionEnd:       number
  gridDivision:       string
  rate:               number
  clockMode?:         'bars' | 'time'
  clockPrecision?:    1 | 2 | 3

  // ── Arrangement ──────────────────────────────────────────────────────────
  tracks:             ArrangementTrack[]
  pxPerBeat:          number
  division:           Division
  durationSeconds:    number
  cursorSeconds:      number
  selection:          SelectionRange | null
  focusedTrackId:     string | null
  inputOptions:       InputSelectOption[]
  showAllMeters?:     boolean

  // ── Annotation lanes ─────────────────────────────────────────────────────
  chordItems:         AnnotationItem[]
  lyricItems:         AnnotationItem[]

  // ── Focused-track detail panel ────────────────────────────────────────────
  /** When defined, the detail panel is open for this track. */
  detailTrack?: {
    id:             string
    name:           string
    color:          string
    kind:           'audio' | 'folder'
    armed:          boolean
    muted:          boolean
    soloed:         boolean
    volumeDb:       number
    pan:            number
    phaseInverted?: boolean
  }
  detailClips:          ClipInfo[]
  detailPlugins:        FxPlugin[]
  detailChainEnabled:   boolean
  detailMeterL?:        number
  detailMeterR?:        number
  detailPanelHeight:    number

  // ── Mixer ─────────────────────────────────────────────────────────────────
  mixerOpen:            boolean
  mixerChannels:        MixerChannel[]
  mixerMaster:          MixerMaster

  // ── Right panels ──────────────────────────────────────────────────────────
  comments:             Comment[]
  currentUserId?:       string
  versions:             VersionEntry[]
  versionsSelected:     string[]
  versionsDiff?:        VersionDiff
  ideas:                Idea[]
  ideasAppSyncUrl:      string

  // ── Transport callbacks ───────────────────────────────────────────────────
  onPlay:               () => void
  onStop:               () => void
  onGoToStart:          () => void
  onGoToEnd:            () => void
  onToggleRecord:       () => void
  onSelectRecordMode:   (mode: RecordModeValue) => void
  onToggleLoop:         (enabled: boolean) => void
  onSetTempo:           (bpm: number) => void
  onSetTimeSignature:   (numerator: number, denominator: number) => void
  onClockModeChange?:   (mode: 'bars' | 'time') => void
  onToggleMixer:        (open: boolean) => void

  // ── Arrangement callbacks ─────────────────────────────────────────────────
  onSelectTrack:        (id: string) => void
  onSeek:               (seconds: number) => void
  onSelectRange:        (range: SelectionRange) => void
  onClearSelection:     () => void
  onRenameTrack:        (id: string, name: string) => void
  onArmTrack:           (id: string) => void
  onMuteTrack:          (id: string) => void
  onSoloTrack:          (id: string) => void
  onVolumeTrack:        (id: string, db: number) => void
  onPanTrack:           (id: string, pan: number) => void
  onSelectInput:        (id: string, inputId: string) => void
  onToggleChain:        (id: string, next: boolean) => void
  onTogglePlugin:       (id: string, pluginId: string, next: boolean) => void
  onReorderPlugin:      (id: string, from: number, to: number) => void
  onRemovePlugin:       (id: string, pluginId: string) => void
  onAddPlugin:          (id: string) => void
  onOpenPlugin:         (id: string, pluginId: string) => void
  onToggleFolder?:      (id: string) => void
  onClipMove?:          (trackId: string, intent: ClipMoveIntent) => void
  onClipTrimStart?:     (trackId: string, intent: ClipTrimIntent) => void
  onClipTrimEnd?:       (trackId: string, intent: ClipTrimIntent) => void
  onClipDelete?:        (trackId: string, clipId: string) => void

  // ── Annotation callbacks ──────────────────────────────────────────────────
  onAnnotationAdd?:     (type: AnnotationType, time: number) => void
  onAnnotationEdit?:    (type: AnnotationType, id: string) => void
  onAnnotationMove?:    (type: AnnotationType, id: string, start: number) => void
  onAnnotationDelete?:  (type: AnnotationType, id: string) => void

  // ── Detail panel callbacks ────────────────────────────────────────────────
  onDetailPanelResize:    (height: number) => void
  onDetailPanelClose:     () => void
  onDetailToggleChain:    (next: boolean) => void
  onDetailTogglePlugin:   (id: string, next: boolean) => void
  onDetailReorderPlugin:  (from: number, to: number) => void
  onDetailRemovePlugin:   (id: string) => void
  onDetailAddPlugin:      () => void
  onDetailOpenPlugin:     (id: string) => void
  onDetailTogglePhase?:   (next: boolean) => void

  // ── Mixer callbacks ───────────────────────────────────────────────────────
  onMixerArm?:          (trackId: string) => void
  onMixerMute:          (trackId: string, muted: boolean) => void
  onMixerSolo:          (trackId: string, soloed: boolean) => void
  onMixerVolume:        (trackId: string, db: number) => void
  onMixerPan:           (trackId: string, pan: number) => void
  onMasterMute?:        (muted: boolean) => void
  onMasterSolo?:        (soloed: boolean) => void
  onMasterVolume:       (db: number) => void
  onMasterPan:          (pan: number) => void

  // ── Comments callbacks ────────────────────────────────────────────────────
  onPostComment:        (content: string | AudioRef) => void
  onReplyComment:       (commentId: string, content: string | AudioRef) => void
  onResolveComment:     (commentId: string, resolved: boolean) => void
  onJumpToComment?:     (timelineAt: number) => void
  onRecordAudio?:       () => Promise<AudioRef>

  // ── Versions callbacks ────────────────────────────────────────────────────
  onVersionSelect:      (id: string) => void
  onVersionCompare:     (a: string, b: string) => void
  onVersionRename:      (id: string, name: string) => void
  onVersionRestore:     (id: string) => void

  // ── Ideas callbacks ───────────────────────────────────────────────────────
  onIdeaPlay:           (id: string) => void
  onIdeaDragToProject:  (id: string) => void
  onIdeaLabel:          (id: string, labels: string[]) => void
  onIdeaDelete:         (id: string) => void
  onGetApp?:            () => void

  disabled?:            boolean
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({
  activeSection,
  onSelectSection,
  playing,
  recording,
  playheadSeconds,
  getPlayheadSeconds,
  bpm,
  numerator,
  denominator,
  loopEnabled,
  recordState,
  recordMode,
  selectionStart,
  selectionEnd,
  gridDivision,
  rate,
  clockMode,
  clockPrecision,
  tracks,
  pxPerBeat,
  division,
  durationSeconds,
  cursorSeconds,
  selection,
  focusedTrackId,
  inputOptions,
  showAllMeters,
  chordItems,
  lyricItems,
  detailTrack,
  detailClips,
  detailPlugins,
  detailChainEnabled,
  detailMeterL,
  detailMeterR,
  detailPanelHeight,
  mixerOpen,
  mixerChannels,
  mixerMaster,
  comments,
  currentUserId,
  versions,
  versionsSelected,
  versionsDiff,
  ideas,
  ideasAppSyncUrl,
  onPlay,
  onStop,
  onGoToStart,
  onGoToEnd,
  onToggleRecord,
  onSelectRecordMode,
  onToggleLoop,
  onSetTempo,
  onSetTimeSignature,
  onClockModeChange,
  onToggleMixer,
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
  onAnnotationAdd,
  onAnnotationEdit,
  onAnnotationMove,
  onAnnotationDelete,
  onDetailPanelResize,
  onDetailPanelClose,
  onDetailToggleChain,
  onDetailTogglePlugin,
  onDetailReorderPlugin,
  onDetailRemovePlugin,
  onDetailAddPlugin,
  onDetailOpenPlugin,
  onDetailTogglePhase,
  onMixerArm,
  onMixerMute,
  onMixerSolo,
  onMixerVolume,
  onMixerPan,
  onMasterMute,
  onMasterSolo,
  onMasterVolume,
  onMasterPan,
  onPostComment,
  onReplyComment,
  onResolveComment,
  onJumpToComment,
  onRecordAudio,
  onVersionSelect,
  onVersionCompare,
  onVersionRename,
  onVersionRestore,
  onIdeaPlay,
  onIdeaDragToProject,
  onIdeaLabel,
  onIdeaDelete,
  onGetApp,
  disabled,
}: AppShellProps) {
  const rightPanelOpen =
    activeSection === 'comments' ||
    activeSection === 'versions' ||
    activeSection === 'ideas'

  const detailPanelOpen = detailTrack !== undefined

  const detailPanel = detailPanelOpen && detailTrack ? (
    <FocusedTrackDetailPanel
      track={detailTrack}
      clips={detailClips}
      plugins={detailPlugins}
      chainEnabled={detailChainEnabled}
      pxPerBeat={pxPerBeat}
      bpm={bpm}
      numerator={numerator}
      denominator={denominator}
      division={division}
      meterValueL={detailMeterL}
      meterValueR={detailMeterR}
      height={detailPanelHeight}
      onResize={onDetailPanelResize}
      open={detailPanelOpen}
      onClose={onDetailPanelClose}
      onToggleChain={onDetailToggleChain}
      onTogglePlugin={onDetailTogglePlugin}
      onReorderPlugin={onDetailReorderPlugin}
      onRemovePlugin={onDetailRemovePlugin}
      onAddPlugin={onDetailAddPlugin}
      onOpenPlugin={onDetailOpenPlugin}
      onTogglePhase={onDetailTogglePhase}
      onClipMove={intent => onClipMove?.(detailTrack.id, intent)}
      onClipTrimStart={intent => onClipTrimStart?.(detailTrack.id, intent)}
      onClipTrimEnd={intent => onClipTrimEnd?.(detailTrack.id, intent)}
      onClipDelete={clipId => onClipDelete?.(detailTrack.id, clipId)}
      disabled={disabled}
    />
  ) : null

  const hasAnnotations = chordItems.length > 0 || lyricItems.length > 0

  return (
    <ToastProvider>
      <div
        className={styles.root}
        data-section={activeSection}
        data-mixer-open={mixerOpen || undefined}
        data-right-panel={rightPanelOpen || undefined}
        data-testid="app-shell"
      >
        {/* ── Nav rail — left column, full height ─────────────────────────── */}
        <div className={styles.navCol}>
          <NavRail
            items={NAV_ITEMS}
            footerItems={FOOTER_NAV_ITEMS}
            active={activeSection}
            onSelect={id => onSelectSection(id as NavSection)}
            aria-label="Application navigation"
          />
        </div>

        {/* ── Transport bar — top row ──────────────────────────────────────── */}
        <div className={styles.transport}>
          <TransportBar
            playing={playing}
            recording={recording}
            seconds={playheadSeconds}
            bpm={bpm}
            numerator={numerator}
            denominator={denominator}
            loopEnabled={loopEnabled}
            recordState={recordState}
            recordMode={recordMode}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            gridDivision={gridDivision}
            rate={rate}
            clockMode={clockMode}
            clockPrecision={clockPrecision}
            onPlay={onPlay}
            onStop={onStop}
            onGoToStart={onGoToStart}
            onGoToEnd={onGoToEnd}
            onToggleRecord={onToggleRecord}
            onSelectRecordMode={onSelectRecordMode}
            onToggleLoop={onToggleLoop}
            onSetTempo={onSetTempo}
            onSetTimeSignature={onSetTimeSignature}
            onClockModeChange={onClockModeChange}
            mixerOpen={mixerOpen}
            onToggleMixer={onToggleMixer}
            disabled={disabled}
          />
        </div>

        {/* ── Canvas — below transport ─────────────────────────────────────── */}
        <div className={styles.canvas}>

          {/* Annotation lanes (chords + lyrics) above the arrangement */}
          {hasAnnotations && (
            <div className={styles.annotationArea} aria-label="Annotation lanes">
              {chordItems.length > 0 && (
                <AnnotationLane
                  type="chords"
                  items={chordItems}
                  bpm={bpm}
                  pxPerBeat={pxPerBeat}
                  disabled={disabled}
                  onAdd={time => onAnnotationAdd?.('chords', time)}
                  onEdit={id => onAnnotationEdit?.('chords', id)}
                  onMove={(id, start) => onAnnotationMove?.('chords', id, start)}
                  onDelete={id => onAnnotationDelete?.('chords', id)}
                />
              )}
              {lyricItems.length > 0 && (
                <AnnotationLane
                  type="lyrics"
                  items={lyricItems}
                  bpm={bpm}
                  pxPerBeat={pxPerBeat}
                  disabled={disabled}
                  onAdd={time => onAnnotationAdd?.('lyrics', time)}
                  onEdit={id => onAnnotationEdit?.('lyrics', id)}
                  onMove={(id, start) => onAnnotationMove?.('lyrics', id, start)}
                  onDelete={id => onAnnotationDelete?.('lyrics', id)}
                />
              )}
            </div>
          )}

          {/* Main row: arrangement + optional right panel */}
          <div className={styles.mainRow}>

            {/* Arrangement fills the remaining space */}
            <div className={styles.arrangementArea}>
              <Arrangement
                tracks={tracks}
                bpm={bpm}
                numerator={numerator}
                denominator={denominator}
                pxPerBeat={pxPerBeat}
                division={division}
                durationSeconds={durationSeconds}
                playheadSeconds={playheadSeconds}
                getPlayheadSeconds={getPlayheadSeconds}
                playing={playing}
                recording={recording}
                cursorSeconds={cursorSeconds}
                selection={selection}
                focusedTrackId={focusedTrackId}
                inputOptions={inputOptions}
                showAllMeters={showAllMeters}
                disabled={disabled}
                detailPanel={detailPanel}
                onSelectTrack={onSelectTrack}
                onSeek={onSeek}
                onSelectRange={onSelectRange}
                onClearSelection={onClearSelection}
                onRenameTrack={onRenameTrack}
                onArmTrack={onArmTrack}
                onMuteTrack={onMuteTrack}
                onSoloTrack={onSoloTrack}
                onVolumeTrack={onVolumeTrack}
                onPanTrack={onPanTrack}
                onSelectInput={onSelectInput}
                onToggleChain={onToggleChain}
                onTogglePlugin={onTogglePlugin}
                onReorderPlugin={onReorderPlugin}
                onRemovePlugin={onRemovePlugin}
                onAddPlugin={onAddPlugin}
                onOpenPlugin={onOpenPlugin}
                onToggleFolder={onToggleFolder}
                onClipMove={onClipMove}
                onClipTrimStart={onClipTrimStart}
                onClipTrimEnd={onClipTrimEnd}
                onClipDelete={onClipDelete}
              />
            </div>

            {/* Right panel — comments / versions / ideas */}
            <div
              className={styles.rightPanel}
              data-open={String(rightPanelOpen)}
              aria-label={
                activeSection === 'comments' ? 'Comments panel'
                : activeSection === 'versions' ? 'Versions panel'
                : activeSection === 'ideas' ? 'Ideas panel'
                : undefined
              }
              role="complementary"
            >
              <div className={styles.rightPanelContent}>
                {activeSection === 'comments' && (
                  <CommentsPanel
                    comments={comments}
                    currentUserId={currentUserId}
                    onPost={onPostComment}
                    onReply={onReplyComment}
                    onResolve={onResolveComment}
                    onJumpTo={onJumpToComment}
                    onRecord={onRecordAudio}
                  />
                )}
                {activeSection === 'versions' && (
                  <Versions
                    versions={versions}
                    selected={versionsSelected}
                    diff={versionsDiff}
                    onSelect={onVersionSelect}
                    onCompare={onVersionCompare}
                    onRename={onVersionRename}
                    onRestore={onVersionRestore}
                  />
                )}
                {activeSection === 'ideas' && (
                  <IdeasLibrary
                    ideas={ideas}
                    onPlay={onIdeaPlay}
                    onDragToProject={onIdeaDragToProject}
                    onLabel={onIdeaLabel}
                    onDelete={onIdeaDelete}
                    appSyncUrl={ideasAppSyncUrl}
                    onGetApp={onGetApp}
                  />
                )}
              </div>
            </div>

            {/* Mixer overlay — absolute, covers arrangement area from bottom */}
            <div className={styles.mixerOverlay} aria-live="polite">
              <Mixer
                tracks={mixerChannels}
                master={mixerMaster}
                open={mixerOpen}
                onToggle={onToggleMixer}
                showAllMeters={showAllMeters}
                disabled={disabled}
                onArm={onMixerArm}
                onMute={onMixerMute}
                onSolo={onMixerSolo}
                onVolume={onMixerVolume}
                onPan={onMixerPan}
                onMasterMute={onMasterMute}
                onMasterSolo={onMasterSolo}
                onMasterVolume={onMasterVolume}
                onMasterPan={onMasterPan}
                onSelectTrack={onSelectTrack}
              />
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}
