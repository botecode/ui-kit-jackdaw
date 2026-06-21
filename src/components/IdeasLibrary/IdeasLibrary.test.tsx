// src/components/IdeasLibrary/IdeasLibrary.test.tsx
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IdeasLibrary } from './IdeasLibrary'
import type { Idea } from './IdeasLibrary'

// ─── Environment stubs ────────────────────────────────────────────────────────

beforeAll(() => {
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class ResizeObserver {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PEAKS = [0.2, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.3, 0.6, 0.8]

const IDEA_1: Idea = {
  id: 'idea-1',
  name: 'Dusty Rhodes Intro',
  bpm: 72,
  source: 'Desert Hymns / Guitar Stem',
  labels: ['guitar', 'ambient'],
  scale: 'D minor',
  peaks: PEAKS,
}

const IDEA_2: Idea = {
  id: 'idea-2',
  name: 'Pulse Engine',
  bpm: 120,
  source: 'Night Shift / Synth Bus',
  labels: ['synth', 'pad'],
  scale: 'F major',
  peaks: PEAKS,
}

const IDEA_3: Idea = {
  id: 'idea-3',
  name: 'Breakbeat Loop',
  bpm: 140,
  source: 'Machine Age / Drum Bus',
  labels: ['drums', 'loop'],
  scale: 'G minor',
  peaks: PEAKS,
}

const IDEAS = [IDEA_1, IDEA_2, IDEA_3]

const NOOP = {
  onPlay: vi.fn(),
  onDragToProject: vi.fn(),
  onLabel: vi.fn(),
  onDelete: vi.fn(),
}

function renderLibrary(ideas: Idea[] = IDEAS, overrides = {}) {
  return render(<IdeasLibrary ideas={ideas} {...NOOP} {...overrides} />)
}

// ─── Initial render ───────────────────────────────────────────────────────────

describe('IdeasLibrary — initial render', () => {
  it('renders the region with accessible name', () => {
    renderLibrary()
    expect(screen.getByRole('region', { name: 'Ideas Library' })).toBeInTheDocument()
  })

  it('renders the "Ideas" heading', () => {
    renderLibrary()
    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeInTheDocument()
  })

  it('renders all ideas', () => {
    renderLibrary()
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
  })

  it('renders source for each idea', () => {
    renderLibrary()
    expect(screen.getByText('Desert Hymns / Guitar Stem')).toBeInTheDocument()
    expect(screen.getByText('Night Shift / Synth Bus')).toBeInTheDocument()
  })

  it('renders BPM badges', () => {
    renderLibrary()
    expect(screen.getByLabelText('72 BPM')).toBeInTheDocument()
    expect(screen.getByLabelText('120 BPM')).toBeInTheDocument()
    expect(screen.getByLabelText('140 BPM')).toBeInTheDocument()
  })

  it('renders scale badges', () => {
    renderLibrary()
    // Scale appears both as a card badge and as a header filter chip
    expect(screen.getAllByText('D minor').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('F major').length).toBeGreaterThanOrEqual(1)
  })

  it('renders label chips on cards', () => {
    renderLibrary()
    expect(screen.getAllByText('guitar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('synth').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the search field', () => {
    renderLibrary()
    expect(screen.getByRole('searchbox', { name: 'Search ideas' })).toBeInTheDocument()
  })

  it('renders the BPM segmented control', () => {
    renderLibrary()
    expect(screen.getByRole('radiogroup', { name: 'BPM filter' })).toBeInTheDocument()
  })

  it('"All" BPM band is selected by default', () => {
    renderLibrary()
    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true')
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('IdeasLibrary — empty initial state', () => {
  it('shows "No ideas yet" when ideas is empty', () => {
    renderLibrary([])
    expect(screen.getByTestId('empty-initial')).toBeInTheDocument()
    expect(screen.getByText('No ideas yet')).toBeInTheDocument()
  })

  it('shows hint text in empty state', () => {
    renderLibrary([])
    expect(screen.getByText(/Save a riff/i)).toBeInTheDocument()
  })

  it('does not show idea cards when empty', () => {
    renderLibrary([])
    expect(screen.queryByText('Dusty Rhodes Intro')).not.toBeInTheDocument()
  })
})

// ─── Search ───────────────────────────────────────────────────────────────────

describe('IdeasLibrary — search', () => {
  it('filters by name', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dusty' } })
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
  })

  it('filters by source', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Night Shift' } })
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
    expect(screen.queryByText('Dusty Rhodes Intro')).not.toBeInTheDocument()
  })

  it('filters by label', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'drums' } })
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
    expect(screen.queryByText('Dusty Rhodes Intro')).not.toBeInTheDocument()
  })

  it('filters by scale', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'g minor' } })
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
  })

  it('shows no-match empty state when search matches nothing', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyznotfound' } })
    expect(screen.getByTestId('empty-search')).toBeInTheDocument()
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('restores all ideas when search is cleared', () => {
    renderLibrary()
    const search = screen.getByRole('searchbox')
    fireEvent.change(search, { target: { value: 'dusty' } })
    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
  })

  it('is case-insensitive', () => {
    renderLibrary()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'PULSE' } })
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
  })
})

// ─── BPM filter ───────────────────────────────────────────────────────────────

describe('IdeasLibrary — BPM filter', () => {
  it('Slow (<80) shows only 72 BPM idea', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '< 80' }))
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
    expect(screen.queryByText('Breakbeat Loop')).not.toBeInTheDocument()
  })

  it('Mid (80–130) shows only 120 BPM idea', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '80–130' }))
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
    expect(screen.queryByText('Dusty Rhodes Intro')).not.toBeInTheDocument()
    expect(screen.queryByText('Breakbeat Loop')).not.toBeInTheDocument()
  })

  it('Fast (130+) shows only 140 BPM idea', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '130+' }))
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
    expect(screen.queryByText('Dusty Rhodes Intro')).not.toBeInTheDocument()
  })

  it('clicking the active band again shows all (All band)', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '< 80' }))
    fireEvent.click(screen.getByRole('radio', { name: 'All' }))
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
  })

  it('marks the selected BPM band as aria-checked=true', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '80–130' }))
    expect(screen.getByRole('radio', { name: '80–130' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'false')
  })
})

// ─── Label filter ─────────────────────────────────────────────────────────────

describe('IdeasLibrary — label filter', () => {
  it('label filter chips appear for unique labels', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Label filter' })
    expect(group).toBeInTheDocument()
    // 'guitar' label should appear as a filter chip (within the filter group)
    const guitarChip = group.querySelector('[aria-pressed]')
    expect(guitarChip).not.toBeNull()
  })

  it('clicking a label chip filters to that label', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Label filter' })
    // Find the 'guitar' chip button
    const guitarBtn = Array.from(group.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'guitar')!
    fireEvent.click(guitarBtn)
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
  })

  it('clicking the same chip again clears the label filter', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Label filter' })
    const guitarBtn = Array.from(group.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'guitar')!
    fireEvent.click(guitarBtn) // activate
    fireEvent.click(guitarBtn) // deactivate
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
  })

  it('active label chip has aria-pressed=true', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Label filter' })
    const guitarBtn = Array.from(group.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'guitar')!
    expect(guitarBtn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(guitarBtn)
    expect(guitarBtn).toHaveAttribute('aria-pressed', 'true')
  })
})

// ─── Scale filter ─────────────────────────────────────────────────────────────

describe('IdeasLibrary — scale filter', () => {
  it('scale filter chips appear for unique scales', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Scale filter' })
    expect(group).toBeInTheDocument()
  })

  it('clicking a scale chip filters to that scale', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Scale filter' })
    const dMinorBtn = Array.from(group.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'D minor')!
    fireEvent.click(dMinorBtn)
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
  })
})

// ─── Clear filters ────────────────────────────────────────────────────────────

describe('IdeasLibrary — clear filters', () => {
  it('Clear button appears when a BPM band is active', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '130+' }))
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument()
  })

  it('Clear button removes all filters', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '130+' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    expect(screen.getByText('Pulse Engine')).toBeInTheDocument()
    expect(screen.getByText('Breakbeat Loop')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument()
  })

  it('Clear button does not appear with no active filters', () => {
    renderLibrary()
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument()
  })
})

// ─── Play / Stop ──────────────────────────────────────────────────────────────

describe('IdeasLibrary — play / stop', () => {
  it('each card has a play button', () => {
    renderLibrary()
    const playBtns = screen.getAllByTestId('play-btn')
    expect(playBtns.length).toBe(3)
  })

  it('play button label is "Play {name}"', () => {
    renderLibrary()
    expect(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' })).toBeInTheDocument()
  })

  it('clicking play calls onPlay with the idea id', () => {
    const onPlay = vi.fn()
    renderLibrary(IDEAS, { onPlay })
    fireEvent.click(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' }))
    expect(onPlay).toHaveBeenCalledWith('idea-1')
  })

  it('play button label changes to "Stop {name}" when playing', () => {
    const onPlay = vi.fn()
    renderLibrary(IDEAS, { onPlay })
    fireEvent.click(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' }))
    expect(screen.getByRole('button', { name: 'Stop Dusty Rhodes Intro' })).toBeInTheDocument()
  })

  it('clicking stop restores "Play" label', () => {
    const onPlay = vi.fn()
    renderLibrary(IDEAS, { onPlay })
    fireEvent.click(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop Dusty Rhodes Intro' }))
    expect(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' })).toBeInTheDocument()
  })

  it('only one card can play at a time — starting a second stops the first', () => {
    const onPlay = vi.fn()
    renderLibrary(IDEAS, { onPlay })
    fireEvent.click(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Pulse Engine' }))
    expect(screen.getByRole('button', { name: 'Play Dusty Rhodes Intro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stop Pulse Engine' })).toBeInTheDocument()
  })
})

// ─── Drag ─────────────────────────────────────────────────────────────────────

describe('IdeasLibrary — drag to project', () => {
  it('each card has a drag handle', () => {
    renderLibrary()
    const handles = screen.getAllByTestId('drag-handle')
    expect(handles.length).toBe(3)
  })

  it('drag handle is labelled with the idea name', () => {
    renderLibrary()
    expect(screen.getByRole('button', { name: 'Drag Dusty Rhodes Intro to project' })).toBeInTheDocument()
  })

  it('dragstart on handle calls onDragToProject with the idea id', () => {
    const onDragToProject = vi.fn()
    renderLibrary(IDEAS, { onDragToProject })
    const handle = screen.getAllByTestId('drag-handle')[0]
    fireEvent.dragStart(handle)
    expect(onDragToProject).toHaveBeenCalledWith('idea-1')
  })
})

// ─── Delete ───────────────────────────────────────────────────────────────────

describe('IdeasLibrary — delete', () => {
  it('each card has a delete button', () => {
    renderLibrary()
    const btns = screen.getAllByTestId('delete-btn')
    expect(btns.length).toBe(3)
  })

  it('delete button is labelled with the idea name', () => {
    renderLibrary()
    expect(screen.getByRole('button', { name: 'Delete Dusty Rhodes Intro' })).toBeInTheDocument()
  })

  it('clicking delete calls onDelete with the idea id', () => {
    const onDelete = vi.fn()
    renderLibrary(IDEAS, { onDelete })
    fireEvent.click(screen.getByRole('button', { name: 'Delete Dusty Rhodes Intro' }))
    expect(onDelete).toHaveBeenCalledWith('idea-1')
  })
})

// ─── Combined search + filter ─────────────────────────────────────────────────

describe('IdeasLibrary — search + BPM filter together', () => {
  it('applies both constraints simultaneously', () => {
    renderLibrary()
    // Slow band + search "dusty"
    fireEvent.click(screen.getByRole('radio', { name: '< 80' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dusty' } })
    expect(screen.getByText('Dusty Rhodes Intro')).toBeInTheDocument()
    // pulse engine fails bpm band, breakbeat loop fails search
    expect(screen.queryByText('Pulse Engine')).not.toBeInTheDocument()
    expect(screen.queryByText('Breakbeat Loop')).not.toBeInTheDocument()
  })

  it('shows no-match empty state when combined filter eliminates all', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '130+' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'guitar' } })
    expect(screen.getByTestId('empty-search')).toBeInTheDocument()
  })
})
