// src/components/FeatureGrid/FeatureGrid.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { FeatureGrid } from './FeatureGrid'
import { FeatureCard } from './FeatureCard'
import type { FeatureItem } from './types'

export const meta: DemoMeta = {
  name: 'FeatureGrid',
  group: 'Composites',
  route: '/feature-grid',
  order: 90,
}

const NOOP = () => {}

// Real-ish marketing content, on-message with MARKETING.md.
const FEATURES: FeatureItem[] = [
  {
    id: 'write',
    glyph: 'waveform',
    title: 'Write, not wire',
    blurb: 'Hum it, play it, type it. Capture an idea before it gets away — nothing between you and the song.',
    link: { label: 'See writing', href: '#write' },
  },
  {
    id: 'versions',
    glyph: 'versions',
    title: 'Every take, kept',
    blurb: 'A jackdaw keeps every shiny thing. Branch a version, compare, and never lose the one that was magic.',
    link: { label: 'See versioning', href: '#versions' },
  },
  {
    id: 'share',
    glyph: 'share',
    title: 'Pass it along',
    blurb: 'Send a song to a collaborator with one link. They open it in Jackdaw and pick up where you left off.',
    link: { label: 'See sharing', href: '#share' },
  },
  {
    id: 'fx',
    glyph: 'fx',
    title: 'The robust bits',
    blurb: 'Plugins, folder groups, sidetrack — the producer tools that matter for writing, without the console bloat.',
    link: { label: 'See the kit', href: '#fx' },
  },
  {
    id: 'automation',
    glyph: 'automation',
    title: 'Moves that stick',
    blurb: 'Draw automation where you need it. Just enough motion to serve the song, never a spreadsheet of curves.',
  },
  {
    id: 'local',
    glyph: 'local',
    title: 'Yours, on your machine',
    blurb: 'No cloud, no accounts, nothing harvested. Your files stay where they are. Solo is free and stays free.',
    link: { label: 'Why local', href: '#local' },
  },
]

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — full responsive grid (3 cols)">
        <FeatureGrid features={FEATURES} onActivate={NOOP} />
      </State>

      <State label="hover (bloom) — hover any tile to light the glyph + edge">
        <FeatureGrid features={FEATURES.slice(0, 3)} onActivate={NOOP} />
      </State>

      <State label="focus-visible / link hover — Tab to a CTA, or hover the link row">
        <div style={{ maxWidth: 320 }}>
          <FeatureCard feature={FEATURES[0]} onActivate={NOOP} />
        </div>
      </State>

      <State label="no link — plain info tile">
        <div style={{ maxWidth: 320 }}>
          <FeatureCard feature={FEATURES[4]} />
        </div>
      </State>

      <State label="2 columns">
        <FeatureGrid features={FEATURES.slice(0, 4)} columns={2} onActivate={NOOP} />
      </State>

      <State label="4 columns">
        <FeatureGrid features={FEATURES} columns={4} onActivate={NOOP} />
      </State>

      <State label="sm size">
        <FeatureGrid features={FEATURES.slice(0, 3)} size="sm" onActivate={NOOP} />
      </State>

      <State label="single column (mobile)">
        <div style={{ maxWidth: 300 }}>
          <FeatureGrid features={FEATURES.slice(0, 3)} onActivate={NOOP} />
        </div>
      </State>

      <State label="empty">
        <FeatureGrid features={[]} />
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [small, setSmall] = useState(false)
  const [wide, setWide] = useState(false)
  const [withLinks, setWithLinks] = useState(true)

  const features = withLinks ? FEATURES : FEATURES.map(({ link: _link, ...rest }) => rest)

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
          <Toggle checked={small} onChange={setSmall} size="sm" label="sm size" />
          <Toggle checked={wide} onChange={setWide} size="sm" label="4 columns" />
          <Toggle checked={withLinks} onChange={setWithLinks} size="sm" label="show links" />
        </div>
        <FeatureGrid
          features={features}
          size={small ? 'sm' : 'md'}
          columns={wide ? 4 : 3}
          onActivate={NOOP}
        />
      </div>
    </Playground>
  )
}

export default function FeatureGridDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
