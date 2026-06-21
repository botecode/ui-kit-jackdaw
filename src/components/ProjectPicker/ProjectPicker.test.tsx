// src/components/ProjectPicker/ProjectPicker.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ProjectPicker } from './ProjectPicker'
import type { ProjectRecord } from './ProjectPicker'

const PROJECTS: ProjectRecord[] = [
  { id: 'p1', name: 'Song Nice',  path: '~/Music/song-nice',  lastOpened: '2026-06-20T10:00:00Z' },
  { id: 'p2', name: 'Demo Track', path: '~/Music/demo-track', lastOpened: '2026-06-18T08:00:00Z' },
  { id: 'p3', name: 'Outro Loop', path: '~/Music/outro-loop', lastOpened: '2026-06-15T12:00:00Z' },
]

const RECENT: ProjectRecord[] = [
  { id: 'p1', name: 'Song Nice', path: '~/Music/song-nice', lastOpened: '2026-06-20T10:00:00Z' },
]

const BASE = {
  open:          true as const,
  onClose:       vi.fn(),
  projects:      PROJECTS,
  recent:        RECENT,
  onNew:         vi.fn(),
  onNewFromCode: vi.fn(),
  onOpen:        vi.fn(),
  onBrowse:      vi.fn(),
  onPreview:     vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ProjectPicker — rendering', () => {
  it('renders role="dialog" when open=true', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<ProjectPicker {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the brand name "Jackdaw"', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByText('Jackdaw')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByText('Open a project to start writing.')).toBeInTheDocument()
  })

  it('renders "New" action card', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('button', { name: /^new$/i })).toBeInTheDocument()
  })

  it('renders "New from code" action card', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('button', { name: /new from code/i })).toBeInTheDocument()
  })

  it('renders the project listbox', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('listbox', { name: 'All projects' })).toBeInTheDocument()
  })

  it('renders all project names in the list', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    for (const p of PROJECTS) {
      expect(within(listbox).getByText(p.name)).toBeInTheDocument()
    }
  })

  it('renders a play button for each project', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    for (const p of PROJECTS) {
      expect(within(listbox).getByRole('button', { name: `Preview ${p.name}` })).toBeInTheDocument()
    }
  })

  it('renders Recent section heading when recent has entries', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByText('Recent')).toBeInTheDocument()
  })

  it('hides Recent section when recent is empty', () => {
    render(<ProjectPicker {...BASE} recent={[]} />)
    expect(screen.queryByText('Recent')).not.toBeInTheDocument()
  })

  it('renders "Browse…" button', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('button', { name: 'Browse…' })).toBeInTheDocument()
  })

  it('has aria-label="Open a project" on the dialog', () => {
    render(<ProjectPicker {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Open a project')
  })
})

// ── Empty state ────────────────────────────────────────────────────────────────

describe('ProjectPicker — empty state', () => {
  it('shows empty-state message when projects=[]', () => {
    render(<ProjectPicker {...BASE} projects={[]} />)
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
  })

  it('does not render the listbox when projects=[]', () => {
    render(<ProjectPicker {...BASE} projects={[]} />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('still renders the action cards in empty state', () => {
    render(<ProjectPicker {...BASE} projects={[]} />)
    expect(screen.getByRole('button', { name: /^new$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new from code/i })).toBeInTheDocument()
  })
})

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe('ProjectPicker — callbacks', () => {
  it('clicking "New" calls onNew', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /^new$/i }))
    expect(BASE.onNew).toHaveBeenCalledTimes(1)
  })

  it('clicking the close button calls onClose', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(BASE.onClose).toHaveBeenCalledTimes(1)
  })

  it('clicking "Browse…" calls onBrowse', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Browse…' }))
    expect(BASE.onBrowse).toHaveBeenCalledTimes(1)
  })

  it('clicking a project option calls onOpen with project id', () => {
    render(<ProjectPicker {...BASE} />)
    const options = screen.getAllByRole('option')
    fireEvent.click(options[1])
    expect(BASE.onOpen).toHaveBeenCalledWith(PROJECTS[1].id)
  })

  it('clicking a recent item calls onOpen with project id', () => {
    render(<ProjectPicker {...BASE} />)
    // Recent items are buttons in the recent section
    const recentSection = screen.getByText('Recent').closest('div')!
    const recentBtn = recentSection.querySelector('button')!
    fireEvent.click(recentBtn)
    expect(BASE.onOpen).toHaveBeenCalledWith(RECENT[0].id)
  })
})

// ── New from code flow ────────────────────────────────────────────────────────

describe('ProjectPicker — new from code flow', () => {
  it('"New from code" button has aria-expanded=false initially', () => {
    render(<ProjectPicker {...BASE} />)
    const btn = screen.getByRole('button', { name: /new from code/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking "New from code" sets aria-expanded=true', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))
    expect(screen.getByRole('button', { name: /new from code/i }))
      .toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking "New from code" again collapses the panel (toggle)', () => {
    render(<ProjectPicker {...BASE} />)
    const btn = screen.getByRole('button', { name: /new from code/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('Share code input becomes available after expanding', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))
    expect(screen.getByLabelText(/share code/i)).toBeInTheDocument()
  })

  it('typing a code and submitting calls onNewFromCode with trimmed value', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))

    const input = screen.getByLabelText(/share code/i)
    fireEvent.change(input, { target: { value: '  abc-123  ' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(BASE.onNewFromCode).toHaveBeenCalledWith('abc-123')
  })

  it('submitting empty code does NOT call onNewFromCode', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))

    const input = screen.getByLabelText(/share code/i)
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(BASE.onNewFromCode).not.toHaveBeenCalled()
  })

  it('submitting whitespace-only code does NOT call onNewFromCode', () => {
    render(<ProjectPicker {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))

    const input = screen.getByLabelText(/share code/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(input.closest('form')!)

    expect(BASE.onNewFromCode).not.toHaveBeenCalled()
  })
})

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('ProjectPicker — project list keyboard navigation', () => {
  it('first project item has tabIndex=0 by default', () => {
    render(<ProjectPicker {...BASE} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('tabindex', '0')
    expect(options[1]).toHaveAttribute('tabindex', '-1')
  })

  it('first project item has aria-selected=true by default', () => {
    render(<ProjectPicker {...BASE} />)
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('ArrowDown moves roving focus to the next item', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    expect(options[0]).toHaveAttribute('tabindex', '-1')
    expect(options[1]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp from index 1 moves back to index 0', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })

    expect(options[0]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowDown does not go past the last item', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    for (let i = 0; i < PROJECTS.length + 5; i++) {
      fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    }

    expect(options[PROJECTS.length - 1]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp does not go above the first item', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')
    const options = screen.getAllByRole('option')

    fireEvent.keyDown(listbox, { key: 'ArrowUp' })
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })

    expect(options[0]).toHaveAttribute('tabindex', '0')
  })

  it('Enter on focused item calls onOpen with that project id', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(BASE.onOpen).toHaveBeenCalledWith(PROJECTS[1].id)
  })

  it('Space on focused item calls onOpen with that project id', () => {
    render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')

    fireEvent.keyDown(listbox, { key: ' ' })

    expect(BASE.onOpen).toHaveBeenCalledWith(PROJECTS[0].id)
  })

  it('clicking a project updates aria-selected to that item', () => {
    render(<ProjectPicker {...BASE} />)
    const options = screen.getAllByRole('option')

    fireEvent.click(options[2])

    expect(options[2]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
  })
})

// ── Preview / play button ─────────────────────────────────────────────────────

describe('ProjectPicker — preview', () => {
  it('renders a "Preview <name>" button for each project', () => {
    render(<ProjectPicker {...BASE} />)
    for (const p of PROJECTS) {
      expect(screen.getByRole('button', { name: `Preview ${p.name}` })).toBeInTheDocument()
    }
  })

  it('clicking a play button calls onPreview with the project id', () => {
    render(<ProjectPicker {...BASE} />)
    const btn = screen.getByRole('button', { name: `Preview ${PROJECTS[1].name}` })
    fireEvent.click(btn)
    expect(BASE.onPreview).toHaveBeenCalledWith(PROJECTS[1].id)
  })

  it('clicking play does NOT call onOpen', () => {
    render(<ProjectPicker {...BASE} />)
    const btn = screen.getByRole('button', { name: `Preview ${PROJECTS[0].name}` })
    fireEvent.click(btn)
    expect(BASE.onOpen).not.toHaveBeenCalled()
  })

  it('shows "Stop preview" button when previewingId matches the card', () => {
    render(<ProjectPicker {...BASE} previewingId={PROJECTS[1].id} />)
    expect(screen.getByRole('button', { name: 'Stop preview' })).toBeInTheDocument()
  })

  it('clicking "Stop preview" calls onPreview(null)', () => {
    render(<ProjectPicker {...BASE} previewingId={PROJECTS[0].id} />)
    const btn = screen.getByRole('button', { name: 'Stop preview' })
    fireEvent.click(btn)
    expect(BASE.onPreview).toHaveBeenCalledWith(null)
  })

  it('card has data-playing attribute when previewingId matches', () => {
    render(<ProjectPicker {...BASE} previewingId={PROJECTS[2].id} />)
    const options = screen.getAllByRole('option')
    expect(options[2]).toHaveAttribute('data-playing')
    expect(options[0]).not.toHaveAttribute('data-playing')
    expect(options[1]).not.toHaveAttribute('data-playing')
  })

  it('only one card is playing at a time', () => {
    render(<ProjectPicker {...BASE} previewingId={PROJECTS[1].id} />)
    const options = screen.getAllByRole('option')
    const playingCards = options.filter(o => o.hasAttribute('data-playing'))
    expect(playingCards).toHaveLength(1)
    expect(playingCards[0]).toBe(options[1])
  })
})

// ── State reset on close/reopen ───────────────────────────────────────────────

describe('ProjectPicker — state reset', () => {
  it('code entry collapses when picker closes and reopens', () => {
    const { rerender } = render(<ProjectPicker {...BASE} />)

    fireEvent.click(screen.getByRole('button', { name: /new from code/i }))
    expect(screen.getByRole('button', { name: /new from code/i }))
      .toHaveAttribute('aria-expanded', 'true')

    rerender(<ProjectPicker {...BASE} open={false} />)
    rerender(<ProjectPicker {...BASE} open={true} />)

    expect(screen.getByRole('button', { name: /new from code/i }))
      .toHaveAttribute('aria-expanded', 'false')
  })

  it('roving focus resets to index 0 on reopen', () => {
    const { rerender } = render(<ProjectPicker {...BASE} />)
    const listbox = screen.getByRole('listbox')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    rerender(<ProjectPicker {...BASE} open={false} />)
    rerender(<ProjectPicker {...BASE} open={true} />)

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('tabindex', '0')
  })
})
