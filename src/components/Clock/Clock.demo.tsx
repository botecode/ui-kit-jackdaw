import { useState, useEffect, useRef } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { Clock } from './Clock'

export const meta: DemoMeta = {
  name: 'Clock',
  group: 'Primitives',
  route: '/clock',
  order: 12,
}

// ── Live advancing position (used for playing/recording states) ──────────────

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

  return seconds
}

// ── States grid ───────────────────────────────────────────────────────────────

function PlayingClock() {
  const seconds = useLiveSeconds(true, 0)
  return (
    <Clock
      seconds={seconds}
      bpm={120}
      numerator={4}
      denominator={4}
      state="playing"
      mode="bars"
    />
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Stopped, at zero">
        <Clock
          seconds={0}
          bpm={120}
          numerator={4}
          denominator={4}
          state="stopped"
          mode="bars"
        />
      </State>

      <State label="Playing (advancing)">
        <PlayingClock />
      </State>

      <State label="Recording (red)">
        <Clock
          seconds={37.5}
          bpm={120}
          numerator={4}
          denominator={4}
          state="recording"
          mode="bars"
        />
      </State>

      <State label="Bars mode">
        <Clock
          seconds={19 * 2 + 2 * 0.5 + 11 / 96 / 2}
          bpm={120}
          numerator={4}
          denominator={4}
          state="stopped"
          mode="bars"
        />
      </State>

      <State label="Time mode">
        <Clock
          seconds={73.456}
          bpm={120}
          numerator={4}
          denominator={4}
          state="playing"
          mode="time"
        />
      </State>

      <State label="Large value">
        <Clock
          seconds={7384.5}
          bpm={120}
          numerator={4}
          denominator={4}
          state="playing"
          mode="time"
        />
      </State>

      <State label="sm size">
        <Clock
          seconds={0}
          bpm={120}
          numerator={4}
          denominator={4}
          state="stopped"
          mode="bars"
          size="sm"
        />
      </State>

      <State label="3/4 time">
        <Clock
          seconds={9}
          bpm={120}
          numerator={3}
          denominator={4}
          state="stopped"
          mode="bars"
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [state, setState] = useState<'stopped' | 'playing' | 'recording'>('stopped')
  const [mode, setMode] = useState<'bars' | 'time'>('bars')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [running, setRunning] = useState(false)
  const liveSeconds = useLiveSeconds(running, 0)
  const [frozenSeconds, setFrozenSeconds] = useState(0)

  // When transport state changes to playing/recording, start the clock.
  // Stopped: freeze.
  useEffect(() => {
    const isActive = state === 'playing' || state === 'recording'
    setRunning(isActive)
    if (!isActive) setFrozenSeconds(0)
  }, [state])

  const seconds = running ? liveSeconds : frozenSeconds

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
        <Clock
          seconds={seconds}
          bpm={120}
          numerator={4}
          denominator={4}
          state={state}
          mode={mode}
          onModeChange={setMode}
          size={size}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            state
            <select
              value={state}
              onChange={e => setState(e.target.value as typeof state)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="stopped">stopped</option>
              <option value="playing">playing</option>
              <option value="recording">recording</option>
            </select>
          </label>

          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as typeof size)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md</option>
              <option value="sm">sm</option>
            </select>
          </label>

          <Checkbox
            checked={mode === 'time'}
            onChange={v => setMode(v ? 'time' : 'bars')}
            size="sm"
            label="time mode"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ClockDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
