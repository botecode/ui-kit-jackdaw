// src/components/FolderTrackHeader/FolderTrackHeader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { FolderTrackHeader } from './FolderTrackHeader'
import type { FolderTrack } from './FolderTrackHeader'

// jsdom's localStorage stub is incomplete — replace with a functional in-memory mock.
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
beforeAll(() => { vi.stubGlobal('localStorage', localStorageMock) })

const BASE_FOLDER: FolderTrack = {
  id: 'f1', name: 'Drums Bus', color: '#7ec8a4',
  parentId: null, childCount: 4,
  muted: false, soloed: false,
  volumeDb: 0, pan: 0,
  plugins: [], chainEnabled: true, selected: false,
}

const noop = () => {}
const BASE_PROPS = {
  track: BASE_FOLDER,
  onRename: noop, onMute: noop, onSolo: noop,
  onVolume: noop, onPan: noop,
  onToggleChain: noop, onTogglePlugin: noop, onReorder: noop,
  onRemovePlugin: noop, onAddPlugin: noop, onOpenPlugin: noop, onSelect: noop,
}

beforeEach(() => {
  localStorage.clear()
})

describe('FolderTrackHeader — structure', () => {
  it('renders as role=group with track name as aria-label', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toBeInTheDocument()
  })

  it('carries data-variant="folder"', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-variant', 'folder')
  })

  it('renders FxChip button', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /fx chain/i })).toBeInTheDocument()
  })

  it('renders Mute and Solo buttons', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
  })

  it('renders group volume fader (role=slider)', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /group volume/i })).toBeInTheDocument()
  })

  it('does NOT render ArmButton', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /arm for recording/i })).not.toBeInTheDocument()
  })

  it('does NOT render audio input selector', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: /audio input/i })).not.toBeInTheDocument()
  })

  it('renders PanKnob element with aria-label containing "Pan"', () => {
    const { container } = render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(container.querySelector('[aria-label*="Pan"]')).toBeInTheDocument()
  })

  it('calls onSelect when root group is clicked', () => {
    const onSelect = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('group', { name: 'Drums Bus' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('calls onMute when Mute button is clicked', () => {
    const onMute = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onMute={onMute} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
  })

  it('calls onSolo when Solo button is clicked', () => {
    const onSolo = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onSolo).toHaveBeenCalledTimes(1)
  })
})

describe('FolderTrackHeader — data-* states', () => {
  it('has data-selected when track.selected=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, selected: true }} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-selected')
  })

  it('has data-muted when track.muted=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, muted: true }} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-muted')
  })

  it('has data-soloed when track.soloed=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, soloed: true }} />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-soloed')
  })

  it('has data-disabled when disabled=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} disabled />)
    expect(screen.getByRole('group', { name: 'Drums Bus' })).toHaveAttribute('data-disabled')
  })
})

describe('FolderTrackHeader — disclosure (collapse)', () => {
  it('renders a disclosure button expanded by default (aria-expanded=true)', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    const btn = screen.getByRole('button', { name: /collapse drums bus/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('disclosure has data-open when expanded', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /collapse drums bus/i })).toHaveAttribute('data-open')
  })

  it('clicking disclosure toggles to collapsed', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse drums bus/i }))
    const btn = screen.getByRole('button', { name: /expand drums bus/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).not.toHaveAttribute('data-open')
  })

  it('persists collapsed state to localStorage', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse drums bus/i }))
    expect(localStorage.getItem('jackdaw.folder.f1.open')).toBe('false')
  })

  it('persists expanded state to localStorage', () => {
    localStorage.setItem('jackdaw.folder.f1.open', 'false')
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /expand drums bus/i }))
    expect(localStorage.getItem('jackdaw.folder.f1.open')).toBe('true')
  })

  it('reads initial collapsed state from localStorage', () => {
    localStorage.setItem('jackdaw.folder.f1.open', 'false')
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /expand drums bus/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('fires onToggleCollapse with true when collapsing', () => {
    const onToggleCollapse = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onToggleCollapse={onToggleCollapse} />)
    fireEvent.click(screen.getByRole('button', { name: /collapse drums bus/i }))
    expect(onToggleCollapse).toHaveBeenCalledWith(true)
  })

  it('fires onToggleCollapse with false when expanding', () => {
    localStorage.setItem('jackdaw.folder.f1.open', 'false')
    const onToggleCollapse = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onToggleCollapse={onToggleCollapse} />)
    fireEvent.click(screen.getByRole('button', { name: /expand drums bus/i }))
    expect(onToggleCollapse).toHaveBeenCalledWith(false)
  })
})

describe('FolderTrackHeader — name editing', () => {
  it('shows an input with current name on double-click', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    expect(screen.getByRole('textbox', { name: /track name/i })).toHaveValue('Drums Bus')
  })

  it('calls onRename with trimmed value on Enter and exits edit mode', () => {
    const onRename = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '  Group Bus  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Group Bus')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not call onRename on Escape; restores original name', () => {
    const onRename = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByText('Drums Bus')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('falls back to original name when input is empty on Enter', () => {
    const onRename = vi.fn()
    render(<FolderTrackHeader {...BASE_PROPS} onRename={onRename} />)
    fireEvent.dblClick(screen.getByText('Drums Bus'))
    const input = screen.getByRole('textbox', { name: /track name/i })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRename).toHaveBeenCalledWith('Drums Bus')
  })
})

describe('FolderTrackHeader — meter visibility (ears-first)', () => {
  it('meter is hidden on a normal unselected track', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('meter appears when track.selected=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} track={{ ...BASE_FOLDER, selected: true }} meterLevel={-12} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when clipping=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} clipping meterLevel={2} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('meter appears when showAllMeters=true', () => {
    render(<FolderTrackHeader {...BASE_PROPS} showAllMeters meterLevel={-18} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('fader is always present regardless of meter visibility', () => {
    render(<FolderTrackHeader {...BASE_PROPS} />)
    expect(screen.getByRole('slider', { name: /group volume/i })).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})
