// src/components/Tooltip/Tooltip.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { Tooltip } from './Tooltip'

// ── Helper ────────────────────────────────────────────────────────────────────

function renderTooltip(props: {
  content?:   string
  delay?:     number
  disabled?:  boolean
  placement?: 'top' | 'bottom' | 'left' | 'right'
} = {}) {
  return render(
    <Tooltip
      content={props.content ?? 'Save file'}
      delay={props.delay}
      disabled={props.disabled}
      placement={props.placement}
    >
      <button>Save</button>
    </Tooltip>,
  )
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Tooltip rendering', () => {
  it('renders the trigger child', () => {
    renderTooltip()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('does not show tooltip before any interaction', () => {
    renderTooltip()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('sets aria-describedby on trigger pointing to tooltip id', () => {
    renderTooltip()
    const trigger = screen.getByRole('button')
    fireEvent.focus(trigger)
    const tooltip = screen.getByRole('tooltip')
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
  })

  it('aria-describedby absent when disabled', () => {
    renderTooltip({ disabled: true })
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby')
  })

  it('tooltip has role="tooltip"', () => {
    renderTooltip()
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('renders content inside the tooltip', () => {
    renderTooltip({ content: 'Open settings' })
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Open settings')
  })
})

// ── Focus / blur ──────────────────────────────────────────────────────────────

describe('Tooltip focus/blur', () => {
  it('shows tooltip immediately on focus', () => {
    renderTooltip()
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('hides tooltip on blur', () => {
    renderTooltip()
    const trigger = screen.getByRole('button')
    fireEvent.focus(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.blur(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('does not show tooltip on focus when disabled', () => {
    renderTooltip({ disabled: true })
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

// ── Hover with delay ──────────────────────────────────────────────────────────

describe('Tooltip hover delay', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does not show tooltip immediately on mouseenter', () => {
    renderTooltip({ delay: 300 })
    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip after the delay elapses', () => {
    renderTooltip({ delay: 300 })
    fireEvent.mouseEnter(screen.getByRole('button'))
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('does not show before the delay completes', () => {
    renderTooltip({ delay: 300 })
    fireEvent.mouseEnter(screen.getByRole('button'))
    act(() => { vi.advanceTimersByTime(299) })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides tooltip on mouseleave', () => {
    renderTooltip({ delay: 0 })
    const trigger = screen.getByRole('button')
    fireEvent.mouseEnter(trigger)
    act(() => { vi.runAllTimers() })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('cancels pending timer on mouseleave before delay fires', () => {
    renderTooltip({ delay: 300 })
    const trigger = screen.getByRole('button')
    fireEvent.mouseEnter(trigger)
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.mouseLeave(trigger)
    act(() => { vi.advanceTimersByTime(200) })  // timer was cancelled — no tooltip
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('does not show tooltip on hover when disabled', () => {
    renderTooltip({ disabled: true, delay: 0 })
    fireEvent.mouseEnter(screen.getByRole('button'))
    act(() => { vi.runAllTimers() })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

// ── Escape / keyboard ─────────────────────────────────────────────────────────

describe('Tooltip keyboard dismiss', () => {
  it('hides tooltip on Escape keydown on the trigger', () => {
    renderTooltip()
    const trigger = screen.getByRole('button')
    fireEvent.focus(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides tooltip on global Escape while open (hover-without-focus case)', () => {
    renderTooltip()
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('does not hide tooltip on other keys', () => {
    renderTooltip()
    const trigger = screen.getByRole('button')
    fireEvent.focus(trigger)
    fireEvent.keyDown(trigger, { key: 'Tab' })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })
})

// ── Scroll dismiss ────────────────────────────────────────────────────────────

describe('Tooltip scroll dismiss', () => {
  it('hides tooltip on window scroll', () => {
    renderTooltip()
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.scroll(window)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

// ── Child handler delegation ─────────────────────────────────────────────────

describe('Tooltip child handler delegation', () => {
  it('calls child original onFocus when tooltip shows', () => {
    const onFocus = vi.fn()
    render(
      <Tooltip content="hint">
        <button onFocus={onFocus}>Btn</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button'))
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('calls child original onBlur when tooltip hides', () => {
    const onBlur = vi.fn()
    render(
      <Tooltip content="hint">
        <button onBlur={onBlur}>Btn</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    fireEvent.focus(trigger)
    fireEvent.blur(trigger)
    expect(onBlur).toHaveBeenCalledOnce()
  })

  it('calls child original onMouseEnter on hover', () => {
    const onMouseEnter = vi.fn()
    render(
      <Tooltip content="hint">
        <button onMouseEnter={onMouseEnter}>Btn</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(onMouseEnter).toHaveBeenCalledOnce()
  })

  it('calls child original onKeyDown on key press', () => {
    const onKeyDown = vi.fn()
    render(
      <Tooltip content="hint">
        <button onKeyDown={onKeyDown}>Btn</button>
      </Tooltip>,
    )
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onKeyDown).toHaveBeenCalledOnce()
  })
})
