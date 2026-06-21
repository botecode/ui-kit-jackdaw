// src/components/SendChip/SendChip.tsx
import { CSSProperties, useRef, useState } from 'react'
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
  size?:          'sm' | 'md'
  disabled?:      boolean
}

// ── helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// ── SendPopover ───────────────────────────────────────────────────────────────

interface SendPopoverProps {
  send:           SendEntry
  containerRef:   React.RefObject<HTMLElement | null>
  triggerRef:     React.RefObject<HTMLElement | null>
  onClose:        () => void
  onSetSendLevel: (returnId: string, level: number) => void
  onSetSendTap:   (returnId: string, tap: 'pre' | 'post') => void
  onSetSendPan:   (returnId: string, pan: number) => void
  onRemoveSend:   (returnId: string) => void
}

function SendPopover({
  send, containerRef, triggerRef, onClose, onSetSendLevel, onSetSendTap, onSetSendPan, onRemoveSend,
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
  open:           boolean
  disabled?:      boolean
  onClick:        () => void
  onClose:        () => void
  onSetSendLevel: (returnId: string, level: number) => void
  onSetSendTap:   (returnId: string, tap: 'pre' | 'post') => void
  onSetSendPan:   (returnId: string, pan: number) => void
  onRemoveSend:   (returnId: string) => void
}

function SendChipPill({
  send, open, disabled, onClick, onClose, onSetSendLevel, onSetSendTap, onSetSendPan, onRemoveSend,
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
        onClick={onClick}
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
          containerRef={containerRef as React.RefObject<HTMLElement | null>}
          triggerRef={triggerRef as React.RefObject<HTMLElement | null>}
          onClose={onClose}
          onSetSendLevel={onSetSendLevel}
          onSetSendTap={onSetSendTap}
          onSetSendPan={onSetSendPan}
          onRemoveSend={onRemoveSend}
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
  size = 'md',
  disabled,
}: SendChipProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  function openChip(id: string)  { if (!disabled) setOpenId(id) }
  function closeChip()           { setOpenId(null) }

  return (
    <div className={styles.row} data-size={size}>
      {sends.map(send => (
        <SendChipPill
          key={send.returnId}
          send={send}
          open={openId === send.returnId}
          disabled={disabled}
          onClick={() => openId === send.returnId ? closeChip() : openChip(send.returnId)}
          onClose={closeChip}
          onSetSendLevel={onSetSendLevel}
          onSetSendTap={onSetSendTap}
          onSetSendPan={onSetSendPan}
          onRemoveSend={onRemoveSend}
        />
      ))}
      <AddSendButton
        sends={sends}
        returns={returns}
        onAddSend={onAddSend}
        disabled={disabled}
      />
    </div>
  )
}
