// src/components/SiteFooter/SiteFooter.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SiteFooter } from './SiteFooter'
import type { SiteFooterColumn, SiteSocialLink } from './SiteFooter'

export const meta: DemoMeta = {
  name: 'SiteFooter',
  group: 'Composites',
  route: '/site-footer',
  order: 92,
}

const COLUMNS: SiteFooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Sounds', href: '/sounds' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Download', href: '/download' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Licenses', href: '/licenses' },
    ],
  },
]

const SOCIAL: SiteSocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/jackdaw', icon: 'github' },
  { label: 'X', href: 'https://x.com/jackdaw', icon: 'x' },
  { label: 'YouTube', href: 'https://youtube.com/@jackdaw', icon: 'youtube' },
  { label: 'Discord', href: 'https://discord.gg/jackdaw', icon: 'discord' },
]

const TAGLINE = 'A boutique DAW that feels like an instrument, not a spreadsheet.'
const NOOP = () => {}

// A page pane so the footer's hairline reads against content sitting above it.
function PageFrame({
  width = 'min(820px, 88vw)',
  children,
}: {
  width?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        width,
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* A scrap of page content so the seam at the top of the footer has a job. */}
      <div
        style={{
          height: 56,
          background:
            'radial-gradient(120% 180% at 12% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%), var(--bg)',
        }}
      />
      {children}
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — full footer (brand · tagline · columns · social · copyright)">
        <PageFrame>
          <SiteFooter
            tagline={TAGLINE}
            columns={COLUMNS}
            social={SOCIAL}
            onNavigate={NOOP}
          />
        </PageFrame>
      </State>

      <State label="with theme switch + newsletter slot">
        <PageFrame>
          <SiteFooter
            tagline={TAGLINE}
            columns={COLUMNS}
            social={SOCIAL}
            themeMode="light"
            onThemeModeChange={NOOP}
            newsletter={{
              heading: 'Studio notes',
              blurb: 'New sounds and release notes, roughly monthly.',
              cta: 'Subscribe',
            }}
            onSubscribe={NOOP}
            onNavigate={NOOP}
          />
        </PageFrame>
      </State>

      <State label="theme switch — dark mode (relabels to ‘switch to light’)">
        <PageFrame>
          <SiteFooter
            tagline={TAGLINE}
            columns={COLUMNS}
            social={SOCIAL}
            themeMode="dark"
            onThemeModeChange={NOOP}
            onNavigate={NOOP}
          />
        </PageFrame>
      </State>

      <State label="minimal — columns + copyright only (no tagline / social)">
        <PageFrame>
          <SiteFooter columns={COLUMNS} onNavigate={NOOP} />
        </PageFrame>
      </State>

      <State label="defaults — bare drop-in (Product / Company / Legal placeholders)">
        <PageFrame>
          <SiteFooter social={SOCIAL} onNavigate={NOOP} />
        </PageFrame>
      </State>

      <State label="sm — compact footer">
        <PageFrame>
          <SiteFooter
            size="sm"
            tagline={TAGLINE}
            columns={COLUMNS}
            social={SOCIAL}
            themeMode="light"
            onThemeModeChange={NOOP}
            onNavigate={NOOP}
          />
        </PageFrame>
      </State>

      <State label="mobile — columns stack, base bar wraps">
        <PageFrame width="380px">
          <SiteFooter
            tagline={TAGLINE}
            columns={COLUMNS}
            social={SOCIAL}
            themeMode="light"
            onThemeModeChange={NOOP}
            newsletter={{ heading: 'Studio notes', cta: 'Join' }}
            onSubscribe={NOOP}
            onNavigate={NOOP}
          />
        </PageFrame>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [showTagline, setShowTagline] = useState(true)
  const [showSocial, setShowSocial] = useState(true)
  const [showNewsletter, setShowNewsletter] = useState(true)
  const [compact, setCompact] = useState(false)
  // Live light/dark switch driven by the footer's own control.
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <PageFrame>
          <SiteFooter
            size={compact ? 'sm' : 'md'}
            tagline={showTagline ? TAGLINE : undefined}
            columns={COLUMNS}
            social={showSocial ? SOCIAL : undefined}
            themeMode={mode}
            onThemeModeChange={setMode}
            newsletter={showNewsletter ? { heading: 'Studio notes', cta: 'Subscribe' } : undefined}
            onSubscribe={NOOP}
            onNavigate={NOOP}
          />
        </PageFrame>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 200 }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              letterSpacing: '0.05em',
            }}
          >
            Theme switch reads: <strong>{mode}</strong> (click it in the footer).
          </span>
          <Toggle checked={showTagline} onChange={setShowTagline} size="sm" label="tagline" />
          <Toggle checked={showSocial} onChange={setShowSocial} size="sm" label="social icons" />
          <Toggle checked={showNewsletter} onChange={setShowNewsletter} size="sm" label="newsletter slot" />
          <Toggle checked={compact} onChange={setCompact} size="sm" label="compact (sm)" />
        </div>
      </div>
    </Playground>
  )
}

export default function SiteFooterDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
