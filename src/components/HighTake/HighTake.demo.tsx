import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { HighTake } from './HighTake'

export const meta: DemoMeta = {
  name:  'HighTake',
  group: 'Composites',
  route: '/high-take',
  order: 127,
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DURATION = 12

// A take with a couple of phrases — "riff riff raff".
function makePeaks(n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / n
    // three swells with quiet gaps between them
    const swell =
      Math.sin(t * Math.PI * 3) ** 2 *
      (0.55 + 0.45 * Math.sin(t * Math.PI * 17))
    return Math.max(0.05, Math.min(1, Math.abs(swell)))
  })
}

const PEAKS = makePeaks(220)

const BOX_MD = 380
const BOX_SM = 280

// ─── Stateful wrapper — handles move when you drag/keyboard them ───────────────

function Take({
  start,
  end,
  width = BOX_MD,
  ...rest
}: {
  start: number
  end: number
  width?: number
  peaks?: number[]
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  'aria-label'?: string
}) {
  const [range, setRange] = useState({ start, end })
  const [saved, setSaved] = useState(false)
  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <HighTake
        peaks={PEAKS}
        durationSeconds={DURATION}
        trimStart={range.start}
        trimEnd={range.end}
        onTrim={(s, e) => { setRange({ start: s, end: e }); setSaved(false) }}
        onSave={() => setSaved(true)}
        {...rest}
      />
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)',
      }}>
        {saved
          ? `saved ${range.start.toFixed(2)}s – ${range.end.toFixed(2)}s`
          : `keep ${range.start.toFixed(2)}s – ${range.end.toFixed(2)}s`}
      </span>
    </div>
  )
}

// ─── States ─────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — full take, nothing trimmed">
        <Take start={0} end={DURATION} label="Take 1" />
      </State>

      <State label="trimmed — kept span lit, ends dimmed">
        <Take start={2.4} end={8.6} label="Take 2" />
      </State>

      <State label="focus — Tab to a handle, ← → to trim">
        <Take start={3} end={9} label="Take 3" />
      </State>

      <State label="disabled">
        <Take start={2.4} end={8.6} label="Take 4" disabled />
      </State>

      <State label="sm size">
        <Take start={2} end={9} width={BOX_SM} size="sm" label="Take 5" />
      </State>

      <State label="empty — no peaks captured yet">
        <div style={{ width: BOX_MD }}>
          <HighTake
            peaks={[]}
            durationSeconds={DURATION}
            trimStart={0}
            trimEnd={DURATION}
            onTrim={() => {}}
            onSave={() => {}}
            label="Empty take"
          />
        </div>
      </State>

      <State label="Chroma (light) vs Ink (dark)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <ThemeProvider theme="chroma">
            <div style={{ padding: 'var(--space-3)', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
              <Take start={2.4} end={8.6} width={320} label="chroma" />
            </div>
          </ThemeProvider>
          <ThemeProvider theme="ink">
            <div style={{ padding: 'var(--space-3)', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
              <Take start={2.4} end={8.6} width={320} label="ink" />
            </div>
          </ThemeProvider>
        </div>
      </State>
    </StatesGrid>
  )
}

// ─── Playground — dogfoods kit Toggle + Fader ──────────────────────────────────

function PlaygroundDemo() {
  const [range, setRange]   = useState({ start: 2.4, end: 8.6 })
  const [disabled, setDis]  = useState(false)
  const [small, setSmall]   = useState(false)
  const [saveCount, setSC]  = useState(0)

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)',
  }
  const monoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 440, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <HighTake
            peaks={PEAKS}
            durationSeconds={DURATION}
            trimStart={range.start}
            trimEnd={range.end}
            onTrim={(s, e) => setRange({ start: s, end: e })}
            onSave={() => setSC(c => c + 1)}
            label="Riff idea"
            disabled={disabled}
            size={small ? 'sm' : 'md'}
          />
          <span style={monoStyle}>
            keep {range.start.toFixed(2)}s – {range.end.toFixed(2)}s
            {'  ·  '}saved {saveCount}×
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flexShrink: 0, minWidth: 200 }}>
          <label style={labelStyle}>
            trim start: {range.start.toFixed(2)}s
            <Fader
              value={range.start}
              onChange={v => setRange(r => ({ ...r, start: Math.min(v, r.end - 0.05) }))}
              min={0}
              max={DURATION}
              orientation="horizontal"
              size="sm"
              aria-label="Trim start"
            />
          </label>
          <label style={labelStyle}>
            trim end: {range.end.toFixed(2)}s
            <Fader
              value={range.end}
              onChange={v => setRange(r => ({ ...r, end: Math.max(v, r.start + 0.05) }))}
              min={0}
              max={DURATION}
              orientation="horizontal"
              size="sm"
              aria-label="Trim end"
            />
          </label>

          <Toggle checked={disabled} onChange={setDis} label="disabled" size="sm" />
          <Toggle checked={small} onChange={setSmall} label="sm size" size="sm" />

          <div style={{ ...monoStyle, marginTop: 'var(--space-2)' }}>
            <p style={{ margin: 0 }}>Drag the | handles inward to trim.</p>
            <p style={{ margin: '2px 0 0' }}>← → nudge (Shift = 1s).</p>
            <p style={{ margin: '2px 0 0' }}>Home / End jump to the edge.</p>
            <p style={{ margin: '2px 0 0' }}>+ save → host opens the name modal.</p>
          </div>
        </div>
      </div>
    </Playground>
  )
}

export default function HighTakeDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
