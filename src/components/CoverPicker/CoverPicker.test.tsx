// src/components/CoverPicker/CoverPicker.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { CoverPicker, isValidImageLink } from './CoverPicker'
import { DEFAULT_COLOR_PRESETS, DEFAULT_GRADIENT_PRESETS, DEFAULT_TEXTURE_PRESETS } from './presets'
import type { CoverUnsplashResult } from '../../lib/covers'

const RESULTS: CoverUnsplashResult[] = [
  { id: 'p1', url: 'https://img/1-full.jpg', thumbUrl: 'https://img/1-thumb.jpg', attribution: { authorName: 'Ansel' } },
  { id: 'p2', url: 'https://img/2-full.jpg', attribution: { authorName: 'Vivian' }, alt: 'a wave' },
]

beforeEach(() => vi.clearAllMocks())

// ─── Tabs / structure ───────────────────────────────────────────────────────────

describe('CoverPicker — tabs', () => {
  it('shows Gallery, Upload, Link by default and hides Unsplash without a search prop', () => {
    render(<CoverPicker onPick={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Gallery' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Upload' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Link' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Unsplash' })).not.toBeInTheDocument()
  })

  it('shows the Unsplash tab when onSearchUnsplash is provided', () => {
    render(<CoverPicker onPick={vi.fn()} onSearchUnsplash={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Unsplash' })).toBeInTheDocument()
  })

  it('falls back to Gallery when defaultTab=unsplash but no search prop', () => {
    render(<CoverPicker onPick={vi.fn()} defaultTab="unsplash" />)
    expect(screen.getByRole('tab', { name: 'Gallery' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches panels on tab click', () => {
    render(<CoverPicker onPick={vi.fn()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Link' }))
    expect(screen.getByPlaceholderText('Paste an image link…')).toBeInTheDocument()
  })
})

// ─── Gallery ──────────────────────────────────────────────────────────────────

describe('CoverPicker — gallery', () => {
  it('renders every color, gradient, and texture preset as a radio tile', () => {
    render(<CoverPicker onPick={vi.fn()} />)
    const group = screen.getByRole('radiogroup', { name: 'Cover presets' })
    const tiles = within(group).getAllByRole('radio')
    const expected =
      DEFAULT_COLOR_PRESETS.length + DEFAULT_GRADIENT_PRESETS.length + DEFAULT_TEXTURE_PRESETS.length
    expect(tiles).toHaveLength(expected)
  })

  it('emits a color choice when a color tile is clicked', () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Peach' }))
    expect(onPick).toHaveBeenCalledWith({ kind: 'color', value: '#e8a87c' })
  })

  it('emits a gradient choice (verbatim CSS gradient, never url-wrapped)', () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Sunset' }))
    const arg = onPick.mock.calls[0][0]
    expect(arg.kind).toBe('gradient')
    expect(arg.value).toContain('linear-gradient')
    expect(arg.value).not.toContain('url(')
  })

  it('emits a texture as kind=gradient (renders through the same path)', () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Crosshatch' }))
    expect(onPick.mock.calls[0][0].kind).toBe('gradient')
  })

  it('marks the tile matching `value` as aria-checked', () => {
    render(<CoverPicker onPick={vi.fn()} value={{ kind: 'color', value: '#e8a87c' }} />)
    expect(screen.getByRole('radio', { name: 'Peach' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Sage' })).toHaveAttribute('aria-checked', 'false')
  })

  it('gives the selected tile the roving tabstop; others are removed from tab order', () => {
    render(<CoverPicker onPick={vi.fn()} value={{ kind: 'color', value: '#7ec8a4' }} />)
    expect(screen.getByRole('radio', { name: 'Sage' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Peach' })).toHaveAttribute('tabindex', '-1')
  })

  it('does NOT emit on arrow navigation — only on activation (manual radio)', () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} />)
    const first = screen.getByRole('radio', { name: 'Peach' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(onPick).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Sage' }))
  })
})

// ─── Link ─────────────────────────────────────────────────────────────────────

describe('CoverPicker — link', () => {
  it('emits an image choice for a valid url', () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} defaultTab="link" />)
    fireEvent.change(screen.getByPlaceholderText('Paste an image link…'), {
      target: { value: 'https://x/cover.jpg' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onPick).toHaveBeenCalledWith({ kind: 'image', value: 'https://x/cover.jpg' })
  })

  it('shows an error and does NOT emit for an invalid link', () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} defaultTab="link" />)
    fireEvent.change(screen.getByPlaceholderText('Paste an image link…'), {
      target: { value: 'not a url' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('isValidImageLink accepts http(s) and data URLs, rejects junk', () => {
    expect(isValidImageLink('https://x/y.png')).toBe(true)
    expect(isValidImageLink('http://x/y.png')).toBe(true)
    expect(isValidImageLink('data:image/png;base64,AAAA')).toBe(true)
    expect(isValidImageLink('')).toBe(false)
    expect(isValidImageLink('ftp://x/y')).toBe(false)
    expect(isValidImageLink('hello')).toBe(false)
  })
})

// ─── Upload ───────────────────────────────────────────────────────────────────

describe('CoverPicker — upload', () => {
  it('reads a chosen file to a data URL and emits an image choice', async () => {
    const onPick = vi.fn()
    render(<CoverPicker onPick={onPick} defaultTab="upload" />)
    const input = screen.getByLabelText(/Upload an image/i) as HTMLInputElement
    const file = new File(['hello'], 'cover.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(onPick).toHaveBeenCalled())
    const arg = onPick.mock.calls[0][0]
    expect(arg.kind).toBe('image')
    expect(arg.value).toMatch(/^data:image\/png/)
  })
})

// ─── Unsplash ─────────────────────────────────────────────────────────────────

describe('CoverPicker — unsplash', () => {
  it('searches on submit, renders results with per-photo attribution', async () => {
    const onSearch = vi.fn().mockResolvedValue(RESULTS)
    render(<CoverPicker onPick={vi.fn()} onSearchUnsplash={onSearch} defaultTab="unsplash" />)
    fireEvent.change(screen.getByPlaceholderText('Search Unsplash…'), { target: { value: 'mountains' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(onSearch).toHaveBeenCalledWith('mountains')
    await screen.findByRole('list', { name: /Unsplash results for mountains/ })
    expect(screen.getByText('by Ansel')).toBeInTheDocument()
    expect(screen.getByText('by Vivian')).toBeInTheDocument()
  })

  it('emits the FULL url plus attribution when a result is picked', async () => {
    const onPick = vi.fn()
    const onSearch = vi.fn().mockResolvedValue(RESULTS)
    render(<CoverPicker onPick={onPick} onSearchUnsplash={onSearch} defaultTab="unsplash" />)
    fireEvent.change(screen.getByPlaceholderText('Search Unsplash…'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    const btn = await screen.findByRole('button', { name: /by Ansel/ })
    fireEvent.click(btn)
    expect(onPick).toHaveBeenCalledWith({
      kind: 'image',
      value: 'https://img/1-full.jpg',
      attribution: { authorName: 'Ansel' },
    })
  })

  it('shows the empty state when a search returns nothing', async () => {
    const onSearch = vi.fn().mockResolvedValue([])
    render(<CoverPicker onPick={vi.fn()} onSearchUnsplash={onSearch} defaultTab="unsplash" />)
    fireEvent.change(screen.getByPlaceholderText('Search Unsplash…'), { target: { value: 'zzz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(screen.getByText(/No photos for/)).toBeInTheDocument())
  })

  it('shows the error state when the search rejects', async () => {
    const onSearch = vi.fn().mockRejectedValue(new Error('network'))
    render(<CoverPicker onPick={vi.fn()} onSearchUnsplash={onSearch} defaultTab="unsplash" />)
    fireEvent.change(screen.getByPlaceholderText('Search Unsplash…'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Couldn.t reach Unsplash/))
  })

  it('disables Search with an empty query', () => {
    render(<CoverPicker onPick={vi.fn()} onSearchUnsplash={vi.fn()} defaultTab="unsplash" />)
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
  })
})

// ─── Disabled ───────────────────────────────────────────────────────────────────

describe('CoverPicker — disabled', () => {
  it('disables the gallery tiles', () => {
    render(<CoverPicker onPick={vi.fn()} disabled />)
    expect(screen.getByRole('radio', { name: 'Peach' })).toBeDisabled()
  })
})
