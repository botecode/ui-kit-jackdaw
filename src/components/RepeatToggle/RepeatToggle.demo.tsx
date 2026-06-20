import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { RepeatToggle } from './RepeatToggle'

export const meta: DemoMeta = {
  name: 'RepeatToggle',
  group: 'Primitives',
  route: '/repeat-toggle',
  order: 12,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off">
        <RepeatToggle repeating={false} onToggle={noop} />
      </State>
      <State label="On (lit)">
        <RepeatToggle repeating onToggle={noop} />
      </State>
      <State label="Disabled">
        <RepeatToggle repeating={false} onToggle={noop} disabled />
      </State>
      <State label="Disabled on">
        <RepeatToggle repeating onToggle={noop} disabled />
      </State>
      <State label="sm">
        <RepeatToggle repeating size="sm" onToggle={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [repeating, setRepeating] = useState(false)
  const [disabled, setDisabled] = useState(false)
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
        <RepeatToggle
          repeating={repeating}
          onToggle={setRepeating}
          disabled={disabled}
          size={size}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox
            checked={repeating}
            onChange={setRepeating}
            size="sm"
            label="repeating"
          />
          <Checkbox
            checked={disabled}
            onChange={setDisabled}
            size="sm"
            label="disabled"
          />
          {/* Native <select> matches TransportButton.demo.tsx — shared debt,
              fix both when we migrate playground controls to InputSelect */}
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36×36px)</option>
              <option value="sm">sm (28×28px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function RepeatToggleDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
