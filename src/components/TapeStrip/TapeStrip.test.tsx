import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { TapeStrip } from './TapeStrip'
import type { TapeStripProps, TapeTrack } from './TapeStrip'
import type { SelectionRange } from '../TimeSelection'
import type { AnnotationItem } from '../AnnotationLane'

// ResizeObserver is not implemented in jsdom; Clip observes its own width.
beforeAll(() => {
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const BPM = 120

const TRACKS: TapeTrack[] = [
  {
    id: 'guitar',
    color: 'var(--chroma-blue)',
    clips: [
      { clipId: 'g1', startSeconds: 0, lengthSeconds: 4, peaks: [0.2, 0.6, 0.4] },
      { clipId: 'g2', startSeconds: 6, lengthSeconds: 2 },
    ],
  },
  {
    id: 'bass',
    color: 'var(--chroma-green)',
    clips: [{ clipId: 'b1', startSeconds: 0, lengthSeconds: 8, peaks: [0.3, 0.3] }],
  },
  {
    id: 'drums',
    color: 'var(--chroma-orange)',
    clips: [],
  },
]

const SELECTION: SelectionRange = { start: 2, end: 5 }

const MARKERS: AnnotationItem[] = [
  { id: 'm1', start: 1, text: 'Verse' },
  { id: 'm2', start: 5, text: 'Chorus' },
]

function setup(overrides: Partial<TapeStripProps> = {}) {
  const props: TapeStripProps = {
    tracks: TRACKS,
    bpm: BPM,
    numerator: 4,
    denominator: 4,
    pxPerBeat: 24,
    durationSeconds: 16,
    playheadSeconds: 0,
    getPlayheadSeconds: () => 0,
    selection: null,
    selectedTrackId: null,
    onSelectTrack: vi.fn(),
    ...overrides,
  }
  return { ...render(<TapeStrip {...props} />), props }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('TapeStrip', () => {
  it('renders one lane per track', () => {
    const { getAllByTestId } = setup()
    const lanes = getAllByTestId('tape-lane')
    expect(lanes).toHaveLength(TRACKS.length)
    expect(lanes.map(l => l.dataset.trackId)).toEqual(['guitar', 'bass', 'drums'])
  })

  it('renders each track\'s clips in the track colour', () => {
    const { getAllByTestId } = setup()
    const lanes = getAllByTestId('tape-lane')

    // Guitar lane has both clips; the Clip body is tinted with the track colour.
    const guitarClips = within(lanes[0]).getAllByTestId('tape-clip')
    expect(guitarClips.map(c => c.dataset.clipId)).toEqual(['g1', 'g2'])

    const clipRoot = within(lanes[0]).getAllByTestId('clip-root')[0]
    expect(clipRoot.style.getPropertyValue('--clip-color')).toBe('var(--chroma-blue)')
    // waveformColor="track" → the waveform also takes the track colour.
    expect(clipRoot.dataset.waveformColor).toBe('track')

    // An empty track renders a lane but no clips.
    expect(within(lanes[2]).queryAllByTestId('tape-clip')).toHaveLength(0)
  })

  it('fires onSelectTrack(trackId) when a lane is clicked', () => {
    const onSelectTrack = vi.fn()
    const { getAllByTestId } = setup({ onSelectTrack })
    fireEvent.click(getAllByTestId('tape-lane')[1])
    expect(onSelectTrack).toHaveBeenCalledTimes(1)
    expect(onSelectTrack).toHaveBeenCalledWith('bass')
  })

  it('fires onSelectTrack when a clip inside a lane is clicked (clip click falls through)', () => {
    const onSelectTrack = vi.fn()
    const { getAllByTestId } = setup({ onSelectTrack })
    const lane = getAllByTestId('tape-lane')[0]
    fireEvent.click(within(lane).getAllByTestId('tape-clip')[0])
    expect(onSelectTrack).toHaveBeenCalledWith('guitar')
  })

  it('marks the selected track with aria-current and never aria-pressed', () => {
    const { getAllByTestId } = setup({ selectedTrackId: 'bass' })
    const lanes = getAllByTestId('tape-lane')
    expect(lanes[1].getAttribute('aria-current')).toBe('true')
    expect(lanes[1].dataset.selected).toBe('true')
    // Single ARIA model: navigation buttons relabel/use aria-current, never aria-pressed.
    lanes.forEach(l => expect(l.getAttribute('aria-pressed')).toBeNull())
  })

  it('selectable lanes are real buttons', () => {
    const { container } = setup()
    within(container).getAllByTestId('tape-lane').forEach(l => expect(l.tagName).toBe('BUTTON'))
  })

  it('without onSelectTrack, lanes are display-only (no dead affordance)', () => {
    const { container } = render(
      <TapeStrip
        tracks={TRACKS}
        bpm={BPM}
        numerator={4}
        denominator={4}
        pxPerBeat={24}
        durationSeconds={16}
        playheadSeconds={0}
        getPlayheadSeconds={() => 0}
        selection={null}
      />,
    )
    within(container).getAllByTestId('tape-lane').forEach(l => {
      expect(l.tagName).toBe('DIV')
      expect(l.hasAttribute('data-static')).toBe(true)
      expect(l.getAttribute('role')).toBe('img')
    })
  })

  it('exposes NO clip move/trim/fade affordances anywhere on the tape', () => {
    const { container } = setup()
    // Clip is rendered with fadeHandles=false and no trim handles → none of those nodes exist.
    expect(container.querySelector('[data-fade-knob]')).toBeNull()
    expect(container.querySelector('[data-resize]')).toBeNull()
    // The clip layer is inert (aria-hidden) — clips are pictures, not objects; the
    // click target is the lane button (verified above). No clip is a button/draggable.
    container.querySelectorAll('[data-testid="tape-clip"]').forEach(slot => {
      expect(slot.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(slot.querySelector('button')).toBeNull()
      expect(slot.querySelector('[draggable="true"]')).toBeNull()
    })
  })

  it('renders the punch region from selection, and nothing when selection is null', () => {
    const { container, rerender, props } = setup({ selection: SELECTION })
    expect(container.querySelector('[data-testid="time-selection-band"]')).not.toBeNull()
    expect(
      container.querySelector('[data-testid="time-selection-root"]')?.hasAttribute('data-empty'),
    ).toBe(false)

    rerender(<TapeStrip {...props} selection={null} />)
    expect(container.querySelector('[data-testid="time-selection-band"]')).toBeNull()
    expect(
      container.querySelector('[data-testid="time-selection-root"]')?.hasAttribute('data-empty'),
    ).toBe(true)
  })

  it('the punch region is display-only (disabled) without selection handlers', () => {
    const { container } = setup({
      selection: SELECTION,
      onSelectionChange: undefined,
      onSelectionClear: undefined,
    })
    const root = container.querySelector('[data-testid="time-selection-root"]')
    expect(root?.hasAttribute('data-disabled')).toBe(true)
  })

  it('renders markers as calm read-only flags', () => {
    const { getAllByTestId } = setup({ markers: MARKERS })
    const flags = getAllByTestId('tape-marker')
    expect(flags).toHaveLength(2)
    expect(flags[0].getAttribute('aria-label')).toBe('Marker: Verse')
    // Read-only by default: not draggable.
    expect(flags[0].dataset.draggable).toBeUndefined()
  })

  it('makes the marker strip an Add button only when onMarkerAdd is wired', () => {
    const onMarkerAdd = vi.fn()
    const { getByTestId, rerender, props } = setup({ markers: MARKERS, onMarkerAdd })
    const strip = getByTestId('tape-marker-strip')
    expect(strip.getAttribute('role')).toBe('button')
    fireEvent.keyDown(strip, { key: 'Enter' })
    expect(onMarkerAdd).toHaveBeenCalledTimes(1)

    rerender(<TapeStrip {...props} onMarkerAdd={undefined} />)
    expect(getByTestId('tape-marker-strip').getAttribute('role')).toBeNull()
  })

  it('renders an empty state with no lanes when there are no tracks', () => {
    const { getByTestId, queryAllByTestId } = setup({ tracks: [] })
    expect(getByTestId('tape-empty')).toBeInTheDocument()
    expect(queryAllByTestId('tape-lane')).toHaveLength(0)
  })

  it('always renders the playhead (functional motion, kept under reduced motion)', () => {
    const { getByTestId } = setup({ playing: true, recording: true })
    const ph = getByTestId('playhead-root')
    expect(ph).toBeInTheDocument()
    expect(ph.dataset.playing).toBe('true')
    expect(ph.dataset.recording).toBe('true')
  })

  it('honours a custom aria-label and size', () => {
    const { getByTestId } = setup({ 'aria-label': 'Song tape', size: 'sm' })
    const root = getByTestId('tape-strip-root')
    expect(root.getAttribute('aria-label')).toBe('Song tape')
    expect(root.dataset.size).toBe('sm')
  })
})
