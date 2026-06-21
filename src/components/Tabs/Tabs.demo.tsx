// src/components/Tabs/Tabs.demo.tsx
import { useState } from 'react'
import {
  MusicNote,
  SlidersHorizontal,
  GitBranch,
  ClockCounterClockwise,
  SpeakerHigh,
  Waveform,
  Tag,
  Swap,
} from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Tabs } from './Tabs'
import type { TabItem } from './Tabs'

export const meta: DemoMeta = {
  name: 'Tabs',
  group: 'Primitives',
  route: '/tabs',
  order: 11,
}

const PANEL: React.CSSProperties = {
  padding: 'var(--space-4)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

// ── Stateful wrappers ─────────────────────────────────────────────────────────

function TwoTabsState() {
  const [active, setActive] = useState('clips')
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips' },
    { id: 'automation', label: 'Automation' },
  ]
  return (
    <Tabs tabs={tabs} active={active} onChange={setActive}>
      <div style={PANEL}>{tabs.find(t => t.id === active)?.label} content</div>
    </Tabs>
  )
}

function FourTabsState() {
  const [active, setActive] = useState('clips')
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips' },
    { id: 'automation', label: 'Automation' },
    { id: 'sends', label: 'Sends' },
    { id: 'notes', label: 'Notes' },
  ]
  return (
    <Tabs tabs={tabs} active={active} onChange={setActive}>
      <div style={PANEL}>{tabs.find(t => t.id === active)?.label} content</div>
    </Tabs>
  )
}

function WithIconsState() {
  const [active, setActive] = useState('clips')
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips', icon: <MusicNote size={14} /> },
    { id: 'fx', label: 'FX', icon: <SlidersHorizontal size={14} /> },
    { id: 'sends', label: 'Sends', icon: <GitBranch size={14} /> },
  ]
  return (
    <Tabs tabs={tabs} active={active} onChange={setActive}>
      <div style={PANEL}>{tabs.find(t => t.id === active)?.label} content</div>
    </Tabs>
  )
}

function DisabledTabState() {
  const [active, setActive] = useState('clips')
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips' },
    { id: 'automation', label: 'Automation', disabled: true },
    { id: 'sends', label: 'Sends' },
  ]
  return (
    <Tabs tabs={tabs} active={active} onChange={setActive}>
      <div style={PANEL}>{tabs.find(t => t.id === active)?.label} content</div>
    </Tabs>
  )
}

function SmallSizeState() {
  const [active, setActive] = useState('clips')
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips', icon: <MusicNote size={12} /> },
    { id: 'waveform', label: 'Waveform', icon: <Waveform size={12} /> },
    { id: 'sends', label: 'Sends', icon: <SpeakerHigh size={12} /> },
  ]
  return (
    <Tabs tabs={tabs} active={active} onChange={setActive} size="sm">
      <div style={{ ...PANEL, fontSize: 'var(--text-xs)' }}>
        {tabs.find(t => t.id === active)?.label} content
      </div>
    </Tabs>
  )
}

function OverflowState() {
  const [active, setActive] = useState('clips')
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips' },
    { id: 'automation', label: 'Automation' },
    { id: 'sends', label: 'Sends' },
    { id: 'notes', label: 'Notes' },
    { id: 'versions', label: 'Versions' },
    { id: 'markers', label: 'Markers' },
    { id: 'analysis', label: 'Analysis' },
  ]
  return (
    <div style={{ width: 280 }}>
      <Tabs tabs={tabs} active={active} onChange={setActive}>
        <div style={PANEL}>{tabs.find(t => t.id === active)?.label} content</div>
      </Tabs>
    </div>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="2 tabs">
        <TwoTabsState />
      </State>
      <State label="4 tabs">
        <FourTabsState />
      </State>
      <State label="With icons">
        <WithIconsState />
      </State>
      <State label="Disabled tab">
        <DisabledTabState />
      </State>
      <State label="Size sm">
        <SmallSizeState />
      </State>
      <State label="Overflow scroll">
        <OverflowState />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [active, setActive] = useState('clips')
  const [showIcons, setShowIcons] = useState(false)
  const [hasDisabled, setHasDisabled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md'>('md')

  const iconSize = size === 'sm' ? 12 : 14
  const tabs: TabItem[] = [
    { id: 'clips', label: 'Clips', icon: showIcons ? <MusicNote size={iconSize} /> : undefined },
    { id: 'fx', label: 'FX', icon: showIcons ? <SlidersHorizontal size={iconSize} /> : undefined },
    { id: 'sends', label: 'Sends', icon: showIcons ? <GitBranch size={iconSize} /> : undefined, disabled: hasDisabled },
    { id: 'notes', label: 'Notes', icon: showIcons ? <ClockCounterClockwise size={iconSize} /> : undefined },
    { id: 'versions', label: 'Versions', icon: showIcons ? <Swap size={iconSize} /> : undefined },
    { id: 'markers', label: 'Markers', icon: showIcons ? <Tag size={iconSize} /> : undefined },
  ]

  const safeActive = tabs.find(t => t.id === active && !t.disabled) ? active : 'clips'

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 360 }}>
        <Tabs tabs={tabs} active={safeActive} onChange={setActive} size={size}>
          <div style={PANEL}>
            {tabs.find(t => t.id === safeActive)?.label} — use ← → Home End to navigate
          </div>
        </Tabs>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', paddingTop: 'var(--space-2)' }}>
          <Toggle checked={showIcons} onChange={setShowIcons} size="sm" label="icons" />
          <Toggle checked={hasDisabled} onChange={setHasDisabled} size="sm" label="disable Sends" />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as 'sm' | 'md')}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36px)</option>
              <option value="sm">sm (28px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function TabsDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
