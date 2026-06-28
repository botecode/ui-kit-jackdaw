// src/components/FlyHighButton/FlyHighButton.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { TextField } from '../TextField'
import { FlyHighButton } from './FlyHighButton'

export const meta: DemoMeta = {
  name: 'FlyHighButton',
  group: 'Composites',
  route: '/fly-high-button',
  order: 126,
}

const NOOP = () => {}

// The hero is full-width; give each cell room so the wide card reads true.
function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '100%', maxWidth: 460 }}>{children}</div>
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="idle — the accent call-to-play">
        <Stage>
          <FlyHighButton onStart={NOOP} />
        </Stage>
      </State>

      <State label="idle — host label (Go High)">
        <Stage>
          <FlyHighButton label="Go High" onStart={NOOP} />
        </Stage>
      </State>

      <State label="idle hover (brighten — hover the hero)">
        <Stage>
          <FlyHighButton
            label="Fly High"
            tagline="Hover me — the lamp leans in."
            onStart={NOOP}
          />
        </Stage>
      </State>

      <State label="idle focus (tab to it → cream ring)">
        <Stage>
          <FlyHighButton tagline="Tab here to see the focus ring." onStart={NOOP} />
        </Stage>
      </State>

      <State label="listening — the armed stage-dark look">
        <Stage>
          <FlyHighButton state="listening" onStart={NOOP} onStop={NOOP} />
        </Stage>
      </State>

      <State label="sm — idle">
        <Stage>
          <FlyHighButton size="sm" onStart={NOOP} />
        </Stage>
      </State>

      <State label="sm — listening">
        <Stage>
          <FlyHighButton size="sm" state="listening" onStart={NOOP} onStop={NOOP} />
        </Stage>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  // Dogfood: the host owns state — click starts, the parent flips to listening;
  // click again stops. Exactly the wiring the real Home screen would use.
  const [listening, setListening] = useState(false)
  const [small, setSmall] = useState(false)
  const [label, setLabel] = useState('Fly High')
  const [lastIntent, setLastIntent] = useState<string | null>(null)

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <FlyHighButton
            label={label || 'Fly High'}
            size={small ? 'sm' : 'md'}
            state={listening ? 'listening' : 'idle'}
            onStart={() => {
              setListening(true)
              setLastIntent('onStart')
            }}
            onStop={() => {
              setListening(false)
              setLastIntent('onStop')
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
            <Toggle
              checked={listening}
              onChange={setListening}
              size="sm"
              label="listening"
            />
            <Toggle checked={small} onChange={setSmall} size="sm" label="sm size" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 200 }}>
            <TextField
              label="label"
              value={label}
              onChange={setLabel}
              placeholder="Fly High"
              size="sm"
            />
            {lastIntent && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                intent → {lastIntent}
              </span>
            )}
          </div>
        </div>
      </div>
    </Playground>
  )
}

export default function FlyHighButtonDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
