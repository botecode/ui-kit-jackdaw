// src/components/Clip/Clip.test.tsx
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Clip } from './Clip'

// ─── Environment stubs ────────────────────────────────────────────────────────

beforeAll(() => {
  // ResizeObserver is not available in jsdom
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class ResizeObserver {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  }
})

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

const PEAKS = [0.2, 0.8, 0.5, 0.9, 0.3, 0.6, 0.4, 0.7]

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Clip rendering', () => {
  beforeEach(() => mockMatchMedia(false))

  it('renders a root element', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-testid="clip-root"]')).not.toBeNull()
  })

  it('renders a waveform SVG', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-testid="clip-waveform"]')).not.toBeNull()
  })

  it('renders with an empty peaks array without crashing', () => {
    const { container } = render(<Clip peaks={[]} />)
    expect(container.querySelector('[data-testid="clip-root"]')).not.toBeNull()
  })

  it('renders with a large peaks array without crashing', () => {
    const largePeaks = Array.from({ length: 500 }, (_, i) => Math.sin(i / 10) * 0.5 + 0.5)
    const { container } = render(<Clip peaks={largePeaks} />)
    expect(container.querySelector('[data-testid="clip-waveform"]')).not.toBeNull()
  })
})

// ─── State ────────────────────────────────────────────────────────────────────

describe('Clip state', () => {
  beforeEach(() => mockMatchMedia(false))

  it('data-state="recorded" by default', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-testid="clip-root"]'))
      .toHaveAttribute('data-state', 'recorded')
  })

  it('data-state="recording" when state prop set', () => {
    const { container } = render(<Clip peaks={PEAKS} state="recording" />)
    expect(container.querySelector('[data-testid="clip-root"]'))
      .toHaveAttribute('data-state', 'recording')
  })

  it('recording state renders a clipPath defs block in the SVG', () => {
    const { container } = render(<Clip peaks={PEAKS} state="recording" />)
    expect(container.querySelector('clipPath')).not.toBeNull()
  })

  it('recorded state has no clipPath defs', () => {
    const { container } = render(<Clip peaks={PEAKS} state="recorded" />)
    expect(container.querySelector('clipPath')).toBeNull()
  })
})

// ─── Time-stretch (rate) ──────────────────────────────────────────────────────

describe('Clip time-stretch indicator', () => {
  beforeEach(() => mockMatchMedia(false))

  it('rate=1 (default) → no data-stretched, no rate chip', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).not.toHaveAttribute('data-stretched')
    expect(container.querySelector('[data-testid="clip-rate"]')).toBeNull()
  })

  it('rate ≈ 1 (within epsilon) → treated as un-stretched', () => {
    const { container } = render(<Clip peaks={PEAKS} rate={1.004} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).not.toHaveAttribute('data-stretched')
  })

  it('rate=2 → data-stretched present', () => {
    const { container } = render(<Clip peaks={PEAKS} rate={2} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).toHaveAttribute('data-stretched')
  })

  it('rate ≠ 1 → renders a rate chip with the formatted multiplier', () => {
    const { container } = render(<Clip peaks={PEAKS} rate={2} />)
    const chip = container.querySelector('[data-testid="clip-rate"]') as HTMLElement
    expect(chip).not.toBeNull()
    expect(chip.textContent).toContain('2.00')
    expect(chip.textContent).toContain('×')
  })

  it('rate < 1 (slower / expanded) still shows the indicator', () => {
    const { container } = render(<Clip peaks={PEAKS} rate={0.5} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).toHaveAttribute('data-stretched')
    expect((container.querySelector('[data-testid="clip-rate"]') as HTMLElement).textContent)
      .toContain('0.50')
  })
})

// ─── Fades (in / out) ─────────────────────────────────────────────────────────

describe('Clip fades', () => {
  beforeEach(() => mockMatchMedia(false))

  it('no fade props → no fade overlay, no data-fade-* attrs', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).not.toHaveAttribute('data-fade-in')
    expect(root).not.toHaveAttribute('data-fade-out')
    expect(container.querySelector('[data-testid="clip-fade"]')).toBeNull()
  })

  it('fadeIn > 0 (with lengthSec) → data-fade-in + fade overlay', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeIn={1} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).toHaveAttribute('data-fade-in')
    expect(root).not.toHaveAttribute('data-fade-out')
    expect(container.querySelector('[data-testid="clip-fade"]')).not.toBeNull()
  })

  it('fadeOut > 0 (with lengthSec) → data-fade-out', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeOut={1} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).toHaveAttribute('data-fade-out')
    expect(root).not.toHaveAttribute('data-fade-in')
  })

  it('both fades → both attrs and two scrim polygons', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeIn={1} fadeOut={1} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).toHaveAttribute('data-fade-in')
    expect(root).toHaveAttribute('data-fade-out')
    expect(container.querySelectorAll('[data-testid="clip-fade"] polygon')).toHaveLength(2)
  })

  it('fadeIn without lengthSec → cannot place a fraction, renders nothing', () => {
    const { container } = render(<Clip peaks={PEAKS} fadeIn={1} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).not.toHaveAttribute('data-fade-in')
    expect(container.querySelector('[data-testid="clip-fade"]')).toBeNull()
  })

  it('lengthSec = 0 → no fade (degenerate length)', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={0} fadeIn={1} />)
    expect(container.querySelector('[data-testid="clip-fade"]')).toBeNull()
  })

  it('overlapping fades (fadeIn + fadeOut > length) still render both, scaled to meet', () => {
    // 3 + 3 = 6 > length 4 → both scale to fractions summing to 1 (they just meet).
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeIn={3} fadeOut={3} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root).toHaveAttribute('data-fade-in')
    expect(root).toHaveAttribute('data-fade-out')
    expect(container.querySelectorAll('[data-testid="clip-fade"] polygon')).toHaveLength(2)
  })

  it('fadeHandles=false (default) → no knobs', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeIn={1} />)
    expect(container.querySelector('[data-fade-knob]')).toBeNull()
  })

  it('fadeHandles=true → renders an in and an out knob', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeHandles />)
    expect(container.querySelector('[data-fade-knob="in"]')).not.toBeNull()
    expect(container.querySelector('[data-fade-knob="out"]')).not.toBeNull()
  })

  it('fade overlay svg is aria-hidden', () => {
    const { container } = render(<Clip peaks={PEAKS} lengthSec={4} fadeIn={1} />)
    expect(container.querySelector('[data-testid="clip-fade"]')?.getAttribute('aria-hidden')).toBe('true')
  })
})

// ─── Props → attributes ───────────────────────────────────────────────────────

describe('Clip props', () => {
  beforeEach(() => mockMatchMedia(false))

  it('sets --clip-color CSS variable from color prop', () => {
    const { container } = render(<Clip peaks={PEAKS} color="#ff0000" />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.style.getPropertyValue('--clip-color')).toBe('#ff0000')
  })

  it('splitLeft sets data-split-left attribute', () => {
    const { container } = render(<Clip peaks={PEAKS} splitLeft />)
    expect(container.querySelector('[data-split-left]')).not.toBeNull()
  })

  it('splitRight sets data-split-right attribute', () => {
    const { container } = render(<Clip peaks={PEAKS} splitRight />)
    expect(container.querySelector('[data-split-right]')).not.toBeNull()
  })

  it('no data-split-left without the prop', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-split-left]')).toBeNull()
  })

  it('splitLeft and splitRight can be combined', () => {
    const { container } = render(<Clip peaks={PEAKS} splitLeft splitRight />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.dataset.splitLeft).toBeDefined()
    expect(root.dataset.splitRight).toBeDefined()
  })

  it('aria-label defaults to "Clip"', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-testid="clip-root"]'))
      .toHaveAttribute('aria-label', 'Clip')
  })

  it('custom aria-label', () => {
    const { container } = render(<Clip peaks={PEAKS} aria-label="Guitar take 1" />)
    expect(container.querySelector('[data-testid="clip-root"]'))
      .toHaveAttribute('aria-label', 'Guitar take 1')
  })
})

// ─── Label ────────────────────────────────────────────────────────────────────

describe('Clip label', () => {
  beforeEach(() => mockMatchMedia(false))

  it('does not render label element when showLabel is false (default)', () => {
    const { container } = render(<Clip peaks={PEAKS} label="Guitar" />)
    expect(container.querySelector('[data-testid="clip-label"]')).toBeNull()
  })

  it('does not render label when showLabel=true but no label text', () => {
    const { container } = render(<Clip peaks={PEAKS} showLabel />)
    expect(container.querySelector('[data-testid="clip-label"]')).toBeNull()
  })

  // Note: the label is only visible at data-zoom="wide" (width >= 200 px).
  // In jsdom, ResizeObserver is a no-op so width stays at the useState default (200 px),
  // which maps to zoom="wide" — so showLabel + label does render in tests.
  it('renders label element when showLabel=true and label provided', () => {
    const { container } = render(<Clip peaks={PEAKS} label="Guitar" showLabel />)
    const labelEl = container.querySelector('[data-testid="clip-label"]')
    expect(labelEl).not.toBeNull()
    expect(labelEl?.textContent).toBe('Guitar')
  })
})

// ─── Visual state classes ─────────────────────────────────────────────────────
// CSS class presence confirms state is communicated to the stylesheet.

describe('Clip visual states', () => {
  beforeEach(() => mockMatchMedia(false))

  it('selected prop adds selected class', () => {
    const { container } = render(<Clip peaks={PEAKS} selected />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.className).toContain('selected')
  })

  it('no selected class without the prop', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.className).not.toContain('selected')
  })

  it('muted prop adds muted class', () => {
    const { container } = render(<Clip peaks={PEAKS} muted />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.className).toContain('muted')
  })

  it('recording state adds recording class', () => {
    const { container } = render(<Clip peaks={PEAKS} state="recording" />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.className).toContain('recording')
  })

  it('selected and muted can be combined', () => {
    const { container } = render(<Clip peaks={PEAKS} selected muted />)
    const root = container.querySelector('[data-testid="clip-root"]') as HTMLElement
    expect(root.className).toContain('selected')
    expect(root.className).toContain('muted')
  })
})

// ─── waveformColor prop ───────────────────────────────────────────────────────

describe('Clip waveformColor', () => {
  beforeEach(() => mockMatchMedia(false))

  it('data-waveform-color="ink" by default', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-testid="clip-root"]'))
      .toHaveAttribute('data-waveform-color', 'ink')
  })

  it('data-waveform-color="track" when prop set', () => {
    const { container } = render(<Clip peaks={PEAKS} waveformColor="track" />)
    expect(container.querySelector('[data-testid="clip-root"]'))
      .toHaveAttribute('data-waveform-color', 'track')
  })
})

// ─── LOD draw mode ────────────────────────────────────────────────────────────
// ResizeObserver is a no-op in jsdom so width stays at the useState default (200).
// 200 px < ULTRAWIDE (400), so draw mode is always 'fill' in tests.

describe('Clip draw mode', () => {
  beforeEach(() => mockMatchMedia(false))

  it('SVG data-draw-mode="fill" at default width (200 px)', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    expect(container.querySelector('[data-testid="clip-waveform"]'))
      .toHaveAttribute('data-draw-mode', 'fill')
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Clip accessibility', () => {
  beforeEach(() => mockMatchMedia(false))

  it('has role="region"', () => {
    const { getByRole } = render(<Clip peaks={PEAKS} />)
    expect(getByRole('region')).toBeDefined()
  })

  it('waveform SVG is aria-hidden', () => {
    const { container } = render(<Clip peaks={PEAKS} />)
    const svg = container.querySelector('[data-testid="clip-waveform"]')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
