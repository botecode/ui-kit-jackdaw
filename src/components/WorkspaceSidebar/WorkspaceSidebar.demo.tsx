// src/components/WorkspaceSidebar/WorkspaceSidebar.demo.tsx
import { useState } from 'react'
import type { DemoMeta }        from '../../gallery/registry'
import { DemoShell }            from '../../gallery/ui/DemoShell'
import { StatesGrid, State }    from '../../gallery/ui/StatesGrid'
import { Playground }           from '../../gallery/ui/Playground'
import { Toggle }               from '../Toggle'
import { WorkspaceSidebar, HOME_ID } from './WorkspaceSidebar'
import type { WorkspaceSong, WorkspaceCollection } from './WorkspaceSidebar'

export const meta: DemoMeta = {
  name:  'WorkspaceSidebar',
  group: 'Composites',
  route: '/workspace-sidebar',
  order: 81,
}

// ── Fixture data ────────────────────────────────────────────────────────────────
// Colours are the songs' OWN data colours (CSS strings, like track colours) — not
// kit tokens. They reskin nothing; they're content, the way an avatar is content.

const SONGS: WorkspaceSong[] = [
  { id: 's1', title: 'Paper Boats',        colour: '#EE5E2A' },
  { id: 's2', title: 'Slow Tide',          colour: '#46A147' },
  { id: 's3', title: 'Northern Lights',    colour: '#3C7DD9' },
  { id: 's4', title: 'Quietly, Now',       colour: '#B5852E' },
  { id: 's5', title: 'Untitled sketch' },  // no colour → neutral ringed dot
  { id: 's6', title: 'Hymn for the Long Drive', colour: '#8E54C4' },
]

const COLLECTIONS: WorkspaceCollection[] = [
  { id: 'c1', title: 'B-sides' },
  { id: 'c2', title: 'Live takes' },
  { id: 'c3', title: 'Demos 2026' },
]

function SidebarWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 420, display: 'flex', alignItems: 'stretch' }}>
      {children}
    </div>
  )
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Default — Home active">
        <SidebarWrap>
          <WorkspaceSidebar
            active={HOME_ID}
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Selected — a song (accent spine)">
        <SidebarWrap>
          <WorkspaceSidebar
            active="s3"
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Active — a collection">
        <SidebarWrap>
          <WorkspaceSidebar
            active="c2"
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Hover / focus — interactive (hover a row, Tab in)">
        <SidebarWrap>
          <WorkspaceSidebar
            active="s1"
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Filtering — query echoes + filters">
        <SidebarWrap>
          <WorkspaceSidebar
            query="li"
            active="s3"
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Error / no match — query matches nothing">
        <SidebarWrap>
          <WorkspaceSidebar
            query="zzzzz"
            active={HOME_ID}
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Empty — no songs, no collections">
        <SidebarWrap>
          <WorkspaceSidebar
            active={HOME_ID}
            songs={[]}
            collections={[]}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Disabled search — no onSearch handler">
        <SidebarWrap>
          <WorkspaceSidebar
            active={HOME_ID}
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Loading — content not yet arrived">
        <SidebarWrap>
          <WorkspaceSidebar
            active={HOME_ID}
            songs={[]}
            collections={[]}
            onSelect={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>

      <State label="Collapsed — icon-only rail, song selected">
        <SidebarWrap>
          <WorkspaceSidebar
            collapsed
            active="s1"
            songs={SONGS}
            collections={COLLECTIONS}
            onSelect={() => {}}
            onSearch={() => {}}
            onNewSong={() => {}}
            onImportSong={() => {}}
          />
        </SidebarWrap>
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [active,    setActive]    = useState<string>('s1')
  const [query,     setQuery]     = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [last,      setLast]      = useState('—')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
        <SidebarWrap>
          <WorkspaceSidebar
            query={query}
            onSearch={setQuery}
            active={active}
            onSelect={setActive}
            songs={SONGS}
            collections={COLLECTIONS}
            onNewSong={() => setLast('New song')}
            onImportSong={() => setLast('Import song')}
            collapsed={collapsed}
          />
        </SidebarWrap>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
          <Toggle checked={collapsed} onChange={setCollapsed} size="sm" label="collapsed" />
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize:   'var(--text-sm)',
            color:      'var(--text-muted)',
            display:    'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}>
            <span>active: <span style={{ color: 'var(--text)' }}>{active}</span></span>
            <span>query: <span style={{ color: 'var(--text)' }}>{query || '∅'}</span></span>
            <span>last action: <span style={{ color: 'var(--text)' }}>{last}</span></span>
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ──────────────────────────────────────────────────────────────

export default function WorkspaceSidebarDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
