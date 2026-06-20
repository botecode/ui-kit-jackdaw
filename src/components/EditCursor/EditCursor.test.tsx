import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditCursor, type EditCursorProps } from './EditCursor'

const noop = () => {}
const identity = (s: number) => s * 10

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('EditCursor rendering', () => {
  it('renders root with data-testid="edit-cursor-root"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-root')).not.toBeNull()
  })

  it('renders line with data-testid="edit-cursor-line"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-line')).not.toBeNull()
  })

  it('renders handleWrap with data-testid="edit-cursor-handle-wrap"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap')).not.toBeNull()
  })

  it('renders handle with data-testid="edit-cursor-handle"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle')).not.toBeNull()
  })

  it('handle is a child of handleWrap', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    const handle = screen.getByTestId('edit-cursor-handle')
    expect(wrap.contains(handle)).toBe(true)
  })
})

// ─── Structural focus-ring guard ──────────────────────────────────────────────
// These two tests pin the handleWrap/clip-path separation so that moving
// role/tabIndex back onto the clipped element re-clips the focus ring and
// breaks the tests — the regression we explicitly designed out.

describe('EditCursor structural focus-ring guard', () => {
  it('handleWrap carries role="slider" (the focusable, unclipped element)', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    expect(wrap).toHaveAttribute('role', 'slider')
  })

  it('handle (clip-path child) is aria-hidden', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    const handle = screen.getByTestId('edit-cursor-handle')
    expect(handle).toHaveAttribute('aria-hidden', 'true')
  })
})

// ─── ARIA ─────────────────────────────────────────────────────────────────────

describe('EditCursor ARIA', () => {
  it('aria-valuemin=0', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuemin', '0')
  })

  it('aria-valuemax=durationSeconds when provided', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} durationSeconds={120} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuemax', '120')
  })

  it('aria-valuemax=3600 when durationSeconds absent', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuemax', '3600')
  })

  it('aria-valuenow=seconds', () => {
    render(<EditCursor seconds={7} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-valuenow', '7')
  })

  it('aria-valuetext is a human-readable formatted string, not just the raw number', () => {
    render(<EditCursor seconds={4} secondsToX={identity} onSeek={noop} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    const text = wrap.getAttribute('aria-valuetext')
    expect(text).not.toBe('4')
    expect(text).toBe('0:04.0')
  })

  it('aria-label defaults to "Edit cursor"', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-label', 'Edit cursor')
  })

  it('aria-label uses provided value', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} aria-label="Loop start" />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('aria-label', 'Loop start')
  })

  it('tabIndex=0 by default', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} />)
    expect(screen.getByTestId('edit-cursor-handle-wrap'))
      .toHaveAttribute('tabindex', '0')
  })

  it('tabIndex=-1 and aria-disabled when disabled', () => {
    render(<EditCursor seconds={0} secondsToX={identity} onSeek={noop} disabled />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    expect(wrap).toHaveAttribute('tabindex', '-1')
    expect(wrap).toHaveAttribute('aria-disabled', 'true')
  })
})

// ─── Park channel ─────────────────────────────────────────────────────────────
// DPR = 1 in jsdom so Math.round(x * 1) / 1 = x — no rounding complication.

describe('EditCursor park channel', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn())
    vi.stubGlobal('cancelAnimationFrame',  vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('writes translateX on mount from seconds + secondsToX', () => {
    render(<EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />)
    const el = screen.getByTestId('edit-cursor-root') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')
  })

  it('re-parks when seconds prop changes', () => {
    const { rerender } = render(
      <EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />
    )
    const el = screen.getByTestId('edit-cursor-root') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')

    rerender(<EditCursor seconds={12} secondsToX={s => s * 10} onSeek={noop} />)
    expect(el.style.transform).toBe('translateX(120px)')
  })

  it('re-parks when secondsToX reference changes (zoom)', () => {
    const { rerender } = render(
      <EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />
    )
    const el = screen.getByTestId('edit-cursor-root') as HTMLElement
    expect(el.style.transform).toBe('translateX(50px)')

    rerender(<EditCursor seconds={5} secondsToX={s => s * 20} onSeek={noop} />)
    expect(el.style.transform).toBe('translateX(100px)')
  })

  it('does not start a requestAnimationFrame loop', () => {
    const rafSpy = vi.fn()
    vi.stubGlobal('requestAnimationFrame', rafSpy)
    render(<EditCursor seconds={5} secondsToX={s => s * 10} onSeek={noop} />)
    expect(rafSpy).not.toHaveBeenCalled()
  })
})

// ─── Keyboard interaction ─────────────────────────────────────────────────────

describe('EditCursor keyboard', () => {
  function setup(seconds: number, opts: Partial<EditCursorProps> = {}) {
    const onSeek = vi.fn()
    render(
      <EditCursor
        seconds={seconds}
        secondsToX={s => s * 10}
        onSeek={onSeek}
        durationSeconds={30}
        step={1}
        largeStep={5}
        {...opts}
      />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    return { onSeek, wrap }
  }

  it('ArrowRight fires onSeek(seconds + step)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(11)
  })

  it('ArrowLeft fires onSeek(seconds - step)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(9)
  })

  it('PageUp fires onSeek(seconds + largeStep)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'PageUp' })
    expect(onSeek).toHaveBeenCalledWith(15)
  })

  it('PageDown fires onSeek(seconds - largeStep)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'PageDown' })
    expect(onSeek).toHaveBeenCalledWith(5)
  })

  it('Home fires onSeek(0)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'Home' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('End fires onSeek(durationSeconds)', () => {
    const { onSeek, wrap } = setup(10)
    fireEvent.keyDown(wrap, { key: 'End' })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('End fires onSeek(3600) when durationSeconds absent', () => {
    const onSeek = vi.fn()
    render(<EditCursor seconds={0} secondsToX={s => s * 10} onSeek={onSeek} />)
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.keyDown(wrap, { key: 'End' })
    expect(onSeek).toHaveBeenCalledWith(3600)
  })

  it('ArrowRight clamps to max at upper boundary', () => {
    const { onSeek, wrap } = setup(29)   // 29 + 1 = 30 = max
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('ArrowRight stays at max when already at boundary', () => {
    // At max, ArrowRight stays at max
    const { onSeek, wrap } = setup(30)
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('ArrowLeft clamps to 0 at lower boundary', () => {
    const { onSeek, wrap } = setup(0)
    fireEvent.keyDown(wrap, { key: 'ArrowLeft' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('PageUp clamps to max', () => {
    const { onSeek, wrap } = setup(28)  // 28 + 5 = 33 → clamped to 30
    fireEvent.keyDown(wrap, { key: 'PageUp' })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('PageDown clamps to 0', () => {
    const { onSeek, wrap } = setup(2)   // 2 - 5 = -3 → clamped to 0
    fireEvent.keyDown(wrap, { key: 'PageDown' })
    expect(onSeek).toHaveBeenCalledWith(0)
  })
})

// ─── Disabled — keyboard no-op ────────────────────────────────────────────────

describe('EditCursor disabled keyboard no-op', () => {
  function setupDisabled() {
    const onSeek = vi.fn()
    render(
      <EditCursor
        seconds={10}
        secondsToX={s => s * 10}
        onSeek={onSeek}
        durationSeconds={30}
        disabled
      />
    )
    return { onSeek, wrap: screen.getByTestId('edit-cursor-handle-wrap') }
  }

  it('ArrowRight fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'ArrowRight' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('PageUp fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'PageUp' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('Home fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'Home' })
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('End fires no onSeek when disabled', () => {
    const { onSeek, wrap } = setupDisabled()
    fireEvent.keyDown(wrap, { key: 'End' })
    expect(onSeek).not.toHaveBeenCalled()
  })
})

// ─── Drag interaction ─────────────────────────────────────────────────────────
//
// secondsToX = s => s * 20  →  pxPerSecond = secondsToX(1) - secondsToX(0) = 20
// Move 40px right from startClientX=100 → deltaSeconds = 40/20 = 2
// startSeconds=5 → result = 7

describe('EditCursor drag', () => {
  const secondsToX = (s: number) => s * 20  // 20 px/s; pxPerSecond = 20

  beforeEach(() => {
    // jsdom doesn't provide setPointerCapture on HTMLElement; mock it
    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = vi.fn()
    }
  })

  it('pointerdown calls setPointerCapture with the pointerId', () => {
    render(
      <EditCursor seconds={5} secondsToX={secondsToX} onSeek={noop} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    const captureSpy = vi.spyOn(wrap, 'setPointerCapture').mockImplementation(() => {})
    fireEvent.pointerDown(wrap, { pointerId: 42, clientX: 100 })
    expect(captureSpy).toHaveBeenCalledWith(42)
  })

  it('pointermove fires onSeek derived from two-point scale', () => {
    const onSeek = vi.fn()
    render(
      <EditCursor seconds={5} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    // pxPerSecond = 20(1) - 20(0) = 20; start=5, move 40px → +2s → 7
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 140 })
    expect(onSeek).toHaveBeenCalledWith(7)
  })

  it('drag result clamps to max', () => {
    const onSeek = vi.fn()
    render(
      // seconds=29, move 80px right → +4s = 33 → clamped to 30
      <EditCursor seconds={29} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 0 })
    fireEvent.pointerMove(wrap, { clientX: 80 })
    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('drag result clamps to 0', () => {
    const onSeek = vi.fn()
    render(
      // seconds=1, move 60px left → -3s = -2 → clamped to 0
      <EditCursor seconds={1} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 40 })
    expect(onSeek).toHaveBeenCalledWith(0)
  })

  it('pointerup stops onSeek calls', () => {
    const onSeek = vi.fn()
    render(
      <EditCursor seconds={5} secondsToX={secondsToX} onSeek={onSeek} durationSeconds={30} />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 140 })
    expect(onSeek).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(wrap)
    fireEvent.pointerMove(wrap, { clientX: 180 })  // move after release — no new call
    expect(onSeek).toHaveBeenCalledTimes(1)
  })
})

// ─── Disabled — drag no-op ────────────────────────────────────────────────────

describe('EditCursor disabled drag no-op', () => {
  it('pointerDown + pointerMove fires no onSeek when disabled', () => {
    const onSeek = vi.fn()
    render(
      <EditCursor
        seconds={5}
        secondsToX={s => s * 20}
        onSeek={onSeek}
        durationSeconds={30}
        disabled
      />
    )
    const wrap = screen.getByTestId('edit-cursor-handle-wrap')
    fireEvent.pointerDown(wrap, { clientX: 100 })
    fireEvent.pointerMove(wrap, { clientX: 140 })
    expect(onSeek).not.toHaveBeenCalled()
  })
})
