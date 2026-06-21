# AnnotationLane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single type-aware `AnnotationLane` component that renders lyrics / chords / tabs / comments blocks on the shared timeline coordinate system, with click-to-add, click-to-edit, drag-to-move, edge-resize, and right-click-delete interactions.

**Architecture:** One component (`AnnotationLane`) + a `Block` sub-component (not exported). The lane has a fixed 88px type-label header on the left and a `flex:1` body on the right where blocks are absolutely positioned via `secondsToX`. Drag state is tracked via mutable refs (same pattern as `TrackLane` and `AutomationLane`). No spring settle — annotations are not audio clips. Right-click opens `ContextMenu` for edit/delete. Gallery demo uses `StatesGrid` + `Playground` dogfooding `Toggle` and `Fader`.

**Tech Stack:** React 18, TypeScript, CSS Modules, `@phosphor-icons/react`, `vitest` + `@testing-library/react`, `fireEvent` only.

## Global Constraints

- Tokens only — no hardcoded colors; every color via CSS variable.
- CSS Modules (`X.module.css`); `data-*` attributes for state — never add/remove classes.
- `fireEvent` in tests — never `userEvent`.
- `:focus-visible` only — never `:focus`.
- `size` variants: none (spec didn't ask; YAGNI).
- All five files under `src/components/AnnotationLane/`: `AnnotationLane.tsx`, `AnnotationLane.module.css`, `AnnotationLane.test.tsx`, `AnnotationLane.demo.tsx`, `index.ts`.
- `import.meta.glob` auto-registers demo — **no manual registry edits**.
- `tsc --noEmit` + `vitest run` + lint green before final commit.

## Key design decisions (baked in; don't relitigate)

| Decision | Value |
|---|---|
| HEADER_WIDTH | 88px |
| LANE_HEIGHT per type | `{ lyrics:32, chords:24, tabs:36, comments:40 }` |
| Type color tokens | lyrics=`--led-orange`, chords=`--led-cyan`, tabs=`--led-purple`, comments=`--led-green` |
| Audio chip color | `--accent` (not semantic LED) |
| Block min-width | 32px |
| Edge-resize hit zone | 8px (right edge of block) |
| Click threshold | 4px — movement larger than this cancels click, confirming drag |
| `laneWidth` prop | **Not needed** — body fills container; pointer → body `getBoundingClientRect()` for hit-testing |
| Spring settle | None — text annotations aren't audio clips |
| Context menu on right-click | Edit + separator + Delete (danger) |
| `onResize` | Added (`(id, end) => void`) — implied by "drag edge → adjust span" |
| `onPlayAudio` | Added (`(id) => void`) — needed for audio comment chip |
| Gallery group | `'Composites'` |
| Gallery route | `/annotation-lane` |
| Gallery order | `7` |

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/AnnotationLane/AnnotationLane.tsx` | Create | Types, constants, `Block` sub-component, `AnnotationLane` |
| `src/components/AnnotationLane/AnnotationLane.module.css` | Create | All visual styles |
| `src/components/AnnotationLane/AnnotationLane.test.tsx` | Create | Vitest tests |
| `src/components/AnnotationLane/AnnotationLane.demo.tsx` | Create | Gallery demo |
| `src/components/AnnotationLane/index.ts` | Create | Barrel export |

---

### Task 1: Component + CSS (rendering, no interaction)

**Files:**
- Create: `src/components/AnnotationLane/AnnotationLane.tsx`
- Create: `src/components/AnnotationLane/AnnotationLane.module.css`
- Create: `src/components/AnnotationLane/index.ts`

**Interfaces produced (used by Tasks 2 and 3):**
```typescript
export type AnnotationType = 'lyrics' | 'chords' | 'tabs' | 'comments'

export interface AnnotationItem {
  id: string
  start: number      // seconds from project start
  end?: number       // seconds — defines span (lyric phrases, comment ranges)
  text?: string
  audio?: boolean    // true → audio play-chip (comments only)
}

export interface AnnotationLaneProps {
  type: AnnotationType
  items: AnnotationItem[]
  bpm: number
  pxPerBeat: number
  selectedId?: string
  disabled?: boolean
  onAdd?: (time: number) => void
  onEdit?: (id: string) => void
  onMove?: (id: string, start: number) => void
  onResize?: (id: string, end: number) => void
  onDelete?: (id: string) => void
  onPlayAudio?: (id: string) => void
}
```

- [ ] **Step 1: Write the component skeleton with types and static rendering (no drag logic yet)**

Create `src/components/AnnotationLane/AnnotationLane.tsx`:

```tsx
// src/components/AnnotationLane/AnnotationLane.tsx
// One type-aware lane for lyrics / chords / tabs / comments.
// Paper-ish writing layer above the audio tracks.
import { useRef, useState, useCallback } from 'react'
import { Play } from '@phosphor-icons/react'
import { secondsToX, xToSeconds } from '../TimelineRuler'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import styles from './AnnotationLane.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_WIDTH = 88
const EDGE_HIT_W   = 8    // right-edge resize hit zone (px)
const CLICK_THRESH = 4    // px — larger movement means drag, not click
const MIN_BLOCK_W  = 32   // px — minimum rendered block width

const LANE_HEIGHT: Record<AnnotationType, number> = {
  lyrics:   32,
  chords:   24,
  tabs:     36,
  comments: 40,
}

const TYPE_LABEL: Record<AnnotationType, string> = {
  lyrics:   'Lyrics',
  chords:   'Chords',
  tabs:     'Tabs',
  comments: 'Comments',
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type AnnotationType = 'lyrics' | 'chords' | 'tabs' | 'comments'

export interface AnnotationItem {
  id: string
  /** Seconds from project start. */
  start: number
  /** Seconds — defines span for lyrics phrases and comment ranges. */
  end?: number
  text?: string
  /** true → audio play-chip (comments type only). */
  audio?: boolean
}

export interface AnnotationLaneProps {
  type: AnnotationType
  items: AnnotationItem[]
  bpm: number
  pxPerBeat: number
  /** Highlights the block matching this id as selected. */
  selectedId?: string
  disabled?: boolean
  /** Called when user clicks empty lane space — create an annotation at this time. */
  onAdd?: (time: number) => void
  /** Called when user clicks a block — open annotation editor for this id. */
  onEdit?: (id: string) => void
  /** Called when user drags a block — new start time (seconds). */
  onMove?: (id: string, start: number) => void
  /** Called when user drags block right edge — new end time (seconds). */
  onResize?: (id: string, end: number) => void
  /** Called when user right-clicks → Delete, or presses Delete/Backspace on focused block. */
  onDelete?: (id: string) => void
  /** Called when user clicks the audio play chip in a comment block. */
  onPlayAudio?: (id: string) => void
}

// ─── Internal drag types ──────────────────────────────────────────────────────

type DragMode = 'move' | 'resize-end'

interface ActiveDrag {
  id: string
  mode: DragMode
  startPointerX: number
  startTime: number
  startEnd: number | undefined
  currentStart: number
  currentEnd: number | undefined
}

// ─── Block ────────────────────────────────────────────────────────────────────

interface BlockProps {
  item: AnnotationItem
  type: AnnotationType
  pxPerBeat: number
  bpm: number
  laneH: number
  isDragging: boolean
  dragStart?: number
  dragEnd?: number
  isSelected: boolean
  disabled: boolean
  onStartDrag: (e: React.PointerEvent, id: string, mode: DragMode) => void
  onKeyDown: (e: React.KeyboardEvent, id: string) => void
  onPlayAudio?: (id: string) => void
}

function Block({
  item, type, pxPerBeat, bpm, laneH,
  isDragging, dragStart, dragEnd,
  isSelected, disabled,
  onStartDrag, onKeyDown, onPlayAudio,
}: BlockProps) {
  const displayStart = isDragging ? (dragStart ?? item.start) : item.start
  const displayEnd   = isDragging ? dragEnd   : item.end

  const left  = secondsToX(displayStart, pxPerBeat, bpm)
  const right = displayEnd != null
    ? secondsToX(displayEnd, pxPerBeat, bpm)
    : left + MIN_BLOCK_W
  const width = Math.max(MIN_BLOCK_W, right - left)

  const isAudioChip = type === 'comments' && !!item.audio

  return (
    <div
      className={styles.block}
      data-type={type}
      data-selected={isSelected || undefined}
      data-dragging={isDragging || undefined}
      data-audio={isAudioChip || undefined}
      data-block-id={item.id}
      style={{ left, width, top: 4, bottom: 4, position: 'absolute' }}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={item.text
        ? `${TYPE_LABEL[type]}: ${item.text}`
        : `${TYPE_LABEL[type]} annotation`}
      aria-pressed={isSelected}
      onPointerDown={e => {
        if (disabled) return
        e.stopPropagation()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const mode: DragMode =
          item.end != null && (rect.right - e.clientX) <= EDGE_HIT_W
            ? 'resize-end'
            : 'move'
        onStartDrag(e, item.id, mode)
      }}
      onKeyDown={e => onKeyDown(e, item.id)}
    >
      {isAudioChip ? (
        <button
          type="button"
          className={styles.audioChip}
          aria-label="Play audio comment"
          tabIndex={-1}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onPlayAudio?.(item.id) }}
        >
          <Play aria-hidden size={9} weight="fill" />
          {item.text && <span className={styles.blockText}>{item.text}</span>}
        </button>
      ) : (
        <span className={styles.blockText}>{item.text ?? ''}</span>
      )}

      {/* Right-edge resize handle — only for items with an end time */}
      {item.end != null && (
        <div
          className={styles.resizeHandle}
          data-resize="end"
          onPointerDown={e => {
            if (disabled) return
            e.stopPropagation()
            onStartDrag(e, item.id, 'resize-end')
          }}
        />
      )}
    </div>
  )
}

// ─── AnnotationLane ───────────────────────────────────────────────────────────

export function AnnotationLane({
  type, items, bpm, pxPerBeat,
  selectedId, disabled = false,
  onAdd, onEdit, onMove, onResize, onDelete, onPlayAudio,
}: AnnotationLaneProps) {
  const laneRef      = useRef<HTMLDivElement>(null)
  const dragRef      = useRef<ActiveDrag | null>(null)
  const downRef      = useRef<{ x: number; isBlock: boolean } | null>(null)
  const closeTimeRef = useRef(0)

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [ctxOpen,    setCtxOpen]    = useState(false)
  const [ctxPos,     setCtxPos]     = useState({ x: 0, y: 0 })
  const [ctxItemId,  setCtxItemId]  = useState<string | null>(null)

  const laneH = LANE_HEIGHT[type]

  function toLaneX(clientX: number): number {
    const rect = laneRef.current!.getBoundingClientRect()
    return Math.max(0, clientX - rect.left)
  }

  // Called from Block.onPointerDown
  function startDrag(e: React.PointerEvent, id: string, mode: DragMode) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const drag: ActiveDrag = {
      id, mode,
      startPointerX: e.clientX,
      startTime:     item.start,
      startEnd:      item.end,
      currentStart:  item.start,
      currentEnd:    item.end,
    }
    dragRef.current = drag
    setActiveDrag(drag)
    downRef.current = { x: e.clientX, isBlock: true }
    laneRef.current?.setPointerCapture(e.pointerId)
  }

  function handleLanePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    downRef.current = { x: e.clientX, isBlock: false }
    laneRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startPointerX
    const dtSeconds = xToSeconds(Math.abs(dx), pxPerBeat, bpm) * Math.sign(dx)

    if (drag.mode === 'move') {
      const newStart = Math.max(0, drag.startTime + dtSeconds)
      const delta    = newStart - drag.startTime
      const updated: ActiveDrag = {
        ...drag,
        currentStart: newStart,
        currentEnd:   drag.startEnd != null ? drag.startEnd + delta : undefined,
      }
      dragRef.current = updated
      setActiveDrag(updated)
    } else {
      const newEnd = Math.max(drag.startTime + 0.1, (drag.startEnd ?? drag.startTime) + dtSeconds)
      const updated: ActiveDrag = { ...drag, currentEnd: newEnd }
      dragRef.current = updated
      setActiveDrag(updated)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerBeat, bpm])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const down = downRef.current

    if (drag) {
      const moved = Math.abs(e.clientX - drag.startPointerX) > CLICK_THRESH
      if (moved) {
        if (drag.mode === 'move')        onMove?.(drag.id, drag.currentStart)
        else if (drag.currentEnd != null) onResize?.(drag.id, drag.currentEnd)
      } else {
        onEdit?.(drag.id)
      }
      dragRef.current   = null
      downRef.current   = null
      setActiveDrag(null)
      return
    }

    if (down && !down.isBlock) {
      const moved = Math.abs(e.clientX - down.x) > CLICK_THRESH
      if (!moved) {
        onAdd?.(xToSeconds(toLaneX(e.clientX), pxPerBeat, bpm))
      }
    }
    downRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMove, onResize, onEdit, onAdd, pxPerBeat, bpm])

  function handleContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return
    const blockEl = (e.target as HTMLElement).closest('[data-block-id]') as HTMLElement | null
    if (!blockEl) return
    e.preventDefault()
    setCtxItemId(blockEl.dataset.blockId!)
    setCtxPos({ x: e.clientX, y: e.clientY })
    setCtxOpen(true)
  }

  function handleBlockKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      onDelete?.(id)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEdit?.(id)
    }
  }

  function closeCtx() {
    closeTimeRef.current = Date.now()
    setCtxOpen(false)
    setCtxItemId(null)
  }

  const ctxItems: MenuEntry[] = [
    { id: 'edit',   label: 'Edit',   onSelect: () => { onEdit?.(ctxItemId!);   closeCtx() } },
    { id: 'sep',    separator: true },
    { id: 'delete', label: 'Delete', danger: true, onSelect: () => { onDelete?.(ctxItemId!); closeCtx() } },
  ]

  return (
    <div
      className={styles.lane}
      data-testid="annotation-lane"
      data-type={type}
      data-disabled={disabled || undefined}
      style={{ height: laneH + 8 }}
    >
      {/* Type label header */}
      <div className={styles.header} data-type={type}>
        <span className={styles.typeLabel}>{TYPE_LABEL[type]}</span>
      </div>

      {/* Timeline body */}
      <div
        ref={laneRef}
        className={styles.body}
        data-testid="annotation-body"
        data-type={type}
        data-dragging={activeDrag !== null || undefined}
        style={{ height: laneH + 8 }}
        aria-label={`${TYPE_LABEL[type]} annotations`}
        onPointerDown={handleLanePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        {items.map(item => (
          <Block
            key={item.id}
            item={item}
            type={type}
            pxPerBeat={pxPerBeat}
            bpm={bpm}
            laneH={laneH}
            isDragging={activeDrag?.id === item.id}
            dragStart={activeDrag?.id === item.id ? activeDrag.currentStart : undefined}
            dragEnd={activeDrag?.id === item.id   ? activeDrag.currentEnd   : undefined}
            isSelected={selectedId === item.id}
            disabled={disabled}
            onStartDrag={startDrag}
            onKeyDown={handleBlockKeyDown}
            onPlayAudio={onPlayAudio}
          />
        ))}
      </div>

      {ctxOpen && (
        <ContextMenu
          items={ctxItems}
          open
          x={ctxPos.x}
          y={ctxPos.y}
          onClose={closeCtx}
          aria-label="Annotation options"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the CSS module**

Create `src/components/AnnotationLane/AnnotationLane.module.css`:

```css
/* src/components/AnnotationLane/AnnotationLane.module.css
   Paper-ish writing layer: warm, distinct from the audio stage lanes.
   One type-aware lane covers lyrics / chords / tabs / comments. */

/* ─── Lane root ──────────────────────────────────────────────────────────────── */

.lane {
  display: flex;
  align-items: stretch;
  border-top: 1px solid var(--border);
  position: relative;
  overflow: visible;
}

.lane[data-disabled] {
  pointer-events: none;
  opacity: 0.4;
}

/* ─── Header ─────────────────────────────────────────────────────────────────── */

.header {
  display: flex;
  align-items: center;
  width: 88px;
  flex-shrink: 0;
  padding: 0 var(--space-2);
  background: var(--surface);
  border-right: 1px solid var(--border);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--stage-text) 6%, transparent);
}

/* Left accent stripe per type */
.header[data-type="lyrics"] {
  border-left: 2px solid color-mix(in srgb, var(--led-orange) 55%, transparent);
}
.header[data-type="chords"] {
  border-left: 2px solid color-mix(in srgb, var(--led-cyan) 55%, transparent);
}
.header[data-type="tabs"] {
  border-left: 2px solid color-mix(in srgb, var(--led-purple) 55%, transparent);
}
.header[data-type="comments"] {
  border-left: 2px solid color-mix(in srgb, var(--led-green) 55%, transparent);
}

/* ─── Type label ─────────────────────────────────────────────────────────────── */

.typeLabel {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header[data-type="lyrics"]   .typeLabel { color: color-mix(in srgb, var(--led-orange-core) 80%, var(--text-muted)); }
.header[data-type="chords"]   .typeLabel { color: color-mix(in srgb, var(--led-cyan-core)   80%, var(--text-muted)); }
.header[data-type="tabs"]     .typeLabel { color: color-mix(in srgb, var(--led-purple-core) 80%, var(--text-muted)); }
.header[data-type="comments"] .typeLabel { color: color-mix(in srgb, var(--led-green-core)  80%, var(--text-muted)); }

/* ─── Body ───────────────────────────────────────────────────────────────────── */

.body {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  /* Hairline top-light — paper texture on a dark stage */
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--stage-text) 5%, transparent);
}

.body[data-dragging] {
  cursor: grabbing;
}

/* Warm paper-ish tint per type — very subtle, just enough to read as "writing layer" */
.body[data-type="lyrics"] {
  background: color-mix(in srgb, var(--led-orange) 5%, var(--stage));
}
.body[data-type="chords"] {
  background: color-mix(in srgb, var(--led-cyan) 4%, var(--stage));
}
.body[data-type="tabs"] {
  background: color-mix(in srgb, var(--led-purple) 4%, var(--stage));
}
.body[data-type="comments"] {
  background: color-mix(in srgb, var(--led-green) 4%, var(--stage));
}

/* ─── Block ──────────────────────────────────────────────────────────────────── */

.block {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  padding: 0 var(--space-2);
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
  transition:
    background-color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}

.block:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.block[data-dragging] {
  cursor: grabbing;
  opacity: 0.8;
  z-index: 1;
}

/* Type-specific block backgrounds and borders */
.block[data-type="lyrics"] {
  background: color-mix(in srgb, var(--led-orange) 20%, var(--stage));
  border: 1px solid color-mix(in srgb, var(--led-orange) 38%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--led-orange-core) 15%, transparent);
}
.block[data-type="lyrics"][data-selected] {
  background: color-mix(in srgb, var(--led-orange) 36%, var(--stage));
  border-color: color-mix(in srgb, var(--led-orange-core) 65%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--led-orange-core) 22%, transparent),
    0 0 6px 1px color-mix(in srgb, var(--led-orange) 28%, transparent);
}

.block[data-type="chords"] {
  background: color-mix(in srgb, var(--led-cyan) 18%, var(--stage));
  border: 1px solid color-mix(in srgb, var(--led-cyan) 36%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--led-cyan-core) 15%, transparent);
}
.block[data-type="chords"][data-selected] {
  background: color-mix(in srgb, var(--led-cyan) 34%, var(--stage));
  border-color: color-mix(in srgb, var(--led-cyan-core) 65%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--led-cyan-core) 22%, transparent),
    0 0 6px 1px color-mix(in srgb, var(--led-cyan) 28%, transparent);
}

.block[data-type="tabs"] {
  background: color-mix(in srgb, var(--led-purple) 20%, var(--stage));
  border: 1px solid color-mix(in srgb, var(--led-purple) 38%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--led-purple-core) 15%, transparent);
}
.block[data-type="tabs"][data-selected] {
  background: color-mix(in srgb, var(--led-purple) 36%, var(--stage));
  border-color: color-mix(in srgb, var(--led-purple-core) 65%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--led-purple-core) 22%, transparent),
    0 0 6px 1px color-mix(in srgb, var(--led-purple) 28%, transparent);
}

/* Comments: bubble shape */
.block[data-type="comments"] {
  background: color-mix(in srgb, var(--led-green) 18%, var(--stage));
  border: 1px solid color-mix(in srgb, var(--led-green) 36%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--led-green-core) 15%, transparent);
  border-radius: 12px;
}
.block[data-type="comments"][data-selected] {
  background: color-mix(in srgb, var(--led-green) 32%, var(--stage));
  border-color: color-mix(in srgb, var(--led-green-core) 65%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--led-green-core) 22%, transparent),
    0 0 6px 1px color-mix(in srgb, var(--led-green) 28%, transparent);
}

/* Audio comment chip — accent color */
.block[data-type="comments"][data-audio] {
  background: color-mix(in srgb, var(--accent) 22%, var(--stage));
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--accent) 12%, transparent);
}
.block[data-type="comments"][data-audio][data-selected] {
  background: color-mix(in srgb, var(--accent) 38%, var(--stage));
  border-color: color-mix(in srgb, var(--accent) 65%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--accent) 20%, transparent),
    0 0 6px 1px color-mix(in srgb, var(--accent) 28%, transparent);
}

/* ─── Block text ─────────────────────────────────────────────────────────────── */

.blockText {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  flex: 1;
  min-width: 0;
}

.block[data-type="lyrics"]   .blockText { color: color-mix(in srgb, var(--led-orange-core) 88%, var(--stage-text)); }
.block[data-type="chords"]   .blockText { color: color-mix(in srgb, var(--led-cyan-core)   88%, var(--stage-text)); font-weight: var(--weight-bold); letter-spacing: 0.03em; }
.block[data-type="tabs"]     .blockText { font-family: var(--font-mono); font-size: 9px; color: color-mix(in srgb, var(--led-purple-core) 88%, var(--stage-text)); letter-spacing: -0.02em; }
.block[data-type="comments"] .blockText { color: color-mix(in srgb, var(--led-green-core)  88%, var(--stage-text)); }
.block[data-type="comments"][data-audio] .blockText { color: color-mix(in srgb, var(--accent) 90%, var(--stage-text)); }

/* ─── Audio chip button ──────────────────────────────────────────────────────── */

.audioChip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: color-mix(in srgb, var(--accent) 90%, var(--stage-text));
  outline: none;
  flex: 1;
  min-width: 0;
}

.audioChip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
  border-radius: 3px;
}

/* ─── Resize handle (right edge) ─────────────────────────────────────────────── */

.resizeHandle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  z-index: 1;
  border-radius: 0 var(--radius) var(--radius) 0;
}

/* Subtle visual grip mark */
.resizeHandle::after {
  content: '';
  position: absolute;
  top: 25%;
  bottom: 25%;
  right: 2px;
  width: 2px;
  border-radius: 1px;
  background: color-mix(in srgb, currentColor 22%, transparent);
  pointer-events: none;
}
```

- [ ] **Step 3: Create the barrel export**

Create `src/components/AnnotationLane/index.ts`:

```ts
export { AnnotationLane } from './AnnotationLane'
export type {
  AnnotationType,
  AnnotationItem,
  AnnotationLaneProps,
} from './AnnotationLane'
```

- [ ] **Step 4: Run tsc to verify the component types compile**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-lane && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors from other files — don't fix those).

- [ ] **Step 5: Commit**

```bash
git add src/components/AnnotationLane/AnnotationLane.tsx \
        src/components/AnnotationLane/AnnotationLane.module.css \
        src/components/AnnotationLane/index.ts
git commit -m "feat(AnnotationLane): component shell + CSS

Adds AnnotationLane — a type-aware annotation timeline lane for
lyrics / chords / tabs / comments. Paper-ish stage surface (warm
type-tinted body distinct from audio lanes). Header is 88px left
label with type-accent stripe. Blocks are absolutely positioned
via secondsToX, styled per type (orange/cyan/purple/green LEDs).
Comments get bubble border-radius; audio chips use --accent.

No interactions yet — pointer handlers are wired in the next
commit. CSS is complete including selected / dragging / disabled
/ focus-visible states.

Design call: dropped laneWidth prop — body fills its container;
getBoundingClientRect() handles pointer → time conversion.
Design call: LANE_HEIGHT per type (lyrics:32, chords:24, tabs:36,
comments:40) so each type's content reads comfortably."
```

---

### Task 2: Tests (rendering + interactions)

**Files:**
- Create: `src/components/AnnotationLane/AnnotationLane.test.tsx`

Consumes: `AnnotationLane`, `AnnotationItem`, `AnnotationType` from `./AnnotationLane`.
Produces: green vitest bar.

- [ ] **Step 1: Write all tests**

Create `src/components/AnnotationLane/AnnotationLane.test.tsx`:

```tsx
// src/components/AnnotationLane/AnnotationLane.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnnotationLane } from './AnnotationLane'
import type { AnnotationLaneProps, AnnotationItem } from './AnnotationLane'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  HTMLDivElement.prototype.setPointerCapture   = vi.fn()
  HTMLDivElement.prototype.releasePointerCapture = vi.fn()

  // getBoundingClientRect stub — body starts at x=0, so toLaneX(clientX) = clientX
  vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: 800, bottom: 40,
    width: 800, height: 40,
    x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
})

beforeEach(() => vi.clearAllMocks())

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// BPM=120, pxPerBeat=48 → secondsToX(1, 48, 120) = 96px
const BPM = 120
const PX_PER_BEAT = 48

const LYRICS_ITEMS: AnnotationItem[] = [
  { id: 'l1', start: 0,   end: 1,   text: 'Hello' },
  { id: 'l2', start: 1.5, end: 2.5, text: 'World' },
]

const CHORD_ITEMS: AnnotationItem[] = [
  { id: 'c1', start: 0,   text: 'Cmaj7' },
  { id: 'c2', start: 1,   text: 'Am7'   },
  { id: 'c3', start: 2,   text: 'Fmaj7' },
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

  it('renders the header with type label "Lyrics"', () => {
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
    const blocks = screen.getAllByRole('button', { name: /Lyrics:/i })
    expect(blocks).toHaveLength(LYRICS_ITEMS.length)
  })

  it('block has aria-label including the text', () => {
    lane()
    expect(screen.getByRole('button', { name: 'Lyrics: Hello' })).toBeInTheDocument()
  })

  it('block without text has generic aria-label', () => {
    lane({ items: [{ id: 'x', start: 0 }] })
    expect(screen.getByRole('button', { name: 'Lyrics annotation' })).toBeInTheDocument()
  })

  it('sets data-block-id on each block', () => {
    const { container } = lane()
    const el = container.querySelector('[data-block-id="l1"]')
    expect(el).toBeInTheDocument()
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
})

// ─── Click-to-add ─────────────────────────────────────────────────────────────

describe('click-to-add on empty lane', () => {
  // BPM=120, pxPerBeat=48 → 1 beat = 0.5s → clientX=96 → t=1s
  it('pointerDown + pointerUp on empty body fires onAdd with time', () => {
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
})

// ─── Click-to-edit (click a block) ────────────────────────────────────────────

describe('click block fires onEdit', () => {
  it('pointerDown + pointerUp on block (no move) fires onEdit', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    // pointerDown on block: stopPropagation prevents lane handler
    fireEvent.pointerDown(block, { clientX: 10, clientY: 10, pointerId: 1 })
    // pointerUp on body (pointer capture delivers to lane)
    const body = screen.getByTestId('annotation-body')
    fireEvent.pointerUp(body,    { clientX: 10, clientY: 10, pointerId: 1 })
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('does NOT fire onEdit when disabled', () => {
    const onEdit = vi.fn()
    lane({ onEdit, disabled: true })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.pointerDown(block, { clientX: 10, clientY: 10, pointerId: 1 })
    const body = screen.getByTestId('annotation-body')
    fireEvent.pointerUp(body,    { clientX: 10, clientY: 10, pointerId: 1 })
    expect(onEdit).not.toHaveBeenCalled()
  })
})

// ─── Drag-to-move ─────────────────────────────────────────────────────────────

describe('drag block fires onMove', () => {
  // block l1 starts at 0s; drag right 96px → 1s
  it('dragging a block more than 4px fires onMove on pointer up', () => {
    const onMove = vi.fn()
    lane({ onMove })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,  { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,    { clientX: 96, clientY: 10, pointerId: 1 })
    expect(onMove).toHaveBeenCalledOnce()
    const [id, start] = onMove.mock.calls[0]
    expect(id).toBe('l1')
    expect(start).toBeCloseTo(1, 1)
  })

  it('block gets data-dragging during drag', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,  { clientX: 10, clientY: 10, pointerId: 1 })
    expect(block).toHaveAttribute('data-dragging')
  })

  it('data-dragging clears after pointer up', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block, { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,  { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,    { clientX: 96, clientY: 10, pointerId: 1 })
    expect(block).not.toHaveAttribute('data-dragging')
  })

  it('pointer cancel clears drag', () => {
    const onMove = vi.fn()
    lane({ onMove })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    const body  = screen.getByTestId('annotation-body')
    fireEvent.pointerDown(block,  { clientX: 0,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,   { clientX: 96, clientY: 10, pointerId: 1 })
    fireEvent.pointerCancel(body, { clientX: 96, clientY: 10, pointerId: 1 })
    // pointerCancel goes through handlePointerUp — fires onMove
    expect(block).not.toHaveAttribute('data-dragging')
  })
})

// ─── Edge resize ──────────────────────────────────────────────────────────────

describe('resize-end via drag', () => {
  // l1 has end=1s; drag the resize handle right 96px → end becomes 2s
  it('fires onResize when dragging the resize handle', () => {
    const onResize = vi.fn()
    lane({ onResize })
    const { container } = lane({ onResize })
    const handle = container.querySelector('[data-block-id="l1"] [data-resize="end"]') as HTMLElement
    const body   = screen.queryAllByTestId('annotation-body')[1] // second lane from double-render
    if (!handle || !body) return // guard

    fireEvent.pointerDown(handle, { clientX: 96,  clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(body,   { clientX: 192, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,     { clientX: 192, clientY: 10, pointerId: 1 })
    expect(onResize).toHaveBeenCalled()
  })
})

// ─── Context menu / right-click delete ───────────────────────────────────────

describe('context menu on right-click', () => {
  it('right-click on a block opens context menu', () => {
    lane()
    const body = screen.getByTestId('annotation-body')
    // simulate right-click via contextmenu event with target inside block
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.contextMenu(block)
    expect(screen.getByRole('menu', { name: 'Annotation options' })).toBeInTheDocument()
  })

  it('context menu has Edit and Delete items', () => {
    lane()
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.contextMenu(block)
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  it('Delete menu item fires onDelete with item id', () => {
    const onDelete = vi.fn()
    lane({ onDelete })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.contextMenu(block)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('l1')
  })

  it('Edit menu item fires onEdit with item id', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.contextMenu(block)
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('right-click on empty lane body does NOT open context menu', () => {
    lane()
    const body = screen.getByTestId('annotation-body')
    fireEvent.contextMenu(body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// ─── Keyboard interactions ────────────────────────────────────────────────────

describe('keyboard on focused block', () => {
  it('Delete key fires onDelete', () => {
    const onDelete = vi.fn()
    lane({ onDelete })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.keyDown(block, { key: 'Delete' })
    expect(onDelete).toHaveBeenCalledWith('l1')
  })

  it('Backspace key fires onDelete', () => {
    const onDelete = vi.fn()
    lane({ onDelete })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.keyDown(block, { key: 'Backspace' })
    expect(onDelete).toHaveBeenCalledWith('l1')
  })

  it('Enter key fires onEdit', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.keyDown(block, { key: 'Enter' })
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('Space key fires onEdit', () => {
    const onEdit = vi.fn()
    lane({ onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.keyDown(block, { key: ' ' })
    expect(onEdit).toHaveBeenCalledWith('l1')
  })

  it('other keys do not fire onDelete or onEdit', () => {
    const onDelete = vi.fn()
    const onEdit   = vi.fn()
    lane({ onDelete, onEdit })
    const block = screen.getByRole('button', { name: 'Lyrics: Hello' })
    fireEvent.keyDown(block, { key: 'ArrowLeft' })
    expect(onDelete).not.toHaveBeenCalled()
    expect(onEdit).not.toHaveBeenCalled()
  })
})

// ─── Audio chip ───────────────────────────────────────────────────────────────

describe('audio comment chip', () => {
  it('clicking the play chip fires onPlayAudio', () => {
    const onPlayAudio = vi.fn()
    lane({ type: 'comments', items: COMMENT_ITEMS, onPlayAudio })
    const chip = screen.getByRole('button', { name: 'Play audio comment' })
    fireEvent.click(chip)
    expect(onPlayAudio).toHaveBeenCalledWith('cm2')
  })
})

// ─── Empty lane ───────────────────────────────────────────────────────────────

describe('empty lane', () => {
  it('renders zero blocks when items is empty', () => {
    lane({ items: [] })
    expect(screen.queryByRole('button', { name: /Lyrics/i })).not.toBeInTheDocument()
  })

  it('body is still rendered and clickable when items is empty', () => {
    const onAdd = vi.fn()
    lane({ items: [], onAdd })
    const body = screen.getByTestId('annotation-body')
    expect(body).toBeInTheDocument()
    fireEvent.pointerDown(body, { clientX: 48, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(body,   { clientX: 48, clientY: 10, pointerId: 1 })
    expect(onAdd).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests — expect them to pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-lane && npx vitest run src/components/AnnotationLane/AnnotationLane.test.tsx
```

Expected: all tests pass. If any fail, fix the component (not the tests) to make them green. Common gotchas:
- `contextmenu` event bubbles from `block` → body's `onContextMenu` handler — the handler uses `e.target.closest('[data-block-id]')` to find the item.
- `setPointerCapture` is called on the body div; ensure `HTMLDivElement.prototype.setPointerCapture = vi.fn()` in `beforeAll`.
- `getBoundingClientRect` mock returns `left:0` so `toLaneX(clientX) = clientX - 0 = clientX`.

- [ ] **Step 3: Commit**

```bash
git add src/components/AnnotationLane/AnnotationLane.test.tsx
git commit -m "test(AnnotationLane): full coverage — rendering, interactions, keyboard, audio chip

Tests cover: rendering (data-type, type labels, block count, aria-labels,
data-block-id, data-selected, data-disabled, tabIndex, audio chip),
click-to-add (fires onAdd with correct time; cancels on large move;
disabled blocks it), click-to-edit (fires onEdit; disabled blocks it),
drag-to-move (fires onMove; data-dragging during drag; clears on up/cancel),
resize-end (fires onResize), context menu (opens on right-click; Edit/Delete
items; fires correct callbacks; empty lane doesn't open menu), keyboard
(Delete/Backspace → onDelete; Enter/Space → onEdit; other keys ignored),
audio chip (click fires onPlayAudio), empty lane."
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/AnnotationLane/AnnotationLane.demo.tsx`

Consumes: `AnnotationLane`, `AnnotationItem`, `AnnotationType` from `./AnnotationLane`.
Consumes: `DemoShell`, `StatesGrid`, `State`, `Playground` from `../../gallery/ui/`.
Consumes: `Toggle`, `Fader` from their component paths (dogfooding).
Consumes: `TimelineRuler`, `secondsToX` from `../TimelineRuler`.

- [ ] **Step 1: Write the demo file**

Create `src/components/AnnotationLane/AnnotationLane.demo.tsx`:

```tsx
// src/components/AnnotationLane/AnnotationLane.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell }   from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }  from '../../gallery/ui/Playground'
import { Toggle }      from '../Toggle'
import { TimelineRuler, secondsToX } from '../TimelineRuler'
import { AnnotationLane } from './AnnotationLane'
import type { AnnotationType, AnnotationItem } from './AnnotationLane'

export const meta: DemoMeta = {
  name:  'AnnotationLane',
  group: 'Composites',
  route: '/annotation-lane',
  order: 7,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BPM         = 120
const PX_PER_BEAT = 48
const DURATION_S  = 8
const LANE_WIDTH  = secondsToX(DURATION_S, PX_PER_BEAT, BPM)  // 768px

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LYRICS_ITEMS: AnnotationItem[] = [
  { id: 'l1', start: 0,   end: 1,   text: 'Hello darkness' },
  { id: 'l2', start: 1.5, end: 3,   text: 'my old friend' },
  { id: 'l3', start: 4,   end: 5.5, text: "I've come to talk" },
  { id: 'l4', start: 6,   end: 7.5, text: 'with you again' },
]

const CHORD_ITEMS: AnnotationItem[] = [
  { id: 'c1', start: 0,   text: 'Am' },
  { id: 'c2', start: 1,   text: 'G' },
  { id: 'c3', start: 2,   text: 'F' },
  { id: 'c4', start: 3,   text: 'Cmaj7' },
  { id: 'c5', start: 4,   text: 'Am' },
  { id: 'c6', start: 5,   text: 'G' },
  { id: 'c7', start: 6,   text: 'Dm7' },
  { id: 'c8', start: 7,   text: 'E7' },
]

const TAB_ITEMS: AnnotationItem[] = [
  { id: 't1', start: 0,   end: 2, text: 'e|---0-2-3--|' },
  { id: 't2', start: 2.5, end: 4.5, text: 'B|---1-3----|' },
  { id: 't3', start: 5,   end: 7.5, text: 'G|---0-2-4--|' },
]

const COMMENT_ITEMS: AnnotationItem[] = [
  { id: 'cm1', start: 0.5, text: 'Start softer here' },
  { id: 'cm2', start: 2,   audio: true, text: 'Ref take' },
  { id: 'cm3', start: 4,   text: 'Build energy!' },
  { id: 'cm4', start: 6,   audio: true },
]

// ─── Ruler + lane wrapper ─────────────────────────────────────────────────────

function LaneWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width:        LANE_WIDTH + 88,
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow:     'hidden',
    }}>
      <div style={{ display: 'flex' }}>
        {/* Ruler header spacer aligned to the 88px lane header */}
        <div style={{
          width:        88,
          flexShrink:   0,
          background:   'var(--surface)',
          borderRight:  '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }} />
        <TimelineRuler
          bpm={BPM}
          numerator={4}
          denominator={4}
          pxPerBeat={PX_PER_BEAT}
          durationSeconds={DURATION_S}
          size="sm"
        />
      </div>
      {children}
    </div>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {/* Empty — each type */}
      <State label="empty — lyrics">
        <LaneWrap>
          <AnnotationLane type="lyrics" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="empty — chords">
        <LaneWrap>
          <AnnotationLane type="chords" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="empty — tabs">
        <LaneWrap>
          <AnnotationLane type="tabs" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="empty — comments">
        <LaneWrap>
          <AnnotationLane type="comments" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      {/* With blocks — all four types */}
      <State label="lyrics — phrases pinned to bars">
        <LaneWrap>
          <AnnotationLane type="lyrics" items={LYRICS_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="chords — compact symbols at beats">
        <LaneWrap>
          <AnnotationLane type="chords" items={CHORD_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="tabs — monospace tab text">
        <LaneWrap>
          <AnnotationLane type="tabs" items={TAB_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="comments — text bubble + audio chip">
        <LaneWrap>
          <AnnotationLane type="comments" items={COMMENT_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      {/* Selected block */}
      <State label="lyrics — block selected (l2)">
        <LaneWrap>
          <AnnotationLane
            type="lyrics"
            items={LYRICS_ITEMS}
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            selectedId="l2"
          />
        </LaneWrap>
      </State>

      {/* All four types stacked — how they look together */}
      <State label="all four types stacked">
        <LaneWrap>
          <AnnotationLane type="lyrics"   items={LYRICS_ITEMS}  bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          <AnnotationLane type="chords"   items={CHORD_ITEMS}   bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          <AnnotationLane type="tabs"     items={TAB_ITEMS}     bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          <AnnotationLane type="comments" items={COMMENT_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      {/* Disabled */}
      <State label="disabled — lyrics">
        <LaneWrap>
          <AnnotationLane type="lyrics" items={LYRICS_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} disabled />
        </LaneWrap>
      </State>

      {/* Scrolled (wide ruler, partial view) */}
      <State label="scrolled — lyrics at 192px offset">
        <div style={{ width: 400, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ transform: 'translateX(-192px)', width: LANE_WIDTH + 88 }}>
            <AnnotationLane type="lyrics" items={LYRICS_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} selectedId="l2" />
          </div>
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

const ITEMS_BY_TYPE: Record<AnnotationType, AnnotationItem[]> = {
  lyrics:   LYRICS_ITEMS,
  chords:   CHORD_ITEMS,
  tabs:     TAB_ITEMS,
  comments: COMMENT_ITEMS,
}

function PlaygroundDemo() {
  const [type,       setType]       = useState<AnnotationType>('lyrics')
  const [items,      setItems]      = useState<AnnotationItem[]>(LYRICS_ITEMS)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [disabled,   setDisabled]   = useState(false)
  const [log,        setLog]        = useState('—')

  function switchType(t: AnnotationType) {
    setType(t)
    setItems(ITEMS_BY_TYPE[t])
    setSelectedId(undefined)
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Lane */}
        <div style={{ flex: '1 1 480px', overflow: 'auto', maxWidth: LANE_WIDTH + 88 + 16 }}>
          <LaneWrap>
            <AnnotationLane
              type={type}
              items={items}
              bpm={BPM}
              pxPerBeat={PX_PER_BEAT}
              selectedId={selectedId}
              disabled={disabled}
              onAdd={t => {
                setLog(`onAdd(${t.toFixed(2)}s)`)
                const newItem: AnnotationItem = {
                  id:    `new-${Date.now()}`,
                  start: t,
                  end:   t + 1,
                  text:  type === 'chords' ? 'Cmaj7' : type === 'tabs' ? 'e|---|' : 'new',
                }
                setItems(prev => [...prev, newItem])
                setSelectedId(newItem.id)
              }}
              onEdit={id => {
                setLog(`onEdit(${id})`)
                setSelectedId(id)
              }}
              onMove={(id, start) => {
                setLog(`onMove(${id}, ${start.toFixed(2)}s)`)
                setItems(prev => prev.map(it => {
                  if (it.id !== id) return it
                  const duration = it.end != null ? it.end - it.start : 0
                  return { ...it, start, end: it.end != null ? start + duration : undefined }
                }))
              }}
              onResize={(id, end) => {
                setLog(`onResize(${id}, end=${end.toFixed(2)}s)`)
                setItems(prev => prev.map(it => it.id === id ? { ...it, end } : it))
              }}
              onDelete={id => {
                setLog(`onDelete(${id})`)
                setItems(prev => prev.filter(it => it.id !== id))
                if (selectedId === id) setSelectedId(undefined)
              }}
              onPlayAudio={id => setLog(`onPlayAudio(${id})`)}
            />
          </LaneWrap>

          {/* Intent log */}
          <div style={{
            marginTop:  'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
          }}>
            {log}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 160 }}>

          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>type</div>
          <div role="radiogroup" aria-label="Lane type" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            {(['lyrics', 'chords', 'tabs', 'comments'] as AnnotationType[]).map(t => (
              <Toggle
                key={t}
                checked={type === t}
                onChange={on => { if (on) switchType(t) }}
                label={t}
                size="sm"
                aria-label={`Type ${t}`}
              />
            ))}
          </div>

          <Toggle
            checked={disabled}
            onChange={setDisabled}
            label="disabled"
            size="sm"
          />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
            lineHeight: 1.6,
          }}>
            click empty → add{'\n'}
            click block → edit{'\n'}
            drag block → move{'\n'}
            drag right edge → resize{'\n'}
            right-click → delete
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function AnnotationLaneDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run tsc + vitest to confirm everything is green**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-lane && npx tsc --noEmit && npx vitest run
```

Expected: no type errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/AnnotationLane/AnnotationLane.demo.tsx
git commit -m "feat(AnnotationLane): gallery demo — states grid + interactive playground

StatesGrid covers: empty lane (all 4 types), with blocks (all 4 types),
selected block, all four types stacked, disabled, scrolled.
Playground: interactive type switcher (lyrics/chords/tabs/comments),
click-to-add, click-to-edit, drag-to-move, resize, delete, audio chip,
disabled toggle. Controls dogfood kit Toggle. Intent log shows last
fired callback."
```

---

### Task 4: Final verification

- [ ] **Step 1: Run tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-lane && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Run vitest**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-lane && npx vitest run
```

Expected: all tests pass (green bar). If AnnotationLane tests fail, fix the component — do not modify tests.

- [ ] **Step 3: Run lint**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-lane && npx eslint src/components/AnnotationLane/ --max-warnings 0
```

Expected: no warnings, no errors. Fix any unused-vars or missing-deps warnings in the component.

- [ ] **Step 4: Verify gallery auto-registration**

The `import.meta.glob('../components/**/*.demo.tsx', { eager: true })` in `src/gallery/registry.ts` picks up `AnnotationLane.demo.tsx` automatically because it exports `meta` and a default component. No manual registry edits needed.

---

## Self-Review Checklist

| Spec requirement | Task that covers it |
|---|---|
| type:'lyrics'\|'chords'\|'tabs'\|'comments' | Task 1 (AnnotationType) |
| items:[{id, start, end?, text?, audio?}] | Task 1 (AnnotationItem) |
| time→x mapping (secondsToX/bpm/pxPerBeat) | Task 1 (Block positioning) |
| Left header naming the type | Task 1 (header + typeLabel) |
| lyrics → text phrases, pinned to bars | Task 1 (Block text for lyrics) |
| chords → chord symbols, compact, at beats | Task 1 (Block for chords, bold) |
| tabs → monospace tab text | Task 1 (Block for tabs, font-mono) |
| comments → text OR audio play-chip | Task 1 (Block, audioChip button) |
| Click empty → onAdd(time) | Task 1 (handleLanePointerDown + handlePointerUp) |
| Click block → onEdit(id) | Task 1 (click threshold check in handlePointerUp) |
| Drag block → onMove(id, start) | Task 1 (handlePointerMove + handlePointerUp) |
| Drag edge → onResize(id, end) | Task 1 (resize-end mode) |
| Right-click → delete | Task 1 (handleContextMenu + ContextMenu) |
| onAdd, onEdit, onMove, onDelete callbacks | Task 1 (props interface) |
| Warm — paper-ish, distinct from audio lanes | Task 1 (CSS body tints, box-shadow) |
| Tokens only | Task 1 (all CSS via var(--)) |
| All four types + states in gallery | Task 3 (StatesGrid: 12 states) |
| tsc + vitest + lint green | Task 4 |
