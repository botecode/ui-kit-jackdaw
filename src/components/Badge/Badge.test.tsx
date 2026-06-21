// src/components/Badge/Badge.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Badge } from './Badge'

// ─── Rendering: defaults ──────────────────────────────────────────────────────

describe('Badge defaults', () => {
  it('renders a span element', () => {
    const { container } = render(<Badge count={3} />)
    expect(container.querySelector('span')).toBeInTheDocument()
  })

  it('data-variant="count" by default', () => {
    const { container } = render(<Badge count={3} />)
    expect(container.querySelector('span')!.getAttribute('data-variant')).toBe('count')
  })

  it('data-tone="default" by default', () => {
    const { container } = render(<Badge count={3} />)
    expect(container.querySelector('span')!.getAttribute('data-tone')).toBe('default')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<Badge count={3} />)
    expect(container.querySelector('span')!.getAttribute('data-size')).toBe('md')
  })
})

// ─── Count variant ────────────────────────────────────────────────────────────

describe('Badge count variant', () => {
  it('renders single-digit count', () => {
    const { container } = render(<Badge variant="count" count={5} />)
    expect(container.querySelector('span')!.textContent).toBe('5')
  })

  it('renders two-digit count', () => {
    const { container } = render(<Badge variant="count" count={42} />)
    expect(container.querySelector('span')!.textContent).toBe('42')
  })

  it('renders "99+" for count=100', () => {
    const { container } = render(<Badge variant="count" count={100} />)
    expect(container.querySelector('span')!.textContent).toBe('99+')
  })

  it('renders "99+" for count=999', () => {
    const { container } = render(<Badge variant="count" count={999} />)
    expect(container.querySelector('span')!.textContent).toBe('99+')
  })

  it('renders "99" for count=99', () => {
    const { container } = render(<Badge variant="count" count={99} />)
    expect(container.querySelector('span')!.textContent).toBe('99')
  })

  it('renders empty when count is undefined', () => {
    const { container } = render(<Badge variant="count" />)
    expect(container.querySelector('span')!.textContent).toBe('')
  })
})

// ─── Dot variant ──────────────────────────────────────────────────────────────

describe('Badge dot variant', () => {
  it('renders no text content', () => {
    const { container } = render(<Badge variant="dot" />)
    expect(container.querySelector('span')!.textContent).toBe('')
  })

  it('data-variant="dot"', () => {
    const { container } = render(<Badge variant="dot" />)
    expect(container.querySelector('span')!.getAttribute('data-variant')).toBe('dot')
  })

  it('aria-hidden when no aria-label', () => {
    const { container } = render(<Badge variant="dot" />)
    expect(container.querySelector('span')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('not aria-hidden when aria-label provided', () => {
    const { container } = render(<Badge variant="dot" aria-label="Recording active" />)
    expect(container.querySelector('span')!.getAttribute('aria-hidden')).toBeNull()
  })

  it('aria-label applied when provided', () => {
    const { container } = render(<Badge variant="dot" aria-label="Recording active" />)
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('Recording active')
  })
})

// ─── Label variant ────────────────────────────────────────────────────────────

describe('Badge label variant', () => {
  it('renders children text', () => {
    const { container } = render(<Badge variant="label">NEW</Badge>)
    expect(container.querySelector('span')!.textContent).toBe('NEW')
  })

  it('data-variant="label"', () => {
    const { container } = render(<Badge variant="label">NEW</Badge>)
    expect(container.querySelector('span')!.getAttribute('data-variant')).toBe('label')
  })
})

// ─── Tone prop ────────────────────────────────────────────────────────────────

describe('Badge tone', () => {
  const tones = ['default', 'accent', 'red', 'amber', 'green'] as const
  for (const tone of tones) {
    it(`data-tone="${tone}"`, () => {
      const { container } = render(<Badge count={1} tone={tone} />)
      expect(container.querySelector('span')!.getAttribute('data-tone')).toBe(tone)
    })
  }
})

// ─── Size prop ────────────────────────────────────────────────────────────────

describe('Badge size', () => {
  it('data-size="sm"', () => {
    const { container } = render(<Badge count={1} size="sm" />)
    expect(container.querySelector('span')!.getAttribute('data-size')).toBe('sm')
  })

  it('data-size="md"', () => {
    const { container } = render(<Badge count={1} size="md" />)
    expect(container.querySelector('span')!.getAttribute('data-size')).toBe('md')
  })
})
