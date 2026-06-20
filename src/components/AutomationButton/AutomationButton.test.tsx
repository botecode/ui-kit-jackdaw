import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AutomationButton } from './AutomationButton'

const noop = vi.fn()
beforeEach(() => vi.clearAllMocks())

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('AutomationButton rendering', () => {
  it('renders a button', () => {
    render(<AutomationButton engaged={false} onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).toBeInTheDocument()
  })

  it('aria-pressed="false" when engaged=false', () => {
    render(<AutomationButton engaged={false} onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('aria-pressed="true" when engaged=true', () => {
    render(<AutomationButton engaged onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('data-engaged present when engaged=true', () => {
    render(<AutomationButton engaged onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).toHaveAttribute('data-engaged')
  })

  it('data-engaged absent when engaged=false', () => {
    render(<AutomationButton engaged={false} onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).not.toHaveAttribute('data-engaged')
  })

  it('data-size="md" by default', () => {
    render(<AutomationButton engaged={false} onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    render(<AutomationButton engaged={false} onToggle={noop} size="sm" />)
    expect(screen.getByRole('button', { name: 'Automation' })).toHaveAttribute('data-size', 'sm')
  })
})

// ─── aria-label / scope ───────────────────────────────────────────────────────

describe('AutomationButton aria-label', () => {
  it('default label is "Automation" for track scope', () => {
    render(<AutomationButton engaged={false} onToggle={noop} scope="track" />)
    expect(screen.getByRole('button', { name: 'Automation' })).toBeInTheDocument()
  })

  it('default label is "Automation" when scope omitted', () => {
    render(<AutomationButton engaged={false} onToggle={noop} />)
    expect(screen.getByRole('button', { name: 'Automation' })).toBeInTheDocument()
  })

  it('default label is "Master automation" for master scope', () => {
    render(<AutomationButton engaged={false} onToggle={noop} scope="master" />)
    expect(screen.getByRole('button', { name: 'Master automation' })).toBeInTheDocument()
  })

  it('custom aria-label overrides scope default', () => {
    render(
      <AutomationButton engaged={false} onToggle={noop} aria-label="Track 1 automation" />,
    )
    expect(screen.getByRole('button', { name: 'Track 1 automation' })).toBeInTheDocument()
  })
})

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('AutomationButton interaction', () => {
  it('clicking fires onToggle', () => {
    const onToggle = vi.fn()
    render(<AutomationButton engaged={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('disabled: clicking does not fire onToggle', () => {
    const onToggle = vi.fn()
    render(<AutomationButton engaged={false} onToggle={onToggle} disabled />)
    expect(screen.getByRole('button', { name: 'Automation' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Automation' }))
    expect(onToggle).not.toHaveBeenCalled()
  })
})

// ─── Mode menu (caret) ────────────────────────────────────────────────────────

describe('AutomationButton mode menu', () => {
  const BASE = {
    engaged:      false as const,
    onToggle:     noop,
    mode:         'read' as const,
    onModeChange: noop,
  }

  it('caret button is rendered when onModeChange is provided', () => {
    render(<AutomationButton {...BASE} />)
    expect(screen.getByRole('button', { name: 'Automation mode' })).toBeInTheDocument()
  })

  it('caret button is absent when onModeChange is not provided', () => {
    render(<AutomationButton engaged={false} onToggle={noop} />)
    expect(screen.queryByRole('button', { name: 'Automation mode' })).not.toBeInTheDocument()
  })

  it('caret click opens the menu', () => {
    render(<AutomationButton {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('caret aria-expanded=true when menu open', () => {
    render(<AutomationButton {...BASE} />)
    const caret = screen.getByRole('button', { name: 'Automation mode' })
    fireEvent.click(caret)
    expect(caret).toHaveAttribute('aria-expanded', 'true')
  })

  it('Escape closes the menu', () => {
    render(<AutomationButton {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('"Read" click fires onModeChange("read") and closes menu', () => {
    const onModeChange = vi.fn()
    render(<AutomationButton {...BASE} mode="write" onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Read' }))
    expect(onModeChange).toHaveBeenCalledWith('read')
    expect(onModeChange).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('"Write" click fires onModeChange("write") and closes menu', () => {
    const onModeChange = vi.fn()
    render(<AutomationButton {...BASE} mode="read" onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Write' }))
    expect(onModeChange).toHaveBeenCalledWith('write')
    expect(onModeChange).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('mode="read": "Read" is aria-checked=true, "Write" is aria-checked=false', () => {
    render(<AutomationButton {...BASE} mode="read" />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    expect(screen.getByRole('menuitemradio', { name: 'Read' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Write' })).toHaveAttribute('aria-checked', 'false')
  })

  it('mode="write": "Write" is aria-checked=true, "Read" is aria-checked=false', () => {
    render(<AutomationButton {...BASE} mode="write" />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    expect(screen.getByRole('menuitemradio', { name: 'Write' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Read' })).toHaveAttribute('aria-checked', 'false')
  })

  it('disabled=true: both buttons are disabled', () => {
    render(<AutomationButton {...BASE} disabled />)
    screen.getAllByRole('button').forEach(btn => expect(btn).toBeDisabled())
  })

  it('disabled=true: caret click does NOT open the menu', () => {
    render(<AutomationButton {...BASE} disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation mode' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('disabled=true: toggle click does NOT fire onToggle', () => {
    const onToggle = vi.fn()
    render(<AutomationButton {...BASE} onToggle={onToggle} disabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Automation' }))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('size=sm applies data-size=sm on container', () => {
    const { container } = render(<AutomationButton {...BASE} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })
})
