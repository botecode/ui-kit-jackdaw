// src/components/WorkspaceSwitcher/WorkspaceSwitcher.demo.tsx
import { useState } from 'react'
import type { DemoMeta }     from '../../gallery/registry'
import { DemoShell }         from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }        from '../../gallery/ui/Playground'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import type { WorkspaceSummary } from './WorkspaceSwitcher'

export const meta: DemoMeta = {
  name:  'WorkspaceSwitcher',
  group: 'Composites',
  route: '/workspace-switcher',
  order: 84,
}

const noop = () => {}

// Workspaces carry their OWN data colours (CSS strings, like track colours) — not
// kit tokens; they reskin nothing, the way an Avatar's colour is content.
const WORKSPACES: WorkspaceSummary[] = [
  { id: 'w1', name: 'Debut EP',   type: 'Band', colour: '#EE5E2A' },
  { id: 'w2', name: 'B-sides',    type: 'Solo', colour: '#46A147' },
  { id: 'w3', name: 'Live takes', type: 'Duo',  colour: '#3C7DD9' },
  { id: 'w4', name: 'Field recordings' },
]

// The switcher sits at the top of a sidebar, so frame it in a narrow rail so the
// resting plate reads at its real width.
function RailWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 240,
      padding: 'var(--space-2)',
      background: 'var(--rail-bg)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Default — resting identity plate (Band active)">
        <RailWrap>
          <WorkspaceSwitcher workspaces={WORKSPACES} activeId="w1" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="Selected — a different active workspace (Solo)">
        <RailWrap>
          <WorkspaceSwitcher workspaces={WORKSPACES} activeId="w2" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="Hover / focus — Tab in, the plate warms to the accent">
        <RailWrap>
          <WorkspaceSwitcher workspaces={WORKSPACES} activeId="w3" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="Active / open — click to drop the switch menu (active row spined)">
        <RailWrap>
          <WorkspaceSwitcher workspaces={WORKSPACES} activeId="w1" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="sm — a denser plate for a narrow rail">
        <RailWrap>
          <WorkspaceSwitcher size="sm" workspaces={WORKSPACES} activeId="w1" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="Long names — identity + rows truncate cleanly">
        <RailWrap>
          <WorkspaceSwitcher
            workspaces={[{ id: 'x', name: 'The Long Drive Home — Sessions', type: 'Band', colour: '#8E54C4' }, ...WORKSPACES]}
            activeId="x" userName="Fernando Novais Feitosa"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="Empty — a single workspace, unknown active (menu offers the way in)">
        <RailWrap>
          <WorkspaceSwitcher workspaces={[]} activeId="" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>

      <State label="Disabled — n/a (menu control emits intents; the host disables at the rail)">
        <RailWrap>
          <WorkspaceSwitcher workspaces={WORKSPACES} activeId="w4" userName="Fernando"
            onSwitch={noop} onNewWorkspace={noop} onOpenSettings={noop} />
        </RailWrap>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [activeId, setActiveId] = useState('w1')
  const [last, setLast] = useState('—')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
        <RailWrap>
          <WorkspaceSwitcher
            workspaces={WORKSPACES}
            activeId={activeId}
            userName="Fernando"
            onSwitch={id => { setActiveId(id); setLast(`switch → ${id}`) }}
            onNewWorkspace={() => setLast('new workspace')}
            onOpenSettings={() => setLast('open settings')}
          />
        </RailWrap>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
          paddingTop: 'var(--space-2)',
        }}>
          <span>active: <span style={{ color: 'var(--text)' }}>{activeId}</span></span>
          <span>last: <span style={{ color: 'var(--text)' }}>{last}</span></span>
        </div>
      </div>
    </Playground>
  )
}

export default function WorkspaceSwitcherDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
