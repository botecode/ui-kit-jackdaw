import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { RecordMode } from './RecordMode'
import type { RecordModeState, RecordModeValue } from './RecordMode'

export const meta: DemoMeta = {
  name:  'RecordMode',
  group: 'Primitives',
  route: '/record-mode',
  order: 11,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Idle">
        <RecordMode state="idle" mode="normal" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Armed">
        <RecordMode state="armed" mode="normal" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Recording">
        <RecordMode state="recording" mode="normal" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Loop-punch (idle)">
        <RecordMode state="idle" mode="loop-punch" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Loop-punch (armed)">
        <RecordMode state="armed" mode="loop-punch" onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="Disabled">
        <RecordMode state="idle" mode="normal" disabled onToggleRecord={noop} onSelectMode={noop} />
      </State>
      <State label="sm">
        <RecordMode state="idle" mode="normal" size="sm" onToggleRecord={noop} onSelectMode={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  // Cycle idle → armed → recording → idle on record click
  const [state,    setState]    = useState<RecordModeState>('idle')
  const [mode,     setMode]     = useState<RecordModeValue>('normal')
  const [disabled, setDisabled] = useState(false)
  const [size,     setSize]     = useState<'sm' | 'md'>('md')

  const cycle: Record<RecordModeState, RecordModeState> = {
    idle:      'armed',
    armed:     'recording',
    recording: 'idle',
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
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <RecordMode
          state={state}
          mode={mode}
          disabled={disabled}
          size={size}
          onToggleRecord={() => setState(s => cycle[s])}
          onSelectMode={setMode}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            state
            <select
              value={state}
              onChange={e => setState(e.target.value as RecordModeState)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="idle">idle</option>
              <option value="armed">armed</option>
              <option value="recording">recording</option>
            </select>
          </label>
          <label style={labelStyle}>
            mode
            <select
              value={mode}
              onChange={e => setMode(e.target.value as RecordModeValue)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="normal">normal</option>
              <option value="loop-punch">loop-punch</option>
            </select>
          </label>
          <Checkbox
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
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
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function RecordModeDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
