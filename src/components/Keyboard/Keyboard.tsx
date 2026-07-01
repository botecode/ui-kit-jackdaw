// src/components/Keyboard/Keyboard.tsx
//
// Why this isn't a webpage:
// A raw JUCE MidiKeyboardComponent (or a web <div> row) reads as chrome. This
// reads as an instrument: white keys are matte ivory tablets set into a
// recessed --stage keybed with a hairline top-highlight; black keys are shorter
// raised slabs that cast a soft shadow onto the whites. Pressing a key doesn't
// "toggle a class" — it depresses (a small translateY) and lights with the
// Chroma LED bloom on incandescent timing (fast --dur-led-on attack, slow
// --dur-led-off decay), so a held chord glows the way real key-contacts do.
// Velocity comes from *where* you strike (front = loud, back = soft), the way a
// weighted key responds. It's a controlled, presentational surface — it emits
// MIDI intents (onNoteOn/onNoteOff) and never makes a sound.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import styles from './Keyboard.module.css'
import {
  buildKeys,
  keyGeometry,
  keybedWidth,
  clampNote,
  velocityFromRatio,
  baseCFor,
  DEFAULT_VELOCITY,
  KEY_W_MD,
  KEY_W_SM,
  KEY_H_MD,
  KEY_H_SM,
  BLACK_H_RATIO,
  QWERTY_TO_SEMITONE,
  QWERTY_OCTAVE_DOWN,
  QWERTY_OCTAVE_UP,
} from './keyboardMath'

/** A MIDI note number, 0–127. */
export type MidiNote = number

export interface KeyboardProps {
  /** Lowest note drawn (MIDI). Widened outward to a white key. Default C3 (48). */
  startNote?: MidiNote
  /** Highest note drawn (MIDI). Widened outward to a white key. Default C5 (72). */
  endNote?: MidiNote
  /**
   * Host-driven lit notes (e.g. incoming MIDI, a sustained chord). Merged
   * visually with the user's own press state — same accent bloom either way.
   */
  activeNotes?: Set<MidiNote> | readonly MidiNote[]
  /** Fired on key-down / strike. `velocity` is 1–127 (front of key = louder). */
  onNoteOn?: (note: MidiNote, velocity: number) => void
  /** Fired on release. */
  onNoteOff?: (note: MidiNote) => void
  /** Opt-in QWERTY musical typing (A S D F… ; Z/X shift octave) when focused. */
  computerKeyboard?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

function toSet(notes?: Set<MidiNote> | readonly MidiNote[]): Set<MidiNote> {
  if (!notes) return EMPTY_SET
  return notes instanceof Set ? notes : new Set(notes)
}
const EMPTY_SET: Set<MidiNote> = new Set()

export function Keyboard({
  startNote = 48,
  endNote = 72,
  activeNotes,
  onNoteOn,
  onNoteOff,
  computerKeyboard = false,
  size = 'md',
  disabled = false,
  className,
  'aria-label': ariaLabel = 'On-screen keyboard',
}: KeyboardProps) {
  const whiteW = size === 'sm' ? KEY_W_SM : KEY_W_MD
  const height = size === 'sm' ? KEY_H_SM : KEY_H_MD

  const { keys, whiteCount } = useMemo(
    () => buildKeys(startNote, endNote),
    [startNote, endNote],
  )
  const bedWidth = keybedWidth(whiteCount, whiteW)
  const hostActive = toSet(activeNotes)

  // Locally-pressed notes (pointer / physical keyboard). Rendered as lit, and
  // released on blur/unmount so a note can never get stuck.
  const [pressed, setPressed] = useState<Set<MidiNote>>(() => new Set())

  // Refs mirror the latest state/callbacks for cleanup paths (blur, unmount)
  // that must release notes without re-subscribing effects.
  const pressedRef = useRef(pressed)
  pressedRef.current = pressed
  const onNoteOnRef = useRef(onNoteOn)
  onNoteOnRef.current = onNoteOn
  const onNoteOffRef = useRef(onNoteOff)
  onNoteOffRef.current = onNoteOff

  // Roving tabindex — one key is tabbable at a time.
  const [focusIndex, setFocusIndex] = useState(0)
  const keybedRef = useRef<HTMLDivElement>(null)

  // Glissando: the note currently held by the dragging pointer.
  const pointerNoteRef = useRef<MidiNote | null>(null)
  // QWERTY octave transpose — a ref because nothing renders from it.
  const octaveShiftRef = useRef(0)

  const press = useCallback((note: MidiNote, velocity: number) => {
    setPressed(prev => {
      if (prev.has(note)) return prev // ignore auto-repeat / double strike
      const next = new Set(prev)
      next.add(note)
      onNoteOnRef.current?.(note, velocity)
      return next
    })
  }, [])

  const release = useCallback((note: MidiNote) => {
    setPressed(prev => {
      if (!prev.has(note)) return prev
      const next = new Set(prev)
      next.delete(note)
      onNoteOffRef.current?.(note)
      return next
    })
  }, [])

  const releaseAll = useCallback(() => {
    const held = pressedRef.current
    if (held.size === 0) return
    held.forEach(n => onNoteOffRef.current?.(n))
    setPressed(new Set())
  }, [])

  // Release everything if the component unmounts mid-hold.
  useEffect(() => releaseAll, [releaseAll])

  // ─── Pointer (mouse + touch) ────────────────────────────────────────────────

  // Velocity from where on the key the strike lands (front/bottom = louder).
  const velocityAt = (note: MidiNote, clientY: number): number => {
    const el = keybedRef.current?.querySelector<HTMLElement>(`[data-note="${note}"]`)
    const rect = el?.getBoundingClientRect()
    if (!rect || rect.height <= 0) return DEFAULT_VELOCITY
    return velocityFromRatio((clientY - rect.top) / rect.height)
  }

  const keyFromPoint = (clientX: number, clientY: number): MidiNote | null => {
    const el = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('[data-note]')
    if (!el || el.getAttribute('data-disabled') != null) return null
    const n = Number(el.getAttribute('data-note'))
    return Number.isFinite(n) ? n : null
  }

  const handlePointerDown = (e: ReactPointerEvent, note: MidiNote) => {
    if (disabled || e.button !== 0) return
    e.preventDefault() // don't steal focus as a text-selection drag
    ;(e.currentTarget as HTMLElement).focus()
    // Capture so glissando keeps tracking even past a key's own bounds.
    try { keybedRef.current?.setPointerCapture?.(e.pointerId) } catch { /* unsupported */ }
    pointerNoteRef.current = note
    setFocusIndex(keys.findIndex(k => k.note === note))
    press(note, velocityAt(note, e.clientY))
  }

  // Glissando — slide across keys with the pointer held.
  const handlePointerMove = (e: ReactPointerEvent) => {
    if (disabled || pointerNoteRef.current == null) return
    const note = keyFromPoint(e.clientX, e.clientY)
    if (note == null || note === pointerNoteRef.current) return
    release(pointerNoteRef.current)
    pointerNoteRef.current = note
    press(note, velocityAt(note, e.clientY))
  }

  const endPointer = (e: ReactPointerEvent) => {
    if (pointerNoteRef.current == null) return
    try { keybedRef.current?.releasePointerCapture?.(e.pointerId) } catch { /* unsupported */ }
    release(pointerNoteRef.current)
    pointerNoteRef.current = null
  }

  // ─── Keyboard: roving focus + Enter/Space + opt-in QWERTY ───────────────────

  const moveFocus = (index: number) => {
    const clamped = Math.max(0, Math.min(keys.length - 1, index))
    setFocusIndex(clamped)
    keybedRef.current
      ?.querySelector<HTMLElement>(`[data-note="${keys[clamped].note}"]`)
      ?.focus()
  }

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (disabled) return
    const key = e.key
    const lower = key.length === 1 ? key.toLowerCase() : key

    // Roving navigation is always available.
    switch (key) {
      case 'ArrowRight': e.preventDefault(); return moveFocus(focusIndex + 1)
      case 'ArrowLeft':  e.preventDefault(); return moveFocus(focusIndex - 1)
      case 'Home':       e.preventDefault(); return moveFocus(0)
      case 'End':        e.preventDefault(); return moveFocus(keys.length - 1)
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!e.repeat) press(keys[focusIndex].note, DEFAULT_VELOCITY)
        return
    }

    // Opt-in QWERTY musical typing.
    if (!computerKeyboard) return
    if (lower === QWERTY_OCTAVE_DOWN) { octaveShiftRef.current -= 1; return }
    if (lower === QWERTY_OCTAVE_UP)   { octaveShiftRef.current += 1; return }
    const semitone = QWERTY_TO_SEMITONE[lower]
    if (semitone == null || e.repeat) return
    const note = baseCFor(startNote) + semitone + octaveShiftRef.current * 12
    const [lo, hi] = [keys[0].note, keys[keys.length - 1].note]
    if (note < lo || note > hi) return
    e.preventDefault()
    press(clampNote(note, lo, hi), DEFAULT_VELOCITY)
  }

  const handleKeyUp = (e: ReactKeyboardEvent) => {
    if (disabled) return
    const key = e.key
    if (key === 'Enter' || key === ' ') return release(keys[focusIndex].note)
    if (!computerKeyboard) return
    const lower = key.length === 1 ? key.toLowerCase() : key
    const semitone = QWERTY_TO_SEMITONE[lower]
    if (semitone == null) return
    const note = baseCFor(startNote) + semitone + octaveShiftRef.current * 12
    release(clampNote(note, keys[0].note, keys[keys.length - 1].note))
  }

  // Leaving the keybed entirely (not roving between its keys) releases all.
  const handleBlur = (e: React.FocusEvent) => {
    if (keybedRef.current?.contains(e.relatedTarget as Node)) return
    releaseAll()
  }

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-size={size}
      data-disabled={disabled || undefined}
      style={{ '--_key-h': `${height}px` } as CSSProperties}
    >
      {/* .scroll is a plain overflow wrapper; ref + all handlers + pointer
          capture live on .keybed so captured glissando events stay on target. */}
      <div className={styles.scroll}>
        <div
          ref={keybedRef}
          className={styles.keybed}
          data-testid="keyboard"
          role="group"
          aria-label={ariaLabel}
          aria-disabled={disabled || undefined}
          style={{ width: `${bedWidth}px`, height: `${height}px` }}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
        >
          {keys.map((k, i) => {
            const { left, width } = keyGeometry(k, whiteW)
            const lit = hostActive.has(k.note) || pressed.has(k.note)
            const keyStyle: CSSProperties = {
              left: `${left}px`,
              width: `${width}px`,
              ...(k.isBlack ? { height: `${height * BLACK_H_RATIO}px` } : null),
            }
            return (
              <button
                key={k.note}
                type="button"
                className={styles.key}
                data-note={k.note}
                data-black={k.isBlack || undefined}
                data-lit={lit || undefined}
                data-disabled={disabled || undefined}
                style={keyStyle}
                disabled={disabled}
                tabIndex={disabled ? -1 : i === focusIndex ? 0 : -1}
                aria-label={k.name}
                aria-pressed={lit}
                aria-disabled={disabled || undefined}
                onPointerDown={e => handlePointerDown(e, k.note)}
              >
                {!k.isBlack && (
                  <span className={styles.keyLabel} aria-hidden="true">
                    {k.name}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
