// src/components/Tuner/Tuner.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tuner } from './Tuner'

const BASE = {
  mute: false,
  onMuteChange: () => {},
  referenceHz: 440,
  onReferenceChange: () => {},
}

describe('Tuner', () => {
  // ── Note display ──────────────────────────────────────────────────────────
  it('renders the note letter and octave', () => {
    render(<Tuner {...BASE} note="E" octave={2} cents={-4} />)
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows an em-dash note and data-idle when there is no pitch', () => {
    const { container } = render(<Tuner {...BASE} note={null} />)
    expect(container.querySelector('[data-idle]')).toBeInTheDocument()
    const noteEl = container.querySelector('[class*="note"]')
    expect(noteEl).toHaveTextContent('—')
  })

  it('goes idle when confidence is below the floor even with a note', () => {
    const { container } = render(
      <Tuner {...BASE} note="A" octave={4} cents={0} confidence={0.1} />,
    )
    expect(container.querySelector('[data-idle]')).toBeInTheDocument()
  })

  // ── Tuning states ─────────────────────────────────────────────────────────
  it('sets data-in-tune when inTune', () => {
    const { container } = render(
      <Tuner {...BASE} note="E" octave={2} cents={0} inTune />,
    )
    expect(container.querySelector('[data-in-tune]')).toBeInTheDocument()
    expect(container.querySelector('[data-flat]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-sharp]')).not.toBeInTheDocument()
  })

  it('sets data-flat when off-tune below pitch', () => {
    const { container } = render(
      <Tuner {...BASE} note="E" octave={2} cents={-18} />,
    )
    expect(container.querySelector('[data-flat]')).toBeInTheDocument()
    expect(container.querySelector('[data-sharp]')).not.toBeInTheDocument()
  })

  it('sets data-sharp when off-tune above pitch', () => {
    const { container } = render(
      <Tuner {...BASE} note="E" octave={2} cents={30} />,
    )
    expect(container.querySelector('[data-sharp]')).toBeInTheDocument()
    expect(container.querySelector('[data-flat]')).not.toBeInTheDocument()
  })

  it('sets data-muted when muted', () => {
    const { container } = render(<Tuner {...BASE} mute note="E" octave={2} />)
    expect(container.querySelector('[data-muted]')).toBeInTheDocument()
  })

  // ── Needle ────────────────────────────────────────────────────────────────
  it('centers the needle at 0 cents', () => {
    const { container } = render(
      <Tuner {...BASE} note="E" octave={2} cents={0} inTune />,
    )
    const needle = container.querySelector('[class*="needle"]') as HTMLElement
    expect(needle.style.left).toBe('50%')
  })

  it('maps cents to needle position (−25 → 25%)', () => {
    const { container } = render(
      <Tuner {...BASE} note="E" octave={2} cents={-25} />,
    )
    const needle = container.querySelector('[class*="needle"]') as HTMLElement
    expect(needle.style.left).toBe('25%')
  })

  it('clamps cents beyond ±50', () => {
    const { container } = render(
      <Tuner {...BASE} note="E" octave={2} cents={80} />,
    )
    const needle = container.querySelector('[class*="needle"]') as HTMLElement
    expect(needle.style.left).toBe('100%')
  })

  it('rests the needle at center when idle', () => {
    const { container } = render(<Tuner {...BASE} note={null} />)
    const needle = container.querySelector('[class*="needle"]') as HTMLElement
    expect(needle.style.left).toBe('50%')
  })

  // ── Readout ───────────────────────────────────────────────────────────────
  it('shows a signed cents readout (flat)', () => {
    render(<Tuner {...BASE} note="E" octave={2} cents={-4} />)
    expect(screen.getByText('−4')).toBeInTheDocument()
  })

  it('shows a signed cents readout (sharp)', () => {
    render(<Tuner {...BASE} note="E" octave={2} cents={12} />)
    expect(screen.getByText('+12')).toBeInTheDocument()
  })

  it('shows 0 unsigned when centered', () => {
    const { container } = render(<Tuner {...BASE} note="E" octave={2} cents={0} inTune />)
    const readout = container.querySelector('[class*="readoutValue"]')
    expect(readout).toHaveTextContent(/^0$/)
  })

  it('shows the frequency in hz mode', () => {
    render(
      <Tuner {...BASE} note="E" octave={2} cents={-4} frequency={82.2} mode="hz" />,
    )
    expect(screen.getByText(/82\.2/)).toBeInTheDocument()
  })

  it('renders the reference caption from referenceHz', () => {
    render(<Tuner {...BASE} referenceHz={432} note="A" octave={4} />)
    expect(screen.getByText(/A = 432\.0 Hz/)).toBeInTheDocument()
  })

  // ── Gauge ARIA ────────────────────────────────────────────────────────────
  it('labels the gauge with note and direction', () => {
    render(<Tuner {...BASE} note="E" octave={2} cents={-4} />)
    expect(screen.getByRole('img', { name: 'Tuner: E2, 4 cents flat' })).toBeInTheDocument()
  })

  it('labels the gauge in tune', () => {
    render(<Tuner {...BASE} note="E" octave={2} cents={0} inTune />)
    expect(screen.getByRole('img', { name: 'Tuner: E2, in tune' })).toBeInTheDocument()
  })

  it('labels the gauge with no signal when idle', () => {
    render(<Tuner {...BASE} note={null} />)
    expect(screen.getByRole('img', { name: 'Tuner: no signal' })).toBeInTheDocument()
  })

  // ── Controls ──────────────────────────────────────────────────────────────
  it('fires onMuteChange from the mute toggle', () => {
    const onMuteChange = vi.fn()
    render(<Tuner {...BASE} onMuteChange={onMuteChange} note="E" octave={2} />)
    fireEvent.click(screen.getByRole('switch', { name: /mute/i }))
    expect(onMuteChange).toHaveBeenCalledWith(true, expect.anything())
  })

  it('fires onReferenceChange from the reference steppers', () => {
    const onReferenceChange = vi.fn()
    render(<Tuner {...BASE} onReferenceChange={onReferenceChange} note="E" octave={2} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: /increase reference pitch/i }))
    expect(onReferenceChange).toHaveBeenCalledWith(440.5)
  })

  it('renders the mode toggle only when onModeChange is provided', () => {
    const { rerender } = render(<Tuner {...BASE} note="E" octave={2} />)
    expect(screen.queryByRole('radiogroup', { name: /readout mode/i })).not.toBeInTheDocument()
    rerender(<Tuner {...BASE} note="E" octave={2} onModeChange={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: /readout mode/i })).toBeInTheDocument()
  })

  it('fires onModeChange when switching to Hz', () => {
    const onModeChange = vi.fn()
    render(<Tuner {...BASE} note="E" octave={2} mode="cents" onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: /hz/i }))
    expect(onModeChange).toHaveBeenCalledWith('hz')
  })

  // ── Size ──────────────────────────────────────────────────────────────────
  it('exposes data-size', () => {
    const { container } = render(<Tuner {...BASE} size="sm" note="E" octave={2} />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})
