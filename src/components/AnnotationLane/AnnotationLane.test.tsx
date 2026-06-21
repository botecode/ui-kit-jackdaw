// src/components/AnnotationLane/AnnotationLane.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnnotationLane } from './AnnotationLane'
import type { AnnotationLaneProps, AnnotationItem } from './AnnotationLane'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  HTMLDivElement.prototype.setPointerCapture    = vi.fn()
  HTMLDivElement.prototype.releasePointerCapture = vi.fn()

  // getBoundingClientRect stub — body left=0, so toLaneX(clientX) = clientX
  vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: 800, bottom: 40,
    width: 800, height: 40,
    x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
})

beforeEach(() => vi.clearAllMocks())

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// BPM=120, pxPerBeat=48 → secondsToX(1s, 48, 120) = 96px
const BPM         = 120
const PX_PER_BEAT = 48

const LYRICS_ITEMS: AnnotationItem[] = [
  { id: 'l1', start: 0,   end: 1,   text: 'Hello' },
  { id: 'l2', start: 1.5, end: 2.5, text: 'World' },
]

const CHORD_ITEMS: AnnotationItem[] = [
  { id: 'c1', start: 0, text: 'Cmaj7' },
  { id: 'c2', start: 1, text: 'Am7'   },
]

const TAB_ITEMS: AnnotationItem[] = [
  { id: 't1', start: 0, end: 2, text: 'e|---0---|' },
]

const COMMENT_ITEMS: AnnotationItem[] = [
  { id: 'cm1', start: 0.5, text: 'Nice bridge' },
  { id: 'cm2', start: 2,   audio: true, text: 'Listen here' },
]

const BASE: AnnotationLaneProps = {
  type:      'lyrics',
  items:     LYRICS_ITEMS,
  bpm:       BPM,
  pxPerBeat: PX_PER_BEAT,
}

function lane(overrides: Partial<AnnotationLaneProps> = {}) {
  return render(<AnnotationLane {...BASE} {...overrides} />)
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders data-testid="annotation-lane"', () => {
    lane()
    expect(screen.getByTestId('annotation-lane')).toBeInTheDocument()
  })

  it('sets data-type from type prop', () => {
    lane({ type: 'chords', items: CHORD_ITEMS })
    expect(screen.getByTestId('annotation-lane')).toHaveAttribute('data-type', 'chords')
  })

  it('renders the header label "Lyrics"', () => {
    lane()
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
  })

  it('renders header label "Chords" for chords type', () => {
    lane({ type: 'chords', items: CHORD_ITEMS })
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('renders header label "Tabs" for tabs type', () => {
    lane({ type: 'tabs', items: TAB_ITEMS })
    expect(screen.getByText('Tabs')).toBeInTheDocument()
  })

  it('renders header label "Comments" for comments type', () => {
    lane({ type: 'comments', items: COMMENT_ITEMS })
    expect(screen.getByText('Comments')).toBeInTheDocument()
  })

  it('renders one block per item', () => {
    lane()
    const blocks = screen.getAllByRole('button', { name: /Lyrics/i })
    expect(blocks).toHaveLength(LYRICS_ITEMS.length)
  })

  it('block aria-label includes the item text', () => {
    lane()
    expect(screen.getByRole('button', { name: 'Lyrics: Hello' })).toBeInTheDocument()
  })

  it('block without text gets generic aria-label', () => {
    lane({ items: [{ id: 'x', start: 0 }] })
    expect(screen.getByRole('button', { name: 'Lyrics annotation' })).toBeInTheDocument()
  })

  it('sets data-block-id on each block', () => {
    const { container } = lane()
    expect(container.querySelector('[data-block-id="l1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-block-id="l2"]')).toBeInTheDocument()
  })

  it('selected block gets data-selected', () => {
    const { container } = lane({ selectedId: 'l1' })
    expect(container.querySelector('[data-block-id="l1"]')).toHaveAttribute('data-selected')
  })

  it('non-selected block does NOT get data-selected', () => {
    const { container } = lane({ selectedId: 'l1' })
    expect(container.querySelector('[data-block-id="l2"]')).not.toHaveAttribute('data-selected')
  })

  it('disabled lane gets data-disabled', () => {
    lane({ disabled: true })
    expect(screen.getByTestId('annotation-lane')).toHaveAttribute('data-disabled')
  })

  it('block tabIndex=0 by default', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    expect(block.tabIndex).toBe(0)
  })

  it('block tabIndex=-1 when disabled', () => {
    lane({ disabled: true })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    expect(block.tabIndex).toBe(-1)
  })

  it('renders the annotation body with aria-label', () => {
    lane()
    expect(screen.getByRole('generic', { name: /Lyrics annotations/i })).toBeInTheDocument()
  })

  it('renders audio chip button inside audio comment block', () => {
    lane({ type: 'comments', items: COMMENT_ITEMS })
    expect(screen.getByRole('button', { name: 'Play audio comment' })).toBeInTheDocument()
  })

  it('audio block has data-audio attribute', () => {
    const { container } = lane({ type: 'comments', items: COMMENT_ITEMS })
    expect(container.querySelector('[data-block-id="cm2"]')).toHaveAttribute('data-audio')
  })

  it('text comment block does NOT have data-audio', () => {
    const { container } = lane({ type: 'comments', items: COMMENT_ITEMS })
    expect(container.querySelector('[data-block-id="cm1"]')).not.toHaveAttribute('data-audio')
  })

  it('renders zero blocks when items is empty', () => {
    lane({ items: [] })
    expect(screen.queryByRole('button', { name: /Lyrics/i })).not.toBeInTheDocument()
  })
})

// ─── Click-to-add ─────────────────────────────────────────────────────────────

describe('click-to-add on empty lane body', () => {
  // pxPerBeat=48, BPM=120 → 1 beat = 0.5s → clientX=96 → t=1s
  it('pointerDown + pointerUp (no move) fires onAdd with correct time', () => {
    const onAdd = vi.fn()
    lane({ onAdd })
    const body = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(body, { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,   { clientX: 96, clientY: 10, pointerId: 1 })
    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd.mock.calls[0][0]).toBeCloseTo(1, 1)
  })

  it('large pointer move cancels click-to-add', () => {
    const onAdd = vi.fn()
    lane({ onAdd })
    const body = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(body, { clientX: 96,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body, { clientX: 200, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,   { clientX: 200, clientY: 10, pointerId: 1 })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does NOT fire onAdd when disabled', () => {
    const onAdd = vi.fn()
    lane({ onAdd, disabled: true })
    const body = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(body, { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,   { clientX: 96, clientY: 10, pointerId: 1 })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('body is rendered and clickable even when items is empty', () => {
    const onAdd = vi.fn()
    lane({ items: [], onAdd })
    const body = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(body, { clientX: 48, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,   { clientX: 48, clientY: 10, pointerId: 1 })
    expect(onAdd).toHaveBeenCalledOnce()
  })
})

// ─── Click-to-edit ────────────────────────────────────────────────────────────

describe('click a block fires onEdit', () => {
  it('pointerDown on block + pointerUp (no move) fires onEdit with id', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    // Block stopsPropagation on pointerDown — starts drag state with isBlock=true
    fireEvent.pointerDown(block, { clientX: 10, clientY: 10, pointerId: 1 })
    // pointerUp on body (pointer capture delivers to lane)
    fireEvent.pointerUp(body,    { clientX: 10, clientY: 10, pointerId: 1 })
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('does NOT fire onEdit when disabled', () => {
    const onEdit = vi.fn()
    lane({ onEdit, disabled: true })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,    { clientX: 10, clientY: 10, pointerId: 1 })
    expect(onEdit).not.toHaveBeenCalled()
  })
})

// ─── Drag-to-move ─────────────────────────────────────────────────────────────

describe('drag block fires onMove', () => {
  // l1.start=0s; drag right 96px → Δt=1s → newStart=1s
  it('dragging block more than 4px fires onMove on pointerUp', () => {
    const onMove = vi.fn()
    lane({ onMove })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,  { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,    { clientX: 96, clientY: 10, pointerId: 1 })
    expect(onMove).toHaveBeenCalledOnce()
    const [id, start] = onMove.mock.calls[0] as [string, number]
    expect(id).toBe('l1')
    expect(start).toBeCloseTo(1, 1)
  })

  it('block gets data-dragging during drag', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,  { clientX: 10, clientY: 10, pointerId: 1 })
    expect(block).toHaveAttribute('data-dragging')
  })

  it('data-dragging clears after pointerUp', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,  { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,    { clientX: 96, clientY: 10, pointerId: 1 })
    expect(block).not.toHaveAttribute('data-dragging')
  })

  it('pointerCancel clears drag state', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block,  { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,   { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerCancel(body, { clientX: 96, clientY: 10, pointerId: 1 })
    expect(block).not.toHaveAttribute('data-dragging')
  })

  it('does NOT fire onMove when move is ≤ 4px (treated as click)', () => {
    const onMove = vi.fn()
    const onEdit = vi.fn()
    lane({ onMove, onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,    { clientX: 3, clientY: 10, pointerId: 1 })
    expect(onMove).not.toHaveBeenCalled()
    expect(onEdit).toHaveBeenCalledWith('l1')
  })
})

// ─── Edge resize ──────────────────────────────────────────────────────────────

describe('resize-end drag', () => {
  // l1.end=1s; drag the resize handle right 96px → newEnd ≈ 2s
  it('fires onResize when dragging the resize handle', () => {
    const onResize = vi.fn()
    const { container } = lane({ onResize })
    const handle = container.querySelector('[data-block-id="l1"] [data-resize="end"]') as HTMLElement
    const body   = screen.getByTestId('annotation-body')
    expect(handle).toBeInTheDocument()
    fireEvent.pointerDown(handle, { clientX: 96,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,   { clientX: 192, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,     { clientX: 192, clientY: 10, pointerId: 1 })
    expect(onResize).toHaveBeenCalledOnce()
    const [id, end] = onResize.mock.calls[0] as [string, number]
    expect(id).toBe('l1')
    expect(end).toBeGreaterThan(1)
  })

  it('resize handle is NOT rendered for items without end', () => {
    const { container } = lane({ items: [{ id: 'x', start: 0, text: 'no end' }] })
    expect(container.querySelector('[data-resize="end"]')).not.toBeInTheDocument()
  })
})

// ─── Context menu ─────────────────────────────────────────────────────────────

describe('context menu on right-click', () => {
  it('right-click on a block opens context menu', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.contextMenu(block)
    expect(screen.getByRole('menu', { name: 'Annotation options' })).toBeInTheDocument()
  })

  it('context menu contains Edit and Delete items', () => {
    lane()
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Lyrics: Hello' }))
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  it('Delete menu item fires onDelete with item id', () => {
    const onDelete = vi.fn()
    lane({ onDelete })
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Lyrics: Hello' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('l1')
  })

  it('Edit menu item fires onEdit with item id', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Lyrics: Hello' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('right-click on empty lane body does NOT open context menu', () => {
    lane()
    fireEvent.contextMenu(screen.getByTestId('annotation-body'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('does NOT open context menu when disabled', () => {
    lane({ disabled: true })
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Lyrics: Hello' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('keyboard on focused block', () => {
  it('Delete key fires onDelete with id', () => {
    const onDelete = vi.fn()
    lane({ onDelete })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Lyrics: Hello' }), { key: 'Delete' })
    expect(onDelete).toHaveBeenCalledWith('l1')
  })

  it('Backspace key fires onDelete with id', () => {
    const onDelete = vi.fn()
    lane({ onDelete })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Lyrics: Hello' }), { key: 'Backspace' })
    expect(onDelete).toHaveBeenCalledWith('l1')
  })

  it('Enter key fires onEdit with id', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Lyrics: Hello' }), { key: 'Enter' })
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('Space key fires onEdit with id', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Lyrics: Hello' }), { key: ' ' })
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('other keys do not fire callbacks', () => {
    const onDelete = vi.fn()
    const onEdit   = vi.fn()
    lane({ onDelete, onEdit })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Lyrics: Hello' }), { key: 'ArrowLeft' })
    expect(onDelete).not.toHaveBeenCalled()
    expect(onEdit).not.toHaveBeenCalled()
  })
})

// ─── Audio chip ───────────────────────────────────────────────────────────────

describe('audio comment chip', () => {
  it('clicking the play chip fires onPlayAudio with item id', () => {
    const onPlayAudio = vi.fn()
    lane({ type: 'comments', items: COMMENT_ITEMS, onPlayAudio })
    fireEvent.click(screen.getByRole('button', { name: 'Play audio comment' }))
    expect(onPlayAudio).toHaveBeenCalledWith('cm2')
  })

  it('audio chip text is visible when audio item has text', () => {
    lane({ type: 'comments', items: COMMENT_ITEMS })
    expect(screen.getByText('Listen here')).toBeInTheDocument()
  })
})

// ─── All four types render ────────────────────────────────────────────────────

describe('all four types', () => {
  it('lyrics blocks have lyrics type label', () => {
    lane({ type: 'lyrics', items: LYRICS_ITEMS })
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lyrics: Hello' })).toBeInTheDocument()
  })

  it('chords blocks have chords type label', () => {
    lane({ type: 'chords', items: CHORD_ITEMS })
    expect(screen.getByText('Chords')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chords: Cmaj7' })).toBeInTheDocument()
  })

  it('tabs blocks have tabs type label', () => {
    lane({ type: 'tabs', items: TAB_ITEMS })
    expect(screen.getByText('Tabs')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tabs:/ })).toBeInTheDocument()
  })

  it('comments blocks have comments type label', () => {
    lane({ type: 'comments', items: COMMENT_ITEMS })
    expect(screen.getByText('Comments')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comments: Nice bridge' })).toBeInTheDocument()
  })
})
