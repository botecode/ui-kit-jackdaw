// src/components/ScrollArea/ScrollArea.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { ScrollArea } from './ScrollArea'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('ScrollArea rendering', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ScrollArea><p>content</p></ScrollArea>
    )
    expect(getByText('content')).toBeInTheDocument()
  })

  it('data-orientation="vertical" by default', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-orientation', 'vertical')
  })

  it('data-orientation reflects prop', () => {
    const { container } = render(
      <ScrollArea orientation="horizontal"><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('data-orientation="both" when prop="both"', () => {
    const { container } = render(
      <ScrollArea orientation="both"><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveAttribute('data-orientation', 'both')
  })

  it('data-size="md" by default', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<ScrollArea size="sm"><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('no data-auto-hide when autoHide=false (default)', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    expect(container.firstChild).not.toHaveAttribute('data-auto-hide')
  })

  it('data-auto-hide present when autoHide=true', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    expect(container.firstChild).toHaveAttribute('data-auto-hide')
  })

  it('forwards className', () => {
    const { container } = render(
      <ScrollArea className="extra"><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveClass('extra')
  })

  it('forwards style', () => {
    const { container } = render(
      <ScrollArea style={{ height: '200px' }}><div /></ScrollArea>
    )
    expect(container.firstChild).toHaveStyle({ height: '200px' })
  })
})

// ─── Auto-hide scroll handling ───────────────────────────────────────────────

describe('ScrollArea auto-hide', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('scroll fires: data-scrolling appears when autoHide=true', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    expect(el).toHaveAttribute('data-scrolling')
  })

  it('scroll fires: data-scrolling cleared after 1200ms', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    expect(el).toHaveAttribute('data-scrolling')
    act(() => { vi.advanceTimersByTime(1200) })
    expect(el).not.toHaveAttribute('data-scrolling')
  })

  it('scroll fires: timer resets on each scroll event', () => {
    const { container } = render(<ScrollArea autoHide><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    act(() => { vi.advanceTimersByTime(800) })
    // Fire scroll again — resets the 1200ms timer
    fireEvent.scroll(el)
    act(() => { vi.advanceTimersByTime(800) })
    // Only 800ms since the last scroll — still within window
    expect(el).toHaveAttribute('data-scrolling')
    act(() => { vi.advanceTimersByTime(500) })
    // Now 1300ms since last scroll — timer should have fired
    expect(el).not.toHaveAttribute('data-scrolling')
  })

  it('scroll does NOT set data-scrolling when autoHide=false', () => {
    const { container } = render(<ScrollArea><div /></ScrollArea>)
    const el = container.firstChild as HTMLElement
    fireEvent.scroll(el)
    expect(el).not.toHaveAttribute('data-scrolling')
  })
})
