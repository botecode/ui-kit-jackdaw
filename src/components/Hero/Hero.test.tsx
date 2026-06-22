// src/components/Hero/Hero.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Hero } from './Hero'
import type { HeroProps } from './Hero'

const BASE: HeroProps = {
  headline: 'Record like you mean it.',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Hero — content', () => {
  it('renders the headline as a heading', () => {
    render(<Hero {...BASE} />)
    expect(screen.getByRole('heading', { name: /record like you mean it/i })).toBeInTheDocument()
  })

  it('renders the eyebrow when provided', () => {
    render(<Hero {...BASE} eyebrow="Jackdaw v2" />)
    expect(screen.getByText('Jackdaw v2')).toBeInTheDocument()
  })

  it('renders the subhead when provided', () => {
    render(<Hero {...BASE} subhead="A warm, tactile DAW." />)
    expect(screen.getByText('A warm, tactile DAW.')).toBeInTheDocument()
  })

  it('omits the eyebrow when not provided', () => {
    const { container } = render(<Hero {...BASE} />)
    expect(container.querySelector('[data-part="eyebrow"]')).toBeNull()
  })
})

describe('Hero — CTAs', () => {
  it('primary CTA fires onClick', () => {
    const onClick = vi.fn()
    render(<Hero {...BASE} primaryCta={{ label: 'Get Jackdaw', onClick }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Get Jackdaw' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('secondary CTA fires onClick', () => {
    const onClick = vi.fn()
    render(<Hero {...BASE} secondaryCta={{ label: 'Watch the demo', onClick }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Watch the demo' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled primary CTA does not fire and is disabled', () => {
    const onClick = vi.fn()
    render(<Hero {...BASE} primaryCta={{ label: 'Signups paused', onClick, disabled: true }} />)
    const btn = screen.getByRole('button', { name: 'Signups paused' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('loading primary CTA is busy and disabled', () => {
    const onClick = vi.fn()
    render(<Hero {...BASE} primaryCta={{ label: 'Get Jackdaw', onClick, loading: true }} />)
    const btn = screen.getByRole('button', { name: /get jackdaw/i })
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders an anchor when the CTA has an href, and still fires onClick', () => {
    const onClick = vi.fn()
    render(<Hero {...BASE} primaryCta={{ label: 'Get Jackdaw', onClick, href: '#download' }} />)
    const link = screen.getByRole('link', { name: 'Get Jackdaw' })
    expect(link).toHaveAttribute('href', '#download')
    fireEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('Hero — visual slot', () => {
  it('renders the visual prop', () => {
    render(<Hero {...BASE} layout="split" visual={<div data-testid="product" />} />)
    expect(screen.getByTestId('product')).toBeInTheDocument()
  })

  it('renders children as the visual slot', () => {
    render(<Hero {...BASE} layout="split"><div data-testid="product-child" /></Hero>)
    expect(screen.getByTestId('product-child')).toBeInTheDocument()
  })

  it('prefers the visual prop over children when both are given', () => {
    render(
      <Hero {...BASE} layout="split" visual={<div data-testid="from-prop" />}>
        <div data-testid="from-child" />
      </Hero>,
    )
    expect(screen.getByTestId('from-prop')).toBeInTheDocument()
    expect(screen.queryByTestId('from-child')).not.toBeInTheDocument()
  })
})

describe('Hero — layout & size', () => {
  it('defaults to centered layout', () => {
    const { container } = render(<Hero {...BASE} />)
    expect(container.querySelector('[data-layout="centered"]')).toBeInTheDocument()
  })

  it('reflects the split layout', () => {
    const { container } = render(<Hero {...BASE} layout="split" visual={<div />} />)
    expect(container.querySelector('[data-layout="split"]')).toBeInTheDocument()
  })

  it('defaults to md size', () => {
    const { container } = render(<Hero {...BASE} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('reflects sm size', () => {
    const { container } = render(<Hero {...BASE} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})

describe('Hero — accessibility', () => {
  it('labels the section by the headline', () => {
    render(<Hero {...BASE} />)
    const region = screen.getByRole('region')
    const heading = screen.getByRole('heading', { name: /record like you mean it/i })
    expect(region).toHaveAttribute('aria-labelledby', heading.id)
  })
})
