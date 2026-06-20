import { useCallback, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { Playhead } from '../Playhead'
import { RepeatToggle } from '../RepeatToggle'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { TimeSelection } from './TimeSelection'
import type { SelectionRange } from './TimeSelection'

export const meta: DemoMeta = {
  name:  'TimeSelection',
  group: 'Primitives',
  route: '/time-selection',
  order: 14,
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const RULER_H    = 24
const LANE_H     = 40
const LANE_COUNT = 3
const TOTAL_H    = RULER_H + LANE_H * LANE_COUNT
const DURATION   = 30

const TRACK_COLORS = [
  'var(--track-color-1)',
  'var(--track-color-2)',
  'var(--track-color-3)',
]

// ─── Mini timeline backdrop ───────────────────────────────────────────────────
// Renders ruler strip + lane rows. TimeSelection and Playhead overlay as siblings.

function TimelineBackdrop({
  width,
  pxPerSecond,
}: {
  width: number
  pxPerSecond: number
}) {
  const tickSeconds = Array.from({ length: Math.ceil(DURATION / 4) + 1 }, (_, i) => i * 4)

  return (
    <>
      {/* Ruler strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: RULER_H,
        background: 'var(--strip-mini-timeline)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {tickSeconds.map(s => {
          const x = s * pxPerSecond
          if (x > width) return null
          return (
            <div key={s} style={{
              position: 'absolute', left: x, top: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              pointerEvents: 'none',
            }}>
              <div style={{ width: 1, height: 8, background: 'var(--border-strong)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--text-dim)', marginTop: 2, marginLeft: 2,
              }}>{s}s</span>
            </div>
          )
        })}
      </div>

      {/* Lanes */}
      {TRACK_COLORS.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: RULER_H + i * LANE_H, left: 0, right: 0, height: LANE_H,
          background: 'var(--arrange-bg)',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Mock clip block */}
          <div style={{
            position: 'absolute', top: 4, bottom: 4,
            left: 8,
            width: Math.min(60 + i * 30, width - 24),
            borderRadius: 3,
            background: `color-mix(in srgb, ${color} 18%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)`,
          }} />
        </div>
      ))}
    </>
  )
}

// ─── Wrapper: timeline container with backdrop + overlay ──────────────────────

function TimelineWrap({
  width,
  pxPerSecond,
  children,
}: {
  width: number
  pxPerSecond: number
  children?: React.ReactNode
}) {
  return (
    <div style={{
      position: 'relative', width, height: TOTAL_H,
      overflow: 'hidden', borderRadius: 3,
      border: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <TimelineBackdrop width={width} pxPerSecond={pxPerSecond} />
      {children}
    </div>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  const W          = 300
  const pxPerSecond = 10
  const secondsToX  = (s: number) => s * pxPerSecond
  const xToSeconds  = (x: number) => x / pxPerSecond
  const range: SelectionRange = { start: 4, end: 18 }

  const noop = () => {}

  return (
    <StatesGrid>
      <State label="empty — no selection">
        <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
          <TimeSelection
            range={null}
            secondsToX={secondsToX}
            xToSeconds={xToSeconds}
            durationSeconds={DURATION}
            onChange={noop}
            onClear={noop}
          />
        </TimelineWrap>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', margin: '4px 0 0' }}>
          range=null — nothing rendered
        </p>
      </State>

      <State label="active selection — 4s to 18s">
        <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
          <TimeSelection
            range={range}
            secondsToX={secondsToX}
            xToSeconds={xToSeconds}
            durationSeconds={DURATION}
            onChange={noop}
            onClear={noop}
          />
        </TimelineWrap>
      </State>

      <State label="disabled">
        <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
          <TimeSelection
            range={range}
            secondsToX={secondsToX}
            xToSeconds={xToSeconds}
            durationSeconds={DURATION}
            onChange={noop}
            onClear={noop}
            disabled
          />
        </TimelineWrap>
      </State>

      <State label="sm size">
        <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
          <TimeSelection
            range={range}
            secondsToX={secondsToX}
            xToSeconds={xToSeconds}
            durationSeconds={DURATION}
            onChange={noop}
            onClear={noop}
            size="sm"
          />
        </TimelineWrap>
      </State>

      <State label="narrow selection (2s) — still visible">
        <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
          <TimeSelection
            range={{ start: 8, end: 10 }}
            secondsToX={secondsToX}
            xToSeconds={xToSeconds}
            durationSeconds={DURATION}
            onChange={noop}
            onClear={noop}
          />
        </TimelineWrap>
      </State>

      <State label="Chroma vs Ink">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>chroma</span>
          <ThemeProvider theme="chroma">
            <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
              <TimeSelection
                range={range}
                secondsToX={secondsToX}
                xToSeconds={xToSeconds}
                durationSeconds={DURATION}
                onChange={noop}
                onClear={noop}
              />
            </TimelineWrap>
          </ThemeProvider>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 'var(--space-1)' }}>ink</span>
          <ThemeProvider theme="ink">
            <TimelineWrap width={W} pxPerSecond={pxPerSecond}>
              <TimeSelection
                range={range}
                secondsToX={secondsToX}
                xToSeconds={xToSeconds}
                durationSeconds={DURATION}
                onChange={noop}
                onClear={noop}
              />
            </TimelineWrap>
          </ThemeProvider>
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────
//
// Full interactive demo: timeline backdrop + parked Playhead + TimeSelection.
// RepeatToggle shows the natural tie (loop range ↔ repeat button).
// Playhead is parked at 0 — Playhead's own demo covers sweep; this one is about
// the selection. secondsToX/xToSeconds are memoized (same pattern as Playhead
// demo) so zoom changes don't trigger spurious re-renders.

function PlaygroundDemo() {
  const CONTAINER_W = 480

  const [range,       setRange]       = useState<SelectionRange | null>({ start: 4, end: 16 })
  const [repeating,   setRepeating]   = useState(false)
  const [disabled,    setDisabled]    = useState(false)
  const [pxPerSecond, setPxPerSecond] = useState(14)

  const secondsToX = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])
  const xToSeconds = useCallback((x: number) => x / pxPerSecond, [pxPerSecond])

  // Playhead parked at 0 — getSeconds is a stable no-op stub
  const getSeconds = useCallback(() => 0, [])

  function handleToggleRepeat(next: boolean) {
    setRepeating(next)
    if (next && !range) {
      setRange({ start: 0, end: Math.min(8, DURATION) })
    }
  }

  function handleClear() {
    setRange(null)
    setRepeating(false)
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
  }

  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize:   'var(--text-xs)',
    color:      'var(--text-dim)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <TimelineWrap width={CONTAINER_W} pxPerSecond={pxPerSecond}>
            <Playhead
              seconds={0}
              getSeconds={getSeconds}
              secondsToX={secondsToX}
            />
            <TimeSelection
              range={range}
              secondsToX={secondsToX}
              xToSeconds={xToSeconds}
              durationSeconds={DURATION}
              onChange={setRange}
              onClear={handleClear}
              disabled={disabled}
            />
          </TimelineWrap>

          {/* Transport strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <RepeatToggle repeating={repeating} onToggle={handleToggleRepeat} size="sm" />
            <span style={monoStyle}>
              {range
                ? `loop: ${range.start.toFixed(2)}s → ${range.end.toFixed(2)}s (${(range.end - range.start).toFixed(2)}s)`
                : 'no selection'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 160 }}>
          <label style={labelStyle}>
            zoom: {pxPerSecond} px/s
            <Fader
              value={pxPerSecond}
              onChange={v => setPxPerSecond(Math.max(4, Math.round(v)))}
              min={4}
              max={40}
              orientation="horizontal"
              size="sm"
              aria-label="Zoom px/s"
            />
          </label>

          <Toggle
            checked={disabled}
            onChange={setDisabled}
            label="disabled"
            size="sm"
          />

          <div style={{ ...monoStyle, marginTop: 'var(--space-2)' }}>
            <p style={{ margin: 0 }}>Drag band to move region.</p>
            <p style={{ margin: '2px 0 0' }}>Drag brackets to resize.</p>
            <p style={{ margin: '2px 0 0' }}>Right-click or Esc to clear.</p>
            <p style={{ margin: '2px 0 0' }}>← → nudge (Shift = 1s).</p>
          </div>
        </div>

      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function TimeSelectionDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
