// src/components/DeviceChassis/DeviceChassis.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DeviceChassis } from './DeviceChassis'

// ── Header bay ─────────────────────────────────────────────────────────────────

describe('DeviceChassis — header bay', () => {
  it('renders a labelled region, defaulting to "Studio"', () => {
    render(<DeviceChassis>body</DeviceChassis>)
    expect(screen.getByRole('region', { name: 'Studio' })).toBeInTheDocument()
  })

  it('derives the region label from the project name', () => {
    render(<DeviceChassis projectName="Night Drive">body</DeviceChassis>)
    expect(screen.getByRole('region', { name: 'Night Drive studio' })).toBeInTheDocument()
  })

  it('honours an explicit aria-label', () => {
    render(<DeviceChassis aria-label="My machine">body</DeviceChassis>)
    expect(screen.getByRole('region', { name: 'My machine' })).toBeInTheDocument()
  })

  it('shows the project name', () => {
    render(<DeviceChassis projectName="Night Drive">body</DeviceChassis>)
    expect(screen.getByTitle('Night Drive')).toBeInTheDocument()
  })

  it('renders a default brand mark when no brand slot is given', () => {
    render(<DeviceChassis>body</DeviceChassis>)
    expect(screen.getByRole('img', { name: 'Jackdaw' })).toBeInTheDocument()
  })

  it('renders a custom brand slot in place of the default mark', () => {
    render(<DeviceChassis brand={<span data-testid="brand">B</span>}>body</DeviceChassis>)
    expect(screen.getByTestId('brand')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Jackdaw' })).not.toBeInTheDocument()
  })
})

// ── Dirty (unsaved) indicator ──────────────────────────────────────────────────

describe('DeviceChassis — dirty indicator', () => {
  it('shows the unsaved-changes mark only when dirty', () => {
    const { rerender } = render(<DeviceChassis projectName="P">body</DeviceChassis>)
    expect(screen.queryByLabelText('Unsaved changes')).not.toBeInTheDocument()
    rerender(<DeviceChassis projectName="P" dirty>body</DeviceChassis>)
    expect(screen.getByLabelText('Unsaved changes')).toBeInTheDocument()
  })
})

// ── LCD well (readout wrapped in the stage Panel) ───────────────────────────────

describe('DeviceChassis — LCD well', () => {
  it('wraps the readout in the dark stage Panel', () => {
    render(
      <DeviceChassis readout={<span data-testid="readout">12.3.04</span>}>body</DeviceChassis>,
    )
    const readout = screen.getByTestId('readout')
    expect(readout).toBeInTheDocument()
    // The stage Panel renders a section with data-tone="stage" around the readout.
    expect(readout.closest('[data-tone="stage"]')).toBeInTheDocument()
  })

  it('omits the well entirely when no readout is provided (bare-frame fallback)', () => {
    const { container } = render(<DeviceChassis>body</DeviceChassis>)
    expect(container.querySelector('[data-tone="stage"]')).toBeNull()
  })
})

// ── Transport / trailing slots ──────────────────────────────────────────────────

describe('DeviceChassis — control slots', () => {
  it('renders the transport and trailing slots', () => {
    render(
      <DeviceChassis
        transport={<button>play</button>}
        trailing={<span data-testid="take">Take 3</span>}
      >
        body
      </DeviceChassis>,
    )
    expect(screen.getByRole('button', { name: 'play' })).toBeInTheDocument()
    expect(screen.getByTestId('take')).toBeInTheDocument()
  })
})

// ── Content region ──────────────────────────────────────────────────────────────

describe('DeviceChassis — content region', () => {
  it('renders the children body', () => {
    render(
      <DeviceChassis aria-label="chassis">
        <div data-testid="studio-body">tape + cards</div>
      </DeviceChassis>,
    )
    const region = screen.getByRole('region', { name: 'chassis' })
    expect(within(region).getByTestId('studio-body')).toHaveTextContent('tape + cards')
  })
})

// ── Passthrough ─────────────────────────────────────────────────────────────────

describe('DeviceChassis — passthrough', () => {
  it('applies className, style and size', () => {
    render(
      <DeviceChassis aria-label="c" className="custom" style={{ width: 400 }} size="sm">
        body
      </DeviceChassis>,
    )
    const region = screen.getByRole('region', { name: 'c' })
    expect(region).toHaveClass('custom')
    expect(region).toHaveStyle({ width: '400px' })
    expect(region).toHaveAttribute('data-size', 'sm')
  })

  it('defaults to size md', () => {
    render(<DeviceChassis aria-label="c">body</DeviceChassis>)
    expect(screen.getByRole('region', { name: 'c' })).toHaveAttribute('data-size', 'md')
  })
})
