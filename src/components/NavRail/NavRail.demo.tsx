// src/components/NavRail/NavRail.demo.tsx
import { useState } from 'react'
import {
  PenNib, MusicNotes, Lightbulb, PuzzlePiece,
  ClockCounterClockwise, ChatText, GearSix,
} from '@phosphor-icons/react'
import type { DemoMeta }        from '../../gallery/registry'
import { DemoShell }            from '../../gallery/ui/DemoShell'
import { StatesGrid, State }    from '../../gallery/ui/StatesGrid'
import { Playground }           from '../../gallery/ui/Playground'
import { Toggle }               from '../Toggle'
import { NavRail }              from './NavRail'
import type { NavRailItem }     from './NavRail'

export const meta: DemoMeta = {
  name:  'NavRail',
  group: 'Composites',
  route: '/nav-rail',
  order: 80,
}

// ── Shared fixture data ────────────────────────────────────────────────────────

const PRIMARY_ITEMS: NavRailItem[] = [
  { id: 'write',    icon: PenNib,                 label: 'Write' },
  { id: 'arrange',  icon: MusicNotes,              label: 'Arrangement' },
  { id: 'ideas',    icon: Lightbulb,               label: 'Ideas' },
  { id: 'plugins',  icon: PuzzlePiece,             label: 'Plugins' },
  { id: 'versions', icon: ClockCounterClockwise,   label: 'Versions' },
  { id: 'comments', icon: ChatText,                label: 'Comments' },
]

const FOOTER_ITEMS: NavRailItem[] = [
  { id: 'settings', icon: GearSix, label: 'Settings' },
]

function RailWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 340, display: 'flex', alignItems: 'stretch' }}>
      {children}
    </div>
  )
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Default — no active">
        <RailWrap>
          <NavRail
            items={PRIMARY_ITEMS}
            footerItems={FOOTER_ITEMS}
            active=""
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Active — Write (first item)">
        <RailWrap>
          <NavRail
            items={PRIMARY_ITEMS}
            footerItems={FOOTER_ITEMS}
            active="write"
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Active — Arrangement">
        <RailWrap>
          <NavRail
            items={PRIMARY_ITEMS}
            footerItems={FOOTER_ITEMS}
            active="arrange"
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Badge — count (7)">
        <RailWrap>
          <NavRail
            items={[
              ...PRIMARY_ITEMS.slice(0, 5),
              { id: 'comments', icon: ChatText, label: 'Comments', badge: 7 },
            ]}
            footerItems={FOOTER_ITEMS}
            active="arrange"
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Badge — dot only (badge=0)">
        <RailWrap>
          <NavRail
            items={[
              ...PRIMARY_ITEMS.slice(0, 5),
              { id: 'comments', icon: ChatText, label: 'Comments', badge: 0 },
            ]}
            footerItems={FOOTER_ITEMS}
            active="arrange"
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Badge — overflow (99+)">
        <RailWrap>
          <NavRail
            items={[
              ...PRIMARY_ITEMS.slice(0, 5),
              { id: 'comments', icon: ChatText, label: 'Comments', badge: 150 },
            ]}
            footerItems={FOOTER_ITEMS}
            active="arrange"
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Active — Settings (footer)">
        <RailWrap>
          <NavRail
            items={PRIMARY_ITEMS}
            footerItems={FOOTER_ITEMS}
            active="settings"
            onSelect={() => {}}
          />
        </RailWrap>
      </State>

      <State label="Collapsed / narrow">
        <RailWrap>
          <NavRail
            items={PRIMARY_ITEMS}
            footerItems={FOOTER_ITEMS}
            active="ideas"
            onSelect={() => {}}
            collapsed
          />
        </RailWrap>
      </State>

      <State label="Empty items (loading)">
        <RailWrap>
          <NavRail
            items={[]}
            footerItems={FOOTER_ITEMS}
            active=""
            onSelect={() => {}}
          />
        </RailWrap>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [active,    setActive]    = useState('write')
  const [collapsed, setCollapsed] = useState(false)
  const [withBadge, setWithBadge] = useState(true)

  const items: NavRailItem[] = PRIMARY_ITEMS.map(item =>
    item.id === 'comments' && withBadge ? { ...item, badge: 3 } : item,
  )

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <div style={{ height: 380, display: 'flex', alignItems: 'stretch' }}>
          <NavRail
            items={items}
            footerItems={FOOTER_ITEMS}
            active={active}
            onSelect={setActive}
            collapsed={collapsed}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
          <Toggle
            checked={collapsed}
            onChange={v => setCollapsed(v)}
            size="sm"
            label="collapsed"
          />
          <Toggle
            checked={withBadge}
            onChange={v => setWithBadge(v)}
            size="sm"
            label="badge on Comments"
          />
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize:   'var(--text-sm)',
            color:      'var(--text-muted)',
            marginTop:  'var(--space-1)',
          }}>
            active: <span style={{ color: 'var(--text)' }}>{active}</span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ──────────────────────────────────────────────────────────────

export default function NavRailDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
