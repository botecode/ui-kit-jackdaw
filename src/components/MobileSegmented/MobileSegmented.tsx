import { useRef, useState } from 'react'
import styles from './MobileSegmented.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MobileSegment {
  /** Stable identity reported through `onChange` — the real intent the app acts on. */
  value: string
  /** Tab label (Write / Edit, All / Ideas / Masters). The app surface is text-first. */
  label?: string
  /** Optional leading glyph. When no `label` is set, `value` becomes the accessible name. */
  icon?: React.ReactNode
}

export interface MobileSegmentedProps {
  /** The 2–3 segments. Generic over N — the slider and grid scale to `segments.length`. */
  segments: MobileSegment[]
  /** Currently-active segment value. */
  value: string
  /** Fires the picked segment's value. The app owns the state (controlled). */
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label': string
  autoFocus?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
// The app-surface segmented control: a chunky, full-width pill (Write|Edit,
// All|Ideas|Masters). A single orange LED box sits behind the segments and
// *slides* to the active one; inactive segments stay dark and recessed in the
// well. Roving radiogroup, arrow-key navigation, satisfying press dip.
//
// Why this isn't a webpage: the generic web pattern is N independent buttons that
// each toggle their own `background: blue` on click — discrete, instant, flat.
// This is one physical lit element that travels, the way a real hardware selector
// moves a single illuminated marker between detents. The orange (`--led-orange`,
// per the app's screenshots — a deliberate override of the kit's generic
// accent-lit rule, because here the colour reads as the app's own identity) lights
// with an incandescent bloom and the box glides on a firm, critically-damped
// settle (no bounce). Off segments don't go grey — they sink into the `--stage`
// well with a recessed inset shadow, the kit's recessed-off / lit-on signature.
// Everything is token-driven, so it re-skins through every theme; nothing here is
// a hardcoded colour or a one-off shadow.

export function MobileSegmented({
  segments,
  value,
  onChange,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
  autoFocus,
}: MobileSegmentedProps) {
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pressedIdx, setPressedIdx] = useState<number | null>(null)

  // Roving tabindex: the matching segment is active; otherwise fall back to the
  // first so the group is always reachable by Tab and the slider has a home.
  const selectedIdx = segments.findIndex(s => s.value === value)
  const activeIdx = selectedIdx >= 0 ? selectedIdx : 0

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (disabled) return
    const last = segments.length - 1
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index < last ? index + 1 : 0
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index > 0 ? index - 1 : last
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(segments[next].value)
    segmentRefs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={styles.track}
      data-size={size}
      data-disabled={disabled || undefined}
      // Drive the sliding indicator entirely from these two custom properties so
      // the geometry stays generic over N — no per-segment width math in JS.
      style={{ '--_n': segments.length, '--_active': activeIdx } as React.CSSProperties}
      // The active segment's press dips the lit box (set on the group so CSS can
      // reach the absolutely-positioned slider).
      data-pressing={pressedIdx === activeIdx ? 'active' : undefined}
    >
      <span className={styles.slider} data-testid="mobseg-slider" aria-hidden="true" />

      {segments.map((seg, i) => {
        const selected = seg.value === value
        return (
          <button
            key={seg.value}
            ref={el => { segmentRefs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={seg.icon && !seg.label ? seg.value : undefined}
            data-selected={selected || undefined}
            data-pressed={pressedIdx === i || undefined}
            tabIndex={i === activeIdx ? 0 : -1}
            className={styles.segment}
            disabled={disabled}
            autoFocus={autoFocus && i === activeIdx}
            onClick={() => { if (!disabled) onChange(seg.value) }}
            onKeyDown={e => handleKeyDown(e, i)}
            onPointerDown={() => { if (!disabled) setPressedIdx(i) }}
            onPointerUp={() => setPressedIdx(null)}
            onPointerLeave={() => setPressedIdx(p => (p === i ? null : p))}
            onPointerCancel={() => setPressedIdx(null)}
          >
            {seg.icon && <span className={styles.icon} aria-hidden="true">{seg.icon}</span>}
            {seg.label && <span className={styles.label}>{seg.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
