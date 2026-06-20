import { describe, it, expect } from 'vitest'
import {
  beatsPerSecond,
  secondsToX,
  xToSeconds,
  snapXToGrid,
  formatBarsBeats,
  buildBarMarks,
} from './rulerMath'

// ─── beatsPerSecond ────────────────────────────────────────────────────────────

describe('beatsPerSecond', () => {
  it('120 BPM → 2 bps',  () => expect(beatsPerSecond(120)).toBe(2))
  it('60 BPM → 1 bps',   () => expect(beatsPerSecond(60)).toBe(1))
  it('90 BPM → 1.5 bps', () => expect(beatsPerSecond(90)).toBe(1.5))
})

// ─── secondsToX ───────────────────────────────────────────────────────────────

describe('secondsToX', () => {
  it('0s → 0px',                   () => expect(secondsToX(0, 64, 120)).toBe(0))
  it('1s at 120 BPM 64px → 128px', () => expect(secondsToX(1, 64, 120)).toBe(128))
  it('0.5s at 120 BPM 64px → 64px',() => expect(secondsToX(0.5, 64, 120)).toBe(64))
  it('1s at 60 BPM 64px → 64px',   () => expect(secondsToX(1, 64, 60)).toBe(64))
})

// ─── xToSeconds ───────────────────────────────────────────────────────────────

describe('xToSeconds', () => {
  it('0px → 0s',                   () => expect(xToSeconds(0, 64, 120)).toBe(0))
  it('128px at 120 BPM 64px → 1s', () => expect(xToSeconds(128, 64, 120)).toBeCloseTo(1))
  it('64px at 120 BPM 64px → 0.5s',() => expect(xToSeconds(64, 64, 120)).toBeCloseTo(0.5))
  it('round-trips with secondsToX', () => {
    const t = 2.317
    expect(xToSeconds(secondsToX(t, 48, 100), 48, 100)).toBeCloseTo(t, 10)
  })
  it('pxPerBeat=0 returns 0 (guard)',() => expect(xToSeconds(64, 0, 120)).toBe(0))
})

// ─── snapXToGrid ──────────────────────────────────────────────────────────────

describe('snapXToGrid', () => {
  it('exact beat → unchanged', () => expect(snapXToGrid(64, 64)).toBe(64))
  it('70px (closer to 64) → 64px', () => expect(snapXToGrid(70, 64)).toBe(64))
  it('100px (closer to 128) → 128px', () => expect(snapXToGrid(100, 64)).toBe(128))
  it('32px (equidistant, rounds up) → 64px', () => expect(snapXToGrid(32, 64)).toBe(64))
  it('0px → 0px', () => expect(snapXToGrid(0, 64)).toBe(0))
  it('pxPerBeat=0 returns x unchanged', () => expect(snapXToGrid(70, 0)).toBe(70))
})

// ─── formatBarsBeats ──────────────────────────────────────────────────────────

describe('formatBarsBeats', () => {
  it('0s, 4/4, 120 BPM → "bar 1, beat 1"', () =>
    expect(formatBarsBeats(0, 120, 4)).toBe('bar 1, beat 1'))

  it('0.5s, 120 BPM (1 beat elapsed), 4/4 → "bar 1, beat 2"', () =>
    expect(formatBarsBeats(0.5, 120, 4)).toBe('bar 1, beat 2'))

  it('2s, 120 BPM (4 beats elapsed), 4/4 → "bar 2, beat 1"', () =>
    expect(formatBarsBeats(2, 120, 4)).toBe('bar 2, beat 1'))

  it('1s, 120 BPM (2 beats), 3/4 → "bar 1, beat 3"', () =>
    expect(formatBarsBeats(1, 120, 3)).toBe('bar 1, beat 3'))

  it('1.5s, 120 BPM (3 beats), 3/4 → "bar 2, beat 1"', () =>
    expect(formatBarsBeats(1.5, 120, 3)).toBe('bar 2, beat 1'))
})

// ─── buildBarMarks ────────────────────────────────────────────────────────────

describe('buildBarMarks', () => {
  it('returns bar marks starting at x=0, bar=1', () => {
    const marks = buildBarMarks(4, 120, 4, 64)
    // durationSeconds=4, bps=2, totalBeats=8, bars=2+1 buffer = 3
    expect(marks[0]).toEqual({ x: 0, bar: 1 })
  })

  it('bar 2 at x = numerator × pxPerBeat', () => {
    const marks = buildBarMarks(4, 120, 4, 64)
    expect(marks[1]).toEqual({ x: 256, bar: 2 }) // 4 beats × 64px
  })

  it('returns at least 1 mark even for tiny durations', () => {
    const marks = buildBarMarks(0.1, 120, 4, 64)
    expect(marks.length).toBeGreaterThanOrEqual(1)
  })

  it('3/4 time: bar spacing = 3 × pxPerBeat', () => {
    const marks = buildBarMarks(4, 120, 3, 48)
    // 4s × 2bps = 8 beats, bars = ceil(8/3)+1 = 4
    expect(marks[1]).toEqual({ x: 144, bar: 2 }) // 3 × 48
  })

  it('6/8 time: bar spacing = 6 × pxPerBeat', () => {
    const marks = buildBarMarks(8, 90, 6, 32)
    // 8s × 1.5bps = 12 beats, bars = ceil(12/6)+1 = 3
    expect(marks[1]).toEqual({ x: 192, bar: 2 }) // 6 × 32
  })
})

// ─── Component tests ──────────────────────────────────────────────────────────

import { render, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { TimelineRuler } from './TimelineRuler'

const BASE = {
  bpm:             120,
  numerator:       4,
  denominator:     4,
  pxPerBeat:       64,
  durationSeconds: 8,
}

function mockRootRect(container: HTMLElement) {
  const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
  root.getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0, top: 0, right: 512, bottom: 48, width: 512, height: 48,
    toJSON: () => {},
  } as DOMRect)
  return root
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('TimelineRuler rendering', () => {
  it('renders without crash', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toBeInTheDocument()
  })

  it('role="slider" with aria-label="Timeline"', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider', { name: 'Timeline' })).toBeInTheDocument()
  })

  it('aria-valuemin=0', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuemin', '0')
  })

  it('aria-valuemax=durationSeconds', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} durationSeconds={10} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuemax', '10')
  })

  it('aria-valuenow starts at 0', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
  })

  it('aria-valuetext starts at "bar 1, beat 1"', () => {
    const { getByRole } = render(<TimelineRuler {...BASE} />)
    expect(getByRole('slider')).toHaveAttribute('aria-valuetext', 'bar 1, beat 1')
  })

  it('sets --beat-px CSS var on root', () => {
    const { container } = render(<TimelineRuler {...BASE} pxPerBeat={48} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
    expect(root.style.getPropertyValue('--beat-px')).toBe('48px')
  })

  it('sets --bar-beats CSS var on root', () => {
    const { container } = render(<TimelineRuler {...BASE} numerator={3} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
    expect(root.style.getPropertyValue('--bar-beats')).toBe('3')
  })

  it('sets width to totalWidth (secondsToX(duration, pxPerBeat, bpm))', () => {
    // bpm=120, pxPerBeat=64, duration=8s → 8 × 2bps × 64px = 1024px
    const { container } = render(<TimelineRuler {...BASE} durationSeconds={8} pxPerBeat={64} bpm={120} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]') as HTMLElement
    expect(root.style.width).toBe('1024px')
  })

  it('renders bar labels (bar 1, bar 2, …)', () => {
    const { getAllByText } = render(<TimelineRuler {...BASE} />)
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })

  it('data-size="md" by default', () => {
    const { container } = render(<TimelineRuler {...BASE} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root?.getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<TimelineRuler {...BASE} size="sm" />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root?.getAttribute('data-size')).toBe('sm')
  })

  it('no data-lane-rules by default', () => {
    const { container } = render(<TimelineRuler {...BASE} />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root).not.toHaveAttribute('data-lane-rules')
  })

  it('data-lane-rules when showLaneRules=true', () => {
    const { container } = render(<TimelineRuler {...BASE} showLaneRules />)
    const root = container.querySelector('[data-testid="timeline-ruler"]')
    expect(root).toHaveAttribute('data-lane-rules')
  })
})

// ─── Seek interaction ─────────────────────────────────────────────────────────

describe('TimelineRuler seek', () => {
  it('pointerDown on strip calls onSeek', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 64, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledTimes(1)
  })

  it('pointerDown at 128px → 1s (bpm=120, pxPerBeat=64)', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 128, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(1)
  })

  it('pointerMove while dragging calls onSeek with new position', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 0, pointerId: 1 })
    fireEvent.pointerMove(strip, { clientX: 192, pointerId: 1 })
    // 192px → 192/(2×64) = 1.5s
    expect(onSeek).toHaveBeenLastCalledWith(1.5)
  })

  it('seek is clamped to [0, durationSeconds]', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} durationSeconds={4} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    // 9999px is way past durationSeconds=4
    fireEvent.pointerDown(strip, { clientX: 9999, pointerId: 1 })
    const called = onSeek.mock.calls[0][0]
    expect(called).toBeLessThanOrEqual(4)
  })

  it('snap=true snaps pointer to nearest beat', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} snap onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    // 70px → nearest beat at 64px → 64/(2×64) = 0.5s
    fireEvent.pointerDown(strip, { clientX: 70, pointerId: 1 })
    expect(onSeek).toHaveBeenCalledWith(0.5)
  })

  it('snap=false does NOT snap (70px → ~0.546s, not exactly 0.5)', () => {
    const onSeek = vi.fn()
    const { container } = render(<TimelineRuler {...BASE} snap={false} onSeek={onSeek} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 70, pointerId: 1 })
    const called = onSeek.mock.calls[0][0]
    expect(called).not.toBe(0.5)
    expect(called).toBeCloseTo(70 / (2 * 64), 5)
  })

  it('updates aria-valuenow after seek', () => {
    const { container, getByRole } = render(<TimelineRuler {...BASE} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    fireEvent.pointerDown(strip, { clientX: 128, pointerId: 1 })
    expect(getByRole('slider')).toHaveAttribute('aria-valuenow', '1')
  })

  it('updates aria-valuetext to bars:beats after seek', () => {
    const { container, getByRole } = render(<TimelineRuler {...BASE} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    // 128px → 1s, 120 BPM → 2 beats elapsed → bar 1 beat 3
    fireEvent.pointerDown(strip, { clientX: 128, pointerId: 1 })
    expect(getByRole('slider')).toHaveAttribute('aria-valuetext', 'bar 1, beat 3')
  })

  it('no onSeek prop → no crash on pointer down', () => {
    const { container } = render(<TimelineRuler {...BASE} />)
    mockRootRect(container)
    const strip = container.querySelector('[data-testid="ruler-strip"]')!
    expect(() => fireEvent.pointerDown(strip, { clientX: 64, pointerId: 1 })).not.toThrow()
  })
})

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('TimelineRuler keyboard', () => {
  it('ArrowRight seeks forward by one beat', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    // beatSeconds = 60/120 = 0.5s
    expect(onSeek).toHaveBeenCalledWith(0.5)
  })

  it('ArrowLeft at start stays at 0', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('ArrowRight twice → 1s (0.5s + 0.5s)', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenLastCalledWith(1)
  })

  it('ArrowRight past durationSeconds is clamped', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} durationSeconds={0.3} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' })
    expect(onSeek.mock.calls[0][0]).toBeLessThanOrEqual(0.3)
  })

  it('non-arrow key does not call onSeek', () => {
    const onSeek = vi.fn()
    const { getByRole } = render(<TimelineRuler {...BASE} onSeek={onSeek} />)
    fireEvent.keyDown(getByRole('slider'), { key: 'Space' })
    expect(onSeek).not.toHaveBeenCalled()
  })
})
