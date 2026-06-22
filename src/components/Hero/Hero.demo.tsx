// src/components/Hero/Hero.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { SegmentedControl } from '../SegmentedControl'
import { BrandMark } from '../BrandMark'
import { Hero } from './Hero'

export const meta: DemoMeta = {
  name: 'Hero',
  group: 'Composites',
  route: '/hero',
  order: 90,
}

const NOOP = () => {}

// A stand-in for a real ProductFrame / app screenshot — a recessed "device" with
// the brand mark and a faux track lane, so the visual slot reads as a product
// mockup inside the Hero's stage well. (Demo-only; the real site passes a
// ProductFrame or an image.)
function DemoVisual() {
  const frame: React.CSSProperties = {
    width: '100%',
    maxWidth: 360,
    borderRadius: 'var(--radius)',
    background: 'var(--surface)',
    boxShadow:
      'inset 0 1px 0 color-mix(in srgb, white 30%, transparent), 0 0 0 1px var(--border-strong), 0 12px 28px -16px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  }
  const bar: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--surface-2)',
    borderBottom: '1px solid var(--border)',
  }
  const dot: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--text-dim)',
    opacity: 0.6,
  }
  const body: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    padding: 'var(--space-5) var(--space-4) var(--space-6)',
  }
  const lane: React.CSSProperties = {
    height: 12,
    borderRadius: 3,
    background: 'var(--stage)',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
    padding: 2,
  }
  const fill = (color: string, width: string): React.CSSProperties => ({
    display: 'block',
    height: '100%',
    width,
    borderRadius: 2,
    background: color,
  })

  return (
    <div style={frame} aria-hidden="true">
      <div style={bar}>
        <span style={dot} />
        <span style={dot} />
        <span style={dot} />
      </div>
      <div style={body}>
        <BrandMark variant="lockup" size={28} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={lane}>
            <span style={fill('var(--track-color-1)', '60%')} />
          </span>
          <span style={lane}>
            <span style={fill('var(--track-color-2)', '80%')} />
          </span>
          <span style={lane}>
            <span style={fill('var(--track-color-3)', '45%')} />
          </span>
        </div>
      </div>
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — centered (no entrance, for static review)">
        <Hero
          animate={false}
          eyebrow="Jackdaw 2.0"
          headline="Record like you mean it."
          subhead="A warm, tactile DAW that feels like an instrument — not a spreadsheet for sound."
          primaryCta={{ label: 'Get Jackdaw', onClick: NOOP }}
          secondaryCta={{ label: 'Watch the demo', onClick: NOOP }}
        />
      </State>

      <State label="selected — split (copy left / visual right)">
        <Hero
          animate={false}
          layout="split"
          eyebrow="Now in beta"
          headline="Your studio, distilled."
          subhead="Faders, meters, and takes — handmade and themeable down to the LED."
          primaryCta={{ label: 'Start free', onClick: NOOP }}
          secondaryCta={{ label: 'See features', onClick: NOOP }}
          visual={<DemoVisual />}
        />
      </State>

      <State label="hover — primary CTA (hover the orange control)">
        <Hero
          animate={false}
          headline="Press to feel it."
          subhead="Hover the primary control: it lifts and the LED bloom intensifies."
          primaryCta={{ label: 'Get Jackdaw', onClick: NOOP }}
          secondaryCta={{ label: 'Watch the demo', onClick: NOOP }}
        />
      </State>

      <State label="focus — tab to a CTA for the focus ring">
        <Hero
          animate={false}
          headline="Keyboard-first."
          subhead="Tab to either control to see the :focus-visible ring."
          primaryCta={{ label: 'Get Jackdaw', onClick: NOOP }}
          secondaryCta={{ label: 'Watch the demo', onClick: NOOP }}
        />
      </State>

      <State label="active — press a CTA (it settles in, no bounce)">
        <Hero
          animate={false}
          headline="Tactile, not springy."
          primaryCta={{ label: 'Get Jackdaw', onClick: NOOP }}
          secondaryCta={{ label: 'Watch the demo', onClick: NOOP }}
        />
      </State>

      <State label="disabled — primary CTA inert (e.g. signups paused)">
        <Hero
          animate={false}
          eyebrow="Sold out"
          headline="The beta is full."
          subhead="Signups are paused while we onboard the first cohort."
          primaryCta={{ label: 'Signups paused', onClick: NOOP, disabled: true }}
          secondaryCta={{ label: 'Join the waitlist', onClick: NOOP }}
        />
      </State>

      <State label="loading — primary CTA busy (async submit in flight)">
        <Hero
          animate={false}
          headline="One moment…"
          subhead="The primary control shows a spinner and goes aria-busy."
          primaryCta={{ label: 'Creating your account', onClick: NOOP, loading: true }}
          secondaryCta={{ label: 'Cancel', onClick: NOOP }}
        />
      </State>

      <State label="error — primary disabled, sub carries the reason">
        <Hero
          animate={false}
          eyebrow="Heads up"
          headline="Downloads are temporarily offline."
          subhead="We're mid-deploy — the installer will be back in a few minutes."
          primaryCta={{ label: 'Download unavailable', onClick: NOOP, disabled: true }}
          secondaryCta={{ label: 'Status page', onClick: NOOP, href: '#status' }}
        />
      </State>

      <State label="empty — headline only (graceful minimum)">
        <Hero animate={false} headline="Record like you mean it." />
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [layout, setLayout] = useState<'centered' | 'split'>('split')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [showEyebrow, setShowEyebrow] = useState(true)
  const [showSub, setShowSub] = useState(true)
  const [showSecondary, setShowSecondary] = useState(true)
  const [animate, setAnimate] = useState(true)
  const [loading, setLoading] = useState(false)
  const [disabled, setDisabled] = useState(false)
  // Re-mount on toggle so the entrance animation replays.
  const [seed, setSeed] = useState(0)

  const col: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        <Hero
          key={seed}
          layout={layout}
          size={size}
          animate={animate}
          eyebrow={showEyebrow ? 'Jackdaw 2.0' : undefined}
          headline="Record like you mean it."
          subhead={
            showSub
              ? 'A warm, tactile DAW that feels like an instrument — not a spreadsheet for sound.'
              : undefined
          }
          primaryCta={{ label: 'Get Jackdaw', onClick: NOOP, loading, disabled }}
          secondaryCta={showSecondary ? { label: 'Watch the demo', onClick: NOOP } : undefined}
          visual={layout === 'split' ? <DemoVisual /> : undefined}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <SegmentedControl
            aria-label="Layout"
            size="sm"
            value={layout}
            onChange={(v) => setLayout(v as 'centered' | 'split')}
            options={[
              { value: 'centered', label: 'Centered' },
              { value: 'split', label: 'Split' },
            ]}
          />
          <SegmentedControl
            aria-label="Size"
            size="sm"
            value={size}
            onChange={(v) => setSize(v as 'sm' | 'md')}
            options={[
              { value: 'sm', label: 'sm' },
              { value: 'md', label: 'md' },
            ]}
          />
          <div style={col}>
            <Checkbox checked={showEyebrow} onChange={setShowEyebrow} label="Eyebrow" />
            <Checkbox checked={showSub} onChange={setShowSub} label="Subhead" />
            <Checkbox checked={showSecondary} onChange={setShowSecondary} label="Secondary CTA" />
          </div>
          <div style={col}>
            <Toggle
              checked={animate}
              onChange={(v) => { setAnimate(v); setSeed((s) => s + 1) }}
              size="sm"
              label="entrance motion"
            />
            <Toggle checked={loading} onChange={setLoading} size="sm" label="primary loading" />
            <Toggle checked={disabled} onChange={setDisabled} size="sm" label="primary disabled" />
          </div>
        </div>
      </div>
    </Playground>
  )
}

export default function HeroDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
