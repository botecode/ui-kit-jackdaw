import { readFileSync } from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { ReferenceList } from './ReferenceList'
import {
  classify,
  parseReferences,
  serializeReferences,
  itemFromUrl,
  youtubeId,
  spotifyPath,
} from './referenceMarkdown'

// Vitest stubs CSS, so we read the authored stylesheet to assert the Home
// paper-face guarantee: the reference shelf sits on warm light surfaces, never
// the dark --stage well (that is Studio hardware vocabulary).
const REF_CSS = readFileSync('src/components/ReferenceList/ReferenceList.module.css', 'utf8')

// ─── Markdown model (pure) ─────────────────────────────────────────────────────

describe('classify', () => {
  it('detects YouTube in all common shapes', () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    const c = classify('https://youtu.be/dQw4w9WgXcQ')
    expect(c.kind).toBe('youtube')
    // Privacy-enhanced official embed (shared render layer, src/lib/embeds.ts).
    expect(c.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(c.thumbnail).toContain('dQw4w9WgXcQ')
  })

  it('detects Spotify and builds an embed url', () => {
    expect(spotifyPath('https://open.spotify.com/track/abc123')).toBe('track/abc123')
    const c = classify('https://open.spotify.com/track/abc123')
    expect(c.kind).toBe('spotify')
    expect(c.embedUrl).toBe('https://open.spotify.com/embed/track/abc123')
  })

  it('detects images by extension', () => {
    expect(classify('https://ex.com/cover.png').kind).toBe('image')
    expect(classify('https://ex.com/a.JPEG?v=2').kind).toBe('image')
  })

  it('detects local/asset files', () => {
    expect(classify('takes/vocal-comp.wav').kind).toBe('file')
    expect(classify('asset://stems/bass.flac').kind).toBe('file')
  })

  it('falls back to a web link', () => {
    expect(classify('https://example.com/article').kind).toBe('link')
  })
})

describe('parse / serialize', () => {
  it('parses image, labelled, and bare lines', () => {
    const items = parseReferences(
      '![Cover](https://ex.com/c.png)\n[My Demo](https://ex.com/d)\nhttps://youtu.be/dQw4w9WgXcQ',
    )
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ kind: 'image', label: 'Cover', id: 'ref-0' })
    expect(items[1]).toMatchObject({ kind: 'link', label: 'My Demo', id: 'ref-1' })
    expect(items[2]).toMatchObject({ kind: 'youtube', label: '', id: 'ref-2' })
  })

  it('drops blank lines', () => {
    expect(parseReferences('https://a.com\n\n\nhttps://b.com')).toHaveLength(2)
  })

  it('round-trips canonical markdown losslessly', () => {
    const md = [
      '![Cover art](https://ex.com/cover.png)',
      '[Reference mix](https://youtu.be/dQw4w9WgXcQ)',
      'https://open.spotify.com/track/abc123',
      'takes/vocal-comp.wav',
      'https://example.com/article',
    ].join('\n')
    expect(serializeReferences(parseReferences(md))).toBe(md)
  })

  it('itemFromUrl auto-detects kind', () => {
    expect(itemFromUrl('https://youtu.be/dQw4w9WgXcQ').kind).toBe('youtube')
  })
})

// ─── Component ─────────────────────────────────────────────────────────────────

const YT = 'https://youtu.be/dQw4w9WgXcQ'

describe('ReferenceList', () => {
  it('renders the empty affordance when there are no references', () => {
    const { getByText } = render(<ReferenceList value="" />)
    expect(getByText(/paste a link or drop a file/i)).toBeTruthy()
  })

  it('adds a pasted link — fires onAddLink + onChange with appended markdown', () => {
    const onChange = vi.fn()
    const onAddLink = vi.fn()
    const { getByLabelText } = render(
      <ReferenceList value="" onChange={onChange} onAddLink={onAddLink} />,
    )
    const input = getByLabelText('Add a reference by link')
    fireEvent.paste(input, { clipboardData: { getData: () => YT } })
    expect(onAddLink).toHaveBeenCalledWith(YT)
    expect(onChange).toHaveBeenCalledWith(YT)
  })

  it('adds a typed link via the Add button', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(<ReferenceList value="" onChange={onChange} />)
    fireEvent.change(getByLabelText('Add a reference by link'), {
      target: { value: 'https://example.com/x' },
    })
    fireEvent.click(getByLabelText('Add reference'))
    expect(onChange).toHaveBeenCalledWith('https://example.com/x')
  })

  it('renders a YouTube player facade that expands to an iframe on play', () => {
    const { getByText, getByLabelText, getByTitle, queryByTitle } = render(
      <ReferenceList value={YT} />,
    )
    expect(getByText('YouTube')).toBeTruthy()
    expect(queryByTitle(/player/i)).toBeNull()
    fireEvent.click(getByLabelText(/^Play /))
    const frame = getByTitle(/player/i) as HTMLIFrameElement
    expect(frame.tagName).toBe('IFRAME')
    expect(frame.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('renders a web link card with the host', () => {
    const { getAllByText } = render(<ReferenceList value="https://example.com/article" />)
    expect(getAllByText('example.com').length).toBeGreaterThan(0)
  })

  it('shows a loading skeleton and an error fallback from meta', () => {
    const url = 'https://example.com/slow'
    const { rerender, getByText, queryByText } = render(
      <ReferenceList value={url} meta={{ [url]: { status: 'loading' } }} />,
    )
    expect(getByText('Loading preview…')).toBeTruthy()
    rerender(<ReferenceList value={url} meta={{ [url]: { status: 'error' } }} />)
    expect(queryByText('Loading preview…')).toBeNull()
    expect(getByText(/couldn't load a preview/i)).toBeTruthy()
  })

  it('renders a rich link card when meta resolves', () => {
    const url = 'https://example.com/post'
    const { getByText } = render(
      <ReferenceList value={url} meta={{ [url]: { status: 'ready', title: 'Great Post', description: 'A summary' } }} />,
    )
    expect(getByText('Great Post')).toBeTruthy()
    expect(getByText('A summary')).toBeTruthy()
  })

  it('reorders via the grip arrow keys — fires onReorder + onChange', () => {
    const onChange = vi.fn()
    const onReorder = vi.fn()
    const { getAllByLabelText } = render(
      <ReferenceList value={'https://a.com\nhttps://b.com'} onChange={onChange} onReorder={onReorder} />,
    )
    const grips = getAllByLabelText(/^Reorder /)
    fireEvent.keyDown(grips[0], { key: 'ArrowDown' })
    expect(onReorder).toHaveBeenCalledWith(0, 1)
    expect(onChange).toHaveBeenCalledWith('https://b.com\nhttps://a.com')
  })

  it('labels a reference inline — fires onLabel + onChange', () => {
    const onChange = vi.fn()
    const onLabel = vi.fn()
    const { getByLabelText } = render(
      <ReferenceList value="https://example.com" onChange={onChange} onLabel={onLabel} />,
    )
    fireEvent.click(getByLabelText(/^Label /))
    fireEvent.change(getByLabelText(/^Label for /), { target: { value: 'My ref' } })
    fireEvent.click(getByLabelText('Save label'))
    expect(onLabel).toHaveBeenCalledWith('ref-0', 'My ref')
    expect(onChange).toHaveBeenCalledWith('[My ref](https://example.com)')
  })

  it('deletes a reference — fires onDelete + onChange', () => {
    const onChange = vi.fn()
    const onDelete = vi.fn()
    const { getAllByLabelText } = render(
      <ReferenceList value={'https://a.com\nhttps://b.com'} onChange={onChange} onDelete={onDelete} />,
    )
    fireEvent.click(getAllByLabelText(/^Delete /)[0])
    expect(onDelete).toHaveBeenCalledWith('ref-0')
    expect(onChange).toHaveBeenCalledWith('https://b.com')
  })

  it('adds dropped files as file references', () => {
    const onChange = vi.fn()
    const { container } = render(<ReferenceList value="" onChange={onChange} />)
    const root = container.querySelector('section')!
    const file = new File(['x'], 'vocal-take.wav', { type: 'audio/wav' })
    fireEvent.drop(root, { dataTransfer: { files: [file] } })
    expect(onChange).toHaveBeenCalledWith('[vocal-take.wav](vocal-take.wav)')
  })

  it('selects a reference when selectable', () => {
    const onSelect = vi.fn()
    const { getByLabelText } = render(
      <ReferenceList value="https://example.com" onSelect={onSelect} />,
    )
    fireEvent.click(getByLabelText('example.com'))
    expect(onSelect).toHaveBeenCalledWith('ref-0')
  })

  it('hides editing affordances when disabled (read-only)', () => {
    const { queryByLabelText } = render(<ReferenceList value="https://example.com" disabled />)
    expect(queryByLabelText('Add a reference by link')).toBeNull()
    expect(queryByLabelText(/^Delete /)).toBeNull()
    expect(queryByLabelText(/^Reorder /)).toBeNull()
  })

  it('applies the aria-label to the region', () => {
    const { getByRole } = render(<ReferenceList value="" aria-label="Song references" />)
    expect(within(getByRole('region', { name: 'Song references' })).queryByText(/paste a link/i)).toBeTruthy()
  })

  // ─── Calm-paper guarantees (Home paper face, not the dark Studio stage) ──────

  it('never paints a surface on the dark --stage well', () => {
    expect(REF_CSS).not.toMatch(/var\(--stage\b/)
  })

  it('runs the "paste a link" collector field on the calm paper tone', () => {
    const { getByLabelText } = render(<ReferenceList value="" />)
    const field = getByLabelText('Add a reference by link').closest('[data-tone]')
    expect(field).toHaveAttribute('data-tone', 'surface')
  })

  it('seats the link-card thumbnail on a recessed light paper chip', () => {
    expect(REF_CSS).toMatch(/\.thumb\s*{[^}]*background-color:\s*var\(--surface-2\)/)
  })
})
