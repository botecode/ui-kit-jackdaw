import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { RepeatToggleCalm } from './RepeatToggle.calm'

describe('RepeatToggleCalm', () => {
  it('reflects state via aria-pressed and toggles', () => {
    const onToggle = vi.fn()
    const { getByRole, rerender } = render(<RepeatToggleCalm repeating={false} onToggle={onToggle} />)
    const btn = getByRole('button', { name: 'Loop' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(onToggle).toHaveBeenCalledWith(true)
    rerender(<RepeatToggleCalm repeating onToggle={onToggle} />)
    expect(getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(getByRole('button')).toHaveAttribute('data-repeating', 'true')
  })
})
