import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { CollectionView, formatDuration, totalDuration, type CollectionTrack } from './CollectionView'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const TRACKS: CollectionTrack[] = [
  { id: 't1', title: 'Opening, slow tape', durationSeconds: 184 },
  { id: 't2', title: 'Second light', durationSeconds: 211 },
  { id: 't3', title: 'The long one', durationSeconds: 372 },
]

function renderView(overrides: Partial<React.ComponentProps<typeof CollectionView>> = {}) {
  const props = {
    title: 'Paper Houses',
    notes: 'A winter record.',
    tracks: TRACKS,
    onNotesChange: vi.fn(),
    onReorder: vi.fn(),
    onPlayTrack: vi.fn(),
    onOpenSong: vi.fn(),
    ...overrides,
  }
  return { props, ...render(<CollectionView {...props} />) }
}

// ─── Pure helpers ───────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats seconds as M:SS', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(9)).toBe('0:09')
    expect(formatDuration(184)).toBe('3:04')
    expect(formatDuration(372)).toBe('6:12')
  })

  it('keeps multi-digit minutes', () => {
    expect(formatDuration(60 * 24 + 18)).toBe('24:18')
  })

  it('clamps negatives to zero', () => {
    expect(formatDuration(-5)).toBe('0:00')
  })
})

describe('totalDuration', () => {
  it('sums track durations', () => {
    expect(totalDuration(TRACKS)).toBe(184 + 211 + 372)
  })

  it('is zero for an empty album', () => {
    expect(totalDuration([])).toBe(0)
  })
})

// ─── Render ─────────────────────────────────────────────────────────────────────

describe('CollectionView render', () => {
  it('renders the title, the notes editor, and a tracklist', () => {
    const { getByRole, getByText } = renderView()
    expect(getByRole('heading', { name: 'Paper Houses' })).toBeTruthy()
    // Notes editor is labelled
    expect(getByRole('textbox', { name: /notes/i })).toBeTruthy()
    // Tracklist is a list with one row per track
    const list = getByRole('list', { name: /tracklist|tracks/i })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(getByText('Opening, slow tape')).toBeTruthy()
  })

  it('puts the tracklist above the notes — the tracklist is the hero, notes are the footer', () => {
    const { getByRole, container } = renderView()
    const list = getByRole('list', { name: /tracklist|tracks/i })
    const notes = container.querySelector('[data-notes]') as HTMLElement
    expect(notes).toBeTruthy()
    // The tracklist precedes the notes footer in document order.
    expect(list.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders the ALBUM · N · time meta', () => {
    const { getByText } = renderView()
    // 3 tracks, total 184+211+372 = 767s = 12:47
    expect(getByText(/ALBUM/)).toBeTruthy()
    expect(getByText(/12:47/)).toBeTruthy()
  })

  it('shows each track duration', () => {
    const { getByText } = renderView()
    expect(getByText('3:04')).toBeTruthy()
    expect(getByText('3:31')).toBeTruthy()
    expect(getByText('6:12')).toBeTruthy()
  })

  it('renders an empty tracklist message when there are no tracks', () => {
    const { getByText, queryAllByRole } = renderView({ tracks: [] })
    expect(queryAllByRole('listitem')).toHaveLength(0)
    expect(getByText(/no tracks/i)).toBeTruthy()
  })

  it('renders a cover color block when coverColor is set', () => {
    const { container } = renderView({ coverColor: 'var(--chroma-teal)' })
    const cover = container.querySelector('[data-cover]') as HTMLElement
    expect(cover).toBeTruthy()
    expect(cover.style.getPropertyValue('--cover-color')).toBe('var(--chroma-teal)')
  })
})

// ─── Play ───────────────────────────────────────────────────────────────────────

describe('CollectionView play', () => {
  it('fires onPlayAll from the Play album action', () => {
    const onPlayAll = vi.fn()
    const { getByRole } = renderView({ onPlayAll })
    fireEvent.click(getByRole('button', { name: /play album/i }))
    expect(onPlayAll).toHaveBeenCalledTimes(1)
  })

  it('falls back to playing the first track when onPlayAll is absent', () => {
    const onPlayTrack = vi.fn()
    const { getByRole } = renderView({ onPlayTrack })
    fireEvent.click(getByRole('button', { name: /play album/i }))
    expect(onPlayTrack).toHaveBeenCalledWith('t1')
  })

  it('fires onPlayTrack from a row play button', () => {
    const onPlayTrack = vi.fn()
    const { getByRole } = renderView({ onPlayTrack })
    fireEvent.click(getByRole('button', { name: /play second light/i }))
    expect(onPlayTrack).toHaveBeenCalledWith('t2')
  })

  it('disables Play album for an empty album', () => {
    const { getByRole } = renderView({ tracks: [], onPlayAll: vi.fn() })
    expect((getByRole('button', { name: /play album/i }) as HTMLButtonElement).disabled).toBe(true)
  })
})

// ─── Open song ────────────────────────────────────────────────────────────────

describe('CollectionView open song', () => {
  it('fires onOpenSong when a row title is clicked', () => {
    const onOpenSong = vi.fn()
    const { getByRole } = renderView({ onOpenSong })
    fireEvent.click(getByRole('button', { name: /open the long one/i }))
    expect(onOpenSong).toHaveBeenCalledWith('t3')
  })
})

// ─── Now playing ────────────────────────────────────────────────────────────────

describe('CollectionView now playing', () => {
  it('marks the now-playing row', () => {
    const { container } = renderView({ nowPlayingId: 't2' })
    const playing = container.querySelectorAll('[data-now-playing]')
    expect(playing).toHaveLength(1)
    expect(within(playing[0] as HTMLElement).getByText('Second light')).toBeTruthy()
  })

  it('has no now-playing row when nowPlayingId is null', () => {
    const { container } = renderView({ nowPlayingId: null })
    expect(container.querySelectorAll('[data-now-playing]')).toHaveLength(0)
  })
})

// ─── Reorder ────────────────────────────────────────────────────────────────────

describe('CollectionView reorder', () => {
  it('moves a row down with the keyboard and fires onReorder', () => {
    const onReorder = vi.fn()
    const { container } = renderView({ onReorder })
    const grip = container.querySelector('[data-grip][data-index="0"]') as HTMLButtonElement
    fireEvent.keyDown(grip, { key: 'ArrowDown' })
    expect(onReorder).toHaveBeenCalledWith(0, 1)
  })

  it('moves a row up with the keyboard and fires onReorder', () => {
    const onReorder = vi.fn()
    const { container } = renderView({ onReorder })
    const grip = container.querySelector('[data-grip][data-index="2"]') as HTMLButtonElement
    fireEvent.keyDown(grip, { key: 'ArrowUp' })
    expect(onReorder).toHaveBeenCalledWith(2, 1)
  })

  it('does not reorder past the top edge', () => {
    const onReorder = vi.fn()
    const { container } = renderView({ onReorder })
    const grip = container.querySelector('[data-grip][data-index="0"]') as HTMLButtonElement
    fireEvent.keyDown(grip, { key: 'ArrowUp' })
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('does not reorder past the bottom edge', () => {
    const onReorder = vi.fn()
    const { container } = renderView({ onReorder })
    const grip = container.querySelector('[data-grip][data-index="2"]') as HTMLButtonElement
    fireEvent.keyDown(grip, { key: 'ArrowDown' })
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('reorders via drag and drop', () => {
    const onReorder = vi.fn()
    const { container } = renderView({ onReorder })
    const rows = container.querySelectorAll('[data-row]')
    fireEvent.dragStart(rows[2])
    fireEvent.dragEnter(rows[0])
    fireEvent.drop(rows[0])
    expect(onReorder).toHaveBeenCalledWith(2, 0)
  })
})

// ─── Notes ──────────────────────────────────────────────────────────────────────

describe('CollectionView notes', () => {
  it('emits onNotesChange when the notes editor changes', () => {
    const onNotesChange = vi.fn()
    const { getByRole } = renderView({ onNotesChange })
    const editor = getByRole('textbox', { name: /notes/i })
    editor.innerHTML = 'New concept'
    fireEvent.input(editor)
    expect(onNotesChange).toHaveBeenCalled()
  })
})

// ─── Back ───────────────────────────────────────────────────────────────────────

describe('CollectionView back', () => {
  it('renders a back control only when onBack is provided', () => {
    const { queryByRole, rerender } = render(
      <CollectionView title="A" notes="" tracks={TRACKS} onNotesChange={vi.fn()} onReorder={vi.fn()} onPlayTrack={vi.fn()} onOpenSong={vi.fn()} />,
    )
    expect(queryByRole('button', { name: /back/i })).toBeNull()
    const onBack = vi.fn()
    rerender(
      <CollectionView title="A" notes="" tracks={TRACKS} onNotesChange={vi.fn()} onReorder={vi.fn()} onPlayTrack={vi.fn()} onOpenSong={vi.fn()} onBack={onBack} />,
    )
    fireEvent.click(queryByRole('button', { name: /back/i })!)
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
