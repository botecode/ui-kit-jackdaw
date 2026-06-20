import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PhaseInvert } from './PhaseInvert'

describe('PhaseInvert rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('aria-pressed="false" when inverted=false', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed="true" when inverted=true', () => {
    const { getByRole } = render(<PhaseInvert inverted onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('default aria-label is "Invert phase"', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Invert phase')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <PhaseInvert inverted={false} onToggle={noop} aria-label="Phase flip" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Phase flip')
  })

  it('has data-inverted when inverted=true', () => {
    const { getByRole } = render(<PhaseInvert inverted onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-inverted')
  })

  it('no data-inverted when inverted=false', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-inverted')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={noop} size="sm" />)
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })

  it('renders an SVG glyph inside', () => {
    const { container } = render(<PhaseInvert inverted={false} onToggle={noop} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('PhaseInvert interaction', () => {
  it('clicking fires onToggle with next=true when not inverted', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<PhaseInvert inverted={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('clicking fires onToggle with next=false when inverted', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<PhaseInvert inverted onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('disabled: clicking does not fire onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <PhaseInvert inverted={false} onToggle={onToggle} disabled />,
    )
    fireEvent.click(getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
