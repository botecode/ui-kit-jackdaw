// src/components/Mixer/Mixer.tsx
import { useMemo } from 'react'
import { ChannelStrip } from '../ChannelStrip'
import styles from './Mixer.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MixerChannel {
  trackId: string
  name: string
  color: string
  /** 'folder' renders a group strip (wider keyline, recessed bg, no ARM) */
  kind: 'audio' | 'folder'
  armed: boolean
  muted: boolean
  soloed: boolean
  /** dBFS [-60, 6] — maps to track.mixer db */
  volumeDb: number
  /** Pan [-1, 1] — maps to track.mixer pan */
  pan: number
  meterL?: number
  meterR?: number
  selected?: boolean
}

export interface MixerMaster {
  name?: string
  muted: boolean
  soloed: boolean
  /** dBFS [-60, 6] */
  volumeDb: number
  /** Pan [-1, 1] */
  pan: number
  meterL?: number
  meterR?: number
}

export interface MixerProps {
  tracks: MixerChannel[]
  master: MixerMaster
  /** Controls panel visibility — consumer places the panel in the layout */
  open: boolean
  onToggle: (open: boolean) => void

  /** Show meters on all strips (default: meters only when armed / clipping) */
  showAllMeters?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'

  /** track.arm command — only available for audio kind tracks */
  onArm?: (trackId: string) => void
  /** track.setMute */
  onMute: (trackId: string, muted: boolean) => void
  /** track.setSolo */
  onSolo: (trackId: string, soloed: boolean) => void
  /** track.setVolume */
  onVolume: (trackId: string, db: number) => void
  /** track.setPan */
  onPan: (trackId: string, pan: number) => void

  onMasterMute?: (muted: boolean) => void
  onMasterSolo?: (soloed: boolean) => void
  onMasterVolume: (db: number) => void
  onMasterPan: (pan: number) => void

  onSelectTrack?: (trackId: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Mixer({
  tracks,
  master,
  open,
  showAllMeters = false,
  disabled = false,
  size = 'md',
  onArm,
  onMute,
  onSolo,
  onVolume,
  onPan,
  onMasterMute,
  onMasterSolo,
  onMasterVolume,
  onMasterPan,
  onSelectTrack,
}: MixerProps) {
  const anySoloActive = useMemo(
    () => master.soloed || tracks.some(t => t.soloed),
    [master.soloed, tracks],
  )

  if (!open) return null

  return (
    <div
      className={styles.root}
      data-size={size}
      role="region"
      aria-label="Mixer"
    >
      {/* Master strip — pinned left */}
      <div className={styles.masterAnchor}>
        <ChannelStrip
          trackId="master"
          name={master.name || 'Master'}
          color="var(--accent)"
          kind="audio"
          armed={false}
          muted={master.muted}
          soloed={master.soloed}
          volumeDb={master.volumeDb}
          pan={master.pan}
          isMaster
          anySoloActive={anySoloActive}
          meterL={master.meterL}
          meterR={master.meterR}
          showMeter={showAllMeters || master.meterL !== undefined}
          disabled={disabled}
          size={size}
          onMute={e => { e.stopPropagation(); onMasterMute?.(!master.muted) }}
          onSolo={e => { e.stopPropagation(); onMasterSolo?.(!master.soloed) }}
          onVolume={onMasterVolume}
          onPan={onMasterPan}
        />
      </div>

      <div className={styles.divider} aria-hidden />

      {/* Track strips — horizontally scrollable */}
      <div
        className={styles.scrollArea}
        role="list"
        aria-label="Track channels"
      >
        {tracks.map(track => {
          const dimmed = anySoloActive && !track.soloed
          const showMeter = showAllMeters || track.armed || track.meterL !== undefined

          return (
            <div key={track.trackId} role="listitem" className={styles.stripSlot}>
              <ChannelStrip
                trackId={track.trackId}
                name={track.name}
                color={track.color}
                kind={track.kind}
                armed={track.armed}
                muted={track.muted}
                soloed={track.soloed}
                volumeDb={track.volumeDb}
                pan={track.pan}
                anySoloActive={anySoloActive}
                meterL={track.meterL}
                meterR={track.meterR}
                showMeter={showMeter}
                selected={track.selected}
                dimmed={dimmed}
                disabled={disabled}
                size={size}
                onArm={
                  track.kind === 'audio' && onArm
                    ? e => { e.stopPropagation(); onArm(track.trackId) }
                    : undefined
                }
                onMute={e => { e.stopPropagation(); onMute(track.trackId, !track.muted) }}
                onSolo={e => { e.stopPropagation(); onSolo(track.trackId, !track.soloed) }}
                onVolume={db => onVolume(track.trackId, db)}
                onPan={p => onPan(track.trackId, p)}
                onSelect={onSelectTrack ? () => onSelectTrack(track.trackId) : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
