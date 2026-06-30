// src/components/Seeker/Seeker.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { Fader } from '../Fader'
import { Seeker } from './Seeker'

export const meta: DemoMeta = {
  name: 'Seeker',
  group: 'Primitives',
  route: '/seeker',
  order: 10,
}

const noop = () => {}

function Box({ children, width = 320 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── States ─────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — paused, scrubbable">
        <Box>
          <Seeker label="Seek" positionSeconds={42} durationSeconds={194} onSeek={noop} />
        </Box>
      </State>

      <State label="active — playing (rolling bloom)">
        <Box>
          <Seeker label="Seek" positionSeconds={88} durationSeconds={194} isPlaying onSeek={noop} />
        </Box>
      </State>

      <State label="paused — held at position">
        <Box>
          <Seeker label="Seek" positionSeconds={120} durationSeconds={194} isPlaying={false} onSeek={noop} />
        </Box>
      </State>

      <State label="mid-scrub — focused, thumb out (Tab to it)">
        <Box>
          <FocusedSeeker />
        </Box>
      </State>

      <State label="hover — hover the groove for the thumb">
        <Box>
          <Seeker label="Seek" positionSeconds={70} durationSeconds={194} onSeek={noop} />
        </Box>
      </State>

      <State label="no-duration — still rendering (loading)">
        <Box>
          <Seeker label="Seek" positionSeconds={0} durationSeconds={undefined} onSeek={noop} />
        </Box>
      </State>

      <State label="display-only — no onSeek (selected position)">
        <Box>
          <Seeker label="Position" positionSeconds={88} durationSeconds={194} isPlaying />
        </Box>
      </State>

      <State label="total time — trailing shows duration, not remaining">
        <Box>
          <Seeker label="Seek" positionSeconds={42} durationSeconds={194} trailingTime="total" onSeek={noop} />
        </Box>
      </State>

      <State label="disabled — held groove">
        <Box>
          <Seeker label="Seek" positionSeconds={42} durationSeconds={194} disabled onSeek={noop} />
        </Box>
      </State>

      <State label="empty — no times row (groove only)">
        <Box>
          <Seeker label="Seek" positionSeconds={42} durationSeconds={194} showTimes={false} onSeek={noop} />
        </Box>
      </State>

      <State label="sm — compact density">
        <Box width={240}>
          <Seeker label="Seek" positionSeconds={42} durationSeconds={194} size="sm" isPlaying onSeek={noop} />
        </Box>
      </State>
    </StatesGrid>
  )
}

/** Auto-focuses the groove so the focus ring + lifted thumb show in the static grid. */
function FocusedSeeker() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-testid="seeker-track"]')?.focus()
  }, [])
  return (
    <div ref={ref}>
      <Seeker label="Seek" positionSeconds={97} durationSeconds={194} onSeek={noop} />
    </div>
  )
}

// ─── Playground (dogfooded kit controls) ────────────────────────────────────────

const DURATION = 194

function PlaygroundDemo() {
  const [playing, setPlaying] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [scrubbable, setScrubbable] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [compact, setCompact] = useState(false)
  const [showTotal, setShowTotal] = useState(false)
  const [position, setPosition] = useState(42)
  const [log, setLog] = useState('idle')

  // Roll the position forward while "playing" — the host owns the clock; the
  // seeker only renders positionSeconds (golden rule #1: audio is native).
  useEffect(() => {
    if (!playing || rendering || disabled) return
    const id = window.setInterval(() => {
      setPosition(p => (p >= DURATION ? 0 : p + 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [playing, rendering, disabled])

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
        <Box width={440}>
          <Seeker
            label="Seek — Golden Hour"
            positionSeconds={position}
            durationSeconds={rendering ? undefined : DURATION}
            isPlaying={playing}
            disabled={disabled}
            size={compact ? 'sm' : 'md'}
            trailingTime={showTotal ? 'total' : 'remaining'}
            onSeek={scrubbable ? s => { setPosition(s); setLog(`seek → ${s.toFixed(0)}s`) } : undefined}
          />
        </Box>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          last intent: {log}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={playing} onChange={setPlaying} aria-label="Playing" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Playing</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={scrubbable} onChange={setScrubbable} aria-label="Scrubbable" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Scrubbable (onSeek)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={rendering} onChange={setRendering} aria-label="Rendering" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Rendering (no duration)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={showTotal} onChange={setShowTotal} aria-label="Total time" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Show total (not remaining)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={disabled} onChange={setDisabled} aria-label="Disabled" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Disabled</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Drive position</span>
            <Fader
              value={position}
              min={0}
              max={DURATION}
              onChange={setPosition}
              orientation="horizontal"
              aria-label="Drive position"
            />
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function SeekerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
