// src/components/IncomingManifest/IncomingManifest.tsx
import { Waveform, ArrowBendDownRight } from '@phosphor-icons/react'
import styles from './IncomingManifest.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────
// Typed against the raw-audio share contract (track.receive): v0 transports a
// track's clips (WAV) + name + clip start/length. So the receiver's "what's
// coming" is the track name, its clip count, and its total duration — plus the
// target song this take belongs to.

export interface IncomingManifestData {
  trackName: string
  clipCount: number
  durationSeconds: number
  /** The song this take is destined for. */
  songName: string
  /** The target song isn't present in this project — the receiver must import it first. */
  needsImport?: boolean
}

export interface IncomingManifestProps {
  manifest: IncomingManifestData
  size?: 'sm' | 'md'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────
// The receiver's confirm centerpiece: what's coming (track · clips · duration)
// and where it lands (→ Song). When the target song is missing the "where" row
// shifts to a calm amber attention state (NOT an error) prompting an import.
//
// Why this isn't a webpage: not a notification card with a grey "details" list.
// It's a recessed stage card — the take name reads in the display face, the meta
// in mono like a readout, and "missing song" is a single warm amber LED, the same
// attention language as the rest of the instrument, never a red error banner.

export function IncomingManifest({ manifest, size = 'md' }: IncomingManifestProps) {
  const { trackName, clipCount, durationSeconds, songName, needsImport } = manifest
  const clipLabel = `${clipCount} ${clipCount === 1 ? 'clip' : 'clips'}`

  return (
    <div className={styles.card} data-size={size}>
      <div className={styles.what}>
        <span className={styles.eyebrow}>Incoming</span>
        <div className={styles.trackRow}>
          <Waveform className={styles.trackIcon} size={18} weight="regular" aria-hidden="true" />
          <span className={styles.trackName}>{trackName}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>{clipLabel}</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.metaItem}>{formatDuration(durationSeconds)}</span>
        </div>
      </div>

      <div className={styles.where} data-needs-import={needsImport || undefined}>
        <ArrowBendDownRight className={styles.whereIcon} size={16} weight="regular" aria-hidden="true" />
        <span className={styles.whereLabel}>{songName}</span>
        {needsImport && (
          <span className={styles.missingHint}>
            <span className={styles.missingDot} aria-hidden="true" />
            Not in this project
          </span>
        )}
      </div>
    </div>
  )
}
