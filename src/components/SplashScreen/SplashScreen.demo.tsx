// src/components/SplashScreen/SplashScreen.demo.tsx
import { useState, useEffect, useRef } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SplashScreen } from './SplashScreen'

export const meta: DemoMeta = {
  name: 'SplashScreen',
  group: 'Composites',
  route: '/splash-screen',
  order: 70,
}

// ── Shared screen wrapper ─────────────────────────────────────────────────────
// Presents the SplashScreen in a bounded card so every state is visible at once.

function ScreenCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <State label={label}>
      <div
        style={{
          width:        360,
          height:       240,
          borderRadius: 'var(--radius)',
          overflow:     'hidden',
          border:       '1px solid var(--border)',
        }}
      >
        {children}
      </div>
    </State>
  )
}

// ── State cards ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <ScreenCard label="0% — recessed / dim">
        <SplashScreen
          progress={0}
          status="Warming up the engine…"
          version="1.0.0-beta.4"
        />
      </ScreenCard>

      <ScreenCard label="33% — mid-load">
        <SplashScreen
          progress={0.33}
          status="Scanning plugins…"
          version="1.0.0-beta.4"
        />
      </ScreenCard>

      <ScreenCard label="66% — near done">
        <SplashScreen
          progress={0.66}
          status="Loading your last project…"
          version="1.0.0-beta.4"
        />
      </ScreenCard>

      <ScreenCard label="100% — fully lit / ready">
        <SplashScreen
          progress={1}
          version="1.0.0-beta.4"
        />
      </ScreenCard>

      <ScreenCard label="Indeterminate — calm pulse">
        <SplashScreen
          status="Starting up…"
          version="1.0.0-beta.4"
        />
      </ScreenCard>

      <ScreenCard label="No status line">
        <SplashScreen
          progress={0.5}
          version="1.0.0-beta.4"
        />
      </ScreenCard>

      <ScreenCard label="No version tag">
        <SplashScreen
          progress={0.5}
          status="Scanning plugins…"
        />
      </ScreenCard>

      <ScreenCard label="Status only — no version">
        <SplashScreen
          status="Warming up the engine…"
        />
      </ScreenCard>
    </StatesGrid>
  )
}

// ── Animated boot sequence for playground ─────────────────────────────────────
// Simulates the real boot sequence: increments through steps automatically.

const BOOT_STEPS: Array<{ at: number; status: string }> = [
  { at: 0.0,  status: 'Warming up the engine…'    },
  { at: 0.2,  status: 'Scanning plugins…'          },
  { at: 0.55, status: 'Loading your last project…' },
  { at: 0.85, status: 'Almost there…'              },
  { at: 1.0,  status: ''                            },
]

function useBootSequence(running: boolean) {
  const [progress, setProgress] = useState(0)
  const [status,   setStatus]   = useState(BOOT_STEPS[0]!.status)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 4000 // ms for a full 0→1 run

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      setProgress(0)
      setStatus(BOOT_STEPS[0]!.status)
      startRef.current = null
      return
    }

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const p = Math.min(elapsed / DURATION, 1)
      setProgress(p)

      // Find current status label
      let label = BOOT_STEPS[0]!.status
      for (const step of BOOT_STEPS) {
        if (p >= step.at) label = step.status
      }
      setStatus(label)

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [running])

  return { progress, status }
}

function PlaygroundDemo() {
  const [autoPlay,       setAutoPlay]       = useState(false)
  const [indeterminate,  setIndeterminate]  = useState(false)
  const [showStatus,     setShowStatus]     = useState(true)
  const [showVersion,    setShowVersion]    = useState(true)
  const [manualProgress, setManualProgress] = useState(0.4)

  const { progress: bootProgress, status: bootStatus } = useBootSequence(autoPlay)

  const progress = indeterminate
    ? undefined
    : autoPlay
      ? bootProgress
      : manualProgress

  const status = showStatus
    ? autoPlay
      ? bootStatus || undefined
      : 'Scanning plugins…'
    : undefined

  const version = showVersion ? '1.0.0-beta.4' : undefined

  return (
    <Playground>
      <div
        style={{
          display:       'flex',
          gap:           'var(--space-6)',
          alignItems:    'flex-start',
          flexWrap:      'wrap',
        }}
      >
        {/* Preview */}
        <div
          style={{
            width:        400,
            height:       280,
            borderRadius: 'var(--radius)',
            overflow:     'hidden',
            border:       '1px solid var(--border)',
            flexShrink:   0,
          }}
        >
          <SplashScreen
            progress={progress}
            status={status}
            version={version}
          />
        </div>

        {/* Controls */}
        <div
          style={{
            display:       'flex',
            flexDirection: 'column',
            gap:           'var(--space-3)',
            minWidth:      180,
          }}
        >
          <Toggle
            checked={autoPlay}
            onChange={(v) => { setAutoPlay(v); if (v) setIndeterminate(false) }}
            size="sm"
            label="Auto-play boot sequence"
          />
          <Toggle
            checked={indeterminate}
            onChange={(v) => { setIndeterminate(v); if (v) setAutoPlay(false) }}
            size="sm"
            label="Indeterminate mode"
          />
          <Toggle
            checked={showStatus}
            onChange={setShowStatus}
            size="sm"
            label="Show status line"
          />
          <Toggle
            checked={showVersion}
            onChange={setShowVersion}
            size="sm"
            label="Show version tag"
          />

          {!autoPlay && !indeterminate && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize:   'var(--text-xs)',
                  color:      'var(--text-muted)',
                  display:    'block',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Progress: {Math.round(manualProgress * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(manualProgress * 100)}
                onChange={(e) => setManualProgress(Number(e.target.value) / 100)}
                style={{ width: '100%', accentColor: 'var(--chroma-orange)' }}
              />
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function SplashScreenDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
