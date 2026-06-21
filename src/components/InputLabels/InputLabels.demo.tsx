// src/components/InputLabels/InputLabels.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Panel } from '../Panel'
import { InputLabels } from './InputLabels'
import type { InputEntry } from './InputLabels'

export const meta: DemoMeta = {
  name: 'InputLabels',
  group: 'Composites',
  route: '/input-labels',
  order: 40,
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ALL_EMPTY: InputEntry[] = [
  { id: 'e-1', name: 'Input 1' },
  { id: 'e-2', name: 'Input 2' },
  { id: 'e-3', name: 'Input 3' },
  { id: 'e-4', name: 'Input 4' },
]

const SOME_LABELLED: InputEntry[] = [
  { id: 's-1', name: 'Input 1', label: 'Guitar - ez1073' },
  { id: 's-2', name: 'Input 2', label: 'Bass DI' },
  { id: 's-3', name: 'Input 3' },
  { id: 's-4', name: 'Input 4' },
]

const MANY: InputEntry[] = [
  { id: 'm-1',  name: 'Input 1',  label: 'Guitar - ez1073' },
  { id: 'm-2',  name: 'Input 2',  label: 'Bass DI' },
  { id: 'm-3',  name: 'Input 3',  label: 'Kick' },
  { id: 'm-4',  name: 'Input 4',  label: 'Snare Top' },
  { id: 'm-5',  name: 'Input 5' },
  { id: 'm-6',  name: 'Input 6' },
  { id: 'm-7',  name: 'Input 7' },
  { id: 'm-8',  name: 'Input 8' },
  { id: 'm-9',  name: 'Input 9' },
  { id: 'm-10', name: 'Input 10' },
  { id: 'm-11', name: 'Input 11' },
  { id: 'm-12', name: 'Input 12' },
]

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const [editable, setEditable] = useState<InputEntry[]>(SOME_LABELLED)

  return (
    <StatesGrid>
      <State label="Empty pills (placeholder)">
        <Panel title="Inputs" style={{ width: 300 }}>
          <InputLabels inputs={ALL_EMPTY} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Labelled pills">
        <Panel title="Inputs" style={{ width: 300 }}>
          <InputLabels inputs={SOME_LABELLED} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Inline edit (click any pill)">
        <Panel title="Inputs" style={{ width: 300 }}>
          <InputLabels
            inputs={editable}
            onLabel={(id, label) =>
              setEditable(prev => prev.map(i => i.id === id ? { ...i, label } : i))
            }
          />
        </Panel>
      </State>

      <State label="Many inputs (scroll)">
        <Panel title="Inputs" style={{ width: 300 }}>
          <InputLabels inputs={MANY} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Disabled">
        <Panel title="Inputs" style={{ width: 300 }}>
          <InputLabels inputs={SOME_LABELLED} onLabel={() => {}} disabled />
        </Panel>
      </State>

      <State label="Empty list">
        <Panel title="Inputs" style={{ width: 300 }}>
          <InputLabels inputs={[]} onLabel={() => {}} />
        </Panel>
      </State>

      <State label="Small size">
        <Panel title="Inputs" style={{ width: 260 }}>
          <InputLabels inputs={SOME_LABELLED} onLabel={() => {}} size="sm" />
        </Panel>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [inputs, setInputs] = useState<InputEntry[]>(SOME_LABELLED)
  const [useSmall,    setUseSmall]    = useState(false)
  const [useMany,     setUseMany]     = useState(false)
  const [useDisabled, setUseDisabled] = useState(false)

  const displayed = useMany
    ? MANY.map(m => ({ ...m, label: inputs.find(i => i.id === m.id)?.label ?? m.label }))
    : inputs

  function handleLabel(id: string, label: string) {
    setInputs(prev => prev.map(i => i.id === id ? { ...i, label } : i))
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Panel title="Inputs" style={{ width: 320 }}>
          <InputLabels
            inputs={displayed}
            onLabel={handleLabel}
            size={useSmall ? 'sm' : 'md'}
            disabled={useDisabled}
          />
        </Panel>

        {/* Controls — dogfooded from kit Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={useSmall}    onChange={setUseSmall}    size="sm" label="size sm" />
          <Toggle checked={useMany}     onChange={setUseMany}     size="sm" label="many inputs" />
          <Toggle checked={useDisabled} onChange={setUseDisabled} size="sm" label="disabled" />
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              margin: 0,
              whiteSpace: 'pre',
            }}
          >
            {inputs.map(i => `${i.name}: ${i.label || '—'}`).join('\n')}
          </p>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function InputLabelsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
