// src/components/Progress/Progress.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Progress } from './Progress'

// ── Rendering ─────────────────────────────────────────────────────────────

describe('Progress — rendering', () => {
  it('renders a progressbar role element', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar')).toBeInTheDocument()
  })

  it('default variant is bar', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar').getAttribute('data-variant')).toBe('bar')
  })

  it('ring variant sets data-variant="ring" on the SVG', () => {
    const { getByRole } = render(<Progress variant="ring" />)
    expect(getByRole('progressbar').getAttribute('data-variant')).toBe('ring')
  })

  it('default size is md', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar').getAttribute('data-size')).toBe('md')
  })

  it('size="sm" sets data-size="sm"', () => {
    const { getByRole } = render(<Progress size="sm" />)
    expect(getByRole('progressbar').getAttribute('data-size')).toBe('sm')
  })

  it('renders label text when label prop is provided', () => {
    const { getByText } = render(<Progress label="Scanning…" />)
    expect(getByText('Scanning…')).toBeInTheDocument()
  })

  it('no label element when label is absent', () => {
    const { queryByText } = render(<Progress />)
    expect(queryByText('Scanning…')).not.toBeInTheDocument()
  })

  it('ring variant renders label text', () => {
    const { getByText } = render(<Progress variant="ring" label="Exporting…" />)
    expect(getByText('Exporting…')).toBeInTheDocument()
  })
})

// ── ARIA ──────────────────────────────────────────────────────────────────

describe('Progress — ARIA', () => {
  it('has aria-valuemin="0"', () => {
    const { getByRole } = render(<Progress value={0.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuemin')).toBe('0')
  })

  it('has aria-valuemax="100"', () => {
    const { getByRole } = render(<Progress value={0.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuemax')).toBe('100')
  })

  it('aria-valuenow=40 for value=0.4', () => {
    const { getByRole } = render(<Progress value={0.4} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40')
  })

  it('aria-valuenow rounds to nearest integer', () => {
    const { getByRole } = render(<Progress value={0.426} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('43')
  })

  it('aria-valuenow absent when indeterminate', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  })

  it('aria-label defaults to "Loading" when no label or aria-label', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
  })

  it('aria-label derived from label prop', () => {
    const { getByRole } = render(<Progress label="Exporting…" />)
    expect(getByRole('progressbar', { name: 'Exporting…' })).toBeInTheDocument()
  })

  it('aria-label set from aria-label prop', () => {
    const { getByRole } = render(<Progress aria-label="Rendering scene" />)
    expect(getByRole('progressbar', { name: 'Rendering scene' })).toBeInTheDocument()
  })

  it('label prop takes precedence over aria-label prop', () => {
    const { getByRole } = render(<Progress label="From label" aria-label="From aria-label" />)
    expect(getByRole('progressbar', { name: 'From label' })).toBeInTheDocument()
  })
})

// ── Data attributes ────────────────────────────────────────────────────────

describe('Progress — data-indeterminate', () => {
  it('sets data-indeterminate when value is omitted', () => {
    const { getByRole } = render(<Progress />)
    expect(getByRole('progressbar')).toHaveAttribute('data-indeterminate')
  })

  it('no data-indeterminate when value=0', () => {
    const { getByRole } = render(<Progress value={0} />)
    expect(getByRole('progressbar')).not.toHaveAttribute('data-indeterminate')
  })

  it('no data-indeterminate when value=0.5', () => {
    const { getByRole } = render(<Progress value={0.5} />)
    expect(getByRole('progressbar')).not.toHaveAttribute('data-indeterminate')
  })

  it('ring variant: data-indeterminate when value omitted', () => {
    const { getByRole } = render(<Progress variant="ring" />)
    expect(getByRole('progressbar')).toHaveAttribute('data-indeterminate')
  })

  it('ring variant: no data-indeterminate when value=0.5', () => {
    const { getByRole } = render(<Progress variant="ring" value={0.5} />)
    expect(getByRole('progressbar')).not.toHaveAttribute('data-indeterminate')
  })
})

// ── Value clamping ─────────────────────────────────────────────────────────

describe('Progress — value clamping', () => {
  it('clamps value below 0 → aria-valuenow=0', () => {
    const { getByRole } = render(<Progress value={-0.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
  })

  it('clamps value above 1 → aria-valuenow=100', () => {
    const { getByRole } = render(<Progress value={1.5} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
  })

  it('value=0 → aria-valuenow=0, no data-indeterminate', () => {
    const { getByRole } = render(<Progress value={0} />)
    const el = getByRole('progressbar')
    expect(el.getAttribute('aria-valuenow')).toBe('0')
    expect(el).not.toHaveAttribute('data-indeterminate')
  })

  it('value=1 → aria-valuenow=100', () => {
    const { getByRole } = render(<Progress value={1} />)
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
  })
})

// ── CSS custom property ────────────────────────────────────────────────────

describe('Progress — CSS custom property (bar)', () => {
  it('sets --_fill on the bar element when determinate', () => {
    const { getByRole } = render(<Progress value={0.42} />)
    const bar = getByRole('progressbar') as HTMLElement
    expect(bar.style.getPropertyValue('--_fill')).toBe('0.42')
  })

  it('no inline style when indeterminate', () => {
    const { getByRole } = render(<Progress />)
    const bar = getByRole('progressbar') as HTMLElement
    expect(bar.style.getPropertyValue('--_fill')).toBe('')
  })

  it('--_fill=0 for value=0', () => {
    const { getByRole } = render(<Progress value={0} />)
    const bar = getByRole('progressbar') as HTMLElement
    expect(bar.style.getPropertyValue('--_fill')).toBe('0')
  })

  it('--_fill=1 for value=1', () => {
    const { getByRole } = render(<Progress value={1} />)
    const bar = getByRole('progressbar') as HTMLElement
    expect(bar.style.getPropertyValue('--_fill')).toBe('1')
  })
})

// ── Ring ───────────────────────────────────────────────────────────────────

describe('Progress ring variant', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Progress variant="ring" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('ring SVG is 40×40 for md', () => {
    const { container } = render(<Progress variant="ring" size="md" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('40')
    expect(svg.getAttribute('height')).toBe('40')
  })

  it('ring SVG is 24×24 for sm', () => {
    const { container } = render(<Progress variant="ring" size="sm" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('24')
  })

  it('ring contains two circles (track + fill)', () => {
    const { container } = render(<Progress variant="ring" value={0.5} />)
    expect(container.querySelectorAll('circle')).toHaveLength(2)
  })

  it('fill circle has stroke-dasharray when determinate', () => {
    const { container } = render(<Progress variant="ring" value={0.5} />)
    const circles = container.querySelectorAll('circle')
    const fill = circles[circles.length - 1]
    expect(fill.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('fill circle stroke-dasharray has two space-separated values when indeterminate', () => {
    const { container } = render(<Progress variant="ring" />)
    const circles = container.querySelectorAll('circle')
    const fill = circles[circles.length - 1]
    const da = fill.getAttribute('stroke-dasharray') ?? ''
    expect(da.trim().split(' ').length).toBe(2)
  })

  it('fill circle stroke-dashoffset=0 when indeterminate', () => {
    const { container } = render(<Progress variant="ring" />)
    const circles = container.querySelectorAll('circle')
    const fill = circles[circles.length - 1]
    expect(Number(fill.getAttribute('stroke-dashoffset'))).toBe(0)
  })

  it('fill circle stroke-dashoffset equals circumference at value=0', () => {
    const { container } = render(<Progress variant="ring" size="md" value={0} />)
    const circles = container.querySelectorAll('circle')
    const fill = circles[circles.length - 1]
    const c = 2 * Math.PI * 16
    expect(Number(fill.getAttribute('stroke-dashoffset'))).toBeCloseTo(c, 1)
  })

  it('fill circle stroke-dashoffset=0 at value=1', () => {
    const { container } = render(<Progress variant="ring" size="md" value={1} />)
    const circles = container.querySelectorAll('circle')
    const fill = circles[circles.length - 1]
    expect(Number(fill.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 1)
  })
})
