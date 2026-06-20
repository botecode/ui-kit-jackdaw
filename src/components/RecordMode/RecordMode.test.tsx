import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordMode } from './RecordMode'

const noop = vi.fn()
beforeEach(() => vi.clearAllMocks())

const BASE = {
  state:          'idle'   as const,
  mode:           'normal' as const,
  onToggleRecord: noop,
  onSelectMode:   noop,
}

describe('RecordMode — record button', () => {
  it('renders without crash', () => {
    render(<RecordMode {...BASE} />)
    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument()
  })

  it('idle + normal: aria-pressed=false, no badge, label="Record"', () => {
    render(<RecordMode {...BASE} state="idle" mode="normal" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('[data-testid="record-loop-badge"]')).not.toBeInTheDocument()
  })

  it('armed: aria-pressed=true, label="Record"', () => {
    render(<RecordMode {...BASE} state="armed" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('recording: aria-pressed=true, label="Recording"', () => {
    render(<RecordMode {...BASE} state="recording" />)
    const btn = screen.getByRole('button', { name: 'Recording' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('loop-punch mode: badge rendered, label includes "(loop-punch)"', () => {
    render(<RecordMode {...BASE} mode="loop-punch" />)
    expect(screen.getByRole('button', { name: 'Record (loop-punch)' })).toBeInTheDocument()
    expect(document.querySelector('[data-testid="record-loop-badge"]')).toBeInTheDocument()
  })

  it('normal mode: no badge rendered', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    expect(document.querySelector('[data-testid="record-loop-badge"]')).not.toBeInTheDocument()
  })

  it('recording + loop-punch: label="Recording (loop-punch)"', () => {
    render(<RecordMode {...BASE} state="recording" mode="loop-punch" />)
    expect(screen.getByRole('button', { name: 'Recording (loop-punch)' })).toBeInTheDocument()
  })

  it('record button click fires onToggleRecord', () => {
    const onToggleRecord = vi.fn()
    render(<RecordMode {...BASE} onToggleRecord={onToggleRecord} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    expect(onToggleRecord).toHaveBeenCalledTimes(1)
  })
})
