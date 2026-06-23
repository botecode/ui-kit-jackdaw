// src/components/Arrangement/Arrangement.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Arrangement } from './Arrangement'
import type { ArrangementProps, ArrangementTrack } from './Arrangement'
import type { SelectionRange } from '../TimeSelection'

// ─── Environment stubs ────────────────────────────────────────────────────────

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

beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  // ResizeObserver — used inside Clip (rendered by TrackLane inside Arrangement)
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  }
  // setPointerCapture — not in jsdom; used by TrackLane, EditCursor, TimeSelection
  HTMLDivElement.prototype.setPointerCapture   = vi.fn()
  HTMLDivElement.prototype.releasePointerCapture = vi.fn()
  HTMLElement.prototype.setPointerCapture       = vi.fn()
  HTMLElement.prototype.releasePointerCapture   = vi.fn()
})

beforeEach(() => { localStorage.clear() })

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PEAKS = [0.3, 0.7, 0.5, 0.9]
const BPM   = 120
const PPB   = 48

const noop = () => {}

function makeTrack(id: string, name: string, color: string): ArrangementTrack {
  return {
    id,
    name,
    color,
    type:         'audio',
    armed:        false,
    muted:        false,
    soloed:       false,
    volumeDb:     -6,
    pan:          0,
    inputId:      null,
    plugins:      [],
    chainEnabled: true,
    clips: [
      { clipId: `${id}-c1`, start: 0, length: 2, peaks: PEAKS, color },
    ],
  }
}

const TRACK_A = makeTrack('t1', 'Guitar', 'var(--chroma-blue)')
const TRACK_B = makeTrack('t2', 'Bass',   'var(--chroma-green)')
const TRACK_C = makeTrack('t3', 'Keys',   'var(--chroma-purple)')

const SELECTION: SelectionRange = { start: 1, end: 3 }

const BASE: ArrangementProps = {
  tracks:             [],
  bpm:                BPM,
  numerator:          4,
  denominator:        4,
  pxPerBeat:          PPB,
  division:           '1/4',
  durationSeconds:    60,
  playheadSeconds:    0,
  getPlayheadSeconds: () => 0,
  playing:            false,
  cursorSeconds:      0,
  selection:          null,
  focusedTrackId:     null,
  inputOptions:       [],
  onSelectTrack:      noop,
  onSeek:             noop,
  onSelectRange:      noop,
  onClearSelection:   noop,
  onRenameTrack:      noop,
  onArmTrack:         noop,
  onMuteTrack:        noop,
  onSoloTrack:        noop,
  onVolumeTrack:      noop,
  onPanTrack:         noop,
  onSelectInput:      noop,
  onToggleChain:      noop,
  onTogglePlugin:     noop,
  onReorderPlugin:    noop,
  onRemovePlugin:     noop,
  onAddPlugin:        noop,
  onOpenPlugin:       noop,
}

function arrangement(overrides: Partial<ArrangementProps> = {}) {
  return render(<Arrangement {...BASE} {...overrides} />)
}

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('Arrangement — empty state', () => {
  it('renders root with data-empty when tracks is empty', () => {
    const { getByTestId } = arrangement()
    expect(getByTestId('arrangement-root')).toHaveAttribute('data-empty')
  })

  it('shows empty message text', () => {
    arrangement()
    expect(screen.getByText('No tracks')).toBeInTheDocument()
  })

  it('has region role with accessible label', () => {
    arrangement()
    expect(screen.getByRole('region', { name: 'Arrangement' })).toBeInTheDocument()
  })
})

// ─── Track rendering ──────────────────────────────────────────────────────────

describe('Arrangement — track rendering', () => {
  it('renders one TrackLane per track', () => {
    const { getAllByTestId } = arrangement({ tracks: [TRACK_A, TRACK_B, TRACK_C] })
    expect(getAllByTestId('track-lane')).toHaveLength(3)
  })

  it('renders one TrackHeader group per track (by track name)', () => {
    arrangement({ tracks: [TRACK_A, TRACK_B] })
    expect(screen.getByRole('group', { name: 'Guitar' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Bass' })).toBeInTheDocument()
  })

  it('root does NOT have data-empty when tracks are present', () => {
    const { getByTestId } = arrangement({ tracks: [TRACK_A] })
    expect(getByTestId('arrangement-root')).not.toHaveAttribute('data-empty')
  })
})

// ─── Track focus ──────────────────────────────────────────────────────────────

describe('Arrangement — focus', () => {
  it('focused TrackLane has data-selected', () => {
    const { getAllByTestId } = arrangement({
      tracks:         [TRACK_A, TRACK_B],
      focusedTrackId: 't1',
    })
    const lanes = getAllByTestId('track-lane')
    expect(lanes[0]).toHaveAttribute('data-selected')
    expect(lanes[1]).not.toHaveAttribute('data-selected')
  })

  it('no tracks are selected when focusedTrackId is null', () => {
    const { getAllByTestId } = arrangement({
      tracks:         [TRACK_A, TRACK_B],
      focusedTrackId: null,
    })
    getAllByTestId('track-lane').forEach(lane =>
      expect(lane).not.toHaveAttribute('data-selected')
    )
  })
})

// ─── onSelectTrack callback ───────────────────────────────────────────────────

describe('Arrangement — onSelectTrack', () => {
  it('fires onSelectTrack with the track id when its header is clicked', () => {
    const onSelectTrack = vi.fn()
    arrangement({ tracks: [TRACK_A, TRACK_B], onSelectTrack })
    // TrackHeader root has onClick={onSelect} wired to onSelectTrack
    fireEvent.click(screen.getByRole('group', { name: 'Guitar' }))
    expect(onSelectTrack).toHaveBeenCalledWith('t1')
  })
})

// ─── Overlays ─────────────────────────────────────────────────────────────────

describe('Arrangement — shared overlays', () => {
  const withTracks = { tracks: [TRACK_A] }

  it('renders Playhead', () => {
    const { getByTestId } = arrangement(withTracks)
    expect(getByTestId('playhead-root')).toBeInTheDocument()
  })

  it('Playhead has data-playing when playing=true', () => {
    const { getByTestId } = arrangement({ ...withTracks, playing: true })
    expect(getByTestId('playhead-root')).toHaveAttribute('data-playing')
  })

  it('renders EditCursor', () => {
    const { getByTestId } = arrangement(withTracks)
    expect(getByTestId('edit-cursor-root')).toBeInTheDocument()
  })

  it('renders TimeSelection root (empty range → data-empty)', () => {
    const { getByTestId } = arrangement({ ...withTracks, selection: null })
    expect(getByTestId('time-selection-root')).toBeInTheDocument()
  })

  it('renders TimeSelection with selection range', () => {
    const { getByTestId } = arrangement({ ...withTracks, selection: SELECTION })
    const root = getByTestId('time-selection-root')
    // When a range is provided, data-empty is absent
    expect(root).not.toHaveAttribute('data-empty')
  })
})

// ─── Seek from lane click ─────────────────────────────────────────────────────

describe('Arrangement — seek + select from lane', () => {
  it('fires onSeek when clicking empty lane space', () => {
    const onSeek = vi.fn()
    // Clip spans 0-2s, so there is empty space beyond x=96 (2s × 48px/beat × 2bpm beats/s)
    const { getAllByTestId } = arrangement({
      tracks: [{ ...TRACK_A, clips: [] }],
      onSeek,
    })
    const [lane] = getAllByTestId('track-lane')
    // Simulate click on the lane (no clip at this point)
    Object.defineProperty(lane, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0 }) })
    fireEvent.pointerDown(lane, { clientX: 0, clientY: 0 })
    expect(onSeek).toHaveBeenCalled()
  })

  it('fires onSelectTrack when clicking empty lane space', () => {
    const onSelectTrack = vi.fn()
    const { getAllByTestId } = arrangement({
      tracks: [{ ...TRACK_A, clips: [] }],
      onSelectTrack,
    })
    const [lane] = getAllByTestId('track-lane')
    Object.defineProperty(lane, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0 }) })
    fireEvent.pointerDown(lane, { clientX: 0, clientY: 0 })
    expect(onSelectTrack).toHaveBeenCalledWith('t1')
  })
})

// ─── Cross-lane clip multi-select ─────────────────────────────────────────────

describe('Arrangement — clip multi-select', () => {
  function clipSlot(container: HTMLElement, clipId: string): HTMLElement {
    return container.querySelector(`[data-clip-id="${clipId}"]`) as HTMLElement
  }

  it('plain click on a clip selects just that clip (replaces selection)', () => {
    const onSelectClips = vi.fn()
    const { container } = arrangement({ tracks: [TRACK_A, TRACK_B], onSelectClips })
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 5 })
    expect(onSelectClips).toHaveBeenLastCalledWith(['t1-c1'])
  })

  it('plain click on a clip also focuses its track', () => {
    const onSelectTrack = vi.fn()
    const { container } = arrangement({ tracks: [TRACK_A, TRACK_B], onSelectTrack })
    fireEvent.pointerDown(clipSlot(container, 't2-c1'), { clientX: 5 })
    expect(onSelectTrack).toHaveBeenCalledWith('t2')
  })

  it('shift+click extends the selection across lanes', () => {
    const onSelectClips = vi.fn()
    const { container } = arrangement({ tracks: [TRACK_A, TRACK_B], onSelectClips })
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 5 })
    fireEvent.pointerDown(clipSlot(container, 't2-c1'), { clientX: 5, shiftKey: true })
    expect(onSelectClips).toHaveBeenLastCalledWith(['t1-c1', 't2-c1'])
  })

  it('shift+click does NOT change track focus', () => {
    const onSelectTrack = vi.fn()
    const { container } = arrangement({ tracks: [TRACK_A, TRACK_B], onSelectTrack })
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 5 })
    onSelectTrack.mockClear()
    fireEvent.pointerDown(clipSlot(container, 't2-c1'), { clientX: 5, shiftKey: true })
    expect(onSelectTrack).not.toHaveBeenCalled()
  })

  it('shift+click on an already-selected clip toggles it off', () => {
    const onSelectClips = vi.fn()
    const { container } = arrangement({ tracks: [TRACK_A, TRACK_B], onSelectClips })
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 5 })
    fireEvent.pointerDown(clipSlot(container, 't2-c1'), { clientX: 5, shiftKey: true })
    fireEvent.pointerDown(clipSlot(container, 't2-c1'), { clientX: 5, shiftKey: true })
    expect(onSelectClips).toHaveBeenLastCalledWith(['t1-c1'])
  })

  it('selection renders the selected clip with the Clip selected visual', () => {
    const TRACK_SEL: ArrangementTrack = {
      ...makeTrack('t1', 'Guitar', 'var(--chroma-blue)'),
      clips: [{ clipId: 't1-c1', start: 0, length: 2, peaks: PEAKS, color: 'var(--chroma-blue)', selected: true }],
    }
    const { container } = arrangement({ tracks: [TRACK_SEL] })
    // Initial per-clip `selected` flags seed the cross-lane set.
    const root = container.querySelector('[data-clip-id="t1-c1"] [data-testid="clip-root"]') as HTMLElement
    expect(root.className).toContain('selected')
  })
})

// ─── Cross-track clip drag ──────────────────────────────────────────────────────
// Only the composite sees every lane, so it owns the drop-target hit-test: during a
// move drag it resolves the pointer to a sibling lane (onClipDragOver), paints that
// lane's drop highlight, and injects the resolved lane into intent.trackId on drop.
// Folder/bus lanes hold no clips → invalid target (intent.trackId stays unset).

describe('Arrangement — cross-track clip drag', () => {
  function clipSlot(container: HTMLElement, clipId: string): HTMLElement {
    return container.querySelector(`[data-clip-id="${clipId}"]`) as HTMLElement
  }

  // Stack lanes vertically with deterministic rects (jsdom returns zero-rects):
  // lane index i spans clientY [i*100, i*100+100).
  function stubLaneRects(lanes: HTMLElement[]) {
    lanes.forEach((lane, i) => {
      Object.defineProperty(lane, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ left: 0, right: 800, top: i * 100, bottom: i * 100 + 100, width: 800, height: 100 }),
      })
    })
  }

  it('fires onClipDragOver resolving the sibling lane under the pointer', () => {
    const onClipDragOver = vi.fn()
    const { container, getAllByTestId } = arrangement({ tracks: [TRACK_A, TRACK_B], onClipDragOver })
    stubLaneRects(getAllByTestId('track-lane'))
    const originLane = getAllByTestId('track-lane')[0]
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 10, clientY: 40 })
    fireEvent.pointerMove(originLane, { clientX: 10, clientY: 140 }) // into lane 2 (t2)
    expect(onClipDragOver).toHaveBeenLastCalledWith(
      expect.objectContaining({ clipId: 't1-c1', targetTrackId: 't2', invalid: false })
    )
  })

  it('marks the sibling lane as a valid drop target during the drag', () => {
    const { container, getAllByTestId } = arrangement({ tracks: [TRACK_A, TRACK_B] })
    const lanes = getAllByTestId('track-lane')
    stubLaneRects(lanes)
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 10, clientY: 40 })
    fireEvent.pointerMove(lanes[0], { clientX: 10, clientY: 140 })
    expect(lanes[1]).toHaveAttribute('data-drop-target', 'valid')
    expect(lanes[0]).not.toHaveAttribute('data-drop-target')
  })

  it('injects the resolved sibling into intent.trackId on drop', () => {
    const onClipMove = vi.fn()
    const { container, getAllByTestId } = arrangement({ tracks: [TRACK_A, TRACK_B], onClipMove })
    const lanes = getAllByTestId('track-lane')
    stubLaneRects(lanes)
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 10, clientY: 40 })
    fireEvent.pointerMove(lanes[0], { clientX: 10, clientY: 140 })
    fireEvent.pointerUp(lanes[0],   { clientX: 10, clientY: 140 })
    expect(onClipMove).toHaveBeenCalledTimes(1)
    const [originTrackId, intent] = onClipMove.mock.calls[0]
    expect(originTrackId).toBe('t1')          // first arg = the lane the clip lives in
    expect(intent.clipId).toBe('t1-c1')
    expect(intent.trackId).toBe('t2')         // resolved destination lane
  })

  it('leaves intent.trackId undefined for a same-lane move', () => {
    const onClipMove = vi.fn()
    const { container, getAllByTestId } = arrangement({ tracks: [TRACK_A, TRACK_B], onClipMove })
    const lanes = getAllByTestId('track-lane')
    stubLaneRects(lanes)
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 10, clientY: 40 })
    fireEvent.pointerMove(lanes[0], { clientX: 60, clientY: 50 }) // stays in lane 1
    fireEvent.pointerUp(lanes[0],   { clientX: 60, clientY: 50 })
    const [, intent] = onClipMove.mock.calls[0]
    expect(intent.trackId).toBeUndefined()
  })

  it('a folder lane is an invalid target — intent.trackId stays unset on drop', () => {
    const onClipMove     = vi.fn()
    const onClipDragOver = vi.fn()
    const FOLDER_B: ArrangementTrack = { ...TRACK_B, isFolder: true, clips: [] }
    const { container, getAllByTestId } = arrangement({ tracks: [TRACK_A, FOLDER_B], onClipMove, onClipDragOver })
    const lanes = getAllByTestId('track-lane')
    stubLaneRects(lanes)
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 10, clientY: 40 })
    fireEvent.pointerMove(lanes[0], { clientX: 10, clientY: 140 }) // over the folder lane
    expect(onClipDragOver).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetTrackId: 't2', invalid: true })
    )
    expect(lanes[1]).toHaveAttribute('data-drop-target', 'invalid')
    fireEvent.pointerUp(lanes[0], { clientX: 10, clientY: 140 })
    const [originTrackId, intent] = onClipMove.mock.calls[0]
    expect(originTrackId).toBe('t1')
    expect(intent.trackId).toBeUndefined()    // rejected: clip can't land in a folder
  })

  it('clears the drop highlight after the drag ends', () => {
    const { container, getAllByTestId } = arrangement({ tracks: [TRACK_A, TRACK_B] })
    const lanes = getAllByTestId('track-lane')
    stubLaneRects(lanes)
    fireEvent.pointerDown(clipSlot(container, 't1-c1'), { clientX: 10, clientY: 40 })
    fireEvent.pointerMove(lanes[0], { clientX: 10, clientY: 140 })
    fireEvent.pointerUp(lanes[0],   { clientX: 10, clientY: 140 })
    expect(lanes[1]).not.toHaveAttribute('data-drop-target')
  })
})

// ─── Detail panel slot ────────────────────────────────────────────────────────

describe('Arrangement — detailPanel slot', () => {
  it('renders detailPanel content in the slot', () => {
    arrangement({
      tracks:      [TRACK_A],
      detailPanel: <div data-testid="detail-content">Detail</div>,
    })
    expect(screen.getByTestId('arrangement-detail-slot')).toBeInTheDocument()
    expect(screen.getByTestId('detail-content')).toBeInTheDocument()
  })

  it('does not render detail slot when detailPanel is absent', () => {
    const { queryByTestId } = arrangement({ tracks: [TRACK_A] })
    expect(queryByTestId('arrangement-detail-slot')).toBeNull()
  })
})

// ─── Disabled state ───────────────────────────────────────────────────────────

describe('Arrangement — disabled', () => {
  it('root has data-disabled when disabled=true', () => {
    const { getByTestId } = arrangement({ tracks: [TRACK_A], disabled: true })
    expect(getByTestId('arrangement-root')).toHaveAttribute('data-disabled')
  })
})

// ─── Track collapse (minimize) ────────────────────────────────────────────────

const FOLDER_TRACK: ArrangementTrack = {
  ...makeTrack('f1', 'Drums Bus', 'var(--chroma-green)'),
  isFolder: true,
}

describe('Arrangement — collapse-all-folders control', () => {
  it('does NOT render collapse button when no folder tracks', () => {
    arrangement({ tracks: [TRACK_A, TRACK_B] })
    expect(screen.queryByRole('button', { name: /collapse all folders/i })).not.toBeInTheDocument()
  })

  it('renders collapse button when at least one isFolder track is present', () => {
    arrangement({ tracks: [TRACK_A, FOLDER_TRACK] })
    expect(screen.getByRole('button', { name: /collapse all folders/i })).toBeInTheDocument()
  })

  it('collapse button has aria-pressed=false initially', () => {
    arrangement({ tracks: [FOLDER_TRACK] })
    const btn = screen.getByRole('button', { name: /collapse all folders/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking collapse button sets all folder headers to data-minimized', () => {
    arrangement({ tracks: [TRACK_A, FOLDER_TRACK] })
    fireEvent.click(screen.getByRole('button', { name: /collapse all folders/i }))
    // Folder track header is now minimized
    expect(screen.getByRole('group', { name: 'Drums Bus, minimized' })).toHaveAttribute('data-minimized')
    // Regular track is unaffected
    expect(screen.getByRole('group', { name: 'Guitar' })).not.toHaveAttribute('data-minimized')
  })

  it('collapse button aria-pressed=true after collapsing all', () => {
    arrangement({ tracks: [FOLDER_TRACK] })
    fireEvent.click(screen.getByRole('button', { name: /collapse all folders/i }))
    expect(screen.getByRole('button', { name: /expand all folders/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking again expands all folders', () => {
    arrangement({ tracks: [FOLDER_TRACK] })
    const btn = screen.getByRole('button', { name: /collapse all folders/i })
    fireEvent.click(btn)
    fireEvent.click(screen.getByRole('button', { name: /expand all folders/i }))
    expect(screen.getByRole('group', { name: 'Drums Bus' })).not.toHaveAttribute('data-minimized')
  })

  it('fires onToggleMinimized for each folder track when collapsing all', () => {
    const FOLDER_B: ArrangementTrack = { ...makeTrack('f2', 'Strings Bus', '#fff'), isFolder: true }
    const onToggleMinimized = vi.fn()
    arrangement({ tracks: [FOLDER_TRACK, FOLDER_B], onToggleMinimized })
    fireEvent.click(screen.getByRole('button', { name: /collapse all folders/i }))
    expect(onToggleMinimized).toHaveBeenCalledWith('f1', true)
    expect(onToggleMinimized).toHaveBeenCalledWith('f2', true)
  })
})

describe('Arrangement — per-track minimized height', () => {
  it('double-clicking a folder track header minimizes it and changes row height', () => {
    arrangement({ tracks: [FOLDER_TRACK], trackHeight: 88 })
    // headerRow is the direct parent of the TrackHeader group
    const headerRow = screen.getByRole('group', { name: 'Drums Bus' }).parentElement as HTMLElement
    expect(headerRow.style.height).toBe('88px')
    fireEvent.dblClick(screen.getByRole('group', { name: 'Drums Bus' }))
    expect(headerRow.style.height).toBe('40px')
  })
})
