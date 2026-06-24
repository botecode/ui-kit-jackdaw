import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FaderCalm } from './Fader.calm'
import { dbScale } from './faderScales'

describe('FaderCalm', () => {
  it('exposes slider semantics', () => {
    const { getByRole } = render(<FaderCalm value={0.5} onChange={() => {}} aria-label="Volume" />)
    const slider = getByRole('slider')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '1')
    expect(slider).toHaveAttribute('aria-valuenow', '0.5')
  })

  it('increments on ArrowUp and decrements on ArrowDown', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<FaderCalm value={0.5} onChange={onChange} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowUp' })
    expect(onChange.mock.calls[0][0]).toBeGreaterThan(0.5)
    onChange.mockClear()
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowDown' })
    expect(onChange.mock.calls[0][0]).toBeLessThan(0.5)
  })

  it('jumps to min/max on Home/End', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<FaderCalm value={0.5} onChange={onChange} min={0} max={1} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(getByRole('slider'), { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it('resets to resetValue on double-click', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <FaderCalm value={-30} onChange={onChange} min={-60} max={6} scale={dbScale()} resetValue={0} />,
    )
    fireEvent.doubleClick(getByRole('slider'))
    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('is not focusable or interactive when disabled', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<FaderCalm value={0.5} onChange={onChange} disabled />)
    const slider = getByRole('slider')
    expect(slider).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(slider, { key: 'ArrowUp' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
