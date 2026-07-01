import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { FxPicker, type PluginInfo, type FxPickerProps } from './FxPicker'

const PLUGINS: PluginInfo[] = [
  { id: 'p1', name: 'Pro-Q 3', company: 'FabFilter', kind: 'fx', category: 'EQ', format: 'VST3', favorite: true, available: true, recentlyUsed: true },
  { id: 'p2', name: 'Pro-C 2', company: 'FabFilter', kind: 'fx', category: 'Dynamics', format: 'VST3', favorite: false, available: true },
  { id: 'p3', name: 'Serum', company: 'Xfer', kind: 'instrument', category: 'Synth', format: 'VST3', favorite: false, available: true, recentlyUsed: true },
  { id: 'p4', name: 'Omnisphere', company: 'Spectrasonics', kind: 'instrument', category: 'Synth', format: 'AU', favorite: true, available: false },
]

function makeProps(over: Partial<FxPickerProps> = {}): FxPickerProps {
  return {
    plugins: PLUGINS,
    onAdd: vi.fn(),
    onToggleFavorite: vi.fn(),
    onRescan: vi.fn(),
    ...over,
  }
}

beforeEach(() => vi.clearAllMocks())

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('FxPicker — rendering', () => {
  it('renders the browser region with its title', () => {
    render(<FxPicker {...makeProps()} />)
    expect(screen.getByRole('region', { name: 'Add plugin' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add Plugin' })).toBeInTheDocument()
  })

  it('lists every plugin by default', () => {
    render(<FxPicker {...makeProps()} />)
    for (const p of PLUGINS) expect(screen.getByText(p.name)).toBeInTheDocument()
  })

  it('shows the installed count (defaulting to plugins.length)', () => {
    render(<FxPicker {...makeProps()} />)
    expect(screen.getByText('4 plugins installed')).toBeInTheDocument()
  })

  it('honours an explicit installedCount', () => {
    render(<FxPicker {...makeProps({ installedCount: 243 })} />)
    expect(screen.getByText('243 plugins installed')).toBeInTheDocument()
  })

  it('uses the singular noun for a count of 1', () => {
    render(<FxPicker {...makeProps({ installedCount: 1 })} />)
    expect(screen.getByText('1 plugin installed')).toBeInTheDocument()
  })

  it('renders the kind + category + format chips for a card', () => {
    render(<FxPicker {...makeProps()} />)
    const card = screen.getByText('Serum').closest('article')!
    expect(within(card).getByText('Instrument')).toBeInTheDocument()
    expect(within(card).getByText('Synth')).toBeInTheDocument()
    expect(within(card).getByText('VST3')).toBeInTheDocument()
  })
})

// ── Add / availability ────────────────────────────────────────────────────────

describe('FxPicker — add', () => {
  it('calls onAdd with the plugin id', () => {
    const onAdd = vi.fn()
    render(<FxPicker {...makeProps({ onAdd })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Serum' }))
    expect(onAdd).toHaveBeenCalledWith('p3')
  })

  it('greys out and disables Add for an unavailable plugin', () => {
    render(<FxPicker {...makeProps()} />)
    const btn = screen.getByRole('button', { name: 'Omnisphere unavailable' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent('Unavailable')
  })
})

// ── Favorites ─────────────────────────────────────────────────────────────────

describe('FxPicker — favorites', () => {
  it('reflects favorite state via aria-pressed', () => {
    render(<FxPicker {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'Favorite Pro-Q 3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Favorite Pro-C 2' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles favorite with the next value', () => {
    const onToggleFavorite = vi.fn()
    render(<FxPicker {...makeProps({ onToggleFavorite })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Favorite Pro-C 2' }))
    expect(onToggleFavorite).toHaveBeenCalledWith('p2', true)
  })

  it('shows the favorite count badge in the sidebar', () => {
    render(<FxPicker {...makeProps()} />)
    const fav = screen.getByRole('option', { name: /Favorites/ })
    expect(within(fav).getByText('2')).toBeInTheDocument()
  })
})

// ── Search ────────────────────────────────────────────────────────────────────

describe('FxPicker — search', () => {
  it('renders the search field on the surface (paper) tone, not the stage well', () => {
    // The picker is a paper surface — the TextField default tone="stage" would
    // render the query as dark ink on the near-black well on light themes.
    render(<FxPicker {...makeProps()} />)
    const field = screen.getByRole('searchbox', { name: 'Search plugins' })
    expect(field.closest('[data-tone]')).toHaveAttribute('data-tone', 'surface')
  })

  it('filters by name and reports the query', () => {
    const onSearchChange = vi.fn()
    render(<FxPicker {...makeProps({ onSearchChange })} />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search plugins' }), { target: { value: 'serum' } })
    expect(onSearchChange).toHaveBeenCalledWith('serum')
    expect(screen.getByText('Serum')).toBeInTheDocument()
    expect(screen.queryByText('Pro-Q 3')).not.toBeInTheDocument()
  })

  it('matches on company too', () => {
    render(<FxPicker {...makeProps()} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'fabfilter' } })
    expect(screen.getByText('Pro-Q 3')).toBeInTheDocument()
    expect(screen.getByText('Pro-C 2')).toBeInTheDocument()
    expect(screen.queryByText('Serum')).not.toBeInTheDocument()
  })

  it('shows the no-results placeholder when nothing matches', () => {
    render(<FxPicker {...makeProps()} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzz' } })
    expect(screen.getByText('No plugins match')).toBeInTheDocument()
  })
})

// ── Kind filter ───────────────────────────────────────────────────────────────

describe('FxPicker — type filter', () => {
  it('filters to FX only and reports the change', () => {
    const onFilterChange = vi.fn()
    render(<FxPicker {...makeProps({ onFilterChange })} />)
    fireEvent.click(screen.getByRole('radio', { name: 'FX' }))
    expect(onFilterChange).toHaveBeenCalledWith('fx')
    expect(screen.getByText('Pro-Q 3')).toBeInTheDocument()
    expect(screen.queryByText('Serum')).not.toBeInTheDocument()
  })

  it('filters to Instrument only', () => {
    render(<FxPicker {...makeProps()} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Instrument' }))
    expect(screen.getByText('Serum')).toBeInTheDocument()
    expect(screen.queryByText('Pro-Q 3')).not.toBeInTheDocument()
  })
})

// ── Sidebar source ────────────────────────────────────────────────────────────

describe('FxPicker — sidebar source', () => {
  it('defaults to All selected', () => {
    render(<FxPicker {...makeProps()} />)
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-selected', 'true')
  })

  it('derives a sorted vendor list when companies is omitted', () => {
    render(<FxPicker {...makeProps()} />)
    expect(screen.getByRole('option', { name: 'FabFilter' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Spectrasonics' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Xfer' })).toBeInTheDocument()
  })

  it('selecting a vendor filters the grid and reports the source', () => {
    const onSourceChange = vi.fn()
    render(<FxPicker {...makeProps({ onSourceChange })} />)
    fireEvent.click(screen.getByRole('option', { name: 'Xfer' }))
    expect(onSourceChange).toHaveBeenCalledWith('company:Xfer')
    expect(screen.getByRole('option', { name: 'Xfer' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Serum')).toBeInTheDocument()
    expect(screen.queryByText('Pro-Q 3')).not.toBeInTheDocument()
  })

  it('Favorites source shows only favorited plugins', () => {
    render(<FxPicker {...makeProps()} />)
    fireEvent.click(screen.getByRole('option', { name: /Favorites/ }))
    expect(screen.getByText('Pro-Q 3')).toBeInTheDocument()
    expect(screen.getByText('Omnisphere')).toBeInTheDocument()
    expect(screen.queryByText('Pro-C 2')).not.toBeInTheDocument()
  })

  it('Recently used source shows only recent plugins', () => {
    render(<FxPicker {...makeProps()} />)
    fireEvent.click(screen.getByRole('option', { name: 'Recently used' }))
    expect(screen.getByText('Pro-Q 3')).toBeInTheDocument()
    expect(screen.getByText('Serum')).toBeInTheDocument()
    expect(screen.queryByText('Pro-C 2')).not.toBeInTheDocument()
  })

  it('moves selection with ArrowDown (roving listbox)', () => {
    const onSourceChange = vi.fn()
    render(<FxPicker {...makeProps({ onSourceChange })} />)
    fireEvent.keyDown(screen.getByRole('option', { name: 'All' }), { key: 'ArrowDown' })
    expect(onSourceChange).toHaveBeenCalledWith('favorite')
  })
})

// ── Rescan / close ────────────────────────────────────────────────────────────

describe('FxPicker — chrome actions', () => {
  it('calls onRescan', () => {
    const onRescan = vi.fn()
    render(<FxPicker {...makeProps({ onRescan })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))
    expect(onRescan).toHaveBeenCalledTimes(1)
  })

  it('calls onClose', () => {
    const onClose = vi.fn()
    render(<FxPicker {...makeProps({ onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

// ── Empty / loading ───────────────────────────────────────────────────────────

describe('FxPicker — empty + loading', () => {
  it('shows the empty placeholder with no plugins installed', () => {
    render(<FxPicker {...makeProps({ plugins: [] })} />)
    expect(screen.getByText('No plugins installed')).toBeInTheDocument()
    expect(screen.getByText('0 plugins installed')).toBeInTheDocument()
  })

  it('shows skeletons while scanning and hides the grid', () => {
    render(<FxPicker {...makeProps({ loading: true })} />)
    expect(screen.getByLabelText('Scanning plugins')).toBeInTheDocument()
    expect(screen.queryByText('Pro-Q 3')).not.toBeInTheDocument()
  })
})
