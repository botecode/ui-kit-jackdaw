// src/components/AnnotationEditor/AnnotationEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createRef } from 'react'
import { AnnotationEditor } from './AnnotationEditor'
import type { AnnotationEditorProps } from './AnnotationEditor'

const containerRef = createRef<HTMLElement>()

function makeProps(overrides?: Partial<AnnotationEditorProps>): AnnotationEditorProps {
  return {
    type: 'lyrics',
    anchor: { x: 100, y: 200 },
    time: 62,
    containerRef,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => vi.clearAllMocks())

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('AnnotationEditor — rendering', () => {
  it('shows the type label and formatted time', () => {
    render(<AnnotationEditor {...makeProps({ time: 62 })} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
    expect(screen.getByText('1:02')).toBeInTheDocument()
  })

  it('renders "Tab" label for tabs type', () => {
    render(<AnnotationEditor {...makeProps({ type: 'tabs' })} />)
    expect(screen.getByText('Tab')).toBeInTheDocument()
  })

  it('renders "Chords" label for chords type', () => {
    render(<AnnotationEditor {...makeProps({ type: 'chords' })} />)
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('renders "Comment" label for comment type', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment' })} />)
    expect(screen.getByText('Comment')).toBeInTheDocument()
  })

  it('shows Save and Cancel buttons', () => {
    render(<AnnotationEditor {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('shows Delete button when onDelete is provided (edit mode)', () => {
    render(<AnnotationEditor {...makeProps({ onDelete: vi.fn() })} />)
    expect(screen.getByRole('button', { name: 'Delete annotation' })).toBeInTheDocument()
  })

  it('does NOT show Delete button in create mode (no onDelete)', () => {
    render(<AnnotationEditor {...makeProps()} />)
    expect(screen.queryByRole('button', { name: 'Delete annotation' })).not.toBeInTheDocument()
  })
})

// ── Lyrics (multi-line textarea) ──────────────────────────────────────────────

describe('AnnotationEditor — lyrics', () => {
  it('renders a textarea for lyrics', () => {
    render(<AnnotationEditor {...makeProps({ type: 'lyrics' })} />)
    expect(screen.getByRole('textbox', { name: 'Lyrics' })).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('pre-fills with string value', () => {
    render(<AnnotationEditor {...makeProps({ value: 'Amazing Grace' })} />)
    const field = screen.getByRole('textbox', { name: 'Lyrics' }) as HTMLTextAreaElement
    expect(field.value).toBe('Amazing Grace')
  })

  it('calls onSave with updated text on Save click', () => {
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ onSave })} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Lyrics' }), { target: { value: 'New lyric' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('New lyric')
  })
})

// ── Tabs (monospace textarea) ─────────────────────────────────────────────────

describe('AnnotationEditor — tabs', () => {
  it('renders a textarea for tabs', () => {
    render(<AnnotationEditor {...makeProps({ type: 'tabs' })} />)
    expect(screen.getByRole('textbox', { name: 'Tab' })).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('textarea has data-mono attribute for monospace styling', () => {
    render(<AnnotationEditor {...makeProps({ type: 'tabs' })} />)
    expect(screen.getByRole('textbox', { name: 'Tab' })).toHaveAttribute('data-mono')
  })

  it('lyrics textarea does NOT have data-mono', () => {
    render(<AnnotationEditor {...makeProps({ type: 'lyrics' })} />)
    expect(screen.getByRole('textbox', { name: 'Lyrics' })).not.toHaveAttribute('data-mono')
  })
})

// ── Chords (single-line input) ────────────────────────────────────────────────

describe('AnnotationEditor — chords', () => {
  it('renders an input (not textarea) for chords', () => {
    render(<AnnotationEditor {...makeProps({ type: 'chords' })} />)
    expect(screen.getByRole('textbox', { name: 'Chords' })).toBeInstanceOf(HTMLInputElement)
  })

  it('calls onSave with chord text', () => {
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ type: 'chords', onSave })} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Chords' }), { target: { value: 'Am G C F' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('Am G C F')
  })
})

// ── Comment type ──────────────────────────────────────────────────────────────

describe('AnnotationEditor — comment', () => {
  it('renders an input for comment text', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment' })} />)
    expect(screen.getByRole('textbox', { name: 'Comment' })).toBeInstanceOf(HTMLInputElement)
  })

  it('shows Record button when onRecord is provided and no audio yet', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord: vi.fn() })} />)
    expect(screen.getByRole('button', { name: 'Record audio comment' })).toBeInTheDocument()
  })

  it('shows play chip when value is an AudioRef', () => {
    const audioRef = { url: 'blob:test', durationMs: 3400 }
    render(<AnnotationEditor {...makeProps({ type: 'comment', value: audioRef })} />)
    expect(screen.getByRole('img', { name: 'Recorded audio' })).toBeInTheDocument()
    expect(screen.getByText('3.4s')).toBeInTheDocument()
  })

  it('calls onSave with AudioRef when audio recorded and no text draft', async () => {
    const audioRef = { url: 'blob:test', durationMs: 2000 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord, onSave })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))
    await vi.waitFor(() => {
      expect(screen.getByRole('img', { name: 'Recorded audio' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(audioRef)
  })

  it('text draft takes priority over audio on save', async () => {
    const audioRef = { url: 'blob:test', durationMs: 2000 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord, onSave })} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), { target: { value: 'great take' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))
    await vi.waitFor(() => {
      expect(screen.getByRole('img', { name: 'Recorded audio' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('great take')
  })

  it('× button clears the audio and restores the Record button', async () => {
    const audioRef = { url: 'blob:test', durationMs: 1000 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))
    await vi.waitFor(() => {
      expect(screen.getByRole('img', { name: 'Recorded audio' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Remove recording' }))
    expect(screen.queryByRole('img', { name: 'Recorded audio' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Record audio comment' })).toBeInTheDocument()
  })

  it('disables the record button and sets data-recording while capture is in progress', async () => {
    let resolve: (v: { url: string; durationMs: number }) => void = () => {}
    const onRecord = vi.fn(() => new Promise<{ url: string; durationMs: number }>(r => { resolve = r }))
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))

    const btn = screen.getByRole('button', { name: 'Record audio comment' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('data-recording')

    resolve({ url: 'blob:test', durationMs: 1000 })
    await vi.waitFor(() => {
      expect(screen.getByRole('img', { name: 'Recorded audio' })).toBeInTheDocument()
    })
  })

  it('Record button is disabled when no onRecord handler', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment' })} />)
    // No onRecord → button exists but is disabled
    const btn = screen.getByRole('button', { name: 'Record audio comment' })
    expect(btn).toBeDisabled()
  })
})

// ── Actions ───────────────────────────────────────────────────────────────────

describe('AnnotationEditor — actions', () => {
  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<AnnotationEditor {...makeProps({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when Delete is clicked', () => {
    const onDelete = vi.fn()
    render(<AnnotationEditor {...makeProps({ onDelete })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete annotation' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('calls onSave when Save is clicked (empty create)', () => {
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ onSave })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('')
  })
})

// ── Time formatting ───────────────────────────────────────────────────────────

describe('AnnotationEditor — time formatting', () => {
  it('formats 0 seconds as 0:00', () => {
    render(<AnnotationEditor {...makeProps({ time: 0 })} />)
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('formats 90 seconds as 1:30', () => {
    render(<AnnotationEditor {...makeProps({ time: 90 })} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('formats 3661 seconds as 61:01', () => {
    render(<AnnotationEditor {...makeProps({ time: 3661 })} />)
    expect(screen.getByText('61:01')).toBeInTheDocument()
  })
})

// ── Audio duration formatting ─────────────────────────────────────────────────

describe('AnnotationEditor — audio duration formatting', () => {
  it('formats 3400ms as 3.4s', () => {
    const audioRef = { url: 'blob:test', durationMs: 3400 }
    render(<AnnotationEditor {...makeProps({ type: 'comment', value: audioRef })} />)
    expect(screen.getByText('3.4s')).toBeInTheDocument()
  })

  it('formats 1000ms as 1.0s', () => {
    const audioRef = { url: 'blob:test', durationMs: 1000 }
    render(<AnnotationEditor {...makeProps({ type: 'comment', value: audioRef })} />)
    expect(screen.getByText('1.0s')).toBeInTheDocument()
  })

  it('formats 500ms as 0.5s', () => {
    const audioRef = { url: 'blob:test', durationMs: 500 }
    render(<AnnotationEditor {...makeProps({ type: 'comment', value: audioRef })} />)
    expect(screen.getByText('0.5s')).toBeInTheDocument()
  })
})

// ── Escape closes via Popover ─────────────────────────────────────────────────

describe('AnnotationEditor — keyboard', () => {
  it('Escape keydown on the shell calls onCancel', () => {
    const onCancel = vi.fn()
    render(<AnnotationEditor {...makeProps({ onCancel })} />)
    // Popover attaches a document-level keydown handler for Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Popover anchor positioning ────────────────────────────────────────────────
// Guards against callers passing container-relative coords instead of viewport
// coords, which would always pin the editor to the viewport corner.

describe('AnnotationEditor — positioning', () => {
  it('positions the popover shell at the provided viewport anchor coordinates', () => {
    // jsdom getBoundingClientRect returns 0×0, so computePosition falls through
    // to the anchor directly (no overflow flip needed at 300,400 in 1024×768).
    render(<AnnotationEditor {...makeProps({ anchor: { x: 300, y: 400 } })} />)
    // The Popover portals a div with inline left/top onto document.body, nested
    // inside a themed wrapper that re-declares the active theme's tokens.
    const portalShell = Array.from(document.body.querySelectorAll<HTMLElement>('*')).find(
      el => el.style?.left === '300px',
    )
    expect(portalShell).toBeTruthy()
    expect(portalShell!.style.top).toBe('400px')
    expect(portalShell!.style.visibility).toBe('visible')
  })
})
