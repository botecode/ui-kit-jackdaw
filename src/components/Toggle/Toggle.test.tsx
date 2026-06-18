import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Toggle } from './Toggle'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('Toggle rendering', () => {
  const noop = vi.fn()

  it('renders an element with role="switch"', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch')).toBeInTheDocument()
  })

  it('aria-checked="false" when checked=false', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch').getAttribute('aria-checked')).toBe('false')
  })

  it('aria-checked="true" when checked=true', () => {
    const { getByRole } = render(<Toggle checked onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch').getAttribute('aria-checked')).toBe('true')
  })

  it('no data-checked when checked=false', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch')).not.toHaveAttribute('data-checked')
  })

  it('data-checked present when checked=true', () => {
    const { getByRole } = render(<Toggle checked onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch')).toHaveAttribute('data-checked')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} size="sm" aria-label="toggle" />)
    expect(getByRole('switch').getAttribute('data-size')).toBe('sm')
  })

  it('renders label text when label prop provided', () => {
    const { getByText } = render(<Toggle checked={false} onChange={noop} label="Reverb" />)
    expect(getByText('Reverb')).toBeInTheDocument()
  })

  it('accessible name comes from label text', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} label="Reverb" />)
    expect(getByRole('switch', { name: 'Reverb' })).toBeInTheDocument()
  })

  it('aria-label attribute applied when no label prop', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} aria-label="Enable reverb" />)
    expect(getByRole('switch').getAttribute('aria-label')).toBe('Enable reverb')
  })

  it('sets --_toggle-accent inline style when color provided', () => {
    const { getByRole } = render(
      <Toggle checked={false} onChange={noop} aria-label="toggle" color="#ff6b6b" />,
    )
    expect(getByRole('switch')).toHaveStyle({ '--_toggle-accent': '#ff6b6b' })
  })

  it('no inline style when color absent', () => {
    const { getByRole } = render(<Toggle checked={false} onChange={noop} aria-label="toggle" />)
    expect(getByRole('switch').getAttribute('style')).toBeNull()
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('Toggle interaction', () => {
  it('click calls onChange(true, event) when unchecked', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Toggle checked={false} onChange={onChange} aria-label="toggle" />)
    fireEvent.click(getByRole('switch'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(true, expect.any(Object))
  })

  it('click calls onChange(false, event) when checked', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Toggle checked onChange={onChange} aria-label="toggle" />)
    fireEvent.click(getByRole('switch'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(false, expect.any(Object))
  })

  it('disabled: click does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Toggle checked={false} onChange={onChange} aria-label="toggle" disabled />)
    fireEvent.click(getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
