// src/components/ChannelStrip/ChannelStrip.tsx
import { CSSProperties } from 'react'
import { Waveform, FolderSimple } from '@phosphor-icons/react'
import { ArmButton } from '../ArmButton'
import { MuteSoloToggle } from '../MuteSoloToggle'
import { Fader, dbScale } from '../Fader'
import { PanKnob } from '../PanKnob'
import { Meter } from '../Meter/Meter'
import styles from './ChannelStrip.module.css'

const DB_SCALE = dbScale()

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChannelStripProps {
  trackId: string
  name: string
  color: string
  kind: 'audio' | 'folder'
  armed: boolean
  muted: boolean
  soloed: boolean
  /** dBFS in [-60, 6] — maps to track.mixer db */
  volumeDb: number
  /** Pan in [-1, 1] — maps to track.mixer pan */
  pan: number
  isMaster?: boolean
  anySoloActive?: boolean
  /** Normalized 0–1 level readings from engine.frame meters */
  meterL?: number
  meterR?: number
  showMeter?: boolean
  selected?: boolean
  /** Channel is silenced by another channel's solo */
  dimmed?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  /** Called when ARM button clicked (audio tracks only) */
  onArm?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onMute: (e: React.MouseEvent<HTMLButtonElement>) => void
  onSolo: (e: React.MouseEvent<HTMLButtonElement>) => void
  onVolume: (db: number) => void
  onPan: (pan: number) => void
  onSelect?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChannelStrip({
  trackId,
  name,
  color,
  kind,
  armed,
  muted,
  soloed,
  volumeDb,
  pan,
  isMaster = false,
  anySoloActive = false,
  meterL,
  meterR,
  showMeter = false,
  selected = false,
  dimmed = false,
  disabled = false,
  size = 'md',
  onArm,
  onMute,
  onSolo,
  onVolume,
  onPan,
  onSelect,
}: ChannelStripProps) {
  const showActualMeter = showMeter && (meterL !== undefined || meterR !== undefined)
  const TypeGlyph = kind === 'folder' ? FolderSimple : Waveform
  const displayName = isMaster ? (name || 'MASTER') : name

  return (
    <div
      role="group"
      aria-label={`${displayName} channel`}
      className={styles.root}
      data-size={size}
      data-track-id={trackId}
      data-master={isMaster || undefined}
      data-kind={kind}
      data-armed={armed || undefined}
      data-muted={muted || undefined}
      data-soloed={soloed || undefined}
      data-selected={selected || undefined}
      data-dimmed={dimmed || undefined}
      data-disabled={disabled || undefined}
      style={{ '--channel-color': color } as CSSProperties}
      onClick={onSelect}
    >
      <div className={styles.keyline} aria-hidden />

      {/* Track name + kind glyph */}
      <div className={styles.nameRow}>
        {!isMaster && <TypeGlyph size={10} className={styles.nameGlyph} aria-hidden />}
        <span className={styles.name} title={displayName}>{displayName}</span>
      </div>

      {/* ARM / Mute / Solo */}
      <div className={styles.buttonCluster}>
        {!isMaster && onArm !== undefined && (
          <ArmButton
            armed={armed}
            onToggle={onArm}
            size="sm"
            disabled={disabled}
          />
        )}
        <MuteSoloToggle
          muted={muted}
          soloed={soloed}
          onToggleMute={onMute}
          onToggleSolo={onSolo}
          anySoloActive={anySoloActive}
          orientation="inline"
          size="sm"
          disabled={disabled}
        />
      </div>

      {/* Pan knob */}
      <div className={styles.panRow}>
        <PanKnob
          pan={pan}
          onChange={onPan}
          color={isMaster ? 'var(--accent)' : color}
          size="sm"
          disabled={disabled}
        />
      </div>

      {/* Fader + optional meter */}
      <div className={styles.faderArea}>
        {showActualMeter && (
          <Meter
            valueL={meterL}
            valueR={meterR}
            peakHold
            clipLatch
            ballistics
            orientation="vertical"
            size="sm"
            aria-label={`${displayName} level`}
          />
        )}
        <Fader
          orientation="vertical"
          scale={DB_SCALE}
          min={-60}
          max={6}
          value={volumeDb}
          onChange={onVolume}
          detent={{ value: 0, strength: 1 }}
          resetValue={0}
          size={size}
          disabled={disabled}
          aria-label={`${displayName} volume`}
        />
      </div>

      {/* dB readout */}
      <div className={styles.dbReadout} aria-hidden>
        {volumeDb <= -60 ? '−∞' : `${volumeDb >= 0 ? '+' : ''}${volumeDb.toFixed(1)}`}
      </div>
    </div>
  )
}
