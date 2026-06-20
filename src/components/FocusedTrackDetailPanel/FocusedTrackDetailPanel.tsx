// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx
import { type CSSProperties, useCallback, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { TrackLane } from '../TrackLane'
import type { ClipInfo, ClipMoveIntent, ClipTrimIntent } from '../TrackLane'
import type { Division } from '../TimelineGrid'
import { Meter } from '../Meter/Meter'
import { FxChip } from '../FxChip'
import type { FxPlugin } from '../FxChip'
import { Panel } from '../Panel'
import { Fader, dbScale } from '../Fader'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { PanKnob } from '../PanKnob'
import { PhaseInvert } from '../PhaseInvert'
import styles from './FocusedTrackDetailPanel.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const HEIGHT_KEY = 'jackdaw.detail.height'
const HEIGHT_MIN = 120

function storeHeight(h: number) {
  try { localStorage.setItem(HEIGHT_KEY, String(h)) } catch { /* ignore */ }
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FocusedTrackDetailPanelProps {
  track: {
    id: string
    name: string
    color: string
    kind: 'audio' | 'folder'
    armed: boolean
    muted: boolean
    soloed: boolean
    volumeDb: number
    pan: number
    phaseInverted?: boolean
  }
  clips: ClipInfo[]
  plugins: FxPlugin[]
  chainEnabled: boolean
  pxPerBeat: number
  bpm: number
  numerator: number
  denominator: number
  division: Division
  meterValueL?: number
  meterValueR?: number
  height: number
  onResize: (height: number) => void
  open: boolean
  onClose: () => void
  onClipMove?: (intent: ClipMoveIntent) => void
  onClipTrimStart?: (intent: ClipTrimIntent) => void
  onClipTrimEnd?: (intent: ClipTrimIntent) => void
  onClipDelete?: (clipId: string) => void
  onToggleChain: (next: boolean) => void
  onTogglePlugin: (id: string, next: boolean) => void
  onReorderPlugin: (from: number, to: number) => void
  onRemovePlugin: (id: string) => void
  onAddPlugin: () => void
  onOpenPlugin: (id: string) => void
  onTogglePhase?: (next: boolean) => void
  anySoloActive?: boolean
  disabled?: boolean
}

// ── DB scale singleton ────────────────────────────────────────────────────────

const DB_SCALE = dbScale()

// ── AdvancedSlot ─────────────────────────────────────────────────────────────

interface AdvancedSlotProps { label: string; description: string }

function AdvancedSlot({ label, description }: AdvancedSlotProps) {
  return (
    <div className={styles.advancedSlot} aria-label={label}>
      <span className={styles.slotLabel}>{label}</span>
      <span className={styles.slotDesc}>{description}</span>
    </div>
  )
}

// ── FocusedTrackDetailPanel ───────────────────────────────────────────────────

export function FocusedTrackDetailPanel({
  track,
  clips,
  plugins,
  chainEnabled,
  pxPerBeat,
  bpm,
  numerator,
  denominator,
  division,
  meterValueL,
  meterValueR,
  height,
  onResize,
  open,
  onClose,
  onClipMove,
  onClipTrimStart,
  onClipTrimEnd,
  onClipDelete,
  onToggleChain,
  onTogglePlugin,
  onReorderPlugin,
  onRemovePlugin,
  onAddPlugin,
  onOpenPlugin,
  anySoloActive = false,
  disabled = false,
  onTogglePhase,
}: FocusedTrackDetailPanelProps) {
  const dragRef   = useRef<{ startY: number; startH: number } | null>(null)
  const [resizing, setResizing] = useState(false)

  // Lane height = panel body minus header (40px) and divider (8px) and body padding (2×8px)
  const laneHeight = Math.max(64, height - 40 - 8 - 16)

  // ── Divider drag ──────────────────────────────────────────────────────────

  const handleDividerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, startH: height }
    setResizing(true)
  }, [disabled, height])

  const handleDividerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dy   = dragRef.current.startY - e.clientY
    const maxH = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 800
    const newH = Math.max(HEIGHT_MIN, Math.min(maxH, dragRef.current.startH + dy))
    onResize(newH)
  }, [onResize])

  const handleDividerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dy   = dragRef.current.startY - e.clientY
    const maxH = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 800
    const newH = Math.max(HEIGHT_MIN, Math.min(maxH, dragRef.current.startH + dy))
    storeHeight(newH)
    onResize(newH)
    dragRef.current = null
    setResizing(false)
  }, [onResize])

  function handleDividerKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const maxH = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.75) : 800
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newH = Math.min(maxH, height + 20)
      onResize(newH); storeHeight(newH)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newH = Math.max(HEIGHT_MIN, height - 20)
      onResize(newH); storeHeight(newH)
    }
  }

  return (
    <section
      className={styles.root}
      data-open={open || undefined}
      data-resizing={resizing || undefined}
      data-disabled={disabled || undefined}
      aria-label={`${track.name} inspector`}
      style={{ '--panel-height': `${height}px` } as CSSProperties}
    >
      {/* .inner is the grid child — min-height:0 lets 0fr collapse it */}
      <div
        className={styles.inner}
        style={{ '--track-color': track.color } as CSSProperties}
      >
        {/* ── Resize divider ─────────────────────────────────────────────── */}
        <div
          className={styles.divider}
          role="separator"
          aria-label="Resize panel"
          aria-orientation="horizontal"
          tabIndex={0}
          onPointerDown={handleDividerDown}
          onPointerMove={handleDividerMove}
          onPointerUp={handleDividerUp}
          onPointerCancel={handleDividerUp}
          onKeyDown={handleDividerKey}
        />

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.keyline} aria-hidden />
          <h2 className={styles.trackName}>{track.name}</h2>
          <div className={styles.headerControls}>
            <ArmButton
              armed={track.armed}
              onToggle={() => {}}
              size="sm"
              disabled={disabled}
            />
            <MuteSoloToggle
              muted={track.muted}
              soloed={track.soloed}
              onToggleMute={() => {}}
              onToggleSolo={() => {}}
              anySoloActive={anySoloActive}
              size="sm"
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close inspector"
            onClick={onClose}
            disabled={disabled}
          >
            <X size={14} weight="bold" aria-hidden />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className={styles.body}>

          {/* Left: Meter + clip lane + mixer strip */}
          <div className={styles.leftCol}>
            <div className={styles.meterWell}>
              <Meter
                valueL={meterValueL ?? -60}
                valueR={meterValueR ?? -60}
                peakHold
                clipLatch
                ballistics
                orientation="vertical"
                size="md"
                aria-label="Level"
              />
            </div>

            <div className={styles.laneArea}>
              {clips.length === 0 ? (
                <div className={styles.emptyLane}>
                  <span className={styles.emptyMsg}>No clips</span>
                </div>
              ) : (
                <TrackLane
                  trackId={track.id}
                  clips={clips}
                  bpm={bpm}
                  numerator={numerator}
                  denominator={denominator}
                  pxPerBeat={pxPerBeat}
                  division={division}
                  height={laneHeight}
                  selected
                  disabled={disabled}
                  onClipMove={onClipMove}
                  onClipTrimStart={onClipTrimStart}
                  onClipTrimEnd={onClipTrimEnd}
                  onClipDelete={onClipDelete}
                />
              )}
            </div>

            <div className={styles.mixerStrip}>
              <Fader
                orientation="vertical"
                scale={DB_SCALE}
                min={-60}
                max={6}
                value={track.volumeDb}
                onChange={() => {}}
                size="sm"
                disabled={disabled}
                aria-label="Volume"
              />
              <PanKnob
                pan={track.pan}
                onChange={() => {}}
                color={track.color}
                size="sm"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Right: FX chain + advanced slots */}
          <div className={styles.rightCol}>
            <Panel title="FX Chain" tone="stage" padding="sm">
              <FxChip
                plugins={plugins}
                chainEnabled={chainEnabled}
                onToggleChain={onToggleChain}
                onTogglePlugin={onTogglePlugin}
                onReorder={onReorderPlugin}
                onRemove={onRemovePlugin}
                onAdd={onAddPlugin}
                onOpenPlugin={onOpenPlugin}
                size="md"
                disabled={disabled}
              />
            </Panel>

            <Panel title="Advanced" tone="outlined" padding="sm">
              <AdvancedSlot
                label="Sidechain"
                description="Route a sidechain source to this track's compressors"
              />
              <div className={`${styles.advancedSlot} ${styles.advancedPhaseRow}`}>
                <span className={styles.slotLabel}>Phase</span>
                <PhaseInvert
                  inverted={track.phaseInverted ?? false}
                  onToggle={onTogglePhase ?? (() => {})}
                  size="sm"
                  disabled={disabled}
                />
              </div>
              <AdvancedSlot
                label="Automation"
                description="Write and read automation lanes for this track"
              />
              <AdvancedSlot
                label="Routing"
                description="Assign this track to an aux send or effect return"
              />
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}
