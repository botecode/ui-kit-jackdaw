// src/components/FxChip/FxChip.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { InputSelect } from '../InputSelect'
import { FxChip } from './FxChip'
import type { FxPlugin } from './FxChip'

export const meta: DemoMeta = {
  name: 'FxChip',
  group: 'Primitives',
  route: '/fx-chip',
  order: 8,
}

const noop = () => {}

// ── Stub plugin list for playground "Add plugin…" ─────────────────────────────

const STUB_PLUGINS: FxPlugin[] = [
  { id: 'reverb',     name: 'Reverb',     enabled: true },
  { id: 'compressor', name: 'Compressor', enabled: true },
  { id: 'eq',         name: 'EQ',         enabled: true },
  { id: 'chorus',     name: 'Chorus',     enabled: true },
  { id: 'delay',      name: 'Delay',      enabled: true },
  { id: 'saturation', name: 'Saturation', enabled: true },
]

// ── Mock track corner wrapper ─────────────────────────────────────────────────

function TrackCorner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 200,
      height: 36,
      background: 'var(--strip-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 'var(--space-1)',
      padding: '0 var(--space-2)',
    }}>
      {children}
      <InputSelect
        value="in-1"
        onChange={noop}
        options={[{ id: 'in-1', label: 'Input 1' }, { id: 'in-2', label: 'Input 2' }]}
        variant="chip"
        aria-label="Audio input"
      />
    </div>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="empty">
        <TrackCorner>
          <FxChip plugins={[]} chainEnabled={false} onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop} />
        </TrackCorner>
      </State>

      <State label="1 plugin, active">
        <TrackCorner>
          <FxChip
            plugins={[{ id: 'r', name: 'Reverb', enabled: true }]}
            chainEnabled
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
          />
        </TrackCorner>
      </State>

      <State label="FX 4 — active">
        <TrackCorner>
          <FxChip
            plugins={STUB_PLUGINS.slice(0, 4)}
            chainEnabled
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
          />
        </TrackCorner>
      </State>

      <State label="bypassed chain">
        <TrackCorner>
          <FxChip
            plugins={STUB_PLUGINS.slice(0, 4)}
            chainEnabled={false}
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
          />
        </TrackCorner>
      </State>

      <State label="some plugins bypassed">
        <TrackCorner>
          <FxChip
            plugins={[
              { id: 'r', name: 'Reverb',     enabled: true  },
              { id: 'c', name: 'Compressor', enabled: false },
              { id: 'e', name: 'EQ',         enabled: true  },
            ]}
            chainEnabled
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
          />
        </TrackCorner>
      </State>

      <State label="open (chain editor)">
        <div style={{ paddingBottom: 180 }}>
          <TrackCorner>
            <FxChip
              plugins={STUB_PLUGINS.slice(0, 3)}
              chainEnabled
              defaultOpen
              onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
            />
          </TrackCorner>
        </div>
      </State>

      <State label="disabled">
        <TrackCorner>
          <FxChip
            plugins={STUB_PLUGINS.slice(0, 2)}
            chainEnabled
            disabled
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
          />
        </TrackCorner>
      </State>

      <State label="sm">
        <TrackCorner>
          <FxChip
            plugins={STUB_PLUGINS.slice(0, 2)}
            chainEnabled
            size="sm"
            onToggleChain={noop} onTogglePlugin={noop} onReorder={noop} onRemove={noop} onAdd={noop}
          />
        </TrackCorner>
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [plugins, setPlugins]           = useState<FxPlugin[]>(STUB_PLUGINS.slice(0, 3))
  const [chainEnabled, setChainEnabled] = useState(true)
  const [disabled, setDisabled]         = useState(false)
  const [size, setSize]                 = useState<'sm' | 'md'>('md')
  const [addIdx, setAddIdx]             = useState(0)

  function handleTogglePlugin(id: string, next: boolean) {
    setPlugins(ps => ps.map(p => p.id === id ? { ...p, enabled: next } : p))
  }

  function handleReorder(from: number, to: number) {
    setPlugins(ps => {
      const next = [...ps]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function handleRemove(id: string) {
    setPlugins(ps => ps.filter(p => p.id !== id))
  }

  function handleAdd() {
    const remaining = STUB_PLUGINS.filter(s => !plugins.find(p => p.id === s.id))
    if (remaining.length === 0) return
    const next = remaining[addIdx % remaining.length]
    setPlugins(ps => [...ps, { ...next }])
    setAddIdx(i => i + 1)
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ paddingBottom: 240 }}>
          <TrackCorner>
            <FxChip
              plugins={plugins}
              chainEnabled={chainEnabled}
              onToggleChain={setChainEnabled}
              onTogglePlugin={handleTogglePlugin}
              onReorder={handleReorder}
              onRemove={handleRemove}
              onAdd={handleAdd}
              size={size}
              disabled={disabled}
            />
          </TrackCorner>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={chainEnabled} onChange={setChainEnabled} size="sm" label="chainEnabled" />
          <Toggle checked={disabled}     onChange={setDisabled}     size="sm" label="disabled" />
          <Toggle
            checked={size === 'sm'}
            onChange={next => setSize(next ? 'sm' : 'md')}
            size="sm"
            label="size=sm"
          />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function FxChipDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
