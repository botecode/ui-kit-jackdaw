import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { AutomationButton } from './AutomationButton'
import type { AutomationMode } from './AutomationButton'

export const meta: DemoMeta = {
  name:  'AutomationButton',
  group: 'Primitives',
  route: '/automation-button',
  order: 14,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Off (track)">
        <AutomationButton engaged={false} onToggle={noop} scope="track" />
      </State>
      <State label="Engaged (track)">
        <AutomationButton engaged onToggle={noop} scope="track" />
      </State>
      <State label="Off (master)">
        <AutomationButton engaged={false} onToggle={noop} scope="master" />
      </State>
      <State label="Engaged (master)">
        <AutomationButton engaged onToggle={noop} scope="master" />
      </State>
      <State label="sm — off">
        <AutomationButton engaged={false} onToggle={noop} size="sm" />
      </State>
      <State label="sm — engaged">
        <AutomationButton engaged onToggle={noop} size="sm" />
      </State>
      <State label="Disabled — off">
        <AutomationButton engaged={false} onToggle={noop} disabled />
      </State>
      <State label="Disabled — engaged">
        <AutomationButton engaged onToggle={noop} disabled />
      </State>
      <State label="Read mode">
        <AutomationButton
          engaged
          onToggle={noop}
          mode="read"
          onModeChange={noop}
        />
      </State>
      <State label="Write mode">
        <AutomationButton
          engaged
          onToggle={noop}
          mode="write"
          onModeChange={noop}
        />
      </State>
      <State label="With caret — sm">
        <AutomationButton
          engaged={false}
          onToggle={noop}
          size="sm"
          mode="read"
          onModeChange={noop}
        />
      </State>
      <State label="Disabled (caret)">
        <AutomationButton
          engaged={false}
          onToggle={noop}
          mode="read"
          onModeChange={noop}
          disabled
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [engaged,     setEngaged]     = useState(false)
  const [disabled,    setDisabled]    = useState(false)
  const [size,        setSize]        = useState<'sm' | 'md'>('md')
  const [scope,       setScope]       = useState<'track' | 'master'>('track')
  const [showMode,    setShowMode]    = useState(false)
  const [mode,        setMode]        = useState<AutomationMode>('read')

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
          <AutomationButton
            engaged={engaged}
            onToggle={() => setEngaged(e => !e)}
            size={size}
            scope={scope}
            mode={showMode ? mode : undefined}
            onModeChange={showMode ? setMode : undefined}
            disabled={disabled}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Checkbox
            checked={engaged}
            onChange={v => setEngaged(v)}
            size="sm"
            label="engaged"
          />
          <Checkbox
            checked={disabled}
            onChange={v => setDisabled(v)}
            size="sm"
            label="disabled"
          />
          <Checkbox
            checked={showMode}
            onChange={v => setShowMode(v)}
            size="sm"
            label="show mode caret"
          />
          <label style={labelStyle}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36×36)</option>
              <option value="sm">sm (28×28)</option>
            </select>
          </label>
          <label style={labelStyle}>
            scope
            <select
              value={scope}
              onChange={e => setScope(e.target.value as 'track' | 'master')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="track">track</option>
              <option value="master">master</option>
            </select>
          </label>
          {showMode && (
            <label style={labelStyle}>
              mode
              <select
                value={mode}
                onChange={e => setMode(e.target.value as AutomationMode)}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
              >
                <option value="read">read</option>
                <option value="write">write</option>
              </select>
            </label>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function AutomationButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
