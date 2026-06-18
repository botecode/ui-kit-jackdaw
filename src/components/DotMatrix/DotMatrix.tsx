// src/components/DotMatrix/DotMatrix.tsx

/**
 * DotCell value contract:
 *   0               — off (dark recessed well)
 *   number (0..1)   — lit at that brightness using the component's default color
 *   { v, color }    — lit at brightness v with a CSS color or ChromaHue name override
 */
export type ChromaHue = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple'
export type DotCell = number | { v: number; color: ChromaHue | string }

import styles from './DotMatrix.module.css'

const CHROMA_TOKEN: Record<ChromaHue, string> = {
  red:    'var(--chroma-red)',
  orange: 'var(--chroma-orange)',
  yellow: 'var(--chroma-yellow)',
  green:  'var(--chroma-green)',
  teal:   'var(--chroma-teal)',
  blue:   'var(--chroma-blue)',
  purple: 'var(--chroma-purple)',
}

const CHROMA_HUES = new Set<string>(Object.keys(CHROMA_TOKEN))

function resolveColor(c: ChromaHue | string): string {
  return CHROMA_HUES.has(c) ? CHROMA_TOKEN[c as ChromaHue] : c
}

export interface DotMatrixProps {
  rows: number
  cols: number
  /** rows × cols matrix of cell values. Missing cells default to 0 (off). */
  values: DotCell[][]
  dotShape?: 'round' | 'square'
  /** Gap between dots in px. Default 2. */
  gap?: number
  /** Dot diameter in px. Default 6. */
  dotSize?: number
  /** Show LED glow on lit dots. Default true. */
  glow?: boolean
  /**
   * Default lit color — a CSS color string or a ChromaHue name.
   * Defaults to var(--accent).
   */
  color?: ChromaHue | string
  'aria-label'?: string
  style?: React.CSSProperties
  className?: string
}

export function DotMatrix({
  rows,
  cols,
  values,
  dotShape = 'round',
  gap = 2,
  dotSize = 6,
  glow = true,
  color,
  'aria-label': ariaLabel = 'Dot matrix display',
  style,
  className,
}: DotMatrixProps) {
  const defaultColor = color ? resolveColor(color) : 'var(--accent)'

  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={ariaLabel}
      style={{ '--dot-color': defaultColor, ...style } as React.CSSProperties}
    >
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
          gridAutoRows: `${dotSize}px`,
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const r = Math.floor(i / cols)
          const c = i % cols
          const cell = values[r]?.[c] ?? 0
          const brightness = typeof cell === 'number' ? cell : cell.v
          const isLit = brightness > 0
          const hasColorOverride = isLit && typeof cell !== 'number'

          return (
            <div
              key={i}
              className={styles.dot}
              data-shape={dotShape}
              data-lit={isLit || undefined}
              data-glow={(isLit && glow) || undefined}
              style={isLit ? {
                '--dot-brightness': brightness,
                ...(hasColorOverride
                  ? { '--dot-color': resolveColor((cell as { v: number; color: ChromaHue | string }).color) }
                  : {}),
              } as React.CSSProperties : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
