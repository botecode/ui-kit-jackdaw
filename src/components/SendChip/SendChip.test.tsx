// src/components/SendChip/SendChip.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SendChip } from './SendChip'
import type { SendEntry, ReturnEntry } from './SendChip'

const noop = vi.fn()

const RETURNS: ReturnEntry[] = [
  { id: 'r1', name: 'Reverb' },
  { id: 'r2', name: 'Parallel Comp' },
]

const ONE_SEND: SendEntry[] = [
  { returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'post' },
]

const TWO_SENDS: SendEntry[] = [
  { returnId: 'r1', returnName: 'Reverb',        level: 0.75, tap: 'post' },
  { returnId: 'r2', returnName: 'Parallel Comp', level: 0.5,  tap: 'pre'  },
]

const DEFAULT_PROPS = {
  sends:          [],
  returns:        RETURNS,
  onAddSend:      noop,
  onSetSendLevel: noop,
  onSetSendTap:   noop,
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
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post' }]
    render(<SendChip {...DEFAULT_PROPS} sends={halfLevel} onSetSendLevel={onSetSendLevel} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const slider = screen.getByRole('slider', { name: /send level/i })
    fireEvent.keyDown(slider, { key: 'ArrowUp' })
    expect(onSetSendLevel).toHaveBeenCalledWith('r1', expect.closeTo(0.55, 4))
  })

  it('ArrowDown on slider calls onSetSendLevel with level-0.05', () => {
    const onSetSendLevel = vi.fn()
    const halfLevel: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 0.5, tap: 'post' }]
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

  it('tap toggle is aria-checked=false when tap=post', () => {
    render(<SendChip {...DEFAULT_PROPS} sends={ONE_SEND} />)
    fireEvent.click(screen.getByRole('button', { name: /Send to Reverb/i }))
    const tapBtn = screen.getByRole('checkbox', { name: /pre-fader tap/i })
    expect(tapBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('tap toggle is aria-checked=true when tap=pre', () => {
    const preSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'pre' }]
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
    const preSend: SendEntry[] = [{ returnId: 'r1', returnName: 'Reverb', level: 1, tap: 'pre' }]
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
})
