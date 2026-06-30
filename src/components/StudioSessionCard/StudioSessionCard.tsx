// src/components/StudioSessionCard/StudioSessionCard.tsx
//
// StudioSessionCard — the door into the studio.
//
// On the song page (warm paper face) this is the single most important panel: the
// gateway into the studio, the center of the whole product. The DAW one-off it
// replaces (jackdaw/ui/components/song/StudioPanel) was a label, "3 tracks", and a
// button — it read as a minor footnote. This graduates it into the hero gateway it
// should be: confident hierarchy, real presence, "this is where the work happens".
//
// Why this isn't a webpage:
// The card is a paper door with a small WINDOW cut into the dark studio. The body is
// flat warm --surface paper with one hairline keyline (no shadow, no gradient, no
// glass, no glow). Set into it is a recessed --stage well — a literal peek through
// the door into the dark device: when a session exists, the track lanes glow inside
// it as a stacked color-block (the per-track colour spine, ears-first hardware feel);
// when the song is only an imported master, the room is dark and empty, lights off,
// waiting for you to start. The big display track count is the headline number you
// read in one glance. The one hot accent in the whole composition is reserved for the
// hero CTA — "Open studio" — so the eye lands on the door handle. It relabels to
// "Opening…" and goes busy while the studio loads (the button owns the load), the
// kit's action-button relabel pattern (no aria-pressed). Everything reskins on tokens
// alone: cream + espresso here, ink-on-ink in Ink, with zero new colour.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - The contract is presentational + intent-only exactly as the card asks:
//   { hasSession, trackCount, importedFromMaster, lastEdited, isOpening } + onOpenStudio.
//   No data fetching, no audio. lastEdited is a PRE-FORMATTED string (the DAW humanizes
//   "2 hours ago" / "yesterday"); a presentational card must not own date math.
// - Three modes, not two: a no-session song is either `imported` (from a master —
//   "start a session from this master") or `new` (a blank song — "start your first
//   session"). importedFromMaster picks the copy; both share the dark-empty window.
//   The brief names has-session vs imported; `new` is the honest third (a song made in
//   the app, not imported) and keeps the card truthful when importedFromMaster is false.
// - The window visual is bespoke (custom lane SVG-less divs, no stock icon): a recessed
//   --stage well with track-colour lane pills, capped at 6 with a "+N" overflow plate
//   so a 30-track session still reads at a glance and the card height never jumps. This
//   nods to the device identity (the studio is the dark matrix panel) without cosplay.
// - The CTA is purpose-built (like TransportButton / ArmButton), not the generic kit
//   Button, because it owns a bespoke loading state (a rotating arc + "Opening…") that
//   the generic Button has no API for. It disables + aria-busy while opening so a double
//   click can't fire a second load (pairs with studio-loads-on-button).
// - No `disabled`/`selected`/`error` props: the card is always actionable (a door is
//   always openable) and isn't a gallery selectable. The grid's required cells map to
//   honest states (see the demo) rather than inventing API the spec didn't ask for.
// - size sm/md is the kit's baseline axis (default md); sm is for a denser song-page
//   column. No lg (KIT-LEAD §6).

import { useId } from 'react'
import styles from './StudioSessionCard.module.css'

// ─── Contract ──────────────────────────────────────────────────────────────────────

export interface StudioSessionCardProps {
  /** Does this song have a studio session yet? Drives the whole card. */
  hasSession: boolean
  /** Real track count in the session. 0 (and garbage) reads as "No tracks". */
  trackCount: number
  /** Was the song imported from a master (vs. created in the app)? Picks the no-session copy. */
  importedFromMaster: boolean
  /** Pre-formatted relative time, e.g. "2 hours ago". The DAW humanizes it; the card just shows it. */
  lastEdited?: string
  /** The studio is loading — the CTA owns the load, so it relabels to "Opening…" and goes busy. */
  isOpening?: boolean
  /** Enter the studio. The one hero intent. */
  onOpenStudio: () => void
  size?: 'sm' | 'md'
  className?: string
}

/** The session has a session, or none yet — and if none, imported-from-master vs a fresh song. */
export type SessionMode = 'session' | 'imported' | 'new'

// ─── Pure helpers (unit-tested) ──────────────────────────────────────────────────────

/** Resolve the card's mode from the two booleans. A session always wins, import origin aside. */
export function sessionMode(hasSession: boolean, importedFromMaster: boolean): SessionMode {
  if (hasSession) return 'session'
  return importedFromMaster ? 'imported' : 'new'
}

/** "No tracks" / "1 track" / "N tracks" — negatives and garbage clamp to "No tracks". */
export function trackCountLabel(n: number): string {
  const count = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  if (count === 0) return 'No tracks'
  return count === 1 ? '1 track' : `${count} tracks`
}

/** The hero CTA label — relabels while the studio loads. */
export function ctaLabel(isOpening: boolean): string {
  return isOpening ? 'Opening…' : 'Open studio'
}

/** Cyclic per-track colour spine token for the i-th lane (0-indexed → 1-indexed token). */
export function laneColor(i: number): string {
  return `var(--track-color-${(i % 6) + 1})`
}

/** How many lane pills to draw vs. how many spill into the "+N" overflow plate. */
export function visibleLanes(trackCount: number, max: number): { lanes: number; overflow: number } {
  const count = Number.isFinite(trackCount) && trackCount > 0 ? Math.floor(trackCount) : 0
  const lanes = Math.min(count, max)
  return { lanes, overflow: Math.max(0, count - max) }
}

// At most this many lanes glow in the window before the rest collapse into "+N".
const MAX_LANES = 6

// ─── Bespoke glyphs (inline SVG — never the icon barrel) ───────────────────────────────

/** The door-handle arrow on the CTA — points into the studio. */
function EnterGlyph() {
  return (
    <svg className={styles.ctaGlyph} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The loading arc — spins while the studio opens (snaps still under reduced motion). */
function OpeningGlyph() {
  return (
    <svg className={styles.ctaSpinner} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.25" />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────────────

export function StudioSessionCard({
  hasSession,
  trackCount,
  importedFromMaster,
  lastEdited,
  isOpening = false,
  onOpenStudio,
  size = 'md',
  className,
}: StudioSessionCardProps) {
  const mode = sessionMode(hasSession, importedFromMaster)
  const { lanes, overflow } = visibleLanes(trackCount, MAX_LANES)
  const headingId = useId()

  return (
    <section
      className={className ? `${styles.root} ${className}` : styles.root}
      data-mode={mode}
      data-size={size}
      data-opening={isOpening || undefined}
      aria-labelledby={headingId}
    >
      {/* Eyebrow plate — the printed label on the device face. */}
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowText}>SESSION</span>
        {lastEdited && mode === 'session' && (
          <span className={styles.lastEdited}>{lastEdited}</span>
        )}
      </div>

      {/* The window into the studio + the headline. */}
      <div className={styles.glance}>
        {/* The recessed --stage well: lit lanes (session) or a dark empty room (no session). */}
        <div className={styles.window} data-empty={mode === 'session' ? undefined : ''} aria-hidden="true">
          {mode === 'session' ? (
            <div className={styles.lanes}>
              {Array.from({ length: lanes }, (_, i) => (
                <span
                  key={i}
                  className={styles.lane}
                  data-lane=""
                  style={{ ['--lane-color' as string]: laneColor(i) }}
                />
              ))}
              {overflow > 0 && <span className={styles.overflow}>+{overflow}</span>}
            </div>
          ) : (
            // Dark room, lights off — three dim stubs hint at empty lanes waiting.
            <div className={styles.lanes} data-dim="">
              <span className={styles.stub} />
              <span className={styles.stub} />
              <span className={styles.stub} />
            </div>
          )}
        </div>

        {/* The headline number / prompt. */}
        <div className={styles.headline}>
          {mode === 'session' ? (
            <>
              <div className={styles.count}>
                {/* The big numeral is the visual headline; the full "N tracks" below
                    carries the spoken count, so the numeral is hidden from AT to avoid
                    a redundant "4, 4 tracks" reading. */}
                <span className={styles.countNum} aria-hidden="true">
                  {Math.max(0, Math.floor(trackCount) || 0)}
                </span>
                <span className={styles.countWord}>{trackCountLabel(trackCount)}</span>
              </div>
              <h3 id={headingId} className={styles.title}>
                Your studio session
              </h3>
            </>
          ) : (
            <>
              <h3 id={headingId} className={styles.title}>
                {mode === 'imported' ? 'Imported song' : 'No session yet'}
              </h3>
              <p className={styles.prompt}>
                {mode === 'imported'
                  ? 'Open the studio to start a session from this master.'
                  : 'Open the studio to start your first session.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* The hero action — the door handle. */}
      <button
        type="button"
        className={styles.cta}
        onClick={onOpenStudio}
        disabled={isOpening}
        aria-busy={isOpening || undefined}
      >
        <span className={styles.ctaIcon} aria-hidden="true">
          {isOpening ? <OpeningGlyph /> : <EnterGlyph />}
        </span>
        <span className={styles.ctaLabel}>{ctaLabel(isOpening)}</span>
      </button>
    </section>
  )
}
