// src/components/IdeasLibrary/IdeasLibrary.test.tsx
import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { IdeasLibrary, ideaDurationSec, formatDuration } from './IdeasLibrary'
import type { Idea } from './IdeasLibrary'

// Vitest stubs CSS, so we read the authored stylesheet to assert the Home paper-face
// guarantee: the setlist lives on warm light surfaces, never the dark --stage well
// (that is Studio hardware vocabulary).
const LIB_CSS = readFileSync('src/components/IdeasLibrary/IdeasLibrary.module.css', 'utf8')

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
  durationSec: 45,
}

const IDEA_2: Idea = {
  id: 'idea-2',
  name: 'Pulse Engine',
  bpm: 120,
  source: 'Night Shift / Synth Bus',
  labels: ['synth', 'pad'],
  scale: 'F major',
  peaks: PEAKS,
  durationSec: 90,
}

const IDEA_3: Idea = {
  id: 'idea-3',
  name: 'Breakbeat Loop',
  bpm: 140,
  source: 'Machine Age / Drum Bus',
  labels: ['drums', 'loop'],
  scale: 'G minor',
  peaks: PEAKS,
  durationSec: 8,
}

const IDEAS = [IDEA_1, IDEA_2, IDEA_3]

const VOICE_IDEA: Idea = {
  id: 'voice-1',
  name: 'Morning Idea',
  kind: 'voice',
  origin: 'app',
  durationSec: 37,
  peaks: PEAKS,
}

const LYRIC_IDEA: Idea = {
  id: 'lyric-1',
  name: 'Bridge Verse',
  kind: 'lyric',
  origin: 'app',
  text: 'The light falls through the window\nSoft and warm and slow',
}

const MIXED_IDEAS = [IDEA_1, VOICE_IDEA, LYRIC_IDEA]

const GROUP_IDEA: Idea = {
  id: 'group-1',
  name: 'Verse Stack',
  bpm: 110,
  source: 'Night Shift / Stems',
  labels: ['stems', 'verse'],
  scale: 'A minor',
  clips: [
    { id: 'c-1', name: 'Guitar', peaks: PEAKS, durationSec: 12 },
    { id: 'c-2', name: 'Bass',   peaks: PEAKS, durationSec: 16 },
    { id: 'c-3', name: 'Keys',   peaks: PEAKS, durationSec: 12 },
  ],
}

const APP_SYNC_URL = 'https://jackdaw.app/get'

const NOOP = {
  onPlay: vi.fn(),
  onDragToProject: vi.fn(),
  onLabel: vi.fn(),
  onDelete: vi.fn(),
}

function renderLibrary(ideas: Idea[] = IDEAS, overrides: Record<string, unknown> = {}) {
  return render(
    <IdeasLibrary ideas={ideas} {...NOOP} appSyncUrl={APP_SYNC_URL} {...overrides} />,
  )
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

describe('ideaDurationSec', () => {
  it('prefers explicit durationSec', () => {
    expect(ideaDurationSec({ id: 'a', name: 'a', durationSec: 30 })).toBe(30)
  })

  it('falls back to the LONGEST clip in a stack (layered stems play together)', () => {
    expect(ideaDurationSec(GROUP_IDEA)).toBe(16)
  })

  it('is undefined when neither duration nor clips are known', () => {
    expect(ideaDurationSec({ id: 'a', name: 'a', peaks: PEAKS })).toBeUndefined()
  })
})

describe('formatDuration', () => {
  it('formats m:ss', () => {
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(8)).toBe('0:08')
  })
  it('em-dashes an unknown length', () => {
    expect(formatDuration(undefined)).toBe('–:––')
  })
})

// ─── Initial render ───────────────────────────────────────────────────────────

describe('IdeasLibrary — initial render', () => {
  it('renders the region with accessible name', () => {
    renderLibrary()
    expect(screen.getByRole('region', { name: 'Ideas Library' })).toBeTruthy()
  })

  it('renders the "Ideas" heading', () => {
    renderLibrary()
    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeTruthy()
  })

  it('renders every idea as a row', () => {
    renderLibrary()
    expect(screen.getAllByTestId('idea-row')).toHaveLength(3)
    expect(screen.getByText('Dusty Rhodes Intro')).toBeTruthy()
    expect(screen.getByText('Pulse Engine')).toBeTruthy()
    expect(screen.getByText('Breakbeat Loop')).toBeTruthy()
  })

  it('renders the source on each row', () => {
    renderLibrary()
    expect(screen.getByText('Desert Hymns / Guitar Stem')).toBeTruthy()
  })

  it('renders BPM + scale chips', () => {
    renderLibrary()
    expect(screen.getByLabelText('72 BPM')).toBeTruthy()
    // "D minor" shows as both a scale filter chip and the row's scale badge
    expect(screen.getAllByText('D minor').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the m:ss duration on each row', () => {
    renderLibrary()
    const durations = screen.getAllByTestId('row-duration').map(n => n.textContent)
    expect(durations).toContain('0:45')
    expect(durations).toContain('1:30')
    expect(durations).toContain('0:08')
  })

  it('renders the search field', () => {
    renderLibrary()
    expect(screen.getByLabelText('Search ideas')).toBeTruthy()
  })

  it('renders the group-by-tag toggle', () => {
    renderLibrary()
    expect(screen.getByRole('switch', { name: 'Group by tag' })).toBeTruthy()
  })
})

// ─── Empty initial state ──────────────────────────────────────────────────────

describe('IdeasLibrary — empty initial state', () => {
  it('shows "No ideas yet" when ideas is empty', () => {
    renderLibrary([])
    expect(screen.getByTestId('empty-initial')).toBeTruthy()
    expect(screen.getByText('No ideas yet')).toBeTruthy()
  })

  it('shows no rows when empty', () => {
    renderLibrary([])
    expect(screen.queryAllByTestId('idea-row')).toHaveLength(0)
  })
})

// ─── Search ───────────────────────────────────────────────────────────────────

describe('IdeasLibrary — search', () => {
  function search(term: string) {
    renderLibrary()
    fireEvent.change(screen.getByLabelText('Search ideas'), { target: { value: term } })
  }

  it('filters by name', () => {
    search('Pulse')
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Pulse Engine')).toBeTruthy()
  })

  it('filters by source', () => {
    search('Machine Age')
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Breakbeat Loop')).toBeTruthy()
  })

  it('filters by label', () => {
    search('ambient')
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Dusty Rhodes Intro')).toBeTruthy()
  })

  it('filters by scale', () => {
    search('F major')
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
  })

  it('is case-insensitive', () => {
    search('pULSe')
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
  })

  it('shows the no-match empty state', () => {
    search('xyznotfound')
    expect(screen.getByTestId('empty-search')).toBeTruthy()
  })

  it('restores all rows when cleared', () => {
    renderLibrary()
    const field = screen.getByLabelText('Search ideas')
    fireEvent.change(field, { target: { value: 'Pulse' } })
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    fireEvent.change(field, { target: { value: '' } })
    expect(screen.getAllByTestId('idea-row')).toHaveLength(3)
  })
})

// ─── BPM filter ───────────────────────────────────────────────────────────────

describe('IdeasLibrary — BPM filter', () => {
  it('Slow (<80) shows only the 72 BPM idea', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '< 80' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Dusty Rhodes Intro')).toBeTruthy()
  })

  it('Fast (130+) shows only the 140 BPM idea', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '130+' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Breakbeat Loop')).toBeTruthy()
  })

  it('marks the selected band aria-checked', () => {
    renderLibrary()
    const fast = screen.getByRole('radio', { name: '130+' })
    fireEvent.click(fast)
    expect(fast.getAttribute('aria-checked')).toBe('true')
  })
})

// ─── Label + scale filters ────────────────────────────────────────────────────

describe('IdeasLibrary — label + scale filters', () => {
  it('a label chip filters to that label', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Label filter' })
    fireEvent.click(within(group).getByRole('button', { name: 'synth' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Pulse Engine')).toBeTruthy()
  })

  it('the active label chip is aria-pressed', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Label filter' })
    const chip = within(group).getByRole('button', { name: 'guitar' })
    fireEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('true')
  })

  it('a scale chip filters to that scale', () => {
    renderLibrary()
    const group = screen.getByRole('group', { name: 'Scale filter' })
    fireEvent.click(within(group).getByRole('button', { name: 'G minor' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Breakbeat Loop')).toBeTruthy()
  })

  it('Clear removes active filters', () => {
    renderLibrary()
    fireEvent.click(screen.getByRole('radio', { name: '< 80' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(3)
  })
})

// ─── Kind segmented ───────────────────────────────────────────────────────────

describe('IdeasLibrary — kind segmented', () => {
  it('"All" kind is selected by default', () => {
    renderLibrary()
    const all = within(screen.getByRole('radiogroup', { name: 'Kind filter' })).getByRole('radio', { name: 'All' })
    expect(all.getAttribute('aria-checked')).toBe('true')
  })

  it('selecting Voice shows only voice ideas', () => {
    renderLibrary(MIXED_IDEAS)
    fireEvent.click(screen.getByRole('radio', { name: 'Voice recordings' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Morning Idea')).toBeTruthy()
  })

  it('selecting Lyrics shows only lyric ideas', () => {
    renderLibrary(MIXED_IDEAS)
    fireEvent.click(screen.getByRole('radio', { name: 'Lyrics' }))
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)
    expect(screen.getByText('Bridge Verse')).toBeTruthy()
  })

  it('BPM filter hides when Voice is selected, shows when All', () => {
    renderLibrary(MIXED_IDEAS)
    fireEvent.click(screen.getByRole('radio', { name: 'Voice recordings' }))
    expect(screen.queryByRole('radiogroup', { name: 'BPM filter' })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'All' }))
    expect(screen.getByRole('radiogroup', { name: 'BPM filter' })).toBeTruthy()
  })
})

// ─── Group-by-tag clustering ──────────────────────────────────────────────────

describe('IdeasLibrary — group by tag', () => {
  function enableClustering(ideas: Idea[] = IDEAS) {
    renderLibrary(ideas)
    fireEvent.click(screen.getByRole('switch', { name: 'Group by tag' }))
  }

  it('renders a cluster header per unique tag', () => {
    enableClustering()
    const heads = screen.getAllByTestId('cluster-head').map(h => h.textContent)
    // labels across the 3 clip ideas: guitar, ambient, synth, pad, drums, loop
    expect(heads.some(h => h?.includes('guitar'))).toBe(true)
    expect(heads.some(h => h?.includes('drums'))).toBe(true)
  })

  it('files a multi-tag idea under EACH of its tags', () => {
    enableClustering([IDEA_1]) // labels: guitar, ambient
    const clusters = screen.getAllByTestId('cluster')
    const guitar = clusters.find(c => within(c).queryByText('guitar', { selector: 'span' }))
    // IDEA_1 shows in both the guitar and ambient clusters → 2 rows total
    expect(screen.getAllByTestId('idea-row')).toHaveLength(2)
    expect(guitar).toBeTruthy()
  })

  it('collects untagged ideas under an "Untagged" folder', () => {
    enableClustering([{ id: 'bare', name: 'No Tags', peaks: PEAKS, durationSec: 10 }])
    const heads = screen.getAllByTestId('cluster-head').map(h => h.textContent)
    expect(heads.some(h => h?.includes('Untagged'))).toBe(true)
  })

  it('"play tag" plays the first idea of that cluster', () => {
    const onPlay = vi.fn()
    renderLibrary([IDEA_2], { onPlay }) // labels: synth, pad
    fireEvent.click(screen.getByRole('switch', { name: 'Group by tag' }))
    fireEvent.click(screen.getAllByTestId('cluster-play')[0])
    expect(onPlay).toHaveBeenCalledWith('idea-2')
  })
})

// ─── Controlled playback ──────────────────────────────────────────────────────

describe('IdeasLibrary — controlled playback', () => {
  it('a row play stud fires onPlay with the idea id', () => {
    const onPlay = vi.fn()
    renderLibrary(IDEAS, { onPlay })
    fireEvent.click(screen.getByRole('button', { name: 'Play Pulse Engine' }))
    expect(onPlay).toHaveBeenCalledWith('idea-2')
  })

  it('does NOT render the top player when nothing is playing', () => {
    renderLibrary()
    expect(screen.queryByTestId('now-playing-player')).toBeNull()
  })

  it('renders the top player for the now-playing idea', () => {
    renderLibrary(IDEAS, { nowPlayingId: 'idea-2', isPlaying: true, positionSeconds: 10 })
    const player = screen.getByTestId('now-playing-player')
    expect(within(player).getByText('Pulse Engine')).toBeTruthy()
  })

  it('lights the now-playing row', () => {
    renderLibrary(IDEAS, { nowPlayingId: 'idea-2', isPlaying: true })
    const rows = screen.getAllByTestId('idea-row')
    const live = rows.filter(r => r.getAttribute('data-now-playing') !== null)
    expect(live).toHaveLength(1)
    expect(within(live[0]).getByText('Pulse Engine')).toBeTruthy()
  })

  it('the live row stud relabels to Pause while rolling', () => {
    renderLibrary(IDEAS, { nowPlayingId: 'idea-2', isPlaying: true })
    expect(screen.getByRole('button', { name: 'Pause Pulse Engine' })).toBeTruthy()
  })

  it('the live row stud reads Play again when paused', () => {
    renderLibrary(IDEAS, { nowPlayingId: 'idea-2', isPlaying: false })
    expect(screen.getByRole('button', { name: 'Play Pulse Engine' })).toBeTruthy()
  })

  it('the top play/pause toggles the now-playing idea via onPlay', () => {
    const onPlay = vi.fn()
    renderLibrary(IDEAS, { nowPlayingId: 'idea-2', isPlaying: true, onPlay })
    // ClipPlayer's own control is labelled "Pause" (no name) — the deck toggle
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(onPlay).toHaveBeenCalledWith('idea-2')
  })

  it('the top player shows even when the now-playing idea is filtered out of the list', () => {
    renderLibrary(IDEAS, { nowPlayingId: 'idea-2' })
    fireEvent.change(screen.getByLabelText('Search ideas'), { target: { value: 'Dusty' } })
    expect(screen.getAllByTestId('idea-row')).toHaveLength(1)          // only Dusty in the list
    expect(screen.getByTestId('now-playing-player')).toBeTruthy()      // player still there
  })

  it('prev / next fire the transport intents', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    renderLibrary(IDEAS, { nowPlayingId: 'idea-1', onNext, onPrev })
    fireEvent.click(screen.getByTestId('transport-next'))
    fireEvent.click(screen.getByTestId('transport-prev'))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('disables prev / next when no handler is wired', () => {
    renderLibrary(IDEAS, { nowPlayingId: 'idea-1' })
    expect((screen.getByTestId('transport-next') as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByTestId('transport-prev') as HTMLButtonElement).disabled).toBe(true)
  })

  it('fires onEnded ONCE when position reaches the idea duration', () => {
    const onEnded = vi.fn()
    const { rerender } = render(
      <IdeasLibrary ideas={IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL}
        nowPlayingId="idea-3" isPlaying positionSeconds={0} onEnded={onEnded} />,
    )
    expect(onEnded).not.toHaveBeenCalled()
    rerender(
      <IdeasLibrary ideas={IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL}
        nowPlayingId="idea-3" isPlaying positionSeconds={8} onEnded={onEnded} />,
    )
    expect(onEnded).toHaveBeenCalledTimes(1)
    rerender(
      <IdeasLibrary ideas={IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL}
        nowPlayingId="idea-3" isPlaying positionSeconds={9} onEnded={onEnded} />,
    )
    expect(onEnded).toHaveBeenCalledTimes(1) // not re-fired past the end
  })

  it('does not fire onEnded while paused at the end', () => {
    const onEnded = vi.fn()
    render(
      <IdeasLibrary ideas={IDEAS} {...NOOP} appSyncUrl={APP_SYNC_URL}
        nowPlayingId="idea-3" isPlaying={false} positionSeconds={8} onEnded={onEnded} />,
    )
    expect(onEnded).not.toHaveBeenCalled()
  })
})

// ─── Drag to project ──────────────────────────────────────────────────────────

describe('IdeasLibrary — drag to project', () => {
  it('each row has a labelled drag grip', () => {
    renderLibrary()
    expect(screen.getAllByTestId('drag-handle')).toHaveLength(3)
    expect(screen.getByLabelText('Drag Dusty Rhodes Intro to project')).toBeTruthy()
  })

  it('dragstart fires onDragToProject with the idea id', () => {
    const onDragToProject = vi.fn()
    renderLibrary(IDEAS, { onDragToProject })
    fireEvent.dragStart(screen.getByLabelText('Drag Pulse Engine to project'), {
      dataTransfer: { setData: vi.fn() },
    })
    expect(onDragToProject).toHaveBeenCalledWith('idea-2')
  })

  it('keyboard (Enter) on the grip fires onDragToProject', () => {
    const onDragToProject = vi.fn()
    renderLibrary(IDEAS, { onDragToProject })
    fireEvent.keyDown(screen.getByLabelText('Drag Pulse Engine to project'), { key: 'Enter' })
    expect(onDragToProject).toHaveBeenCalledWith('idea-2')
  })
})

// ─── Delete ───────────────────────────────────────────────────────────────────

describe('IdeasLibrary — delete', () => {
  it('each row has a labelled delete button', () => {
    renderLibrary()
    expect(screen.getAllByTestId('delete-btn')).toHaveLength(3)
    expect(screen.getByLabelText('Delete Dusty Rhodes Intro')).toBeTruthy()
  })

  it('clicking delete fires onDelete with the idea id', () => {
    const onDelete = vi.fn()
    renderLibrary(IDEAS, { onDelete })
    fireEvent.click(screen.getByLabelText('Delete Pulse Engine'))
    expect(onDelete).toHaveBeenCalledWith('idea-2')
  })
})

// ─── Multi-clip stack ─────────────────────────────────────────────────────────

describe('IdeasLibrary — multi-clip stack', () => {
  it('renders the stack row with a clips count', () => {
    renderLibrary([GROUP_IDEA])
    expect(screen.getByLabelText('3 clips')).toBeTruthy()
  })

  it('renders per-clip sub-rows', () => {
    renderLibrary([GROUP_IDEA])
    expect(screen.getAllByTestId('clip-sub-row')).toHaveLength(3)
    expect(screen.getByText('Guitar')).toBeTruthy()
    expect(screen.getByText('Bass')).toBeTruthy()
  })

  it('a clip play stud fires onPlayClip with idea + clip ids', () => {
    const onPlayClip = vi.fn()
    renderLibrary([GROUP_IDEA], { onPlayClip })
    fireEvent.click(screen.getByRole('button', { name: 'Play Bass' }))
    expect(onPlayClip).toHaveBeenCalledWith('group-1', 'c-2')
  })

  it('a clip grip drags the single clip', () => {
    const onDragClipToProject = vi.fn()
    renderLibrary([GROUP_IDEA], { onDragClipToProject })
    fireEvent.dragStart(screen.getByLabelText('Drag Bass to project'), {
      dataTransfer: { setData: vi.fn() },
    })
    expect(onDragClipToProject).toHaveBeenCalledWith('group-1', 'c-2')
  })

  it('the stack row shows its derived duration (longest clip)', () => {
    renderLibrary([GROUP_IDEA])
    // longest clip is 16s → 0:16 (the row's duration cell)
    const rowDur = screen.getAllByTestId('row-duration').map(n => n.textContent)
    expect(rowDur).toContain('0:16')
  })
})

// ─── Back-compat: voice + lyric rows ──────────────────────────────────────────

describe('IdeasLibrary — voice + lyric back-compat', () => {
  it('a voice idea renders as a playable row with duration + app tag', () => {
    renderLibrary([VOICE_IDEA])
    expect(screen.getByText('Morning Idea')).toBeTruthy()
    expect(screen.getByTestId('row-duration').textContent).toBe('0:37')
    expect(screen.getByTestId('app-tag')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play Morning Idea' })).toBeTruthy()
  })

  it('a lyric idea renders text with no play stud and no duration', () => {
    renderLibrary([LYRIC_IDEA])
    expect(screen.getByText(/The light falls through the window/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Play Bridge Verse' })).toBeNull()
    expect(screen.getByTestId('row-duration').textContent).toBe('—')
  })
})

// ─── Calm-paper guarantees (Home paper face, not the dark Studio stage) ───────

describe('IdeasLibrary — calm-paper guarantees', () => {
  it('never paints a surface on the dark --stage well', () => {
    expect(LIB_CSS).not.toMatch(/var\(--stage\b/)
  })

  it('seats the setlist in a recessed light paper well', () => {
    expect(LIB_CSS).toMatch(/\.list\s*{[^}]*background:\s*var\(--surface-2\)/)
  })

  it('lights the now-playing row with the warm accent spine', () => {
    expect(LIB_CSS).toMatch(/\.row\[data-now-playing\][^{]*>\s*\.rowMain\s*{[^}]*var\(--accent\)/)
  })
})
