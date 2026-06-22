// src/components/SpecStrip/SpecStrip.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { SegmentedControl } from '../SegmentedControl'
import { Toggle } from '../Toggle'
import { SpecStrip } from './SpecStrip'
import type { SpecItem } from './SpecStrip'

export const meta: DemoMeta = {
  name: 'SpecStrip',
  group: 'Composites',
  route: '/spec-strip',
  order: 56,
}

// The canonical marketing band — mixed stats + terse phrases.
const PITCH: SpecItem[] = [
  { value: '100%', label: 'native audio' },
  { value: 'peer-to-peer' },
  { value: 'no cloud' },
  { value: 'immutable', label: 'Takes' },
]

// All-stats — a product spec sheet.
const SPECS: SpecItem[] = [
  { value: '48kHz', label: 'sample rate' },
  { value: '<3ms', label: 'round-trip' },
  { value: '32-bit', label: 'float' },
  { value: '∞', label: 'undo history' },
]

// All-phrases — a values band.
const VALUES: SpecItem[] = [
  { value: 'no accounts' },
  { value: 'no upload' },
  { value: 'encrypted' },
  { value: 'yours forever' },
]

// Many items — proves the wrap reflow (etched grid stays aligned across rows).
const MANY: SpecItem[] = [
  { value: '100%', label: 'native audio' },
  { value: 'peer-to-peer' },
  { value: 'no cloud' },
  { value: 'immutable', label: 'Takes' },
  { value: 'no accounts' },
  { value: '48kHz', label: 'sample rate' },
  { value: 'encrypted' },
  { value: '∞', label: 'undo' },
]

const Band = ({ width = 560, children }: { width?: number; children: React.ReactNode }) => (
  <div style={{ width: '100%', maxWidth: width }}>{children}</div>
)

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default (mixed stats + phrases)">
        <Band><SpecStrip items={PITCH} /></Band>
      </State>
      <State label="stats only (spec sheet)">
        <Band><SpecStrip items={SPECS} /></Band>
      </State>
      <State label="phrases only (values band)">
        <Band><SpecStrip items={VALUES} /></Band>
      </State>
      <State label="sm">
        <Band width={460}><SpecStrip items={PITCH} size="sm" /></Band>
      </State>
      <State label="single item">
        <Band width={220}><SpecStrip items={[{ value: '100%', label: 'native audio' }]} /></Band>
      </State>
      <State label="responsive — wraps to rows (narrow)">
        <Band width={300}><SpecStrip items={MANY} /></Band>
      </State>
      <State label="many items (wide — etched grid)">
        <Band width={680}><SpecStrip items={MANY} /></Band>
      </State>
      <State label="empty">
        <Band width={300}><SpecStrip items={[]} /></Band>
      </State>
    </StatesGrid>
  )
}

const PRESETS = {
  pitch: PITCH,
  specs: SPECS,
  values: VALUES,
  many: MANY,
} as const

function PlaygroundDemo() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('pitch')
  const [size, setSize] = useState(false) // false = md, true = sm
  const [narrow, setNarrow] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: '100%', maxWidth: narrow ? 300 : 620 }}>
          <SpecStrip items={PRESETS[preset]} size={size ? 'sm' : 'md'} aria-label="Why Jackdaw" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 200 }}>
          <SegmentedControl
            aria-label="Content preset"
            size="sm"
            value={preset}
            onChange={(v) => setPreset(v as keyof typeof PRESETS)}
            options={[
              { value: 'pitch', label: 'Pitch' },
              { value: 'specs', label: 'Specs' },
              { value: 'values', label: 'Values' },
              { value: 'many', label: 'Many' },
            ]}
          />
          <Toggle checked={size} onChange={setSize} size="sm" label="small size" />
          <Toggle checked={narrow} onChange={setNarrow} size="sm" label="narrow viewport (wrap)" />
        </div>
      </div>
    </Playground>
  )
}

export default function SpecStripDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
