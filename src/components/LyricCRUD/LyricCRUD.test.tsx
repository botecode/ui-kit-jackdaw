import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LyricCard, LyricList } from './LyricCRUD'
import type { LyricIdea } from './LyricCRUD'

const noop = vi.fn()
beforeEach(() => vi.clearAllMocks())

const LYRIC: LyricIdea = {
  id: 'l1',
  title: 'Rooftop in the Rain',
  text: 'First line of the verse\nSecond line keeps going\nThird line is hidden',
  comments: 'needs a bridge',
  createdAt: Date.parse('2026-06-12T10:00:00Z'),
}

const LYRICS: LyricIdea[] = [
  LYRIC,
  { id: 'l2', title: 'Slow Burn', text: 'a quiet one', comments: '', createdAt: Date.parse('2026-05-01T10:00:00Z') },
  { id: 'l3', title: 'No Words', text: '', comments: 'just a title for now', createdAt: Date.parse('2026-04-01T10:00:00Z') },
]

// ─── LyricCard — content ─────────────────────────────────────────────────────

describe('LyricCard — content', () => {
  it('renders the title', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.getByText('Rooftop in the Rain')).toBeInTheDocument()
  })

  it('shows only the first two lines as the excerpt', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    const ex = screen.getByTestId('lyric-excerpt')
    expect(ex.textContent).toContain('First line of the verse')
    expect(ex.textContent).toContain('Second line keeps going')
    expect(ex.textContent).not.toContain('Third line is hidden')
  })

  it('renders the comment in the accent slot', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.getByTestId('lyric-comment').textContent).toContain('needs a bridge')
  })

  it('omits the comment slot when there is no comment', () => {
    render(<LyricCard lyric={LYRICS[1]} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.queryByTestId('lyric-comment')).not.toBeInTheDocument()
  })

  it('shows a placeholder when the lyric body is empty', () => {
    render(<LyricCard lyric={LYRICS[2]} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.queryByTestId('lyric-excerpt')).not.toBeInTheDocument()
    expect(screen.getByText('No words yet')).toBeInTheDocument()
  })

  it('renders a machine-readable <time> for createdAt', () => {
    const { container } = render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    const time = container.querySelector('time')
    expect(time).toBeTruthy()
    expect(time).toHaveAttribute('dateTime', '2026-06-12T10:00:00.000Z')
  })

  it('data-size reflects the size prop', () => {
    const { container, rerender } = render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(container.querySelector('article')).toHaveAttribute('data-size', 'md')
    rerender(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} size="sm" />)
    expect(container.querySelector('article')).toHaveAttribute('data-size', 'sm')
  })

  it('marks the card selected with aria-current + data-selected', () => {
    const { container } = render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} selected />)
    const card = container.querySelector('article')!
    expect(card).toHaveAttribute('data-selected')
    expect(card).toHaveAttribute('aria-current', 'true')
  })
})

// ─── LyricCard — edit intent ─────────────────────────────────────────────────

describe('LyricCard — edit intent', () => {
  it('clicking the title fires onEdit with the id (opens the editor)', () => {
    const onEdit = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={onEdit} onShare={noop} onDelete={noop} />)
    fireEvent.click(screen.getByTestId('lyric-title'))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('disabled card does not fire onEdit from the title', () => {
    const onEdit = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={onEdit} onShare={noop} onDelete={noop} disabled />)
    fireEvent.click(screen.getByTestId('lyric-title'))
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('disabled card has an inert ⋮ button', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} disabled />)
    expect(screen.getByTestId('lyric-menu-btn')).toBeDisabled()
  })
})

// ─── LyricCard — ⋮ menu ──────────────────────────────────────────────────────

describe('LyricCard — ⋮ menu', () => {
  it('⋮ button opens the menu with edit / share / delete', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Share' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  it('⋮ button reflects open state via aria-expanded', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    const btn = screen.getByTestId('lyric-menu-btn')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('menu Edit fires onEdit', () => {
    const onEdit = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={onEdit} onShare={noop} onDelete={noop} />)
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('menu Share fires onShare', () => {
    const onShare = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={onShare} onDelete={noop} />)
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share' }))
    expect(onShare).toHaveBeenCalledWith('l1')
  })
})

// ─── LyricCard — delete with confirm ─────────────────────────────────────────

describe('LyricCard — delete confirm', () => {
  it('menu Delete opens a confirm dialog and does NOT delete yet', () => {
    const onDelete = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={onDelete} />)
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('confirm dialog names the lyric being deleted', () => {
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={noop} />)
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Rooftop in the Rain')).toBeInTheDocument()
  })

  it('Cancel closes the dialog without deleting', () => {
    const onDelete = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={onDelete} />)
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    fireEvent.click(screen.getByTestId('delete-cancel'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('confirming Delete fires onDelete once and closes the dialog', () => {
    const onDelete = vi.fn()
    render(<LyricCard lyric={LYRIC} onEdit={noop} onShare={noop} onDelete={onDelete} />)
    fireEvent.click(screen.getByTestId('lyric-menu-btn'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    fireEvent.click(screen.getByTestId('delete-confirm'))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('l1')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ─── LyricList ───────────────────────────────────────────────────────────────

describe('LyricList', () => {
  it('renders a card per lyric', () => {
    render(<LyricList lyrics={LYRICS} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.getByText('Rooftop in the Rain')).toBeInTheDocument()
    expect(screen.getByText('Slow Burn')).toBeInTheDocument()
    expect(screen.getByText('No Words')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('shows the empty state when there are no lyrics', () => {
    render(<LyricList lyrics={[]} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.getByTestId('lyric-empty')).toBeInTheDocument()
    expect(screen.getByText('Nothing written yet')).toBeInTheDocument()
  })

  it('empty state offers a create CTA when onNew is given', () => {
    const onNew = vi.fn()
    render(<LyricList lyrics={[]} onEdit={noop} onShare={noop} onDelete={noop} onNew={onNew} />)
    fireEvent.click(screen.getByTestId('empty-new-btn'))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('header New button fires onNew', () => {
    const onNew = vi.fn()
    render(<LyricList lyrics={LYRICS} onEdit={noop} onShare={noop} onDelete={noop} onNew={onNew} />)
    fireEvent.click(screen.getByTestId('new-btn'))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('does not render a New button when onNew is absent', () => {
    render(<LyricList lyrics={LYRICS} onEdit={noop} onShare={noop} onDelete={noop} />)
    expect(screen.queryByTestId('new-btn')).not.toBeInTheDocument()
  })

  it('shows skeletons while loading and no cards', () => {
    render(<LyricList lyrics={LYRICS} onEdit={noop} onShare={noop} onDelete={noop} loading />)
    expect(screen.getByTestId('lyric-loading')).toBeInTheDocument()
    expect(screen.queryByText('Rooftop in the Rain')).not.toBeInTheDocument()
  })

  it('shows the error face on error', () => {
    render(<LyricList lyrics={[]} onEdit={noop} onShare={noop} onDelete={noop} error="offline" />)
    const err = screen.getByTestId('lyric-error')
    expect(err).toBeInTheDocument()
    expect(within(err).getByText('offline')).toBeInTheDocument()
  })

  it('highlights the selected lyric', () => {
    const { container } = render(
      <LyricList lyrics={LYRICS} onEdit={noop} onShare={noop} onDelete={noop} selectedId="l2" />,
    )
    const selected = container.querySelectorAll('article[data-selected]')
    expect(selected).toHaveLength(1)
    expect(within(selected[0] as HTMLElement).getByText('Slow Burn')).toBeInTheDocument()
  })

  it('forwards delete from a card through the list', () => {
    const onDelete = vi.fn()
    render(<LyricList lyrics={LYRICS} onEdit={noop} onShare={noop} onDelete={onDelete} />)
    // open the first card's menu → Delete → confirm
    fireEvent.click(screen.getAllByTestId('lyric-menu-btn')[0])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    fireEvent.click(screen.getByTestId('delete-confirm'))
    expect(onDelete).toHaveBeenCalledWith('l1')
  })
})
