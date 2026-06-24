import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { KnobCalm } from './Knob.calm'

describe('KnobCalm', () => {
  it('exposes slider semantics over [min,max]', () => {
    const { getByRole } = render(<KnobCalm value={50} min={0} max={100} onChange={() => {}} aria-label="Drive" />)
    const slider = getByRole('slider', { name: 'Drive' })
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '100')
    expect(slider).toHaveAttribute('aria-valuenow', '50')
  })

  it('steps with arrow keys and clamps at the ends', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<KnobCalm value={50} min={0} max={100} step={1} onChange={onChange} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(51)
    fireEvent.keyDown(getByRole('slider'), { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(getByRole('slider'), { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(100)
  })

  it('resets on double-click', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<KnobCalm value={80} min={0} max={100} resetValue={50} onChange={onChange} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(onChange).toHaveBeenCalledWith(50)
  })
})
