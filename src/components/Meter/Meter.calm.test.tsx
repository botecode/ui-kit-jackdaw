import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MeterCalm } from './Meter.calm'

describe('MeterCalm', () => {
  it('exposes meter semantics for a mono level', () => {
    const { getByRole } = render(<MeterCalm value={-12} aria-label="Level" />)
    const meter = getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '-12')
    expect(meter).toHaveAttribute('aria-label', 'Level')
  })

  it('renders two channels (L/R) when stereo', () => {
    const { getAllByRole } = render(<MeterCalm valueL={-6} valueR={-18} aria-label="Level" />)
    const meters = getAllByRole('meter')
    expect(meters).toHaveLength(2)
    expect(meters[0]).toHaveAttribute('aria-label', 'Level L')
    expect(meters[1]).toHaveAttribute('aria-label', 'Level R')
  })
})
