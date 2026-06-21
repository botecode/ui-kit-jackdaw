// src/components/TransportBar/TransportBar.demo.tsx
import { useState, useEffect, useRef } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { TransportBar } from './TransportBar'
import type { TransportBarProps } from './TransportBar'

export const meta: DemoMeta = {
  name: 'TransportBar',
  group: 'Composites',
  route: '/transport-bar',
  order: 30,
}

// ── Live clock hook ───────────────────────────────────────────────────────────

function useLiveSeconds(running: boolean, startAt = 0) {
  const [seconds, setSeconds] = useState(startAt)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    lastRef.current = performance.now()
    function tick(now: number) {
      const delta = (now - lastRef.current) / 1000
      lastRef.current = now
      setSeconds(s => s + delta)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  return [seconds, setSeconds] as const
}

// ── Shared stub props ─────────────────────────────────────────────────────────

const noop = () => {}
const noopMode = () => {}

const BASE: Omit<TransportBarProps, 'playing' | 'recording' | 'seconds'> = {
  bpm: 120,
  numerator: 4,
  denominator: 4,
  loopEnabled: false,
  recordState: 'idle',
  recordMode: 'normal',
  selectionStart: 0,
  selectionEnd: 2.5,
  gridDivision: '1/8',
  rate: 1.0,
  clockMode: 'bars',
  onPlay: noop,
  onStop: noop,
  onGoToStart: noop,
  onGoToEnd: noop,
  onToggleRecord: noop,
  onSelectRecordMode: noopMode,
  onToggleLoop: noop,
  onSetTempo: noop,
  onSetTimeSignature: noop,
}

// ── States grid ───────────────────────────────────────────────────────────────

function PlayingBar() {
  const [seconds] = useLiveSeconds(true, 0)
  return (
    <TransportBar
      {...BASE}
      playing
      recording={false}
      seconds={seconds}
    />
  )
}

function RecordingBar() {
  const [seconds] = useLiveSeconds(true, 4.2)
  return (
    <TransportBar
      {...BASE}
      playing
      recording
      seconds={seconds}
      recordState="recording"
      selectionStart={0}
      selectionEnd={4}
    />
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Stopped (default)">
        <TransportBar
          {...BASE}
          playing={false}
          recording={false}
          seconds={0}
        />
      </State>

      <State label="Playing (advancing clock)">
        <PlayingBar />
      </State>

      <State label="Recording (red bloom)">
        <RecordingBar />
      </State>

      <State label="Loop enabled + armed">
        <TransportBar
          {...BASE}
          playing={false}
          recording={false}
          seconds={61.25}
          loopEnabled
          recordState="armed"
          bpm={90}
          numerator={3}
          denominator={4}
          selectionStart={30}
          selectionEnd={60}
          gridDivision="1/4"
        />
      </State>

      <State label="Disabled">
        <TransportBar
          {...BASE}
          playing={false}
          recording={false}
          seconds={0}
          disabled
        />
      </State>

      <State label="sm size">
        <TransportBar
          {...BASE}
          playing={false}
          recording={false}
          seconds={19 * 2 + 2 * 0.5}
          size="sm"
          bpm={50}
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

type TransportState = 'stopped' | 'playing' | 'recording'
type RecordState = 'idle' | 'armed' | 'recording'

const RECORD_CYCLE: Record<RecordState, RecordState> = {
  idle: 'armed',
  armed: 'recording',
  recording: 'idle',
}

function PlaygroundDemo() {
  const [transportState, setTransportState] = useState<TransportState>('stopped')
  const [recordState, setRecordState]       = useState<RecordState>('idle')
  const [recordMode, setRecordMode]         = useState<'normal' | 'loop-punch'>('normal')
  const [loopEnabled, setLoopEnabled]       = useState(false)
  const [clockMode, setClockMode]           = useState<'bars' | 'time'>('bars')
  const [clockPrecision, setClockPrecision] = useState<1 | 2 | 3>(3)
  const [bpm, setBpm]                       = useState(120)
  const [numerator, setNumerator]           = useState(4)
  const [denominator, setDenominator]       = useState(4)
  const [disabled, setDisabled]             = useState(false)
  const [size, setSize]                     = useState<'sm' | 'md'>('md')
  const [selStart]                          = useState(0)
  const [selEnd]                            = useState(2.5)

  const playing   = transportState === 'playing' || transportState === 'recording'
  const recording = transportState === 'recording'

  const [seconds, setSeconds] = useLiveSeconds(playing, 0)

  useEffect(() => {
    if (!playing) setSeconds(0)
  }, [playing, setSeconds])

  function handlePlay() {
    setTransportState(s => s === 'stopped' ? 'playing' : 'stopped')
  }

  function handleStop() {
    setTransportState('stopped')
    setSeconds(0)
  }

  function handleToggleRecord() {
    setRecordState(s => RECORD_CYCLE[s])
    if (recordState === 'idle') {
      setTransportState('recording')
    } else if (recordState === 'recording') {
      setTransportState('playing')
    }
  }

  function handleSetTimeSignature(num: number, den: number) {
    setNumerator(num)
    setDenominator(den)
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <TransportBar
          playing={playing}
          recording={recording}
          seconds={seconds}
          bpm={bpm}
          numerator={numerator}
          denominator={denominator}
          loopEnabled={loopEnabled}
          recordState={recordState}
          recordMode={recordMode}
          selectionStart={selStart}
          selectionEnd={selEnd}
          gridDivision="1/8"
          rate={1.0}
          clockMode={clockMode}
          onClockModeChange={setClockMode}
          clockPrecision={clockPrecision}
          onPlay={handlePlay}
          onStop={handleStop}
          onGoToStart={() => setSeconds(0)}
          onGoToEnd={() => setSeconds(120)}
          onToggleRecord={handleToggleRecord}
          onSelectRecordMode={setRecordMode}
          onToggleLoop={setLoopEnabled}
          onSetTempo={setBpm}
          onSetTimeSignature={handleSetTimeSignature}
          size={size}
          disabled={disabled}
        />

        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', paddingTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={labelStyle}>
              transport
              <select
                value={transportState}
                onChange={e => setTransportState(e.target.value as TransportState)}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
              >
                <option value="stopped">stopped</option>
                <option value="playing">playing</option>
                <option value="recording">recording</option>
              </select>
            </label>
            <label style={labelStyle}>
              record
              <select
                value={recordState}
                onChange={e => setRecordState(e.target.value as RecordState)}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
              >
                <option value="idle">idle</option>
                <option value="armed">armed</option>
                <option value="recording">recording</option>
              </select>
            </label>
            <label style={labelStyle}>
              size
              <select
                value={size}
                onChange={e => setSize(e.target.value as 'sm' | 'md')}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
              >
                <option value="md">md</option>
                <option value="sm">sm</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Checkbox checked={loopEnabled} onChange={setLoopEnabled} size="sm" label="loop enabled" />
            <Checkbox checked={disabled}    onChange={setDisabled}    size="sm" label="disabled" />
            <Checkbox
              checked={clockMode === 'time'}
              onChange={v => setClockMode(v ? 'time' : 'bars')}
              size="sm"
              label="clock: time mode"
            />
            <label style={labelStyle}>
              clock precision
              <select
                value={clockPrecision}
                onChange={e => setClockPrecision(Number(e.target.value) as 1 | 2 | 3)}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
              >
                <option value={3}>3 — full</option>
                <option value={2}>2 — mid</option>
                <option value={1}>1 — coarse</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function TransportBarDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
