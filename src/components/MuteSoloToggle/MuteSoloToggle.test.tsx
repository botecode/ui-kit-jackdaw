import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MuteSoloToggle, isSilencedBySolo } from './MuteSoloToggle'

describe('isSilencedBySolo', () => {
  it('returns false when anySoloActive=false', () => {
    expect(isSilencedBySolo(false, false, false)).toBe(false)
  })
  it('returns false when anySoloActive=undefined', () => {
    expect(isSilencedBySolo(false, false, undefined)).toBe(false)
  })
  it('returns true when anySoloActive=true, not muted, not soloed', () => {
    expect(isSilencedBySolo(false, false, true)).toBe(true)
  })
  it('returns false when muted=true (explicit mute wins over silenced)', () => {
    expect(isSilencedBySolo(true, false, true)).toBe(false)
  })
  it('returns false when soloed=true', () => {
    expect(isSilencedBySolo(false, true, true)).toBe(false)
  })
  it('returns false when both muted and soloed', () => {
    expect(isSilencedBySolo(true, true, true)).toBe(false)
  })
})

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('MuteSoloToggle rendering', () => {
  const noop = vi.fn()

  it('renders two buttons', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')).toHaveLength(2)
  })

  it('M button aria-pressed="false" when muted=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-pressed')).toBe('false')
  })

  it('M button aria-pressed="true" when muted=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('S button aria-pressed="false" when soloed=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('false')
  })

  it('S button aria-pressed="true" when soloed=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('true')
  })

  it('M button default aria-label is "Mute"', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Mute')
  })

  it('S button default aria-label is "Solo"', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1].getAttribute('aria-label')).toBe('Solo')
  })

  it('muteLabel / soloLabel override defaults', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle
        muted={false} soloed={false}
        onToggleMute={noop} onToggleSolo={noop}
        muteLabel="Track Mute" soloLabel="Track Solo"
      />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Track Mute')
    expect(getAllByRole('button')[1].getAttribute('aria-label')).toBe('Track Solo')
  })

  it('M button has data-active when muted=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).toHaveAttribute('data-active')
  })

  it('M button has no data-active when muted=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).not.toHaveAttribute('data-active')
  })

  it('S button has data-active when soloed=true', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1]).toHaveAttribute('data-active')
  })

  it('S button has no data-active when soloed=false', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[1]).not.toHaveAttribute('data-active')
  })

  it('M button has data-silenced when anySoloActive=true, not muted, not soloed', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).toHaveAttribute('data-silenced')
  })

  it('M button has no data-silenced when not silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).not.toHaveAttribute('data-silenced')
  })

  it('precedence: muted=true + anySoloActive=true → data-active, NOT data-silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    const mButton = getAllByRole('button')[0]
    expect(mButton).toHaveAttribute('data-active')
    expect(mButton).not.toHaveAttribute('data-silenced')
  })

  it('M aria-label is "Mute (silenced by solo)" when silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Mute (silenced by solo)')
  })

  it('M has title="Silenced by solo" when silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0].getAttribute('title')).toBe('Silenced by solo')
  })

  it('M has no title when not silenced', () => {
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(getAllByRole('button')[0]).not.toHaveAttribute('title')
  })

  it('root data-orientation="stacked" by default', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-orientation')).toBe('stacked')
  })

  it('root data-orientation="inline" when orientation="inline"', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} orientation="inline" onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-orientation')).toBe('inline')
  })

  it('root data-size="md" by default', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('md')
  })

  it('root data-size="sm" when size="sm"', () => {
    const { container } = render(
      <MuteSoloToggle muted={false} soloed={false} size="sm" onToggleMute={noop} onToggleSolo={noop} />
    )
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('sm')
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('MuteSoloToggle interaction', () => {
  it('clicking M fires onToggleMute with the event', () => {
    const onToggleMute = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={onToggleMute} onToggleSolo={vi.fn()} />
    )
    fireEvent.click(getAllByRole('button')[0])
    expect(onToggleMute).toHaveBeenCalledOnce()
  })

  it('clicking S fires onToggleSolo with the event', () => {
    const onToggleSolo = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} onToggleMute={vi.fn()} onToggleSolo={onToggleSolo} />
    )
    fireEvent.click(getAllByRole('button')[1])
    expect(onToggleSolo).toHaveBeenCalledOnce()
  })

  it('disabled: clicking M does not fire onToggleMute', () => {
    const onToggleMute = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} disabled onToggleMute={onToggleMute} onToggleSolo={vi.fn()} />
    )
    fireEvent.click(getAllByRole('button')[0])
    expect(onToggleMute).not.toHaveBeenCalled()
  })

  it('disabled: clicking S does not fire onToggleSolo', () => {
    const onToggleSolo = vi.fn()
    const { getAllByRole } = render(
      <MuteSoloToggle muted={false} soloed={false} disabled onToggleMute={vi.fn()} onToggleSolo={onToggleSolo} />
    )
    fireEvent.click(getAllByRole('button')[1])
    expect(onToggleSolo).not.toHaveBeenCalled()
  })
})
