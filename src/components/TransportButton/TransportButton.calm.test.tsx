import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TransportButtonCalm } from './TransportButton.calm'

describe('TransportButtonCalm', () => {
  it('relabels play → pause when playing (no aria-pressed)', () => {
    const { rerender, getByRole } = render(<TransportButtonCalm variant="play" onClick={() => {}} />)
    expect(getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
    rerender(<TransportButtonCalm variant="play" playing onClick={() => {}} />)
    expect(getByRole('button', { name: 'Pause' })).toHaveAttribute('data-playing', 'true')
  })

  it('renders a stop button and fires onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(<TransportButtonCalm variant="stop" onClick={onClick} />)
    fireEvent.click(getByRole('button', { name: 'Stop' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled', () => {
    const { getByRole } = render(<TransportButtonCalm variant="play" onClick={() => {}} disabled />)
    expect(getByRole('button')).toBeDisabled()
  })
})
