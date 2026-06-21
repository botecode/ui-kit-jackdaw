// src/components/SplashScreen/SplashScreen.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplashScreen } from './SplashScreen'

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('SplashScreen — rendering', () => {
  it('renders a root element', () => {
    const { container } = render(<SplashScreen />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders the JACKDAW wordmark', () => {
    render(<SplashScreen />)
    expect(screen.getByText('JACKDAW')).toBeInTheDocument()
  })

  it('renders the BrandMark (role=img)', () => {
    render(<SplashScreen />)
    expect(screen.getByRole('img', { name: /jackdaw/i })).toBeInTheDocument()
  })

  it('shows status text when provided', () => {
    render(<SplashScreen status="Scanning plugins…" />)
    expect(screen.getByText('Scanning plugins…')).toBeInTheDocument()
  })

  it('does not render status element when status is omitted', () => {
    const { container } = render(<SplashScreen />)
    const statusEl = container.querySelector('[data-testid="status-text"]')
    expect(statusEl).not.toBeInTheDocument()
  })

  it('shows version text when provided', () => {
    render(<SplashScreen version="1.2.3" />)
    expect(screen.getByText('1.2.3')).toBeInTheDocument()
  })

  it('does not render version when omitted', () => {
    render(<SplashScreen />)
    // No version element should exist
    const { container } = render(<SplashScreen />)
    expect(container.querySelector('[data-testid="version"]')).not.toBeInTheDocument()
  })
})

// ── ARIA ──────────────────────────────────────────────────────────────────────

describe('SplashScreen — ARIA', () => {
  it('has aria-busy="true" when loading (progress < 1)', () => {
    const { container } = render(<SplashScreen progress={0.5} />)
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
  })

  it('has aria-busy="false" when done (progress = 1)', () => {
    const { container } = render(<SplashScreen progress={1} />)
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
  })

  it('has aria-busy="true" when indeterminate (no progress)', () => {
    const { container } = render(<SplashScreen />)
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
  })

  it('status container has role="status"', () => {
    render(<SplashScreen status="Loading…" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('status container has aria-live="polite"', () => {
    render(<SplashScreen status="Loading…" />)
    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-live', 'polite')
  })

  it('root has an accessible label', () => {
    const { container } = render(<SplashScreen />)
    expect(container.firstChild).toHaveAttribute('aria-label')
  })
})

// ── Data attributes ───────────────────────────────────────────────────────────

describe('SplashScreen — data attributes', () => {
  it('sets data-ready when progress = 1', () => {
    const { container } = render(<SplashScreen progress={1} />)
    expect(container.firstChild).toHaveAttribute('data-ready')
  })

  it('does not set data-ready when progress < 1', () => {
    const { container } = render(<SplashScreen progress={0.5} />)
    expect(container.firstChild).not.toHaveAttribute('data-ready')
  })

  it('does not set data-ready when progress = 0', () => {
    const { container } = render(<SplashScreen progress={0} />)
    expect(container.firstChild).not.toHaveAttribute('data-ready')
  })

  it('sets data-indeterminate when no progress prop', () => {
    const { container } = render(<SplashScreen />)
    expect(container.firstChild).toHaveAttribute('data-indeterminate')
  })

  it('does not set data-indeterminate when progress is provided', () => {
    const { container } = render(<SplashScreen progress={0.5} />)
    expect(container.firstChild).not.toHaveAttribute('data-indeterminate')
  })

  it('does not set data-indeterminate when progress = 0', () => {
    const { container } = render(<SplashScreen progress={0} />)
    expect(container.firstChild).not.toHaveAttribute('data-indeterminate')
  })
})

// ── Progress ──────────────────────────────────────────────────────────────────

describe('SplashScreen — progress', () => {
  it('clamps progress below 0 to 0 (no data-ready)', () => {
    const { container } = render(<SplashScreen progress={-0.5} />)
    expect(container.firstChild).not.toHaveAttribute('data-ready')
  })

  it('clamps progress above 1 to 1 (sets data-ready)', () => {
    const { container } = render(<SplashScreen progress={1.5} />)
    expect(container.firstChild).toHaveAttribute('data-ready')
  })

  it('sets the --_progress CSS custom property on root', () => {
    const { container } = render(<SplashScreen progress={0.42} />)
    const root = container.firstChild as HTMLElement
    expect(root.style.getPropertyValue('--_progress')).toBe('0.42')
  })

  it('does not set --_progress when indeterminate', () => {
    const { container } = render(<SplashScreen />)
    const root = container.firstChild as HTMLElement
    expect(root.style.getPropertyValue('--_progress')).toBe('')
  })
})

// ── onReady callback ──────────────────────────────────────────────────────────

describe('SplashScreen — onReady', () => {
  it('calls onReady when progress reaches 1', () => {
    const onReady = vi.fn()
    render(<SplashScreen progress={1} onReady={onReady} />)
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('does not call onReady when progress < 1', () => {
    const onReady = vi.fn()
    render(<SplashScreen progress={0.99} onReady={onReady} />)
    expect(onReady).not.toHaveBeenCalled()
  })

  it('does not call onReady when indeterminate', () => {
    const onReady = vi.fn()
    render(<SplashScreen onReady={onReady} />)
    expect(onReady).not.toHaveBeenCalled()
  })
})
