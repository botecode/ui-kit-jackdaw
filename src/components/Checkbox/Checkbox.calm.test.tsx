import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { CheckboxCalm } from './Checkbox.calm'

describe('CheckboxCalm', () => {
  it('reflects checked state and fires onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<CheckboxCalm checked={false} onChange={onChange} aria-label="Agree" />)
    const box = getByRole('checkbox', { name: 'Agree' })
    expect(box).not.toBeChecked()
    fireEvent.click(box)
    expect(onChange.mock.calls[0][0]).toBe(true)
  })

  it('carries indeterminate on the native input', () => {
    const { getByRole } = render(<CheckboxCalm checked={false} indeterminate onChange={() => {}} aria-label="Some" />)
    expect((getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true)
  })

  it('does not fire when disabled', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<CheckboxCalm checked={false} onChange={onChange} disabled aria-label="x" />)
    expect(getByRole('checkbox')).toBeDisabled()
    fireEvent.click(getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
