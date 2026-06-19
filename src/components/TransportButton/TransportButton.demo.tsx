import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { TransportButton } from './TransportButton'
import { Checkbox } from '../Checkbox'

export const meta: DemoMeta = {
  name: 'TransportButton',
  group: 'Primitives',
  route: '/transport-button',
  order: 10,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}
  return (
    <StatesGrid>
      <State label="Play (idle)">
        <TransportButton variant="play" onClick={noop} />
      </State>
      <State label="Playing (lit)">
        <TransportButton variant="play" playing onClick={noop} />
      </State>
      <State label="Stop">
        <TransportButton variant="stop" onClick={noop} />
      </State>
      <State label="Pause">
        <TransportButton variant="pause" onClick={noop} />
      </State>
      <State label="Disabled">
        <TransportButton variant="play" disabled onClick={noop} />
      </State>
      <State label="sm">
        <TransportButton variant="play" size="sm" onClick={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [variant, setVariant] = useState<'play' | 'stop' | 'pause'>('play')
  const [playing, setPlaying] = useState(false)
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
        {/* Interactive instance — play variant toggles playing on click */}
        <TransportButton
          variant={variant}
          playing={playing}
          disabled={disabled}
          size={size}
          onClick={() => {
            if (variant === 'play') setPlaying(p => !p)
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <label style={labelStyle}>
            variant
            <select
              value={variant}
              onChange={e => {
                setVariant(e.target.value as 'play' | 'stop' | 'pause')
                setPlaying(false)
              }}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="play">play</option>
              <option value="stop">stop</option>
              <option value="pause">pause</option>
            </select>
          </label>
          {variant === 'play' && (
            <Checkbox
              checked={playing}
              onChange={setPlaying}
              size="sm"
              label="playing"
            />
          )}
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

export default function TransportButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
