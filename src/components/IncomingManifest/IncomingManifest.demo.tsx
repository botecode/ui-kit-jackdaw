// src/components/IncomingManifest/IncomingManifest.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { IncomingManifest } from './IncomingManifest'
import type { IncomingManifestData } from './IncomingManifest'

export const meta: DemoMeta = {
  name: 'IncomingManifest',
  group: 'Composites',
  route: '/incoming-manifest',
  order: 53,
}

const DATA: IncomingManifestData = {
  trackName:       'Lead Vocal',
  clipCount:       8,
  durationSeconds: 183,
  songName:        'Summer Drift',
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default (song present)">
        <div style={{ width: 300 }}><IncomingManifest manifest={DATA} /></div>
      </State>
      <State label="missing song (needsImport)">
        <div style={{ width: 300 }}><IncomingManifest manifest={{ ...DATA, needsImport: true }} /></div>
      </State>
      <State label="single clip">
        <div style={{ width: 300 }}>
          <IncomingManifest manifest={{ ...DATA, trackName: 'Guitar DI', clipCount: 1, durationSeconds: 47 }} />
        </div>
      </State>
      <State label="long track name">
        <div style={{ width: 300 }}>
          <IncomingManifest manifest={{ ...DATA, trackName: 'Backing Vocals — Double Tracked' }} />
        </div>
      </State>
      <State label="sm">
        <div style={{ width: 260 }}><IncomingManifest manifest={DATA} size="sm" /></div>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [needsImport, setNeedsImport] = useState(false)
  const [single, setSingle] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 320 }}>
          <IncomingManifest manifest={{ ...DATA, needsImport, clipCount: single ? 1 : 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
          <Toggle checked={needsImport} onChange={setNeedsImport} size="sm" label="missing song" />
          <Toggle checked={single} onChange={setSingle} size="sm" label="single clip" />
        </div>
      </div>
    </Playground>
  )
}

export default function IncomingManifestDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
