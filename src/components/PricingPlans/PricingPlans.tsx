// src/components/PricingPlans/PricingPlans.tsx
import { PlanCard } from './PlanCard'
import type { Plan } from './PlanCard'
import styles from './PricingPlans.module.css'

export interface PricingPlansProps {
  /** The plans to lay out, left to right. Two or more. */
  plans: Plan[]
  /** id of the plan to highlight as recommended (accent keyline + bloom + badge + lit CTA). */
  recommendedId?: string
  size?: 'sm' | 'md'
  /** Fired when a plan's CTA is chosen. Receives the chosen `plan.id`. */
  onSelectPlan?: (planId: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────
// The pricing shelf: plan cards laid side by side, equal height, stacking to one
// column when the rack gets narrow. Communicates the model directly — Free is the
// full solo DAW; the paid plan unlocks collaboration (one paid seat covers a
// shared song). The recommended id lights exactly one card.
//
// Why this isn't a webpage: an auto-fit grid keeps the cards the SAME height no
// matter how uneven the feature lists are, so the CTAs line up on one baseline and
// the rack reads like a row of modules in a case, not a stack of marketing boxes.
// Equal height isn't a nicety here, it's what makes the lit module legible against
// the recessed ones.

export function PricingPlans({ plans, recommendedId, size = 'md', onSelectPlan }: PricingPlansProps) {
  return (
    <div className={styles.grid} data-size={size}>
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          recommended={plan.id === recommendedId}
          size={size}
          onSelect={onSelectPlan}
        />
      ))}
    </div>
  )
}
