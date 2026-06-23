import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeComponentsContext, useThemeComponent } from './themeComponents'
import { THEME_COMPONENTS } from './themeRegistry'
import { ThemeProvider } from './ThemeProvider'
import { TrackHeader } from '../components/TrackHeader'
import type { TrackHeaderProps, Track } from '../components/TrackHeader'
import { ArmButtonCalm } from '../components/ArmButton/ArmButton.calm'
import { TrackHeaderCalm } from '../components/TrackHeader/TrackHeader.calm'

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
  it('renders the base instrument channel (with input select) under chroma', () => {
    const { queryByLabelText } = render(
      <ThemeProvider theme="chroma">
        <TrackHeader {...trackHeaderProps(makeTrack())} />
      </ThemeProvider>,
    )
    expect(queryByLabelText('Audio input')).toBeInTheDocument()
  })

  it('renders the distraction-free Calm trackhead (no input/FX chrome) under calm', () => {
    const { queryByLabelText, getByText } = render(
      <ThemeProvider theme="calm">
        <TrackHeader {...trackHeaderProps(makeTrack())} />
      </ThemeProvider>,
    )
    // Calm omits the input select + FX console by design.
    expect(queryByLabelText('Audio input')).not.toBeInTheDocument()
    // The name is still the hero.
    expect(getByText('Vocals')).toBeInTheDocument()
  })
})
