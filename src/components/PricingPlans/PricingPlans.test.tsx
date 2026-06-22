// src/components/PricingPlans/PricingPlans.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCard } from './PlanCard'
import type { Plan } from './PlanCard'
import { PricingPlans } from './PricingPlans'

const SOLO: Plan = {
  id: 'solo',
  name: 'Solo',
  price: null,
  tagline: 'The whole DAW, yours, on your machine.',
  features: ['Record and arrange', 'Sidetrack and folders', 'Export to any DAW'],
  cta: 'Download Jackdaw',
}

const STUDIO: Plan = {
  id: 'studio',
  name: 'Studio',
  price: '$7',
  priceUnit: '/mo',
  tagline: 'Unlocks collaboration.',
  features: ['Everything in Solo', 'Send Session Eggs', 'Open sessions'],
  cta: 'Go Studio',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PlanCard — content', () => {
  it('renders the plan name, tagline, features, and CTA', () => {
    render(<PlanCard plan={STUDIO} />)
    expect(screen.getByRole('heading', { name: 'Studio' })).toBeInTheDocument()
    expect(screen.getByText('Unlocks collaboration.')).toBeInTheDocument()
    expect(screen.getByText('Send Session Eggs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Studio' })).toBeInTheDocument()
  })

  it('renders "Free" when price is null', () => {
    render(<PlanCard plan={SOLO} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders the price and unit when priced', () => {
    render(<PlanCard plan={STUDIO} />)
    expect(screen.getByText('$7')).toBeInTheDocument()
    expect(screen.getByText('/mo')).toBeInTheDocument()
  })

  it('renders one list item per feature', () => {
    render(<PlanCard plan={STUDIO} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(STUDIO.features.length)
  })
})

describe('PlanCard — CTA intent', () => {
  it('fires onSelect with the plan id when the CTA is clicked', () => {
    const onSelect = vi.fn()
    render(<PlanCard plan={STUDIO} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go Studio' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('studio')
  })

  it('does not fire when disabled', () => {
    const onSelect = vi.fn()
    render(<PlanCard plan={STUDIO} disabled onSelect={onSelect} />)
    const cta = screen.getByRole('button', { name: 'Go Studio' })
    expect(cta).toBeDisabled()
    fireEvent.click(cta)
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('PlanCard — recommended (highlighted variant)', () => {
  it('shows the Recommended badge', () => {
    render(<PlanCard plan={STUDIO} recommended />)
    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  it('does not show the badge by default', () => {
    render(<PlanCard plan={STUDIO} />)
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
  })

  it('exposes data-recommended on the card and CTA', () => {
    const { container } = render(<PlanCard plan={STUDIO} recommended />)
    expect(container.querySelector('[data-recommended]')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: 'Go Studio' })
    expect(cta).toHaveAttribute('data-recommended')
  })
})

describe('PlanCard — size', () => {
  it('defaults to md', () => {
    const { container } = render(<PlanCard plan={SOLO} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('exposes data-size=sm', () => {
    const { container } = render(<PlanCard plan={SOLO} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})

describe('PricingPlans — layout', () => {
  it('renders a card per plan', () => {
    render(<PricingPlans plans={[SOLO, STUDIO]} />)
    expect(screen.getByRole('heading', { name: 'Solo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Studio' })).toBeInTheDocument()
  })

  it('highlights only the plan matching recommendedId', () => {
    render(<PricingPlans plans={[SOLO, STUDIO]} recommendedId="studio" />)
    // exactly one Recommended badge, on the studio plan
    expect(screen.getAllByText('Recommended')).toHaveLength(1)
  })

  it('fires onSelectPlan with the clicked plan id', () => {
    const onSelectPlan = vi.fn()
    render(<PricingPlans plans={[SOLO, STUDIO]} onSelectPlan={onSelectPlan} />)
    fireEvent.click(screen.getByRole('button', { name: 'Download Jackdaw' }))
    expect(onSelectPlan).toHaveBeenCalledWith('solo')
    fireEvent.click(screen.getByRole('button', { name: 'Go Studio' }))
    expect(onSelectPlan).toHaveBeenCalledWith('studio')
  })
})
