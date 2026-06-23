import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { TransportBarCalm } from './TransportBar.calm'
import type { TransportBarProps } from './TransportBar'

const noop = () => {}

function props(over: Partial<TransportBarProps> = {}): TransportBarProps {
  return {
    playing: false, recording: false, seconds: 0,
    bpm: 120, numerator: 4, denominator: 4,
    loopEnabled: false, recordState: 'idle', recordMode: 'normal',
    selectionStart: 0, selectionEnd: 0, gridDivision: '1/16', rate: 1,
    onPlay: noop, onStop: noop, onGoToStart: noop, onGoToEnd: noop,
    onToggleRecord: noop, onSelectRecordMode: noop, onToggleLoop: noop,
    onSetTempo: noop, onSetTimeSignature: noop,
    ...over,
  }
}

describe('TransportBarCalm', () => {
  it('renders the transport toolbar with its controls', () => {
    render(<TransportBarCalm {...props()} />)
    expect(screen.getByRole('toolbar', { name: 'Transport' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Loop' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to start' })).toBeInTheDocument()
  })

  it('wires play / stop through their callbacks', () => {
    const onPlay = vi.fn()
    const onStop = vi.fn()
    render(<TransportBarCalm {...props({ onPlay, onStop })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('edits tempo: Enter commits a typed BPM', () => {
    const onSetTempo = vi.fn()
    render(<TransportBarCalm {...props({ onSetTempo })} />)
    fireEvent.keyDown(screen.getByLabelText(/Tempo 120 BPM/), { key: 'Enter' })
    const input = screen.getByLabelText('Tempo in BPM')
    fireEvent.change(input, { target: { value: '90' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSetTempo).toHaveBeenCalledWith(90)
  })

  it('arrow keys nudge tempo from the readout', () => {
    const onSetTempo = vi.fn()
    render(<TransportBarCalm {...props({ onSetTempo })} />)
    fireEvent.keyDown(screen.getByLabelText(/Tempo 120 BPM/), { key: 'ArrowUp' })
    expect(onSetTempo).toHaveBeenLastCalledWith(121)
  })
})
