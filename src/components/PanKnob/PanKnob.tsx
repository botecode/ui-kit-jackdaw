// Placeholder shell — useSpring and interaction added in Task 3/4

// ─── Pure utilities (exported for tests) ───────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** pan ∈ [−1, 1] → degrees ∈ [−135, 135] */
export function panToAngle(pan: number): number {
  return clamp(pan * 135, -135, 135)
}

/** Short visual readout: "L20" | "C" | "R35" */
export function formatReadout(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'C'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `L${pct}` : `R${pct}`
}

/** Long form for aria-valuetext: "Left 20" | "Center" | "Right 35" */
export function formatAriaValueText(pan: number): string {
  if (Math.abs(pan) < 0.005) return 'Center'
  const pct = Math.round(Math.abs(pan) * 100)
  return pan < 0 ? `Left ${pct}` : `Right ${pct}`
}

// ─── Component ─────────────────────────────────────────────────────────────

export interface PanKnobProps {
  pan: number
  onChange: (pan: number) => void
  size?: 'sm' | 'md'
  /** Cap fill — any CSS color value (default: var(--accent)) */
  color?: string
  /** Double-click / keyboard-reset target (kit-wide convention). Default: 0 */
  resetValue?: number
  disabled?: boolean
  'aria-label'?: string
}

export function PanKnob({
  pan,
  onChange: _onChange,
  size = 'md',
  color: _color,
  resetValue: _resetValue = 0,
  disabled = false,
  'aria-label': ariaLabel = 'Pan',
}: PanKnobProps) {
  // Placeholder shell — SVG added in Task 3
  return (
    <div>
      <div
        role="slider"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={pan}
        aria-valuetext={formatAriaValueText(pan)}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        data-size={size}
      />
    </div>
  )
}
