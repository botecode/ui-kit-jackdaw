// src/components/DotMatrix/DotMatrix.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ArmButton } from '../ArmButton/ArmButton'
import { Fader } from '../Fader/Fader'
import { DotMatrix, type DotCell, type ChromaHue } from './DotMatrix'

export const meta: DemoMeta = {
  name: 'DotMatrix',
  group: 'Primitives',
  route: '/dot-matrix',
  order: 6,
}

// ── Shared patterns ───────────────────────────────────────────────────────────

const HUES: ChromaHue[] = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple']

function zeroMatrix(rows: number, cols: number): DotCell[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

function fullMatrix(rows: number, cols: number, brightness = 1): DotCell[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(brightness))
}

/** Diagonal dot pattern — every 3rd cell along r+c. */
function sparseMatrix(rows: number, cols: number): DotCell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ((r + c) % 3 === 0 ? 0.9 : 0)),
  )
}

/**
 * Chroma bar chart — 7 columns, each a ChromaHue; brightness fades from
 * top (dim) to bottom (full) so each bar reads as a filled column.
 */
function chromaMatrix(rows: number): DotCell[][] {
  return Array.from({ length: rows }, (_, r) => {
    const brightness = (r + 1) / rows
    return HUES.map(hue => ({ v: brightness, color: hue }))
  })
}

// ── Scrolling level history hook ──────────────────────────────────────────────
// Drives values externally via rAF; DotMatrix is purely reactive.

function useScrollingHistory(rows: number, cols: number): DotCell[][] {
  const bufferRef = useRef<number[]>(Array(cols).fill(0))
  const phaseRef  = useRef(0)
  const lastRef   = useRef(performance.now())
  const [values, setValues] = useState<DotCell[][]>(() => zeroMatrix(rows, cols))

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (mql.matches) {
      // Static snapshot: a gentle wave across the columns
      const staticBuf = Array.from({ length: cols }, (_, c) =>
        0.35 + 0.55 * Math.abs(Math.sin((c / cols) * Math.PI * 2)),
      )
      setValues(
        Array.from({ length: rows }, (_, r) =>
          staticBuf.map(level => {
            const threshold = (rows - 1 - r) / rows
            return threshold < level ? level - threshold * 0.3 : 0
          }),
        ),
      )
      return
    }

    bufferRef.current = Array(cols).fill(0)
    phaseRef.current  = 0
    lastRef.current   = performance.now()

    let raf: number
    function tick(now: number) {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05)
      lastRef.current = now
      phaseRef.current += dt * 1.8

      // Sine + harmonics for a natural-feeling signal
      const level =
        0.42 +
        0.30 * Math.sin(phaseRef.current) +
        0.15 * Math.sin(phaseRef.current * 2.3) +
        0.08 * Math.sin(phaseRef.current * 5.1)

      bufferRef.current.shift()
      bufferRef.current.push(Math.max(0, Math.min(1, level)))

      const buf = bufferRef.current
      setValues(
        Array.from({ length: rows }, (_, r) =>
          buf.map(colLevel => {
            const threshold = (rows - 1 - r) / rows
            return threshold < colLevel
              ? Math.max(0.15, colLevel - threshold * 0.25)
              : 0
          }),
        ),
      )

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rows, cols])

  return values
}

// ── States grid ───────────────────────────────────────────────────────────────

function AnimatedState() {
  const values = useScrollingHistory(8, 24)
  return (
    <DotMatrix
      rows={8}
      cols={24}
      values={values}
      dotSize={5}
      gap={2}
      color="green"
      aria-label="Scrolling level history"
    />
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="All off">
        <DotMatrix rows={8} cols={12} values={zeroMatrix(8, 12)} dotSize={6} aria-label="All off" />
      </State>

      <State label="Sparse pattern">
        <DotMatrix
          rows={8}
          cols={12}
          values={sparseMatrix(8, 12)}
          dotSize={6}
          aria-label="Sparse diagonal pattern"
        />
      </State>

      <State label="All on">
        <DotMatrix
          rows={8}
          cols={12}
          values={fullMatrix(8, 12)}
          dotSize={6}
          aria-label="All dots lit"
        />
      </State>

      <State label="Chroma ramp">
        <DotMatrix
          rows={8}
          cols={7}
          values={chromaMatrix(8)}
          dotSize={8}
          gap={3}
          glow
          aria-label="Chroma color ramp"
        />
      </State>

      <State label="Scrolling history (animated)">
        <AnimatedState />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

const ROWS_MIN = 4
const ROWS_MAX = 16
const COLS_MIN = 8
const COLS_MAX = 32

function PlaygroundDemo() {
  const [rowsVal, setRowsVal] = useState(8)
  const [colsVal, setColsVal] = useState(24)
  const [glowOn,  setGlowOn]  = useState(true)
  const [square,  setSquare]  = useState(false)

  const rows = Math.round(rowsVal)
  const cols = Math.round(colsVal)
  const values = useScrollingHistory(rows, cols)

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <DotMatrix
          rows={rows}
          cols={cols}
          values={values}
          dotSize={6}
          gap={2}
          glow={glowOn}
          dotShape={square ? 'square' : 'round'}
          color="green"
          aria-label="Live dot matrix"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            <ArmButton armed={glowOn} onToggle={() => setGlowOn(g => !g)} size="sm" aria-label="Toggle glow" />
            glow
          </label>

          <label style={labelStyle}>
            <ArmButton armed={square} onToggle={() => setSquare(s => !s)} size="sm" aria-label="Toggle square dots" />
            square dots
          </label>

          <label style={{ ...labelStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
            <span>rows: {rows}</span>
            <Fader
              value={rowsVal}
              onChange={setRowsVal}
              min={ROWS_MIN}
              max={ROWS_MAX}
              orientation="horizontal"
              size="sm"
              aria-label="Row count"
            />
          </label>

          <label style={{ ...labelStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
            <span>cols: {cols}</span>
            <Fader
              value={colsVal}
              onChange={setColsVal}
              min={COLS_MIN}
              max={COLS_MAX}
              orientation="horizontal"
              size="sm"
              aria-label="Column count"
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function DotMatrixDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
