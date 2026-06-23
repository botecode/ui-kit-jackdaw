import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ArmButtonCalm } from './ArmButton.calm'

describe('ArmButtonCalm', () => {
  it('reflects armed state via aria-pressed', () => {
    const { rerender, getByRole } = render(<ArmButtonCalm armed={false} onToggle={() => {}} />)
    expect(getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    rerender(<ArmButtonCalm armed onToggle={() => {}} />)
    expect(getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks recording (drives the breath) with a data attribute', () => {
    const { getByRole } = render(<ArmButtonCalm armed recording onToggle={() => {}} />)
    expect(getByRole('button')).toHaveAttribute('data-recording', 'true')
  })

  it('fires onToggle on click and not when disabled', () => {
    const onToggle = vi.fn()
    const { getByRole, rerender } = render(<ArmButtonCalm armed={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    rerender(<ArmButtonCalm armed={false} onToggle={onToggle} disabled />)
    expect(getByRole('button')).toBeDisabled()
  })
})
