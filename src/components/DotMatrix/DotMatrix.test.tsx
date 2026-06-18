import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DotMatrix } from './DotMatrix'

const ZEROS = [[0, 0, 0], [0, 0, 0]]

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('DotMatrix rendering', () => {
  it('renders with role="img"', () => {
    const { getByRole } = render(<DotMatrix rows={2} cols={3} values={ZEROS} />)
    expect(getByRole('img')).toBeInTheDocument()
  })

  it('applies the aria-label', () => {
    const { getByRole } = render(
      <DotMatrix rows={2} cols={3} values={ZEROS} aria-label="Status grid" />,
    )
    expect(getByRole('img').getAttribute('aria-label')).toBe('Status grid')
  })

  it('default aria-label is "Dot matrix display"', () => {
    const { getByRole } = render(<DotMatrix rows={2} cols={3} values={ZEROS} />)
    expect(getByRole('img').getAttribute('aria-label')).toBe('Dot matrix display')
  })

  it('renders rows × cols dots', () => {
    const { getByRole } = render(<DotMatrix rows={2} cols={3} values={ZEROS} />)
    // Count direct children of the grid div (one level inside role=img)
    const grid = getByRole('img').firstElementChild!
    expect(grid.children).toHaveLength(6)
  })

  it('renders correctly for a larger grid', () => {
    const values = Array.from({ length: 4 }, () => Array(8).fill(0))
    const { getByRole } = render(<DotMatrix rows={4} cols={8} values={values} />)
    expect(getByRole('img').firstElementChild!.children).toHaveLength(32)
  })
})

// ─── Lit / off state ─────────────────────────────────────────────────────────

describe('DotMatrix lit state', () => {
  it('no data-lit on off cells', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={2} values={[[0, 0]]} />)
    const dots = Array.from(getByRole('img').firstElementChild!.children)
    dots.forEach(d => expect(d.hasAttribute('data-lit')).toBe(false))
  })

  it('data-lit on lit cells (number > 0)', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={2} values={[[1, 0.5]]} />)
    const dots = Array.from(getByRole('img').firstElementChild!.children)
    expect(dots[0].hasAttribute('data-lit')).toBe(true)
    expect(dots[1].hasAttribute('data-lit')).toBe(true)
  })

  it('data-lit on lit cells (object form)', () => {
    const { getByRole } = render(
      <DotMatrix rows={1} cols={1} values={[[{ v: 0.8, color: 'red' }]]} />,
    )
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.hasAttribute('data-lit')).toBe(true)
  })

  it('no data-lit when v=0 in object form', () => {
    const { getByRole } = render(
      <DotMatrix rows={1} cols={1} values={[[{ v: 0, color: 'green' }]]} />,
    )
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.hasAttribute('data-lit')).toBe(false)
  })

  it('missing cell defaults to off', () => {
    const { getByRole } = render(<DotMatrix rows={2} cols={2} values={[[1]]} />)
    const dots = Array.from(getByRole('img').firstElementChild!.children)
    expect(dots[0].hasAttribute('data-lit')).toBe(true)   // [0][0] = 1
    expect(dots[1].hasAttribute('data-lit')).toBe(false)  // [0][1] = missing → 0
    expect(dots[2].hasAttribute('data-lit')).toBe(false)  // [1][0] = missing → 0
    expect(dots[3].hasAttribute('data-lit')).toBe(false)  // [1][1] = missing → 0
  })
})

// ─── Glow ────────────────────────────────────────────────────────────────────

describe('DotMatrix glow', () => {
  it('data-glow on lit cells when glow=true (default)', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={1} values={[[1]]} />)
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.hasAttribute('data-glow')).toBe(true)
  })

  it('no data-glow when glow=false', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={1} values={[[1]]} glow={false} />)
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.hasAttribute('data-glow')).toBe(false)
  })

  it('no data-glow on off cells even when glow=true', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={1} values={[[0]]} />)
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.hasAttribute('data-glow')).toBe(false)
  })
})

// ─── Shape ───────────────────────────────────────────────────────────────────

describe('DotMatrix dotShape', () => {
  it('data-shape="round" by default', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={1} values={[[0]]} />)
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.getAttribute('data-shape')).toBe('round')
  })

  it('data-shape="square" when dotShape=square', () => {
    const { getByRole } = render(<DotMatrix rows={1} cols={1} values={[[0]]} dotShape="square" />)
    const dot = getByRole('img').firstElementChild!.children[0]
    expect(dot.getAttribute('data-shape')).toBe('square')
  })
})
