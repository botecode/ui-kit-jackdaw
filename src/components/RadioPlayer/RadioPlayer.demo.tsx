// src/components/RadioPlayer/RadioPlayer.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { ProductFrame } from '../ProductFrame'
import { RadioPlayer } from './RadioPlayer'
import type { RadioTrack } from './RadioPlayer'

export const meta: DemoMeta = {
  name: 'RadioPlayer',
  group: 'Composites',
  route: '/radio-player',
  order: 36,
}

// ─── The station's rotation ──────────────────────────────────────────────────────

const STATION: RadioTrack[] = [
  { id: '1', title: 'Midnight Take', duration: 174 },
  { id: '2', title: 'Rooftop Jam', duration: 132 },
  { id: '3', title: "The One That Got Away (Demo)", duration: 208 },
  { id: '4', title: 'Slow Burn', duration: 201 },
  { id: '5', title: 'Kitchen Floor Voice Memo', duration: 96 },
]

function Box({ children, width = 280 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── States ─────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="paused (default)">
        <Box>
          <RadioPlayer tracks={STATION} index={0} playing={false} elapsed={0} />
        </Box>
      </State>

      <State label="playing — ON AIR, ticking">
        <Box>
          <RadioPlayer tracks={STATION} index={0} playing elapsed={83} />
        </Box>
      </State>

      <State label="paused — mid-idea">
        <Box>
          <RadioPlayer tracks={STATION} index={3} playing={false} elapsed={47} />
        </Box>
      </State>

      <State label="long title — scrolls (LED ticker)">
        <Box>
          <RadioPlayer tracks={STATION} index={2} playing elapsed={61} />
        </Box>
      </State>

      <State label="next / transition">
        <Box>
          <TransitionDemo />
        </Box>
      </State>

      <State label="focus — next ring">
        <Box>
          <FocusDemo />
        </Box>
      </State>

      <State label="disabled">
        <Box>
          <RadioPlayer tracks={STATION} index={1} playing={false} disabled />
        </Box>
      </State>

      <State label="empty — no signal">
        <Box>
          <RadioPlayer tracks={[]} index={0} playing={false} />
        </Box>
      </State>

      <State label="sm size">
        <Box width={240}>
          <RadioPlayer tracks={STATION} index={1} playing elapsed={12} size="sm" />
        </Box>
      </State>
    </StatesGrid>
  )
}

// Drives a real index change once after mount so the transition flicker is captured
// — the same DOM path the app takes when the station advances.
function TransitionDemo() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setIndex(1), 60)
    return () => clearTimeout(t)
  }, [])
  return <RadioPlayer tracks={STATION} index={index} playing elapsed={2} />
}

function FocusDemo() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const btn = ref.current?.querySelector('[data-testid="radioplayer-next"]') as HTMLElement | null
    btn?.focus()
  }, [])
  return (
    <div ref={ref}>
      <RadioPlayer tracks={STATION} index={0} playing={false} elapsed={0} />
    </div>
  )
}

// ─── Playground — a real, continuously-looping station ───────────────────────────

function PlaygroundDemo() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [compact, setCompact] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [log, setLog] = useState('idle')

  const current = STATION[index]
  const duration = current.duration ?? 0

  // Host clock — the station ticks and loops continuously while rolling. This lives
  // in the host (a store, in the app), never in the component: RadioPlayer is a
  // controlled view, so it drops in with zero rework.
  useEffect(() => {
    if (!playing || disabled) return
    const id = setInterval(() => {
      setElapsed(e => {
        if (duration > 0 && e + 1 >= duration) {
          setIndex(i => (i + 1) % STATION.length) // loop to the next idea
          setLog('auto-advance → next idea')
          return 0
        }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [playing, disabled, duration])

  function handleNext() {
    setIndex(i => (i + 1) % STATION.length)
    setElapsed(0)
    setLog('next idea')
  }
  function handlePlayPause(next: boolean) {
    setPlaying(next)
    setLog(next ? 'playing' : 'paused')
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        {/* Live phone-frame preview — the app surface this hero lives on. */}
        <ProductFrame variant="phone" sheen caption="On your phone — your station, on loop">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: 'var(--space-4)',
            }}
          >
            <RadioPlayer
              tracks={STATION}
              index={index}
              playing={playing}
              elapsed={elapsed}
              size={compact ? 'sm' : 'md'}
              disabled={disabled}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
            />
          </div>
        </ProductFrame>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 220 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            now playing: {current.title}
            <br />
            last intent: {log}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={disabled} onChange={setDisabled} aria-label="Disabled" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Disabled (off air)</span>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function RadioPlayerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
