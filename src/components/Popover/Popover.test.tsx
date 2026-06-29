import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { Popover } from './Popover'
import { ThemeProvider } from '../../theme/ThemeProvider'

// jsdom default viewport: 1024 × 768

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Test 1: portal escape ─────────────────────────────────────────────────────

describe('Popover anchorRef — portal', () => {
  it('portals content outside an overflow:hidden ancestor', () => {
    const triggerEl = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    render(
      <div data-testid="clip" style={{ overflow: 'hidden' }}>
        <Popover
          containerRef={{ current: containerEl }}
          anchorRef={{ current: triggerEl }}
          onClose={vi.fn()}
        >
          <div data-testid="content">hello</div>
        </Popover>
      </div>,
    )

    const content  = screen.getByTestId('content')
    const clipDiv  = screen.getByTestId('clip')
    expect(clipDiv.contains(content)).toBe(false)
    expect(document.body.contains(content)).toBe(true)

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 1b: portalled content inherits the opening subtree's theme ───────────
// The content escapes the themed subtree (portal), so the tokens must be
// re-declared at the portal root or var(--accent) & co. resolve to nothing.

describe('Popover — portalled theme inheritance', () => {
  it('re-declares the opening theme tokens at the portal root', () => {
    const triggerEl = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    render(
      <ThemeProvider theme="bowie">
        <Popover
          containerRef={{ current: containerEl }}
          anchorRef={{ current: triggerEl }}
          onClose={vi.fn()}
        >
          <div data-testid="content">hello</div>
        </Popover>
      </ThemeProvider>,
    )

    const content = screen.getByTestId('content')
    const wrapper = content.closest('[data-theme]') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.getAttribute('data-theme')).toBe('bowie')
    expect(wrapper.style.getPropertyValue('--accent')).toBe('#ef2b3d')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })

  it('falls back to the default theme when opened with no ThemeProvider ancestor', () => {
    const triggerEl = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const content = screen.getByTestId('content')
    const wrapper = content.closest('[data-theme]') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.getAttribute('data-theme')).toBe('chroma')
    expect(wrapper.style.getPropertyValue('--accent')).not.toBe('')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 2: position below trigger ───────────────────────────────────────────

describe('Popover anchorRef — position', () => {
  it('positions below trigger, aligns left, sets minWidth from trigger width', () => {
    const triggerEl  = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 50, bottom: 100, top: 80, width: 120, height: 20,
            right: 170, x: 50, y: 80, toJSON: () => ({}),
          } as DOMRect
        }
        // content div
        return {
          left: 0, top: 0, bottom: 50, right: 80, width: 80, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    // left=50 (trigger.left, no clamp needed)
    // top=102 (trigger.bottom 100 + 2px gap)
    // minWidth=120 (trigger.width)
    expect(shell.style.left).toBe('50px')
    expect(shell.style.top).toBe('102px')
    expect(shell.style.minWidth).toBe('120px')
    expect(shell.style.visibility).toBe('visible')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 3: flip up ───────────────────────────────────────────────────────────

describe('Popover anchorRef — flip', () => {
  it('flips up when menu would overflow bottom of viewport', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    const origH = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true, writable: true })

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 50, bottom: 590, top: 570, width: 120, height: 20,
            right: 170, x: 50, y: 570, toJSON: () => ({}),
          } as DOMRect
        }
        // content: 100px tall — would overflow below (590+2+100+4 = 696 > 600)
        return {
          left: 0, top: 0, bottom: 100, right: 80, width: 80, height: 100,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    // flip up: top = triggerRect.top - menuH - 2 = 570 - 100 - 2 = 468
    expect(shell.style.top).toBe('468px')

    Object.defineProperty(window, 'innerHeight', { value: origH, configurable: true, writable: true })
    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 4: horizontal clamp ──────────────────────────────────────────────────

describe('Popover anchorRef — clamp', () => {
  it('clamps left edge to MARGIN (4px) when trigger overflows viewport left', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: -10, bottom: 30, top: 10, width: 80, height: 20,
            right: 70, x: -10, y: 10, toJSON: () => ({}),
          } as DOMRect
        }
        return {
          left: 0, top: 0, bottom: 50, right: 100, width: 100, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    // left=-10 → clamped to max(4, -10) = 4
    expect(shell.style.left).toBe('4px')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 5: rAF reposition on scroll ─────────────────────────────────────────

describe('Popover anchorRef — reposition', () => {
  it('repositions on scroll event via requestAnimationFrame', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    let rafCallback: FrameRequestCallback | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    // Initial position: left=50
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 50, bottom: 100, top: 80, width: 120, height: 20,
            right: 170, x: 50, y: 80, toJSON: () => ({}),
          } as DOMRect
        }
        return {
          left: 0, top: 0, bottom: 50, right: 80, width: 80, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    render(
      <Popover
        containerRef={{ current: containerEl }}
        anchorRef={{ current: triggerEl }}
        onClose={vi.fn()}
      >
        <div data-testid="content">hello</div>
      </Popover>,
    )

    const shell = screen.getByTestId('content').parentElement!
    expect(shell.style.left).toBe('50px')

    // Update mock to new position: left=200
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      function(this: Element) {
        if (this === triggerEl) {
          return {
            left: 200, bottom: 100, top: 80, width: 120, height: 20,
            right: 320, x: 200, y: 80, toJSON: () => ({}),
          } as DOMRect
        }
        return {
          left: 0, top: 0, bottom: 50, right: 80, width: 80, height: 50,
          x: 0, y: 0, toJSON: () => ({}),
        } as DOMRect
      },
    )

    fireEvent.scroll(window)

    // Advance rAF — fires the reposition callback
    act(() => { rafCallback?.(0) })

    expect(shell.style.left).toBe('200px')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })
})

// ── Test 6: dev throw — both props ────────────────────────────────────────────

describe('Popover dev guard', () => {
  it('throws in dev when both anchor and anchorRef are passed', () => {
    const triggerEl   = document.createElement('button')
    const containerEl = document.createElement('div')
    document.body.appendChild(triggerEl)
    document.body.appendChild(containerEl)

    expect(() =>
      render(
        <Popover
          containerRef={{ current: containerEl }}
          anchor={{ x: 10, y: 10 }}
          anchorRef={{ current: triggerEl }}
          onClose={vi.fn()}
        >
          <div>hello</div>
        </Popover>,
      ),
    ).toThrow('Popover: pass anchor or anchorRef, not both')

    document.body.removeChild(triggerEl)
    document.body.removeChild(containerEl)
  })

  // ── Test 7: dev throw — neither prop ────────────────────────────────────────

  it('throws in dev when neither anchor nor anchorRef is passed', () => {
    const containerEl = document.createElement('div')
    document.body.appendChild(containerEl)

    expect(() =>
      render(
        <Popover
          containerRef={{ current: containerEl }}
          onClose={vi.fn()}
        >
          <div>hello</div>
        </Popover>,
      ),
    ).toThrow('Popover: one of anchor or anchorRef is required')

    document.body.removeChild(containerEl)
  })
})
