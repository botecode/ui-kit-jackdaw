import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Button } from './Button'

// A bare icon stand-in — Button takes any ReactNode (phosphor icon or bespoke SVG).
const Icon = () => <svg data-testid="icon" aria-hidden width={16} height={16} />

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Button rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('renders its label children', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button')).toHaveTextContent('Save')
  })

  it('renders an icon when provided', () => {
    const { getByTestId } = render(
      <Button icon={<Icon />} onClick={noop}>Undo</Button>,
    )
    expect(getByTestId('icon')).toBeInTheDocument()
  })

  it('type attribute is "button" (never submits a form by accident)', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button')).toHaveAttribute('type', 'button')
  })
})

// ─── Variant ─────────────────────────────────────────────────────────────────

describe('Button variant', () => {
  const noop = vi.fn()

  it('data-variant is "default" by default', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button').getAttribute('data-variant')).toBe('default')
  })

  it('data-variant reflects the ghost prop', () => {
    const { getByRole } = render(<Button variant="ghost" onClick={noop}>Save</Button>)
    expect(getByRole('button').getAttribute('data-variant')).toBe('ghost')
  })

  it('data-variant reflects the primary prop', () => {
    const { getByRole } = render(<Button variant="primary" onClick={noop}>Save</Button>)
    expect(getByRole('button').getAttribute('data-variant')).toBe('primary')
  })

  it('data-variant reflects the danger prop', () => {
    const { getByRole } = render(<Button variant="danger" onClick={noop}>Delete</Button>)
    expect(getByRole('button').getAttribute('data-variant')).toBe('danger')
  })
})

// ─── Size ────────────────────────────────────────────────────────────────────

describe('Button size', () => {
  const noop = vi.fn()

  it('data-size is "md" by default', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size reflects size prop', () => {
    const { getByRole } = render(<Button size="sm" onClick={noop}>Save</Button>)
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })
})

// ─── Icon-only ───────────────────────────────────────────────────────────────

describe('Button icon-only', () => {
  const noop = vi.fn()

  it('data-icon-only present when there is no label', () => {
    const { getByRole } = render(
      <Button icon={<Icon />} aria-label="Undo" onClick={noop} />,
    )
    expect(getByRole('button')).toHaveAttribute('data-icon-only')
  })

  it('data-icon-only absent when a label is present', () => {
    const { getByRole } = render(
      <Button icon={<Icon />} onClick={noop}>Undo</Button>,
    )
    expect(getByRole('button')).not.toHaveAttribute('data-icon-only')
  })

  it('icon-only without an accessible name warns in dev', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Button icon={<Icon />} onClick={noop} />)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('icon-only with an aria-label does not warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<Button icon={<Icon />} aria-label="Undo" onClick={noop} />)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ─── ARIA ────────────────────────────────────────────────────────────────────

describe('Button aria', () => {
  const noop = vi.fn()

  it('applies aria-label when provided', () => {
    const { getByRole } = render(
      <Button icon={<Icon />} aria-label="Undo" onClick={noop} />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Undo')
  })

  it('a labeled button has no aria-label by default (name comes from text)', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button')).not.toHaveAttribute('aria-label')
  })

  // Action button → relabel pattern, never aria-pressed (KIT-LEAD §5).
  it('never sets aria-pressed', () => {
    const { getByRole } = render(<Button onClick={noop}>Save</Button>)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('Button interaction', () => {
  it('clicking fires onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(<Button onClick={onClick}>Save</Button>)
    fireEvent.click(getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled: is disabled and clicking does not fire onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(<Button disabled onClick={onClick}>Save</Button>)
    expect(getByRole('button')).toBeDisabled()
    fireEvent.click(getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
