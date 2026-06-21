import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { Versions } from './Versions'
import type { VersionEntry, VersionDiff } from './Versions'

const V1: VersionEntry = { id: 'v1', name: 'Take 1', date: '2024-01-01T10:00:00Z' }
const V2: VersionEntry = { id: 'v2', name: 'Take 2', date: '2024-01-02T12:30:00Z', note: 'Bridge added' }
const V3: VersionEntry = { id: 'v3', name: 'Take 3', date: '2024-01-03T09:15:00Z', current: true }

const DIFF: VersionDiff = {
  tracksAdded: 2,
  tracksRemoved: 0,
  clipsAdded: 5,
  clipsRemoved: 1,
  clipsModified: 0,
  lyricsChanged: true,
}

const noop = vi.fn()

function base(overrides = {}) {
  return {
    versions: [V3, V2, V1],
    selected: [] as string[],
    onSelect: vi.fn(),
    onCompare: vi.fn(),
    onRename: vi.fn(),
    onRestore: vi.fn(),
    ...overrides,
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Versions rendering', () => {
  it('renders empty state when versions is empty', () => {
    const { getByText } = render(
      <Versions versions={[]} selected={[]} onSelect={noop} onCompare={noop} onRename={noop} onRestore={noop} />,
    )
    expect(getByText('No versions yet.')).toBeInTheDocument()
  })

  it('renders data-empty attribute on empty root', () => {
    const { container } = render(
      <Versions versions={[]} selected={[]} onSelect={noop} onCompare={noop} onRename={noop} onRestore={noop} />,
    )
    expect(container.firstChild).toHaveAttribute('data-empty')
  })

  it('renders a listbox when versions are present', () => {
    const { getByRole } = render(<Versions {...base()} />)
    expect(getByRole('listbox', { name: 'Version history' })).toBeInTheDocument()
  })

  it('renders aria-multiselectable on the listbox', () => {
    const { getByRole } = render(<Versions {...base()} />)
    expect(getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true')
  })

  it('renders one option per version', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    expect(getAllByRole('option')).toHaveLength(3)
  })

  it('shows each version name', () => {
    const { getByText } = render(<Versions {...base()} />)
    expect(getByText('Take 1')).toBeInTheDocument()
    expect(getByText('Take 2')).toBeInTheDocument()
    expect(getByText('Take 3')).toBeInTheDocument()
  })

  it('shows Current badge on the current version', () => {
    const { getByLabelText } = render(<Versions {...base()} />)
    expect(getByLabelText('Current version')).toBeInTheDocument()
  })

  it('data-current attribute set on current version row', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    const options = getAllByRole('option')
    // V3 is current, first in list (newest→oldest)
    expect(options[0]).toHaveAttribute('data-current')
    expect(options[1]).not.toHaveAttribute('data-current')
  })

  it('shows note text when provided', () => {
    const { getByText } = render(<Versions {...base()} />)
    expect(getByText('Bridge added')).toBeInTheDocument()
  })

  it('renders author avatar initials when author is provided', () => {
    const withAuthor: VersionEntry = { ...V1, author: 'Jane Smith' }
    const { getByLabelText } = render(
      <Versions {...base({ versions: [withAuthor] })} />,
    )
    expect(getByLabelText('Jane Smith')).toBeInTheDocument()
  })

  it('data-size="md" by default', () => {
    const { container } = render(<Versions {...base()} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(<Versions {...base({ size: 'sm' })} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })
})

// ─── Selection ────────────────────────────────────────────────────────────────

describe('Versions selection', () => {
  it('unselected options have aria-selected="false"', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    getAllByRole('option').forEach(opt => {
      expect(opt.getAttribute('aria-selected')).toBe('false')
    })
  })

  it('selected option has aria-selected="true"', () => {
    const { getAllByRole } = render(<Versions {...base({ selected: ['v2'] })} />)
    const options = getAllByRole('option')
    // V2 is second in the list [V3, V2, V1]
    expect(options[1].getAttribute('aria-selected')).toBe('true')
    expect(options[0].getAttribute('aria-selected')).toBe('false')
  })

  it('selected option has data-selected attribute', () => {
    const { getAllByRole } = render(<Versions {...base({ selected: ['v2'] })} />)
    const options = getAllByRole('option')
    expect(options[1]).toHaveAttribute('data-selected')
    expect(options[0]).not.toHaveAttribute('data-selected')
  })

  it('clicking an option calls onSelect with its id', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(<Versions {...base({ onSelect })} />)
    fireEvent.click(getAllByRole('option')[1])
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('v2')
  })

  it('clicking the current version option calls onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(<Versions {...base({ onSelect })} />)
    fireEvent.click(getAllByRole('option')[0])
    expect(onSelect).toHaveBeenCalledWith('v3')
  })
})

// ─── Compare ──────────────────────────────────────────────────────────────────

describe('Versions compare', () => {
  it('calls onCompare(a, b) when two versions are selected', () => {
    const onCompare = vi.fn()
    render(<Versions {...base({ selected: ['v3', 'v1'], onCompare })} />)
    expect(onCompare).toHaveBeenCalledWith('v3', 'v1')
  })

  it('does not call onCompare when fewer than 2 versions are selected', () => {
    const onCompare = vi.fn()
    render(<Versions {...base({ selected: ['v1'], onCompare })} />)
    expect(onCompare).not.toHaveBeenCalled()
  })

  it('shows diff panel when 2 are selected', () => {
    const { getByLabelText } = render(
      <Versions {...base({ selected: ['v3', 'v1'] })} />,
    )
    expect(getByLabelText('Comparison')).toBeInTheDocument()
  })

  it('shows diff rows when diff prop provided', () => {
    const { getByText } = render(
      <Versions {...base({ selected: ['v3', 'v1'], diff: DIFF })} />,
    )
    expect(getByText('Tracks')).toBeInTheDocument()
    expect(getByText('Clips')).toBeInTheDocument()
    expect(getByText('Lyrics')).toBeInTheDocument()
  })

  it('shows loading state when diff is not yet provided', () => {
    const { getByText } = render(
      <Versions {...base({ selected: ['v3', 'v1'] })} />,
    )
    expect(getByText(/Loading diff/)).toBeInTheDocument()
  })

  it('diff panel shows version names', () => {
    const { getByLabelText } = render(
      <Versions {...base({ selected: ['v3', 'v1'], diff: DIFF })} />,
    )
    // Names appear in both the timeline rows and the diff header — scope to the panel
    const panel = getByLabelText('Comparison')
    expect(within(panel).getByText('Take 3')).toBeInTheDocument()
    expect(within(panel).getByText('Take 1')).toBeInTheDocument()
  })

  it('diff added count shows with + prefix', () => {
    const { getByLabelText } = render(
      <Versions {...base({ selected: ['v3', 'v1'], diff: DIFF })} />,
    )
    expect(getByLabelText('2 added')).toBeInTheDocument()
  })

  it('diff removed count shows with − prefix', () => {
    const { getByLabelText } = render(
      <Versions {...base({ selected: ['v3', 'v1'], diff: DIFF })} />,
    )
    expect(getByLabelText('1 removed')).toBeInTheDocument()
  })

  it('shows no-changes message when diff is empty', () => {
    const emptyDiff: VersionDiff = {
      tracksAdded: 0, tracksRemoved: 0,
      clipsAdded: 0, clipsRemoved: 0, clipsModified: 0,
      lyricsChanged: false,
    }
    const { getByText } = render(
      <Versions {...base({ selected: ['v3', 'v1'], diff: emptyDiff })} />,
    )
    expect(getByText('No changes between these versions.')).toBeInTheDocument()
  })

  it('compare index "1" appears on the first selected node', () => {
    const { container } = render(
      <Versions {...base({ selected: ['v3', 'v1'] })} />,
    )
    const compareIndices = container.querySelectorAll('[class*="compareIndex"]')
    expect(compareIndices[0].textContent).toBe('1')
    expect(compareIndices[1].textContent).toBe('2')
  })
})

// ─── Rename ───────────────────────────────────────────────────────────────────

describe('Versions rename', () => {
  it('shows Rename button when a version is selected', () => {
    const { getByRole } = render(
      <Versions {...base({ selected: ['v2'] })} />,
    )
    expect(getByRole('button', { name: 'Rename Take 2' })).toBeInTheDocument()
  })

  it('clicking Rename shows an inline text input', () => {
    const { getByRole, getByLabelText } = render(
      <Versions {...base({ selected: ['v2'] })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Rename Take 2' }))
    expect(getByLabelText('Rename version')).toBeInTheDocument()
  })

  it('rename input is pre-filled with the current version name', () => {
    const { getByRole, getByLabelText } = render(
      <Versions {...base({ selected: ['v2'] })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Rename Take 2' }))
    const input = getByLabelText('Rename version') as HTMLInputElement
    expect(input.value).toBe('Take 2')
  })

  it('blur commits the rename and calls onRename', () => {
    const onRename = vi.fn()
    const { getByRole, getByLabelText } = render(
      <Versions {...base({ selected: ['v2'], onRename })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Rename Take 2' }))
    const input = getByLabelText('Rename version')
    fireEvent.change(input, { target: { value: 'Bridge Session' } })
    fireEvent.blur(input)
    expect(onRename).toHaveBeenCalledWith('v2', 'Bridge Session')
  })

  it('Enter commits the rename', () => {
    const onRename = vi.fn()
    const { getByRole, getByLabelText } = render(
      <Versions {...base({ selected: ['v2'], onRename })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Rename Take 2' }))
    const input = getByLabelText('Rename version')
    fireEvent.change(input, { target: { value: 'Chorus Fix' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('v2', 'Chorus Fix')
  })

  it('Escape cancels the rename without calling onRename', () => {
    const onRename = vi.fn()
    const { getByRole, getByLabelText, queryByLabelText } = render(
      <Versions {...base({ selected: ['v2'], onRename })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Rename Take 2' }))
    const input = getByLabelText('Rename version')
    fireEvent.change(input, { target: { value: 'Changed Mind' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(queryByLabelText('Rename version')).toBeNull()
  })

  it('does not call onRename with blank value on blur', () => {
    const onRename = vi.fn()
    const { getByRole, getByLabelText } = render(
      <Versions {...base({ selected: ['v2'], onRename })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Rename Take 2' }))
    const input = getByLabelText('Rename version')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(onRename).not.toHaveBeenCalled()
  })
})

// ─── Restore ──────────────────────────────────────────────────────────────────

describe('Versions restore', () => {
  it('shows Restore button when a non-current version is selected', () => {
    const { getByRole } = render(
      <Versions {...base({ selected: ['v1'] })} />,
    )
    expect(getByRole('button', { name: 'Restore Take 1 as new Take' })).toBeInTheDocument()
  })

  it('clicking Restore calls onRestore with the version id', () => {
    const onRestore = vi.fn()
    const { getByRole } = render(
      <Versions {...base({ selected: ['v1'], onRestore })} />,
    )
    fireEvent.click(getByRole('button', { name: 'Restore Take 1 as new Take' }))
    expect(onRestore).toHaveBeenCalledWith('v1')
  })

  it('does NOT show Restore button when the current version is selected', () => {
    const { queryByRole } = render(
      <Versions {...base({ selected: ['v3'] })} />,
    )
    expect(queryByRole('button', { name: /Restore/ })).toBeNull()
  })
})

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('Versions keyboard navigation', () => {
  it('ArrowDown moves tabIndex to the next option', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    const options = getAllByRole('option')
    // Initial focus on current (idx 0, which is V3)
    expect(options[0].tabIndex).toBe(0)
    fireEvent.keyDown(options[0], { key: 'ArrowDown' })
    expect(options[1].tabIndex).toBe(0)
    expect(options[0].tabIndex).toBe(-1)
  })

  it('ArrowUp moves tabIndex to the previous option', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    const options = getAllByRole('option')
    // Start at first item, move down then back up
    fireEvent.keyDown(options[0], { key: 'ArrowDown' })
    fireEvent.keyDown(options[1], { key: 'ArrowUp' })
    expect(options[0].tabIndex).toBe(0)
    expect(options[1].tabIndex).toBe(-1)
  })

  it('ArrowDown does not go past the last option', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    const options = getAllByRole('option')
    // Move to last
    fireEvent.keyDown(options[0], { key: 'ArrowDown' })
    fireEvent.keyDown(options[1], { key: 'ArrowDown' })
    // Try to go further
    fireEvent.keyDown(options[2], { key: 'ArrowDown' })
    expect(options[2].tabIndex).toBe(0)
  })

  it('End key moves focus to the last option', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    const options = getAllByRole('option')
    fireEvent.keyDown(options[0], { key: 'End' })
    expect(options[options.length - 1].tabIndex).toBe(0)
  })

  it('Home key moves focus to the first option', () => {
    const { getAllByRole } = render(<Versions {...base()} />)
    const options = getAllByRole('option')
    fireEvent.keyDown(options[0], { key: 'ArrowDown' })
    fireEvent.keyDown(options[1], { key: 'Home' })
    expect(options[0].tabIndex).toBe(0)
  })

  it('Enter on focused option calls onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(<Versions {...base({ onSelect })} />)
    const options = getAllByRole('option')
    fireEvent.keyDown(options[0], { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('v3')
  })

  it('Space on focused option calls onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(<Versions {...base({ onSelect })} />)
    const options = getAllByRole('option')
    fireEvent.keyDown(options[0], { key: ' ' })
    expect(onSelect).toHaveBeenCalledWith('v3')
  })
})
