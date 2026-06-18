import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ArmButton } from './ArmButton'

export const meta: DemoMeta = {
  name: 'ArmButton',
  group: 'Primitives',
  route: '/arm-button',
  order: 3,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off">
        <ArmButton armed={false} onToggle={noop} />
      </State>
      <State label="Armed">
        <ArmButton armed onToggle={noop} />
      </State>
      <State label="Recording">
        <ArmButton armed recording onToggle={noop} />
      </State>
      <State label="Disabled">
        <ArmButton armed={false} disabled onToggle={noop} />
      </State>
      <State label="sm (armed)">
        <ArmButton armed size="sm" onToggle={noop} />
      </State>
      <State label="Focus">
        {/* autoFocus demonstrates :focus-visible ring in the gallery */}
        <ArmButton armed={false} onToggle={noop} autoFocus />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [armed, setArmed] = useState(false)
  const [recording, setRecording] = useState(false)
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
        {/* Left: interactive instance + a pinned armed+recording for steady-vs-pulse comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
          <ArmButton
            armed={armed}
            recording={recording}
            disabled={disabled}
            size={size}
            onToggle={() => setArmed(a => !a)}
          />
          <ArmButton
            armed
            recording
            size={size}
            onToggle={() => {}}
            aria-label="Recording (pinned demo)"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            <input type="checkbox" checked={armed} onChange={e => setArmed(e.target.checked)} />
            armed
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={recording} onChange={e => setRecording(e.target.checked)} />
            recording
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} />
            disabled
          </label>
          <label style={labelStyle}>
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

export default function ArmButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
