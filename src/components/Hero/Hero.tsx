// src/components/Hero/Hero.tsx
import { useId } from 'react'
import styles from './Hero.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeroCta {
  /** Visible button text. */
  label: string
  /** The real intent — fired on click (for both <button> and <a> renders). */
  onClick: () => void
  /**
   * When set, the CTA renders as an <a href> (real navigation for the landing
   * site) while still calling onClick. Omit for in-app intents (button).
   */
  href?: string
  /** Greyed, non-interactive — e.g. "Signups paused". */
  disabled?: boolean
  /** Busy (async submit in flight) — shows a spinner, aria-busy, non-interactive. */
  loading?: boolean
}

export interface HeroProps {
  /** Small label above the headline (engraved-mono on the hardware). */
  eyebrow?: string
  /** The oversized display headline — the centerpiece. */
  headline: string
  /** One-line supporting copy under the headline. */
  subhead?: string
  /** Primary call to action (the lit control). */
  primaryCta?: HeroCta
  /** Secondary call to action (recessed/ghost). */
  secondaryCta?: HeroCta
  /**
   * Product-visual slot — a ProductFrame, image, or any node. Shown in the
   * split layout's well (and below the copy when centered). Takes precedence
   * over `children`.
   */
  visual?: React.ReactNode
  /** Alternate way to pass the visual slot. `visual` wins if both are set. */
  children?: React.ReactNode
  /** centered (copy stacked, visual below) · split (copy left / visual right). */
  layout?: 'centered' | 'split'
  size?: 'sm' | 'md'
  /** Tasteful staggered entrance on mount. Decorative — snaps under reduced-motion. */
  animate?: boolean
  className?: string
}

// ── CTA ───────────────────────────────────────────────────────────────────────
// Renders the lit (primary) / recessed (secondary) control. Anchor when `href`,
// button otherwise — both carry the same onClick intent.

function Cta({ cta, variant }: { cta: HeroCta; variant: 'primary' | 'secondary' }) {
  const { label, onClick, href, disabled, loading } = cta
  const inert = disabled || loading

  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.ctaLabel}>{label}</span>
    </>
  )

  // Anchors can't be natively disabled — guard the click and drop the href so
  // an inert link is neither navigable nor focusable-as-action.
  if (href) {
    return (
      <a
        className={styles.cta}
        data-variant={variant}
        href={inert ? undefined : href}
        aria-disabled={inert || undefined}
        aria-busy={loading || undefined}
        onClick={(e) => {
          if (inert) { e.preventDefault(); return }
          onClick()
        }}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={styles.cta}
      data-variant={variant}
      disabled={inert}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {content}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
// The landing centerpiece. Warm cream paper surface, an engraved-mono eyebrow
// with an LED dot, an oversized fluid display headline, a one-line sub, and a
// primary/secondary CTA pair — beside a product visual recessed into a stage
// well (split) or below the copy (centered).
//
// Why this isn't a webpage: a generic web hero is flat type on a flat colour
// band over a stock gradient. This sits on the kit's warm paper (--bg) with
// real grain, the display face (Cabinet Grotesk) scaled fluidly, an eyebrow
// that reads like a label engraved on hardware (mono + an incandescent LED
// dot), CTAs that are tactile recessed/lit controls rather than web pills, and
// the visual sunk into a recessed well with a hairline top-highlight — the same
// stage treatment the meters and dot-matrix use. Entrance is a firm settle (no
// bounce); functional vs. decorative split honours reduced-motion. It reskins
// through every theme on tokens alone.

export function Hero({
  eyebrow,
  headline,
  subhead,
  primaryCta,
  secondaryCta,
  visual,
  children,
  layout = 'centered',
  size = 'md',
  animate = true,
  className,
}: HeroProps) {
  const headingId = useId()
  const slot = visual ?? children
  const hasCtas = Boolean(primaryCta || secondaryCta)

  return (
    <section
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-layout={layout}
      data-size={size}
      data-animate={animate || undefined}
      aria-labelledby={headingId}
    >
      <div className={styles.copy}>
        {eyebrow && (
          <p className={styles.eyebrow} data-part="eyebrow">
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {eyebrow}
          </p>
        )}

        <h1 id={headingId} className={styles.headline}>
          {headline}
        </h1>

        {subhead && <p className={styles.subhead}>{subhead}</p>}

        {hasCtas && (
          <div className={styles.ctaRow}>
            {primaryCta && <Cta cta={primaryCta} variant="primary" />}
            {secondaryCta && <Cta cta={secondaryCta} variant="secondary" />}
          </div>
        )}
      </div>

      {slot && (
        <div className={styles.visual} data-part="visual">
          <div className={styles.visualWell}>{slot}</div>
        </div>
      )}
    </section>
  )
}
