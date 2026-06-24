import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { SegmentedControlCalm } from './SegmentedControl.calm'

const OPTIONS = [
  { value: 'bars', label: 'Bars' },
  { value: 'time', label: 'Time' },
]

describe('SegmentedControlCalm', () => {
  it('renders a radiogroup with the selected option checked', () => {
    render(<SegmentedControlCalm options={OPTIONS} value="time" onChange={() => {}} aria-label="Mode" />)
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Time' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Bars' })).toHaveAttribute('aria-checked', 'false')
  })

  it('selects on click and via arrow keys', () => {
    const onChange = vi.fn()
    render(<SegmentedControlCalm options={OPTIONS} value="bars" onChange={onChange} aria-label="Mode" />)
    fireEvent.click(screen.getByRole('radio', { name: 'Time' }))
    expect(onChange).toHaveBeenLastCalledWith('time')
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Bars' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('time')
  })
})
