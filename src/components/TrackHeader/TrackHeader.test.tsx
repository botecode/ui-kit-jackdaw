// src/components/TrackHeader/TrackHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { TrackHeader } from './TrackHeader'
import type { Track } from './TrackHeader'

// ── localStorage mock ─────────────────────────────────────────────────────────

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
beforeEach(() => { localStorage.clear() })

const BASE_TRACK: Track = {
  id: 't1', name: 'Vocals', color: '#e8a87c', type: 'audio',
  armed: false, muted: false, soloed: false,
  volumeDb: -6, pan: 0, inputId: null,
  plugins: [], chainEnabled: true, selected: false,
}

const noop = () => {}

const BASE_PROPS = {
  track: BASE_TRACK,
  onRename: noop, onArm: noop, onMute: noop, onSolo: noop,
  onVolume: noop, onPan: noop, onSelectInput: noop,
  onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
  onRemovePlugin: noop, onAddPlugin: noop, onOpenPlugin: noop, onSelect: noop,
  inputOptions: [],
}

describe('TrackHeader — structure', () => {
  it('renders track variant with name, ArmButton, M/S buttons and FX chip', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /arm for recording/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('renders folder variant with disclosure button; no ArmButton, no Meter', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Drums' }}
        onToggleFolder={noop}
      />
    )
    expect(screen.getByRole('button', { name: /expand drums/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /arm for recording/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('calls onArm when ArmButton is clicked', () => {
    const onArm = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onArm={onArm} />)
    fireEvent.click(screen.getByRole('button', { name: /arm for recording/i }))
    expect(onArm).toHaveBeenCalledTimes(1)
  })

  it('calls onMute and onSolo on M/S button clicks', () => {
    const onMute = vi.fn()
    const onSolo = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onMute={onMute} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
    expect(onSolo).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect when the root group is clicked', () => {
    const onSelect = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('group', { name: 'Vocals' }))
    expect(onSelect).toHaveBeenCalled()
  })

  it('calls onToggleFolder when disclosure button is clicked in folder variant', () => {
    const onToggleFolder = vi.fn()
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Drums' }}
        onToggleFolder={onToggleFolder}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /expand drums/i }))
    expect(onToggleFolder).toHaveBeenCalledTimes(1)
  })

  it('renders InputSelect as field when mode=producer and no input set', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        mode="producer"
        track={{ ...BASE_TRACK, inputId: null }}
      />
    )
    const inputRoot = screen.getByRole('button', { name: /audio input/i }).closest('[data-variant]')
    expect(inputRoot).toHaveAttribute('data-variant', 'field')
  })

  it('renders InputSelect as chip when mode=producer and input is set', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        mode="producer"
        track={{ ...BASE_TRACK, inputId: 'in-1' }}
        inputOptions={[{ id: 'in-1', label: 'Input 1' }]}
      />
    )
    const inputRoot = screen.getByRole('button', { name: /audio input/i }).closest('[data-variant]')
    expect(inputRoot).toHaveAttribute('data-variant', 'chip')
  })

  it('renders InputSelect as chip in writer mode regardless of inputId', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        mode="writer"
        track={{ ...BASE_TRACK, inputId: null }}
      />
    )
    const inputRoot = screen.getByRole('button', { name: /audio input/i }).closest('[data-variant]')
    expect(inputRoot).toHaveAttribute('data-variant', 'chip')
  })

  it('arm button is in the control strip, not the top bar (track variant)', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    const armBtn = screen.getByRole('button', { name: /arm for recording/i })
    const topBar = document.querySelector('[data-section="topbar"]')
    const strip  = document.querySelector('[data-section="strip"]')
    expect(topBar).not.toContainElement(armBtn)
    expect(strip).toContainElement(armBtn)
  })
})

describe('TrackHeader — states', () => {
  it('has data-selected when track.selected=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, selected: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-selected')
  })

  it('has data-armed when track.armed=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, armed: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-armed')
  })

  it('has data-muted when track.muted=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, muted: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-muted')
  })

  it('has data-soloed when track.soloed=true', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, soloed: true }} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toHaveAttribute('data-soloed')
  })
})

describe('TrackHeader — name editing', () => {
  it('shows an input with current name value on double-click', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Vocals')
  })

  it('calls onRename with trimmed value on Enter and exits edit mode', () => {
    const onRename = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '  Lead Vocals  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Lead Vocals')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not call onRename on Escape; restores original name', () => {
    const onRename = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: 'Changed Name' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Vocals')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls onRename with original name when input is empty on Enter', () => {
    const onRename = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Vocals')
  })

  it('updates aria-label on root group when track.name prop changes', () => {
    const { rerender } = render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).toBeInTheDocument()
    rerender(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, name: 'Lead Vocals' }} />)
    expect(screen.getByRole('group', { name: 'Lead Vocals' })).toBeInTheDocument()
  })
})

describe('TrackHeader — folder distinctiveness', () => {
  it('root carries data-variant="folder" as the CSS styling hook', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
      />
    )
    expect(screen.getByRole('group', { name: 'Group Bus' })).toHaveAttribute('data-variant', 'folder')
  })

  it('folder variant renders a PanKnob (group pan)', () => {
    const { container } = render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
      />
    )
    // PanKnob renders an element with aria-label containing "Pan"
    expect(container.querySelector('[aria-label*="Pan"]')).toBeInTheDocument()
  })

  it('folder variant does not render an audio input selector', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
        inputOptions={[{ id: 'in-1', label: 'Input 1' }]}
      />
    )
    expect(screen.queryByRole('button', { name: /audio input/i })).not.toBeInTheDocument()
  })

  it('folder variant renders FxChip and it is not hidden at narrow widths', () => {
    render(
      <TrackHeader {...BASE_PROPS}
        variant="folder"
        track={{ ...BASE_TRACK, name: 'Group Bus' }}
        onToggleFolder={noop}
      />
    )
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })
})

describe('TrackHeader — meter visibility (ears-first)', () => {
  it('meter is hidden on a normal unselected unarmed track', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('meter appears when track is armed', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, armed: true }} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when track is selected', () => {
    render(<TrackHeader {...BASE_PROPS} track={{ ...BASE_TRACK, selected: true }} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when clipping=true even if not armed or selected', () => {
    render(<TrackHeader {...BASE_PROPS} clipping />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when showAllMeters=true', () => {
    render(<TrackHeader {...BASE_PROPS} showAllMeters />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('fader and pan are always present regardless of meter visibility', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument()
    // PanKnob does not use an ARIA slider role by default; verify via aria-label on the knob group
    const strip = document.querySelector('[data-section="strip"]')
    expect(strip).toBeInTheDocument()
    // Meter absent, strip still present
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})

describe('TrackHeader — minimized (compact row)', () => {
  it('is not minimized by default', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Vocals' })).not.toHaveAttribute('data-minimized')
  })

  it('double-click on root sets data-minimized', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Vocals' }))
    expect(screen.getByRole('group', { name: 'Vocals, minimized' })).toHaveAttribute('data-minimized')
  })

  it('double-click again removes data-minimized (toggle)', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    const root = screen.getByRole('group', { name: 'Vocals' })
    fireEvent.dblClick(root)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Vocals, minimized' }))
    expect(screen.getByRole('group', { name: 'Vocals' })).not.toHaveAttribute('data-minimized')
  })

  it('double-click on name span does NOT minimize (only renames)', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Vocals'))
    expect(screen.getByRole('group', { name: 'Vocals' })).not.toHaveAttribute('data-minimized')
    expect(screen.getByRole('textbox', { name: /track name/i })).toBeInTheDocument()
  })

  it('minimized state persists to localStorage', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Vocals' }))
    expect(localStorage.getItem('jackdaw.track.t1.minimized')).toBe('true')
  })

  it('reads initial minimized state from localStorage', () => {
    localStorage.setItem('jackdaw.track.t1.minimized', 'true')
    render(<TrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Vocals, minimized' })).toHaveAttribute('data-minimized')
  })

  it('fires onToggleMinimized(true) when collapsing', () => {
    const onToggleMinimized = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onToggleMinimized={onToggleMinimized} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Vocals' }))
    expect(onToggleMinimized).toHaveBeenCalledWith(true)
  })

  it('fires onToggleMinimized(false) when expanding', () => {
    localStorage.setItem('jackdaw.track.t1.minimized', 'true')
    const onToggleMinimized = vi.fn()
    render(<TrackHeader {...BASE_PROPS} onToggleMinimized={onToggleMinimized} />)
    fireEvent.dblClick(screen.getByRole('group', { name: 'Vocals, minimized' }))
    expect(onToggleMinimized).toHaveBeenCalledWith(false)
  })

  it('controlled: minimized=true shows compact row without double-click', () => {
    render(<TrackHeader {...BASE_PROPS} minimized />)
    expect(screen.getByRole('group', { name: 'Vocals, minimized' })).toHaveAttribute('data-minimized')
  })

  it('when minimized, normal controls (fader, arm, fx) are not in DOM', () => {
    render(<TrackHeader {...BASE_PROPS} minimized />)
    expect(screen.queryByRole('slider', { name: /volume/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /arm for recording/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /fx chain/i })).not.toBeInTheDocument()
  })

  it('when minimized, track name is visible in compact row', () => {
    render(<TrackHeader {...BASE_PROPS} minimized />)
    expect(screen.getByText('Vocals')).toBeInTheDocument()
  })

  it('when minimized, R/M/S state dots are rendered (aria-hidden)', () => {
    render(<TrackHeader {...BASE_PROPS} minimized />)
    const root = screen.getByRole('group', { name: 'Vocals, minimized' })
    // State dots are aria-hidden; query by text content
    const rDot = root.querySelector('[data-dot="arm"]')
    const mDot = root.querySelector('[data-dot="mute"]')
    const sDot = root.querySelector('[data-dot="solo"]')
    expect(rDot).toBeInTheDocument()
    expect(mDot).toBeInTheDocument()
    expect(sDot).toBeInTheDocument()
  })

  it('when minimized with variant=folder, no R dot (no arm)', () => {
    render(<TrackHeader {...BASE_PROPS} minimized variant="folder" onToggleFolder={noop} />)
    const root = document.querySelector('[data-minimized]')!
    expect(root.querySelector('[data-dot="arm"]')).not.toBeInTheDocument()
    expect(root.querySelector('[data-dot="mute"]')).toBeInTheDocument()
    expect(root.querySelector('[data-dot="solo"]')).toBeInTheDocument()
  })

  it('when minimized and clipping, meter is shown', () => {
    render(<TrackHeader {...BASE_PROPS} minimized clipping meterLevel={2} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('when minimized and NOT clipping, meter is NOT shown', () => {
    render(<TrackHeader {...BASE_PROPS} minimized meterLevel={-12} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})

// ── uniform fader cap ─────────────────────────────────────────────────────────
// Regression guard: the per-track color identifies the track on the card border
// and the pan-knob accent, but it must NOT bleed into the fader cap — caps stay
// uniform (var(--accent)) on every track. The composite must not forward `color`
// to <Fader>. (KIT-LEAD §5: a silent fallback can reintroduce the exact bug.)

describe('TrackHeader — uniform fader cap (track color stays off the fader)', () => {
  it('fader cap keeps the kit default accent; the track color is not forwarded to <Fader>', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    const cap = screen.getByTestId('fader-cap')
    expect(cap.style.getPropertyValue('--fader-accent')).toBe('var(--accent)')
    expect(cap.style.getPropertyValue('--fader-accent')).not.toBe(BASE_TRACK.color)
  })

  it('the track color still identifies the track via the pan-knob accent', () => {
    render(<TrackHeader {...BASE_PROPS} />)
    const knobRoot = screen.getByRole('slider', { name: 'Pan' }).parentElement as HTMLElement
    expect(knobRoot.style.getPropertyValue('--pan-accent')).toBe(BASE_TRACK.color)
  })
})
