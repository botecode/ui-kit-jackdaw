import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileRecordButton } from './MobileRecordButton'

const noop = vi.fn()
beforeEach(() => vi.clearAllMocks())

const BASE = {
  state:   'idle' as const,
  onStart: noop,
  onStop:  noop,
}

describe('MobileRecordButton — labels (relabel pattern)', () => {
  it('idle: label is "Record", no aria-pressed', () => {
    render(<MobileRecordButton {...BASE} state="idle" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toHaveAttribute('aria-pressed')
  })

  it('stopped: label returns to "Record" (next press starts a new take)', () => {
    render(<MobileRecordButton {...BASE} state="stopped" />)
    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument()
  })

  it('recording: label flips to "Stop recording"', () => {
    render(<MobileRecordButton {...BASE} state="recording" />)
    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument()
  })

  it('honours an aria-label override', () => {
    render(<MobileRecordButton {...BASE} aria-label="Capture take" />)
    expect(screen.getByRole('button', { name: 'Capture take' })).toBeInTheDocument()
  })
})

describe('MobileRecordButton — start / stop intents', () => {
  it('idle press fires onStart, not onStop', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    render(<MobileRecordButton {...BASE} state="idle" onStart={onStart} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()
  })

  it('stopped press fires onStart (record again)', () => {
    const onStart = vi.fn()
    render(<MobileRecordButton {...BASE} state="stopped" onStart={onStart} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('recording press fires onStop, not onStart', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    render(<MobileRecordButton {...BASE} state="recording" onStart={onStart} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onStart).not.toHaveBeenCalled()
  })
})

describe('MobileRecordButton — disabled (no mic permission)', () => {
  it('renders a disabled button and fires nothing on click', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    render(<MobileRecordButton {...BASE} state="disabled" onStart={onStart} onStop={onStop} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onStart).not.toHaveBeenCalled()
    expect(onStop).not.toHaveBeenCalled()
  })

  it('shows the permission hint', () => {
    render(<MobileRecordButton {...BASE} state="disabled" />)
    expect(screen.getByText('Microphone access needed')).toBeInTheDocument()
  })
})

describe('MobileRecordButton — timer readout', () => {
  it('formats elapsed seconds as m:ss', () => {
    render(<MobileRecordButton {...BASE} state="recording" elapsedSeconds={83} />)
    expect(screen.getByTestId('record-timer')).toHaveTextContent('1:23')
  })

  it('pads single-digit seconds (5 → 0:05)', () => {
    render(<MobileRecordButton {...BASE} state="recording" elapsedSeconds={5} />)
    expect(screen.getByTestId('record-timer')).toHaveTextContent('0:05')
  })

  it('clamps negative elapsed to 0:00', () => {
    render(<MobileRecordButton {...BASE} state="idle" elapsedSeconds={-10} />)
    expect(screen.getByTestId('record-timer')).toHaveTextContent('0:00')
  })

  it('shows the frozen length when stopped', () => {
    render(<MobileRecordButton {...BASE} state="stopped" elapsedSeconds={127} />)
    expect(screen.getByTestId('record-timer')).toHaveTextContent('2:07')
  })
})

describe('MobileRecordButton — level meter', () => {
  it('renders the meter only while recording', () => {
    const { rerender } = render(<MobileRecordButton {...BASE} state="idle" />)
    expect(screen.queryByTestId('record-meter')).not.toBeInTheDocument()
    rerender(<MobileRecordButton {...BASE} state="recording" level={0.5} />)
    expect(screen.getByTestId('record-meter')).toBeInTheDocument()
  })

  it('maps level to the fill clip (0.5 → clip 50%)', () => {
    render(<MobileRecordButton {...BASE} state="recording" level={0.5} />)
    const fill = screen.getByTestId('record-meter').firstElementChild as HTMLElement
    expect(fill.style.getPropertyValue('--clip')).toBe('50%')
  })

  it('clamps an over-range level to a full meter (clip 0%)', () => {
    render(<MobileRecordButton {...BASE} state="recording" level={2} />)
    const fill = screen.getByTestId('record-meter').firstElementChild as HTMLElement
    expect(fill.style.getPropertyValue('--clip')).toBe('0%')
  })
})

describe('MobileRecordButton — sizes', () => {
  it('defaults to md and accepts sm', () => {
    const { rerender, container } = render(<MobileRecordButton {...BASE} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
    rerender(<MobileRecordButton {...BASE} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})
