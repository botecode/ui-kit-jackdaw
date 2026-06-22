// src/components/SpecStrip/SpecStrip.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpecStrip } from './SpecStrip'
import type { SpecItem } from './SpecStrip'

const ITEMS: SpecItem[] = [
  { value: '100%', label: 'native audio' },
  { value: 'peer-to-peer' },
  { value: 'no cloud' },
  { value: 'immutable', label: 'Takes' },
]

describe('SpecStrip — readout', () => {
  it('renders every item value', () => {
    render(<SpecStrip items={ITEMS} />)
    for (const item of ITEMS) {
      expect(screen.getByText(item.value)).toBeInTheDocument()
    }
  })

  it('renders labels for stat items', () => {
    render(<SpecStrip items={ITEMS} />)
    expect(screen.getByText('native audio')).toBeInTheDocument()
    expect(screen.getByText('Takes')).toBeInTheDocument()
  })

  it('renders one listitem per item', () => {
    render(<SpecStrip items={ITEMS} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(ITEMS.length)
  })

  it('marks phrase-only items (no label) with data-phrase', () => {
    const { container } = render(<SpecStrip items={ITEMS} />)
    // Two of the four items have no label.
    expect(container.querySelectorAll('[data-phrase]')).toHaveLength(2)
  })
})

describe('SpecStrip — accessible name', () => {
  it('exposes a list with a default accessible name', () => {
    render(<SpecStrip items={ITEMS} />)
    expect(screen.getByRole('list', { name: /specifications/i })).toBeInTheDocument()
  })

  it('honours a custom aria-label', () => {
    render(<SpecStrip items={ITEMS} aria-label="Why Jackdaw" />)
    expect(screen.getByRole('list', { name: 'Why Jackdaw' })).toBeInTheDocument()
  })
})

describe('SpecStrip — size', () => {
  it('exposes data-size=sm', () => {
    const { container } = render(<SpecStrip items={ITEMS} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })

  it('defaults to md', () => {
    const { container } = render(<SpecStrip items={ITEMS} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })
})

describe('SpecStrip — empty', () => {
  it('marks the root data-empty and renders no list when there are no items', () => {
    const { container } = render(<SpecStrip items={[]} />)
    expect(container.querySelector('[data-empty]')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
