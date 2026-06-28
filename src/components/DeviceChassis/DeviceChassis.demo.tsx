// src/components/DeviceChassis/DeviceChassis.demo.tsx
import { useEffect, useRef, useState } from 'react'
import { ArrowUUpLeft, ArrowUUpRight } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { Toggle } from '../Toggle'
import { Clock } from '../Clock'
import { TransportButton } from '../TransportButton'
import { RecordMode } from '../RecordMode'
import type { RecordModeState, RecordModeValue } from '../RecordMode'
import { Badge } from '../Badge'
import { DeviceChassis } from './DeviceChassis'

export const meta: DemoMeta = {
  name:  'DeviceChassis',
  group: 'Composites',
  route: '/device-chassis',
  order: 124,
}

const BPM = 120
const NUM = 4
const DEN = 4

const noop = () => {}

// ─── Undo / redo — plain bay buttons (the DAW passes real ones) ───────────────

function HistoryButtons({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const px = size === 'sm' ? 15 : 17
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: size === 'sm' ? 26 : 30, height: size === 'sm' ? 26 : 30,
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer',
  }
  return (
    <>
      <button type="button" style={style} aria-label="Undo"><ArrowUUpLeft size={px} aria-hidden /></button>
      <button type="button" style={style} aria-label="Redo"><ArrowUUpRight size={px} aria-hidden /></button>
    </>
  )
}

// ─── A static (non-playing) chassis for the states grid ───────────────────────

function StaticChassis({
  projectName = 'Night Drive',
  dirty,
  playing = false,
  recState = 'idle',
  withReadout = true,
  withTransport = true,
  withTrailing = true,
  takeActive = false,
  size = 'md',
  children,
}: {
  projectName?: string
  dirty?: boolean
  playing?: boolean
  recState?: RecordModeState
  withReadout?: boolean
  withTransport?: boolean
  withTrailing?: boolean
  takeActive?: boolean
  size?: 'sm' | 'md'
  children?: React.ReactNode
}) {
  const clockState = recState === 'recording' ? 'recording' : playing ? 'playing' : 'stopped'
  return (
    <DeviceChassis
      projectName={projectName}
      dirty={dirty}
      size={size}
      readout={withReadout ? (
        <Clock seconds={playing ? 26.4 : 0} bpm={BPM} numerator={NUM} denominator={DEN} state={clockState} size={size} />
      ) : undefined}
      transport={withTransport ? (
        <>
          <TransportButton variant="play" playing={playing} onClick={noop} size={size} />
          <TransportButton variant="stop" onClick={noop} size={size} />
          <RecordMode state={recState} mode="normal" onToggleRecord={noop} onSelectMode={noop} size={size} />
        </>
      ) : undefined}
      trailing={withTrailing ? (
        <>
          <HistoryButtons size={size} />
          <Badge variant="label" tone={takeActive ? 'accent' : 'default'} size={size}>
            {takeActive ? 'Take 3 ●' : 'Take 3'}
          </Badge>
        </>
      ) : undefined}
    >
      {children ?? <BodyPlaceholder />}
    </DeviceChassis>
  )
}

// ─── Placeholder body — stands in for the tape + cards ────────────────────────

function BodyPlaceholder() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{
        height: 40, borderRadius: 'var(--radius)', border: '1px dashed var(--border)',
        display: 'flex', alignItems: 'center', paddingInline: 12,
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text-dim)',
      }}>
        Tape
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {['Guitar', 'Bass', 'Keys', 'Drums'].map(n => (
          <div key={n} style={{
            height: 120, borderRadius: 'var(--radius)', border: '1px dashed var(--border)',
            display: 'flex', alignItems: 'flex-end', padding: 10,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-dim)',
          }}>
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Live playground — a real rAF clock, dogfooded kit Toggles ────────────────

function LiveChassis() {
  const [playing, setPlaying]   = useState(false)
  const [recording, setRec]     = useState(false)
  const [dirty, setDirty]       = useState(true)
  const [size, setSize]         = useState<'sm' | 'md'>('md')
  const [recMode, setRecMode]   = useState<RecordModeValue>('normal')

  const recState: RecordModeState = recording ? 'recording' : 'idle'
  const clockState = recording ? 'recording' : playing ? 'playing' : 'stopped'

  // Imperative transport clock — authoritative source for the rAF read.
  const posRef   = useRef(0)
  const [, force] = useState(0)

  useEffect(() => {
    if (!playing && !recording) return
    const start = performance.now()
    const base  = posRef.current
    let raf = 0
    const tick = () => {
      posRef.current = base + (performance.now() - start) / 1000
      force(n => n + 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, recording])

  return (
    <>
      <DeviceChassis
        projectName="Night Drive"
        dirty={dirty}
        size={size}
        readout={
          <Clock
            seconds={posRef.current}
            bpm={BPM}
            numerator={NUM}
            denominator={DEN}
            state={clockState}
            size={size}
          />
        }
        transport={
          <>
            <TransportButton
              variant="play"
              playing={playing}
              onClick={() => { setPlaying(p => !p); setRec(false) }}
              size={size}
            />
            <TransportButton
              variant="stop"
              onClick={() => { setPlaying(false); setRec(false); posRef.current = 0; force(n => n + 1) }}
              size={size}
            />
            <RecordMode
              state={recState}
              mode={recMode}
              onToggleRecord={() => { setRec(r => !r); setPlaying(false) }}
              onSelectMode={setRecMode}
              size={size}
            />
          </>
        }
        trailing={
          <>
            <HistoryButtons size={size} />
            <Badge variant="label" tone="accent" size={size}>Take 3 ●</Badge>
          </>
        }
      >
        <BodyPlaceholder />
      </DeviceChassis>

      <Playground>
        <Toggle checked={playing} onChange={v => { setPlaying(v); if (v) setRec(false) }} label="Playing" />
        <Toggle checked={recording} onChange={v => { setRec(v); if (v) setPlaying(false) }} label="Recording" />
        <Toggle checked={dirty} onChange={setDirty} label="Unsaved" />
        <Toggle checked={size === 'sm'} onChange={v => setSize(v ? 'sm' : 'md')} label="Small" />
      </Playground>
    </>
  )
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export default function DeviceChassisDemo() {
  return (
    <DemoShell meta={meta}>
      <p style={{ color: 'var(--text-muted)', maxWidth: 680, lineHeight: 1.5 }}>
        The warm portastudio shell that wraps the studio view — <strong>the machine</strong>. It gives
        the studio its outer frame and a header bay
        (<code>[ brand · project ] … [ LCD well ] … [ transport ] [ trailing ]</code>), then hands the
        body a content slot. The readout, transport and trailing are all slots the DAW fills — the
        chassis wraps the <strong>Clock</strong> in the recessed stage well and never builds its own
        digits. It is not AppShell (the old web shell) and not ProductFrame (a marketing wrapper); it
        is a single machined object — flat, tactile, character from insets and the sunk LCD well, the
        single hot accent reserved for record armed and the active Take.
      </p>

      <h2 style={{ font: 'var(--font-ui)', fontSize: 14, marginTop: 8 }}>Live</h2>
      <LiveChassis />

      <StatesGrid>
        <State label="default (idle)">
          <StaticChassis />
        </State>
        <State label="unsaved (dirty)">
          <StaticChassis dirty />
        </State>
        <State label="playing">
          <StaticChassis playing />
        </State>
        <State label="armed (record)">
          <StaticChassis recState="armed" dirty />
        </State>
        <State label="recording">
          <StaticChassis recState="recording" dirty />
        </State>
        <State label="active take (hot accent)">
          <StaticChassis takeActive />
        </State>
        <State label="small">
          <StaticChassis size="sm" />
        </State>
        <State label="no project name">
          <StaticChassis projectName="" />
        </State>
        <State label="bare frame (slots absent)">
          <StaticChassis withReadout={false} withTransport={false} withTrailing={false} projectName="" />
        </State>
        <State label="readout only">
          <StaticChassis withTransport={false} withTrailing={false} />
        </State>
      </StatesGrid>

      {/* ── Cross-theme proof: one chassis reskins through tokens, light + dark ── */}
      <h2 style={{ font: 'var(--font-ui)', fontSize: 14, marginTop: 8 }}>Across themes</h2>
      <div style={{ display: 'grid', gap: 16 }}>
        {(['chroma', 'manuscript', 'nocturne', 'ink'] as const).map(theme => (
          <ThemeProvider key={theme} theme={theme}>
            <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
              <span style={{
                display: 'block', marginBottom: 8, fontFamily: 'var(--font-mono)',
                fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-dim)',
              }}>
                {theme}
              </span>
              <StaticChassis dirty takeActive />
            </div>
          </ThemeProvider>
        ))}
      </div>
    </DemoShell>
  )
}
