// src/components/PricingPlans/PricingPlans.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { PlanCard } from './PlanCard'
import type { Plan } from './PlanCard'
import { PricingPlans } from './PricingPlans'

export const meta: DemoMeta = {
  name: 'PricingPlans',
  group: 'Composites',
  route: '/pricing-plans',
  order: 56,
}

// ─── Copy (on-brand: solo is free and stays free; we charge for collaboration) ─

const SOLO: Plan = {
  id: 'solo',
  name: 'Solo',
  price: null,
  tagline: 'The whole DAW, solo. Yours, on your machine.',
  features: [
    'Record, arrange, simple mix',
    'Sidetrack, folders, plugins, automation',
    'Lyrics, chords, references',
    'Export to any real DAW',
    'No account, nothing leaves your machine',
  ],
  cta: 'Download Jackdaw',
}

const STUDIO: Plan = {
  id: 'studio',
  name: 'Studio',
  price: '$7',
  priceUnit: '/mo',
  tagline: 'Everything in Solo, plus collaboration.',
  features: [
    'Send Track and Session Eggs',
    'Open sessions anyone can hatch',
    'Pass a song back and forth',
    'One paid seat covers a shared song',
  ],
  cta: 'Go Studio',
}

// A third plan, used to show 3-up and the disabled (not-yet-available) state.
const TEACHER: Plan = {
  id: 'teacher',
  name: 'Studio for Teams',
  price: '$5',
  priceUnit: '/seat',
  tagline: 'For a room of writers sharing songs.',
  features: [
    'Everything in Studio',
    'Seats you manage together',
    'One bill for the whole room',
  ],
  cta: 'Coming soon',
}

const NOOP = () => {}

// ─── States ───────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default (Free / unlit)">
        <div style={{ width: 260 }}>
          <PlanCard plan={SOLO} onSelect={NOOP} />
        </div>
      </State>
      <State label="recommended (lit module)">
        <div style={{ width: 260 }}>
          <PlanCard plan={STUDIO} recommended onSelect={NOOP} />
        </div>
      </State>
      <State label="priced, not recommended">
        <div style={{ width: 260 }}>
          <PlanCard plan={STUDIO} onSelect={NOOP} />
        </div>
      </State>
      <State label="disabled (not yet available)">
        <div style={{ width: 260 }}>
          <PlanCard plan={TEACHER} disabled onSelect={NOOP} />
        </div>
      </State>
      <State label="sm">
        <div style={{ width: 220 }}>
          <PlanCard plan={STUDIO} recommended size="sm" onSelect={NOOP} />
        </div>
      </State>
      <State label="hover / CTA hover (live — point at the cards)">
        <div style={{ width: 260 }}>
          <PlanCard plan={SOLO} onSelect={NOOP} />
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Full shelf (the real composite) ───────────────────────────────────────────

function ShelfDemo() {
  return (
    <section style={section}>
      <h2 style={heading}>The shelf — two plans, equal height</h2>
      <div style={{ maxWidth: 640 }}>
        <PricingPlans plans={[SOLO, STUDIO]} recommendedId="studio" onSelectPlan={NOOP} />
      </div>
    </section>
  )
}

function ThreeUpDemo() {
  return (
    <section style={section}>
      <h2 style={heading}>Three plans (uneven feature lists still align)</h2>
      <div style={{ maxWidth: 860 }}>
        <PricingPlans plans={[SOLO, STUDIO, TEACHER]} recommendedId="studio" onSelectPlan={NOOP} />
      </div>
    </section>
  )
}

function StackedDemo() {
  return (
    <section style={section}>
      <h2 style={heading}>Narrow rack — stacks to one column</h2>
      <div style={{ maxWidth: 340 }}>
        <PricingPlans plans={[SOLO, STUDIO]} recommendedId="studio" onSelectPlan={NOOP} />
      </div>
    </section>
  )
}

// ─── Playground (dogfooded kit Toggles) ────────────────────────────────────────

function PlaygroundDemo() {
  const [recommendStudio, setRecommendStudio] = useState(true)
  const [small, setSmall] = useState(false)
  const [threeUp, setThreeUp] = useState(false)
  const [lastPicked, setLastPicked] = useState<string | null>(null)

  const plans = threeUp ? [SOLO, STUDIO, TEACHER] : [SOLO, STUDIO]

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320, maxWidth: 720 }}>
          <PricingPlans
            plans={plans}
            recommendedId={recommendStudio ? 'studio' : undefined}
            size={small ? 'sm' : 'md'}
            onSelectPlan={setLastPicked}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={recommendStudio} onChange={setRecommendStudio} size="sm" label="recommend Studio" />
          <Toggle checked={small} onChange={setSmall} size="sm" label="size sm" />
          <Toggle checked={threeUp} onChange={setThreeUp} size="sm" label="add a third plan" />
          <span style={picked}>
            {lastPicked ? `picked: ${lastPicked}` : 'pick a plan to fire onSelectPlan'}
          </span>
        </div>
      </div>
    </Playground>
  )
}

const section: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-8)',
}

const heading: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-dim)',
}

const picked: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

// ─── Default export ─────────────────────────────────────────────────────────────

export default function PricingPlansDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <ShelfDemo />
      <ThreeUpDemo />
      <StackedDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
