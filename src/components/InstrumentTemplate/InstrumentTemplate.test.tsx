// src/components/InstrumentTemplate/InstrumentTemplate.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { InstrumentTemplate } from './InstrumentTemplate'
import type { InstrumentTemplateProps } from './InstrumentTemplate'

const noop = vi.fn()

const INPUT = {
  value: 'in1',
  options: [
    { id: 'in1', label: 'Input 1', inputName: 'ez1073' },
    { id: 'in2', label: 'Input 2' },
  ],
}

const FX = [
  { id: 'fx1', name: 'Drive' },
  { id: 'fx2', name: 'Sweeten' },
]

function props(over: Partial<InstrumentTemplateProps> = {}): InstrumentTemplateProps {
  return {
    name: 'Guitar',
    color: '#7eb8d4',
    input: INPUT,
    fx: FX,
    onNameChange: noop,
    onColorChange: noop,
    onInputChange: noop,
    onFxAdd: noop,
    onFxRemove: noop,
    onFxReorder: noop,
    ...over,
  }
}

beforeEach(() => { noop.mockClear() })

// ── Card: structure ────────────────────────────────────────────────────────────

describe('InstrumentTemplate card', () => {
  it('renders a group labelled by the track name', () => {
    render(<InstrumentTemplate {...props()} />)
    expect(screen.getByRole('group', { name: /Guitar template/i })).toBeInTheDocument()
  })

  it('renders the name in an editable text input', () => {
    render(<InstrumentTemplate {...props()} />)
    const input = screen.getByTestId('name-input') as HTMLInputElement
    expect(input.value).toBe('Guitar')
  })

  it('shows the colour swatches as a radiogroup', () => {
    render(<InstrumentTemplate {...props()} />)
    expect(screen.getByRole('radiogroup', { name: /Track colour/i })).toBeInTheDocument()
  })

  it('shows the FX chain entries by name', () => {
    render(<InstrumentTemplate {...props()} />)
    expect(screen.getByText('Drive')).toBeInTheDocument()
    expect(screen.getByText('Sweeten')).toBeInTheDocument()
  })

  it('renders the origin slot content when provided', () => {
    render(<InstrumentTemplate {...props({ origin: <span>Jackdaw</span> })} />)
    expect(screen.getByText('Jackdaw')).toBeInTheDocument()
  })
})

// ── Card: name editing ─────────────────────────────────────────────────────────

describe('InstrumentTemplate name editing', () => {
  it('typing emits onNameChange with the new value', () => {
    const onNameChange = vi.fn()
    render(<InstrumentTemplate {...props({ onNameChange })} />)
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Bass' } })
    expect(onNameChange).toHaveBeenCalledWith('Bass')
  })

  it('Escape reverts to the value captured at focus-start', () => {
    const onNameChange = vi.fn()
    render(<InstrumentTemplate {...props({ name: 'Original', onNameChange })} />)
    const input = screen.getByTestId('name-input')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onNameChange).toHaveBeenCalledWith('Original')
  })
})

// ── Card: colour + input intents ───────────────────────────────────────────────

describe('InstrumentTemplate colour + input', () => {
  it('clicking a swatch emits onColorChange with the colour', () => {
    const onColorChange = vi.fn()
    render(<InstrumentTemplate {...props({ color: '#7eb8d4', onColorChange })} />)
    // A different preset than the selected one.
    fireEvent.click(screen.getByRole('radio', { name: '#e8a87c' }))
    expect(onColorChange).toHaveBeenCalledWith('#e8a87c')
  })

  it('renders the input selector with the current value', () => {
    render(<InstrumentTemplate {...props()} />)
    const trigger = screen.getByRole('button', { name: /Track input/i })
    expect(trigger).toHaveTextContent('Input 1')
  })

  it('choosing an input option emits onInputChange', () => {
    const onInputChange = vi.fn()
    render(<InstrumentTemplate {...props({ onInputChange })} />)
    fireEvent.click(screen.getByRole('button', { name: /Track input/i }))
    fireEvent.mouseDown(screen.getByRole('option', { name: /Input 2/i }))
    expect(onInputChange).toHaveBeenCalledWith('in2')
  })
})

// ── Card: FX intents (identity only — no bypass, no open-editor) ────────────────

describe('InstrumentTemplate FX chain (cold)', () => {
  it('does NOT render bypass LEDs or open-plugin buttons', () => {
    render(<InstrumentTemplate {...props()} />)
    expect(screen.queryByRole('checkbox', { name: 'Drive' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Open Drive/i })).not.toBeInTheDocument()
  })

  it('clicking Add emits onFxAdd', () => {
    const onFxAdd = vi.fn()
    render(<InstrumentTemplate {...props({ onFxAdd })} />)
    fireEvent.click(screen.getByRole('button', { name: /add effect/i }))
    expect(onFxAdd).toHaveBeenCalledOnce()
  })

  it('clicking × emits onFxRemove with the id', () => {
    const onFxRemove = vi.fn()
    render(<InstrumentTemplate {...props({ onFxRemove })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Drive' }))
    expect(onFxRemove).toHaveBeenCalledWith('fx1')
  })

  it('the ↓ button emits onFxReorder(from, to)', () => {
    const onFxReorder = vi.fn()
    render(<InstrumentTemplate {...props({ onFxReorder })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move Drive down' }))
    expect(onFxReorder).toHaveBeenCalledWith(0, 1)
  })

  it('empty FX shows the cold empty message', () => {
    render(<InstrumentTemplate {...props({ fx: [] })} />)
    expect(screen.getByText(/No effects — add one/i)).toBeInTheDocument()
  })
})

// ── Card: disabled ─────────────────────────────────────────────────────────────

describe('InstrumentTemplate disabled', () => {
  it('marks the group disabled and disables the name input', () => {
    render(<InstrumentTemplate {...props({ disabled: true })} />)
    expect(screen.getByRole('group')).toHaveAttribute('data-disabled', 'true')
    expect(screen.getByTestId('name-input')).toBeDisabled()
  })
})

// ── Tile ───────────────────────────────────────────────────────────────────────

describe('InstrumentTemplate tile', () => {
  it('renders a draggable button labelled by the name', () => {
    render(<InstrumentTemplate {...props({ variant: 'tile' })} />)
    const tile = screen.getByRole('button', { name: /Guitar instrument preset/i })
    expect(tile).toHaveAttribute('draggable', 'true')
  })

  it('does not render the editable form controls', () => {
    render(<InstrumentTemplate {...props({ variant: 'tile' })} />)
    expect(screen.queryByTestId('name-input')).not.toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('drag start writes dragData onto the dataTransfer and calls onDragStart', () => {
    const onDragStart = vi.fn()
    render(
      <InstrumentTemplate
        {...props({ variant: 'tile', dragData: { 'application/x-instrument': 'guitar' }, onDragStart })}
      />
    )
    const setData = vi.fn()
    fireEvent.dragStart(screen.getByRole('button', { name: /Guitar/i }), {
      dataTransfer: { setData, effectAllowed: '' },
    })
    expect(setData).toHaveBeenCalledWith('application/x-instrument', 'guitar')
    expect(onDragStart).toHaveBeenCalledOnce()
  })

  it('disabled tile is not draggable and not focusable', () => {
    render(<InstrumentTemplate {...props({ variant: 'tile', disabled: true })} />)
    const tile = screen.getByRole('button', { name: /Guitar/i })
    expect(tile).not.toHaveAttribute('draggable', 'true')
    expect(tile).toHaveAttribute('tabindex', '-1')
  })

  it('draggable={false} pins the tile', () => {
    render(<InstrumentTemplate {...props({ variant: 'tile', draggable: false })} />)
    expect(screen.getByRole('button', { name: /Guitar/i })).not.toHaveAttribute('draggable', 'true')
  })

  it('renders the origin badge slot in tile mode', () => {
    render(<InstrumentTemplate {...props({ variant: 'tile', origin: <span>Mine</span> })} />)
    expect(screen.getByText('Mine')).toBeInTheDocument()
  })
})
