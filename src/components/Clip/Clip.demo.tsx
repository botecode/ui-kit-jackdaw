// src/components/Clip/Clip.demo.tsx
import { useMemo, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Fader } from '../Fader'
import { Checkbox } from '../Checkbox'
import { Clip } from './Clip'
import type { ClipProps } from './Clip'

export const meta: DemoMeta = {
  name: 'Clip',
  group: 'Primitives',
  route: '/clip',
  order: 5,
}

// ─── Synthetic peaks ──────────────────────────────────────────────────────────
// High-frequency sine mix produces the jagged, transient-rich look of real audio
// rather than smooth decorative bumps. 500 samples gives genuine LOD headroom —
// the component will downsample at narrow widths and reveal more detail when wide.

function makePeaks(count: number, seed = 0): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count
    const v =
      Math.abs(Math.sin(t * Math.PI * 53  + seed + 0.4)) * 0.38 +
      Math.abs(Math.sin(t * Math.PI * 137 + seed + 1.3)) * 0.24 +
      Math.abs(Math.sin(t * Math.PI * 311 + seed + 2.7)) * 0.18 +
      Math.abs(Math.sin(t * Math.PI * 19  + seed + 0.9)) * 0.12 +
      Math.abs(Math.sin(t * Math.PI * 7   + seed + 1.6)) * 0.08
    return Math.min(1, v * 1.6)
  })
}

const PEAKS   = makePeaks(500)
const PEAKS_A = makePeaks(250, 0)
const PEAKS_B = makePeaks(250, 5)

// ─── Layout helper ────────────────────────────────────────────────────────────

function ClipBox({
  width = 260,
  height = 56,
  children,
}: {
  width?: number
  height?: number
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        width,
        height,
        background: 'var(--arrange-bg)',
        borderRadius: '3px',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  )
}

// ─── States demo ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="recorded — ink (default)">
        <ClipBox>
          <Clip peaks={PEAKS} color="var(--track-color-3)" />
        </ClipBox>
      </State>

      <State label="recorded — track color">
        <ClipBox>
          <Clip peaks={PEAKS} color="var(--track-color-3)" waveformColor="track" />
        </ClipBox>
      </State>

      <State label="recording (animated)">
        <ClipBox>
          <Clip peaks={PEAKS} color="var(--track-color-6)" state="recording" />
        </ClipBox>
      </State>

      <State label="split (seam)">
        <div style={{ display: 'flex', width: 260, height: 56, gap: 0, flexShrink: 0 }}>
          <div style={{ flex: '1.6', height: '100%', background: 'var(--arrange-bg)', overflow: 'hidden' }}>
            <Clip peaks={PEAKS_A} color="var(--track-color-2)" splitRight />
          </div>
          <div style={{ flex: '1', height: '100%', background: 'var(--arrange-bg)', overflow: 'hidden' }}>
            <Clip peaks={PEAKS_B} color="var(--track-color-2)" splitLeft />
          </div>
        </div>
      </State>

      <State label="zoomed-in (wide) — label">
        <ClipBox width={380}>
          <Clip peaks={PEAKS} color="var(--track-color-1)" label="Electric Guitar" showLabel />
        </ClipBox>
      </State>

      <State label="zoomed-out (narrow + sliver)">
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
          <ClipBox width={72}>
            <Clip peaks={PEAKS} color="var(--track-color-4)" />
          </ClipBox>
          <ClipBox width={28}>
            <Clip peaks={PEAKS} color="var(--track-color-4)" />
          </ClipBox>
        </div>
      </State>

      <State label="selected">
        <ClipBox>
          <Clip peaks={PEAKS} color="var(--track-color-5)" selected />
        </ClipBox>
      </State>

      <State label="muted">
        <ClipBox>
          <Clip peaks={PEAKS} color="var(--track-color-3)" muted />
        </ClipBox>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  display: 'block',
  marginTop: 'var(--space-1)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  border: '1px solid var(--border-strong)',
  borderRadius: '3px',
  padding: '2px 6px',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}


function PlaygroundDemo() {
  const [clipWidth,    setClipWidth]    = useState(260)
  const [clipHeight,   setClipHeight]   = useState(56)
  const [selected,     setSelected]     = useState(false)
  const [showLabel,    setShowLabel]    = useState(false)
  const [muted,        setMuted]        = useState(false)
  const [recording,    setRecording]    = useState(false)
  const [waveformColor, setWaveformColor] = useState<ClipProps['waveformColor']>('ink')
  const [colorKey,     setColorKey]     = useState('var(--track-color-3)')

  const peaks = useMemo(() => makePeaks(500), [])

  const trackColors = [
    { label: 'Track 1 (warm)',   value: 'var(--track-color-1)' },
    { label: 'Track 2 (green)',  value: 'var(--track-color-2)' },
    { label: 'Track 3 (blue)',   value: 'var(--track-color-3)' },
    { label: 'Track 4 (purple)', value: 'var(--track-color-4)' },
    { label: 'Track 5 (yellow)', value: 'var(--track-color-5)' },
    { label: 'Track 6 (red)',    value: 'var(--track-color-6)' },
    { label: 'Accent',           value: 'var(--accent)'        },
    { label: 'Accent green',     value: 'var(--accent-green)'  },
  ]

  const toggles: [string, boolean, (v: boolean) => void][] = [
    ['recording', recording, setRecording],
    ['selected',  selected,  setSelected],
    ['showLabel', showLabel, setShowLabel],
    ['muted',     muted,     setMuted],
  ]

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Clip preview */}
        <div
          style={{
            width: clipWidth,
            height: clipHeight,
            background: 'var(--arrange-bg)',
            borderRadius: '3px',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Clip
            peaks={peaks}
            color={colorKey}
            waveformColor={waveformColor}
            state={recording ? 'recording' : 'recorded'}
            selected={selected}
            showLabel={showLabel}
            label="Electric Guitar"
            muted={muted}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Faders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={labelStyle}>
              width: {Math.round(clipWidth)} px
              <div style={{ marginTop: 'var(--space-1)' }}>
                <Fader value={clipWidth} onChange={setClipWidth}
                  min={20} max={500} orientation="horizontal" aria-label="Clip width" />
              </div>
            </label>
            <label style={labelStyle}>
              height: {Math.round(clipHeight)} px
              <div style={{ marginTop: 'var(--space-1)' }}>
                <Fader value={clipHeight} onChange={setClipHeight}
                  min={24} max={120} orientation="horizontal" aria-label="Clip height" />
              </div>
            </label>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {toggles.map(([name, val, set]) => (
              <Checkbox key={name} checked={val} onChange={v => set(v)} size="sm" label={name} />
            ))}
          </div>

          {/* Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={labelStyle}>
              waveformColor
              <select value={waveformColor}
                onChange={e => setWaveformColor(e.target.value as ClipProps['waveformColor'])}
                style={selectStyle}>
                <option value="ink">ink (default — neutral contrast)</option>
                <option value="track">track (colored waveform)</option>
              </select>
            </label>
            <label style={labelStyle}>
              color
              <select value={colorKey} onChange={e => setColorKey(e.target.value)} style={selectStyle}>
                {trackColors.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', margin: 0 }}>
          Drag width → 80 px (narrow), 40 px (sliver), 400 px+ (line waveform at ultra-wide zoom).
          Toggle waveformColor to compare ink vs track.
        </p>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function ClipDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
