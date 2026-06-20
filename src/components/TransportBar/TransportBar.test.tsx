// src/components/TransportBar/TransportBar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TransportBar } from './TransportBar'

const DEFAULTS = {
  playing: false,
  recording: false,
  seconds: 0,
  bpm: 120,
  numerator: 4,
  denominator: 4,
  loopEnabled: false,
  recordState: 'idle' as const,
  recordMode: 'normal' as const,
  selectionStart: 0,
  selectionEnd: 0,
  gridDivision: '1/8',
  rate: 1.0,
  onPlay: vi.fn(),
  onStop: vi.fn(),
  onGoToStart: vi.fn(),
  onGoToEnd: vi.fn(),
  onToggleRecord: vi.fn(),
  onSelectRecordMode: vi.fn(),
  onToggleLoop: vi.fn(),
  onSetTempo: vi.fn(),
  onSetTimeSignature: vi.fn(),
}

// ─── Structure ────────────────────────────────────────────────────────────────

describe('TransportBar structure', () => {
  it('renders a toolbar', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('toolbar')).toBeInTheDocument()
  })

  it('toolbar aria-label is "Transport"', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('toolbar').getAttribute('aria-label')).toBe('Transport')
  })

  it('data-size defaults to "md"', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('toolbar').getAttribute('data-size')).toBe('md')
  })

  it('data-size reflects size prop', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} size="sm" />)
    expect(getByRole('toolbar').getAttribute('data-size')).toBe('sm')
  })
})

// ─── Transport buttons ────────────────────────────────────────────────────────

describe('TransportBar transport buttons', () => {
  it('renders play button', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('play button shows "Pause" label when playing', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} playing />)
    expect(getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  it('renders stop button', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('button', { name: 'Stop' })).toBeInTheDocument()
  })

  it('renders go-to-start button', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('button', { name: 'Go to start' })).toBeInTheDocument()
  })

  it('renders go-to-end button', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('button', { name: 'Go to end' })).toBeInTheDocument()
  })
})

// ─── Record + loop ────────────────────────────────────────────────────────────

describe('TransportBar record and loop', () => {
  it('loop button has aria-pressed=false when loopEnabled=false', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} loopEnabled={false} />)
    expect(getByRole('button', { name: 'Loop' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('loop button has aria-pressed=true when loopEnabled=true', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} loopEnabled />)
    expect(getByRole('button', { name: 'Loop' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('record button is present', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} />)
    expect(getByRole('button', { name: 'Record' })).toBeInTheDocument()
  })
})

// ─── BPM readout ─────────────────────────────────────────────────────────────

describe('TransportBar BPM readout', () => {
  it('shows BPM value', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} bpm={140} />)
    expect(getByRole('button', { name: /140 BPM/ })).toBeInTheDocument()
  })

  it('shows decimal BPM', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} bpm={120.5} />)
    expect(getByRole('button', { name: /120\.5 BPM/ })).toBeInTheDocument()
  })

  it('enter key on BPM button opens input', () => {
    const { getByRole, getByLabelText } = render(<TransportBar {...DEFAULTS} bpm={120} />)
    const bpmBtn = getByRole('button', { name: /120 BPM/ })
    fireEvent.keyDown(bpmBtn, { key: 'Enter' })
    expect(getByLabelText('Tempo in BPM')).toBeInTheDocument()
  })

  it('typing a value and pressing Enter calls onSetTempo', () => {
    const onSetTempo = vi.fn()
    const { getByRole, getByLabelText } = render(
      <TransportBar {...DEFAULTS} bpm={120} onSetTempo={onSetTempo} />,
    )
    fireEvent.keyDown(getByRole('button', { name: /120 BPM/ }), { key: 'Enter' })
    const input = getByLabelText('Tempo in BPM')
    fireEvent.change(input, { target: { value: '140' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetTempo).toHaveBeenCalledWith(140)
  })

  it('ArrowUp on BPM button calls onSetTempo with bpm+1', () => {
    const onSetTempo = vi.fn()
    const { getByRole } = render(
      <TransportBar {...DEFAULTS} bpm={120} onSetTempo={onSetTempo} />,
    )
    fireEvent.keyDown(getByRole('button', { name: /120 BPM/ }), { key: 'ArrowUp' })
    expect(onSetTempo).toHaveBeenCalledWith(121)
  })

  it('ArrowDown on BPM button calls onSetTempo with bpm-1', () => {
    const onSetTempo = vi.fn()
    const { getByRole } = render(
      <TransportBar {...DEFAULTS} bpm={120} onSetTempo={onSetTempo} />,
    )
    fireEvent.keyDown(getByRole('button', { name: /120 BPM/ }), { key: 'ArrowDown' })
    expect(onSetTempo).toHaveBeenCalledWith(119)
  })

  it('Escape in BPM input cancels edit without calling onSetTempo', () => {
    const onSetTempo = vi.fn()
    const { getByRole, getByLabelText, queryByLabelText } = render(
      <TransportBar {...DEFAULTS} bpm={120} onSetTempo={onSetTempo} />,
    )
    fireEvent.keyDown(getByRole('button', { name: /120 BPM/ }), { key: 'Enter' })
    const input = getByLabelText('Tempo in BPM')
    fireEvent.change(input, { target: { value: '999' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onSetTempo).not.toHaveBeenCalled()
    expect(queryByLabelText('Tempo in BPM')).not.toBeInTheDocument()
  })
})

// ─── Time signature readout ───────────────────────────────────────────────────

describe('TransportBar time signature readout', () => {
  it('renders numerator button', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} numerator={4} denominator={4} />)
    expect(getByRole('button', { name: /Beats per bar: 4/ })).toBeInTheDocument()
  })

  it('renders denominator button', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} numerator={4} denominator={4} />)
    expect(getByRole('button', { name: /Beat unit: 4/ })).toBeInTheDocument()
  })

  it('clicking numerator opens inline input', () => {
    const { getByRole, getByLabelText } = render(
      <TransportBar {...DEFAULTS} numerator={4} denominator={4} />,
    )
    fireEvent.click(getByRole('button', { name: /Beats per bar/ }))
    expect(getByLabelText('Time signature numerator')).toBeInTheDocument()
  })

  it('editing numerator and pressing Enter calls onSetTimeSignature', () => {
    const onSetTimeSignature = vi.fn()
    const { getByRole, getByLabelText } = render(
      <TransportBar {...DEFAULTS} numerator={4} denominator={4} onSetTimeSignature={onSetTimeSignature} />,
    )
    fireEvent.click(getByRole('button', { name: /Beats per bar/ }))
    const input = getByLabelText('Time signature numerator')
    fireEvent.change(input, { target: { value: '3' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetTimeSignature).toHaveBeenCalledWith(3, 4)
  })

  it('clicking denominator opens inline input', () => {
    const { getByRole, getByLabelText } = render(
      <TransportBar {...DEFAULTS} numerator={4} denominator={4} />,
    )
    fireEvent.click(getByRole('button', { name: /Beat unit/ }))
    expect(getByLabelText('Time signature denominator')).toBeInTheDocument()
  })
})

// ─── Secondary readouts ───────────────────────────────────────────────────────

describe('TransportBar secondary readouts', () => {
  it('shows grid division', () => {
    const { getByText } = render(<TransportBar {...DEFAULTS} gridDivision="1/16" />)
    expect(getByText('1/16')).toBeInTheDocument()
  })

  it('shows rate', () => {
    const { getByText } = render(<TransportBar {...DEFAULTS} rate={1.0} />)
    expect(getByText('1.00')).toBeInTheDocument()
  })
})

// ─── Callbacks ────────────────────────────────────────────────────────────────

describe('TransportBar callbacks', () => {
  it('clicking play fires onPlay', () => {
    const onPlay = vi.fn()
    const { getByRole } = render(<TransportBar {...DEFAULTS} onPlay={onPlay} />)
    fireEvent.click(getByRole('button', { name: 'Play' }))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it('clicking stop fires onStop', () => {
    const onStop = vi.fn()
    const { getByRole } = render(<TransportBar {...DEFAULTS} onStop={onStop} />)
    fireEvent.click(getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('clicking go-to-start fires onGoToStart', () => {
    const onGoToStart = vi.fn()
    const { getByRole } = render(<TransportBar {...DEFAULTS} onGoToStart={onGoToStart} />)
    fireEvent.click(getByRole('button', { name: 'Go to start' }))
    expect(onGoToStart).toHaveBeenCalledOnce()
  })

  it('clicking go-to-end fires onGoToEnd', () => {
    const onGoToEnd = vi.fn()
    const { getByRole } = render(<TransportBar {...DEFAULTS} onGoToEnd={onGoToEnd} />)
    fireEvent.click(getByRole('button', { name: 'Go to end' }))
    expect(onGoToEnd).toHaveBeenCalledOnce()
  })

  it('clicking loop toggle fires onToggleLoop with true', () => {
    const onToggleLoop = vi.fn()
    const { getByRole } = render(
      <TransportBar {...DEFAULTS} loopEnabled={false} onToggleLoop={onToggleLoop} />,
    )
    fireEvent.click(getByRole('button', { name: 'Loop' }))
    expect(onToggleLoop).toHaveBeenCalledWith(true)
  })
})

// ─── Disabled state ───────────────────────────────────────────────────────────

describe('TransportBar disabled', () => {
  it('play button is disabled', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} disabled />)
    expect(getByRole('button', { name: 'Play' })).toBeDisabled()
  })

  it('stop button is disabled', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} disabled />)
    expect(getByRole('button', { name: 'Stop' })).toBeDisabled()
  })

  it('go-to-start is disabled', () => {
    const { getByRole } = render(<TransportBar {...DEFAULTS} disabled />)
    expect(getByRole('button', { name: 'Go to start' })).toBeDisabled()
  })

  it('clicking play does not fire onPlay when disabled', () => {
    const onPlay = vi.fn()
    const { getByRole } = render(<TransportBar {...DEFAULTS} disabled onPlay={onPlay} />)
    fireEvent.click(getByRole('button', { name: 'Play' }))
    expect(onPlay).not.toHaveBeenCalled()
  })
})
