import { useEffect, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ProductFrame } from '../ProductFrame'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { MobileRecordButton } from './MobileRecordButton'
import type { MobileRecordState } from './MobileRecordButton'

export const meta: DemoMeta = {
  name:  'MobileRecordButton',
  group: 'Composites',
  route: '/mobile-record-button',
  order: 120,
}

const noop = () => {}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Idle (Record)">
        <MobileRecordButton state="idle" onStart={noop} onStop={noop} />
      </State>
      <State label="Recording">
        <MobileRecordButton
          state="recording"
          elapsedSeconds={23}
          level={0.62}
          onStart={noop}
          onStop={noop}
        />
      </State>
      <State label="Recording (hot)">
        <MobileRecordButton
          state="recording"
          elapsedSeconds={148}
          level={0.96}
          onStart={noop}
          onStop={noop}
        />
      </State>
      <State label="Stopped (take captured)">
        <MobileRecordButton state="stopped" elapsedSeconds={42} onStart={noop} onStop={noop} />
      </State>
      <State label="Disabled (no mic)">
        <MobileRecordButton state="disabled" onStart={noop} onStop={noop} />
      </State>
      <State label="sm — idle">
        <MobileRecordButton state="idle" size="sm" onStart={noop} onStop={noop} />
      </State>
      <State label="sm — recording">
        <MobileRecordButton
          state="recording"
          size="sm"
          elapsedSeconds={9}
          level={0.5}
          onStart={noop}
          onStop={noop}
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground — a live recorder inside the phone frame ─────────────────────────

function PlaygroundDemo() {
  const [micGranted, setMicGranted] = useState(true)
  const [phase, setPhase]           = useState<'idle' | 'recording' | 'stopped'>('idle')
  const [elapsed, setElapsed]       = useState(0)
  const [level, setLevel]           = useState(0.4)

  // No mic permission collapses everything to the disabled state.
  const state: MobileRecordState = micGranted ? phase : 'disabled'

  // Tick the take clock while rolling (the caller owns the clock in the real
  // app — here the demo plays that role at ~10 Hz). onStart resets elapsed to 0,
  // so the interval can measure straight from its own start time.
  useEffect(() => {
    if (phase !== 'recording') return
    const t0 = performance.now()
    const id = setInterval(() => setElapsed((performance.now() - t0) / 1000), 100)
    return () => clearInterval(id)
  }, [phase])

  const labelStyle: React.CSSProperties = {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
  }

  const stageStyle: React.CSSProperties = {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            'var(--space-6)',
    height:         '100%',
    padding:        'var(--space-8) var(--space-4)',
    background:     'var(--bg)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-10)', alignItems: 'center', flexWrap: 'wrap' }}>
        <ProductFrame variant="phone" caption="Record tab">
          <div style={stageStyle}>
            <MobileRecordButton
              state={state}
              elapsedSeconds={elapsed}
              level={level}
              onStart={() => { setElapsed(0); setPhase('recording') }}
              onStop={() => setPhase('stopped')}
            />
          </div>
        </ProductFrame>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Toggle
            checked={micGranted}
            onChange={setMicGranted}
            size="sm"
            label="Microphone access"
          />
          <label style={{ ...labelStyle, flexDirection: 'column', alignItems: 'flex-start' }}>
            input level
            <Fader
              value={level}
              onChange={setLevel}
              min={0}
              max={1}
              orientation="horizontal"
              size="md"
              aria-label="Demo input level"
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ──────────────────────────────────────────────────────────────

export default function MobileRecordButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
