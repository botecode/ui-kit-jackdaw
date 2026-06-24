import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ClockCalm } from './Clock.calm'

describe('ClockCalm', () => {
  it('renders bars position from seconds/bpm', () => {
    // 2s @ 120bpm, 4/4 → 4 beats → bar 2, beat 1, tick 0
    const { getByText } = render(
      <ClockCalm seconds={2} bpm={120} numerator={4} denominator={4} state="stopped" mode="bars" />,
    )
    expect(getByText('2.1.00')).toBeInTheDocument()
  })

  it('toggles mode on click', () => {
    const onModeChange = vi.fn()
    const { getByRole } = render(
      <ClockCalm seconds={0} bpm={120} numerator={4} denominator={4} state="stopped" mode="bars" onModeChange={onModeChange} />,
    )
    fireEvent.click(getByRole('button'))
    expect(onModeChange).toHaveBeenCalledWith('time')
  })

  it('reflects transport state via data-state', () => {
    const { getByRole } = render(
      <ClockCalm seconds={0} bpm={120} numerator={4} denominator={4} state="recording" />,
    )
    expect(getByRole('button')).toHaveAttribute('data-state', 'recording')
  })
})
