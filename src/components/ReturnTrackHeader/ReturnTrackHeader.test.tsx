// src/components/ReturnTrackHeader/ReturnTrackHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { ReturnTrackHeader } from './ReturnTrackHeader'
import type { ReturnTrack } from './ReturnTrackHeader'

// jsdom's localStorage stub is incomplete — replace with a functional in-memory mock.
const makeLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = String(value) },
    removeItem: (key: string): void => { delete store[key] },
    clear: (): void => { store = {} },
    get length(): number { return Object.keys(store).length },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  }
}
const localStorageMock = makeLocalStorageMock()
beforeAll(() => { vi.stubGlobal('localStorage', localStorageMock) })

const BASE_RETURN: ReturnTrack = {
  id: 'r1', name: 'Reverb', color: '#7ec8a4',
  kind: 'return',
  muted: false, soloed: false,
  volumeDb: -6, pan: 0,
  plugins: [], chainEnabled: true, selected: false,
}

const noop   = () => {}
const noopId = (_: string) => {}

const BASE_PROPS = {
  track: BASE_RETURN,
  onRename: noopId, onMute: noop, onSolo: noop,
  onVolume: noop, onPan: noop,
  onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
  onRemovePlugin: noopId, onAddPlugin: noop, onOpenPlugin: noopId, onSelect: noop,
}

beforeEach(() => { localStorage.clear() })

// ── Structure ─────────────────────────────────────────────────────────────────

describe('ReturnTrackHeader — structure', () => {
  it('renders as role=group with track name as aria-label', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toBeInTheDocument()
  })

  it('carries data-variant="return"', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toHaveAttribute('data-variant', 'return')
  })

  it('renders FxChip button', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('renders Mute and Solo buttons', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
  })

  it('renders return volume fader', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /return volume/i })).toBeInTheDocument()
  })

  it('does NOT render ArmButton', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /arm for recording/i })).not.toBeInTheDocument()
  })

  it('does NOT render audio input selector', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /audio input/i })).not.toBeInTheDocument()
  })

  it('renders PanKnob element with aria-label containing "Pan"', () => {
    const { container } = render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(container.querySelector('[aria-label*="Pan"]')).toBeInTheDocument()
  })

  it('calls onSelect when root group is clicked', () => {
    const onSelect = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('group', { name: 'Reverb' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('calls onMute when Mute button is clicked', () => {
    const onMute = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onMute={onMute} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
  })

  it('calls onSolo when Solo button is clicked', () => {
    const onSolo = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onSolo).toHaveBeenCalledTimes(1)
  })
})

// ── data-* states ─────────────────────────────────────────────────────────────

describe('ReturnTrackHeader — data-* states', () => {
  it('has data-selected when track.selected=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} track={{ ...BASE_RETURN, selected: true }} />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toHaveAttribute('data-selected')
  })

  it('has data-muted when track.muted=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} track={{ ...BASE_RETURN, muted: true }} />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toHaveAttribute('data-muted')
  })

  it('has data-soloed when track.soloed=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} track={{ ...BASE_RETURN, soloed: true }} />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toHaveAttribute('data-soloed')
  })

  it('has data-disabled when disabled=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} disabled />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toHaveAttribute('data-disabled')
  })

  it('has data-clipping when clipping=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} clipping />)
    expect(screen.getByRole('group', { name: 'Reverb' })).toHaveAttribute('data-clipping')
  })
})

// ── Fed-by sources ────────────────────────────────────────────────────────────

describe('ReturnTrackHeader — fed-by sources', () => {
  it('does not render fed-by row when feedSources is absent', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByLabelText(/fed by/i)).not.toBeInTheDocument()
  })

  it('does not render fed-by row when feedSources is empty', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} track={{ ...BASE_RETURN, feedSources: [] }} />)
    expect(screen.queryByLabelText(/fed by/i)).not.toBeInTheDocument()
  })

  it('renders fed-by row when feedSources has entries', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} track={{ ...BASE_RETURN, feedSources: ['Vocals', 'Guitar'] }} />)
    expect(screen.getByLabelText(/fed by: vocals, guitar/i)).toBeInTheDocument()
  })

  it('lists all source names in fed-by aria-label', () => {
    render(
      <ReturnTrackHeader
        {...BASE_PROPS}
        track={{ ...BASE_RETURN, feedSources: ['Vocals', 'Guitar', 'Drums'] }}
      />
    )
    expect(screen.getByLabelText(/fed by: vocals, guitar, drums/i)).toBeInTheDocument()
  })

  it('fed-by row is not shown when minimized', () => {
    render(
      <ReturnTrackHeader
        {...BASE_PROPS}
        track={{ ...BASE_RETURN, feedSources: ['Vocals'] }}
        minimized
      />
    )
    expect(screen.queryByLabelText(/fed by/i)).not.toBeInTheDocument()
  })
})

// ── Name editing ──────────────────────────────────────────────────────────────

describe('ReturnTrackHeader — name editing', () => {
  it('shows an input with current name on double-click', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Reverb'))
    expect(screen.getByRole('textbox', { name: /track name/i })).toHaveValue('Reverb')
  })

  it('calls onRename with trimmed value on Enter and exits edit mode', () => {
    const onRename = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Reverb'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '  Hall Reverb  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Hall Reverb')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not call onRename on Escape; restores original name', () => {
    const onRename = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Reverb'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Reverb')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('falls back to original name when input is empty on Enter', () => {
    const onRename = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Reverb'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Reverb')
  })
})

// ── Meter visibility (ears-first) ─────────────────────────────────────────────

describe('ReturnTrackHeader — meter visibility (ears-first)', () => {
  it('meter is hidden on a normal unselected return', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('meter appears when track.selected=true', () => {
    render(
      <ReturnTrackHeader
        {...BASE_PROPS}
        track={{ ...BASE_RETURN, selected: true }}
        meterLevel={-12}
      />
    )
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when clipping=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} clipping meterLevel={2} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when showAllMeters=true', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} showAllMeters meterLevel={-18} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('fader is always present regardless of meter visibility', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /return volume/i })).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})

// ── Minimized (compact row) ───────────────────────────────────────────────────

describe('ReturnTrackHeader — minimized (compact row)', () => {
  it('is not minimized by default', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Reverb' })).not.toHaveAttribute('data-minimized')
  })

  it('double-click on root sets data-minimized', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Reverb' }))
    expect(screen.getByRole('group', { name: 'Reverb, minimized' })).toHaveAttribute('data-minimized')
  })

  it('double-click again removes data-minimized (toggle)', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Reverb' }))
    fireEvent.dblClick(screen.getByRole('group', { name: 'Reverb, minimized' }))
    expect(screen.getByRole('group', { name: 'Reverb' })).not.toHaveAttribute('data-minimized')
  })

  it('double-click on name span does NOT minimize', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Reverb'))
    expect(screen.getByRole('group', { name: 'Reverb' })).not.toHaveAttribute('data-minimized')
    expect(screen.getByRole('textbox', { name: /track name/i })).toBeInTheDocument()
  })

  it('minimized state persists to localStorage under return-specific key', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Reverb' }))
    expect(localStorage.getItem('jackdaw.return.r1.minimized')).toBe('true')
  })

  it('reads initial minimized state from localStorage', () => {
    localStorage.setItem('jackdaw.return.r1.minimized', 'true')
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Reverb, minimized' })).toHaveAttribute('data-minimized')
  })

  it('fires onToggleMinimized(true) when collapsing', () => {
    const onToggleMinimized = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onToggleMinimized={onToggleMinimized} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Reverb' }))
    expect(onToggleMinimized).toHaveBeenCalledWith(true)
  })

  it('fires onToggleMinimized(false) when expanding', () => {
    localStorage.setItem('jackdaw.return.r1.minimized', 'true')
    const onToggleMinimized = vi.fn()
    render(<ReturnTrackHeader {...BASE_PROPS} onToggleMinimized={onToggleMinimized} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Reverb, minimized' }))
    expect(onToggleMinimized).toHaveBeenCalledWith(false)
  })

  it('controlled: minimized=true shows compact row', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} minimized />)
    expect(screen.getByRole('group', { name: 'Reverb, minimized' })).toHaveAttribute('data-minimized')
  })

  it('when minimized, normal controls (fader, mute, fx) are not in DOM', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} minimized />)
    expect(screen.queryByRole('slider', { name: /return volume/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mute/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /fx chain/i })).not.toBeInTheDocument()
  })

  it('when minimized, return name is visible in compact row', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} minimized />)
    expect(screen.getByText('Reverb')).toBeInTheDocument()
  })

  it('when minimized, M/S dots present but no R (arm) dot', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} minimized />)
    const root = document.querySelector('[data-minimized]')!
    expect(root.querySelector('[data-dot="mute"]')).toBeInTheDocument()
    expect(root.querySelector('[data-dot="solo"]')).toBeInTheDocument()
    expect(root.querySelector('[data-dot="arm"]')).not.toBeInTheDocument()
  })

  it('when minimized and clipping, meter is shown', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} minimized clipping meterLevel={2} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('when minimized and NOT clipping, meter is NOT shown', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} minimized meterLevel={-12} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})

// ── uniform fader cap ─────────────────────────────────────────────────────────
// Regression guard: the return color identifies the track on the keyline and the
// pan-knob accent, but it must NOT bleed into the return fader cap — caps stay
// uniform (var(--accent)). The composite must not forward `color` to <Fader>.

describe('ReturnTrackHeader — uniform fader cap (return color stays off the fader)', () => {
  it('return fader cap keeps the kit default accent; the color is not forwarded to <Fader>', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    const cap = screen.getByTestId('fader-cap')
    expect(cap.style.getPropertyValue('--fader-accent')).toBe('var(--accent)')
    expect(cap.style.getPropertyValue('--fader-accent')).not.toBe(BASE_RETURN.color)
  })

  it('the return color still identifies the track via the pan-knob accent', () => {
    render(<ReturnTrackHeader {...BASE_PROPS} />)
    const knobRoot = screen.getByRole('slider', { name: 'Pan' }).parentElement as HTMLElement
    expect(knobRoot.style.getPropertyValue('--pan-accent')).toBe(BASE_RETURN.color)
  })
})
