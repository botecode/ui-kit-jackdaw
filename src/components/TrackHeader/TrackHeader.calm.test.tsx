import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TrackHeaderCalm } from './TrackHeader.calm'
import type { Track, TrackHeaderProps } from './TrackHeader'

const noop = () => {}

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1', name: 'Vocals', color: 'var(--track-color-1)', type: 'audio',
    armed: false, muted: false, soloed: false,
    volumeDb: -6, pan: 0, inputId: 'in-1',
    plugins: [], chainEnabled: true, selected: false,
    ...overrides,
  }
}

function props(track: Track, over: Partial<TrackHeaderProps> = {}): TrackHeaderProps {
  return {
    track,
    onRename: noop, onArm: noop, onMute: noop, onSolo: noop,
    onVolume: noop, onPan: noop, onSelectInput: noop,
    onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
    onRemovePlugin: noop, onAddPlugin: noop, onOpenPlugin: noop, onSelect: noop,
    inputOptions: [{ id: 'in-1', label: 'Input 1' }],
    ...over,
  }
}

describe('TrackHeaderCalm', () => {
  it('renders the track name and the R/M/S controls', () => {
    const { getByText, getByLabelText } = render(<TrackHeaderCalm {...props(makeTrack())} />)
    expect(getByText('Vocals')).toBeInTheDocument()
    expect(getByLabelText('Arm for recording')).toBeInTheDocument()
    expect(getByLabelText('Mute')).toBeInTheDocument()
    expect(getByLabelText('Solo')).toBeInTheDocument()
  })

  it('surfaces the input select and FX chip in the title row', () => {
    const { getByLabelText } = render(<TrackHeaderCalm {...props(makeTrack())} />)
    expect(getByLabelText('Audio input')).toBeInTheDocument()
    expect(getByLabelText('FX chain')).toBeInTheDocument()
  })

  it('hides the pan knob when the track is unselected', () => {
    const { queryByLabelText } = render(<TrackHeaderCalm {...props(makeTrack({ selected: false }))} />)
    expect(queryByLabelText('Pan')).not.toBeInTheDocument()
  })

  it('shows the pan knob when the track is selected', () => {
    const { getByLabelText } = render(<TrackHeaderCalm {...props(makeTrack({ selected: true }))} />)
    expect(getByLabelText('Pan')).toBeInTheDocument()
  })

  it('routes pan changes through onPan', () => {
    const onPan = vi.fn()
    const { getByLabelText } = render(
      <TrackHeaderCalm {...props(makeTrack({ selected: true }), { onPan })} />,
    )
    fireEvent.keyDown(getByLabelText('Pan'), { key: 'ArrowRight' })
    expect(onPan).toHaveBeenCalled()
  })

  it('renames on double-click + Enter', () => {
    const onRename = vi.fn()
    const { getByText, getByLabelText } = render(
      <TrackHeaderCalm {...props(makeTrack(), { onRename })} />,
    )
    fireEvent.doubleClick(getByText('Vocals'))
    const input = getByLabelText('Track name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Lead Vox' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Lead Vox')
  })

  it('shows the meter when armed', () => {
    const { getByLabelText } = render(
      <TrackHeaderCalm {...props(makeTrack({ armed: true }), { meterLevel: -12 })} />,
    )
    expect(getByLabelText('Level')).toBeInTheDocument()
  })

  it('hides arm in the folder variant and exposes a disclosure', () => {
    const { queryByLabelText, getByLabelText } = render(
      <TrackHeaderCalm {...props(makeTrack({ name: 'Drums' }), { variant: 'folder', folderOpen: false })} />,
    )
    expect(queryByLabelText('Arm for recording')).not.toBeInTheDocument()
    expect(getByLabelText('Expand Drums')).toBeInTheDocument()
  })

  it('collapses to a compact row when minimized', () => {
    const { getByText, queryByLabelText } = render(
      <TrackHeaderCalm {...props(makeTrack(), { minimized: true })} />,
    )
    expect(getByText('Vocals')).toBeInTheDocument()
    // No live fader in the collapsed row.
    expect(queryByLabelText('Volume')).not.toBeInTheDocument()
  })
})
