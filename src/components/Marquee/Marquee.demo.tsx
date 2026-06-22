import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Checkbox } from '../Checkbox'
import { Marquee } from './Marquee'

export const meta: DemoMeta = {
  name: 'Marquee',
  group: 'Composites',
  route: '/marquee',
  order: 90,
}

const KEYWORDS = [
  'Multitrack',
  'Lossless',
  'Transparent share',
  'Bespoke instrument',
  'Warm + tactile',
  'Offline-first',
]

// A pretend logo node — the marquee carries arbitrary nodes, not just text.
function Wordmark({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--text)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--accent)',
        }}
      />
      {label}
    </span>
  )
}

const LOGOS = ['Aviary', 'Corvid', 'Jackdaw Studio', 'Nightfall', 'Magpie & Co.'].map((l) => (
  <Wordmark key={l} label={l} />
))

// Constrain the marquee to a card-ish width so the loop + edge fades are visible
// inside a states cell.
function Frame({ children, width = 320 }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      style={{
        width,
        padding: 'var(--space-3) 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
      }}
    >
      {children}
    </div>
  )
}

// ── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Default (rolling left)">
        <Frame>
          <Marquee items={KEYWORDS} />
        </Frame>
      </State>
      <State label="Direction: right">
        <Frame>
          <Marquee items={KEYWORDS} direction="right" />
        </Frame>
      </State>
      <State label="Fast (140 px/s)">
        <Frame>
          <Marquee items={KEYWORDS} speed={140} />
        </Frame>
      </State>
      <State label="Slow (28 px/s)">
        <Frame>
          <Marquee items={KEYWORDS} speed={28} />
        </Frame>
      </State>
      <State label="Pause on hover (hover me)">
        <Frame>
          <Marquee items={KEYWORDS} speed={45} />
        </Frame>
      </State>
      <State label="No pause on hover">
        <Frame>
          <Marquee items={KEYWORDS} pauseOnHover={false} />
        </Frame>
      </State>
      <State label="Logo nodes">
        <Frame>
          <Marquee items={LOGOS} speed={50} aria-label="Trusted by" />
        </Frame>
      </State>
      <State label="sm">
        <Frame>
          <Marquee items={KEYWORDS} size="sm" />
        </Frame>
      </State>
      <State label="Single item (still loops)">
        <Frame>
          <Marquee items={['One continuous take']} speed={40} />
        </Frame>
      </State>
      <State label="Empty (renders nothing)">
        <Frame>
          <Marquee items={[]} />
        </Frame>
      </State>
      <State label="Reduced motion → static">
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            lineHeight: 'var(--leading-base)',
          }}
        >
          Set OS “reduce motion” — the row stops, renders a single static track,
          edge fades stay. (jsdom-tested; verify in Compare.)
        </span>
      </State>
    </StatesGrid>
  )
}

// ── Playground ──────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [rightward, setRightward] = useState(false)
  const [pauseOnHover, setPauseOnHover] = useState(true)
  const [small, setSmall] = useState(false)
  const [logos, setLogos] = useState(false)
  const [speed, setSpeed] = useState(60)

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div
          style={{
            padding: 'var(--space-4) 0',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <Marquee
            items={logos ? LOGOS : KEYWORDS}
            direction={rightward ? 'right' : 'left'}
            pauseOnHover={pauseOnHover}
            size={small ? 'sm' : 'md'}
            speed={speed}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'flex-start' }}>
          <Checkbox checked={rightward} onChange={setRightward} size="sm" label="direction: right" />
          <Checkbox checked={pauseOnHover} onChange={setPauseOnHover} size="sm" label="pause on hover" />
          <Checkbox checked={small} onChange={setSmall} size="sm" label="size: sm" />
          <Checkbox checked={logos} onChange={setLogos} size="sm" label="logo nodes" />

          {/* Native range matches other demos' shared playground debt — migrate
              to a kit Fader when playground controls are unified. */}
          <label style={labelStyle}>
            speed {speed} px/s
            <input
              type="range"
              min={10}
              max={200}
              step={2}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function MarqueeDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
