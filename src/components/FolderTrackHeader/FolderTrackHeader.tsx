// src/components/FolderTrackHeader/FolderTrackHeader.tsx
import { CSSProperties, useState, useRef, useEffect } from 'react'
import { FolderSimple, CaretRight } from '@phosphor-icons/react'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter/Meter'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import styles from './FolderTrackHeader.module.css'

export type { FxPlugin }

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FolderTrack {
  id:           string
  name:         string
  color:        string
  parentId:     string | null
  childCount:   number
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
}

export interface FolderTrackHeaderProps {
  track:              FolderTrack
  onRename:           (name: string) => void
  onMute:             () => void
  onSolo:             () => void
  onVolume:           (db: number) => void
  onPan:              (pan: number) => void
  onToggleChain:      (next: boolean) => void
  onTogglePlugin:     (id: string, next: boolean) => void
  onReorder:          (from: number, to: number) => void
  onRemovePlugin:     (id: string) => void
  onAddPlugin:        () => void
  onOpenPlugin:       (id: string) => void
  onSelect:           () => void
  onToggleCollapse?:  (collapsed: boolean) => void
  meterLevel?:        number
  meterLevelL?:       number
  meterLevelR?:       number
  anySoloActive?:     boolean
  disabled?:          boolean
  clipping?:          boolean
  showAllMeters?:     boolean
  /** Controlled minimized state (collapses to compact row). When omitted, managed internally via localStorage. */
  minimized?:         boolean
  /** Fires when the minimized state changes via double-click. */
  onToggleMinimized?: (minimized: boolean) => void
}

// ── Shared scale + localStorage helpers ───────────────────────────────────────

const DB_SCALE = dbScale()

// Open/close (show/hide children)
function lsKey(id: string) { return `jackdaw.folder.${id}.open` }

function readOpen(id: string): boolean {
  try {
    const val = localStorage.getItem(lsKey(id))
    return val === null ? true : val !== 'false'
  } catch { return true }
}

function writeOpen(id: string, open: boolean) {
  try { localStorage.setItem(lsKey(id), String(open)) } catch {}
}

// Minimized (compact row height)
function lsMinimizedKey(id: string) { return `jackdaw.folder.${id}.minimized` }

function readMinimized(id: string): boolean {
  try { return localStorage.getItem(lsMinimizedKey(id)) === 'true' } catch { return false }
}

function writeMinimized(id: string, v: boolean) {
  try { localStorage.setItem(lsMinimizedKey(id), String(v)) } catch {}
}

// ── FolderCollapsedRow ────────────────────────────────────────────────────────

interface FolderCollapsedRowProps {
  name:         string
  childCount:   number
  muted:        boolean
  soloed:       boolean
  clipping:     boolean
  meterLevel?:  number
  meterLevelL?: number
  meterLevelR?: number
}

function FolderCollapsedRow({
  name, childCount, muted, soloed, clipping,
  meterLevel, meterLevelL, meterLevelR,
}: FolderCollapsedRowProps) {
  const showMeter = clipping && (meterLevel !== undefined || meterLevelL !== undefined || meterLevelR !== undefined)

  return (
    <div className={styles.collapsedRow}>
      <FolderSimple size={12} className={styles.glyph} aria-hidden />
      <span className={styles.collapsedName}>{name}</span>
      {childCount > 0 && (
        <span className={styles.childCount} aria-hidden>{childCount}</span>
      )}
      <div className={styles.stateDots} aria-hidden>
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

// ── FolderTopBar ──────────────────────────────────────────────────────────────

interface FolderTopBarProps {
  name:           string
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  open:           boolean
  disabled:       boolean
  onRename:       (name: string) => void
  onToggleOpen:   () => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onOpenPlugin:   (id: string) => void
}

function FolderTopBar({
  name, plugins, chainEnabled, open, disabled,
  onRename, onToggleOpen,
  onToggleChain, onTogglePlugin, onReorder, onRemovePlugin, onAddPlugin, onOpenPlugin,
}: FolderTopBarProps) {
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

  return (
    <div className={styles.topBar} data-section="topbar">
      <FolderSimple size={16} className={styles.glyph} aria-hidden />
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
      <button
        className={styles.disclosure}
        aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
        aria-expanded={open}
        data-open={open || undefined}
        onClick={onToggleOpen}
        disabled={disabled}
      >
        <CaretRight size={12} />
      </button>
      <div className={styles.cornerChips}>
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

// ── FolderTrackHeader ─────────────────────────────────────────────────────────

export function FolderTrackHeader({
  track,
  onRename,
  onMute,
  onSolo,
  onVolume,
  onPan,
  onToggleChain,
  onTogglePlugin,
  onReorder,
  onRemovePlugin,
  onAddPlugin,
  onOpenPlugin,
  onSelect,
  onToggleCollapse,
  meterLevel,
  meterLevelL,
  meterLevelR,
  anySoloActive = false,
  disabled = false,
  clipping = false,
  showAllMeters = false,
  minimized,
  onToggleMinimized,
}: FolderTrackHeaderProps) {
  const [open, setOpen] = useState(() => readOpen(track.id))
  const [minimizedInternal, setMinimizedInternal] = useState(() => readMinimized(track.id))
  const isMinimized = minimized ?? minimizedInternal

  const showMeter = track.selected || clipping || showAllMeters

  useEffect(() => {
    setOpen(readOpen(track.id))
    if (minimized === undefined) {
      setMinimizedInternal(readMinimized(track.id))
    }
  }, [track.id, minimized])

  function handleToggleOpen() {
    const next = !open
    setOpen(next)
    writeOpen(track.id, next)
    onToggleCollapse?.(!next)
  }

  function handleDoubleClick(e: React.MouseEvent) {
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
      data-variant="folder"
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
        <FolderCollapsedRow
          name={track.name}
          childCount={track.childCount}
          muted={track.muted}
          soloed={track.soloed}
          clipping={clipping}
          meterLevel={meterLevel}
          meterLevelL={meterLevelL}
          meterLevelR={meterLevelR}
        />
      ) : (
        <>
          <FolderTopBar
            name={track.name}
            plugins={track.plugins}
            chainEnabled={track.chainEnabled}
            open={open}
            disabled={disabled}
            onRename={onRename}
            onToggleOpen={handleToggleOpen}
            onToggleChain={onToggleChain}
            onTogglePlugin={onTogglePlugin}
            onReorder={onReorder}
            onRemovePlugin={onRemovePlugin}
            onAddPlugin={onAddPlugin}
            onOpenPlugin={onOpenPlugin}
          />
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
        </>
      )}
    </div>
  )
}
