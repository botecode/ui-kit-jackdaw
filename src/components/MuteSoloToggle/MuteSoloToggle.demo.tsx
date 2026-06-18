import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { MuteSoloToggle } from './MuteSoloToggle'
import { Checkbox } from '../Checkbox'

export const meta: DemoMeta = {
  name: 'MuteSoloToggle',
  group: 'Primitives',
  route: '/mute-solo-toggle',
  order: 2,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Both off">
        <MuteSoloToggle muted={false} soloed={false} onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Muted">
        <MuteSoloToggle muted soloed={false} onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Soloed">
        <MuteSoloToggle muted={false} soloed onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Both on">
        <MuteSoloToggle muted soloed onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Silenced by solo">
        <MuteSoloToggle muted={false} soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Muted + any solo active">
        {/* Explicit mute wins — M shows lit mute, not hatch */}
        <MuteSoloToggle muted soloed={false} anySoloActive onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="Disabled">
        <MuteSoloToggle muted={false} soloed={false} disabled onToggleMute={noop} onToggleSolo={noop} />
      </State>
      <State label="sm + inline">
        <MuteSoloToggle muted={false} soloed size="sm" orientation="inline" onToggleMute={noop} onToggleSolo={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [muted, setMuted] = useState(false)
  const [soloed, setSoloed] = useState(false)
  const [anySoloActive, setAnySoloActive] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [orientation, setOrientation] = useState<'stacked' | 'inline'>('stacked')
  const [size, setSize] = useState<'sm' | 'md'>('md')

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
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <MuteSoloToggle
          muted={muted}
          soloed={soloed}
          anySoloActive={anySoloActive}
          disabled={disabled}
          orientation={orientation}
          size={size}
          onToggleMute={() => setMuted(m => !m)}
          onToggleSolo={() => setSoloed(s => !s)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox checked={muted} onChange={v => setMuted(v)} size="sm" label="muted" />
          <Checkbox checked={soloed} onChange={v => setSoloed(v)} size="sm" label="soloed" />
          <Checkbox checked={anySoloActive} onChange={v => setAnySoloActive(v)} size="sm" label="anySoloActive" />
          <Checkbox checked={disabled} onChange={v => setDisabled(v)} size="sm" label="disabled" />
          <label style={labelStyle}>
            orientation
            <select
              value={orientation}
              onChange={e => setOrientation(e.target.value as 'stacked' | 'inline')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="stacked">stacked</option>
              <option value="inline">inline</option>
            </select>
          </label>
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (28×20px)</option>
              <option value="sm">sm (22×16px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function MuteSoloToggleDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
