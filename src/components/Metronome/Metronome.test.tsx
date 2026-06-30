// src/components/Metronome/Metronome.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Metronome } from './Metronome'

describe('Metronome', () => {
  it('renders the tempo readout', () => {
    render(<Metronome enabled={false} onToggle={() => {}} bpm={120} />)
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('BPM')).toBeInTheDocument()
  })

  it('reflects the off state (not pressed)', () => {
    render(<Metronome enabled={false} onToggle={() => {}} bpm={120} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('reflects the on state (pressed)', () => {
    const { container } = render(<Metronome enabled onToggle={() => {}} bpm={120} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-on]')).toBeInTheDocument()
  })

  it('toggles on click, passing the next value', () => {
    const onToggle = vi.fn()
    render(<Metronome enabled={false} onToggle={onToggle} bpm={120} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('toggles off when already on', () => {
    const onToggle = vi.fn()
    render(<Metronome enabled onToggle={onToggle} bpm={120} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(false)
  })

  it('renders one pip per beat (numerator)', () => {
    const { container } = render(
      <Metronome enabled onToggle={() => {}} bpm={120} numerator={3} />,
    )
    // pips live in the aria-hidden row; count the pip spans
    const pips = container.querySelectorAll('[data-downbeat], [class*="pip"]')
    // 3 beats → 3 pips (downbeat is one of them)
    const allPips = Array.from(container.querySelectorAll('span')).filter(s =>
      s.className.includes('pip'),
    )
    expect(allPips).toHaveLength(3)
    expect(pips.length).toBeGreaterThan(0)
  })

  it('lights only the current beat pip while enabled', () => {
    const { container } = render(
      <Metronome enabled onToggle={() => {}} bpm={120} numerator={4} beat={2} />,
    )
    const lit = container.querySelectorAll('[data-lit]')
    expect(lit).toHaveLength(1)
  })

  it('lights no pip when disabled even if a beat is passed', () => {
    const { container } = render(
      <Metronome enabled={false} onToggle={() => {}} bpm={120} numerator={4} beat={2} />,
    )
    expect(container.querySelectorAll('[data-lit]')).toHaveLength(0)
  })

  it('does not fire onToggle when disabled', () => {
    const onToggle = vi.fn()
    render(<Metronome enabled={false} onToggle={onToggle} bpm={120} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('exposes data-size', () => {
    const { container } = render(
      <Metronome enabled={false} onToggle={() => {}} bpm={120} size="sm" />,
    )
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})
