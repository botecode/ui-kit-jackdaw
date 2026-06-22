import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Marquee } from './Marquee'

// ─── Environment stubs ────────────────────────────────────────────────────────

beforeAll(() => {
  // jsdom does not implement ResizeObserver — the marquee observes its track.
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

const ITEMS = ['Multitrack', 'Lossless', 'Transparent', 'Bespoke']

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Marquee rendering', () => {
  beforeEach(() => mockMatchMedia(false))
  afterEach(() => vi.restoreAllMocks())

  it('renders a root element', () => {
    const { container } = render(<Marquee items={ITEMS} />)
    expect(container.querySelector('[data-testid="marquee-root"]')).not.toBeNull()
  })

  it('renders every item', () => {
    const { getAllByText } = render(<Marquee items={ITEMS} />)
    // each item appears twice (duplicated track for the seamless loop)
    expect(getAllByText('Multitrack')).toHaveLength(2)
    expect(getAllByText('Bespoke')).toHaveLength(2)
  })

  it('duplicates the content track for a seamless loop', () => {
    const { container } = render(<Marquee items={ITEMS} />)
    expect(container.querySelectorAll('[data-marquee-track]')).toHaveLength(2)
  })

  it('marks the cloned track aria-hidden so SR reads items once', () => {
    const { container } = render(<Marquee items={ITEMS} />)
    const tracks = container.querySelectorAll('[data-marquee-track]')
    expect(tracks[1].getAttribute('aria-hidden')).toBe('true')
  })

  it('default direction is left', () => {
    const { container } = render(<Marquee items={ITEMS} />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!.getAttribute('data-direction'),
    ).toBe('left')
  })

  it('honours direction="right"', () => {
    const { container } = render(<Marquee items={ITEMS} direction="right" />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!.getAttribute('data-direction'),
    ).toBe('right')
  })

  it('default size is md', () => {
    const { container } = render(<Marquee items={ITEMS} />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!.getAttribute('data-size'),
    ).toBe('md')
  })

  it('honours size="sm"', () => {
    const { container } = render(<Marquee items={ITEMS} size="sm" />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!.getAttribute('data-size'),
    ).toBe('sm')
  })

  it('default pause-on-hover is on', () => {
    const { container } = render(<Marquee items={ITEMS} />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!.getAttribute('data-pause-on-hover'),
    ).toBe('true')
  })

  it('pauseOnHover={false} drops the attribute', () => {
    const { container } = render(<Marquee items={ITEMS} pauseOnHover={false} />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!,
    ).not.toHaveAttribute('data-pause-on-hover')
  })

  it('default aria-label is "Marquee"', () => {
    const { getByLabelText } = render(<Marquee items={ITEMS} />)
    expect(getByLabelText('Marquee')).toBeInTheDocument()
  })

  it('custom aria-label overrides the default', () => {
    const { getByLabelText } = render(<Marquee items={ITEMS} aria-label="Features" />)
    expect(getByLabelText('Features')).toBeInTheDocument()
  })

  it('renders arbitrary nodes as items (once per track copy)', () => {
    const { getAllByTestId } = render(
      <Marquee items={[<span data-testid="logo" key="l">LOGO</span>]} />,
    )
    expect(getAllByTestId('logo')).toHaveLength(2)
  })

  it('empty items renders no tracks', () => {
    const { container } = render(<Marquee items={[]} />)
    expect(container.querySelectorAll('[data-marquee-track]')).toHaveLength(0)
  })

  it('passes through className', () => {
    const { container } = render(<Marquee items={ITEMS} className="extra" />)
    expect(container.querySelector('[data-testid="marquee-root"]')!.className).toContain('extra')
  })
})

// ─── Reduced motion ───────────────────────────────────────────────────────────

describe('Marquee under prefers-reduced-motion', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders a single static track (no clone)', () => {
    mockMatchMedia(true)
    const { container } = render(<Marquee items={ITEMS} />)
    expect(container.querySelectorAll('[data-marquee-track]')).toHaveLength(1)
  })

  it('sets data-reduced on the root', () => {
    mockMatchMedia(true)
    const { container } = render(<Marquee items={ITEMS} />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!,
    ).toHaveAttribute('data-reduced')
  })

  it('reads each item exactly once when static', () => {
    mockMatchMedia(true)
    const { getAllByText } = render(<Marquee items={ITEMS} />)
    expect(getAllByText('Multitrack')).toHaveLength(1)
  })

  it('no data-reduced when motion is allowed', () => {
    mockMatchMedia(false)
    const { container } = render(<Marquee items={ITEMS} />)
    expect(
      container.querySelector('[data-testid="marquee-root"]')!,
    ).not.toHaveAttribute('data-reduced')
  })
})
