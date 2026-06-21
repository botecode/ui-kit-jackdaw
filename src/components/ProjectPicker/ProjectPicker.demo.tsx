// src/components/ProjectPicker/ProjectPicker.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ProjectPicker } from './ProjectPicker'
import type { ProjectRecord } from './ProjectPicker'

export const meta: DemoMeta = {
  name: 'ProjectPicker',
  group: 'Composites',
  route: '/project-picker',
  order: 25,
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MANY_PROJECTS: ProjectRecord[] = [
  { id: 'p1', name: 'Song Nice',      path: '~/Music/song-nice',      lastOpened: '2026-06-20T10:00:00Z' },
  { id: 'p2', name: 'Demo Track',     path: '~/Music/demo-track',     lastOpened: '2026-06-18T08:00:00Z' },
  { id: 'p3', name: 'Outro Loop',     path: '~/Music/outro-loop',     lastOpened: '2026-06-15T12:00:00Z' },
  { id: 'p4', name: 'Sunrise Draft',  path: '~/Music/sunrise-draft',  lastOpened: '2026-06-10T09:00:00Z' },
  { id: 'p5', name: 'Verse Study',    path: '~/Music/verse-study',    lastOpened: '2026-06-05T14:00:00Z' },
  { id: 'p6', name: 'Bridge Work',    path: '~/Music/bridge-work',    lastOpened: '2026-05-30T11:00:00Z' },
  { id: 'p7', name: 'Hook Sketch',    path: '~/Music/hook-sketch',    lastOpened: '2026-05-25T16:00:00Z' },
  { id: 'p8', name: 'Final Mix',      path: '~/Music/final-mix',      lastOpened: '2026-05-20T08:00:00Z' },
]

const FEW_PROJECTS: ProjectRecord[] = MANY_PROJECTS.slice(0, 2)

const RECENT: ProjectRecord[] = [MANY_PROJECTS[0], MANY_PROJECTS[1]]

const BTN: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  outline: 'none',
}

// ── State cards ────────────────────────────────────────────────────────────────

function MainViewCard() {
  const [open, setOpen] = useState(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  return (
    <State label="Main view (projects + recent)">
      <button style={BTN} onClick={() => setOpen(true)}>Open picker</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={FEW_PROJECTS}
        recent={RECENT}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
        onPreview={id => setPreviewingId(id)}
        previewingId={previewingId}
      />
    </State>
  )
}

function PlayingStateCard() {
  const [open, setOpen] = useState(false)
  // p2 is previewing on open so the playing state is immediately visible
  const [previewingId, setPreviewingId] = useState<string | null>('p2')
  return (
    <State label="Playing state (Demo Track previewing)">
      <button style={BTN} onClick={() => setOpen(true)}>Open (playing)</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={FEW_PROJECTS}
        recent={RECENT}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
        onPreview={id => setPreviewingId(id)}
        previewingId={previewingId}
      />
    </State>
  )
}

function EmptyStateCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="Empty (no projects)">
      <button style={BTN} onClick={() => setOpen(true)}>Open empty picker</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={[]}
        recent={[]}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
      />
    </State>
  )
}

function ManyProjectsCard() {
  const [open, setOpen] = useState(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  return (
    <State label="Many projects (scrollable list)">
      <button style={BTN} onClick={() => setOpen(true)}>Open with 8 projects</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={MANY_PROJECTS}
        recent={RECENT}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
        onPreview={id => setPreviewingId(id)}
        previewingId={previewingId}
      />
    </State>
  )
}

function NoRecentCard() {
  const [open, setOpen] = useState(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  return (
    <State label="Projects but no recent">
      <button style={BTN} onClick={() => setOpen(true)}>Open (no recent)</button>
      <ProjectPicker
        open={open}
        onClose={() => setOpen(false)}
        projects={FEW_PROJECTS}
        recent={[]}
        onNew={() => setOpen(false)}
        onNewFromCode={() => setOpen(false)}
        onOpen={() => setOpen(false)}
        onBrowse={() => setOpen(false)}
        onPreview={id => setPreviewingId(id)}
        previewingId={previewingId}
      />
    </State>
  )
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <MainViewCard />
      <PlayingStateCard />
      <EmptyStateCard />
      <ManyProjectsCard />
      <NoRecentCard />
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [open,         setOpen]         = useState(false)
  const [hasProjects,  setHasProjects]  = useState(true)
  const [hasRecent,    setHasRecent]    = useState(true)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [lastAction,   setLastAction]   = useState<string | null>(null)

  const projects = hasProjects ? MANY_PROJECTS.slice(0, 4) : []
  const recent   = hasRecent   ? RECENT                    : []

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button style={BTN} onClick={() => setOpen(true)}>Open project picker</button>
          {lastAction && (
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}>
              → {lastAction}
            </p>
          )}
        </div>

        <ProjectPicker
          open={open}
          onClose={() => { setOpen(false); setLastAction('onClose()') }}
          projects={projects}
          recent={recent}
          onNew={() => { setOpen(false); setLastAction('onNew()') }}
          onNewFromCode={(code) => { setOpen(false); setLastAction(`onNewFromCode("${code}")`) }}
          onOpen={(id) => { setOpen(false); setLastAction(`onOpen("${id}")`) }}
          onBrowse={() => { setOpen(false); setLastAction('onBrowse()') }}
          onPreview={(id) => {
            setPreviewingId(id)
            setLastAction(id ? `onPreview("${id}")` : 'onPreview(null)')
          }}
          previewingId={previewingId}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={hasProjects} onChange={setHasProjects} size="sm" label="has projects" />
          <Toggle checked={hasRecent}   onChange={setHasRecent}   size="sm" label="has recent"   />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ProjectPickerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
