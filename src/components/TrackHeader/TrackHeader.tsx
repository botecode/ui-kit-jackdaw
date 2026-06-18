// src/components/TrackHeader/TrackHeader.tsx
import { CSSProperties, useState, useRef } from 'react'
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
  track:           Track
  onRename:        (name: string) => void
  onArm:           () => void
  onMute:          () => void
  onSolo:          () => void
  onVolume:        (db: number) => void
  onPan:           (pan: number) => void
  onSelectInput:   (id: string) => void
  onToggleChain:   (next: boolean) => void
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (from: number, to: number) => void
  onRemovePlugin:  (id: string) => void
  onAddPlugin:     () => void
  onSelect:        () => void
  onToggleFolder?: () => void
  folderOpen?:     boolean
  mode?:           'writer' | 'producer'
  variant?:        'track' | 'folder'
  meterLevel?:     number
  meterLevelL?:    number
  meterLevelR?:    number
  inputOptions:    InputSelectOption[]
  anySoloActive?:  boolean
  disabled?:       boolean
}

// ── Shared scale (module-level to avoid recreating per render) ────────────────

const DB_SCALE = dbScale()

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  name:           string
  type:           'audio' | 'midi' | 'instrument'
  armed:          boolean
  inputId:        string | null
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  mode:           'writer' | 'producer'
  variant:        'track' | 'folder'
  folderOpen:     boolean
  inputOptions:   InputSelectOption[]
  disabled:       boolean
  onArm:          () => void
  onSelectInput:  (id: string) => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onToggleFolder: () => void
  onRename:       (name: string) => void  // used in Task 2
}

function TopBar({
  name, type, armed, inputId, plugins, chainEnabled,
  mode, variant, folderOpen, inputOptions, disabled,
  onArm, onSelectInput, onToggleChain, onTogglePlugin, onReorder,
  onRemovePlugin, onAddPlugin, onToggleFolder, onRename,
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
    committedRef.current = true  // prevent onBlur commit after cancel
    setEditing(false)
  }

  const inputVariant = mode === 'producer' && inputId === null ? 'field' : 'chip'

  const TypeGlyph =
    variant === 'folder' ? FolderSimple
    : type   === 'audio'  ? Waveform
    : type   === 'midi'   ? PianoKeys
    :                       MusicNote

  return (
    <div className={styles.topBar}>
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
          onDoubleClick={startEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit() }
          }}
        >
          {name}
        </span>
      )}
      {variant === 'folder' ? (
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
      ) : (
        <ArmButton
          armed={armed}
          onToggle={onArm}
          size="sm"
          disabled={disabled}
        />
      )}
      <div className={styles.cornerChips}>
        <InputSelect
          value={inputId}
          onChange={onSelectInput}
          options={inputOptions}
          variant={inputVariant}
          size="sm"
          disabled={disabled}
          aria-label="Audio input"
        />
        <FxChip
          plugins={plugins}
          chainEnabled={chainEnabled}
          onToggleChain={onToggleChain}
          onTogglePlugin={onTogglePlugin}
          onReorder={onReorder}
          onRemove={onRemovePlugin}
          onAdd={onAddPlugin}
          size="sm"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

// ── ControlStrip ──────────────────────────────────────────────────────────────

interface ControlStripProps {
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  pan:           number
  color:         string
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

function ControlStrip({
  muted, soloed, volumeDb, pan, color,
  meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onMute, onSolo, onVolume, onPan,
}: ControlStripProps) {
  return (
    <div className={styles.controlStrip}>
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
        aria-label="Volume"
      />
      <PanKnob
        pan={pan}
        onChange={onPan}
        color={color}
        size="sm"
        disabled={disabled}
      />
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
    </div>
  )
}

// ── FolderControlStrip ────────────────────────────────────────────────────────

interface FolderControlStripProps {
  muted:         boolean
  soloed:        boolean
  volumeDb:      number
  anySoloActive: boolean
  disabled:      boolean
  onMute:        () => void
  onSolo:        () => void
  onVolume:      (db: number) => void
}

function FolderControlStrip({
  muted, soloed, volumeDb, anySoloActive, disabled,
  onMute, onSolo, onVolume,
}: FolderControlStripProps) {
  return (
    <div className={styles.controlStrip}>
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
    </div>
  )
}

// ── TrackHeader ───────────────────────────────────────────────────────────────

export function TrackHeader({
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
}: TrackHeaderProps) {
  return (
    <div
      role="group"
      aria-label={track.name}
      className={styles.root}
      data-variant={variant}
      data-mode={mode}
      data-armed={track.armed || undefined}
      data-muted={track.muted || undefined}
      data-soloed={track.soloed || undefined}
      data-selected={track.selected || undefined}
      data-disabled={disabled || undefined}
      style={{ '--track-color': track.color } as CSSProperties}
      onClick={onSelect}
    >
      <div className={styles.keyline} aria-hidden />
      <TopBar
        name={track.name}
        type={track.type}
        armed={track.armed}
        inputId={track.inputId}
        plugins={track.plugins}
        chainEnabled={track.chainEnabled}
        mode={mode}
        variant={variant}
        folderOpen={folderOpen}
        inputOptions={inputOptions}
        disabled={disabled}
        onArm={onArm}
        onSelectInput={onSelectInput}
        onToggleChain={onToggleChain}
        onTogglePlugin={onTogglePlugin}
        onReorder={onReorder}
        onRemovePlugin={onRemovePlugin}
        onAddPlugin={onAddPlugin}
        onToggleFolder={onToggleFolder}
        onRename={onRename}
      />
      {variant === 'track' ? (
        <ControlStrip
          muted={track.muted}
          soloed={track.soloed}
          volumeDb={track.volumeDb}
          pan={track.pan}
          color={track.color}
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
      ) : (
        <FolderControlStrip
          muted={track.muted}
          soloed={track.soloed}
          volumeDb={track.volumeDb}
          anySoloActive={anySoloActive}
          disabled={disabled}
          onMute={onMute}
          onSolo={onSolo}
          onVolume={onVolume}
        />
      )}
    </div>
  )
}
