// src/components/InstrumentTemplate/InstrumentTemplate.tsx
//
// The COLD, editable twin of LivingInstrumentCard — a track's *starting
// identity*, before it ever makes a sound. No meter, no volume/pan, no
// arm/mute/solo, no transport. Just the four things you set when you reach for
// an instrument: its name, its colour, its input, and its FX chain (as an
// ordered list of identities — no live plugin windows).
//
// Two shapes, one identity:
//   • variant="card"  — the editable form. Inline-rename plate, a row of preset
//     colour swatches, the input selector, and the cold FX chain. Presentational
//     and fully CONTROLLED: it owns no data, it only emits intents.
//   • variant="tile"  — the compact drawer chip: a colour square + glyph + label,
//     draggable so the host can drop it onto the studio to spawn a track.
//
// Reuse, not duplication: the colour picker is ColorSwatch's SwatchPalette, the
// input is the same InputSelect the studio card uses, and the FX list is the
// SAME reorderable list FxChip renders (FxChainList, in cold mode).
//
// Why this isn't a webpage: the card is a warm cream chassis with a colour spine
// and recessed control wells; the FX chain sits in a dark recessed stage; the
// tile is a tactile, grabbable object, not a link. Everything reskins through
// tokens — verify in Compare, light AND dark.

import { useRef, type CSSProperties } from 'react'
import styles from './InstrumentTemplate.module.css'
import { SwatchPalette, DEFAULT_PALETTE } from '../ColorSwatch'
import { InputSelect, type InputSelectOption } from '../InputSelect'
import { Panel } from '../Panel'
import { FxChainList } from '../FxChip'

// ── Types ─────────────────────────────────────────────────────────────────────

/** A cold FX entry — identity only (no bypass, no editor). */
export interface InstrumentTemplateFx {
  id:   string
  name: string
}

export interface InstrumentTemplateProps {
  /** Track name (controlled). Inline-editable in card mode; the tile label. */
  name: string
  /** Selected track colour (controlled). May be null (unset). */
  color: string | null
  /** Preset swatches for the colour picker. Defaults to the six track colours. */
  colorOptions?: string[]
  /** Input source — the same shape the studio card takes. */
  input: { value: string | null; options: InputSelectOption[] }
  /** Ordered FX chain — identity + order only. */
  fx: InstrumentTemplateFx[]

  // ── Intents (the component emits, never mutates) ──
  onNameChange:  (name: string) => void
  onColorChange: (color: string) => void
  onInputChange: (id: string) => void
  onFxAdd:       () => void
  onFxRemove:    (id: string) => void
  onFxReorder:   (fromIdx: number, toIdx: number) => void

  /** "card" = the editable form (default); "tile" = the compact drawer chip. */
  variant?: 'card' | 'tile'
  /** Density of the card form. (Tile is a fixed compact object.) */
  size?: 'sm' | 'md'
  disabled?: boolean

  /** Origin marker slot — the host drops a badge ("Jackdaw" vs "Mine") here so
   *  the drawer can distinguish built-in presets from the user's own. */
  origin?: React.ReactNode

  // ── Tile drag (host drags the tile onto the studio to spawn a track) ──
  /** Tile is draggable by default; pass false to pin it. Ignored in card mode. */
  draggable?: boolean
  /** Written onto the drag's dataTransfer (key → value) when a tile drag starts. */
  dragData?: Record<string, string>
  /** Fires on tile drag start (after dragData is applied) — the host's hook. */
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void

  'aria-label'?: string
}

// ── Bespoke instrument glyph (inline SVG, per the kit's audio-glyph rule) ──────
// A quiet three-bar mark — reads as "an instrument slot" on any track colour.

function InstrumentGlyph() {
  return (
    <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true" fill="none">
      <rect x="2"  y="8"  width="2.4" height="6" rx="1.2" fill="currentColor" />
      <rect x="6.8" y="4"  width="2.4" height="10" rx="1.2" fill="currentColor" />
      <rect x="11.6" y="6" width="2.4" height="8" rx="1.2" fill="currentColor" />
    </svg>
  )
}

// ── Inline-editable name plate (card mode) ─────────────────────────────────────
// Fully controlled: every keystroke emits onNameChange; Escape reverts to the
// value at focus-start; Enter / blur commits (the value already lives upstream).

interface NamePlateProps {
  name: string
  onChange: (name: string) => void
  disabled?: boolean
  'aria-label': string
}

function NamePlate({ name, onChange, disabled, 'aria-label': ariaLabel }: NamePlateProps) {
  const originalRef = useRef(name)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <input
      ref={inputRef}
      className={styles.namePlate}
      data-testid="name-input"
      type="text"
      value={name}
      placeholder="Untitled"
      aria-label={ariaLabel}
      disabled={disabled}
      spellCheck={false}
      autoComplete="off"
      onFocus={() => { originalRef.current = name }}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault()
          inputRef.current?.blur()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onChange(originalRef.current)
          inputRef.current?.blur()
        }
      }}
    />
  )
}

// ── InstrumentTemplate ─────────────────────────────────────────────────────────

export function InstrumentTemplate({
  name,
  color,
  colorOptions = DEFAULT_PALETTE,
  input,
  fx,
  onNameChange,
  onColorChange,
  onInputChange,
  onFxAdd,
  onFxRemove,
  onFxReorder,
  variant = 'card',
  size = 'md',
  disabled = false,
  origin,
  draggable = true,
  dragData,
  onDragStart,
  'aria-label': ariaLabel,
}: InstrumentTemplateProps) {
  const label = name || 'Untitled'
  const styleVars = { '--tmpl-color': color ?? 'var(--border-strong)' } as CSSProperties

  // ── Tile — the compact, draggable drawer chip ──
  if (variant === 'tile') {
    const canDrag = draggable && !disabled
    function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
      if (dragData) {
        for (const [k, v] of Object.entries(dragData)) e.dataTransfer.setData(k, v)
      }
      e.dataTransfer.effectAllowed = 'copy'
      onDragStart?.(e)
    }

    return (
      <div
        className={styles.tile}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? `${label} instrument preset`}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        draggable={canDrag}
        onDragStart={canDrag ? handleDragStart : undefined}
        style={styleVars}
      >
        <span className={styles.tileSquare} aria-hidden data-empty={color == null || undefined}>
          <InstrumentGlyph />
        </span>
        <span className={styles.tileLabel} title={label}>{label}</span>
        {origin != null && <span className={styles.tileOrigin}>{origin}</span>}
      </div>
    )
  }

  // ── Card — the editable identity form ──
  return (
    <div
      role="group"
      aria-label={ariaLabel ?? `${label} template`}
      className={styles.card}
      data-size={size}
      data-disabled={disabled || undefined}
      style={styleVars}
    >
      <span className={styles.spine} aria-hidden />

      <div className={styles.header}>
        <NamePlate
          name={name}
          onChange={onNameChange}
          disabled={disabled}
          aria-label="Track name"
        />
        {origin != null && <span className={styles.origin}>{origin}</span>}
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel} id="tmpl-color-label">Colour</span>
        <SwatchPalette
          value={color}
          palette={colorOptions}
          onChange={onColorChange}
          size={size}
          aria-label="Track colour"
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Input</span>
        <InputSelect
          variant="field"
          size={size}
          value={input.value}
          options={input.options}
          onChange={onInputChange}
          disabled={disabled}
          showInTag
          aria-label="Track input"
        />
      </div>

      <div className={styles.field} data-testid="tmpl-fx">
        <Panel tone="stage" padding="sm" title="FX">
          <FxChainList
            mode="cold"
            items={fx}
            onReorder={onFxReorder}
            onRemove={onFxRemove}
            onAdd={onFxAdd}
            disabled={disabled}
          />
        </Panel>
      </div>
    </div>
  )
}
