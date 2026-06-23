// src/components/SendChip/SendChip.tsx
//
// Why this isn't a webpage (reorder): a chip lifts off the row on its own LED
// bloom (the send's color), not a generic drop-shadow card; the drop target is a
// single lit hairline between chips, not a ghost placeholder box. Sends are
// parallel taps to returns, so order is presentation/priority — reordering
// organizes the row, it doesn't re-route audio. Press-and-drag reorders; a sub-4px
// press is still a click that opens the editor, so the tactile gesture never
// steals the tap. Reorder is keyboard-first too — Alt/Option + ←/→ moves a focused
// chip and an aria-live status speaks the new position; the popover carries the
// same Move left/right so the affordance survives without a pointer.
import { CSSProperties, Fragment, useRef, useState } from 'react'
import styles from './SendChip.module.css'
import { Popover } from '../Popover'
import { ContextMenu } from '../ContextMenu'
import { PanKnob } from '../PanKnob'
import type { MenuEntry } from '../ContextMenu'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendEntry {
  returnId:   string
  returnName: string
  level:      number        // 0..1
  tap:        'pre' | 'post'
  pan?:       number        // −1..1, 0 = center
  color?:     string
  automated?: boolean
}

export interface ReturnEntry {
  id:   string
  name: string
}

export interface SendChipProps {
  sends:          SendEntry[]
  returns:        ReturnEntry[]
  onAddSend:      (returnId: string | 'new') => void
  onSetSendLevel: (returnId: string, level: number) => void
  onSetSendTap:   (returnId: string, tap: 'pre' | 'post') => void
  onSetSendPan:   (returnId: string, pan: number) => void
  onRemoveSend:   (returnId: string) => void
  // Reorder a send to a new slot. Sends are parallel taps to returns, so chip
  // order is presentation/priority, not audio routing — this organizes the row.
  // Optional: when absent, the reorder affordances (drag, Alt+Arrow, Move
  // left/right) are inert. toIndex is the 0-based slot in the resulting row.
  onReorderSend?: (returnId: string, toIndex: number) => void
  size?:          'sm' | 'md'
  disabled?:      boolean
}

// ── helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// Movement (px) past which a press becomes a drag rather than a click.
const DRAG_THRESHOLD = 4

// ── SendPopover ───────────────────────────────────────────────────────────────

interface SendPopoverProps {
  send:           SendEntry
  index:          number
  count:          number
  containerRef:   React.RefObject<HTMLElement | null>
  triggerRef:     React.RefObject<HTMLElement | null>
  onClose:        () => void
  onSetSendLevel: (returnId: string, level: number) => void
  onSetSendTap:   (returnId: string, tap: 'pre' | 'post') => void
  onSetSendPan:   (returnId: string, pan: number) => void
  onRemoveSend:   (returnId: string) => void
  onMove?:        (dir: -1 | 1) => void
}

function SendPopover({
  send, index, count, containerRef, triggerRef, onClose,
  onSetSendLevel, onSetSendTap, onSetSendPan, onRemoveSend, onMove,
}: SendPopoverProps) {
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ y: 0, level: 0 })

  function handleLevelPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { y: e.clientY, level: send.level }
    setDragging(true)
  }

  function handleLevelPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const dy = e.clientY - dragStart.current.y
    onSetSendLevel(send.returnId, clamp(dragStart.current.level - dy * 0.005, 0, 1))
  }

  function handleLevelPointerUp() { setDragging(false) }

  function handleLevelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.01 : 0.05
    if (e.key === 'ArrowUp')   { e.preventDefault(); onSetSendLevel(send.returnId, clamp(send.level + step, 0, 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onSetSendLevel(send.returnId, clamp(send.level - step, 0, 1)) }
    if (e.key === 'Home')      { e.preventDefault(); onSetSendLevel(send.returnId, 0) }
    if (e.key === 'End')       { e.preventDefault(); onSetSendLevel(send.returnId, 1) }
  }

  return (
    <Popover
      anchorRef={triggerRef}
      containerRef={containerRef}
      onClose={onClose}
    >
      <div
        role="dialog"
        aria-label={`Send to ${send.returnName}`}
        className={styles.popover}
      >
        <p className={styles.popoverTitle}>→ {send.returnName}</p>

        {/* ── Level drag control ── */}
        <div className={styles.popoverRow}>
          <span className={styles.popoverRowLabel}>Level</span>
          <div
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(send.level * 100)}
            aria-label="Send level"
            tabIndex={0}
            className={styles.levelDrag}
            data-dragging={dragging || undefined}
            onPointerDown={handleLevelPointerDown}
            onPointerMove={handleLevelPointerMove}
            onPointerUp={handleLevelPointerUp}
            onPointerCancel={handleLevelPointerUp}
            onKeyDown={handleLevelKeyDown}
          >
            <span className={styles.levelValue}>{Math.round(send.level * 100)}</span>
            <span className={styles.levelUnit} aria-hidden>%</span>
          </div>
        </div>

        {/* ── Pan control ── */}
        <div className={styles.popoverRow}>
          <span className={styles.popoverRowLabel}>Pan</span>
          <PanKnob
            pan={send.pan ?? 0}
            onChange={pan => onSetSendPan(send.returnId, pan)}
            size="sm"
            color={send.color ?? undefined}
            aria-label="Send pan"
          />
        </div>

        {/* ── Tap toggle ── */}
        <div className={styles.popoverRow}>
          <span className={styles.popoverRowLabel}>Tap</span>
          <button
            type="button"
            role="checkbox"
            aria-checked={send.tap === 'pre'}
            aria-label="Pre-fader tap"
            className={styles.tapBtn}
            data-checked={send.tap === 'pre' || undefined}
            onClick={() => onSetSendTap(send.returnId, send.tap === 'pre' ? 'post' : 'pre')}
          >
            {send.tap === 'pre' ? 'pre' : 'post'}
          </button>
        </div>

        {/* ── Reorder (keyboard-equivalent of drag; only with >1 send) ── */}
        {onMove && count > 1 && (
          <div className={styles.popoverRow}>
            <span className={styles.popoverRowLabel}>Order</span>
            <div className={styles.moveGroup}>
              <button
                type="button"
                className={styles.moveBtn}
                aria-label="Move left"
                disabled={index === 0}
                onClick={() => onMove(-1)}
              >
                ← left
              </button>
              <button
                type="button"
                className={styles.moveBtn}
                aria-label="Move right"
                disabled={index === count - 1}
                onClick={() => onMove(1)}
              >
                right →
              </button>
            </div>
          </div>
        )}

        {/* ── Remove ── */}
        <button
          type="button"
          className={styles.removeBtn}
          aria-label="Remove send"
          onClick={() => { onRemoveSend(send.returnId); onClose() }}
        >
          Remove send
        </button>
      </div>
    </Popover>
  )
}

// ── SendChipPill ──────────────────────────────────────────────────────────────

interface SendChipPillProps {
  send:           SendEntry
  index:          number
  count:          number
  open:           boolean
  disabled?:      boolean
  dragging:       boolean
  reorderable:    boolean
  onClick:        () => void
  onClose:        () => void
  onPointerDown:  (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerMove:  (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp:    (e: React.PointerEvent<HTMLButtonElement>) => void
  onReorderKey:   (e: React.KeyboardEvent<HTMLButtonElement>) => void
  onMove?:        (dir: -1 | 1) => void
  onSetSendLevel: (returnId: string, level: number) => void
  onSetSendTap:   (returnId: string, tap: 'pre' | 'post') => void
  onSetSendPan:   (returnId: string, pan: number) => void
  onRemoveSend:   (returnId: string) => void
}

function SendChipPill({
  send, index, count, open, disabled, dragging, reorderable,
  onClick, onClose, onPointerDown, onPointerMove, onPointerUp, onReorderKey, onMove,
  onSetSendLevel, onSetSendTap, onSetSendPan, onRemoveSend,
}: SendChipPillProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef   = useRef<HTMLButtonElement>(null)

  const sendColor = send.color ?? 'var(--accent)'
  const pan = send.pan ?? 0

  return (
    <div
      ref={containerRef}
      className={styles.chipRoot}
      data-send-id={send.returnId}
      data-open={open || undefined}
      data-dragging={dragging || undefined}
      style={{ '--send-color': sendColor } as CSSProperties}
    >
      <button
        type="button"
        ref={triggerRef}
        className={styles.chip}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Send to ${send.returnName}${send.automated ? ', automated' : ''}`}
        disabled={disabled}
        data-reorderable={reorderable || undefined}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onReorderKey}
      >
        <span className={styles.colorDot} aria-hidden />
        <span className={styles.chipLabel}>→ {send.returnName}</span>
        <span className={styles.levelReadout}>{Math.round(send.level * 100)}</span>
        {Math.abs(pan) > 0.005 && (
          <span className={styles.panHint} aria-hidden>
            {pan < 0 ? 'L' : 'R'}
          </span>
        )}
        {send.tap === 'pre' && (
          <span className={styles.preBadge} aria-hidden>pre</span>
        )}
        {send.automated && (
          <span className={styles.autoDot} title="automated" aria-hidden />
        )}
      </button>
      {open && (
        <SendPopover
          send={send}
          index={index}
          count={count}
          containerRef={containerRef as React.RefObject<HTMLElement | null>}
          triggerRef={triggerRef as React.RefObject<HTMLElement | null>}
          onClose={onClose}
          onSetSendLevel={onSetSendLevel}
          onSetSendTap={onSetSendTap}
          onSetSendPan={onSetSendPan}
          onRemoveSend={onRemoveSend}
          onMove={onMove}
        />
      )}
    </div>
  )
}

// ── AddSendButton ─────────────────────────────────────────────────────────────

interface AddSendButtonProps {
  sends:     SendEntry[]
  returns:   ReturnEntry[]
  onAddSend: (returnId: string | 'new') => void
  disabled?: boolean
}

function AddSendButton({ sends, returns, onAddSend, disabled }: AddSendButtonProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerPos,  setPickerPos]  = useState({ x: 0, y: 0 })
  const containerRef  = useRef<HTMLDivElement>(null)
  // The ContextMenu's Popover fires a mousedown-based outside-click that closes the
  // picker when the user clicks this button. The subsequent click event would
  // immediately reopen it. This flag lets handleClick skip that reopen pass.
  const skipNextClick = useRef(false)

  function handleClose() {
    skipNextClick.current = true
    setPickerOpen(false)
    // Clear the guard after the click event has been processed.
    setTimeout(() => { skipNextClick.current = false }, 0)
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (skipNextClick.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPickerPos({ x: rect.left, y: rect.bottom + 4 })
    setPickerOpen(true)
  }

  const menuItems: MenuEntry[] = [
    ...returns.map(r => ({
      id:       r.id,
      label:    r.name,
      disabled: sends.some(s => s.returnId === r.id),
      onSelect: () => { onAddSend(r.id); setPickerOpen(false) },
    })),
    { id: 'sep', separator: true as const },
    {
      id:       'new',
      label:    'New return…',
      onSelect: () => { onAddSend('new'); setPickerOpen(false) },
    },
  ]

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={styles.addBtn}
        aria-label="Add send"
        aria-haspopup="menu"
        aria-expanded={pickerOpen}
        disabled={disabled}
        onClick={handleClick}
      >
        + Send
      </button>
      <ContextMenu
        items={menuItems}
        open={pickerOpen}
        x={pickerPos.x}
        y={pickerPos.y}
        onClose={handleClose}
        aria-label="Add send"
      />
    </div>
  )
}

// ── SendChip ──────────────────────────────────────────────────────────────────

export function SendChip({
  sends,
  returns,
  onAddSend,
  onSetSendLevel,
  onSetSendTap,
  onSetSendPan,
  onRemoveSend,
  onReorderSend,
  size = 'md',
  disabled,
}: SendChipProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  // Reorder is live only with a handler, more than one chip, and not disabled.
  const reorderEnabled = !!onReorderSend && sends.length > 1 && !disabled

  // ── aria-live announcement for keyboard / button reorder ──
  const [announcement, setAnnouncement] = useState('')

  // ── drag-to-reorder state (row-level, so the indicator sits between chips) ──
  const rowRef = useRef<HTMLDivElement>(null)
  const [dragId, setDragId]       = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null) // insertion slot 0..n
  // Pointer gesture bookkeeping — refs so handlers read live values without re-binding.
  const pressStart = useRef<{ index: number; x: number; y: number } | null>(null)
  const movedRef   = useRef(false) // gesture crossed the drag threshold (suppresses the click)

  function openChip(id: string)  { if (!disabled) setOpenId(id) }
  function closeChip()           { setOpenId(null) }

  function announceMove(send: SendEntry, toIndex: number) {
    setAnnouncement(`${send.returnName} moved to position ${toIndex + 1} of ${sends.length}`)
  }

  // Move a send by one slot (keyboard Alt+Arrow + popover Move left/right).
  function moveBy(index: number, dir: -1 | 1) {
    if (!onReorderSend) return
    const toIndex = index + dir
    if (toIndex < 0 || toIndex >= sends.length) return
    onReorderSend(sends[index].returnId, toIndex)
    announceMove(sends[index], toIndex)
  }

  // Insertion slot (0..n) for a pointer x within the row, by chip midpoints.
  function dropSlotForX(clientX: number): number {
    const root = rowRef.current
    if (!root) return 0
    const chipEls = Array.from(root.querySelectorAll<HTMLElement>('[data-send-id]'))
    let slot = 0
    for (const el of chipEls) {
      const r = el.getBoundingClientRect()
      if (clientX > r.left + r.width / 2) slot++
    }
    return slot
  }

  function handleChipClick(id: string) {
    // A press that turned into a drag must not also toggle the popover.
    if (movedRef.current) return
    openId === id ? closeChip() : openChip(id)
  }

  function handlePointerDown(index: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (!reorderEnabled || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pressStart.current = { index, x: e.clientX, y: e.clientY }
    movedRef.current = false
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const start = pressStart.current
    if (!start) return
    if (!movedRef.current) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return
      movedRef.current = true
      setDragId(sends[start.index].returnId)
      // Opening on press would fight the drag — make sure no popover is showing.
      setOpenId(null)
    }
    setDropIndex(dropSlotForX(e.clientX))
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const start = pressStart.current
    pressStart.current = null
    if (start && movedRef.current && dropIndex != null && onReorderSend) {
      const from = start.index
      // Insertion slot → final index after the dragged chip is lifted out.
      const toIndex = clamp(dropIndex > from ? dropIndex - 1 : dropIndex, 0, sends.length - 1)
      if (toIndex !== from) {
        onReorderSend(sends[from].returnId, toIndex)
        announceMove(sends[from], toIndex)
      }
    }
    setDragId(null)
    setDropIndex(null)
  }

  function handleReorderKey(index: number, e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!reorderEnabled || !e.altKey) return
    if (e.key === 'ArrowLeft')  { e.preventDefault(); moveBy(index, -1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); moveBy(index, 1) }
  }

  const dragColor = dragId
    ? (sends.find(s => s.returnId === dragId)?.color ?? 'var(--accent)')
    : 'var(--accent)'
  const dragFrom = dragId ? sends.findIndex(s => s.returnId === dragId) : -1

  // The indicator is meaningful only when the slot implies a real move.
  function showIndicatorAt(slot: number): boolean {
    if (dragId == null || dropIndex !== slot) return false
    const toIndex = dropIndex > dragFrom ? dropIndex - 1 : dropIndex
    return toIndex !== dragFrom
  }

  const DropIndicator = (
    <span
      className={styles.dropIndicator}
      aria-hidden
      style={{ '--send-color': dragColor } as CSSProperties}
    />
  )

  return (
    <div ref={rowRef} className={styles.row} data-size={size} data-reordering={dragId ? true : undefined}>
      {sends.map((send, i) => (
        <Fragment key={send.returnId}>
          {showIndicatorAt(i) && DropIndicator}
          <SendChipPill
            send={send}
            index={i}
            count={sends.length}
            open={openId === send.returnId}
            disabled={disabled}
            dragging={dragId === send.returnId}
            reorderable={reorderEnabled}
            onClick={() => handleChipClick(send.returnId)}
            onClose={closeChip}
            onPointerDown={e => handlePointerDown(i, e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onReorderKey={e => handleReorderKey(i, e)}
            onMove={reorderEnabled ? dir => moveBy(i, dir) : undefined}
            onSetSendLevel={onSetSendLevel}
            onSetSendTap={onSetSendTap}
            onSetSendPan={onSetSendPan}
            onRemoveSend={onRemoveSend}
          />
        </Fragment>
      ))}
      {showIndicatorAt(sends.length) && DropIndicator}
      <AddSendButton
        sends={sends}
        returns={returns}
        onAddSend={onAddSend}
        disabled={disabled}
      />
      <span className={styles.srLive} role="status" aria-live="polite">{announcement}</span>
    </div>
  )
}
