import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordMode } from './RecordMode'

const noop = vi.fn()
beforeEach(() => vi.clearAllMocks())

const BASE = {
  state:          'idle'   as const,
  mode:           'normal' as const,
  onToggleRecord: noop,
  onSelectMode:   noop,
}

describe('RecordMode — record button', () => {
  it('renders without crash', () => {
    render(<RecordMode {...BASE} />)
    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument()
  })

  it('idle + normal: aria-pressed=false, no badge, label="Record"', () => {
    render(<RecordMode {...BASE} state="idle" mode="normal" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('[data-testid="record-loop-badge"]')).not.toBeInTheDocument()
  })

  it('armed: aria-pressed=true, label="Record"', () => {
    render(<RecordMode {...BASE} state="armed" />)
    const btn = screen.getByRole('button', { name: 'Record' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('recording: aria-pressed=true, label="Recording"', () => {
    render(<RecordMode {...BASE} state="recording" />)
    const btn = screen.getByRole('button', { name: 'Recording' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('loop-punch mode: badge rendered, label includes "(loop-punch)"', () => {
    render(<RecordMode {...BASE} mode="loop-punch" />)
    expect(screen.getByRole('button', { name: 'Record (loop-punch)' })).toBeInTheDocument()
    expect(document.querySelector('[data-testid="record-loop-badge"]')).toBeInTheDocument()
  })

  it('normal mode: no badge rendered', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    expect(document.querySelector('[data-testid="record-loop-badge"]')).not.toBeInTheDocument()
  })

  it('recording + loop-punch: label="Recording (loop-punch)"', () => {
    render(<RecordMode {...BASE} state="recording" mode="loop-punch" />)
    expect(screen.getByRole('button', { name: 'Recording (loop-punch)' })).toBeInTheDocument()
  })

  it('record button click fires onToggleRecord', () => {
    const onToggleRecord = vi.fn()
    render(<RecordMode {...BASE} onToggleRecord={onToggleRecord} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    expect(onToggleRecord).toHaveBeenCalledTimes(1)
  })
})

describe('RecordMode — caret + mode menu', () => {
  it('caret click opens the menu and caret is focused', () => {
    render(<RecordMode {...BASE} />)
    const caret = screen.getByRole('button', { name: 'Record mode' })
    fireEvent.click(caret)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(caret).toHaveAttribute('aria-expanded', 'true')
    // caret.focus() is called in openMenu (WebKit fix); ContextMenu then moves
    // focus to its first item, which is why document.activeElement is the first
    // item rather than the caret here. The ContextMenu captures the caret as
    // returnFocusRef (via useLayoutEffect) so focus returns correctly on close —
    // see the Escape and item-select tests below.
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Normal' }))
  })

  it('Escape closes the menu and returns focus to the caret', () => {
    render(<RecordMode {...BASE} />)
    const caret = screen.getByRole('button', { name: 'Record mode' })
    fireEvent.click(caret)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(caret)
  })

  it('selecting an item closes the menu and returns focus to the caret', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    const caret = screen.getByRole('button', { name: 'Record mode' })
    fireEvent.click(caret)
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(caret)
  })

  // NOTE: Tests 9–11 rely on jsdom focusing buttons on click (Chrome behaviour).
  // They guard general focus-return but cannot reproduce the WebKit "click
  // doesn't focus a button" quirk. The WebKit fix lives in the explicit
  // `caretRef.current?.focus()` call in openMenu() — verify it in a real browser.

  it('"Normal" click fires onSelectMode("normal") and closes menu', () => {
    const onSelectMode = vi.fn()
    render(<RecordMode {...BASE} mode="loop-punch" onSelectMode={onSelectMode} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Normal' }))
    expect(onSelectMode).toHaveBeenCalledWith('normal')
    expect(onSelectMode).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('"Loop / punch" click fires onSelectMode("loop-punch") and closes menu', () => {
    const onSelectMode = vi.fn()
    render(<RecordMode {...BASE} mode="normal" onSelectMode={onSelectMode} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
    expect(onSelectMode).toHaveBeenCalledWith('loop-punch')
    expect(onSelectMode).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('mode=normal: "Normal" is aria-checked=true, "Loop / punch" is aria-checked=false', () => {
    render(<RecordMode {...BASE} mode="normal" />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.getByRole('menuitemradio', { name: 'Normal' }))
      .toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
      .toHaveAttribute('aria-checked', 'false')
  })

  it('mode=loop-punch: "Loop / punch" is aria-checked=true, "Normal" is aria-checked=false', () => {
    render(<RecordMode {...BASE} mode="loop-punch" />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
      .toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Normal' }))
      .toHaveAttribute('aria-checked', 'false')
  })

  it('disabled=true: both buttons have disabled attribute', () => {
    render(<RecordMode {...BASE} disabled />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('disabled=true: caret click does NOT open the menu', () => {
    render(<RecordMode {...BASE} disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('disabled=true: record button click does NOT fire onToggleRecord', () => {
    const onToggleRecord = vi.fn()
    render(<RecordMode {...BASE} disabled onToggleRecord={onToggleRecord} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    expect(onToggleRecord).not.toHaveBeenCalled()
  })

  it('size=sm applies data-size=sm on container', () => {
    const { container } = render(<RecordMode {...BASE} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })
})
