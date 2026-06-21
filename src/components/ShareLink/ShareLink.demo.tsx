// src/components/ShareLink/ShareLink.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ShareLink } from './ShareLink'

export const meta: DemoMeta = {
  name: 'ShareLink',
  group: 'Composites',
  route: '/share-link',
  order: 52,
}

const LINK = 'jackdaw://share/7-tuna-zebra-piano'
const NOOP = () => {}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default (idle — recessed)">
        <div style={{ width: 280 }}><ShareLink link={LINK} onCopy={NOOP} /></div>
      </State>
      <State label="active (LED-lit — peer live)">
        <div style={{ width: 280 }}><ShareLink link={LINK} active onCopy={NOOP} /></div>
      </State>
      <State label="link only (QR hidden)">
        <div style={{ width: 280 }}><ShareLink link={LINK} showQR={false} onCopy={NOOP} /></div>
      </State>
      <State label="sm">
        <div style={{ width: 240 }}><ShareLink link={LINK} size="sm" onCopy={NOOP} /></div>
      </State>
      <State label="long code">
        <div style={{ width: 280 }}>
          <ShareLink link="jackdaw://share/9-cedar-violet-harbor-comet-otter" onCopy={NOOP} />
        </div>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [active, setActive] = useState(false)
  const [showQR, setShowQR] = useState(true)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 300 }}>
          <ShareLink link={LINK} active={active} showQR={showQR} onCopy={NOOP} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
          <Toggle checked={active} onChange={setActive} size="sm" label="active (live)" />
          <Toggle checked={showQR} onChange={setShowQR} size="sm" label="show QR" />
        </div>
      </div>
    </Playground>
  )
}

export default function ShareLinkDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
