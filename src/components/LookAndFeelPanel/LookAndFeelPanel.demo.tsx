// src/components/LookAndFeelPanel/LookAndFeelPanel.demo.tsx
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { THEMES } from '../../tokens/themes'
import { useTheme } from '../../theme/ThemeProvider'
import { LookAndFeelPanel } from './LookAndFeelPanel'

export const meta: DemoMeta = {
  name: 'LookAndFeelPanel',
  group: 'Composites',
  route: '/look-and-feel-panel',
  order: 60,
}

// ── State cards ───────────────────────────────────────────────────────────────

function DefaultGallery() {
  return (
    <State label="Gallery — Chroma selected">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 6)}
        active="chroma"
        onSelect={() => {}}
      />
    </State>
  )
}

function OtherSelected() {
  return (
    <State label="Nocturne selected">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 6)}
        active="nocturne"
        onSelect={() => {}}
      />
    </State>
  )
}

function DarkThemeSelected() {
  return (
    <State label="Bowie selected (dark theme)">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 6)}
        active="bowie"
        onSelect={() => {}}
      />
    </State>
  )
}

function ScrollState() {
  return (
    <State label="Scroll — all 15 themes">
      <LookAndFeelPanel
        themes={THEMES}
        active="chroma"
        onSelect={() => {}}
      />
    </State>
  )
}

function SingleTheme() {
  return (
    <State label="Single theme">
      <LookAndFeelPanel
        themes={THEMES.slice(0, 1)}
        active="chroma"
        onSelect={() => {}}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <DefaultGallery />
      <OtherSelected />
      <DarkThemeSelected />
      <ScrollState />
      <SingleTheme />
    </StatesGrid>
  )
}

// ── Playground — live theme switching ────────────────────────────────────────

function PlaygroundDemo() {
  const { theme, setTheme } = useTheme()
  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <LookAndFeelPanel
          themes={THEMES}
          active={theme}
          onSelect={setTheme}
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
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function LookAndFeelPanelDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
