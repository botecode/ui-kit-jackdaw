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

// ─── Shared tile helper ───────────────────────────────────────────────────

function Tile({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
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

// ─── Section A: Interpretations ───────────────────────────────────────────

function InterpretationsSection() {
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
        Interpretations
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {/* A: Full mark — light only (wordmark needs readable bg) */}
        <Tile label="A — Full mark (400px)">
          <BrandMark variant="full" size={400} />
        </Tile>

        {/* B: Icon — light + dark side by side */}
        <Tile label="B — Icon / light (256px)">
          <BrandMark variant="icon" size={256} />
        </Tile>
        <Tile label="B — Icon / dark (256px)">
          <BrandMark variant="icon" size={256} stage />
        </Tile>

        {/* C: Sigil — light + dark side by side */}
        <Tile label="C — Sigil / light (128px)">
          <BrandMark variant="sigil" size={128} />
        </Tile>
        <Tile label="C — Sigil / dark (128px)">
          <BrandMark variant="sigil" size={128} stage />
        </Tile>
      </div>
    </section>
  )
}

// ─── Section B: App icon sizes (Interpretation B) ────────────────────────

function AppIconSizesSection() {
  const SIZES = [512, 128, 64] as const
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
        App icon sizes — Interpretation B
      </h2>
      {/* Light row */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        {SIZES.map(s => (
          <Tile key={s} label={`${s}px / light`}>
            <BrandMark variant="icon" size={s} />
          </Tile>
        ))}
      </div>
      {/* Dark row */}
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {SIZES.map(s => (
          <Tile key={s} label={`${s}px / dark`}>
            <BrandMark variant="icon" size={s} stage />
          </Tile>
        ))}
      </div>
    </section>
  )
}

// ─── Section C: Favicon (16px — B vs C side by side) ─────────────────────

function FaviconSection() {
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
        Favicon — 16px ownership
      </h2>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end' }}>
        <Tile label="B icon — 16px (illegible)">
          <BrandMark variant="icon" size={16} />
        </Tile>
        <Tile label="C sigil — 16px (reads)">
          <BrandMark variant="sigil" size={16} />
        </Tile>
        <Tile label="C sigil — 16px / dark (reads)">
          <BrandMark variant="sigil" size={16} stage />
        </Tile>
      </div>
    </section>
  )
}

// ─── Default export ───────────────────────────────────────────────────────

export default function BrandMarkDemo() {
  return (
    <DemoShell meta={meta}>
      <InterpretationsSection />
      <AppIconSizesSection />
      <FaviconSection />
    </DemoShell>
  )
}
