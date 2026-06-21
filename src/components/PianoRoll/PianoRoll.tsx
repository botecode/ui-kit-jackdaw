// src/components/PianoRoll/PianoRoll.tsx
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  LANE_H_MD, LANE_H_SM, KEY_W_MD, KEY_W_SM, RESIZE_ZONE,
  isBlackKey, midiNoteToName, noteLabel,
  pitchToY, yToPitch, beatsToX, xToBeats, snapToGrid,
  clampPitch, buildPitchRange,
} from './pianoRollMath'
import { registerActions, matchesAction } from '../../lib/keybindingRegistry'
import styles from './PianoRoll.module.css'

export interface PianoNote {
  id: string
  pitch: number
  start: number
  length: number
  velocity?: number
}

export interface PianoRollProps {
  notes: PianoNote[]
  pitchRange?: [number, number]
  pxPerBeat: number
  division?: number
  snap?: boolean
  durationBeats?: number
  onAddNote?: (pitch: number, start: number) => void
  onMoveNote?: (id: string, pitch: number, start: number) => void
  onResizeNote?: (id: string, length: number) => void
  onDeleteNote?: (id: string) => void
  onSelectNote?: (ids: string[]) => void
  onTimeZoom?: (pxPerBeat: number) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

// ─── Drag state ───────────────────────────────────────────────────────────────

type DragKind =
  | { kind: 'none' }
  | { kind: 'drawing'; pitch: number; startBeats: number; lengthBeats: number }
  | { kind: 'moving';  id: string; pitch: number; startBeats: number; offsetX: number; offsetY: number }
  | { kind: 'resizing'; id: string; noteLeft: number; lengthBeats: number }

// ─── Velocity → opacity (louder = more opaque) ────────────────────────────────

function velocityOpacity(velocity = 100): number {
  return 0.5 + 0.5 * (Math.max(0, Math.min(127, velocity)) / 127)
}

// ─── Wheel zoom constants ─────────────────────────────────────────────────────

const VZOOM_SENSITIVITY = 50  // deltaY per octave step
const HZOOM_SENSITIVITY = 50  // deltaX per pxPerBeat step
const HZOOM_STEP        = 8   // px-per-beat change per step

// ─── PianoRoll ────────────────────────────────────────────────────────────────

export function PianoRoll({
  notes,
  pitchRange = [24, 96],
  pxPerBeat,
  division = 0.25,
  snap = false,
  durationBeats = 16,
  onAddNote,
  onMoveNote,
  onResizeNote,
  onDeleteNote,
  onSelectNote,
  onTimeZoom,
  size = 'md',
  disabled = false,
}: PianoRollProps) {
  const [loNote, hiNote] = pitchRange
  const laneH     = size === 'sm' ? LANE_H_SM : LANE_H_MD
  const keyW      = size === 'sm' ? KEY_W_SM  : KEY_W_MD

  // ── Vertical zoom ────────────────────────────────────────────────────────────

  const totalOctaves     = Math.max(1, Math.ceil((hiNote - loNote) / 12))
  const [visibleOctaves, setVisibleOctaves] = useState(totalOctaves)
  const [viewCenterPitch, setViewCenterPitch] = useState(
    () => Math.round((loNote + hiNote) / 2),
  )

  const clampedOctaves = Math.max(1, Math.min(totalOctaves, visibleOctaves))

  // Derive the visible pitch window from center + octave count
  let viewHi: number, viewLo: number
  if (clampedOctaves >= totalOctaves) {
    viewHi = hiNote
    viewLo = loNote
  } else {
    const half = Math.floor((clampedOctaves * 12) / 2)
    viewHi     = Math.min(hiNote, viewCenterPitch + half)
    viewLo     = Math.max(loNote, viewHi - clampedOctaves * 12 + 1)
    if (viewHi - viewLo < clampedOctaves * 12 - 1) {
      viewHi = Math.min(hiNote, viewLo + clampedOctaves * 12 - 1)
    }
  }

  const pitches     = buildPitchRange(viewLo, viewHi)
  const totalHeight = pitches.length * laneH
  const totalWidth  = beatsToX(durationBeats, pxPerBeat)

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const onSelectNoteRef = useRef(onSelectNote)
  useEffect(() => { onSelectNoteRef.current = onSelectNote })

  const handleSelectNote = useCallback((id: string, multi: boolean) => {
    setSelectedIds(prev => {
      let next: Set<string>
      if (multi) {
        next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
      } else {
        next = new Set([id])
      }
      onSelectNoteRef.current?.(Array.from(next))
      return next
    })
  }, [])

  // ── Drag state (mutable ref — avoids stale closures in pointer handlers) ─────
  const dragRef        = useRef<DragKind>({ kind: 'none' })
  const [dragDisplay, setDragDisplay] = useState<DragKind>({ kind: 'none' })
  const containerRef   = useRef<HTMLDivElement>(null)

  // Stable refs for prop values used inside pointer handlers
  const pxPerBeatRef = useRef(pxPerBeat)
  const divisionRef  = useRef(division)
  const snapRef      = useRef(snap)
  const loNoteRef    = useRef(loNote)
  const hiNoteRef    = useRef(hiNote)
  const laneHRef     = useRef(laneH)
  const keyWRef      = useRef(keyW)
  const viewHiRef    = useRef(viewHi)
  const viewLoRef    = useRef(viewLo)
  useEffect(() => { pxPerBeatRef.current = pxPerBeat })
  useEffect(() => { divisionRef.current  = division })
  useEffect(() => { snapRef.current      = snap })
  useEffect(() => { loNoteRef.current    = loNote })
  useEffect(() => { hiNoteRef.current    = hiNote })
  useEffect(() => { laneHRef.current     = laneH })
  useEffect(() => { keyWRef.current      = keyW })
  useEffect(() => { viewHiRef.current    = viewHi })
  useEffect(() => { viewLoRef.current    = viewLo })

  const onAddRef      = useRef(onAddNote)
  const onMoveRef     = useRef(onMoveNote)
  const onResizeRef   = useRef(onResizeNote)
  const onTimeZoomRef = useRef(onTimeZoom)
  useEffect(() => { onAddRef.current      = onAddNote })
  useEffect(() => { onMoveRef.current     = onMoveNote })
  useEffect(() => { onResizeRef.current   = onResizeNote })
  useEffect(() => { onTimeZoomRef.current = onTimeZoom })

  // Ref mirrors for wheel handler (needs stable refs, not stale closures)
  const totalOctavesRef = useRef(totalOctaves)
  useEffect(() => { totalOctavesRef.current = totalOctaves })

  // Wheel accumulation (smooth / sensitivity-gated zoom)
  const vZoomAccumRef = useRef(0)
  const hZoomAccumRef = useRef(0)

  // ── Register keyboard actions in global keybinding registry ──────────────────

  useEffect(() => {
    return registerActions([
      { id: 'piano-roll:note-up',          name: 'Note up a semitone',   category: 'Piano Roll', defaultBindings: ['ArrowUp'] },
      { id: 'piano-roll:note-down',        name: 'Note down a semitone', category: 'Piano Roll', defaultBindings: ['ArrowDown'] },
      { id: 'piano-roll:note-up-octave',   name: 'Note up an octave',    category: 'Piano Roll', defaultBindings: ['⌘ArrowUp'] },
      { id: 'piano-roll:note-down-octave', name: 'Note down an octave',  category: 'Piano Roll', defaultBindings: ['⌘ArrowDown'] },
      { id: 'piano-roll:note-right',       name: 'Move note right',      category: 'Piano Roll', defaultBindings: ['ArrowRight'] },
      { id: 'piano-roll:note-left',        name: 'Move note left',       category: 'Piano Roll', defaultBindings: ['ArrowLeft'] },
      { id: 'piano-roll:note-delete',      name: 'Delete note',          category: 'Piano Roll', defaultBindings: ['Delete', 'Backspace'] },
    ])
  }, []) // register once — cleanup returned fn unregisters on unmount

  // ── Imperative wheel handler (non-passive so preventDefault works) ────────────

  useEffect(() => {
    const el = containerRef.current!
    function onWheel(e: WheelEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      e.preventDefault()

      const isHDominant = !e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)

      if (isHDominant && onTimeZoomRef.current) {
        hZoomAccumRef.current += e.deltaX
        if (Math.abs(hZoomAccumRef.current) >= HZOOM_SENSITIVITY) {
          const step = Math.sign(hZoomAccumRef.current)
          hZoomAccumRef.current = 0
          const next = Math.max(16, Math.min(256, pxPerBeatRef.current + step * HZOOM_STEP))
          onTimeZoomRef.current(next)
        }
      } else {
        vZoomAccumRef.current += e.deltaY
        if (Math.abs(vZoomAccumRef.current) >= VZOOM_SENSITIVITY) {
          const step = Math.sign(vZoomAccumRef.current) // +1 zoom out, -1 zoom in
          vZoomAccumRef.current = 0
          setVisibleOctaves(v => Math.max(1, Math.min(totalOctavesRef.current, v + step)))
        }
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // stable: uses only refs and stable state setters

  // ── Coordinate helpers ───────────────────────────────────────────────────────

  function gridXY(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      gx: clientX - rect.left - keyWRef.current,
      gy: clientY - rect.top,
    }
  }

  // ── Grid pointer handlers (click-to-add / draw) ──────────────────────────────

  function handleGridPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)

    const { gx, gy } = gridXY(e.clientX, e.clientY)
    let startBeats   = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
    if (snapRef.current) startBeats = snapToGrid(startBeats, divisionRef.current)
    startBeats = Math.max(0, startBeats)
    const pitch = clampPitch(yToPitch(gy, viewHiRef.current, laneHRef.current), loNoteRef.current, hiNoteRef.current)

    const d: DragKind = { kind: 'drawing', pitch, startBeats, lengthBeats: divisionRef.current }
    dragRef.current = d
    setDragDisplay(d)

    // Clear selection on grid click
    setSelectedIds(new Set())
    onSelectNoteRef.current?.([])
  }

  function handleGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (d.kind !== 'drawing') return
    const { gx } = gridXY(e.clientX, e.clientY)
    let endBeats = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
    if (snapRef.current) endBeats = snapToGrid(endBeats, divisionRef.current)
    const rawLen      = endBeats - d.startBeats
    const minLen      = divisionRef.current
    const lengthBeats = Math.max(minLen, rawLen)
    const next: DragKind = { ...d, lengthBeats }
    dragRef.current  = next
    setDragDisplay(next)
  }

  function handleGridPointerUp() {
    const d = dragRef.current
    if (d.kind === 'drawing') {
      onAddRef.current?.(d.pitch, d.startBeats)
    }
    dragRef.current = { kind: 'none' }
    setDragDisplay({ kind: 'none' })
  }

  // ── Note pointer handlers ─────────────────────────────────────────────────────

  function handleNotePointerDown(e: React.PointerEvent<HTMLDivElement>, note: PianoNote) {
    if (disabled || e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)

    const noteEl   = e.currentTarget
    const noteRect = noteEl.getBoundingClientRect()
    const distFromRight = noteRect.right - e.clientX

    if (distFromRight <= RESIZE_ZONE) {
      const d: DragKind = {
        kind: 'resizing',
        id: note.id,
        noteLeft: noteRect.left,
        lengthBeats: note.length,
      }
      dragRef.current = d
      setDragDisplay(d)
    } else {
      const containerRect = containerRef.current!.getBoundingClientRect()
      const noteLeft = beatsToX(note.start, pxPerBeatRef.current)
      const noteTop  = pitchToY(note.pitch, viewHiRef.current, laneHRef.current)
      const offsetX  = e.clientX - (containerRect.left + keyWRef.current + noteLeft)
      const offsetY  = e.clientY - (containerRect.top + noteTop)
      const d: DragKind = { kind: 'moving', id: note.id, pitch: note.pitch, startBeats: note.start, offsetX, offsetY }
      dragRef.current = d
      setDragDisplay(d)
    }

    const multi = e.shiftKey || e.metaKey || e.ctrlKey
    handleSelectNote(note.id, multi)
  }

  function handleNotePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (d.kind === 'moving') {
      const containerRect = containerRef.current!.getBoundingClientRect()
      const gx = e.clientX - containerRect.left - keyWRef.current - d.offsetX
      const gy = e.clientY - containerRect.top  - d.offsetY + laneHRef.current / 2
      let startBeats = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
      if (snapRef.current) startBeats = snapToGrid(startBeats, divisionRef.current)
      startBeats = Math.max(0, startBeats)
      const pitch = clampPitch(yToPitch(Math.max(0, gy), viewHiRef.current, laneHRef.current), loNoteRef.current, hiNoteRef.current)
      const next: DragKind = { ...d, pitch, startBeats }
      dragRef.current = next
      setDragDisplay(next)
    } else if (d.kind === 'resizing') {
      const newWidth  = Math.max(0, e.clientX - d.noteLeft)
      let lengthBeats = xToBeats(Math.max(pxPerBeatRef.current * divisionRef.current, newWidth), pxPerBeatRef.current)
      if (snapRef.current) lengthBeats = snapToGrid(lengthBeats, divisionRef.current)
      lengthBeats = Math.max(divisionRef.current, lengthBeats)
      const next: DragKind = { ...d, lengthBeats }
      dragRef.current = next
      setDragDisplay(next)
    }
  }

  function handleNotePointerUp() {
    const d = dragRef.current
    if (d.kind === 'moving') {
      onMoveRef.current?.(d.id, d.pitch, d.startBeats)
    } else if (d.kind === 'resizing') {
      onResizeRef.current?.(d.id, d.lengthBeats)
    }
    dragRef.current = { kind: 'none' }
    setDragDisplay({ kind: 'none' })
  }

  function handleNoteContextMenu(e: React.MouseEvent, note: PianoNote) {
    if (disabled) return
    e.preventDefault()
    onDeleteNote?.(note.id)
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(note.id)
      onSelectNoteRef.current?.(Array.from(next))
      return next
    })
  }

  // ── Note keyboard navigation (reads from keybinding registry) ────────────────

  function handleNoteKeyDown(e: React.KeyboardEvent, note: PianoNote) {
    if (disabled) return
    if (matchesAction('piano-roll:note-up-octave', e)) {
      e.preventDefault()
      onMoveNote?.(note.id, clampPitch(note.pitch + 12, loNote, hiNote), note.start)
    } else if (matchesAction('piano-roll:note-down-octave', e)) {
      e.preventDefault()
      onMoveNote?.(note.id, clampPitch(note.pitch - 12, loNote, hiNote), note.start)
    } else if (matchesAction('piano-roll:note-up', e)) {
      e.preventDefault()
      onMoveNote?.(note.id, clampPitch(note.pitch + 1, loNote, hiNote), note.start)
    } else if (matchesAction('piano-roll:note-down', e)) {
      e.preventDefault()
      onMoveNote?.(note.id, clampPitch(note.pitch - 1, loNote, hiNote), note.start)
    } else if (matchesAction('piano-roll:note-right', e)) {
      e.preventDefault()
      onMoveNote?.(note.id, note.pitch, note.start + division)
    } else if (matchesAction('piano-roll:note-left', e)) {
      e.preventDefault()
      onMoveNote?.(note.id, note.pitch, Math.max(0, note.start - division))
    } else if (matchesAction('piano-roll:note-delete', e)) {
      e.preventDefault()
      onDeleteNote?.(note.id)
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(note.id)
        onSelectNoteRef.current?.(Array.from(next))
        return next
      })
    }
  }

  // ── Zoom controls ────────────────────────────────────────────────────────────

  function zoomBy(delta: number) {
    // Re-center on current selection before zooming
    const sel = notes.filter(n => selectedIds.has(n.id))
    if (sel.length > 0) {
      const center = Math.round(sel.reduce((s, n) => s + n.pitch, 0) / sel.length)
      setViewCenterPitch(center)
    }
    setVisibleOctaves(v => Math.max(1, Math.min(totalOctaves, v + delta)))
  }

  // ── Resolve display positions (drag overrides for the dragged note) ───────────

  function resolveNote(note: PianoNote): { pitch: number; start: number; length: number } {
    const d = dragDisplay
    if (d.kind === 'moving'   && d.id === note.id) return { pitch: d.pitch,    start: d.startBeats, length: note.length }
    if (d.kind === 'resizing' && d.id === note.id) return { pitch: note.pitch,  start: note.start,   length: d.lengthBeats }
    return { pitch: note.pitch, start: note.start, length: note.length }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={styles.root}
      data-testid="piano-roll"
      data-size={size}
      data-disabled={disabled || undefined}
      style={{ '--lane-h': `${laneH}px`, '--key-w': `${keyW}px` } as React.CSSProperties}
    >
      {/* ── Zoom toolbar ── */}
      <div className={styles.toolbar} aria-label="Vertical zoom">
        <button
          className={styles.zoomBtn}
          onClick={() => zoomBy(-1)}
          disabled={clampedOctaves <= 1}
          aria-label="Zoom in (fewer octaves)"
        >−</button>
        <span
          className={styles.zoomLabel}
          data-testid="piano-roll-octave-count"
          aria-label={`${clampedOctaves} octaves visible`}
        >{clampedOctaves}oct</span>
        <button
          className={styles.zoomBtn}
          onClick={() => zoomBy(1)}
          disabled={clampedOctaves >= totalOctaves}
          aria-label="Zoom out (more octaves)"
        >+</button>
      </div>

      <div ref={containerRef} className={styles.scrollArea} data-testid="piano-roll-scroll">
        <div
          className={styles.inner}
          style={{ width: keyW + totalWidth, height: totalHeight }}
        >
          {/* ── Piano keyboard strip ── */}
          <div className={styles.keyboard} aria-hidden="true" style={{ width: keyW }}>
            {pitches.map(p => (
              <div
                key={p}
                className={styles.key}
                data-black-key={isBlackKey(p) || undefined}
                data-octave-c={p % 12 === 0 || undefined}
                style={{ height: laneH }}
              >
                {p % 12 === 0 && (
                  <span className={styles.keyLabel}>{midiNoteToName(p)}</span>
                )}
              </div>
            ))}
          </div>

          {/* ── Grid + notes ── */}
          <div
            className={styles.grid}
            data-testid="piano-roll-grid"
            style={{ width: totalWidth, '--beat-px': `${pxPerBeat}px` } as React.CSSProperties}
            onPointerDown={disabled ? undefined : handleGridPointerDown}
            onPointerMove={disabled ? undefined : handleGridPointerMove}
            onPointerUp={disabled ? undefined : handleGridPointerUp}
            onPointerCancel={disabled ? undefined : handleGridPointerUp}
            onContextMenu={e => e.preventDefault()}
          >
            {/* Pitch lane backgrounds (only visible pitch rows) */}
            {pitches.map(p => (
              <div
                key={p}
                className={styles.laneRow}
                data-black-key={isBlackKey(p) || undefined}
                style={{ height: laneH }}
                aria-hidden="true"
              />
            ))}

            {/* Notes — all notes rendered; pitch-to-y uses viewHi so out-of-view
                notes fall outside the content area and are clipped by root overflow:hidden */}
            {notes.map(note => {
              const { pitch, start, length } = resolveNote(note)
              const left    = beatsToX(start, pxPerBeat)
              const top     = pitchToY(pitch, viewHi, laneH) + 1
              const width   = Math.max(4, beatsToX(length, pxPerBeat))
              const height  = laneH - 2
              const opacity = velocityOpacity(note.velocity)
              const isSel   = selectedIds.has(note.id)
              const isDrag  = dragDisplay.kind !== 'none' && (dragDisplay as { id?: string }).id === note.id

              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-pressed={isSel}
                  aria-disabled={disabled || undefined}
                  aria-label={noteLabel(note.pitch, note.start, division)}
                  data-testid={`note-${note.id}`}
                  data-selected={isSel || undefined}
                  data-dragging={isDrag || undefined}
                  className={styles.note}
                  style={{ left, top, width, height, opacity }}
                  onPointerDown={disabled ? undefined : ev => handleNotePointerDown(ev, note)}
                  onPointerMove={disabled ? undefined : ev => handleNotePointerMove(ev)}
                  onPointerUp={disabled ? undefined : () => handleNotePointerUp()}
                  onPointerCancel={disabled ? undefined : () => handleNotePointerUp()}
                  onContextMenu={disabled ? undefined : ev => handleNoteContextMenu(ev, note)}
                  onKeyDown={disabled ? undefined : ev => handleNoteKeyDown(ev, note)}
                >
                  <span className={styles.noteLabel} aria-hidden="true">{midiNoteToName(pitch)}</span>
                  <div className={styles.noteResizeHandle} aria-hidden="true" />
                </div>
              )
            })}

            {/* Ghost note while drawing */}
            {dragDisplay.kind === 'drawing' && (() => {
              const d      = dragDisplay
              const left   = beatsToX(d.startBeats, pxPerBeat)
              const top    = pitchToY(d.pitch, viewHi, laneH) + 1
              const width  = Math.max(4, beatsToX(d.lengthBeats, pxPerBeat))
              const height = laneH - 2
              return (
                <div
                  className={styles.noteGhost}
                  aria-hidden="true"
                  style={{ left, top, width, height }}
                />
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
