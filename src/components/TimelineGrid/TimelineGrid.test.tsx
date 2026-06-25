import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { divisionToPx, snapXToDivision } from './gridMath'
import { TimelineGrid } from './TimelineGrid'

// ─── divisionToPx — 4/4 time (denominator=4) ─────────────────────────────────

describe('divisionToPx — 4/4', () => {
  const px = (d: Parameters<typeof divisionToPx>[0]) => divisionToPx(d, 64, 4, 4)

  it('1/1  → bar width = numerator × pxPerBeat', () => expect(px('1/1')).toBe(256))
  it('1/2  → 2 beats',                            () => expect(px('1/2')).toBe(128))
  it('1/4  → 1 beat (= pxPerBeat)',               () => expect(px('1/4')).toBe(64))
  it('1/8  → half beat',                          () => expect(px('1/8')).toBe(32))
  it('1/16 → quarter beat',                       () => expect(px('1/16')).toBe(16))
  it('1/8T → (2/3) × eighth = pxPerBeat/3',      () => expect(px('1/8T')).toBeCloseTo(64 / 3))
  it('1/16T → (2/3) × sixteenth = pxPerBeat/6',  () => expect(px('1/16T')).toBeCloseTo(64 / 6))
})

// ─── divisionToPx — 6/8 time (denominator=8) ─────────────────────────────────

describe('divisionToPx — 6/8', () => {
  const px = (d: Parameters<typeof divisionToPx>[0]) => divisionToPx(d, 32, 6, 8)

  it('1/1  → bar width = 6 beats × 32px', () => expect(px('1/1')).toBe(192))
  it('1/4  → quarter note = 2 eighth-beats', () => expect(px('1/4')).toBe(64))
  it('1/8  → 1 beat = pxPerBeat',            () => expect(px('1/8')).toBe(32))
  it('1/16 → half beat',                     () => expect(px('1/16')).toBe(16))
  it('1/8T → (2/3) × eighth',               () => expect(px('1/8T')).toBeCloseTo(32 * 8 / 12))
})

// ─── divisionToPx — 3/4 time ─────────────────────────────────────────────────

describe('divisionToPx — 3/4', () => {
  it('1/1  → bar = 3 × pxPerBeat',  () => expect(divisionToPx('1/1',  48, 3, 4)).toBe(144))
  it('1/4  → 1 beat = pxPerBeat',   () => expect(divisionToPx('1/4',  48, 3, 4)).toBe(48))
  it('1/8  → half beat',            () => expect(divisionToPx('1/8',  48, 3, 4)).toBe(24))
})

// ─── divisionToPx — guard ────────────────────────────────────────────────────

describe('divisionToPx — guards', () => {
  it('pxPerBeat=0 returns 1 (no divide-by-zero / zero-width gradient)', () =>
    expect(divisionToPx('1/4', 0, 4, 4)).toBe(1))
})

// ─── snapXToDivision ─────────────────────────────────────────────────────────

describe('snapXToDivision', () => {
  it('exact boundary → unchanged',         () => expect(snapXToDivision(64, 32)).toBe(64))
  it('closer to lower boundary → snaps down', () => expect(snapXToDivision(70, 64)).toBe(64))
  it('closer to upper boundary → snaps up',   () => expect(snapXToDivision(100, 64)).toBe(128))
  it('equidistant → rounds up',            () => expect(snapXToDivision(32, 64)).toBe(64))
  it('0 → 0',                              () => expect(snapXToDivision(0, 32)).toBe(0))
  it('divisionPx=0 returns x unchanged',   () => expect(snapXToDivision(70, 0)).toBe(70))
})

// ─── TimelineGrid component ───────────────────────────────────────────────────

const BASE = { division: '1/4' as const, pxPerBeat: 64, bpm: 120, numerator: 4, denominator: 4 }

describe('TimelineGrid rendering', () => {
  it('renders without crash', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} />)
    expect(getByTestId('timeline-grid')).toBeInTheDocument()
  })

  it('aria-hidden="true"', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} />)
    expect(getByTestId('timeline-grid')).toHaveAttribute('aria-hidden', 'true')
  })

  it('data-division reflects the division prop', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} division="1/8" />)
    expect(getByTestId('timeline-grid')).toHaveAttribute('data-division', '1/8')
  })

  it('sets --beat-px CSS var from pxPerBeat', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} pxPerBeat={48} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--beat-px')).toBe('48px')
  })

  it('sets --bar-beats CSS var from numerator', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} numerator={3} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--bar-beats')).toBe('3')
  })

  it('sets --grid-div-px for 1/4 in 4/4 to pxPerBeat', () => {
    // 1/4 → denominator × pxPerBeat / 4 = 4 × 64 / 4 = 64
    const { getByTestId } = render(<TimelineGrid {...BASE} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('64px')
  })

  it('sets --grid-div-px for 1/8 to half pxPerBeat', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} division="1/8" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('32px')
  })

  it('sets --grid-div-px for 1/16 to quarter pxPerBeat', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} division="1/16" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('16px')
  })

  it('sets --grid-div-px for 1/1 to bar width', () => {
    // bar = numerator × pxPerBeat = 4 × 64 = 256
    const { getByTestId } = render(<TimelineGrid {...BASE} division="1/1" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('256px')
  })

  it('updates --grid-div-px when division changes', () => {
    const { getByTestId, rerender } = render(<TimelineGrid {...BASE} division="1/8" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('32px')
    rerender(<TimelineGrid {...BASE} division="1/16" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('16px')
  })

  it('updates --grid-div-px when pxPerBeat changes', () => {
    const { getByTestId, rerender } = render(<TimelineGrid {...BASE} pxPerBeat={64} division="1/4" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('64px')
    rerender(<TimelineGrid {...BASE} pxPerBeat={32} division="1/4" />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-div-px')).toBe('32px')
  })

  it('sets --grid-line-weight to "1" by default', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-line-weight')).toBe('1')
  })

  it('sets --grid-line-weight from lineWeight prop', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} lineWeight={2.5} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-line-weight')).toBe('2.5')
  })

  it('updates --grid-line-weight when lineWeight changes', () => {
    const { getByTestId, rerender } = render(<TimelineGrid {...BASE} lineWeight={1} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-line-weight')).toBe('1')
    rerender(<TimelineGrid {...BASE} lineWeight={3} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--grid-line-weight')).toBe('3')
  })
})

// ─── Lane rules (horizontal ledger rows) ──────────────────────────────────────

describe('TimelineGrid lane rules', () => {
  it('default: no data-lane-rules attribute', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} />)
    expect(getByTestId('timeline-grid')).not.toHaveAttribute('data-lane-rules')
  })

  it('default: does not set the --lane-px horizontal-rule var', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--lane-px')).toBe('')
  })

  it('showLaneRules sets the data-lane-rules attribute', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} showLaneRules />)
    expect(getByTestId('timeline-grid')).toHaveAttribute('data-lane-rules')
  })

  it('showLaneRules sets --lane-px to the default laneHeight (48px)', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} showLaneRules />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--lane-px')).toBe('48px')
  })

  it('showLaneRules sets --lane-px from the laneHeight prop', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} showLaneRules laneHeight={72} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--lane-px')).toBe('72px')
  })

  it('laneHeight is ignored when showLaneRules is off (no --lane-px)', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} laneHeight={72} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--lane-px')).toBe('')
    expect(getByTestId('timeline-grid')).not.toHaveAttribute('data-lane-rules')
  })

  it('updates --lane-px when laneHeight changes', () => {
    const { getByTestId, rerender } = render(<TimelineGrid {...BASE} showLaneRules laneHeight={48} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--lane-px')).toBe('48px')
    rerender(<TimelineGrid {...BASE} showLaneRules laneHeight={64} />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--lane-px')).toBe('64px')
  })

  it('--beat-px behavior is unchanged when lane rules are on', () => {
    const { getByTestId } = render(<TimelineGrid {...BASE} pxPerBeat={48} showLaneRules />)
    expect(getByTestId('timeline-grid').style.getPropertyValue('--beat-px')).toBe('48px')
  })
})
