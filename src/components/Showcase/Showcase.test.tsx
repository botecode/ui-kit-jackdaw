// src/components/Showcase/Showcase.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { Showcase } from './Showcase'
import type { ShowcaseSection } from './Showcase'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SECTIONS: ShowcaseSection[] = [
  {
    id: 'capture',
    eyebrow: '01 / CAPTURE',
    title: 'Never waste one idea.',
    body: 'Hit record the moment inspiration strikes — Jackdaw is rolling before you finish the thought.',
    media: <div data-testid="media-capture">media</div>,
    cta: { label: 'See capture', href: '#capture' },
  },
  {
    id: 'shape',
    eyebrow: '02 / SHAPE',
    title: 'Shape the sound.',
    body: 'The focused-track detail panel brings the meter, routing and full FX up close.',
    media: <div data-testid="media-shape">media</div>,
  },
  {
    id: 'share',
    title: 'Send it anywhere.',
    body: 'Transparent receive — a link, a password, done.',
    media: <div data-testid="media-share">media</div>,
    cta: { label: 'Learn more' },
    side: 'left',
  },
]

// jsdom has no IntersectionObserver by default — most tests rely on the
// "no IO → revealed immediately" fallback path. A couple of tests install a mock.

beforeEach(() => {
  // ensure no leftover IO mock from a prior test
  // @ts-expect-error - deleting optional global
  delete window.IntersectionObserver
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Showcase — rendering', () => {
  it('renders the root as a labelled region', () => {
    render(<Showcase sections={SECTIONS} aria-label="Feature tour" />)
    expect(screen.getByRole('region', { name: 'Feature tour' })).toBeInTheDocument()
  })

  it('renders one article per section', () => {
    render(<Showcase sections={SECTIONS} />)
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('renders title, body and eyebrow', () => {
    render(<Showcase sections={SECTIONS} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Never waste one idea.' })).toBeInTheDocument()
    expect(screen.getByText(/Hit record the moment/)).toBeInTheDocument()
    expect(screen.getByText('01 / CAPTURE')).toBeInTheDocument()
  })

  it('renders the media slot for each section', () => {
    render(<Showcase sections={SECTIONS} />)
    expect(screen.getByTestId('media-capture')).toBeInTheDocument()
    expect(screen.getByTestId('media-shape')).toBeInTheDocument()
    expect(screen.getByTestId('media-share')).toBeInTheDocument()
  })

  it('omits the eyebrow when absent', () => {
    render(<Showcase sections={[SECTIONS[2]!]} />)
    expect(screen.queryByText('01 / CAPTURE')).not.toBeInTheDocument()
  })

  it('links each article to its heading via aria-labelledby', () => {
    render(<Showcase sections={SECTIONS} />)
    const article = screen.getAllByRole('article')[0]!
    const id = article.getAttribute('aria-labelledby')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)?.textContent).toBe('Never waste one idea.')
  })

  it('applies data-size="md" by default and sm when requested', () => {
    const { rerender } = render(<Showcase sections={SECTIONS} aria-label="x" />)
    expect(screen.getByRole('region')).toHaveAttribute('data-size', 'md')
    rerender(<Showcase sections={SECTIONS} size="sm" aria-label="x" />)
    expect(screen.getByRole('region')).toHaveAttribute('data-size', 'sm')
  })
})

// ── Side alternation ──────────────────────────────────────────────────────────

describe('Showcase — side alternation', () => {
  it('alternates media side: even=left, odd=right when side omitted', () => {
    render(<Showcase sections={[SECTIONS[0]!, SECTIONS[1]!]} />)
    const [a, b] = screen.getAllByRole('article')
    expect(a).toHaveAttribute('data-side', 'left')
    expect(b).toHaveAttribute('data-side', 'right')
  })

  it('per-section side overrides the alternation', () => {
    // index 2 would auto be 'left' (even), and SECTIONS[2] forces 'left' — use a
    // section at an odd index forcing left to prove the override.
    render(<Showcase sections={[SECTIONS[0]!, { ...SECTIONS[1]!, side: 'left' }]} />)
    const [, b] = screen.getAllByRole('article')
    expect(b).toHaveAttribute('data-side', 'left') // odd index would be 'right' without override
  })
})

// ── CTA ───────────────────────────────────────────────────────────────────────

describe('Showcase — CTA', () => {
  it('renders an anchor with href when cta.href is set', () => {
    render(<Showcase sections={[SECTIONS[0]!]} />)
    const link = screen.getByRole('link', { name: /See capture/ })
    expect(link).toHaveAttribute('href', '#capture')
  })

  it('renders a button and fires onClick when cta has no href', () => {
    const onClick = vi.fn()
    render(<Showcase sections={[{ ...SECTIONS[2]!, cta: { label: 'Learn more', onClick } }]} />)
    fireEvent.click(screen.getByRole('button', { name: /Learn more/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders no CTA when cta is absent', () => {
    render(<Showcase sections={[SECTIONS[1]!]} />)
    const article = screen.getByRole('article')
    expect(within(article).queryByRole('link')).not.toBeInTheDocument()
    expect(within(article).queryByRole('button')).not.toBeInTheDocument()
  })
})

// ── Empty ─────────────────────────────────────────────────────────────────────

describe('Showcase — empty', () => {
  it('renders no articles and does not crash with empty sections', () => {
    render(<Showcase sections={[]} aria-label="empty" />)
    expect(screen.getByRole('region', { name: 'empty' })).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})

// ── Reveal-on-scroll ──────────────────────────────────────────────────────────

describe('Showcase — reveal', () => {
  it('without IntersectionObserver, sections are revealed (visible) immediately', () => {
    render(<Showcase sections={SECTIONS} />)
    for (const article of screen.getAllByRole('article')) {
      expect(article).toHaveAttribute('data-revealed', 'true')
    }
  })

  it('with reveal disabled, sections are revealed even when IO exists', () => {
    const observe = vi.fn()
    // @ts-expect-error - test mock
    window.IntersectionObserver = class {
      observe = observe
      unobserve = vi.fn()
      disconnect = vi.fn()
      constructor(_cb: unknown) {}
    }
    render(<Showcase sections={SECTIONS} reveal={false} />)
    for (const article of screen.getAllByRole('article')) {
      expect(article).toHaveAttribute('data-revealed', 'true')
    }
    expect(observe).not.toHaveBeenCalled()
  })

  it('with IO present and reveal on, starts hidden then reveals on intersection', () => {
    let captured: ((entries: Array<{ isIntersecting: boolean; target: Element }>) => void) | null = null
    const unobserve = vi.fn()
    // @ts-expect-error - test mock
    window.IntersectionObserver = class {
      unobserve = unobserve
      disconnect = vi.fn()
      constructor(cb: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void) {
        captured = cb
      }
      observe = vi.fn()
    }
    render(<Showcase sections={[SECTIONS[0]!]} reveal />)
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('data-revealed', 'false')

    // Simulate the element scrolling into view.
    act(() => {
      captured!([{ isIntersecting: true, target: article }])
    })
    expect(article).toHaveAttribute('data-revealed', 'true')
  })
})
