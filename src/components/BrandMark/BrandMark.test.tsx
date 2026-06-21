// src/components/BrandMark/BrandMark.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('renders mark variant without throwing', () => {
    render(<BrandMark variant="mark" size={64} />)
  })

  it('renders wordmark variant without throwing', () => {
    render(<BrandMark variant="wordmark" size={64} />)
  })

  it('renders lockup variant without throwing', () => {
    render(<BrandMark variant="lockup" size={64} />)
  })

  it('defaults to mark variant', () => {
    render(<BrandMark size={64} />)
    expect(screen.getByRole('img', { name: 'Jackdaw' })).toHaveAttribute('data-variant', 'mark')
  })

  it('has role="img" with aria-label "Jackdaw"', () => {
    render(<BrandMark variant="mark" size={64} />)
    expect(screen.getByRole('img', { name: 'Jackdaw' })).toBeInTheDocument()
  })

  it('mark variant sets data-variant="mark"', () => {
    render(<BrandMark variant="mark" size={64} />)
    expect(screen.getByRole('img', { name: 'Jackdaw' })).toHaveAttribute('data-variant', 'mark')
  })

  it('wordmark variant sets data-variant="wordmark"', () => {
    render(<BrandMark variant="wordmark" size={64} />)
    expect(screen.getByRole('img', { name: 'Jackdaw' })).toHaveAttribute('data-variant', 'wordmark')
  })

  it('lockup variant sets data-variant="lockup"', () => {
    render(<BrandMark variant="lockup" size={64} />)
    expect(screen.getByRole('img', { name: 'Jackdaw' })).toHaveAttribute('data-variant', 'lockup')
  })

  it('mark variant renders exactly one img (the mark PNG)', () => {
    const { container } = render(<BrandMark variant="mark" size={64} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('wordmark variant renders exactly one img (the wordmark PNG)', () => {
    const { container } = render(<BrandMark variant="wordmark" size={64} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('lockup variant renders two imgs (mark + wordmark)', () => {
    const { container } = render(<BrandMark variant="lockup" size={64} />)
    expect(container.querySelectorAll('img')).toHaveLength(2)
  })

  it('inner imgs have empty alt (container role="img" carries the label)', () => {
    const { container } = render(<BrandMark variant="mark" size={64} />)
    const imgs = container.querySelectorAll('img')
    imgs.forEach(img => expect(img.getAttribute('alt')).toBe(''))
  })
})
