// src/components/FocusedTrackDetailPanel/FocusedTrackDetailPanel.tsx
import { type CSSProperties, useCallback, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { TrackLane } from '../TrackLane'
import type { ClipInfo, ClipMoveIntent, ClipTrimIntent } from '../TrackLane'
import type { Division } from '../TimelineGrid'
import { Meter } from '../Meter/Meter'
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

// ── Slot color cycle (same palette as FxChip) ────────────────────────────────

const CHROMA_CYCLE = [
  '--chroma-red', '--chroma-orange', '--chroma-yellow', '--chroma-green',
  '--chroma-teal', '--chroma-blue', '--chroma-purple',
] as const

function slotColor(index: number): string {
  return `var(${CHROMA_CYCLE[index % CHROMA_CYCLE.length]})`
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

// ── MasterChainLed ────────────────────────────────────────────────────────────

interface MasterChainLedProps {
  chainEnabled: boolean
  plugins: FxPlugin[]
  onToggle: (next: boolean) => void
  disabled?: boolean
}

function MasterChainLed({ chainEnabled, plugins, onToggle, disabled }: MasterChainLedProps) {
  const someBypassed = chainEnabled && plugins.some(p => !p.enabled)
  const state =
    plugins.length === 0 ? 'off'
    : !chainEnabled      ? 'off'
    : someBypassed       ? 'partial'
    :                      'active'
  const ariaChecked: boolean | 'mixed' =
    plugins.length === 0 ? false
    : !chainEnabled      ? false
    : someBypassed       ? 'mixed'
    :                      true

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={ariaChecked}
      aria-label="FX chain"
      data-state={state}
      className={styles.masterChainLed}
      onClick={() => onToggle(!chainEnabled)}
      disabled={disabled}
    />
  )
}

// ── InlinePluginRow ───────────────────────────────────────────────────────────

interface InlinePluginRowProps {
  plugin: FxPlugin
  index: number
  total: number
  onToggle: (id: string, next: boolean) => void
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
  onOpen: (id: string) => void
  onAnnounce: (msg: string) => void
  disabled?: boolean
}

function InlinePluginRow({
  plugin, index, total, onToggle, onMove, onRemove, onOpen, onAnnounce, disabled,
}: InlinePluginRowProps) {
  return (
    <div
      className={styles.pluginRow}
      data-bypassed={!plugin.enabled || undefined}
      style={{ '--slot-color': slotColor(index) } as CSSProperties}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={plugin.enabled}
        aria-label={plugin.name}
        className={styles.pluginLed}
        onClick={() => onToggle(plugin.id, !plugin.enabled)}
        disabled={disabled}
      />
      <button
        type="button"
        className={styles.pluginName}
        aria-label={`Open ${plugin.name}`}
        onClick={() => onOpen(plugin.id)}
        disabled={disabled}
      >
        {plugin.name}
      </button>
      <button
        type="button"
        className={styles.pluginMoveBtn}
        aria-label={`Move ${plugin.name} up`}
        disabled={disabled || index === 0}
        onClick={() => {
          onMove(index, index - 1)
          onAnnounce(`${plugin.name} moved to position ${index} of ${total}`)
        }}
      >↑</button>
      <button
        type="button"
        className={styles.pluginMoveBtn}
        aria-label={`Move ${plugin.name} down`}
        disabled={disabled || index === total - 1}
        onClick={() => {
          onMove(index, index + 1)
          onAnnounce(`${plugin.name} moved to position ${index + 2} of ${total}`)
        }}
      >↓</button>
      <button
        type="button"
        className={styles.pluginRemoveBtn}
        aria-label={`Remove ${plugin.name}`}
        onClick={() => onRemove(plugin.id)}
        disabled={disabled}
      >×</button>
    </div>
  )
}

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
  const [announcement, setAnnouncement] = useState('')
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

          {/* Right: FX chain (inline) + routing */}
          <div className={styles.rightCol}>

            {/* ── FX Chain — inline plugin list ──────────────────────────── */}
            <Panel
              title="FX Chain"
              tone="stage"
              padding="sm"
              headerLead={
                <MasterChainLed
                  chainEnabled={chainEnabled}
                  plugins={plugins}
                  onToggle={onToggleChain}
                  disabled={disabled}
                />
              }
            >
              <div
                className={styles.pluginList}
                data-chain-enabled={chainEnabled || undefined}
              >
                {plugins.length === 0 ? (
                  <p className={styles.pluginEmpty}>No effects yet — add one.</p>
                ) : (
                  plugins.map((p, i) => (
                    <InlinePluginRow
                      key={p.id}
                      plugin={p}
                      index={i}
                      total={plugins.length}
                      onToggle={onTogglePlugin}
                      onMove={onReorderPlugin}
                      onRemove={onRemovePlugin}
                      onOpen={onOpenPlugin}
                      onAnnounce={setAnnouncement}
                      disabled={disabled}
                    />
                  ))
                )}
                <button
                  type="button"
                  className={styles.pluginAddBtn}
                  onClick={onAddPlugin}
                  disabled={disabled}
                >+ Add plugin…</button>
              </div>
              <div className={styles.srAnnounce} aria-live="polite" aria-atomic="true">
                {announcement}
              </div>
            </Panel>

            {/* ── Routing — sidechain · phase · automation ────────────────── */}
            <Panel title="Routing" tone="outlined" padding="sm">
              <AdvancedSlot
                label="Sidechain"
                description="Route a sidechain source to this track's compressors"
              />
              <div className={`${styles.advancedSlot} ${styles.advancedPhaseRow}`}>
                <div className={styles.phaseTextGroup}>
                  <span className={styles.slotLabel}>Phase</span>
                  <span className={styles.slotDesc}>Flip polarity on the input signal</span>
                </div>
                <PhaseInvert
                  inverted={track.phaseInverted ?? false}
                  onToggle={onTogglePhase ?? (() => {})}
                  size="sm"
                  disabled={disabled}
                />
              </div>
              <AdvancedSlot
                label="Automation"
                description="Automate this track's fader, pan, and FX sends"
              />
            </Panel>

          </div>
        </div>
      </div>
    </section>
  )
}
