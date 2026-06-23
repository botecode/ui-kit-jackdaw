import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { PanKnobCalm } from './PanKnob.calm'

describe('PanKnobCalm', () => {
  it('exposes slider semantics centered at 0', () => {
    const { getByRole } = render(<PanKnobCalm pan={0} onChange={() => {}} />)
    const slider = getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuemin', '-1')
    expect(slider).toHaveAttribute('aria-valuemax', '1')
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(slider).toHaveAttribute('aria-valuetext', 'Center')
  })

  it('steps right/left with arrow keys', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<PanKnobCalm pan={0} onChange={onChange} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(0.05)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(-0.05)
  })

  it('hard-pans to L/R with Home/End', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<PanKnobCalm pan={0} onChange={onChange} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(-1)
    fireEvent.keyDown(getByRole('slider'), { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it('resets to center on double-click', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<PanKnobCalm pan={0.7} onChange={onChange} />)
    fireEvent.doubleClick(getByRole('slider'))
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('is inert when disabled', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<PanKnobCalm pan={0} onChange={onChange} disabled />)
    expect(getByRole('slider')).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
