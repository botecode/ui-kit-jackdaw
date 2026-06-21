// src/components/ReturnTrackHeader/ReturnTrackHeader.tsx
import { CSSProperties, useState, useRef, useEffect } from 'react'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter/Meter'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import styles from './ReturnTrackHeader.module.css'

export type { FxPlugin }

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReturnTrack {
  id:           string
  name:         string
  color:        string
  kind:         'return'
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
  /** Read-only list of source track names that send to this return. */
  feedSources?: string[]
}

export interface ReturnTrackHeaderProps {
  track:              ReturnTrack
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

function lsMinimizedKey(id: string) { return `jackdaw.return.${id}.minimized` }

function readMinimized(id: string): boolean {
  try { return localStorage.getItem(lsMinimizedKey(id)) === 'true' } catch { return false }
}

function writeMinimized(id: string, v: boolean) {
  try { localStorage.setItem(lsMinimizedKey(id), String(v)) } catch {}
}

// ── ReturnCollapsedRow ────────────────────────────────────────────────────────

interface ReturnCollapsedRowProps {
  name:         string
  muted:        boolean
  soloed:       boolean
  clipping:     boolean
  meterLevel?:  number
  meterLevelL?: number
  meterLevelR?: number
}

function ReturnCollapsedRow({
  name, muted, soloed, clipping,
  meterLevel, meterLevelL, meterLevelR,
}: ReturnCollapsedRowProps) {
  const showMeter = clipping && (meterLevel !== undefined || meterLevelL !== undefined || meterLevelR !== undefined)

  return (
    <div className={styles.collapsedRow}>
      <span className={styles.rtnBadgeSm} aria-hidden>RTN</span>
      <span className={styles.collapsedName}>{name}</span>
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

// ── ReturnTopBar ──────────────────────────────────────────────────────────────

interface ReturnTopBarProps {
  name:           string
  plugins:        FxPlugin[]
  chainEnabled:   boolean
  disabled:       boolean
  onRename:       (name: string) => void
  onToggleChain:  (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorder:      (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin:    () => void
  onOpenPlugin:   (id: string) => void
}

function ReturnTopBar({
  name, plugins, chainEnabled, disabled,
  onRename, onToggleChain, onTogglePlugin, onReorder,
  onRemovePlugin, onAddPlugin, onOpenPlugin,
}: ReturnTopBarProps) {
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
      <span className={styles.rtnBadge} aria-hidden>RTN</span>
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

// ── ReturnControlStrip ────────────────────────────────────────────────────────

interface ReturnControlStripProps {
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

function ReturnControlStrip({
  muted, soloed, volumeDb, pan, color,
  showMeter, meterLevel, meterLevelL, meterLevelR,
  anySoloActive, disabled,
  onMute, onSolo, onVolume, onPan,
}: ReturnControlStripProps) {
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
        aria-label="Return volume"
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

// ── FedByRow ──────────────────────────────────────────────────────────────────

interface FedByRowProps {
  sources: string[]
}

function FedByRow({ sources }: FedByRowProps) {
  if (sources.length === 0) return null
  return (
    <div
      className={styles.fedByRow}
      aria-label={`Fed by: ${sources.join(', ')}`}
    >
      <span className={styles.fedByLabel} aria-hidden>←</span>
      <span className={styles.fedBySources} aria-hidden>
        {sources.join(', ')}
      </span>
    </div>
  )
}

// ── ReturnTrackHeader ─────────────────────────────────────────────────────────

export function ReturnTrackHeader({
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
  meterLevel,
  meterLevelL,
  meterLevelR,
  anySoloActive = false,
  disabled = false,
  clipping = false,
  showAllMeters = false,
  minimized,
  onToggleMinimized,
}: ReturnTrackHeaderProps) {
  const [minimizedInternal, setMinimizedInternal] = useState(() => readMinimized(track.id))
  const isMinimized = minimized ?? minimizedInternal

  const showMeter = track.selected || clipping || showAllMeters

  useEffect(() => {
    if (minimized === undefined) {
      setMinimizedInternal(readMinimized(track.id))
    }
  }, [track.id, minimized])

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
      data-variant="return"
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
        <ReturnCollapsedRow
          name={track.name}
          muted={track.muted}
          soloed={track.soloed}
          clipping={clipping}
          meterLevel={meterLevel}
          meterLevelL={meterLevelL}
          meterLevelR={meterLevelR}
        />
      ) : (
        <>
          <ReturnTopBar
            name={track.name}
            plugins={track.plugins}
            chainEnabled={track.chainEnabled}
            disabled={disabled}
            onRename={onRename}
            onToggleChain={onToggleChain}
            onTogglePlugin={onTogglePlugin}
            onReorder={onReorder}
            onRemovePlugin={onRemovePlugin}
            onAddPlugin={onAddPlugin}
            onOpenPlugin={onOpenPlugin}
          />
          <ReturnControlStrip
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
          {track.feedSources && track.feedSources.length > 0 && (
            <FedByRow sources={track.feedSources} />
          )}
        </>
      )}
    </div>
  )
}
