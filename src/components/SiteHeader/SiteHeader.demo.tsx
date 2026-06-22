// src/components/SiteHeader/SiteHeader.demo.tsx
import { useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SiteHeader } from './SiteHeader'
import type { SiteNavLink } from './SiteHeader'

export const meta: DemoMeta = {
  name: 'SiteHeader',
  group: 'Composites',
  route: '/site-header',
  order: 90,
}

const LINKS: SiteNavLink[] = [
  { label: 'Features', href: '/features' },
  { label: 'Sounds', href: '/sounds' },
  { label: 'Pricing', href: '/pricing', current: true },
  { label: 'Blog', href: '/blog' },
]
const CTA = { label: 'Get Jackdaw', href: '/download' }
const NOOP = () => {}

// A little browser pane so the transparent↔solid transition reads against a hero.
function SiteFrame({
  height = 200,
  framed = true,
  children,
}: {
  height?: number
  framed?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'min(680px, 78vw)',
        height,
        // transform establishes a containing block so the drawer's fixed scrim
        // is captured inside this pane (a tidy stand-in for the viewport).
        transform: framed ? 'translateZ(0)' : undefined,
        overflow: 'hidden',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      {children}
    </div>
  )
}

// A warm hero band the header floats over while transparent.
function Hero({ tall = false }: { tall?: boolean }) {
  return (
    <div
      style={{
        height: tall ? 520 : 150,
        padding: 'var(--space-8) var(--space-6)',
        background:
          'radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%), var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--text)',
          lineHeight: 'var(--leading-display)',
        }}
      >
        Make the record in your head.
      </div>
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-muted)',
          maxWidth: 420,
        }}
      >
        A boutique DAW that feels like an instrument, not a spreadsheet.
      </div>
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="top — transparent over the hero">
        <SiteFrame>
          <SiteHeader links={LINKS} cta={CTA} scrolled={false} onNavigate={NOOP} />
          <Hero />
        </SiteFrame>
      </State>

      <State label="scrolled — solid surface + hairline">
        <SiteFrame>
          <SiteHeader links={LINKS} cta={CTA} scrolled onNavigate={NOOP} />
          <Hero />
        </SiteFrame>
      </State>

      <State label="active link — current page lit">
        <SiteFrame height={120}>
          <SiteHeader links={LINKS} cta={CTA} scrolled onNavigate={NOOP} />
        </SiteFrame>
      </State>

      <State label="no CTA">
        <SiteFrame height={120}>
          <SiteHeader links={LINKS} scrolled onNavigate={NOOP} />
        </SiteFrame>
      </State>

      <State label="sm — compact bar">
        <SiteFrame height={120}>
          <SiteHeader links={LINKS} cta={CTA} size="sm" scrolled onNavigate={NOOP} />
        </SiteFrame>
      </State>

      <State label="mobile — collapsed to hamburger">
        <SiteFrame height={120}>
          <div style={{ width: 360 }}>
            <SiteHeader links={LINKS} cta={CTA} scrolled onNavigate={NOOP} />
          </div>
        </SiteFrame>
      </State>

      <State label="mobile-open — tap ☰, drawer slides in (Esc / focus-trapped)">
        <SiteFrame height={420}>
          <div style={{ width: 360 }}>
            <SiteHeader links={LINKS} cta={CTA} scrolled onNavigate={NOOP} onCtaClick={NOOP} />
          </div>
        </SiteFrame>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showCta, setShowCta] = useState(true)
  const [compact, setCompact] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live scroll scene: scroll the pane to watch the bar settle into solid. */}
        <div
          ref={scrollRef}
          style={{
            position: 'relative',
            width: 'min(680px, 78vw)',
            height: 320,
            overflow: 'auto',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            transform: 'translateZ(0)',
          }}
        >
          <SiteHeader
            links={LINKS}
            cta={showCta ? CTA : undefined}
            size={compact ? 'sm' : 'md'}
            scrollContainerRef={scrollRef}
            onNavigate={NOOP}
            onCtaClick={NOOP}
          />
          <Hero tall />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 180 }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              letterSpacing: '0.05em',
            }}
          >
            Scroll the pane ↑↓ to watch it settle.
          </span>
          <Toggle checked={showCta} onChange={setShowCta} size="sm" label="show CTA" />
          <Toggle checked={compact} onChange={setCompact} size="sm" label="compact (sm)" />
        </div>
      </div>
    </Playground>
  )
}

export default function SiteHeaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
