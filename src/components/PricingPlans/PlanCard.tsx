// src/components/PricingPlans/PlanCard.tsx
import { Check } from '@phosphor-icons/react'
import { Badge } from '../Badge'
import styles from './PlanCard.module.css'

// ── Contract ──────────────────────────────────────────────────────────────────
// Licensing is deferred in the product, so there is no bridge shape to mirror yet.
// These are the marketing data shapes the site renders today; `id` is the intent
// payload the CTA hands back (the real decision: "this person picked this plan"),
// `onSelect` is the real intent. When licensing lands, a Plan can grow a price id
// without touching the card's markup.

export interface Plan {
  /** Stable id — the intent payload (e.g. 'solo', 'studio'). */
  id: string
  /** Plan name shown in the card header (e.g. 'Solo', 'Studio'). */
  name: string
  /** Price display string, currency symbol included (e.g. '$7'). `null` renders as "Free". */
  price: string | null
  /** Small unit beside a numeric price (e.g. '/mo', 'per writer'). Ignored when price is null. */
  priceUnit?: string
  /** One-line positioning copy under the price. */
  tagline: string
  /** Feature list — each rendered with a check. */
  features: string[]
  /** CTA label (e.g. 'Download Jackdaw'). */
  cta: string
}

export interface PlanCardProps {
  plan: Plan
  /** Highlight as the recommended plan: accent keyline + bloom + badge + lit CTA. */
  recommended?: boolean
  size?: 'sm' | 'md'
  /** CTA disabled (e.g. a plan that isn't available yet). */
  disabled?: boolean
  /** Fired when the CTA is chosen — the real intent. Receives `plan.id`. */
  onSelect?: (planId: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
// One plan in the pricing shelf: name, price (or "Free"), a positioning line, a
// list of checked features, and a CTA. The recommended plan reads as the lit
// module — accent keyline, a soft bloom, a "Recommended" badge straddling the top
// edge, and an incandescent accent CTA. Every other card sits quiet and recessed.
//
// Why this isn't a webpage: a web pricing table is flat cards with a flat coloured
// "Most popular" ribbon — same paint, louder paint. Here the recommended plan is a
// control that's switched ON: its keyline lights with the warm accent, its CTA
// glows with incandescent timing (fast attack / slow decay), and the unlit cards
// stay recessed so the eye lands on the engaged one the way it lands on a lit pedal
// in a dark rack. The hierarchy is wired, not coloured-in.

export function PlanCard({ plan, recommended, size = 'md', disabled, onSelect }: PlanCardProps) {
  const isFree = plan.price === null
  const checkSize = size === 'sm' ? 13 : 15

  return (
    <div
      className={styles.card}
      data-recommended={recommended || undefined}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {recommended && (
        <span className={styles.badgeSlot}>
          <Badge variant="label" tone="accent">Recommended</Badge>
        </span>
      )}

      <div className={styles.head}>
        <h3 className={styles.name}>{plan.name}</h3>
        <p className={styles.price}>
          {isFree ? (
            <span className={styles.free}>Free</span>
          ) : (
            <>
              <span className={styles.amount}>{plan.price}</span>
              {plan.priceUnit && <span className={styles.unit}>{plan.priceUnit}</span>}
            </>
          )}
        </p>
        <p className={styles.tagline}>{plan.tagline}</p>
      </div>

      <ul className={styles.features}>
        {plan.features.map((feature, i) => (
          <li key={i} className={styles.feature}>
            <Check className={styles.check} size={checkSize} weight="bold" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles.cta}
        data-recommended={recommended || undefined}
        disabled={disabled || undefined}
        onClick={() => onSelect?.(plan.id)}
      >
        {plan.cta}
      </button>
    </div>
  )
}
