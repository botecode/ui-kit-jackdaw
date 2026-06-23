import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ToggleCalm } from './Toggle.calm'

describe('ToggleCalm', () => {
  it('exposes switch semantics and toggles', () => {
    const onChange = vi.fn()
    const { getByRole, rerender } = render(<ToggleCalm checked={false} onChange={onChange} aria-label="Mono" />)
    const sw = getByRole('switch', { name: 'Mono' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(sw)
    expect(onChange.mock.calls[0][0]).toBe(true)
    rerender(<ToggleCalm checked onChange={onChange} aria-label="Mono" />)
    expect(getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    expect(getByRole('switch')).toHaveAttribute('data-checked', 'true')
  })

  it('is disabled when disabled', () => {
    const { getByRole } = render(<ToggleCalm checked={false} onChange={() => {}} disabled aria-label="x" />)
    expect(getByRole('switch')).toBeDisabled()
  })
})
