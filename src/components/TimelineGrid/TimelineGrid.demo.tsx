import { useState, useCallback } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { TimelineRuler, secondsToX } from '../TimelineRuler'
import { TimelineGrid, type Division } from './TimelineGrid'
import { divisionToPx } from './gridMath'

export const meta: DemoMeta = {
  name:  'TimelineGrid',
  group: 'Primitives',
  route: '/timeline-grid',
  order: 14,
}

// ─── Shared container ─────────────────────────────────────────────────────────

function GridWrap({
  height = 80,
  width  = 360,
  children,
}: {
  height?: number
  width?:  number
  children: React.ReactNode
}) {
  return (
    <div style={{
      overflow:     'hidden',
      height,
      width,
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      display:      'flex',
      flexDirection:'column',
    }}>
      {children}
    </div>
  )
}

// ─── Ruler + grid stacked in one scrollable column ───────────────────────────

function RulerAndGrid({
  bpm,
  numerator,
  denominator,
  pxPerBeat,
  division,
  duration = 8,
  gridHeight = 56,
}: {
  bpm: number
  numerator: number
  denominator: number
  pxPerBeat: number
  division: Division
  duration?: number
  gridHeight?: number
}) {
  return (
    <>
      <TimelineRuler
        bpm={bpm}
        numerator={numerator}
        denominator={denominator}
        pxPerBeat={pxPerBeat}
        durationSeconds={duration}
      />
      <div style={{ position: 'relative', height: gridHeight, flexShrink: 0 }}>
        <TimelineGrid
          division={division}
          pxPerBeat={pxPerBeat}
          bpm={bpm}
          numerator={numerator}
          denominator={denominator}
        />
      </div>
    </>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="1/4 — quarter (4/4, 120 BPM, 48px/beat)">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={48} division="1/4" />
        </GridWrap>
      </State>

      <State label="1/8 — eighth subdivision">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={48} division="1/8" />
        </GridWrap>
      </State>

      <State label="1/16 — sixteenth subdivision">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={64} division="1/16" />
        </GridWrap>
      </State>

      <State label="1/8T — eighth note triplets">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={64} division="1/8T" />
        </GridWrap>
      </State>

      <State label="1/16T — sixteenth note triplets">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={80} division="1/16T" />
        </GridWrap>
      </State>

      <State label="1/2 — half note">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={32} division="1/2" />
        </GridWrap>
      </State>

      <State label="1/1 — bar only">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={32} division="1/1" />
        </GridWrap>
      </State>

      <State label="3/4 time — 1/8 subdivision">
        <GridWrap>
          <RulerAndGrid bpm={100} numerator={3} denominator={4} pxPerBeat={48} division="1/8" />
        </GridWrap>
      </State>

      <State label="6/8 time — 1/8 subdivision">
        <GridWrap>
          <RulerAndGrid bpm={90} numerator={6} denominator={8} pxPerBeat={32} division="1/8" />
        </GridWrap>
      </State>

      <State label="Low zoom (12px/beat) — 1/4">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={12} division="1/4" />
        </GridWrap>
      </State>

      <State label="High zoom (96px/beat) — 1/16">
        <GridWrap>
          <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={96} division="1/16" />
        </GridWrap>
      </State>

      <State label="Chroma vs Ink (1/8, 4/4)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>chroma</span>
            <ThemeProvider theme="chroma">
              <GridWrap>
                <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={48} division="1/8" />
              </GridWrap>
            </ThemeProvider>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>ink</span>
            <ThemeProvider theme="ink">
              <GridWrap>
                <RulerAndGrid bpm={120} numerator={4} denominator={4} pxPerBeat={48} division="1/8" />
              </GridWrap>
            </ThemeProvider>
          </div>
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Division selector — segmented radio group using Toggle dogfood ───────────

const ALL_DIVISIONS: Division[] = ['1/1', '1/2', '1/4', '1/8', '1/16', '1/8T', '1/16T']

function DivisionPicker({
  value,
  onChange,
}: {
  value: Division
  onChange: (d: Division) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Division"
      style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}
    >
      {ALL_DIVISIONS.map(div => (
        <Toggle
          key={div}
          checked={value === div}
          onChange={checked => { if (checked) onChange(div) }}
          label={div}
          size="sm"
          aria-label={`Division ${div}`}
        />
      ))}
    </div>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [division,  setDivision]  = useState<Division>('1/4')
  const [pxPerBeat, setPxPerBeat] = useState(48)
  const [bpm,       setBpm]       = useState(120)
  const [numerator, setNumerator] = useState(4)
  const [showRuler, setShowRuler] = useState(true)

  const DURATION   = 8
  const totalWidth = secondsToX(DURATION, pxPerBeat, bpm)

  const toX = useCallback((s: number) => secondsToX(s, pxPerBeat, bpm), [pxPerBeat, bpm])

  // Fake playhead position for visual alignment proof
  const [seekSecs, setSeekSecs] = useState(0)
  const playheadX = toX(seekSecs)

  const labelStyle: React.CSSProperties = {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Timeline view */}
        <div style={{
          flex:         '1 1 360px',
          overflow:     'auto',
          maxWidth:     600,
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          display:      'flex',
          flexDirection:'column',
        }}>
          {showRuler && (
            <TimelineRuler
              bpm={bpm}
              numerator={numerator}
              denominator={4}
              pxPerBeat={pxPerBeat}
              durationSeconds={DURATION}
              onSeek={setSeekSecs}
            />
          )}

          {/* Grid sits in the lane area behind clips */}
          <div style={{ position: 'relative', height: 100, width: totalWidth, flexShrink: 0 }}>
            <TimelineGrid
              division={division}
              pxPerBeat={pxPerBeat}
              bpm={bpm}
              numerator={numerator}
              denominator={4}
            />

            {/* Fake clip — proves coordinate alignment with ruler */}
            <div
              aria-label="demo clip"
              style={{
                position:     'absolute',
                left:         toX((60 / bpm) * numerator),       // bar 2 start
                top:          8,
                width:        toX((60 / bpm) * 2) - toX(0),      // 2 beats wide
                height:       48,
                background:   'color-mix(in srgb, var(--accent) 18%, transparent)',
                border:       '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                borderRadius: 'var(--radius)',
                pointerEvents:'none',
              }}
            />

            {/* Fake playhead — aligned via same secondsToX */}
            <div
              aria-hidden="true"
              style={{
                position:      'absolute',
                left:          playheadX,
                top:           0,
                width:         1.5,
                height:        '100%',
                background:    'var(--led-green-core)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            division
          </div>
          <DivisionPicker value={division} onChange={setDivision} />

          <label style={labelStyle}>
            px/beat ({pxPerBeat})
            <Fader
              value={pxPerBeat}
              onChange={v => setPxPerBeat(Math.max(8, Math.round(v)))}
              min={8}
              max={120}
              orientation="horizontal"
              size="sm"
              aria-label="Pixels per beat"
            />
          </label>

          <label style={labelStyle}>
            BPM ({bpm})
            <Fader
              value={bpm}
              onChange={v => setBpm(Math.round(v))}
              min={40}
              max={220}
              orientation="horizontal"
              size="sm"
              aria-label="BPM"
            />
          </label>

          <label style={labelStyle}>
            beats/bar
            <select
              value={numerator}
              onChange={e => setNumerator(Number(e.target.value))}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </label>

          <Toggle
            checked={showRuler}
            onChange={setShowRuler}
            label="show ruler"
            size="sm"
          />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
          }}>
            div step: {divisionToPx(division, pxPerBeat, numerator, 4).toFixed(2)}px
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────

export default function TimelineGridDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
