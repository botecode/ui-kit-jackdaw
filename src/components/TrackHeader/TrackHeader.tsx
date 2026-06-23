// src/components/TrackHeader/TrackHeader.tsx
import { CSSProperties, useState, useRef, useEffect } from 'react'
import {
  Waveform, PianoKeys, MusicNote, FolderSimple, CaretRight,
} from '@phosphor-icons/react'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter/Meter'
import { InputSelect } from '../InputSelect'
import type { InputSelectOption } from '../InputSelect'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import { useThemeComponent } from '../../theme/themeComponents'
import styles from './TrackHeader.module.css'

export type { FxPlugin, InputSelectOption }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Track {
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
  selected:     boolean
}

export interface TrackHeaderProps {
  track:              Track
  onRename:           (name: string) => void
  onArm:              () => void
  onMute:             () => void
  onSolo:             () => void
  onVolume:           (db: number) => void
  onPan:              (pan: number) => void
  onSelectInput:      (id: string) => void
  onToggleChain:      (next: boolean) => void
  onTogglePlugin:     (id: string, next: boolean) => void
  onReorder:          (from: number, to: number) => void
  onRemovePlugin:     (id: string) => void
  onAddPlugin:        () => void
  onOpenPlugin:       (id: string) => void
  onSelect:           () => void
  onToggleFolder?:    () => void
  folderOpen?:        boolean
  mode?:              'writer' | 'producer'
  variant?:           'track' | 'folder'
  meterLevel?:        number
  meterLevelL?:       number
  meterLevelR?:       number
  inputOptions:       InputSelectOption[]
  anySoloActive?:     boolean
  disabled?:          boolean
  /** Track has clipped — shows meter with latched clip indicator even when not armed/selected. */
  clipping?:          boolean
  /** Show meters on all tracks regardless of armed/selected/clipping state. */
  showAllMeters?:     boolean
  /** Controlled minimized state (collapses to compact row). When omitted, managed internally via localStorage. */
  minimized?:         boolean
  /** Fires when the minimized state changes via double-click. */
  onToggleMinimized?: (minimized: boolean) => void
}

// ── Shared scale (module-level to avoid recreating per render) ────────────────

const DB_SCALE = dbScale()

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsMinimizedKey(id: string) { return `jackdaw.track.${id}.minimized` }

function readMinimized(id: string): boolean {
  try { return localStorage.getItem(lsMinimizedKey(id)) === 'true' } catch { return false }
}

function writeMinimized(id: string, v: boolean) {
  try { localStorage.setItem(lsMinimizedKey(id), String(v)) } catch {}
}

// ── CollapsedRow ──────────────────────────────────────────────────────────────

interface CollapsedRowProps {
  name:         string
  type:         'audio' | 'midi' | 'instrument' | 'folder'
  showArm:      boolean
  armed:        boolean
  muted:        boolean
  soloed:       boolean
  clipping:     boolean
  meterLevel?:  number
  meterLevelL?: number
  meterLevelR?: number
}

function CollapsedRow({
  name, type, showArm, armed, muted, soloed, clipping,
  meterLevel, meterLevelL, meterLevelR,
}: CollapsedRowProps) {
  const TypeGlyph =
    type === 'folder'     ? FolderSimple
    : type === 'audio'    ? Waveform
    : type === 'midi'     ? PianoKeys
    :                       MusicNote

  const showMeter = clipping && (meterLevel !== undefined || meterLevelL !== undefined || meterLevelR !== undefined)

  return (
    <div className={styles.collapsedRow}>
      <TypeGlyph size={12} className={styles.glyph} aria-hidden />
      <span className={styles.collapsedName}>{name}</span>
      <div className={styles.stateDots} aria-hidden>
        {showArm && (
          <span className={styles.stateDot} data-dot="arm" data-active={armed || undefined}>R</span>
        )}
        <span className={styles.stateDot} data-dot="mute" data-active={muted || undefined}>M</span>
        <span className={styles.stateDot} data-dot="solo" data-active={soloed || undefined}>S</span>
      </div>
      {showMeter && (
        <Meter
          value={meterLevel}
          valueL={meterLevelL}
          valueR={meterLevelR}
          clipLatch
          orientation="vertical"
          size="sm"
          aria-label="Level"
        />
      )}
    </div>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  name:           string
  type:           'audio' | 'midi' | 'instrument'
  inputId:        string | null
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  mode:           'writer' | 'producer'
  variant:        'track' | 'folder'
  folderOpen:     boolean
  inputOptions:   InputSelectOption[]
  disabled:       boolean
  onSelectInput:  (id: string) => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onOpenPlugin:   (id: string) => void
  onToggleFolder: () => void
  onRename:       (name: string) => void
}

function TopBar({
  name, type, inputId, plugins, chainEnabled,
  mode, variant, folderOpen, inputOptions, disabled,
  onSelectInput, onToggleChain, onTogglePlugin, onReorder,
  onRemovePlugin, onAddPlugin, onOpenPlugin, onToggleFolder, onRename,
}: TopBarProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const originalRef = useRef(name)
  const committedRef = useRef(false)

  function startEdit() {
    committedRef.current = false
    originalRef.current = name
    setDraft(name)
    setEditing(true)
  }

  function commit() {
    if (committedRef.current) return
    committedRef.current = true
    const value = draft.trim() || originalRef.current
    onRename(value)
    setEditing(false)
  }

  function cancel() {
    committedRef.current = true
    setEditing(false)
  }

  const inputVariant = mode === 'producer' && inputId === null ? 'field' : 'chip'

  const TypeGlyph =
    variant === 'folder' ? FolderSimple
    : type   === 'audio'  ? Waveform
    : type   === 'midi'   ? PianoKeys
    :                       MusicNote

  return (
    <div className={styles.topBar} data-section="topbar">
      <TypeGlyph size={14} className={styles.glyph} aria-hidden />
      {editing ? (
        <input
          className={styles.nameInput}
          aria-label="Track name"
          value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); commit() }
            if (e.key === 'Escape') { e.preventDefault(); cancel() }
          }}
        />
      ) : (
        <span
          className={styles.name}
          tabIndex={0}
          data-no-collapse
          onDoubleClick={e => { e.stopPropagation(); startEdit() }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit() }
          }}
        >
          {name}
        </span>
      )}
      {variant === 'folder' && (
        <button
          className={styles.disclosure}
          aria-label={folderOpen ? `Collapse ${name}` : `Expand ${name}`}
          aria-expanded={folderOpen}
          data-open={folderOpen || undefined}
          onClick={onToggleFolder}
          disabled={disabled}
        >
          <CaretRight size={12} />
        </button>
      )}
      <div className={styles.cornerChips}>
        {variant !== 'folder' && (
          <InputSelect
            value={inputId}
            onChange={onSelectInput}
            options={inputOptions}
            variant={inputVariant}
            size="sm"
            disabled={disabled}
            aria-label="Audio input"
          />
        )}
        <FxChip
          plugins={plugins}
          chainEnabled={chainEnabled}
          onToggleChain={onToggleChain}
          onTogglePlugin={onTogglePlugin}
          onReorder={onReorder}
          onRemove={onRemovePlugin}
          onAdd={onAddPlugin}
          onOpenPlugin={onOpenPlugin}
          size="sm"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// ── ControlStrip ──────────────────────────────────────────────────────────────

interface ControlStripProps {
  armed:         boolean
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  pan:           number
  color:         string
  showMeter:     boolean
  meterLevel?:   number
  meterLevelL?:  number
  meterLevelR?:  number
  anySoloActive: boolean
  disabled:      boolean
  onArm:         () => void
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
  onPan:         (pan: number) => void
}

function ControlStrip({
  armed, muted, soloed, volumeDb, pan, color,
  showMeter, meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onArm, onMute, onSolo, onVolume, onPan,
}: ControlStripProps) {
  return (
    <div className={styles.controlStrip} data-section="strip">
      <div className={styles.rmsCluster}>
        <ArmButton
          armed={armed}
          onToggle={onArm}
          size="sm"
          disabled={disabled}
        />
        <MuteSoloToggle
          muted={muted}
          soloed={soloed}
          onToggleMute={onMute}
          onToggleSolo={onSolo}
          anySoloActive={anySoloActive}
          size="sm"
          disabled={disabled}
        />
      </div>
      <Fader
        orientation="vertical"
        scale={DB_SCALE}
        min={-60}
        max={6}
        value={volumeDb}
        onChange={onVolume}
        size="sm"
        disabled={disabled}
        aria-label="Volume"
      />
      <PanKnob
        pan={pan}
        onChange={onPan}
        color={color}
        size="sm"
        disabled={disabled}
      />
      {showMeter && (
        <Meter
          value={meterLevel}
          valueL={meterLevelL}
          valueR={meterLevelR}
          peakHold
          clipLatch
          ballistics
          orientation="vertical"
          size="sm"
          aria-label="Level"
        />
      )}
    </div>
  )
}

// ── FolderControlStrip ────────────────────────────────────────────────────────

interface FolderControlStripProps {
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  pan:           number
  color:         string
  showMeter:     boolean
  meterLevel?:   number
  meterLevelL?:  number
  meterLevelR?:  number
  anySoloActive: boolean
  disabled:      boolean
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
  onPan:         (pan: number) => void
}

function FolderControlStrip({
  muted, soloed, volumeDb, pan, color,
  showMeter, meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onMute, onSolo, onVolume, onPan,
}: FolderControlStripProps) {
  return (
    <div className={styles.controlStrip} data-section="strip">
      <MuteSoloToggle
        muted={muted}
        soloed={soloed}
        onToggleMute={onMute}
        onToggleSolo={onSolo}
        anySoloActive={anySoloActive}
        size="sm"
        disabled={disabled}
      />
      <Fader
        orientation="vertical"
        scale={DB_SCALE}
        min={-60}
        max={6}
        value={volumeDb}
        onChange={onVolume}
        size="sm"
        disabled={disabled}
        aria-label="Group volume"
      />
      <PanKnob
        pan={pan}
        onChange={onPan}
        color={color}
        size="sm"
        disabled={disabled}
      />
      {showMeter && (
        <Meter
          value={meterLevel}
          valueL={meterLevelL}
          valueR={meterLevelR}
          peakHold
          clipLatch
          ballistics
          orientation="vertical"
          size="sm"
          aria-label="Level"
        />
      )}
    </div>
  )
}

// ── TrackHeader ───────────────────────────────────────────────────────────────

function TrackHeaderBase({
  track,
  onRename,
  onArm,
  onMute,
  onSolo,
  onVolume,
  onPan,
  onSelectInput,
  onToggleChain,
  onTogglePlugin,
  onReorder,
  onRemovePlugin,
  onAddPlugin,
  onOpenPlugin,
  onSelect,
  onToggleFolder = () => {},
  folderOpen = false,
  mode = 'writer',
  variant = 'track',
  meterLevel,
  meterLevelL,
  meterLevelR,
  inputOptions,
  anySoloActive = false,
  disabled = false,
  clipping = false,
  showAllMeters = false,
  minimized,
  onToggleMinimized,
}: TrackHeaderProps) {
  const [minimizedInternal, setMinimizedInternal] = useState(() => readMinimized(track.id))
  const isMinimized = minimized ?? minimizedInternal

  useEffect(() => {
    if (minimized === undefined) {
      setMinimizedInternal(readMinimized(track.id))
    }
  }, [track.id, minimized])

  const showMeter = track.armed || track.selected || clipping || showAllMeters

  function handleDoubleClick(e: React.MouseEvent) {
    // Don't collapse when interacting with buttons, inputs, sliders, or the name field
    if ((e.target as HTMLElement).closest('button, input, [role="slider"], [data-no-collapse]')) return
    const next = !isMinimized
    if (minimized === undefined) {
      setMinimizedInternal(next)
      writeMinimized(track.id, next)
    }
    onToggleMinimized?.(next)
  }

  return (
    <div
      role="group"
      aria-label={isMinimized ? `${track.name}, minimized` : track.name}
      className={styles.root}
      data-variant={variant}
      data-mode={mode}
      data-armed={track.armed || undefined}
      data-muted={track.muted || undefined}
      data-soloed={track.soloed || undefined}
      data-selected={track.selected || undefined}
      data-clipping={clipping || undefined}
      data-disabled={disabled || undefined}
      data-minimized={isMinimized || undefined}
      style={{ '--track-color': track.color } as CSSProperties}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      <div className={styles.keyline} aria-hidden />

      {isMinimized ? (
        <CollapsedRow
          name={track.name}
          type={variant === 'folder' ? 'folder' : track.type}
          showArm={variant === 'track'}
          armed={track.armed}
          muted={track.muted}
          soloed={track.soloed}
          clipping={clipping}
          meterLevel={meterLevel}
          meterLevelL={meterLevelL}
          meterLevelR={meterLevelR}
        />
      ) : (
        <>
          <TopBar
            name={track.name}
            type={track.type}
            inputId={track.inputId}
            plugins={track.plugins}
            chainEnabled={track.chainEnabled}
            mode={mode}
            variant={variant}
            folderOpen={folderOpen}
            inputOptions={inputOptions}
            disabled={disabled}
            onSelectInput={onSelectInput}
            onToggleChain={onToggleChain}
            onTogglePlugin={onTogglePlugin}
            onReorder={onReorder}
            onRemovePlugin={onRemovePlugin}
            onAddPlugin={onAddPlugin}
            onOpenPlugin={onOpenPlugin}
            onToggleFolder={onToggleFolder}
            onRename={onRename}
          />
          {variant === 'track' ? (
            <ControlStrip
              armed={track.armed}
              muted={track.muted}
              soloed={track.soloed}
              volumeDb={track.volumeDb}
              pan={track.pan}
              color={track.color}
              showMeter={showMeter}
              meterLevel={meterLevel}
              meterLevelL={meterLevelL}
              meterLevelR={meterLevelR}
              anySoloActive={anySoloActive}
              disabled={disabled}
              onArm={onArm}
              onMute={onMute}
              onSolo={onSolo}
              onVolume={onVolume}
              onPan={onPan}
            />
          ) : (
            <FolderControlStrip
              muted={track.muted}
              soloed={track.soloed}
              volumeDb={track.volumeDb}
              pan={track.pan}
              color={track.color}
              showMeter={showMeter}
              meterLevel={meterLevel}
              meterLevelL={meterLevelL}
              meterLevelR={meterLevelR}
              anySoloActive={anySoloActive}
              disabled={disabled}
              onMute={onMute}
              onSolo={onSolo}
              onVolume={onVolume}
              onPan={onPan}
            />
          )}
        </>
      )}
    </div>
  )
}

// Theme-aware resolver: the active theme's variant (e.g. the Calm trackhead), or
// the base instrument-channel implementation above.
export function TrackHeader(props: TrackHeaderProps) {
  const Impl = useThemeComponent('TrackHeader', TrackHeaderBase)
  return <Impl {...props} />
}
