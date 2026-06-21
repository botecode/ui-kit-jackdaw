import { useState } from 'react'
import { Waveform, MusicNote, Equalizer, Rows, GridFour, List } from '@phosphor-icons/react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlOption } from './SegmentedControl'

export const meta: DemoMeta = {
  name: 'SegmentedControl',
  group: 'Primitives',
  route: '/segmented-control',
  order: 17,
}

// ── Option sets used across multiple states ───────────────────────────────────

const DIV_OPTS: SegmentedControlOption[] = [
  { value: '1/4',  label: '1/4' },
  { value: '1/8',  label: '1/8' },
  { value: '1/16', label: '1/16' },
]

const ICON_OPTS: SegmentedControlOption[] = [
  { value: 'audio', icon: <Waveform size={14} /> },
  { value: 'midi',  icon: <MusicNote size={14} /> },
  { value: 'fx',    icon: <Equalizer size={14} /> },
]

const ICON_LABEL_OPTS: SegmentedControlOption[] = [
  { value: 'audio', icon: <Waveform size={12} />, label: 'Audio' },
  { value: 'midi',  icon: <MusicNote size={12} />, label: 'MIDI' },
]

const VIEW_OPTS: SegmentedControlOption[] = [
  { value: 'list',   icon: <List size={14} /> },
  { value: 'rows',   icon: <Rows size={14} /> },
  { value: 'grid',   icon: <GridFour size={14} /> },
]

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}

  return (
    <StatesGrid>
      {/* 2 options */}
      <State label="2 opts — first">
        <SegmentedControl
          options={[{ value: 'bars', label: 'Bars' }, { value: 'beats', label: 'Beats' }]}
          value="bars"
          onChange={noop}
          aria-label="Timeline unit"
        />
      </State>
      <State label="2 opts — second">
        <SegmentedControl
          options={[{ value: 'bars', label: 'Bars' }, { value: 'beats', label: 'Beats' }]}
          value="beats"
          onChange={noop}
          aria-label="Timeline unit"
        />
      </State>

      {/* 3 options */}
      <State label="3 opts — first">
        <SegmentedControl options={DIV_OPTS} value="1/4" onChange={noop} aria-label="Grid division" />
      </State>
      <State label="3 opts — middle">
        <SegmentedControl options={DIV_OPTS} value="1/8" onChange={noop} aria-label="Grid division" />
      </State>
      <State label="3 opts — last">
        <SegmentedControl options={DIV_OPTS} value="1/16" onChange={noop} aria-label="Grid division" />
      </State>

      {/* 4 options */}
      <State label="4 opts">
        <SegmentedControl
          options={[
            { value: '1/4',  label: '1/4' },
            { value: '1/8',  label: '1/8' },
            { value: '1/16', label: '1/16' },
            { value: '1/32', label: '1/32' },
          ]}
          value="1/8"
          onChange={noop}
          aria-label="Grid division"
        />
      </State>

      {/* Icons only */}
      <State label="Icons only">
        <SegmentedControl options={ICON_OPTS} value="midi" onChange={noop} aria-label="Track type" />
      </State>

      {/* Icon + label */}
      <State label="Icon + label">
        <SegmentedControl options={ICON_LABEL_OPTS} value="audio" onChange={noop} aria-label="Track type" />
      </State>

      {/* View switcher icons */}
      <State label="View switcher">
        <SegmentedControl options={VIEW_OPTS} value="rows" onChange={noop} aria-label="View mode" />
      </State>

      {/* Small size */}
      <State label="sm — 3 opts">
        <SegmentedControl options={DIV_OPTS} value="1/8" onChange={noop} size="sm" aria-label="Grid division" />
      </State>

      {/* Small icons */}
      <State label="sm — icons">
        <SegmentedControl
          options={[
            { value: 'audio', icon: <Waveform size={12} /> },
            { value: 'midi',  icon: <MusicNote size={12} /> },
            { value: 'fx',    icon: <Equalizer size={12} /> },
          ]}
          value="audio"
          onChange={noop}
          size="sm"
          aria-label="Track type"
        />
      </State>

      {/* Disabled */}
      <State label="Disabled">
        <SegmentedControl options={DIV_OPTS} value="1/4" onChange={noop} disabled aria-label="Grid division" />
      </State>

      {/* Focused */}
      <State label="Focus">
        <SegmentedControl options={DIV_OPTS} value="1/8" onChange={noop} autoFocus aria-label="Grid division" />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [division, setDivision] = useState('1/8')
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)
  const [mode, setMode] = useState<'text' | 'icon' | 'both'>('text')

  const textOpts: SegmentedControlOption[] = [
    { value: '1/4',  label: '1/4' },
    { value: '1/8',  label: '1/8' },
    { value: '1/16', label: '1/16' },
    { value: '1/32', label: '1/32' },
  ]

  const iconSize = size === 'sm' ? 12 : 14
  const iconOpts: SegmentedControlOption[] = [
    { value: 'audio', icon: <Waveform size={iconSize} /> },
    { value: 'midi',  icon: <MusicNote size={iconSize} /> },
    { value: 'fx',    icon: <Equalizer size={iconSize} /> },
  ]

  const bothOpts: SegmentedControlOption[] = [
    { value: 'audio', icon: <Waveform size={iconSize} />, label: 'Audio' },
    { value: 'midi',  icon: <MusicNote size={iconSize} />, label: 'MIDI' },
    { value: 'fx',    icon: <Equalizer size={iconSize} />, label: 'FX' },
  ]

  const opts = mode === 'text' ? textOpts : mode === 'icon' ? iconOpts : bothOpts
  const liveValue =
    mode === 'text'
      ? (textOpts.find(o => o.value === division) ? division : '1/8')
      : mode === 'icon'
        ? (iconOpts.find(o => o.value === division) ? division : 'audio')
        : (bothOpts.find(o => o.value === division) ? division : 'audio')

  function handleChange(v: string) {
    setDivision(v)
  }

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
        {/* Live instance */}
        <SegmentedControl
          options={opts}
          value={liveValue}
          onChange={handleChange}
          size={size}
          disabled={disabled}
          aria-label="Playground segmented control"
        />

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle checked={disabled} onChange={v => setDisabled(v)} size="sm" label="disabled" />

          <div style={labelStyle}>
            size
            <SegmentedControl
              options={[{ value: 'md', label: 'md' }, { value: 'sm', label: 'sm' }]}
              value={size}
              onChange={v => setSize(v as 'sm' | 'md')}
              size="sm"
              aria-label="Size"
            />
          </div>

          <div style={labelStyle}>
            content
            <SegmentedControl
              options={[
                { value: 'text', label: 'text' },
                { value: 'icon', label: 'icon' },
                { value: 'both', label: 'icon+lbl' },
              ]}
              value={mode}
              onChange={v => setMode(v as typeof mode)}
              size="sm"
              aria-label="Content mode"
            />
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function SegmentedControlDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
