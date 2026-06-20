import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { PhaseInvert } from './PhaseInvert'
import { Checkbox } from '../Checkbox'

export const meta: DemoMeta = {
  name: 'PhaseInvert',
  group: 'Primitives',
  route: '/phase-invert',
  order: 4,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off (recessed)">
        <PhaseInvert inverted={false} onToggle={noop} />
      </State>
      <State label="Inverted (lit ø)">
        <PhaseInvert inverted onToggle={noop} />
      </State>
      <State label="Focus">
        <PhaseInvert inverted={false} onToggle={noop} autoFocus />
      </State>
      <State label="Disabled — off">
        <PhaseInvert inverted={false} onToggle={noop} disabled />
      </State>
      <State label="Disabled — inverted">
        <PhaseInvert inverted onToggle={noop} disabled />
      </State>
      <State label="sm — off">
        <PhaseInvert inverted={false} onToggle={noop} size="sm" />
      </State>
      <State label="sm — inverted">
        <PhaseInvert inverted onToggle={noop} size="sm" />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [inverted, setInverted] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
          <PhaseInvert
            inverted={inverted}
            onToggle={setInverted}
            disabled={disabled}
            size={size}
          />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}>
            {inverted ? 'ø on' : 'ø off'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox checked={inverted} onChange={setInverted} size="sm" label="inverted" />
          <Checkbox checked={disabled} onChange={setDisabled} size="sm" label="disabled" />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (28×28px)</option>
              <option value="sm">sm (20×20px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function PhaseInvertDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
