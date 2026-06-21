// src/components/Kbd/Kbd.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Kbd } from './Kbd'

export const meta: DemoMeta = {
  name: 'Kbd',
  group: 'Primitives',
  route: '/kbd',
  order: 5,
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="single key">
        <Kbd keys={['C']} platform="mac" />
      </State>
      <State label="2-key combo">
        <Kbd keys={['Meta', 'C']} platform="mac" />
      </State>
      <State label="3-key combo">
        <Kbd keys={['Meta', 'Shift', 'Z']} platform="mac" />
      </State>
      <State label="4-key (long combo)">
        <Kbd keys={['Meta', 'Shift', 'Control', 'P']} platform="mac" />
      </State>
      <State label="Escape">
        <Kbd keys={['Escape']} platform="mac" />
      </State>
      <State label="Return">
        <Kbd keys={['Enter']} platform="mac" />
      </State>
      <State label="Backspace">
        <Kbd keys={['Backspace']} platform="mac" />
      </State>
      <State label="Tab">
        <Kbd keys={['Tab']} platform="mac" />
      </State>
      <State label="arrow key">
        <Kbd keys={['ArrowUp']} platform="mac" />
      </State>
      <State label="Space">
        <Kbd keys={['Space']} platform="mac" />
      </State>
      <State label="empty / unbound">
        <Kbd keys={[]} platform="mac" />
      </State>
      <State label="size sm">
        <Kbd keys={['Meta', 'Shift', 'Z']} size="sm" platform="mac" />
      </State>
      <State label="Win — modifier">
        <Kbd keys={['Meta', 'Z']} platform="win" />
      </State>
      <State label="Win — combo">
        <Kbd keys={['Control', 'Shift', 'Z']} platform="win" />
      </State>
      <State label="binding string (mac glyphs)">
        <Kbd binding="⌘⇧Z" platform="mac" />
      </State>
      <State label="binding string (plus-sep)">
        <Kbd binding="Ctrl+X" platform="win" />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

const EXAMPLE_COMBOS: Array<{ label: string; keys: string[] }> = [
  { label: 'Undo',      keys: ['Meta', 'Z'] },
  { label: 'Redo',      keys: ['Meta', 'Shift', 'Z'] },
  { label: 'Save',      keys: ['Meta', 'S'] },
  { label: 'Play/Stop', keys: ['Space'] },
  { label: 'Record',    keys: ['R'] },
  { label: 'Delete',    keys: ['Backspace'] },
  { label: 'Escape',    keys: ['Escape'] },
  { label: 'Unbound',   keys: [] },
]

function PlaygroundDemo() {
  const [platform, setPlatform] = useState<'mac' | 'win'>('mac')
  const [size, setSize]         = useState<'sm' | 'md'>('md')

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Controls — dogfood Toggle */}
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
          <Toggle
            checked={platform === 'win'}
            onChange={on => setPlatform(on ? 'win' : 'mac')}
            size="sm"
            label="Win platform"
          />
          <Toggle
            checked={size === 'sm'}
            onChange={on => setSize(on ? 'sm' : 'md')}
            size="sm"
            label="sm size"
          />
        </div>

        {/* Live examples table */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 'var(--space-2) var(--space-4)',
            alignItems: 'center',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          {EXAMPLE_COMBOS.map(({ label, keys }) => (
            <>
              <span key={`l-${label}`}>{label}</span>
              <Kbd key={`k-${label}`} keys={keys} platform={platform} size={size} />
            </>
          ))}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function KbdDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
