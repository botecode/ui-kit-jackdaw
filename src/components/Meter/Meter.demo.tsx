// src/components/Meter/Meter.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader/Fader'
import { Meter } from './Meter'
import { dbScale } from '../Fader/faderScales'

export const meta: DemoMeta = {
  name: 'Meter',
  group: 'Primitives',
  route: '/meter',
  order: 3,
}

// ── Live signal simulation ────────────────────────────────────────────────────

function useLiveSignal(biasDb = -10) {
  const [signal, setSignal] = useState({ levelL: biasDb, levelR: biasDb - 4 })
  const rmRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    rmRef.current = mq.matches
    const h = (e: MediaQueryListEvent) => { rmRef.current = e.matches }
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    if (rmRef.current) {
      setSignal({ levelL: biasDb + 2, levelR: biasDb - 3 })
      return
    }
    const start = Date.now()
    let raf: number
    function tick() {
      if (rmRef.current) return
      const t = (Date.now() - start) / 1000
      const sweepL = 5 * Math.sin(t * 0.7) + 3 * Math.sin(t * 2.1) + 1.5 * Math.sin(t * 5.3)
      const sweepR = 5 * Math.sin(t * 0.7 + 0.5) + 3 * Math.sin(t * 2.1 + 1.0) + 1.5 * Math.sin(t * 5.3 + 2.0)
      const noiseL = (Math.random() - 0.5) * 2.5
      const noiseR = (Math.random() - 0.5) * 2.5
      const burstL = Math.random() < 0.01 ? Math.random() * 14 : 0
      const burstR = Math.random() < 0.01 ? Math.random() * 14 : 0
      setSignal({
        levelL: Math.min(biasDb + sweepL + noiseL + burstL, 8),
        levelR: Math.min(biasDb + sweepR + noiseR + burstR, 8),
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [biasDb])

  return signal
}

function LiveMeter({ channels, biasDb = -10, ...rest }: {
  channels: 1 | 2
  biasDb?: number
  peakHold?: boolean
  palette?: 'level' | 'chroma'
  density?: 'standard' | 'fine'
  segments?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const { levelL, levelR } = useLiveSignal(biasDb)
  if (channels === 2) return <Meter {...rest} valueL={levelL} valueR={levelR} />
  return <Meter {...rest} value={levelL} />
}

// ── Live / playing ────────────────────────────────────────────────────────────

function LiveSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>
        Live / playing
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <LiveMeter channels={1} biasDb={-10} peakHold size="lg" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>mono</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <LiveMeter channels={2} biasDb={-12} peakHold size="lg" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>stereo</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <LiveMeter channels={2} biasDb={-6} peakHold size="md" />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>hot mix</span>
        </div>
      </div>
    </div>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function ClipLatchDemo() {
  const [clipped, setClipped] = useState(true)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Meter value={clipped ? 6 : -20} clipLatch onResetClip={() => setClipped(false)} ballistics={false} />
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
        {clipped ? 'click to clear' : 'cleared'}
      </span>
    </div>
  )
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Silence (−∞)">
        <Meter value={-60} ballistics={false} />
      </State>
      <State label="−12 dB">
        <Meter value={-12} ballistics={false} />
      </State>
      <State label="−3 dB (hot zone)">
        <Meter value={-3} ballistics={false} />
      </State>
      <State label="Clip latched">
        <ClipLatchDemo />
      </State>
      <State label="Mono (wide)">
        <Meter value={-9} ballistics={false} />
      </State>
      <State label="Stereo (narrow cols)">
        <Meter valueL={-9} valueR={-18} ballistics={false} />
      </State>

      {/* Palette comparison — side by side inside one State cell */}
      <State label='palette="level" vs "chroma"'>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Meter value={-3} palette="level" ballistics={false} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>level</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Meter value={-3} palette="chroma" ballistics={false} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>chroma</span>
          </div>
        </div>
      </State>

      <State label='density="fine" (segments=32)'>
        <Meter value={-6} density="fine" segments={32} ballistics={false} />
      </State>

      <State label="Horizontal">
        <Meter value={-6} orientation="horizontal" ballistics={false} />
      </State>
      <State label="sm size">
        <Meter value={-6} size="sm" ballistics={false} />
      </State>
      <State label="Peak hold">
        <Meter value={-30} peakHold ballistics={false} />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const db = dbScale()
  const [levelL, setLevelL] = useState(-12)
  const [levelR, setLevelR] = useState(-18)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end' }}>
        <Meter valueL={levelL} valueR={levelR} peakHold clipLatch size="lg" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            L: {db.defaultFormat(levelL)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader value={levelL} onChange={setLevelL} min={-60} max={6} scale={db}
                orientation="horizontal" detent={{ value: 0 }} aria-label="Left level" />
            </div>
          </label>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            R: {db.defaultFormat(levelR)}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Fader value={levelR} onChange={setLevelR} min={-60} max={6} scale={db}
                orientation="horizontal" detent={{ value: 0 }} aria-label="Right level" />
            </div>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function MeterDemo() {
  return (
    <DemoShell meta={meta}>
      <LiveSection />
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
