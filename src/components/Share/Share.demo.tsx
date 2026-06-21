// src/components/Share/Share.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Share } from './Share'
import type { ShareScope, ShareStatus } from './Share'

export const meta: DemoMeta = {
  name: 'Share',
  group: 'Composites',
  route: '/share',
  order: 50,
}

// ── Shared trigger style (kit tokens) ─────────────────────────────────────────

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  outline: 'none',
  lineHeight: 1,
}

// ── State cards ───────────────────────────────────────────────────────────────

function IdleCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('project')
  return (
    <State label="idle — scope selection">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share…</button>
      <Share
        open={open}
        scope={scope}
        status="idle"
        onScopeChange={setScope}
        onGenerate={() => setOpen(false)}
        onCopy={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function GeneratingCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('project')
  return (
    <State label="generating">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share…</button>
      <Share
        open={open}
        scope={scope}
        status="generating"
        onScopeChange={setScope}
        onGenerate={() => {}}
        onCopy={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function WaitingCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('project')
  return (
    <State label="waiting for peer">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share…</button>
      <Share
        open={open}
        scope={scope}
        code="MANGO-TIGER-7"
        status="waiting"
        onScopeChange={setScope}
        onGenerate={() => {}}
        onCopy={() => navigator.clipboard?.writeText('MANGO-TIGER-7').catch(() => {})}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function TransferringCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('project')
  return (
    <State label="transferring (60%)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share…</button>
      <Share
        open={open}
        scope={scope}
        code="MANGO-TIGER-7"
        status="transferring"
        progress={0.6}
        onScopeChange={setScope}
        onGenerate={() => {}}
        onCopy={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function DoneCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('project')
  return (
    <State label="done">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share…</button>
      <Share
        open={open}
        scope={scope}
        code="MANGO-TIGER-7"
        status="done"
        onScopeChange={setScope}
        onGenerate={() => {}}
        onCopy={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function ErrorCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('project')
  return (
    <State label="error">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share…</button>
      <Share
        open={open}
        scope={scope}
        code="MANGO-TIGER-7"
        status="error"
        errorMessage="Peer disconnected. Check your network and try again."
        onScopeChange={setScope}
        onGenerate={() => {}}
        onCopy={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function TrackCard() {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ShareScope>('track')
  return (
    <State label="track scope — waiting">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Share track…</button>
      <Share
        open={open}
        scope={scope}
        target="track-01"
        trackName="Drums"
        code="CEDAR-WOLF-3"
        status="waiting"
        onScopeChange={setScope}
        onGenerate={() => {}}
        onCopy={() => navigator.clipboard?.writeText('CEDAR-WOLF-3').catch(() => {})}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <IdleCard />
      <GeneratingCard />
      <WaitingCard />
      <TransferringCard />
      <DoneCard />
      <ErrorCard />
      <TrackCard />
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

const STATUSES: ShareStatus[] = [
  'idle', 'generating', 'waiting', 'transferring', 'done', 'error',
]

function PlaygroundDemo() {
  const [open,     setOpen]     = useState(false)
  const [status,   setStatus]   = useState<ShareStatus>('idle')
  const [progress, setProgress] = useState(0.4)
  const [isTrack,  setIsTrack]  = useState(false)

  const scope: ShareScope = isTrack ? 'track' : 'project'
  const hasCode = status !== 'idle' && status !== 'generating'

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER} onClick={() => setOpen(true)}>Open Share…</button>

        <Share
          open={open}
          scope={scope}
          target={isTrack ? 'track-01' : undefined}
          trackName={isTrack ? 'Drums' : undefined}
          code={hasCode ? 'MANGO-TIGER-7' : undefined}
          status={status}
          progress={progress}
          errorMessage="Peer disconnected."
          onScopeChange={(s) => setIsTrack(s === 'track')}
          onGenerate={() => {}}
          onCopy={() => {}}
          onCancel={() => setOpen(false)}
        />

        {/* Controls — dogfood Toggle ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={isTrack}
            onChange={setIsTrack}
            size="sm"
            label="track scope"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-1)',
            }}>
              status
            </span>
            {STATUSES.map(s => (
              <Toggle
                key={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                size="sm"
                label={s}
              />
            ))}
          </div>

          <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            <span>progress ({Math.round(progress * 100)}%)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ShareDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
