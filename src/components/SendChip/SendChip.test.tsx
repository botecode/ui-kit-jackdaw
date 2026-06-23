// src/components/SendChip/SendChip.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SendChip } from './SendChip'
import type { SendEntry, ReturnEntry } from './SendChip'

const noop = vi.fn()

const RETURNS: ReturnEntry[] = [
  { id: 'r1', name: 'Reverb' },
  { id: 'r2', name: 'Parallel Comp' },
]

const ONE_SEND: SendEntry[] = [
  { returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post', pan: 0 },
]

const TWO_SENDS: SendEntry[] = [
  { returnId: 'r1', returnName: 'Reverb',        level: 0.75, tap: 'post', pan: 0    },
  { returnId: 'r2', returnName: 'Parallel Comp', level: 0.5,  tap: 'pre',  pan: -0.4 },
]

const THREE_SENDS: SendEntry[] = [
  { returnId: 'r1', returnName: 'Reverb',        level: 0.75, tap: 'post', pan: 0    },
  { returnId: 'r2', returnName: 'Parallel Comp', level: 0.5,  tap: 'pre',  pan: -0.4 },
  { returnId: 'r3', returnName: 'Room',          level: 0.4,  tap: 'post', pan: 0    },
]

const DEFAULT_PROPS = {
  sends:          [],
  returns:        RETURNS,
  onAddSend:      noop,
  onSetSendLevel: noop,
  onSetSendTap:   noop,
  onSetSendPan:   noop,
  onRemoveSend:   noop,
}

beforeEach(() => { noop.mockClear() })

// ── Chip rendering ────────────────────────────────────────────────────────────

describe('SendChip chip rendering', () => {
  it('renders "→ Reverb" in the chip label', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    expect(screen.getByRole('button', { name: /Send to Reverb/i })).toBeInTheDocument()
    expect(screen.getByText('→ Reverb')).toBeInTheDocument()
  })

  it('renders level as integer 0–100', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders level 75 for 0.75', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} />)
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('shows "pre" badge when tap=pre', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} />)
    expect(screen.getByText('pre')).toBeInTheDocument()
  })

  it('does not show "pre" badge when tap=post', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    expect(screen.queryByText('pre')).not.toBeInTheDocument()
  })

  it('shows automation dot when automated=true', () => {
    const automatedSend: SendEntry[] = [{ ...ONE_SEND[0], automated: true }]
    render(<SendChip {...DEFAULT_PROPS} sends={automatedSend} />)
    expect(screen.getByTitle('automated')).toBeInTheDocument()
  })

  it('chip button aria-label includes "automated" when automated=true', () => {
    const automatedSend: SendEntry[] = [{ ...ONE_SEND[0], automated: true }]
    render(<SendChip {...DEFAULT_PROPS} sends={automatedSend} />)
    expect(screen.getByRole('button', { name: /Send to Reverb, automated/i })).toBeInTheDocument()
  })

  it('no automation dot when automated=false/undefined', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    expect(screen.queryByTitle('automated')).not.toBeInTheDocument()
  })

  it('chip button is aria-haspopup="dialog"', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    const btn = screen.getByRole('button', { name: /Send to Reverb/i })
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('chip button is aria-expanded=false when closed', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    const btn = screen.getByRole('button', { name: /Send to Reverb/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('applies --send-color as inline CSS custom property', () => {
    const colored: SendEntry[] = [{ ...ONE_SEND[0], color: '#7ec8a4' }]
    const { container } = render(<SendChip {...DEFAULT_PROPS} sends={colored} />)
    const chipRoot = container.querySelector('[data-send-id]') as HTMLElement
    expect(chipRoot.style.getPropertyValue('--send-color')).toBe('#7ec8a4')
  })

  it('renders two chip buttons for two sends', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} />)
    expect(screen.getAllByRole('button', { name: /Send to/i })).toHaveLength(2)
  })

  it('disabled prop disables all chip buttons', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} disabled />)
    expect(screen.getByRole('button', { name: /Send to Reverb/i })).toBeDisabled()
  })

  it('root has data-size="md" by default', () => {
    const { container } = render(<SendChip {...DEFAULT_PROPS} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('root has data-size="sm" when size="sm"', () => {
    const { container } = render(<SendChip {...DEFAULT_PROPS} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('renders "+ Send" affordance button always', () => {
    render(<SendChip {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /add send/i })).toBeInTheDocument()
  })
})

// ── Pan hint on chip ──────────────────────────────────────────────────────────

describe('SendChip chip pan hint', () => {
  it('no pan hint when pan is center (0)', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    expect(screen.queryByText('L')).not.toBeInTheDocument()
    expect(screen.queryByText('R')).not.toBeInTheDocument()
  })

  it('no pan hint when pan is undefined (defaults center)', () => {
    const noExplicitPan: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post' }]
    render(<SendChip {...DEFAULT_PROPS} sends={noExplicitPan} />)
    expect(screen.queryByText('L')).not.toBeInTheDocument()
    expect(screen.queryByText('R')).not.toBeInTheDocument()
  })

  it('shows L hint when pan < 0', () => {
    const leftSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post', pan: -0.5 }]
    render(<SendChip {...DEFAULT_PROPS} sends={leftSend} />)
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('shows R hint when pan > 0', () => {
    const rightSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post', pan: 0.5 }]
    render(<SendChip {...DEFAULT_PROPS} sends={rightSend} />)
    expect(screen.getByText('R')).toBeInTheDocument()
  })
})

// ── Popover ───────────────────────────────────────────────────────────────────

describe('SendChip popover', () => {
  it('clicking chip opens dialog', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.getByRole('dialog', { name: /Send to Reverb/i })).toBeInTheDocument()
  })

  it('aria-expanded=true when open', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    const btn = screen.getByRole('button', { name: /Send to Reverb/i })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking chip again closes popover', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    const btn = screen.getByRole('button', { name: /Send to Reverb/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Esc closes the popover', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('outside mousedown closes the popover', () => {
    render(
      <div>
        <div data-testid="outside">out</div>
        <SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('level slider shows level value in dialog', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    expect(slider).toHaveAttribute('aria-valuenow', '100')
  })

  it('ArrowUp on slider calls onSetSendLevel with level+0.05', () => {
    const onSetSendLevel = vi.fn()
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={halfLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    fireEvent.keyDown(slider, { key: 'ArrowUp' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', expect.closeTo(0.55, 4))
  })

  it('ArrowDown on slider calls onSetSendLevel with level-0.05', () => {
    const onSetSendLevel = vi.fn()
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={halfLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    fireEvent.keyDown(slider, { key: 'ArrowDown' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', expect.closeTo(0.45, 4))
  })

  it('level clamped to 1 when ArrowUp from level=1', () => {
    const onSetSendLevel = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    fireEvent.keyDown(slider, { key: 'ArrowUp' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', 1)
  })

  it('level clamped to 0 when ArrowDown from level=0', () => {
    const onSetSendLevel = vi.fn()
    const zeroLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={zeroLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    fireEvent.keyDown(slider, { key: 'ArrowDown' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', 0)
  })

  it('Home key sets level to 0', () => {
    const onSetSendLevel = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.keyDown(screen.getByRole('slider', { name: /send level/i }), { key: 'Home' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', 0)
  })

  it('End key sets level to 1', () => {
    const onSetSendLevel = vi.fn()
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={halfLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.keyDown(screen.getByRole('slider', { name: /send level/i }), { key: 'End' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', 1)
  })

  it('Shift+ArrowUp uses fine step of 0.01', () => {
    const onSetSendLevel = vi.fn()
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={halfLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.keyDown(screen.getByRole('slider', { name: /send level/i }), { key: 'ArrowUp', shiftKey: true })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', expect.closeTo(0.51, 4))
  })

  it('pointer drag up on level slider increases level', () => {
    HTMLElement.prototype.setPointerCapture = vi.fn()
    const onSetSendLevel = vi.fn()
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={halfLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    fireEvent.pointerDown(slider, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(slider, { clientY: 80,  pointerId: 1 }) // 20px up → +0.10
    fireEvent.pointerUp(slider,   { clientY: 80,  pointerId: 1 })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', expect.closeTo(0.6, 4))
  })

  it('tap toggle is aria-checked=false when tap=post', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const tapBtn = screen.getByRole('checkbox', { name: /pre-fader tap/i })
    expect(tapBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('tap toggle is aria-checked=true when tap=pre', () => {
    const preSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'pre', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={preSend} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const tapBtn = screen.getByRole('checkbox', { name: /pre-fader tap/i })
    expect(tapBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('clicking tap toggle calls onSetSendTap(returnId, "pre") when currently post', () => {
    const onSetSendTap = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} onSetSendTap={onSetSendTap} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /pre-fader tap/i }))
    expect(onSetSendTap).toHaveBeenCalledWith('r1', 'pre')
  })

  it('clicking tap toggle calls onSetSendTap(returnId, "post") when currently pre', () => {
    const onSetSendTap = vi.fn()
    const preSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'pre', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={preSend} onSetSendTap={onSetSendTap} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /pre-fader tap/i }))
    expect(onSetSendTap).toHaveBeenCalledWith('r1', 'post')
  })

  it('clicking remove button calls onRemoveSend(returnId) and closes popover', () => {
    const onRemoveSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} onRemoveSend={onRemoveSend} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.click(screen.getByRole('button', { name: /remove send/i }))
    expect(onRemoveSend).toHaveBeenCalledWith('r1')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ── Popover pan row ───────────────────────────────────────────────────────────

describe('SendChip popover pan', () => {
  it('pan slider (PanKnob) renders in popover', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.getByRole('slider', { name: /send pan/i })).toBeInTheDocument()
  })

  it('pan slider shows correct aria-valuenow for center pan', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const panSlider = screen.getByRole('slider', { name: /send pan/i })
    expect(panSlider).toHaveAttribute('aria-valuenow', '0')
  })

  it('ArrowRight on pan slider calls onSetSendPan with pan+0.05', () => {
    const onSetSendPan = vi.fn()
    const centerSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={centerSend} onSetSendPan={onSetSendPan} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.keyDown(screen.getByRole('slider', { name: /send pan/i }), { key: 'ArrowRight' })
    expect(onSetSendPan).toHaveBeenCalledWith('r1', expect.closeTo(0.05, 4))
  })

  it('ArrowLeft on pan slider calls onSetSendPan with pan-0.05', () => {
    const onSetSendPan = vi.fn()
    const centerSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post', pan: 0 }]
    render(<SendChip {...DEFAULT_PROPS} sends={centerSend} onSetSendPan={onSetSendPan} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.keyDown(screen.getByRole('slider', { name: /send pan/i }), { key: 'ArrowLeft' })
    expect(onSetSendPan).toHaveBeenCalledWith('r1', expect.closeTo(-0.05, 4))
  })

  it('double-click on pan slider calls onSetSendPan with 0 (reset to center)', () => {
    const onSetSendPan = vi.fn()
    const pannedSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post', pan: 0.5 }]
    render(<SendChip {...DEFAULT_PROPS} sends={pannedSend} onSetSendPan={onSetSendPan} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.dblClick(screen.getByRole('slider', { name: /send pan/i }))
    expect(onSetSendPan).toHaveBeenCalledWith('r1', 0)
  })

  it('popover dialog renders with title when open', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const dialog = screen.getByRole('dialog', { name: /Send to Reverb/i })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('→ Reverb')).toBeInTheDocument()
  })
})

// ── Picker ────────────────────────────────────────────────────────────────────

describe('SendChip + Send picker', () => {
  it('clicking "+ Send" opens a menu', () => {
    render(<SendChip {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('menu lists all available returns', () => {
    render(<SendChip {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.getByRole('menuitem', { name: 'Reverb' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Parallel Comp' })).toBeInTheDocument()
  })

  it('menu includes "New return…" item', () => {
    render(<SendChip {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.getByRole('menuitem', { name: /new return/i })).toBeInTheDocument()
  })

  it('clicking a return item calls onAddSend(returnId)', () => {
    const onAddSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} onAddSend={onAddSend} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reverb' }))
    expect(onAddSend).toHaveBeenCalledWith('r1')
  })

  it('clicking "New return…" calls onAddSend("new")', () => {
    const onAddSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} onAddSend={onAddSend} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /new return/i }))
    expect(onAddSend).toHaveBeenCalledWith('new')
  })

  it('already-present returns are disabled in the menu', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.getByRole('menuitem', { name: 'Reverb' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('Esc closes the picker menu', () => {
    render(<SendChip {...DEFAULT_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('clicking outside the open picker (mousedown) closes it and does not reopen', () => {
    render(
      <div>
        <div data-testid="outside">out</div>
        <SendChip {...DEFAULT_PROPS} />
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    // Simulate the outside-mousedown + subsequent click on the trigger button.
    // mousedown fires the Popover outside-click handler (closes the menu);
    // the skipNextClick guard must prevent handleClick from reopening it.
    fireEvent.mouseDown(screen.getByRole('button', { name: /add send/i }))
    fireEvent.click(screen.getByRole('button', { name: /add send/i }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// ── Reorder: keyboard (Alt+Arrow) ───────────────────────────────────────────────

describe('SendChip keyboard reorder', () => {
  it('Alt+ArrowRight on first chip calls onReorderSend(id, index+1)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowRight', altKey: true })
    expect(onReorderSend).toHaveBeenCalledWith('r1', 1)
  })

  it('Alt+ArrowLeft on last chip calls onReorderSend(id, index-1)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Parallel Comp/i }), { key: 'ArrowLeft', altKey: true })
    expect(onReorderSend).toHaveBeenCalledWith('r2', 0)
  })

  it('Alt+ArrowLeft at the first slot does nothing (clamped at boundary)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowLeft', altKey: true })
    expect(onReorderSend).not.toHaveBeenCalled()
  })

  it('Alt+ArrowRight at the last slot does nothing (clamped at boundary)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Parallel Comp/i }), { key: 'ArrowRight', altKey: true })
    expect(onReorderSend).not.toHaveBeenCalled()
  })

  it('Arrow without Alt does not reorder (plain arrows are free for other use)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowRight' })
    expect(onReorderSend).not.toHaveBeenCalled()
  })

  it('announces the move via an aria-live status region', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={THREE_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowRight', altKey: true })
    expect(screen.getByRole('status')).toHaveTextContent('Reverb moved to position 2 of 3')
  })

  it('no reorder when onReorderSend is not provided (affordance inert)', () => {
    // Should not throw and should leave the popover-open behavior intact.
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowRight', altKey: true })
    // No status announcement, nothing crashed.
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  it('single chip exposes no reorder (Alt+Arrow is a no-op)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} onReorderSend={onReorderSend} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowRight', altKey: true })
    expect(onReorderSend).not.toHaveBeenCalled()
  })

  it('disabled disables reorder (Alt+Arrow is a no-op)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} disabled />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Send to Reverb/i }), { key: 'ArrowRight', altKey: true })
    expect(onReorderSend).not.toHaveBeenCalled()
  })
})

// ── Reorder: popover Move left / right ──────────────────────────────────────────

describe('SendChip popover move buttons', () => {
  it('popover shows Move left / Move right when reorder is enabled', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.getByRole('button', { name: /move left/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move right/i })).toBeInTheDocument()
  })

  it('no Move buttons without onReorderSend', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.queryByRole('button', { name: /move left/i })).not.toBeInTheDocument()
  })

  it('no Move buttons for a single send', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} onReorderSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.queryByRole('button', { name: /move left/i })).not.toBeInTheDocument()
  })

  it('Move left is disabled for the first chip', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    expect(screen.getByRole('button', { name: /move left/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /move right/i })).not.toBeDisabled()
  })

  it('Move right is disabled for the last chip', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Parallel Comp/i }))
    expect(screen.getByRole('button', { name: /move right/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /move left/i })).not.toBeDisabled()
  })

  it('clicking Move right calls onReorderSend(id, index+1)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={THREE_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    fireEvent.click(screen.getByRole('button', { name: /move right/i }))
    expect(onReorderSend).toHaveBeenCalledWith('r1', 1)
  })

  it('clicking Move left on the middle chip calls onReorderSend(id, index-1)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={THREE_SENDS} onReorderSend={onReorderSend} />)
    fireEvent.click(screen.getByRole('button', { name: /Parallel Comp/i }))
    fireEvent.click(screen.getByRole('button', { name: /move left/i }))
    expect(onReorderSend).toHaveBeenCalledWith('r2', 0)
  })
})

// ── Reorder: pointer drag (real DnD can't run in jsdom — geometry stubbed) ──────

describe('SendChip drag reorder', () => {
  beforeEach(() => { HTMLElement.prototype.setPointerCapture = vi.fn() })

  // Lay the two chips out left→right by stubbing their measured rects.
  function stubChipRects() {
    const roots = Array.from(document.querySelectorAll('[data-send-id]')) as HTMLElement[]
    roots[0].getBoundingClientRect = () => ({ left: 0,   width: 100, right: 100, top: 0, bottom: 24, height: 24, x: 0,   y: 0, toJSON: () => {} }) as DOMRect
    roots[1].getBoundingClientRect = () => ({ left: 110, width: 100, right: 210, top: 0, bottom: 24, height: 24, x: 110, y: 0, toJSON: () => {} }) as DOMRect
  }

  it('dragging the first chip past the second reorders it to the end', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    stubChipRects()
    const chip = screen.getByRole('button', { name: /Send to Reverb/i })
    fireEvent.pointerDown(chip, { clientX: 50, clientY: 10, pointerId: 1, button: 0 })
    fireEvent.pointerMove(chip, { clientX: 200, clientY: 10, pointerId: 1 }) // past r2's midpoint (160)
    fireEvent.pointerUp(chip,   { clientX: 200, clientY: 10, pointerId: 1 })
    expect(onReorderSend).toHaveBeenCalledWith('r1', 1)
  })

  it('a press below the drag threshold stays a click (opens popover, no reorder)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    stubChipRects()
    const chip = screen.getByRole('button', { name: /Send to Reverb/i })
    fireEvent.pointerDown(chip, { clientX: 50, clientY: 10, pointerId: 1, button: 0 })
    fireEvent.pointerMove(chip, { clientX: 52, clientY: 11, pointerId: 1 }) // < 4px → not a drag
    fireEvent.pointerUp(chip,   { clientX: 52, clientY: 11, pointerId: 1 })
    fireEvent.click(chip)
    expect(onReorderSend).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: /Send to Reverb/i })).toBeInTheDocument()
  })

  it('dropping back onto the original slot does not fire a reorder', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    stubChipRects()
    const chip = screen.getByRole('button', { name: /Send to Reverb/i })
    fireEvent.pointerDown(chip, { clientX: 50, clientY: 10, pointerId: 1, button: 0 })
    fireEvent.pointerMove(chip, { clientX: 40, clientY: 10, pointerId: 1 }) // moved but still slot 0
    fireEvent.pointerUp(chip,   { clientX: 40, clientY: 10, pointerId: 1 })
    expect(onReorderSend).not.toHaveBeenCalled()
  })

  it('a completed drag suppresses the trailing click (no popover)', () => {
    const onReorderSend = vi.fn()
    render(<SendChip {...DEFAULT_PROPS} sends={TWO_SENDS} onReorderSend={onReorderSend} />)
    stubChipRects()
    const chip = screen.getByRole('button', { name: /Send to Reverb/i })
    fireEvent.pointerDown(chip, { clientX: 50, clientY: 10, pointerId: 1, button: 0 })
    fireEvent.pointerMove(chip, { clientX: 200, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(chip,   { clientX: 200, clientY: 10, pointerId: 1 })
    fireEvent.click(chip)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
