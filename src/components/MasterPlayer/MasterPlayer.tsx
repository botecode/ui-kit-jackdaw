// src/components/MasterPlayer/MasterPlayer.tsx
import { Play, Pause, SkipBack, SkipForward, PencilSimple, MusicNote } from '@phosphor-icons/react'
import { Seeker } from '../Seeker'
import styles from './MasterPlayer.module.css'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface MasterPlayerProps {
  /** Song title. Empty → the player reads as "nothing queued" (empty state). */
  title: string
  /** Secondary line — artist, or the literal "Master". */
  subtitle?: string
  /** Cover-art image URL. Absent → a recessed placeholder glyph. */
  coverSrc?: string
  /** Transport state — drives the play/pause swap + the rolling accent bloom. */
  isPlaying: boolean
  /** Elapsed playback position, seconds. */
  positionSeconds: number
  /**
   * Total master length, seconds. **Absent → the master isn't ready** (still
   * rendering): the bar goes indeterminate and transport is held.
   */
  durationSeconds?: number
  /** Render/availability failure — disables transport and shows the message. */
  errorText?: string
  /** Hard-disable the whole player (no master at all / offline). */
  disabled?: boolean
  size?: 'sm' | 'md'

  /** Toggle play ⇄ pause (the real intent — audio is native). */
  onPlayPause: () => void
  /** Commit a seek to an absolute position in seconds. */
  onSeek?: (seconds: number) => void
  /**
   * Go to the previous track. **Presence decides chrome:** provided → playlist
   * mode (prev shown); absent → single mode (prev hidden).
   */
  onPrev?: () => void
  /** Go to the next track. Presence shows the next control (playlist mode). */
  onNext?: () => void
  /** A previous track exists. `false` at the head of a list → prev disabled. */
  canPrev?: boolean
  /** A next track exists. `false` at the tail of a list → next disabled. */
  canNext?: boolean
  /** Open the cover (consumers use this to change the song's cover art). */
  onCoverClick?: () => void
}

// ─── Component ─────────────────────────────────────────────────────────────────
//
// Why this isn't a webpage: the obvious build is a Spotify mini-player — a flat
// pill bar with a green circle and a hairline progress line. Instead this is a
// small instrument that happens to live on Home's paper face: a warm cream card
// with a hairline top-highlight, the cover sunk into a recessed frame, the
// progress riding in a pressed-in groove, and a single warm accent that owns
// BOTH the play control and the played portion of the track — so "rolling" reads
// as one lit identity, not a colour the eye has to hunt for. It carries no audio
// (golden rule #1: audio is native) — it only shows engine-reported state and
// sends intent. Token-only, so the same component can drop onto a dark device
// face later by swapping variables. A first-time viewer should feel they're
// touching the deck the master was bounced on, not a media embed in a page.
//
// Decisions (recorded for the card, resolved against KIT-LEAD.md):
//  • Paper register, not the dark --stage well — the card pins it to Home's
//    song cards / collection page.
//  • ONE accent for play state + progress fill (per the card), NOT the green
//    "play ≠ record" LED (KIT-LEAD §6): a playback-only master mini-player has
//    no arm/record to disambiguate from, so a single accent identity reads
//    cleaner. TransportButton is deliberately NOT reused — it lives in a dark
//    --stage well (wrong register on cream).
//  • Mode is derived from which callbacks are provided (onPrev/onNext), never
//    baked in — single vs playlist falls out of the contract.
//  • Action buttons relabel (Play⇄Pause, Previous, Next) with no aria-pressed
//    (KIT-LEAD §5 — one ARIA model).
//  • The progress groove is the shared <Seeker> primitive (kit-player-seeker),
//    composed under the "masterplayer" testid namespace — one scrubbable seeker
//    everywhere it's needed (here + CollectionView's album player), not a
//    second inline copy to drift. MasterPlayer maps its states onto Seeker:
//    rendering → no-duration sweep, error/empty/disabled → disabled flat groove.

export function MasterPlayer({
  title,
  subtitle,
  coverSrc,
  isPlaying,
  positionSeconds,
  durationSeconds,
  errorText,
  disabled = false,
  size = 'md',
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  onCoverClick,
}: MasterPlayerProps) {
  const isEmpty = title.trim() === ''
  const hasError = errorText != null && errorText !== ''
  const ready = !hasError && durationSeconds != null && Number.isFinite(durationSeconds) && durationSeconds > 0
  // "Rendering" = a real song slot whose master hasn't finished yet (no duration).
  const rendering = !hasError && !isEmpty && !ready

  // Chrome comes from the contract: a callback present == that control exists.
  const showPrev = onPrev != null
  const showNext = onNext != null
  const playlist = showPrev || showNext

  const transportLive = !disabled && !isEmpty && !hasError
  const canPlay = transportLive && (ready || isPlaying)
  // The seeker is live only when transport is + the master is ready. Rendering
  // keeps the indeterminate sweep; error/empty/disabled hand it a held groove.
  const seekerDisabled = !transportLive || (!ready && !rendering)

  // ── Derived display ──────────────────────────────────────────────────────────
  const iconSize = size === 'sm' ? 16 : 20
  const skipSize = size === 'sm' ? 15 : 18
  const statusText = hasError ? errorText : rendering ? 'Rendering…' : null

  const coverGlyphSize = size === 'sm' ? 20 : 26

  // The cover is a real <button> only when it does something; otherwise a static
  // figure (no dead intent — KIT-LEAD §5).
  const coverInner = coverSrc ? (
    <img className={styles.coverImg} src={coverSrc} alt="" draggable={false} />
  ) : (
    <span className={styles.coverPlaceholder} aria-hidden="true">
      <MusicNote size={coverGlyphSize} weight="fill" />
    </span>
  )

  return (
    <div
      className={styles.root}
      data-size={size}
      data-playing={(isPlaying && !disabled && !hasError) || undefined}
      data-disabled={disabled || undefined}
      data-empty={isEmpty || undefined}
      data-rendering={rendering || undefined}
      data-error={hasError || undefined}
      data-testid="masterplayer-root"
    >
      {/* ── Cover ──────────────────────────────────────────────────────────── */}
      {onCoverClick && !disabled ? (
        <button
          type="button"
          className={styles.cover}
          data-testid="masterplayer-cover"
          aria-label={isEmpty ? 'Set cover art' : `Change cover — ${title}`}
          onClick={onCoverClick}
        >
          {coverInner}
          <span className={styles.coverHover} aria-hidden="true">
            <PencilSimple size={coverGlyphSize} weight="bold" />
          </span>
        </button>
      ) : (
        <div className={styles.cover} data-static="" data-testid="masterplayer-cover" role="img" aria-label={isEmpty ? 'No cover' : `Cover — ${title}`}>
          {coverInner}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.title} data-testid="masterplayer-title" title={isEmpty ? undefined : title}>
            {isEmpty ? 'Nothing queued' : title}
          </span>
          {(subtitle || statusText) && (
            <span
              className={styles.subtitle}
              data-status={statusText ? '' : undefined}
              data-testid="masterplayer-subtitle"
            >
              {statusText ?? subtitle}
            </span>
          )}
        </div>

        {/* Progress groove — the shared scrubbable Seeker (kit-player-seeker). */}
        <Seeker
          idPrefix="masterplayer"
          label={`Seek — ${isEmpty ? 'master' : title}`}
          positionSeconds={positionSeconds}
          durationSeconds={ready ? durationSeconds : undefined}
          isPlaying={isPlaying && !disabled && !hasError}
          disabled={seekerDisabled}
          onSeek={onSeek}
          size={size}
        />

        {/* Transport row */}
        <div className={styles.transport}>
          {showPrev && (
            <button
              type="button"
              className={styles.skip}
              data-testid="masterplayer-prev"
              aria-label="Previous"
              disabled={!transportLive || !canPrev}
              onClick={onPrev}
            >
              <SkipBack size={skipSize} weight="fill" aria-hidden />
            </button>
          )}

          <button
            type="button"
            className={styles.play}
            data-testid="masterplayer-play"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            disabled={!canPlay}
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause size={iconSize} weight="fill" aria-hidden /> : <Play size={iconSize} weight="fill" aria-hidden />}
          </button>

          {showNext && (
            <button
              type="button"
              className={styles.skip}
              data-testid="masterplayer-next"
              aria-label="Next"
              disabled={!transportLive || !canNext}
              onClick={onNext}
            >
              <SkipForward size={skipSize} weight="fill" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Mode is reflected for tests + styling without re-deriving in CSS. */}
      <span hidden data-testid="masterplayer-mode">{playlist ? 'playlist' : 'single'}</span>
    </div>
  )
}
