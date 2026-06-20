import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditCursor } from './EditCursor'

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
