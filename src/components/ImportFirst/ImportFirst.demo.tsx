// src/components/ImportFirst/ImportFirst.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ImportFirst } from './ImportFirst'

export const meta: DemoMeta = {
  name: 'ImportFirst',
  group: 'Composites',
  route: '/import-first',
  order: 54,
}

const NOOP = () => {}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default">
        <div style={{ width: 320 }}>
          <ImportFirst songName="Summer Drift" itemLabel="this vocal" onImport={NOOP} onCancel={NOOP} />
        </div>
      </State>
      <State label="busy (importing)">
        <div style={{ width: 320 }}>
          <ImportFirst songName="Summer Drift" itemLabel="this vocal" busy onImport={NOOP} onCancel={NOOP} />
        </div>
      </State>
      <State label="default item label">
        <div style={{ width: 320 }}>
          <ImportFirst songName="Night Harbor" onImport={NOOP} onCancel={NOOP} />
        </div>
      </State>
      <State label="long song name">
        <div style={{ width: 320 }}>
          <ImportFirst songName="The Very Long Working Title (Reprise)" itemLabel="this take" onImport={NOOP} onCancel={NOOP} />
        </div>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [busy, setBusy] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 340 }}>
          <ImportFirst songName="Summer Drift" itemLabel="this vocal" busy={busy} onImport={NOOP} onCancel={NOOP} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
          <Toggle checked={busy} onChange={setBusy} size="sm" label="importing" />
        </div>
      </div>
    </Playground>
  )
}

export default function ImportFirstDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
