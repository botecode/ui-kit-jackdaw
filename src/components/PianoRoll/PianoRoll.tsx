// src/components/PianoRoll/PianoRoll.tsx
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  LANE_H_MD, LANE_H_SM, KEY_W_MD, KEY_W_SM, RESIZE_ZONE,
  isBlackKey, midiNoteToName, noteLabel,
  pitchToY, yToPitch, beatsToX, xToBeats, snapToGrid,
  clampPitch, buildPitchRange,
} from './pianoRollMath'
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
  size?: 'sm' | 'md'
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
  size = 'md',
}: PianoRollProps) {
  const [loNote, hiNote] = pitchRange
  const pitches   = buildPitchRange(loNote, hiNote)
  const laneH     = size === 'sm' ? LANE_H_SM : LANE_H_MD
  const keyW      = size === 'sm' ? KEY_W_SM  : KEY_W_MD

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
  useEffect(() => { pxPerBeatRef.current = pxPerBeat })
  useEffect(() => { divisionRef.current  = division })
  useEffect(() => { snapRef.current      = snap })
  useEffect(() => { loNoteRef.current    = loNote })
  useEffect(() => { hiNoteRef.current    = hiNote })
  useEffect(() => { laneHRef.current     = laneH })
  useEffect(() => { keyWRef.current      = keyW })

  const onAddRef    = useRef(onAddNote)
  const onMoveRef   = useRef(onMoveNote)
  const onResizeRef = useRef(onResizeNote)
  useEffect(() => { onAddRef.current    = onAddNote })
  useEffect(() => { onMoveRef.current   = onMoveNote })
  useEffect(() => { onResizeRef.current = onResizeNote })

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
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)

    const { gx, gy } = gridXY(e.clientX, e.clientY)
    let startBeats   = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
    if (snapRef.current) startBeats = snapToGrid(startBeats, divisionRef.current)
    startBeats = Math.max(0, startBeats)
    const pitch = clampPitch(yToPitch(gy, hiNoteRef.current, laneHRef.current), loNoteRef.current, hiNoteRef.current)

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
    if (e.button !== 0) return
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
      const noteTop  = pitchToY(note.pitch, hiNoteRef.current, laneHRef.current)
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
      // Compute new grid position from pointer, subtracting the grab offset
      const containerRect = containerRef.current!.getBoundingClientRect()
      const gx = e.clientX - containerRect.left - keyWRef.current - d.offsetX
      const gy = e.clientY - containerRect.top  - d.offsetY + laneHRef.current / 2
      let startBeats = xToBeats(Math.max(0, gx), pxPerBeatRef.current)
      if (snapRef.current) startBeats = snapToGrid(startBeats, divisionRef.current)
      startBeats = Math.max(0, startBeats)
      const pitch = clampPitch(yToPitch(Math.max(0, gy), hiNoteRef.current, laneHRef.current), loNoteRef.current, hiNoteRef.current)
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
    e.preventDefault()
    onDeleteNote?.(note.id)
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(note.id)
      onSelectNoteRef.current?.(Array.from(next))
      return next
    })
  }

  // ── Note keyboard navigation ─────────────────────────────────────────────────

  function handleNoteKeyDown(e: React.KeyboardEvent, note: PianoNote) {
    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault()
        const delta = e.shiftKey ? 12 : 1
        onMoveNote?.(note.id, clampPitch(note.pitch + delta, loNote, hiNote), note.start)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        const delta = e.shiftKey ? 12 : 1
        onMoveNote?.(note.id, clampPitch(note.pitch - delta, loNote, hiNote), note.start)
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        onMoveNote?.(note.id, note.pitch, note.start + division)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        onMoveNote?.(note.id, note.pitch, Math.max(0, note.start - division))
        break
      }
      case 'Delete':
      case 'Backspace': {
        e.preventDefault()
        onDeleteNote?.(note.id)
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(note.id)
          onSelectNoteRef.current?.(Array.from(next))
          return next
        })
        break
      }
      default: return
    }
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
      style={{ '--lane-h': `${laneH}px`, '--key-w': `${keyW}px` } as React.CSSProperties}
    >
      <div ref={containerRef} className={styles.scrollArea}>
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
            onPointerDown={handleGridPointerDown}
            onPointerMove={handleGridPointerMove}
            onPointerUp={handleGridPointerUp}
            onPointerCancel={handleGridPointerUp}
            onContextMenu={e => e.preventDefault()}
          >
            {/* Pitch lane backgrounds (one row per semitone) */}
            {pitches.map(p => (
              <div
                key={p}
                className={styles.laneRow}
                data-black-key={isBlackKey(p) || undefined}
                style={{ height: laneH }}
                aria-hidden="true"
              />
            ))}

            {/* Notes */}
            {notes.map(note => {
              const { pitch, start, length } = resolveNote(note)
              const left    = beatsToX(start, pxPerBeat)
              const top     = pitchToY(pitch, hiNote, laneH) + 1
              const width   = Math.max(4, beatsToX(length, pxPerBeat))
              const height  = laneH - 2
              const opacity = velocityOpacity(note.velocity)
              const isSel   = selectedIds.has(note.id)
              const isDrag  = dragDisplay.kind !== 'none' && (dragDisplay as { id?: string }).id === note.id

              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSel}
                  aria-label={noteLabel(note.pitch, note.start, division)}
                  data-testid={`note-${note.id}`}
                  data-selected={isSel || undefined}
                  data-dragging={isDrag || undefined}
                  className={styles.note}
                  style={{ left, top, width, height, opacity }}
                  onPointerDown={ev => handleNotePointerDown(ev, note)}
                  onPointerMove={ev => handleNotePointerMove(ev)}
                  onPointerUp={() => handleNotePointerUp()}
                  onPointerCancel={() => handleNotePointerUp()}
                  onContextMenu={ev => handleNoteContextMenu(ev, note)}
                  onKeyDown={ev => handleNoteKeyDown(ev, note)}
                >
                  <div className={styles.noteResizeHandle} aria-hidden="true" />
                </div>
              )
            })}

            {/* Ghost note while drawing */}
            {dragDisplay.kind === 'drawing' && (() => {
              const d      = dragDisplay
              const left   = beatsToX(d.startBeats, pxPerBeat)
              const top    = pitchToY(d.pitch, hiNote, laneH) + 1
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
