// src/components/VoiceIdeaCRUD/VoiceIdeaCRUD.test.tsx
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { VoiceIdeaList, VoiceIdeaRow, formatDuration } from './VoiceIdeaCRUD'
import type { VoiceIdea } from './VoiceIdeaCRUD'

// ─── Environment stubs ────────────────────────────────────────────────────────

beforeAll(() => {
  ;(globalThis as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const IDEA_A: VoiceIdea = {
  id: 'v-1',
  title: 'Morning Hook',
  durationSec: 37,
  audioUri: 'jackdaw://nest/v-1.m4a',
  synced: true,
  kind: 'idea',
}

const IDEA_B: VoiceIdea = {
  id: 'v-2',
  title: 'Bridge Idea',
  durationSec: 92,
  audioUri: 'jackdaw://nest/v-2.m4a',
  synced: false,
  kind: 'idea',
}

const MASTER_A: VoiceIdea = {
  id: 'm-1',
  title: 'Final Mix v3',
  durationSec: 184,
  audioUri: 'jackdaw://nest/m-1.wav',
  synced: true,
  kind: 'master',
}

const IDEAS = [IDEA_A, IDEA_B, MASTER_A]

const NOOP = {
  onPlay: () => {},
  onPause: () => {},
  onRename: () => {},
  onDelete: () => {},
  onShare: () => {},
}

// VoiceIdeaRow's contract — delete is a list concern (menu → confirm), so the row
// has no onDelete.
const ROW_NOOP = {
  onPlay: () => {},
  onPause: () => {},
  onRename: () => {},
  onShare: () => {},
}

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats seconds as m:ss with zero-padded seconds', () => {
    expect(formatDuration(37)).toBe('0:37')
    expect(formatDuration(92)).toBe('1:32')
    expect(formatDuration(184)).toBe('3:04')
    expect(formatDuration(0)).toBe('0:00')
  })
})

// ─── VoiceIdeaRow ───────────────────────────────────────────────────────────────

describe('VoiceIdeaRow', () => {
  it('renders title and m:ss duration', () => {
    render(<VoiceIdeaRow idea={IDEA_A} {...ROW_NOOP} />)
    expect(screen.getByText('Morning Hook')).toBeTruthy()
    expect(screen.getByText('0:37')).toBeTruthy()
  })

  it('play button is labelled "Play …" when not playing and fires onPlay', () => {
    const onPlay = vi.fn()
    render(<VoiceIdeaRow idea={IDEA_A} {...ROW_NOOP} onPlay={onPlay} />)
    const btn = screen.getByRole('button', { name: 'Play Morning Hook' })
    expect(btn.getAttribute('aria-pressed')).toBeNull() // relabel model, no aria-pressed
    fireEvent.click(btn)
    expect(onPlay).toHaveBeenCalledWith('v-1')
  })

  it('play button relabels to "Pause …" and fires onPause when playing', () => {
    const onPause = vi.fn()
    render(<VoiceIdeaRow idea={IDEA_A} {...ROW_NOOP} playing onPause={onPause} />)
    const btn = screen.getByRole('button', { name: 'Pause Morning Hook' })
    fireEvent.click(btn)
    expect(onPause).toHaveBeenCalledWith('v-1')
  })

  it('lights the playing row (data-playing)', () => {
    const { container } = render(<VoiceIdeaRow idea={IDEA_A} {...ROW_NOOP} playing />)
    expect(container.querySelector('[data-playing]')).toBeTruthy()
  })

  it('share icon fires onShare', () => {
    const onShare = vi.fn()
    render(<VoiceIdeaRow idea={IDEA_A} {...ROW_NOOP} onShare={onShare} />)
    fireEvent.click(screen.getByRole('button', { name: 'Share Morning Hook' }))
    expect(onShare).toHaveBeenCalledWith('v-1')
  })

  it('inline rename: Enter commits the new title', () => {
    const onRename = vi.fn()
    render(<VoiceIdeaRow idea={IDEA_A} {...ROW_NOOP} renaming onRename={onRename} />)
    const input = screen.getByRole('textbox', { name: /rename/i }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Sunrise Hook' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('v-1', 'Sunrise Hook')
  })

  it('inline rename: Escape cancels without committing', () => {
    const onRename = vi.fn()
    const onRenameCancel = vi.fn()
    render(
      <VoiceIdeaRow
        idea={IDEA_A}
        {...ROW_NOOP}
        renaming
        onRename={onRename}
        onRenameCancel={onRenameCancel}
      />,
    )
    const input = screen.getByRole('textbox', { name: /rename/i })
    fireEvent.change(input, { target: { value: 'Discarded' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(onRenameCancel).toHaveBeenCalled()
  })

  it('shows a kind tag for masters', () => {
    render(<VoiceIdeaRow idea={MASTER_A} {...ROW_NOOP} />)
    expect(screen.getByText(/master/i)).toBeTruthy()
  })
})

// ─── VoiceIdeaList ──────────────────────────────────────────────────────────────

describe('VoiceIdeaList', () => {
  it('renders every idea as a row', () => {
    render(<VoiceIdeaList ideas={IDEAS} {...NOOP} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('filter (radiogroup) narrows to Ideas only', () => {
    render(<VoiceIdeaList ideas={IDEAS} {...NOOP} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Ideas' }))
    expect(screen.getByText('Morning Hook')).toBeTruthy()
    expect(screen.getByText('Bridge Idea')).toBeTruthy()
    expect(screen.queryByText('Final Mix v3')).toBeNull()
  })

  it('filter narrows to Masters only', () => {
    render(<VoiceIdeaList ideas={IDEAS} {...NOOP} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Masters' }))
    expect(screen.getByText('Final Mix v3')).toBeTruthy()
    expect(screen.queryByText('Morning Hook')).toBeNull()
  })

  it('shows the empty state when there are no ideas', () => {
    render(<VoiceIdeaList ideas={[]} {...NOOP} />)
    expect(screen.getByTestId('voice-empty')).toBeTruthy()
  })

  it('shows the filtered-empty state when a filter matches nothing', () => {
    render(<VoiceIdeaList ideas={[IDEA_A, IDEA_B]} {...NOOP} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Masters' }))
    expect(screen.getByTestId('voice-empty-filtered')).toBeTruthy()
  })

  it('opens the ⋮ menu and lists rename / share / delete', () => {
    render(<VoiceIdeaList ideas={[IDEA_A]} {...NOOP} />)
    fireEvent.click(screen.getByRole('button', { name: 'Morning Hook options' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('Rename')).toBeTruthy()
    expect(within(menu).getByText('Share')).toBeTruthy()
    expect(within(menu).getByText('Delete')).toBeTruthy()
  })

  it('menu → Delete opens a confirm dialog; confirming fires onDelete', () => {
    const onDelete = vi.fn()
    render(<VoiceIdeaList ideas={[IDEA_A]} {...NOOP} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Morning Hook options' }))
    fireEvent.click(within(screen.getByRole('menu')).getByText('Delete'))
    // Confirm dialog appears
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Morning Hook/)).toBeTruthy()
    expect(onDelete).not.toHaveBeenCalled() // not yet — needs confirm
    fireEvent.click(within(dialog).getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('v-1')
  })

  it('menu → Delete then Cancel does NOT fire onDelete', () => {
    const onDelete = vi.fn()
    render(<VoiceIdeaList ideas={[IDEA_A]} {...NOOP} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Morning Hook options' }))
    fireEvent.click(within(screen.getByRole('menu')).getByText('Delete'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('menu → Share fires onShare', () => {
    const onShare = vi.fn()
    render(<VoiceIdeaList ideas={[IDEA_A]} {...NOOP} onShare={onShare} />)
    fireEvent.click(screen.getByRole('button', { name: 'Morning Hook options' }))
    fireEvent.click(within(screen.getByRole('menu')).getByText('Share'))
    expect(onShare).toHaveBeenCalledWith('v-1')
  })

  it('menu → Rename switches the row into inline rename and commits onRename', () => {
    const onRename = vi.fn()
    render(<VoiceIdeaList ideas={[IDEA_A]} {...NOOP} onRename={onRename} />)
    fireEvent.click(screen.getByRole('button', { name: 'Morning Hook options' }))
    fireEvent.click(within(screen.getByRole('menu')).getByText('Rename'))
    const input = screen.getByRole('textbox', { name: /rename/i })
    fireEvent.change(input, { target: { value: 'Sunrise Hook' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('v-1', 'Sunrise Hook')
  })

  it('play is controlled via playingId and relabels the active row', () => {
    const onPause = vi.fn()
    render(<VoiceIdeaList ideas={[IDEA_A, IDEA_B]} {...NOOP} playingId="v-1" onPause={onPause} />)
    expect(screen.getByRole('button', { name: 'Pause Morning Hook' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Play Bridge Idea' })).toBeTruthy()
  })
})
