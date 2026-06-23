// src/components/TrackHeader/TrackHeader.calm.tsx
//
// Calm-theme variant of the trackhead. The base TrackHeader is an instrument
// channel: type glyph, input chip, FX console, R/M/S cluster, fader, pan knob,
// segmented meter — dense and capable. The Calm trackhead is the opposite mood:
// the track NAME is the hero (soft serif), surrounded by air, with only the
// essential controls present as quiet marks.
//
// Deliberate omissions (writerly / distraction-free, per the reference):
//   • Input select + FX console chrome are hidden — production routing lives in
//     the focused-track detail panel, not on every header (KIT-LEAD §6).
//   • Pan is omitted from the header for the same reason.
// The callbacks for those still exist on the props (shared contract) — Calm
// simply doesn't surface them here.
import { useRef, useState } from 'react'
import { Waveform, PianoKeys, MusicNote, FolderSimple, CaretRight } from '@phosphor-icons/react'
import { ArmButtonCalm } from '../ArmButton/ArmButton.calm'
import { MuteSoloToggleCalm } from '../MuteSoloToggle/MuteSoloToggle.calm'
import { FaderCalm } from '../Fader/Fader.calm'
import { MeterCalm } from '../Meter/Meter.calm'
import { dbScale } from '../Fader'
import type { TrackHeaderProps } from './TrackHeader'
import styles from './TrackHeader.calm.module.css'

const DB_SCALE = dbScale()

function lsMinimizedKey(id: string) { return `jackdaw.track.${id}.minimized` }
function readMinimized(id: string): boolean {
  try { return localStorage.getItem(lsMinimizedKey(id)) === 'true' } catch { return false }
}
function writeMinimized(id: string, v: boolean) {
  try { localStorage.setItem(lsMinimizedKey(id), String(v)) } catch {}
}

// ── Editable name (soft serif hero) ───────────────────────────────────────────

function NameField({ name, onRename }: { name: string; onRename: (n: string) => void }) {
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
    onRename(draft.trim() || originalRef.current)
    setEditing(false)
  }
  function cancel() {
    committedRef.current = true
    setEditing(false)
  }

  if (editing) {
    return (
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
    )
  }

  return (
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
  )
}

// ── TrackHeader (Calm) ────────────────────────────────────────────────────────

export function TrackHeaderCalm(props: TrackHeaderProps) {
  const {
    track, onRename, onArm, onMute, onSolo, onVolume, onSelect,
    onToggleFolder = () => {},
    folderOpen = false,
    variant = 'track',
    meterLevel, meterLevelL, meterLevelR,
    anySoloActive = false,
    disabled = false,
    clipping = false,
    showAllMeters = false,
    minimized,
    onToggleMinimized,
  } = props

  const [minimizedInternal, setMinimizedInternal] = useState(() => readMinimized(track.id))
  const isMinimized = minimized ?? minimizedInternal

  const showMeter = track.armed || track.selected || clipping || showAllMeters
  const isFolder = variant === 'folder'

  const TypeGlyph =
    isFolder            ? FolderSimple
    : track.type === 'audio' ? Waveform
    : track.type === 'midi'  ? PianoKeys
    :                          MusicNote

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
      data-variant={variant}
      data-armed={track.armed || undefined}
      data-muted={track.muted || undefined}
      data-soloed={track.soloed || undefined}
      data-selected={track.selected || undefined}
      data-clipping={clipping || undefined}
      data-disabled={disabled || undefined}
      data-minimized={isMinimized || undefined}
      style={{ '--track-color': track.color } as React.CSSProperties}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      <span className={styles.colorDot} aria-hidden />

      {isMinimized ? (
        <div className={styles.collapsedRow}>
          <TypeGlyph size={13} className={styles.glyph} aria-hidden />
          <span className={styles.collapsedName}>{track.name}</span>
          <div className={styles.stateMarks} aria-hidden>
            {!isFolder && <span data-mark="arm"  data-active={track.armed  || undefined}>R</span>}
            <span data-mark="mute" data-active={track.muted  || undefined}>M</span>
            <span data-mark="solo" data-active={track.soloed || undefined}>S</span>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.titleRow}>
            <TypeGlyph size={15} className={styles.glyph} aria-hidden />
            <NameField name={track.name} onRename={onRename} />
            {isFolder && (
              <button
                className={styles.disclosure}
                aria-label={folderOpen ? `Collapse ${track.name}` : `Expand ${track.name}`}
                aria-expanded={folderOpen}
                data-open={folderOpen || undefined}
                onClick={onToggleFolder}
                disabled={disabled}
              >
                <CaretRight size={13} />
              </button>
            )}
          </div>

          <div className={styles.controls} data-section="strip">
            <div className={styles.cluster}>
              {!isFolder && (
                <ArmButtonCalm armed={track.armed} onToggle={onArm} size="sm" disabled={disabled} />
              )}
              <MuteSoloToggleCalm
                muted={track.muted}
                soloed={track.soloed}
                onToggleMute={onMute}
                onToggleSolo={onSolo}
                anySoloActive={anySoloActive}
                orientation="inline"
                size="sm"
                disabled={disabled}
              />
            </div>

            <FaderCalm
              orientation="horizontal"
              scale={DB_SCALE}
              min={-60}
              max={6}
              value={track.volumeDb}
              onChange={onVolume}
              size="md"
              disabled={disabled}
              aria-label={isFolder ? 'Group volume' : 'Volume'}
            />

            {showMeter && (
              <MeterCalm
                value={meterLevel}
                valueL={meterLevelL}
                valueR={meterLevelR}
                orientation="vertical"
                size="sm"
                aria-label="Level"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
