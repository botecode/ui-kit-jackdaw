import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Toggle } from '../Toggle'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { TimelineRuler, secondsToX, formatBarsBeats } from './TimelineRuler'

export const meta: DemoMeta = {
  name:  'TimelineRuler',
  group: 'Primitives',
  route: '/timeline-ruler',
  order: 13,
}

// ─── Shared scroll wrapper for all states ─────────────────────────────────────

function RulerWrap({ height, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div style={{
      overflow:     'hidden',
      height:       height ?? 80,
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      display:      'flex',
      flexDirection:'column',
      width:        360,
    }}>
      {children}
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Low zoom (16px/beat)">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={16} durationSeconds={16} />
        </RulerWrap>
      </State>

      <State label="Med zoom (48px/beat)">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="High zoom (80px/beat)">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={80} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="3/4 time">
        <RulerWrap>
          <TimelineRuler bpm={100} numerator={3} denominator={4} pxPerBeat={48} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="6/8 time (6 beats/bar)">
        <RulerWrap>
          <TimelineRuler bpm={90} numerator={6} denominator={8} pxPerBeat={32} durationSeconds={8} />
        </RulerWrap>
      </State>

      <State label="Snap on">
        <RulerWrap>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} snap />
        </RulerWrap>
      </State>

      <State label="sm size">
        <RulerWrap height={56}>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} size="sm" />
        </RulerWrap>
      </State>

      <State label="With lane rules">
        <RulerWrap height={120}>
          <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} showLaneRules />
        </RulerWrap>
      </State>

      <State label="Chroma (paper) vs Ink (dark)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>chroma</span>
            <ThemeProvider theme="chroma">
              <RulerWrap height={80}>
                <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} showLaneRules />
              </RulerWrap>
            </ThemeProvider>
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>ink</span>
            <ThemeProvider theme="ink">
              <RulerWrap height={80}>
                <TimelineRuler bpm={120} numerator={4} denominator={4} pxPerBeat={48} durationSeconds={8} showLaneRules />
              </RulerWrap>
            </ThemeProvider>
          </div>
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [pxPerBeat,     setPxPerBeat]     = useState(48)
  const [bpm,           setBpm]           = useState(120)
  const [numerator,     setNumerator]     = useState(4)
  const [snap,          setSnap]          = useState(false)
  const [showLaneRules, setShowLaneRules] = useState(false)
  const [seekSecs,      setSeekSecs]      = useState(0)

  const DURATION = 8
  const clipStartBeats = numerator          // bar 2 start
  const clipX          = clipStartBeats * pxPerBeat
  const clipW          = 2 * pxPerBeat     // 2 beats wide
  const playheadX      = secondsToX(seekSecs, pxPerBeat, bpm)
  const totalWidth     = secondsToX(DURATION, pxPerBeat, bpm)

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
          maxWidth:     560,
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <TimelineRuler
            bpm={bpm}
            numerator={numerator}
            denominator={4}
            pxPerBeat={pxPerBeat}
            durationSeconds={DURATION}
            snap={snap}
            showLaneRules={showLaneRules}
            onSeek={setSeekSecs}
          />

          {/* Fake arrangement lane — proves secondsToX coordinate system */}
          <div style={{
            position:   'relative',
            width:      totalWidth,
            height:     showLaneRules ? 48 * 3 : 96,
            background: 'var(--arrange-bg)',
          }}>
            {/* Fake clip at bar 2, 2 beats long */}
            <div
              aria-label="demo clip"
              style={{
                position:     'absolute',
                left:         clipX,
                top:          showLaneRules ? 6 : 12,
                width:        clipW,
                height:       showLaneRules ? 36 : 48,
                background:   'color-mix(in srgb, var(--accent) 18%, transparent)',
                border:       '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                borderRadius: 'var(--radius)',
              }}
            />

            {/* Fake playhead — positioned via secondsToX mapping */}
            <div
              aria-hidden="true"
              style={{
                position:      'absolute',
                left:          playheadX,
                top:           0,
                width:         1.5,
                height:        '100%',
                background:    'var(--accent)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0 }}>
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

          <Toggle checked={snap}          onChange={setSnap}          label="snap"       size="sm" />
          <Toggle checked={showLaneRules} onChange={setShowLaneRules} label="lane rules" size="sm" />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
          }}>
            seek: {formatBarsBeats(seekSecs, bpm, numerator)}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────

export default function TimelineRulerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
