// src/components/FeatureGrid/FeatureGrid.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { FeatureGrid } from './FeatureGrid'
import { FeatureCard } from './FeatureCard'
import type { FeatureItem } from './types'

const FEATURES: FeatureItem[] = [
  { id: 'write', glyph: 'waveform', title: 'Write', blurb: 'Capture an idea fast.', link: { label: 'See writing', href: '/write' } },
  { id: 'versions', glyph: 'versions', title: 'Versions', blurb: 'Every take, kept.' },
  { id: 'share', glyph: 'share', title: 'Share', blurb: 'Pass the song along.', link: { label: 'See sharing', href: '/share' } },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FeatureGrid — layout', () => {
  it('renders one card per feature as a list', () => {
    render(<FeatureGrid features={FEATURES} />)
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  })

  it('renders each title and blurb', () => {
    render(<FeatureGrid features={FEATURES} />)
    expect(screen.getByText('Write')).toBeInTheDocument()
    expect(screen.getByText('Capture an idea fast.')).toBeInTheDocument()
    expect(screen.getByText('Versions')).toBeInTheDocument()
  })

  it('passes the column cap through as the --_cols custom property', () => {
    render(<FeatureGrid features={FEATURES} columns={4} />)
    const list = screen.getByRole('list')
    expect(list.getAttribute('style')).toContain('--_cols: 4')
  })

  it('defaults to size md and reflects sm', () => {
    const { rerender, container } = render(<FeatureGrid features={FEATURES} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
    rerender(<FeatureGrid features={FEATURES} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})

describe('FeatureGrid — empty state', () => {
  it('shows the empty well instead of a list when there are no features', () => {
    render(<FeatureGrid features={[]} />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('No features to show.')
  })

  it('honours a custom emptyLabel', () => {
    render(<FeatureGrid features={[]} emptyLabel="Nothing yet." />)
    expect(screen.getByRole('status')).toHaveTextContent('Nothing yet.')
  })
})

describe('FeatureCard — link interaction', () => {
  it('renders a real link with href for features that have one', () => {
    render(<FeatureGrid features={FEATURES} />)
    const link = screen.getByRole('link', { name: /see writing/i })
    expect(link).toHaveAttribute('href', '/write')
  })

  it('renders no link for features without one', () => {
    render(<FeatureCard feature={FEATURES[1]} />)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('fires onActivate with the item when its link is clicked', () => {
    const onActivate = vi.fn()
    render(<FeatureGrid features={FEATURES} onActivate={onActivate} />)
    fireEvent.click(screen.getByRole('link', { name: /see sharing/i }))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate).toHaveBeenCalledWith(FEATURES[2])
  })

  it('does not throw when a link is clicked without an onActivate handler', () => {
    render(<FeatureGrid features={FEATURES} />)
    expect(() => fireEvent.click(screen.getByRole('link', { name: /see writing/i }))).not.toThrow()
  })
})

describe('FeatureCard — structure', () => {
  it('renders the title as a heading', () => {
    render(<FeatureCard feature={FEATURES[0]} />)
    expect(screen.getByRole('heading', { name: 'Write' })).toBeInTheDocument()
  })

  it('renders a decorative glyph (aria-hidden) inside the card', () => {
    const { container } = render(<FeatureCard feature={FEATURES[0]} />)
    const svg = container.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })
})
