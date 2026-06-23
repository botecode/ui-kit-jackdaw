import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeComponentsContext, useThemeComponent } from './themeComponents'
import { THEME_COMPONENTS } from './themeRegistry'
import { ThemeProvider } from './ThemeProvider'
import { TrackHeader } from '../components/TrackHeader'
import type { TrackHeaderProps, Track } from '../components/TrackHeader'
import { TransportBar } from '../components/TransportBar'
import type { TransportBarProps } from '../components/TransportBar'
import { ArmButtonCalm } from '../components/ArmButton/ArmButton.calm'
import { TrackHeaderCalm } from '../components/TrackHeader/TrackHeader.calm'
import { TransportBarCalm } from '../components/TransportBar/TransportBar.calm'

// ── useThemeComponent (the resolver hook) ─────────────────────────────────────

function Base() { return <span>base</span> }
function Variant() { return <span>variant</span> }

function Consumer() {
  const Impl = useThemeComponent('ArmButton', Base as never)
  return <Impl armed={false} onToggle={() => {}} />
}

describe('useThemeComponent', () => {
  it('returns the base when no theme override is registered', () => {
    const { getByText } = render(<Consumer />)
    expect(getByText('base')).toBeInTheDocument()
  })

  it('returns the theme override when one is provided', () => {
    const { getByText } = render(
      <ThemeComponentsContext.Provider value={{ ArmButton: Variant as never }}>
        <Consumer />
      </ThemeComponentsContext.Provider>,
    )
    expect(getByText('variant')).toBeInTheDocument()
  })
})

// ── Registry ──────────────────────────────────────────────────────────────────

describe('THEME_COMPONENTS registry', () => {
  it('registers the Calm trackhead + primitives as aware-theme overrides', () => {
    expect(THEME_COMPONENTS.calm?.TrackHeader).toBe(TrackHeaderCalm)
    expect(THEME_COMPONENTS.calm?.ArmButton).toBe(ArmButtonCalm)
  })

  it('registers the Calm transport bar', () => {
    expect(THEME_COMPONENTS.calm?.TransportBar).toBe(TransportBarCalm)
  })

  it('leaves colour-only themes (chroma) without component overrides', () => {
    expect(THEME_COMPONENTS.chroma).toBeUndefined()
  })
})

// ── Integration: ThemeProvider swaps the trackhead per theme ──────────────────

const INPUT_OPTIONS = [{ id: 'in-1', label: 'Input 1' }]

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1', name: 'Vocals', color: 'var(--track-color-1)', type: 'audio',
    armed: false, muted: false, soloed: false,
    volumeDb: -6, pan: 0, inputId: 'in-1',
    plugins: [], chainEnabled: true, selected: false,
    ...overrides,
  }
}

const noop = () => {}
function trackHeaderProps(track: Track): TrackHeaderProps {
  return {
    track,
    onRename: noop, onArm: noop, onMute: noop, onSolo: noop,
    onVolume: noop, onPan: noop, onSelectInput: noop,
    onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
    onRemovePlugin: noop, onAddPlugin: noop, onOpenPlugin: noop, onSelect: noop,
    inputOptions: INPUT_OPTIONS,
  }
}

describe('aware themes — TrackHeader swap', () => {
  it('keeps the input select under the base (chroma) trackhead', () => {
    const { queryByLabelText } = render(
      <ThemeProvider theme="chroma">
        <TrackHeader {...trackHeaderProps(makeTrack())} />
      </ThemeProvider>,
    )
    expect(queryByLabelText('Audio input')).toBeInTheDocument()
  })

  it('keeps the input select under the Calm trackhead', () => {
    const { queryByLabelText } = render(
      <ThemeProvider theme="calm">
        <TrackHeader {...trackHeaderProps(makeTrack())} />
      </ThemeProvider>,
    )
    expect(queryByLabelText('Audio input')).toBeInTheDocument()
  })

  it('base shows pan even when the track is unselected', () => {
    const { queryByLabelText } = render(
      <ThemeProvider theme="chroma">
        <TrackHeader {...trackHeaderProps(makeTrack({ selected: false }))} />
      </ThemeProvider>,
    )
    expect(queryByLabelText('Pan')).toBeInTheDocument()
  })

  it('Calm hides pan until the track is selected', () => {
    const { queryByLabelText } = render(
      <ThemeProvider theme="calm">
        <TrackHeader {...trackHeaderProps(makeTrack({ selected: false }))} />
      </ThemeProvider>,
    )
    expect(queryByLabelText('Pan')).not.toBeInTheDocument()
  })

  it('Calm shows pan once the track is selected', () => {
    const { queryByLabelText } = render(
      <ThemeProvider theme="calm">
        <TrackHeader {...trackHeaderProps(makeTrack({ selected: true }))} />
      </ThemeProvider>,
    )
    expect(queryByLabelText('Pan')).toBeInTheDocument()
  })
})

// ── Integration: ThemeProvider swaps the TransportBar per theme ───────────────

function transportProps(): TransportBarProps {
  return {
    playing: false, recording: false, seconds: 0,
    bpm: 120, numerator: 4, denominator: 4,
    loopEnabled: false, recordState: 'idle', recordMode: 'normal',
    selectionStart: 0, selectionEnd: 0, gridDivision: '1/16', rate: 1,
    onPlay: noop, onStop: noop, onGoToStart: noop, onGoToEnd: noop,
    onToggleRecord: noop, onSelectRecordMode: noop, onToggleLoop: noop,
    onSetTempo: noop, onSetTimeSignature: noop,
  }
}

describe('aware themes — TransportBar swap', () => {
  it('base shows the dense SEL/GRID/RATE readouts under chroma', () => {
    const { getByText } = render(
      <ThemeProvider theme="chroma">
        <TransportBar {...transportProps()} />
      </ThemeProvider>,
    )
    expect(getByText('SEL')).toBeInTheDocument()
  })

  it('Calm drops the dense secondary readouts (distraction-free)', () => {
    const { queryByText, getByRole } = render(
      <ThemeProvider theme="calm">
        <TransportBar {...transportProps()} />
      </ThemeProvider>,
    )
    expect(getByRole('toolbar', { name: 'Transport' })).toBeInTheDocument()
    expect(queryByText('SEL')).not.toBeInTheDocument()
  })
})
