// src/components/FlyHighButton/FlyHighButton.tsx
import { useEffect, useId, useState } from 'react'
import { Feather } from '@phosphor-icons/react'
import styles from './FlyHighButton.module.css'

// ── Why this isn't a webpage ──────────────────────────────────────────────────
// A generic "primary action" is a coloured rectangle with bold text. This is the
// single scarce-accent element on an otherwise ink-on-paper Home screen: a wide
// hero that physically *changes mode* when you commit. Idle it's a warm accent
// faceplate (flat fill, cream type, a feather catching the light) — the one loud
// thing, the call to play. Armed it drops into the recessed dark stage and lights
// the label in LED-orange with a breathing "live" indicator: the surface itself
// went from paper to lit hardware. Tokens only → the same swap reskins through
// every theme. No gradient, no gloss — the loudness is the accent fill and the
// LED bloom, not a shiny button.
//
// Decisions (headless, resolved against KIT-LEAD.md):
// • The whole hero IS the <button> — Home's one bold tap target, not a card that
//   contains a button. One element to reason about, one focus ring, one intent.
// • ARIA = the Record-blessed nuanced toggle (KIT-LEAD §5): aria-pressed reflects
//   engagement (listening), and the accessible name flips Fly High → Listening —
//   coherent because both hold (it IS listening, it IS engaged). The state line is
//   an aria-live="polite" region so the swap is announced richly to SR users.
// • Flat fills only, per the card's "no gradient/gloss" call — this is what sets
//   it apart from CTABanner's lit-pedal gradient. Depth comes from the hairline
//   top-highlight (idle) and the recessed inset well (listening).
// • The "live" pulse is decorative: it breathes when motion is allowed and snaps
//   to a steady lit dot under prefers-reduced-motion (the functional bloom stays;
//   only the decorative breathing goes) — driven from JS so it's testable.
// • Listening label/sub-line are internal constants, not props — the card's
//   contract is label/tagline/state/callbacks (YAGNI on localising the armed copy
//   until a card asks for it).

const LISTENING_LABEL = 'Listening…'
const LISTENING_SUBLINE = 'Play something — pause when done.'
const LISTENING_ARIA = 'Listening'

export interface FlyHighButtonProps {
  /** The idle call-to-play label. Host may pass "Go High" etc. Default "Fly High". */
  label?: string
  /** The idle tagline under the label. */
  tagline?: string
  /** Mode. 'idle' = the accent call-to-play; 'listening' = the armed stage look. */
  state?: 'idle' | 'listening'
  /** Fired when the user commits to High mode (click while idle). */
  onStart: () => void
  /** Fired when the user stops (click while listening). Optional — host may own stop elsewhere. */
  onStop?: () => void
  /** Size. Default 'md'. */
  size?: 'sm' | 'md'
  /** Extra class on the root button. */
  className?: string
  /** Override the accessible name. Defaults to the label (idle) / "Listening" (armed). */
  'aria-label'?: string
}

/** Read prefers-reduced-motion reactively so decorative motion can be gated in JS. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function FlyHighButton({
  label = 'Fly High',
  tagline = "Just play — we'll catch every idea.",
  state = 'idle',
  onStart,
  onStop,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: FlyHighButtonProps) {
  const reducedMotion = usePrefersReducedMotion()
  const sublineId = useId()

  const listening = state === 'listening'
  const visibleLabel = listening ? LISTENING_LABEL : label
  const subline = listening ? LISTENING_SUBLINE : tagline
  const accessibleName = ariaLabel ?? (listening ? LISTENING_ARIA : label)

  function handleClick() {
    if (listening) onStop?.()
    else onStart()
  }

  return (
    <button
      type="button"
      className={className ? `${styles.root} ${className}` : styles.root}
      data-state={state}
      data-size={size}
      aria-pressed={listening}
      aria-label={accessibleName}
      aria-describedby={sublineId}
      onClick={handleClick}
    >
      {/* Hairline top-highlight (idle) — the kit's warm light catching the lip. */}
      <span className={styles.highlight} aria-hidden="true" />

      <span className={styles.glyph} aria-hidden="true">
        <Feather className={styles.feather} weight="fill" />
        {/* The "live" indicator — only meaningful while listening. Breathes when
            motion is allowed, holds steady-lit under reduced motion. */}
        <span
          className={styles.live}
          data-testid="fly-high-live"
          data-pulse={listening && !reducedMotion}
        />
      </span>

      <span className={styles.text}>
        <span className={styles.label}>{visibleLabel}</span>
        <span id={sublineId} className={styles.subline} aria-live="polite">
          {subline}
        </span>
      </span>
    </button>
  )
}
