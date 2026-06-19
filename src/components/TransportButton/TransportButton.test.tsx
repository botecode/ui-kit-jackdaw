import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TransportButton } from './TransportButton'

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('TransportButton rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('data-variant reflects prop', () => {
    const { getByRole } = render(<TransportButton variant="stop" onClick={noop} />)
    expect(getByRole('button').getAttribute('data-variant')).toBe('stop')
  })

  it('data-size is "md" by default', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size reflects size prop', () => {
    const { getByRole } = render(
      <TransportButton variant="play" size="sm" onClick={noop} />,
    )
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })

  it('no aria-pressed on play variant', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })

  it('no aria-pressed on stop variant', () => {
    const { getByRole } = render(<TransportButton variant="stop" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })

  it('no aria-pressed on pause variant', () => {
    const { getByRole } = render(<TransportButton variant="pause" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('aria-pressed')
  })
})

// ─── aria-label ──────────────────────────────────────────────────────────────

describe('TransportButton aria-label', () => {
  const noop = vi.fn()

  it('play variant: default label is "Play" when not playing', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Play')
  })

  it('play variant: default label is "Pause" when playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="play" playing onClick={noop} />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Pause')
  })

  it('stop variant: default label is "Stop"', () => {
    const { getByRole } = render(<TransportButton variant="stop" onClick={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Stop')
  })

  it('pause variant: default label is "Pause"', () => {
    const { getByRole } = render(<TransportButton variant="pause" onClick={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Pause')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <TransportButton variant="play" onClick={noop} aria-label="Play from cursor" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Play from cursor')
  })
})

// ─── data-playing gating ─────────────────────────────────────────────────────

describe('TransportButton data-playing', () => {
  const noop = vi.fn()

  it('data-playing present when variant=play and playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="play" playing onClick={noop} />,
    )
    expect(getByRole('button')).toHaveAttribute('data-playing')
  })

  it('data-playing absent when variant=play and playing=false', () => {
    const { getByRole } = render(<TransportButton variant="play" onClick={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-playing')
  })

  it('data-playing absent when variant=stop even if playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="stop" playing onClick={noop} />,
    )
    expect(getByRole('button')).not.toHaveAttribute('data-playing')
  })

  it('data-playing absent when variant=pause even if playing=true', () => {
    const { getByRole } = render(
      <TransportButton variant="pause" playing onClick={noop} />,
    )
    expect(getByRole('button')).not.toHaveAttribute('data-playing')
  })
})

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('TransportButton interaction', () => {
  it('clicking fires onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(<TransportButton variant="play" onClick={onClick} />)
    fireEvent.click(getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disabled: clicking does not fire onClick', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <TransportButton variant="play" disabled onClick={onClick} />,
    )
    expect(getByRole('button')).toBeDisabled()   // ← add this line
    fireEvent.click(getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
