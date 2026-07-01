// src/components/NowPlayingBar/NowPlayingBar.tsx
import { SkipBack, SkipForward, Shuffle, MusicNote } from '@phosphor-icons/react'
import { TransportButton } from '../TransportButton'
import { RepeatToggle } from '../RepeatToggle'
import { Seeker } from '../Seeker'
import styles from './NowPlayingBar.module.css'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface NowPlayingBarProps {
  /** Cover-art image URL. Wins over coverColor. */
  coverUrl?: string
  /** Per-track color — a solid color block cover (the color spine) when there's no art. */
  coverColor?: string
  /** Track title. Blank / missing → a muted "Untitled" placeholder (defensive guard). */
  title: string
  /** Secondary line — artist / album / source. */
  subtitle?: string
  /** Transport state — drives the play⇄pause swap, the green TransportButton bloom, and the accent-lit deck. */
  isPlaying: boolean
  /** Elapsed position, seconds. The host drives this at transport rate (audio is native). */
  positionSeconds: number
  /**
   * Total length, seconds. **Absent → unknown length** (live / still resolving):
   * the Seeker goes indeterminate (slow sweep) and times read em-dash.
   */
  durationSeconds?: number
  size?: 'sm' | 'md'

  /** Toggle play ⇄ pause (the real intent — audio is native). Required. */
  onPlayPause: () => void
  /** Commit a seek to an absolute position in seconds. Absent → the groove is display-only. */
  onSeek?: (seconds: number) => void
  /** Previous track. Presence shows the prev control (contract-driven chrome). */
  onPrev?: () => void
  /** Next track. Presence shows the next control. */
  onNext?: () => void
  /** Shuffle toggle. Presence shows the control; `isShuffling` lights it. */
  onShuffle?: (next: boolean) => void
  /** Whether shuffle is engaged (a controlled toggle needs its state to render lit/unlit). */
  isShuffling?: boolean
  /** Repeat toggle. Presence shows the control; `isRepeating` lights it. */
  onRepeat?: (next: boolean) => void
  /** Whether repeat is engaged. */
  isRepeating?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────────
//
// Why this isn't a webpage: the obvious build is a Spotify strip — a flat bar with
// a green circle, grey text and a hairline progress line glued to the bottom of the
// page. Instead this is the deck's bottom edge: a dark recessed --stage rail (the
// same well the meters and dot-matrix live in) that reads as one continuous piece
// of hardware in EVERY theme — cream paper or midnight — because the deck edge is
// always dark. The play control is the real recessed TransportButton that blooms
// green when rolling; the scrub is the shared pressed-in Seeker groove lit by the
// one warm --accent; the cover is sunk into a recessed frame with the per-track
// color as its spine. It carries NO audio (golden rule #1: audio is native) — it
// renders the host's reported position and emits intents. Token-only, so it reskins
// through every theme by swapping variables.
//
// Decisions (headless, resolved against KIT-LEAD.md):
//  • DARK --stage register in every theme (not MasterPlayer's cream paper). The card
//    mandates reusing TransportButton, which is a recessed --stage well and reads
//    wrong on cream — that's exactly why MasterPlayer forked it. A pinned deck-edge
//    strip is naturally the dark well, so TransportButton drops in native, type uses
//    --stage-text, and the Seeker composes as-is (pale groove + --accent fill on the
//    black deck). This is the theme-robust reading of "reuse TransportButton" and it
//    holds in dark AND paper themes.
//  • SHARE, don't fork: TransportButton (play/pause), RepeatToggle (repeat), Seeker
//    (scrub) are composed unchanged. Prev/next are quiet ghost buttons (they're skip
//    intents, not the recessed hero) and shuffle is a small lit toggle in the bar's
//    own register — neither is a shared primitive to fork.
//  • ONE accent identity for "playing": the Seeker fill and a soft cover-spine glow
//    both light with --accent when rolling. TransportButton's play bloom stays green
//    (KIT-LEAD §6: green = play/rolling is intrinsic to that shared control — forking
//    it to recolor would be worse than the tiny two-color reading).
//  • Contract-driven chrome: a callback's presence decides whether its control exists
//    (onPrev/onNext/onShuffle/onRepeat), never a baked-in mode.
//  • ARIA, one model per control (KIT-LEAD §5): play/prev/next relabel as action
//    buttons (no aria-pressed); shuffle/repeat are toggles (aria-pressed, stable label).
//  • No empty/disabled prop: the host simply doesn't render the bar when nothing plays
//    (per the card) — so there's no dead "nothing queued" state to carry. Missing title
//    is still guarded (→ "Untitled"); missing duration is the Seeker's unknown-length
//    sweep.

const SKIP_ICON: Record<'sm' | 'md', number> = { sm: 16, md: 18 }
const TOGGLE_ICON: Record<'sm' | 'md', number> = { sm: 16, md: 18 }
const COVER_GLYPH: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

export function NowPlayingBar({
  coverUrl,
  coverColor,
  title,
  subtitle,
  isPlaying,
  positionSeconds,
  durationSeconds,
  size = 'md',
  onPlayPause,
  onSeek,
  onPrev,
  onNext,
  onShuffle,
  isShuffling = false,
  onRepeat,
  isRepeating = false,
}: NowPlayingBarProps) {
  const displayTitle = title.trim() === '' ? 'Untitled' : title
  const untitled = title.trim() === ''

  const showPrev = onPrev != null
  const showNext = onNext != null
  const showShuffle = onShuffle != null
  const showRepeat = onRepeat != null

  const coverInner = coverUrl ? (
    <img className={styles.coverImg} src={coverUrl} alt="" draggable={false} />
  ) : coverColor ? (
    <span className={styles.coverColor} style={{ backgroundColor: coverColor }} aria-hidden="true" />
  ) : (
    <span className={styles.coverPlaceholder} aria-hidden="true">
      <MusicNote size={COVER_GLYPH[size]} weight="fill" />
    </span>
  )

  return (
    <div
      className={styles.root}
      data-size={size}
      data-playing={isPlaying || undefined}
      role="group"
      aria-label="Now playing"
      data-testid="nowplayingbar-root"
    >
      {/* ── Left: cover + track meta ─────────────────────────────────────────── */}
      <div className={styles.info}>
        <div
          className={styles.cover}
          data-testid="nowplayingbar-cover"
          role="img"
          aria-label={untitled ? 'Cover' : `Cover — ${displayTitle}`}
        >
          {coverInner}
        </div>
        <div className={styles.meta}>
          <span
            className={styles.title}
            data-untitled={untitled || undefined}
            data-testid="nowplayingbar-title"
            title={untitled ? undefined : displayTitle}
          >
            {displayTitle}
          </span>
          {subtitle && (
            <span className={styles.subtitle} data-testid="nowplayingbar-subtitle" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* ── Center: transport ────────────────────────────────────────────────── */}
      <div className={styles.transport}>
        {showShuffle && (
          <button
            type="button"
            className={styles.toggle}
            data-active={isShuffling || undefined}
            data-testid="nowplayingbar-shuffle"
            aria-label="Shuffle"
            aria-pressed={isShuffling}
            onClick={() => onShuffle?.(!isShuffling)}
          >
            <Shuffle size={TOGGLE_ICON[size]} aria-hidden />
          </button>
        )}

        {showPrev && (
          <button
            type="button"
            className={styles.skip}
            data-testid="nowplayingbar-prev"
            aria-label="Previous"
            onClick={onPrev}
          >
            <SkipBack size={SKIP_ICON[size]} weight="fill" aria-hidden />
          </button>
        )}

        <TransportButton
          variant="play"
          playing={isPlaying}
          onClick={onPlayPause}
          size={size}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        />

        {showNext && (
          <button
            type="button"
            className={styles.skip}
            data-testid="nowplayingbar-next"
            aria-label="Next"
            onClick={onNext}
          >
            <SkipForward size={SKIP_ICON[size]} weight="fill" aria-hidden />
          </button>
        )}

        {showRepeat && (
          <RepeatToggle repeating={isRepeating} onToggle={onRepeat} size={size} aria-label="Repeat" />
        )}
      </div>

      {/* ── Right: scrub ─────────────────────────────────────────────────────── */}
      <div className={styles.seek}>
        <Seeker
          idPrefix="nowplayingbar"
          label={`Seek — ${displayTitle}`}
          positionSeconds={positionSeconds}
          durationSeconds={durationSeconds}
          isPlaying={isPlaying}
          onSeek={onSeek}
          trailingTime="total"
          size={size}
        />
      </div>
    </div>
  )
}
