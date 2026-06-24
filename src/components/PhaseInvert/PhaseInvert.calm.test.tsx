import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PhaseInvertCalm } from './PhaseInvert.calm'

describe('PhaseInvertCalm', () => {
  it('reflects inverted state via aria-pressed and toggles', () => {
    const onToggle = vi.fn()
    const { getByRole, rerender } = render(<PhaseInvertCalm inverted={false} onToggle={onToggle} />)
    const btn = getByRole('button', { name: 'Invert phase' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(onToggle).toHaveBeenCalledWith(true)
    rerender(<PhaseInvertCalm inverted onToggle={onToggle} />)
    expect(getByRole('button')).toHaveAttribute('data-inverted', 'true')
  })
})
