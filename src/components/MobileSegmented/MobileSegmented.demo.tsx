import { useState } from 'react'
import { PencilSimple, Waveform, Sparkle, Star } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ProductFrame } from '../ProductFrame'
import { MobileSegmented } from './MobileSegmented'
import type { MobileSegment } from './MobileSegmented'

export const meta: DemoMeta = {
  name: 'MobileSegmented',
  group: 'Composites',
  route: '/mobile-segmented',
  order: 115,
}

// ── Segment sets (the real app surfaces) ───────────────────────────────────────

const MODE: MobileSegment[] = [
  { value: 'write', label: 'Write' },
  { value: 'edit', label: 'Edit' },
]

const LIBRARY: MobileSegment[] = [
  { value: 'all', label: 'All' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'masters', label: 'Masters' },
]

// A fixed phone-ish column so the full-width control reads at app scale.
function Phone({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 248 }}>{children}</div>
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}

  return (
    <StatesGrid>
      {/* default — the canonical Write|Edit, first active */}
      <State label="default">
        <Phone>
          <MobileSegmented segments={MODE} value="write" onChange={noop} aria-label="Editor mode" />
        </Phone>
      </State>

      {/* selected — slid to the second segment */}
      <State label="selected">
        <Phone>
          <MobileSegmented segments={MODE} value="edit" onChange={noop} aria-label="Editor mode" />
        </Phone>
      </State>

      {/* hover — pure CSS; here we just show the resting unselected look */}
      <State label="hover">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="ideas" onChange={noop} aria-label="Library filter" />
        </Phone>
      </State>

      {/* active / pressed — the satisfying dip (forced via the real interaction below in the playground) */}
      <State label="active">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="all" onChange={noop} aria-label="Library filter" />
        </Phone>
      </State>

      {/* focus — keyboard ring on the active segment */}
      <State label="focus">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="masters" onChange={noop} autoFocus aria-label="Library filter" />
        </Phone>
      </State>

      {/* disabled */}
      <State label="disabled">
        <Phone>
          <MobileSegmented segments={MODE} value="write" onChange={noop} disabled aria-label="Editor mode" />
        </Phone>
      </State>

      {/* three segments — first / middle / last */}
      <State label="3 — first">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="all" onChange={noop} aria-label="Library filter" />
        </Phone>
      </State>
      <State label="3 — middle">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="ideas" onChange={noop} aria-label="Library filter" />
        </Phone>
      </State>
      <State label="3 — last">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="masters" onChange={noop} aria-label="Library filter" />
        </Phone>
      </State>

      {/* icon + label */}
      <State label="icon + label">
        <Phone>
          <MobileSegmented
            segments={[
              { value: 'write', icon: <PencilSimple size={15} />, label: 'Write' },
              { value: 'edit', icon: <Waveform size={15} />, label: 'Edit' },
            ]}
            value="write"
            onChange={noop}
            aria-label="Editor mode"
          />
        </Phone>
      </State>

      {/* small size */}
      <State label="sm">
        <Phone>
          <MobileSegmented segments={LIBRARY} value="ideas" onChange={noop} size="sm" aria-label="Library filter" />
        </Phone>
      </State>

      {/* empty-ish — single segment (degenerate N=1, slider fills) */}
      <State label="single">
        <Phone>
          <MobileSegmented
            segments={[{ value: 'only', label: 'All takes' }]}
            value="only"
            onChange={noop}
            aria-label="Filter"
          />
        </Phone>
      </State>
    </StatesGrid>
  )
}

// ── Phone-frame preview ────────────────────────────────────────────────────────
// The control living on the real app screen — a recessed dark surface inside the
// tactile phone bezel, the way it ships.

function PreviewDemo() {
  const [mode, setMode] = useState('write')
  const [filter, setFilter] = useState('ideas')

  const screen: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
    width: '100%',
    height: '100%',
    padding: 'var(--space-5) var(--space-4)',
    background: 'var(--bg)',
  }
  const rowLabel: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 'var(--space-2)',
  }

  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600,
        letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)',
        margin: '0 0 var(--space-4)',
      }}>
        On the app screen
      </h2>
      <ProductFrame variant="phone">
        <div style={screen}>
          <div>
            <div style={rowLabel}>Song</div>
            <MobileSegmented segments={MODE} value={mode} onChange={setMode} aria-label="Editor mode" />
          </div>
          <div>
            <div style={rowLabel}>Library</div>
            <MobileSegmented segments={LIBRARY} value={filter} onChange={setFilter} aria-label="Library filter" />
          </div>
        </div>
      </ProductFrame>
    </section>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState('ideas')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)
  const [count, setCount] = useState<2 | 3>(3)
  const [withIcons, setWithIcons] = useState(false)

  const three: MobileSegment[] = withIcons
    ? [
        { value: 'all', icon: <Star size={15} />, label: 'All' },
        { value: 'ideas', icon: <Sparkle size={15} />, label: 'Ideas' },
        { value: 'masters', icon: <Waveform size={15} />, label: 'Masters' },
      ]
    : LIBRARY
  const two = three.slice(0, 2)
  const segments = count === 2 ? two : three

  const live = segments.find(s => s.value === value) ? value : segments[0].value

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
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 260 }}>
          <MobileSegmented
            segments={segments}
            value={live}
            onChange={setValue}
            size={size}
            disabled={disabled}
            aria-label="Playground segmented control"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={disabled} onChange={setDisabled} size="sm" label="disabled" />
          <Toggle checked={withIcons} onChange={setWithIcons} size="sm" label="icons" />

          <div style={labelStyle}>
            size
            <MobileSegmented
              segments={[{ value: 'md', label: 'md' }, { value: 'sm', label: 'sm' }]}
              value={size}
              onChange={v => setSize(v as 'sm' | 'md')}
              size="sm"
              aria-label="Size"
            />
          </div>

          <div style={{ ...labelStyle, width: 180 }}>
            segments
            <MobileSegmented
              segments={[{ value: '2', label: '2' }, { value: '3', label: '3' }]}
              value={String(count)}
              onChange={v => setCount(Number(v) as 2 | 3)}
              size="sm"
              aria-label="Segment count"
            />
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function MobileSegmentedDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PreviewDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
