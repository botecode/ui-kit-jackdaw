// src/components/ClipPlayer/ClipPlayer.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { Fader } from '../Fader'
import { ClipPlayer } from './ClipPlayer'
import type { ClipPlayerProps } from './ClipPlayer'

export const meta: DemoMeta = {
  name: 'ClipPlayer',
  group: 'Composites',
  route: '/clip-player',
  order: 36,
}

// ─── Synthetic peaks ────────────────────────────────────────────────────────────
// A wandering envelope so the waveform reads as a real take, not a buzz. ~200
// peaks — the shape a clip actually carries. Built once at module load.

function buildPeaks(count: number, seed = 1): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count
    const phrase = Math.sin(t * Math.PI)                       // overall swell
    const detail = 0.5 + 0.5 * Math.abs(Math.sin(i * (0.7 + seed * 0.13)))
    const grit = 0.2 + 0.8 * Math.abs(Math.sin(i * 1.9 + seed))
    return Math.min(1, Math.max(0.04, phrase * detail * grit))
  })
}

const PEAKS_A = buildPeaks(200, 1)
const PEAKS_B = buildPeaks(200, 3)
const DURATION = 174 // 2:54

// ─── Layout helper ──────────────────────────────────────────────────────────────

function Box({ children, width = 360 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── Mid-scrub harness (gallery only) ───────────────────────────────────────────
// The component is controlled, so to freeze the transient "mid-scrub" state we
// give the waveform a real box and dispatch the same pointerdown the browser
// would — driving the real component, no contract pollution.

function Scrubbing({ atFraction = 0.62, ...props }: { atFraction?: number } & ClipPlayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wave = ref.current?.querySelector('[data-testid="clipplayer-wave"]') as HTMLElement | null
    if (!wave) return
    wave.getBoundingClientRect = () =>
      ({ left: 0, width: 320, top: 0, height: 52, right: 320, bottom: 52, x: 0, y: 0, toJSON() {} }) as DOMRect
    wave.dispatchEvent(new PointerEvent('pointerdown', { clientX: 320 * atFraction, bubbles: true, button: 0 }))
  }, [atFraction])

  return (
    <div ref={ref}>
      <ClipPlayer {...props} />
    </div>
  )
}

// ─── States ─────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="idle (default)">
        <Box>
          <ClipPlayer peaks={PEAKS_A} durationSeconds={DURATION} positionSeconds={0} label="Morning Hook" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="playing — lit, mid-clip">
        <Box>
          <ClipPlayer peaks={PEAKS_A} durationSeconds={DURATION} positionSeconds={DURATION * 0.42} isPlaying label="Rooftop Jam" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="mid-scrub — playhead under the finger">
        <Box>
          <Scrubbing peaks={PEAKS_B} durationSeconds={DURATION} positionSeconds={DURATION * 0.2} label="Find the Drop" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="no peaks — clip not yet analysed">
        <Box>
          <ClipPlayer peaks={[]} durationSeconds={42} positionSeconds={9} label="Bridge Idea" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="no duration — still rendering">
        <Box>
          <ClipPlayer peaks={PEAKS_A} durationSeconds={undefined} positionSeconds={0} label="Bouncing…" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="focus — scrubber ring">
        <Box>
          <Focused peaks={PEAKS_B} durationSeconds={DURATION} positionSeconds={DURATION * 0.3} label="Tab Target" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="display-only — no onSeek">
        <Box>
          <ClipPlayer peaks={PEAKS_A} durationSeconds={DURATION} positionSeconds={DURATION * 0.55} isPlaying label="Read-only" onPlayPause={() => {}} />
        </Box>
      </State>

      <State label="disabled">
        <Box>
          <ClipPlayer peaks={PEAKS_A} durationSeconds={DURATION} positionSeconds={DURATION * 0.4} label="Locked" disabled onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>

      <State label="sm — compact list row">
        <Box width={300}>
          <ClipPlayer peaks={PEAKS_B} durationSeconds={DURATION} positionSeconds={DURATION * 0.3} size="sm" label="Pocket Take" onPlayPause={() => {}} onSeek={() => {}} />
        </Box>
      </State>
    </StatesGrid>
  )
}

// Focus the scrubber on mount so the focus ring shows statically in the grid.
function Focused(props: ClipPlayerProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const wave = ref.current?.querySelector('[data-testid="clipplayer-wave"]') as HTMLElement | null
    wave?.focus()
  }, [])
  return (
    <div ref={ref}>
      <ClipPlayer {...props} />
    </div>
  )
}

// ─── Playground (live transport, dogfooded kit controls) ────────────────────────
// ClipPlayer is intent-only, so the playground plays the part of the host: it
// owns position + isPlaying, advances the playhead while rolling, and wires the
// real intents (onPlayPause / onSeek) back into that state.

function PlaygroundDemo() {
  const [compact, setCompact] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [log, setLog] = useState('idle')
  const posRef = useRef(0)
  posRef.current = position

  // Advance the playhead while rolling (the host's transport clock). Reduced
  // motion still advances — this is functional, not decorative.
  useEffect(() => {
    if (!playing || disabled) return
    const id = window.setInterval(() => {
      const next = posRef.current + 0.25
      if (next >= DURATION) {
        setPosition(0)
        setPlaying(false)
        setLog('ended')
      } else {
        setPosition(next)
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [playing, disabled])

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
        <Box width={440}>
          <ClipPlayer
            peaks={PEAKS_A}
            durationSeconds={DURATION}
            positionSeconds={position}
            isPlaying={playing}
            size={compact ? 'sm' : 'md'}
            disabled={disabled}
            label="Live demo — synth take"
            onPlayPause={() => {
              setPlaying(p => {
                setLog(p ? 'paused' : 'playing')
                return !p
              })
            }}
            onSeek={s => {
              setPosition(s)
              setLog(`seek → ${s.toFixed(1)}s`)
            }}
          />
        </Box>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          last intent: {log}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={disabled} onChange={setDisabled} aria-label="Disabled" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Disabled</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Position (host scrub)</span>
            <Fader
              value={position / DURATION}
              min={0}
              max={1}
              onChange={f => {
                const s = f * DURATION
                setPosition(s)
                setLog(`seek → ${s.toFixed(1)}s`)
              }}
              orientation="horizontal"
              aria-label="Position"
            />
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function ClipPlayerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
