// src/components/BrandMark/BrandMark.demo.tsx
import type { ReactNode } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { BrandMark } from './BrandMark'

export const meta: DemoMeta = {
  name:  'Brand mark',
  group: 'Foundations',
  route: '/brand-mark',
  order: 1,
}

// ─── Tile helper ─────────────────────────────────────────────────────────────

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      {children}
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'var(--text-xs)',
        color:         'var(--text-dim)',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── Section: Mark (icon-only) ────────────────────────────────────────────────

function MarkSection() {
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        Mark — icon only
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Tile label="512px">
          <BrandMark variant="mark" size={512} />
        </Tile>
        <Tile label="128px">
          <BrandMark variant="mark" size={128} />
        </Tile>
        <Tile label="64px">
          <BrandMark variant="mark" size={64} />
        </Tile>
        <Tile label="32px">
          <BrandMark variant="mark" size={32} />
        </Tile>
        <Tile label="20px">
          <BrandMark variant="mark" size={20} />
        </Tile>
      </div>
    </section>
  )
}

// ─── Section: Wordmark (text-only, theme-aware) ───────────────────────────────

function WordmarkSection() {
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        Wordmark — text only (adapts to active theme)
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Tile label="128px">
          <BrandMark variant="wordmark" size={128} />
        </Tile>
        <Tile label="64px">
          <BrandMark variant="wordmark" size={64} />
        </Tile>
        <Tile label="32px">
          <BrandMark variant="wordmark" size={32} />
        </Tile>
      </div>
    </section>
  )
}

// ─── Section: Lockup (mark + wordmark stacked) ────────────────────────────────

function LockupSection() {
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        Lockup — mark + wordmark
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-10)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Tile label="256px">
          <BrandMark variant="lockup" size={256} />
        </Tile>
        <Tile label="128px">
          <BrandMark variant="lockup" size={128} />
        </Tile>
        <Tile label="64px">
          <BrandMark variant="lockup" size={64} />
        </Tile>
      </div>
    </section>
  )
}

// ─── Section: App icon sizes ──────────────────────────────────────────────────

function AppIconSection() {
  const SIZES = [512, 128, 64, 32, 16] as const
  return (
    <section>
      <h2 style={{
        fontFamily:    'var(--font-ui)',
        fontSize:      'var(--text-sm)',
        fontWeight:    'var(--weight-medium)',
        color:         'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom:  'var(--space-6)',
      }}>
        App icon sizes — mark variant
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {SIZES.map(s => (
          <Tile key={s} label={`${s}px`}>
            <BrandMark variant="mark" size={s} />
          </Tile>
        ))}
      </div>
    </section>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function BrandMarkDemo() {
  return (
    <DemoShell meta={meta}>
      <MarkSection />
      <WordmarkSection />
      <LockupSection />
      <AppIconSection />
    </DemoShell>
  )
}
