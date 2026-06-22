// src/components/MobileTabBar/MobileTabBar.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta }       from '../../gallery/registry'
import { DemoShell }           from '../../gallery/ui/DemoShell'
import { StatesGrid, State }   from '../../gallery/ui/StatesGrid'
import { Playground }          from '../../gallery/ui/Playground'
import { Toggle }              from '../Toggle'
import { ProductFrame }        from '../ProductFrame'
import { MobileTabBar, MOBILE_TABS } from './MobileTabBar'

export const meta: DemoMeta = {
  name:  'MobileTabBar',
  group: 'Composites',
  route: '/mobile-tab-bar',
  order: 85,
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

const noop = () => {}

/** Renders the bar and forces the active tab into its pressed visual (static demo of
    the hardware press depth, which is otherwise a live :active pseudo-state). */
function PressedBar({ active }: { active: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const btn = ref.current?.querySelector<HTMLButtonElement>('button[data-active]')
    btn?.setAttribute('data-pressed', '')
  }, [active])
  return (
    <div ref={ref}>
      <MobileTabBar tabs={MOBILE_TABS} active={active} onSelect={noop} />
    </div>
  )
}

/** A faux phone screen: a quiet placeholder body with the tab bar pinned to the chin. */
function PhoneScreen({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--arrange-bg)',
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)',
        color: 'var(--text-dim)', textTransform: 'capitalize', letterSpacing: '0.02em',
      }}>
        {active}
      </div>
      <MobileTabBar tabs={MOBILE_TABS} active={active} onSelect={onSelect} />
    </div>
  )
}

// ── States ───────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {MOBILE_TABS.map(tab => (
        <State key={tab.id} label={`Active — ${tab.label}`}>
          <MobileTabBar tabs={MOBILE_TABS} active={tab.id} onSelect={noop} />
        </State>
      ))}

      <State label="Pressed — Record (sunk in)">
        <PressedBar active="record" />
      </State>

      <State label="Pressed — Nest (sunk in)">
        <PressedBar active="nest" />
      </State>

      <State label="Small">
        <MobileTabBar tabs={MOBILE_TABS} active="write" onSelect={noop} size="sm" />
      </State>

      <State label="Disabled — Radio offline">
        <MobileTabBar
          tabs={MOBILE_TABS.map(t => t.id === 'radio' ? { ...t, disabled: true } : t)}
          active="record"
          onSelect={noop}
        />
      </State>

      <State label="No selection (indicator hidden)">
        <MobileTabBar tabs={MOBILE_TABS} active="" onSelect={noop} />
      </State>

      <State label="Empty (no tabs)">
        <MobileTabBar tabs={[]} active="" onSelect={noop} />
      </State>
    </StatesGrid>
  )
}

// ── Phone-frame preview ──────────────────────────────────────────────────────────

function PhonePreview() {
  const [active, setActive] = useState('record')
  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-bold)', color: 'var(--text)',
        margin: '0 0 var(--space-4)',
      }}>
        In the handset
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ProductFrame
          variant="phone"
          caption="Tap a tab — the lavender pill slides to it."
        >
          <PhoneScreen active={active} onSelect={setActive} />
        </ProductFrame>
      </div>
    </section>
  )
}

// ── Playground (dogfooded controls) ──────────────────────────────────────────────

function PlaygroundDemo() {
  const [active, setActive]   = useState('record')
  const [small,  setSmall]    = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 420 }}>
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <MobileTabBar
            tabs={MOBILE_TABS}
            active={active}
            onSelect={setActive}
            size={small ? 'sm' : 'md'}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Toggle checked={small} onChange={setSmall} size="sm" label="small" />
          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
          }}>
            active: <span style={{ color: 'var(--text)' }}>{active}</span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────────

export default function MobileTabBarDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PhonePreview />
      <PlaygroundDemo />
    </DemoShell>
  )
}
