// src/components/MobileTopBar/MobileTopBar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileTopBar } from './MobileTopBar'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MobileTopBar — structure', () => {
  it('renders a banner landmark', () => {
    render(<MobileTopBar />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the default wordmark', () => {
    render(<MobileTopBar />)
    expect(screen.getByText('Jackdaw')).toBeInTheDocument()
    expect(screen.getByText('.nest')).toBeInTheDocument()
  })

  it('splits a custom brand at the first dot into head + dimmed tail', () => {
    render(<MobileTopBar brand="Studio.fm" />)
    expect(screen.getByText('Studio')).toBeInTheDocument()
    expect(screen.getByText('.fm')).toBeInTheDocument()
  })

  it('renders a brand with no dot as a single head', () => {
    render(<MobileTopBar brand="Jackdaw" />)
    expect(screen.getByText('Jackdaw')).toBeInTheDocument()
  })

  it('renders the QR/sync action with its accessible label', () => {
    render(<MobileTopBar />)
    expect(screen.getByRole('button', { name: /sync devices/i })).toBeInTheDocument()
  })

  it('honours a custom sync label', () => {
    render(<MobileTopBar syncLabel="Connect a phone" />)
    expect(screen.getByRole('button', { name: /connect a phone/i })).toBeInTheDocument()
  })

  it('renders content in the optional left slot', () => {
    render(<MobileTopBar left={<button type="button">Back</button>} />)
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  })

  it('does not put aria-pressed on the momentary sync action (relabel pattern)', () => {
    render(<MobileTopBar />)
    expect(screen.getByRole('button', { name: /sync devices/i })).not.toHaveAttribute('aria-pressed')
  })

  it('defaults to size md and honours size sm', () => {
    const { container, rerender } = render(<MobileTopBar />)
    expect(container.querySelector('header')).toHaveAttribute('data-size', 'md')
    rerender(<MobileTopBar size="sm" />)
    expect(container.querySelector('header')).toHaveAttribute('data-size', 'sm')
  })
})

describe('MobileTopBar — intents', () => {
  it('fires onSync when the QR/sync action is clicked', () => {
    const onSync = vi.fn()
    render(<MobileTopBar onSync={onSync} />)
    fireEvent.click(screen.getByRole('button', { name: /sync devices/i }))
    expect(onSync).toHaveBeenCalledTimes(1)
  })

  it('does not throw when the sync action is clicked without a handler', () => {
    render(<MobileTopBar />)
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /sync devices/i })),
    ).not.toThrow()
  })
})
