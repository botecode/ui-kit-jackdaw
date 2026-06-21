import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { ColorSwatch, SwatchPalette, SwatchPicker, DEFAULT_PALETTE } from './ColorSwatch'

const PALETTE = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

// ── ColorSwatch ──────────────────────────────────────────────────────────────

describe('ColorSwatch rendering', () => {
  it('renders with role="radio"', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" />)
    expect(screen.getByRole('radio', { name: 'Red' })).toBeInTheDocument()
  })

  it('aria-checked="false" when not selected', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" />)
    expect(screen.getByRole('radio').getAttribute('aria-checked')).toBe('false')
  })

  it('aria-checked="true" when selected', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" selected />)
    expect(screen.getByRole('radio').getAttribute('aria-checked')).toBe('true')
  })

  it('renders checkmark SVG when selected', () => {
    const { container } = render(<ColorSwatch color="#ff0000" aria-label="Red" selected />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('does not render checkmark when not selected', () => {
    const { container } = render(<ColorSwatch color="#ff0000" aria-label="Red" />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('data-selected attribute present when selected', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" selected />)
    expect(screen.getByRole('radio')).toHaveAttribute('data-selected')
  })

  it('data-selected attribute absent when not selected', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" />)
    expect(screen.getByRole('radio')).not.toHaveAttribute('data-selected')
  })

  it('data-size="md" by default', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" />)
    expect(screen.getByRole('radio')).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" size="sm" />)
    expect(screen.getByRole('radio')).toHaveAttribute('data-size', 'sm')
  })

  it('is disabled when disabled=true', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" disabled />)
    expect(screen.getByRole('radio')).toBeDisabled()
  })

  it('sets --_swatch-color CSS variable via inline style', () => {
    render(<ColorSwatch color="#ff0000" aria-label="Red" />)
    const el = screen.getByRole('radio')
    expect(el.getAttribute('style')).toContain('--_swatch-color: #ff0000')
  })
})

describe('ColorSwatch interaction', () => {
  it('calls onClick with the color when clicked', () => {
    const onClick = vi.fn()
    render(<ColorSwatch color="#ff0000" aria-label="Red" onClick={onClick} />)
    fireEvent.click(screen.getByRole('radio'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledWith('#ff0000')
  })

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn()
    render(<ColorSwatch color="#ff0000" aria-label="Red" onClick={onClick} disabled />)
    fireEvent.click(screen.getByRole('radio'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('calls onKeyDown when a key is pressed', () => {
    const onKeyDown = vi.fn()
    render(<ColorSwatch color="#ff0000" aria-label="Red" onKeyDown={onKeyDown} />)
    fireEvent.keyDown(screen.getByRole('radio'), { key: 'ArrowRight' })
    expect(onKeyDown).toHaveBeenCalledOnce()
  })
})

// ── SwatchPalette ─────────────────────────────────────────────────────────────

describe('SwatchPalette rendering', () => {
  it('renders a div with role="radiogroup"', () => {
    render(<SwatchPalette value={null} palette={PALETTE} onChange={vi.fn()} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders the correct number of swatches', () => {
    render(<SwatchPalette value={null} palette={PALETTE} onChange={vi.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(6)
  })

  it('marks the selected color swatch as aria-checked="true"', () => {
    render(<SwatchPalette value="#00ff00" palette={PALETTE} onChange={vi.fn()} />)
    const radios = screen.getAllByRole('radio')
    const checked = radios.filter(r => r.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveAttribute('aria-label', '#00ff00')
  })

  it('all other swatches are aria-checked="false"', () => {
    render(<SwatchPalette value="#00ff00" palette={PALETTE} onChange={vi.fn()} />)
    const radios = screen.getAllByRole('radio')
    const unchecked = radios.filter(r => r.getAttribute('aria-checked') === 'false')
    expect(unchecked).toHaveLength(5)
  })

  it('applies the aria-label to the radiogroup', () => {
    render(
      <SwatchPalette
        value={null}
        palette={PALETTE}
        onChange={vi.fn()}
        aria-label="Pick track color"
      />,
    )
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Pick track color')
  })

  it('first swatch gets tabIndex=0 when value is null', () => {
    render(<SwatchPalette value={null} palette={PALETTE} onChange={vi.fn()} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('tabIndex', '0')
    expect(radios[1]).toHaveAttribute('tabIndex', '-1')
  })

  it('selected swatch gets tabIndex=0, others get -1', () => {
    render(<SwatchPalette value="#0000ff" palette={PALETTE} onChange={vi.fn()} />)
    const radios = screen.getAllByRole('radio')
    // #0000ff is index 2
    expect(radios[2]).toHaveAttribute('tabIndex', '0')
    expect(radios[0]).toHaveAttribute('tabIndex', '-1')
    expect(radios[1]).toHaveAttribute('tabIndex', '-1')
  })
})

describe('SwatchPalette interaction', () => {
  it('clicking a swatch calls onChange with its color', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value={null} palette={PALETTE} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('radio')[1])
    expect(onChange).toHaveBeenCalledWith('#00ff00')
  })

  it('ArrowRight moves to next swatch and calls onChange', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#ff0000" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('#00ff00')
  })

  it('ArrowLeft moves to previous swatch and calls onChange', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#00ff00" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[1], { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('ArrowDown moves to next swatch (same as ArrowRight)', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#ff0000" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowDown' })
    expect(onChange).toHaveBeenCalledWith('#00ff00')
  })

  it('ArrowUp moves to previous swatch (same as ArrowLeft)', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#00ff00" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[1], { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('ArrowRight wraps from last to first', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#00ffff" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[5], { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('ArrowLeft wraps from first to last', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#ff0000" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('#00ffff')
  })

  it('Home key moves to first swatch', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#0000ff" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[2], { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('End key moves to last swatch', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value="#ff0000" palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('#00ffff')
  })

  it('unhandled keys do not call onChange', () => {
    const onChange = vi.fn()
    render(<SwatchPalette value={null} palette={PALETTE} onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'Tab' })
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ── SwatchPicker ──────────────────────────────────────────────────────────────

describe('SwatchPicker rendering', () => {
  it('renders a trigger button with aria-haspopup="true"', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button').getAttribute('aria-haspopup')).toBe('true')
  })

  it('aria-expanded="false" when closed', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  })

  it('palette not rendered when closed', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} />)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('trigger is disabled when disabled=true', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('uses DEFAULT_PALETTE when no palette prop provided', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} defaultOpen />)
    expect(screen.getAllByRole('radio')).toHaveLength(DEFAULT_PALETTE.length)
  })

  it('data-size="md" on the trigger by default', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" on the trigger when size="sm"', () => {
    render(<SwatchPicker value={null} onChange={vi.fn()} size="sm" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
  })
})

describe('SwatchPicker open/close', () => {
  it('clicking the trigger opens the palette', () => {
    render(<SwatchPicker value={null} palette={PALETTE} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('aria-expanded="true" when open', () => {
    render(<SwatchPicker value={null} palette={PALETTE} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  })

  it('clicking the trigger again closes the palette', () => {
    render(<SwatchPicker value={null} palette={PALETTE} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('disabled: clicking does not open the palette', () => {
    render(<SwatchPicker value={null} palette={PALETTE} onChange={vi.fn()} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('defaultOpen=true opens on mount', () => {
    render(<SwatchPicker value={null} palette={PALETTE} onChange={vi.fn()} defaultOpen />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })
})

describe('SwatchPicker selection', () => {
  it('selecting a color calls onChange with that color', () => {
    const onChange = vi.fn()
    render(<SwatchPicker value={null} palette={PALETTE} onChange={onChange} defaultOpen />)
    fireEvent.click(screen.getAllByRole('radio')[2])
    expect(onChange).toHaveBeenCalledWith('#0000ff')
  })

  it('selecting a color closes the palette', () => {
    const onChange = vi.fn()
    render(<SwatchPicker value={null} palette={PALETTE} onChange={onChange} defaultOpen />)
    fireEvent.click(screen.getAllByRole('radio')[0])
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('selected swatch is aria-checked inside the open palette', () => {
    render(
      <SwatchPicker value="#00ff00" palette={PALETTE} onChange={vi.fn()} defaultOpen />,
    )
    const checked = screen
      .getAllByRole('radio')
      .find(r => r.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveAttribute('aria-label', '#00ff00')
  })

  it('clicking outside closes the palette (mousedown outside)', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <SwatchPicker value={null} palette={PALETTE} onChange={vi.fn()} />
      </div>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})
