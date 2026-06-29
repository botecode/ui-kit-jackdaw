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
  it('renders a fixed lane grid (default 10) with tracks filling top-down', () => {
    const { getAllByTestId } = setup()
    const lanes = getAllByTestId('tape-lane')
    expect(lanes).toHaveLength(10)
    // First N lanes are the tracks, in order; the rest are empty.
    expect(lanes.filter(l => l.dataset.trackId).map(l => l.dataset.trackId)).toEqual([
      'guitar',
      'bass',
      'drums',
    ])
    expect(lanes.filter(l => l.hasAttribute('data-empty-lane'))).toHaveLength(7)
  })

  it('respects a custom laneCount', () => {
    const { getAllByTestId } = setup({ laneCount: 6 })
    expect(getAllByTestId('tape-lane')).toHaveLength(6)
  })

  it('extends the grid when there are more tracks than laneCount', () => {
    const many: TapeTrack[] = Array.from({ length: 12 }, (_, i) => ({
      id: `t${i}`,
      color: 'var(--chroma-blue)',
      clips: [],
    }))
    const { getAllByTestId } = setup({ tracks: many })
    expect(getAllByTestId('tape-lane')).toHaveLength(12)
  })

  it('keeps the lane count constant as the track count changes (constant height)', () => {
    const { getAllByTestId, rerender, props } = setup({ tracks: [] })
    expect(getAllByTestId('tape-lane')).toHaveLength(10)
    rerender(<TapeStrip {...props} tracks={[TRACKS[0]]} />)
    expect(getAllByTestId('tape-lane')).toHaveLength(10)
    rerender(<TapeStrip {...props} tracks={TRACKS} />)
    expect(getAllByTestId('tape-lane')).toHaveLength(10)
  })

  it('lights a colored pill per track and a neutral pill for each empty lane', () => {
    const { getAllByTestId } = setup() // 3 tracks → 10 lanes
    const pills = getAllByTestId('tape-lane-pill')
    expect(pills).toHaveLength(10)
    expect(pills.filter(p => !p.hasAttribute('data-neutral'))).toHaveLength(3)
    expect(pills.filter(p => p.hasAttribute('data-neutral'))).toHaveLength(7)
    // The colored pills sit on the track-backed lanes, which carry --lane-color.
    const tracked = getAllByTestId('tape-lane').filter(l => l.dataset.trackId)
    expect(tracked[0].style.getPropertyValue('--lane-color')).toBe('var(--chroma-blue)')
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

  it('track-backed lanes are real buttons; empty lanes are inert (non-interactive)', () => {
    const { container } = setup()
    container.querySelectorAll('[data-track-id]').forEach(l => expect(l.tagName).toBe('BUTTON'))
    container.querySelectorAll('[data-empty-lane]').forEach(l => {
      expect(l.tagName).toBe('DIV')
      expect(l.querySelector('button')).toBeNull()
      expect(l.getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('without onSelectTrack, track lanes are display-only (no dead affordance)', () => {
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
    container.querySelectorAll('[data-track-id]').forEach(l => {
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

  it('renders an all-neutral fixed grid when there are no tracks (no collapse)', () => {
    const { getAllByTestId, queryByTestId } = setup({ tracks: [] })
    const lanes = getAllByTestId('tape-lane')
    expect(lanes).toHaveLength(10)
    expect(lanes.every(l => l.hasAttribute('data-empty-lane'))).toBe(true)
    expect(getAllByTestId('tape-lane-pill').every(p => p.hasAttribute('data-neutral'))).toBe(true)
    // The old "No tracks" empty state is gone — 0 tracks is just a neutral grid.
    expect(queryByTestId('tape-empty')).toBeNull()
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
