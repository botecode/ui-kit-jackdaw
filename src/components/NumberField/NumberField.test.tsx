// src/components/NumberField/NumberField.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { NumberField } from './NumberField'

const noop = vi.fn()

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('NumberField rendering', () => {
  it('renders role="spinbutton"', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton')).toBeInTheDocument()
  })

  it('aria-valuenow matches value', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuenow')).toBe('120')
  })

  it('aria-valuemin set when min provided', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} min={20} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuemin')).toBe('20')
  })

  it('aria-valuemax set when max provided', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} max={999} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuemax')).toBe('999')
  })

  it('aria-valuetext is formatted value with default precision 0 for step=1', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('120')
  })

  it('aria-valuetext uses explicit precision', () => {
    const { getByRole } = render(
      <NumberField value={3.5} onChange={noop} precision={2} aria-label="Level" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('3.50')
  })

  it('aria-valuetext includes unit', () => {
    const { getByRole } = render(
      <NumberField value={-6} onChange={noop} precision={1} unit="dB" aria-label="Level" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('-6.0 dB')
  })

  it('renders unit text in the DOM', () => {
    const { getByText } = render(
      <NumberField value={-6} onChange={noop} unit="dB" aria-label="Level" />,
    )
    expect(getByText('dB')).toBeInTheDocument()
  })

  it('data-size="md" by default', () => {
    const { container } = render(
      <NumberField value={0} onChange={noop} aria-label="Val" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(
      <NumberField value={0} onChange={noop} size="sm" aria-label="Val" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('renders decrement button', () => {
    const { getByLabelText } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).toBeInTheDocument()
  })

  it('renders increment button', () => {
    const { getByLabelText } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).toBeInTheDocument()
  })

  it('decrement button disabled at min', () => {
    const { getByLabelText } = render(
      <NumberField value={20} onChange={noop} min={20} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).toBeDisabled()
  })

  it('increment button disabled at max', () => {
    const { getByLabelText } = render(
      <NumberField value={999} onChange={noop} max={999} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).toBeDisabled()
  })

  it('decrement button not disabled above min', () => {
    const { getByLabelText } = render(
      <NumberField value={121} onChange={noop} min={20} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).not.toBeDisabled()
  })

  it('increment button not disabled below max', () => {
    const { getByLabelText } = render(
      <NumberField value={120} onChange={noop} max={999} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).not.toBeDisabled()
  })

  it('aria-disabled set when disabled', () => {
    const { getByRole } = render(
      <NumberField value={120} onChange={noop} disabled aria-label="Tempo" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-disabled')).toBe('true')
  })

  it('data-disabled set when disabled', () => {
    const { container } = render(
      <NumberField value={120} onChange={noop} disabled aria-label="Tempo" />,
    )
    expect(container.firstChild).toHaveAttribute('data-disabled')
  })

  it('precision derived from step: step=0.1 → 1 decimal', () => {
    const { getByRole } = render(
      <NumberField value={3.5} onChange={noop} step={0.1} aria-label="Val" />,
    )
    expect(getByRole('spinbutton').getAttribute('aria-valuetext')).toBe('3.5')
  })
})

// ─── Stepper buttons ──────────────────────────────────────────────────────────

describe('NumberField steppers', () => {
  it('pointerDown on increment calls onChange(value + step)', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.pointerDown(getByLabelText('Increase Tempo'))
    expect(onChange).toHaveBeenCalledWith(121)
  })

  it('pointerDown on decrement calls onChange(value - step)', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.pointerDown(getByLabelText('Decrease Tempo'))
    expect(onChange).toHaveBeenCalledWith(119)
  })

  it('increment button is disabled at max so it cannot fire', () => {
    const { getByLabelText } = render(
      <NumberField value={999} onChange={noop} max={999} step={1} aria-label="Tempo" />,
    )
    expect(getByLabelText('Increase Tempo')).toBeDisabled()
  })

  it('decrement button is disabled at min so it cannot fire', () => {
    const { getByLabelText } = render(
      <NumberField value={20} onChange={noop} min={20} step={1} aria-label="Tempo" />,
    )
    expect(getByLabelText('Decrease Tempo')).toBeDisabled()
  })

  it('respects custom step on increment', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={0} onChange={onChange} step={5} aria-label="Val" />,
    )
    fireEvent.pointerDown(getByLabelText('Increase Val'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('respects custom step on decrement', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={10} onChange={onChange} step={5} aria-label="Val" />,
    )
    fireEvent.pointerDown(getByLabelText('Decrease Val'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('increment clamps to max even if step overshoots', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={998} onChange={onChange} max={999} step={5} aria-label="Val" />,
    )
    fireEvent.pointerDown(getByLabelText('Increase Val'))
    expect(onChange).toHaveBeenCalledWith(999)
  })

  it('decrement clamps to min even if step undershoots', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <NumberField value={22} onChange={onChange} min={20} step={5} aria-label="Val" />,
    )
    fireEvent.pointerDown(getByLabelText('Decrease Val'))
    expect(onChange).toHaveBeenCalledWith(20)
  })
})

// ─── Keyboard — display mode ──────────────────────────────────────────────────

describe('NumberField keyboard - display mode', () => {
  it('ArrowUp increments by step', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(121)
  })

  it('ArrowDown decrements by step', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(119)
  })

  it('ArrowUp clamps at max', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={999} onChange={onChange} max={999} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(999)
  })

  it('ArrowDown clamps at min', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={20} onChange={onChange} min={20} step={1} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(20)
  })

  it('Shift+ArrowUp uses fine step (step/10)', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={100} onChange={onChange} step={10} aria-label="Val" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowUp', shiftKey: true })
    expect(onChange).toHaveBeenCalledWith(101)
  })

  it('Shift+ArrowDown uses fine step (step/10)', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={100} onChange={onChange} step={10} aria-label="Val" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'ArrowDown', shiftKey: true })
    expect(onChange).toHaveBeenCalledWith(99)
  })

  it('Enter starts edit mode — shows a text input', () => {
    const { getByRole, queryByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: 'Enter' })
    expect(queryByRole('textbox')).toBeInTheDocument()
  })

  it('Space starts edit mode', () => {
    const { getByRole, queryByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    fireEvent.keyDown(getByRole('spinbutton'), { key: ' ' })
    expect(queryByRole('textbox')).toBeInTheDocument()
  })

  it('disabled: ArrowUp does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} disabled aria-label="Tempo" />,
    )
    // spinbutton still in DOM (not replaced by input), just aria-disabled
    const spinbutton = getByRole('spinbutton')
    fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ─── Edit mode ────────────────────────────────────────────────────────────────

describe('NumberField edit mode', () => {
  function renderEditing(value = 120, overrides: Partial<Parameters<typeof NumberField>[0]> = {}) {
    const onChange = vi.fn()
    const utils = render(
      <NumberField value={value} onChange={onChange} aria-label="Tempo" {...overrides} />,
    )
    fireEvent.keyDown(utils.getByRole('spinbutton'), { key: 'Enter' })
    const input = utils.getByRole('textbox') as HTMLInputElement
    return { ...utils, onChange, input }
  }

  it('input pre-filled with current formatted value', () => {
    const { input } = renderEditing(120)
    expect(input.value).toBe('120')
  })

  it('Enter in edit mode commits and calls onChange', () => {
    const { input, onChange } = renderEditing(120)
    fireEvent.change(input, { target: { value: '140' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(140)
  })

  it('blur commits the edit', () => {
    const { input, onChange } = renderEditing(120)
    fireEvent.change(input, { target: { value: '135' } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(135)
  })

  it('Escape cancels without calling onChange', () => {
    const { input, onChange } = renderEditing(120)
    fireEvent.change(input, { target: { value: '999' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('invalid entry on commit does not call onChange', () => {
    const { input, onChange } = renderEditing(120)
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('commit clamps to min', () => {
    const { input, onChange } = renderEditing(120, { min: 20 })
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(20)
  })

  it('commit clamps to max', () => {
    const { input, onChange } = renderEditing(120, { max: 999 })
    fireEvent.change(input, { target: { value: '5000' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(999)
  })

  it('ArrowUp in edit mode nudges value and calls onChange', () => {
    const { input, onChange } = renderEditing(120)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith(121)
  })

  it('ArrowDown in edit mode nudges value and calls onChange', () => {
    const { input, onChange } = renderEditing(120)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith(119)
  })

  it('after Escape, spinbutton is back in the DOM', () => {
    const { input, getByRole } = renderEditing(120)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(getByRole('spinbutton')).toBeInTheDocument()
  })

  it('after commit (Enter), spinbutton is back in the DOM', () => {
    const { input, getByRole } = renderEditing(120)
    fireEvent.change(input, { target: { value: '130' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(getByRole('spinbutton')).toBeInTheDocument()
  })
})

// ─── Drag ─────────────────────────────────────────────────────────────────────

describe('NumberField drag', () => {
  it('dragging up (−dy) calls onChange with increased value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    const spinbutton = getByRole('spinbutton')
    fireEvent.pointerDown(spinbutton, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(spinbutton, { clientY: 90, pointerId: 1 })  // 10px up
    fireEvent.pointerUp(spinbutton, { pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
    const lastValue = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastValue).toBeGreaterThan(120)
  })

  it('dragging down (+dy) calls onChange with decreased value', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={120} onChange={onChange} step={1} aria-label="Tempo" />,
    )
    const spinbutton = getByRole('spinbutton')
    fireEvent.pointerDown(spinbutton, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(spinbutton, { clientY: 110, pointerId: 1 })  // 10px down
    fireEvent.pointerUp(spinbutton, { pointerId: 1 })
    expect(onChange).toHaveBeenCalled()
    const lastValue = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastValue).toBeLessThan(120)
  })

  it('drag respects max clamp', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <NumberField value={995} onChange={onChange} max={999} step={1} aria-label="Tempo" />,
    )
    const spinbutton = getByRole('spinbutton')
    fireEvent.pointerDown(spinbutton, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(spinbutton, { clientY: 50, pointerId: 1 })  // 50px up → would be 1045 without clamp
    expect(onChange).toHaveBeenLastCalledWith(999)
  })

  it('small movement (< 3px) starts edit mode instead of drag', () => {
    const { getByRole, queryByRole } = render(
      <NumberField value={120} onChange={noop} aria-label="Tempo" />,
    )
    const spinbutton = getByRole('spinbutton')
    fireEvent.pointerDown(spinbutton, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(spinbutton, { clientY: 101, pointerId: 1 })  // 1px — not a real drag
    fireEvent.pointerUp(spinbutton, { pointerId: 1 })
    expect(queryByRole('textbox')).toBeInTheDocument()
  })
})
