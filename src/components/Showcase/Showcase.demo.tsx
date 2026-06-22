// src/components/Showcase/Showcase.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Showcase } from './Showcase'
import type { ShowcaseSection } from './Showcase'

export const meta: DemoMeta = {
  name: 'Showcase',
  group: 'Composites',
  route: '/showcase',
  order: 90,
}

// ── ProductFrame mockup ───────────────────────────────────────────────────────
// The card says "slot a ProductFrame/image". ProductFrame isn't a kit component
// yet, so the media is a ReactNode slot and the demo supplies a token-built
// mock-up of a Jackdaw window — recessed stage, track spines, waveform lanes —
// so the showcase reads as a real product shot in every theme.

function ProductFrame({ accent = 'var(--track-color-1)' }: { accent?: string }) {
  const spines = [
    'var(--track-color-1)',
    'var(--track-color-2)',
    'var(--track-color-3)',
    'var(--track-color-4)',
  ]
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      {/* titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--rail-bg)',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--led-red)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--led-yellow)' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--led-green)' }} />
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'var(--text-dim)',
          }}
        >
          120.0 BPM
        </span>
      </div>
      {/* track lanes */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 8, gap: 6, minHeight: 0 }}>
        {spines.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 8, flex: 1, minHeight: 0 }}>
            <span style={{ width: 3, borderRadius: 2, background: c }} />
            <div
              style={{
                flex: 1,
                borderRadius: 'calc(var(--radius) * 0.6)',
                background: 'var(--stage)',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* faux waveform clip */}
              <div
                style={{
                  position: 'absolute',
                  inset: '20% 8% 20% 8%',
                  borderRadius: 4,
                  background: `color-mix(in srgb, ${i === 0 ? accent : c} 26%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${i === 0 ? accent : c} 55%, transparent)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SECTIONS: ShowcaseSection[] = [
  {
    id: 'capture',
    eyebrow: '01 / CAPTURE',
    title: 'Never waste one idea.',
    body: 'Jackdaw is already rolling before you finish the thought. Hit record the moment inspiration strikes — worry about the mix later.',
    media: <ProductFrame accent="var(--track-color-1)" />,
    cta: { label: 'See it capture', href: '#capture' },
  },
  {
    id: 'shape',
    eyebrow: '02 / SHAPE',
    title: 'Shape the sound up close.',
    body: 'The focused-track detail panel brings the meter, routing, phase and full FX chain right up to your hands — so the arrangement stays calm and lean.',
    media: <ProductFrame accent="var(--track-color-3)" />,
    cta: { label: 'Tour the panel', href: '#shape' },
  },
  {
    id: 'share',
    eyebrow: '03 / SEND',
    title: 'Send it anywhere, transparently.',
    body: 'A link, a password, done. Transparent receive imports first and asks questions later — your collaborator is listening in seconds.',
    media: <ProductFrame accent="var(--track-color-2)" />,
    cta: { label: 'How sharing works', href: '#send' },
  },
]

// ── State cards ───────────────────────────────────────────────────────────────

function fullWidth(node: React.ReactNode) {
  return <div style={{ width: '100%', minWidth: 'min(680px, 90vw)' }}>{node}</div>
}

function OneSection() {
  return (
    <State label="Default — media left, eyebrow + CTA">
      {fullWidth(<Showcase sections={[SECTIONS[0]!]} reveal={false} aria-label="Default section" />)}
    </State>
  )
}

function MediaRight() {
  return (
    <State label="Media right (alternated)">
      {fullWidth(
        <Showcase sections={[{ ...SECTIONS[1]!, side: 'right' }]} reveal={false} aria-label="Media right" />,
      )}
    </State>
  )
}

function NoEyebrowNoCta() {
  return (
    <State label="No eyebrow, no CTA">
      {fullWidth(
        <Showcase
          sections={[
            {
              id: 'plain',
              title: 'Just the words and the work.',
              body: 'Eyebrow and CTA are optional — a section can be heading + body + visual alone.',
              media: <ProductFrame accent="var(--track-color-5)" />,
            },
          ]}
          reveal={false}
          aria-label="Plain section"
        />,
      )}
    </State>
  )
}

function CtaButton() {
  const [clicks, setClicks] = useState(0)
  return (
    <State label="CTA hover / focus / click (button variant)">
      {fullWidth(
        <Showcase
          sections={[
            {
              id: 'btn',
              eyebrow: 'ACTION',
              title: 'A CTA that fires an intent.',
              body: 'When the CTA has no href it renders a button. Hover for the bloom + arrow nudge, Tab for the focus ring.',
              media: <ProductFrame accent="var(--track-color-4)" />,
              cta: { label: 'Fire onClick', onClick: () => setClicks(c => c + 1) },
            },
          ]}
          reveal={false}
          aria-label="Button CTA"
        />,
      )}
      <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
        {`onClick × ${clicks}`}
      </p>
    </State>
  )
}

// Render the section then force its data-revealed to false so the hidden
// (pre-scroll) visual — faded + offset — is inspectable without scrolling.
function Hidden() {
  return (
    <State label="Reveal — hidden (pre-scroll)">
      {fullWidth(
        <div
          ref={el => {
            el?.querySelector('article')?.setAttribute('data-revealed', 'false')
          }}
        >
          <Showcase sections={[SECTIONS[2]!]} reveal={false} aria-label="Hidden preview" />
        </div>,
      )}
    </State>
  )
}

function SmSize() {
  return (
    <State label="sm size">
      {fullWidth(<Showcase sections={[SECTIONS[0]!]} size="sm" reveal={false} aria-label="Small" />)}
    </State>
  )
}

function Empty() {
  return (
    <State label="Empty (no sections)">
      <div style={{ width: 220, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
        <Showcase sections={[]} reveal={false} aria-label="Empty showcase" />
        (renders nothing)
      </div>
    </State>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <OneSection />
      <MediaRight />
      <NoEyebrowNoCta />
      <CtaButton />
      <Hidden />
      <SmSize />
      <Empty />
    </StatesGrid>
  )
}

// ── Playground — the full scroll story ────────────────────────────────────────

function PlaygroundDemo() {
  const [reveal, setReveal] = useState(true)
  const [small, setSmall] = useState(false)
  // Remount on toggle so reveal re-arms / size re-applies cleanly.
  const key = `${reveal}-${small}`

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <Toggle checked={reveal} onChange={setReveal} size="sm" label="reveal on scroll" />
          <Toggle checked={small} onChange={setSmall} size="sm" label="sm size" />
        </div>
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Scroll the page to watch sections reveal. Reveal is decorative — it snaps off under
          prefers-reduced-motion and content is always present.
        </p>
        <Showcase key={key} sections={SECTIONS} reveal={reveal} size={small ? 'sm' : 'md'} aria-label="Jackdaw feature tour" />
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function ShowcaseDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
