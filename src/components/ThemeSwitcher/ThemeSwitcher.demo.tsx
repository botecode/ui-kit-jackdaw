import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { THEMES } from '../../tokens/themes'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeId } from '../../tokens/types'
import { ThemeSwitcher, type ThemeSwitcherItem } from './ThemeSwitcher'

export const meta: DemoMeta = {
  name: 'ThemeSwitcher',
  group: 'Composites',
  route: '/theme-switcher',
  order: 59,
}

// Five key tokens that together read the palette at a glance.
// Matches LookAndFeelPanel's SWATCH_KEYS: bg · surface-2 · accent · led-cyan · stage.
const THEME_ITEMS: ThemeSwitcherItem[] = THEMES.map(t => ({
  id: t.id,
  name: t.name,
  swatches: [
    t.tokens['--bg'],
    t.tokens['--surface-2'],
    t.tokens['--accent'],
    t.tokens['--led-cyan'],
    t.tokens['--stage'],
  ],
}))

// Subset for states grid so cells stay compact
const FEW = THEME_ITEMS.slice(0, 5)

// ── States ─────────────────────────────────────────────────────────────────────

function DefaultGallery() {
  return (
    <State label="Gallery — Chroma active">
      <ThemeSwitcher themes={FEW} active="chroma" onSelect={() => {}} />
    </State>
  )
}

function OtherSelected() {
  return (
    <State label="Default active">
      <ThemeSwitcher themes={FEW} active="default" onSelect={() => {}} />
    </State>
  )
}

function DarkSelected() {
  return (
    <State label="Bowie active (dark theme)">
      <ThemeSwitcher themes={FEW} active="bowie" onSelect={() => {}} />
    </State>
  )
}

function ScrollState() {
  return (
    <State label="Scroll — all 15 themes">
      <ThemeSwitcher themes={THEME_ITEMS} active="chroma" onSelect={() => {}} />
    </State>
  )
}

function NoMatchState() {
  return (
    <State label="No active match (first card is tab stop)">
      <ThemeSwitcher themes={FEW} active="__none__" onSelect={() => {}} />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <DefaultGallery />
      <OtherSelected />
      <DarkSelected />
      <ScrollState />
      <NoMatchState />
    </StatesGrid>
  )
}

// ── Playground — live theme switching ────────────────────────────────────────

function PlaygroundDemo() {
  const { theme, setTheme } = useTheme()
  const [showAll, setShowAll] = useState(true)

  const items = showAll ? THEME_ITEMS : THEME_ITEMS.slice(0, 5)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <ThemeSwitcher
          themes={items}
          active={theme}
          onSelect={id => setTheme(id as ThemeId)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={showAll}
            onChange={next => setShowAll(next)}
            size="sm"
            label="show all themes"
          />
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              margin: 0,
            }}
          >
            active: {theme}
          </p>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function ThemeSwitcherDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
