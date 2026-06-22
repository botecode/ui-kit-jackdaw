// src/components/MobileTopBar/MobileTopBar.demo.tsx
import { useState } from 'react'
import { CaretLeft, QrCode } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ProductFrame } from '../ProductFrame'
import { Toggle } from '../Toggle'
import { MobileTopBar } from './MobileTopBar'

export const meta: DemoMeta = {
  name: 'MobileTopBar',
  group: 'Composites',
  route: '/mobile-top-bar',
  order: 95,
}

const NOOP = () => {}

// A small back button for the optional left slot, built in the kit idiom (recessed
// rim + quiet ink) so it sits flush with the bar's own hardware language.
function BackButton() {
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={NOOP}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        padding: 0,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'color-mix(in srgb, var(--text) 4%, transparent)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      <CaretLeft weight="bold" size={18} />
    </button>
  )
}

// Faux app body so the bar reads as the top of a real screen, never a floating strip.
function AppBody() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-3)',
        background: 'var(--bg)',
      }}
    >
      {['Midnight Drive', 'Take 04 — vocal', 'Room tone', 'Bounce 2'].map((t, i) => (
        <div
          key={t}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            height: 44,
            padding: '0 var(--space-3)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--text) 5%, transparent)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-base)',
            color: 'var(--text)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 4,
              height: 22,
              borderRadius: 2,
              background: `var(--accent)`,
              opacity: 0.35 + i * 0.18,
            }}
          />
          {t}
        </div>
      ))}
    </div>
  )
}

// Renders a MobileTopBar atop a faux app body inside the phone bezel.
function PhoneScreen({
  brand,
  withBack,
  size = 'md',
  onSync = NOOP,
}: {
  brand?: string
  withBack?: boolean
  size?: 'sm' | 'md'
  onSync?: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <MobileTopBar
        brand={brand}
        size={size}
        left={withBack ? <BackButton /> : undefined}
        onSync={onSync}
      />
      <AppBody />
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — centered wordmark + QR/sync action">
        <div style={{ width: 320 }}>
          <MobileTopBar onSync={NOOP} />
        </div>
      </State>

      <State label="action pressed — the QR key sinks 1px (press it)">
        <div style={{ width: 320 }}>
          <MobileTopBar onSync={NOOP} />
          <span
            style={{
              display: 'block',
              marginTop: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
            }}
          >
            <QrCode size={11} style={{ verticalAlign: '-1px' }} /> tap & hold the action ↗
          </span>
        </div>
      </State>

      <State label="left slot — back button, wordmark stays centred">
        <div style={{ width: 320 }}>
          <MobileTopBar left={<BackButton />} onSync={NOOP} />
        </div>
      </State>

      <State label="sm — compact bar">
        <div style={{ width: 320 }}>
          <MobileTopBar size="sm" left={<BackButton />} onSync={NOOP} />
        </div>
      </State>

      <State label="custom brand — any wordmark, tail dims from the first dot">
        <div style={{ width: 320 }}>
          <MobileTopBar brand="Studio.fm" onSync={NOOP} />
        </div>
      </State>

      <State label="in the phone frame — top of a real screen">
        <ProductFrame variant="phone">
          <PhoneScreen withBack onSync={NOOP} />
        </ProductFrame>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [withBack, setWithBack] = useState(true)
  const [compact, setCompact] = useState(false)
  const [syncs, setSyncs] = useState(0)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ProductFrame variant="phone">
          <PhoneScreen
            withBack={withBack}
            size={compact ? 'sm' : 'md'}
            onSync={() => setSyncs((n) => n + 1)}
          />
        </ProductFrame>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 180 }}>
          {/* Dogfood: playground controls are kit Toggles. */}
          <Toggle checked={withBack} onChange={setWithBack} size="sm" label="left slot (back)" />
          <Toggle checked={compact} onChange={setCompact} size="sm" label="compact (sm)" />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              letterSpacing: '0.04em',
            }}
          >
            sync tapped: {syncs}
          </span>
        </div>
      </div>
    </Playground>
  )
}

export default function MobileTopBarDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
