// src/components/ColorSwatch/ColorSwatch.tsx
import { useRef, useState } from 'react'
import styles from './ColorSwatch.module.css'
import { Popover } from '../Popover'

// The six curated track colors (matches --track-color-1..6 in global.css).
// Hex values so they resolve in any context (including tests where CSS vars are not computed).
export const DEFAULT_PALETTE: string[] = [
  '#e8a87c', // track-color-1: warm peach
  '#7ec8a4', // track-color-2: sage green
  '#7eb8d4', // track-color-3: sky blue
  '#c4a0e4', // track-color-4: soft purple
  '#e4c84a', // track-color-5: amber yellow
  '#e47a7a', // track-color-6: coral red
]

// ── ColorSwatch ──────────────────────────────────────────────────────────────

export interface ColorSwatchProps {
  color: string
  selected?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  'aria-label': string
  tabIndex?: number
  onClick?: (color: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  autoFocus?: boolean
}

export function ColorSwatch({
  color,
  selected = false,
  disabled,
  size = 'md',
  'aria-label': ariaLabel,
  tabIndex = 0,
  onClick,
  onKeyDown,
  autoFocus,
}: ColorSwatchProps) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      className={styles.swatch}
      data-size={size}
      data-selected={selected || undefined}
      disabled={disabled}
      tabIndex={tabIndex}
      autoFocus={autoFocus}
      onClick={onClick ? () => onClick(color) : undefined}
      onKeyDown={onKeyDown}
      style={{ '--_swatch-color': color } as React.CSSProperties}
    >
      {selected && (
        <svg className={styles.check} viewBox="0 0 10 8" aria-hidden="true" fill="none">
          <path
            d="M1 4l3 3 5-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}

// ── SwatchPalette ─────────────────────────────────────────────────────────────

export interface SwatchPaletteProps {
  value: string | null
  palette: string[]
  onChange: (color: string) => void
  size?: 'sm' | 'md'
  'aria-label'?: string
}

export function SwatchPalette({
  value,
  palette,
  onChange,
  size = 'md',
  'aria-label': ariaLabel = 'Color palette',
}: SwatchPaletteProps) {
  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLButtonElement>) {
    let next = idx

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      next = (idx + 1) % palette.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      next = (idx - 1 + palette.length) % palette.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      next = palette.length - 1
    } else {
      return
    }

    // ARIA radiogroup: arrow keys move focus AND change selection simultaneously.
    const nextColor = palette[next]
    if (nextColor !== undefined) {
      onChange(nextColor)
      const container = (e.currentTarget as HTMLButtonElement).closest('[role="radiogroup"]')
      const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      buttons?.[next]?.focus()
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={styles.palette}
      data-size={size}
    >
      {palette.map((color, idx) => {
        const isSelected = color === value
        // First swatch gets tabIndex=0 when nothing is selected (roving tabindex — needs an anchor).
        const defaultTab = value === null && idx === 0
        return (
          <ColorSwatch
            key={color}
            color={color}
            selected={isSelected}
            size={size}
            aria-label={color}
            tabIndex={isSelected || defaultTab ? 0 : -1}
            onClick={() => onChange(color)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
          />
        )
      })}
    </div>
  )
}

// ── SwatchPicker ──────────────────────────────────────────────────────────────

export interface SwatchPickerProps {
  value: string | null
  palette?: string[]
  onChange: (color: string) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
  defaultOpen?: boolean
}

export function SwatchPicker({
  value,
  palette = DEFAULT_PALETTE,
  onChange,
  size = 'md',
  disabled,
  'aria-label': ariaLabel = 'Track color',
  defaultOpen = false,
}: SwatchPickerProps) {
  const [open, setOpen] = useState(defaultOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  function openPicker() {
    if (disabled) return
    setOpen(true)
  }

  function closePicker() {
    setOpen(false)
    // WKWebView: clicking a button doesn't auto-focus it — return focus explicitly.
    triggerRef.current?.focus()
  }

  function handleSelect(color: string) {
    onChange(color)
    closePicker()
  }

  return (
    <div
      ref={containerRef}
      className={styles.picker}
      data-size={size}
      data-open={open || undefined}
    >
      <button
        ref={triggerRef}
        className={styles.trigger}
        data-size={size}
        data-open={open || undefined}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={open ? closePicker : openPicker}
        style={value ? ({ '--_swatch-color': value } as React.CSSProperties) : undefined}
      >
        <span
          className={styles.triggerChip}
          data-empty={value == null || undefined}
          aria-hidden="true"
        />
      </button>
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closePicker}
        >
          <div className={styles.popoverContent}>
            <SwatchPalette
              value={value}
              palette={palette}
              onChange={handleSelect}
              size="md"
              aria-label={ariaLabel}
            />
          </div>
        </Popover>
      )}
    </div>
  )
}
