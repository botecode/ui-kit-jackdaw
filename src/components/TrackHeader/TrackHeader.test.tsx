// src/components/TrackHeader/TrackHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TrackHeader } from './TrackHeader'
import type { Track } from './TrackHeader'

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
  onRemovePlugin: noop, onAddPlugin: noop, onSelect: noop,
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
})
