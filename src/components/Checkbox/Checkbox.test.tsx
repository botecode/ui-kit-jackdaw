import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Checkbox } from './Checkbox'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('Checkbox rendering', () => {
  const noop = vi.fn()

  it('renders an element with role="checkbox"', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} aria-label="test" />)
    expect(getByRole('checkbox')).toBeInTheDocument()
  })

  it('input is checked when checked=true', () => {
    const { getByRole } = render(<Checkbox checked onChange={noop} aria-label="test" />)
    expect(getByRole('checkbox')).toBeChecked()
  })

  it('input is not checked when checked=false', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} aria-label="test" />)
    expect(getByRole('checkbox')).not.toBeChecked()
  })

  it('input is disabled when disabled=true', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} aria-label="test" disabled />)
    expect(getByRole('checkbox')).toBeDisabled()
  })

  it('renders label text when label prop provided', () => {
    const { getByText } = render(<Checkbox checked={false} onChange={noop} label="Muted" />)
    expect(getByText('Muted')).toBeInTheDocument()
  })

  it('accessible name comes from label text', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} label="Muted" />)
    expect(getByRole('checkbox', { name: 'Muted' })).toBeInTheDocument()
  })

  it('aria-label applied when no label prop', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} aria-label="Mute track" />)
    expect(getByRole('checkbox').getAttribute('aria-label')).toBe('Mute track')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} aria-label="test" />)
    expect(getByRole('checkbox').closest('[data-size]')?.getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={noop} aria-label="test" size="sm" />)
    expect(getByRole('checkbox').closest('[data-size]')?.getAttribute('data-size')).toBe('sm')
  })
})

// ─── Indeterminate ───────────────────────────────────────────────────────────

describe('Checkbox indeterminate', () => {
  it('sets .indeterminate on the input when indeterminate=true', () => {
    const { getByRole } = render(
      <Checkbox checked={false} onChange={vi.fn()} indeterminate aria-label="test" />,
    )
    expect((getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true)
  })

  it('.indeterminate is false when indeterminate=false', () => {
    const { getByRole } = render(
      <Checkbox checked={false} onChange={vi.fn()} indeterminate={false} aria-label="test" />,
    )
    expect((getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(false)
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('Checkbox interaction', () => {
  it('click calls onChange(true, event) when unchecked', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Checkbox checked={false} onChange={onChange} aria-label="test" />)
    fireEvent.click(getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(true, expect.any(Object))
  })

  it('click calls onChange(false, event) when checked', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Checkbox checked onChange={onChange} aria-label="test" />)
    fireEvent.click(getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(false, expect.any(Object))
  })

  it('disabled: click does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<Checkbox checked={false} onChange={onChange} aria-label="test" disabled />)
    fireEvent.click(getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
