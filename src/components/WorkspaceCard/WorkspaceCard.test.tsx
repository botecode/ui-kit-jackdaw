// src/components/WorkspaceCard/WorkspaceCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspaceCard, kindNoun, tagLabel } from './WorkspaceCard'

// ─── Pure helpers ────────────────────────────────────────────────────────────

describe('kindNoun', () => {
  it('song stays "song"', () => {
    expect(kindNoun('song')).toBe('song')
  })
  it('collection reads as "album"', () => {
    expect(kindNoun('collection')).toBe('album')
  })
})

describe('tagLabel', () => {
  it('song → "SONG"', () => {
    expect(tagLabel('song')).toBe('SONG')
  })
  it('collection with a count → "ALBUM · N"', () => {
    expect(tagLabel('collection', 6)).toBe('ALBUM · 6')
  })
  it('collection without a count → "ALBUM"', () => {
    expect(tagLabel('collection')).toBe('ALBUM')
    expect(tagLabel('collection', 0)).toBe('ALBUM')
  })
})

// ─── Variant rendering ─────────────────────────────────────────────────────────

describe('WorkspaceCard variants', () => {
  it('renders a song card with the SONG tag', () => {
    const { container } = render(
      <WorkspaceCard kind="song" title="Hairline" onOpen={() => {}} />,
    )
    expect(container.querySelector('[data-kind="song"]')).toBeInTheDocument()
    expect(screen.getByText('SONG')).toBeInTheDocument()
  })

  it('renders a collection card with the ALBUM · N tag', () => {
    const { container } = render(
      <WorkspaceCard kind="collection" title="Paper Houses" count={6} onOpen={() => {}} />,
    )
    expect(container.querySelector('[data-kind="collection"]')).toBeInTheDocument()
    expect(screen.getByText('ALBUM · 6')).toBeInTheDocument()
  })

  it('renders the subtitle when provided', () => {
    render(<WorkspaceCard kind="song" title="Hairline" subtitle="Take 7 · today" onOpen={() => {}} />)
    expect(screen.getByText('Take 7 · today')).toBeInTheDocument()
  })

  it('defaults to size md', () => {
    const { container } = render(<WorkspaceCard kind="song" title="Hairline" onOpen={() => {}} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('reflects size sm', () => {
    const { container } = render(<WorkspaceCard kind="song" title="Hairline" size="sm" onOpen={() => {}} />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})

// ─── Cover: image vs colour fallback ─────────────────────────────────────────────

describe('WorkspaceCard cover', () => {
  it('uses the cover image when provided', () => {
    const { container } = render(
      <WorkspaceCard kind="song" title="Hairline" cover="https://x/art.jpg" onOpen={() => {}} />,
    )
    const cover = container.querySelector('[data-empty]')
    // With art there is no empty marker.
    expect(cover).toBeNull()
    const withBg = container.querySelector('[style*="background-image"]')
    expect(withBg).toBeInTheDocument()
  })

  it('falls back to a flat colour block (background-color) when only coverColor is set', () => {
    const { container } = render(
      <WorkspaceCard kind="song" title="Hairline" coverColor="#7ec8a4" onOpen={() => {}} />,
    )
    // A colour set is not "empty" (no glyph); it paints as a flat background-color.
    expect(container.querySelector('[data-empty]')).toBeNull()
    const cover = container.querySelector('[style*="background-color"]') as HTMLElement
    expect(cover.style.backgroundColor).toBe('rgb(126, 200, 164)')
  })

  it('paints a coverValue gradient via background-image (verbatim, never url-wrapped)', () => {
    const grad = 'linear-gradient(135deg, #e4c84a, #e47a7a)'
    const { container } = render(
      <WorkspaceCard kind="collection" title="LP" coverValue={{ kind: 'gradient', value: grad }} onOpen={() => {}} />,
    )
    expect(container.querySelector('[data-empty]')).toBeNull()
    const cover = container.querySelector('[style*="background-image"]') as HTMLElement
    expect(cover.style.backgroundImage).toContain('linear-gradient')
    expect(cover.style.backgroundImage).not.toContain('url(')
  })

  it('paints a coverValue image via background-image: url(…) and wins over legacy props', () => {
    const { container } = render(
      <WorkspaceCard
        kind="song"
        title="Hairline"
        cover="https://x/legacy.jpg"
        coverColor="#000"
        coverValue={{ kind: 'image', value: 'https://x/new.jpg' }}
        onOpen={() => {}}
      />,
    )
    const cover = container.querySelector('[style*="background-image"]') as HTMLElement
    expect(cover.style.backgroundImage).toBe('url("https://x/new.jpg")')
  })

  it('marks the cover empty with a glyph when neither art nor colour is set', () => {
    const { container } = render(<WorkspaceCard kind="song" title="Hairline" onOpen={() => {}} />)
    expect(container.querySelector('[data-empty]')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

// ─── A11y: the card is a labelled button ─────────────────────────────────────────

describe('WorkspaceCard a11y', () => {
  it('the open control is a native button (so Enter/Space activate it)', () => {
    render(<WorkspaceCard kind="song" title="Hairline" onOpen={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Hairline, song' })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('aria-label = title + kind (collection → album)', () => {
    render(<WorkspaceCard kind="collection" title="Paper Houses" onOpen={() => {}} />)
    expect(screen.getByRole('button', { name: 'Paper Houses, album' })).toBeInTheDocument()
  })

  it('a custom aria-label overrides the default', () => {
    render(<WorkspaceCard kind="song" title="Hairline" aria-label="Open Hairline" onOpen={() => {}} />)
    expect(screen.getByRole('button', { name: 'Open Hairline' })).toBeInTheDocument()
  })

  it('selected sets aria-current on the open control', () => {
    render(<WorkspaceCard kind="song" title="Hairline" selected onOpen={() => {}} />)
    expect(screen.getByRole('button', { name: 'Hairline, song' })).toHaveAttribute('aria-current', 'true')
  })

  it('reflects data-selected on the root', () => {
    const { container } = render(<WorkspaceCard kind="song" title="Hairline" selected onOpen={() => {}} />)
    expect(container.querySelector('[data-selected]')).toBeInTheDocument()
  })
})

// ─── Intents: onOpen / onPreview ─────────────────────────────────────────────────

describe('WorkspaceCard intents', () => {
  it('onOpen fires when the card is clicked', () => {
    const onOpen = vi.fn()
    render(<WorkspaceCard kind="song" title="Hairline" onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hairline, song' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('does not render a preview button without onPreview', () => {
    render(<WorkspaceCard kind="song" title="Hairline" onOpen={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Preview Hairline' })).toBeNull()
  })

  it('onPreview fires from the preview stud without opening', () => {
    const onOpen = vi.fn()
    const onPreview = vi.fn()
    render(<WorkspaceCard kind="song" title="Hairline" onOpen={onOpen} onPreview={onPreview} />)
    fireEvent.click(screen.getByRole('button', { name: 'Preview Hairline' }))
    expect(onPreview).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })
})
