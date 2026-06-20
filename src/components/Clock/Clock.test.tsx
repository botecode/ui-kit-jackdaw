import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Clock } from './Clock'

const defaults = {
  seconds: 0,
  bpm: 120,
  numerator: 4,
  denominator: 4,
  state: 'stopped' as const,
}

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Clock rendering', () => {
  it('renders a button', () => {
    const { getByRole } = render(<Clock {...defaults} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('data-state reflects prop', () => {
    const { getByRole } = render(<Clock {...defaults} state="playing" />)
    expect(getByRole('button').getAttribute('data-state')).toBe('playing')
  })

  it('data-mode defaults to "bars"', () => {
    const { getByRole } = render(<Clock {...defaults} />)
    expect(getByRole('button').getAttribute('data-mode')).toBe('bars')
  })

  it('data-mode reflects mode prop', () => {
    const { getByRole } = render(<Clock {...defaults} mode="time" />)
    expect(getByRole('button').getAttribute('data-mode')).toBe('time')
  })

  it('data-size defaults to "md"', () => {
    const { getByRole } = render(<Clock {...defaults} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size reflects size prop', () => {
    const { getByRole } = render(<Clock {...defaults} size="sm" />)
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })
})

// ─── State label text ────────────────────────────────────────────────────────

describe('Clock state label', () => {
  it('shows [Stopped] when stopped', () => {
    const { getByText } = render(<Clock {...defaults} state="stopped" />)
    expect(getByText('[Stopped]')).toBeInTheDocument()
  })

  it('shows Playing when playing', () => {
    const { getByText } = render(<Clock {...defaults} state="playing" />)
    expect(getByText('Playing')).toBeInTheDocument()
  })

  it('shows Recording when recording', () => {
    const { getByText } = render(<Clock {...defaults} state="recording" />)
    expect(getByText('Recording')).toBeInTheDocument()
  })
})

// ─── Mode tag ─────────────────────────────────────────────────────────────────

describe('Clock mode tag', () => {
  it('shows BARS in bars mode', () => {
    const { getByText } = render(<Clock {...defaults} mode="bars" />)
    expect(getByText('BARS')).toBeInTheDocument()
  })

  it('shows TIME in time mode', () => {
    const { getByText } = render(<Clock {...defaults} mode="time" />)
    expect(getByText('TIME')).toBeInTheDocument()
  })
})

// ─── bars.beats.ticks display ─────────────────────────────────────────────────

describe('Clock bars mode display', () => {
  it('shows 1.1.00 at position 0, 120 BPM, 4/4', () => {
    const { getByRole } = render(<Clock {...defaults} seconds={0} mode="bars" />)
    expect(getByRole('button').textContent).toContain('1.1.00')
  })

  it('shows correct bar at 4 beats (120 BPM, 4/4 → bar 2)', () => {
    // 4 beats at 120 BPM = 2 seconds
    const { getByRole } = render(<Clock {...defaults} seconds={2} mode="bars" />)
    expect(getByRole('button').textContent).toContain('2.1.00')
  })

  it('shows correct beat within bar', () => {
    // 1 beat at 120 BPM = 0.5 seconds → bar 1, beat 2
    const { getByRole } = render(<Clock {...defaults} seconds={0.5} mode="bars" />)
    expect(getByRole('button').textContent).toContain('1.2.00')
  })

  it('shows ticks for fractional beats', () => {
    // 120 BPM → 1 beat = 0.5s; 0.5s / 2 = 0.25 beat = 24 ticks (at 96 TPPB)
    const { getByRole } = render(<Clock {...defaults} seconds={0.125} mode="bars" />)
    // 0.125s at 120 BPM = 0.25 beats → bar 1, beat 1, tick 24
    expect(getByRole('button').textContent).toContain('1.1.24')
  })

  it('pads ticks to 2 digits', () => {
    // tick 5 → "05"
    // 120 BPM → 1 beat = 0.5s; fraction = 5/96 beats = 5/(96*2) s ≈ 0.02604s
    const { getByRole } = render(
      <Clock {...defaults} seconds={5 / (96 * 2)} mode="bars" />
    )
    expect(getByRole('button').textContent).toContain('1.1.05')
  })

  it('handles large values (bar 19, beat 3)', () => {
    // bar 19 = 18 complete bars = 72 beats at 4/4, beat 3 = 74 total beats
    // 74 beats at 120 BPM = 37 seconds
    const { getByRole } = render(<Clock {...defaults} seconds={37} mode="bars" />)
    expect(getByRole('button').textContent).toContain('19.3.00')
  })

  it('shows fallback when bpm is 0', () => {
    const { getByRole } = render(<Clock {...defaults} bpm={0} mode="bars" />)
    expect(getByRole('button').textContent).toContain('-.-.--')
  })
})

// ─── min:sec.ms display ───────────────────────────────────────────────────────

describe('Clock time mode display', () => {
  it('shows 0:00.000 at position 0', () => {
    const { getByRole } = render(<Clock {...defaults} seconds={0} mode="time" />)
    expect(getByRole('button').textContent).toContain('0:00.000')
  })

  it('shows 1:23.456 for 83.456 seconds', () => {
    const { getByRole } = render(<Clock {...defaults} seconds={83.456} mode="time" />)
    expect(getByRole('button').textContent).toContain('1:23.456')
  })

  it('pads seconds to 2 digits', () => {
    const { getByRole } = render(<Clock {...defaults} seconds={65} mode="time" />)
    expect(getByRole('button').textContent).toContain('1:05.000')
  })

  it('pads milliseconds to 3 digits', () => {
    const { getByRole } = render(<Clock {...defaults} seconds={0.05} mode="time" />)
    expect(getByRole('button').textContent).toContain('0:00.050')
  })

  it('handles large values correctly', () => {
    // 2h 3min 4.5sec = 7384.5 seconds
    const { getByRole } = render(<Clock {...defaults} seconds={7384.5} mode="time" />)
    expect(getByRole('button').textContent).toContain('123:04.500')
  })

  it('clamps negative seconds to 0', () => {
    const { getByRole } = render(<Clock {...defaults} seconds={-5} mode="time" />)
    expect(getByRole('button').textContent).toContain('0:00.000')
  })
})

// ─── Mode toggle interaction ──────────────────────────────────────────────────

describe('Clock mode toggle', () => {
  it('clicking calls onModeChange with "time" when in bars mode', () => {
    const onModeChange = vi.fn()
    const { getByRole } = render(
      <Clock {...defaults} mode="bars" onModeChange={onModeChange} />
    )
    fireEvent.click(getByRole('button'))
    expect(onModeChange).toHaveBeenCalledWith('time')
  })

  it('clicking calls onModeChange with "bars" when in time mode', () => {
    const onModeChange = vi.fn()
    const { getByRole } = render(
      <Clock {...defaults} mode="time" onModeChange={onModeChange} />
    )
    fireEvent.click(getByRole('button'))
    expect(onModeChange).toHaveBeenCalledWith('bars')
  })

  it('clicking without onModeChange does not throw', () => {
    const { getByRole } = render(<Clock {...defaults} mode="bars" />)
    expect(() => fireEvent.click(getByRole('button'))).not.toThrow()
  })
})

// ─── aria-label ───────────────────────────────────────────────────────────────

describe('Clock aria-label', () => {
  it('describes bars mode and switch affordance', () => {
    const { getByRole } = render(<Clock {...defaults} mode="bars" />)
    const label = getByRole('button').getAttribute('aria-label')
    expect(label).toContain('bars')
    expect(label).toContain('time')
  })

  it('describes time mode and switch affordance', () => {
    const { getByRole } = render(<Clock {...defaults} mode="time" />)
    const label = getByRole('button').getAttribute('aria-label')
    expect(label).toContain('time')
    expect(label).toContain('bars')
  })
})
