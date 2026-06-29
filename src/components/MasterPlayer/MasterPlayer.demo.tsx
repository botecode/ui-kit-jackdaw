// src/components/MasterPlayer/MasterPlayer.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { Fader } from '../Fader'
import { MasterPlayer } from './MasterPlayer'

export const meta: DemoMeta = {
  name: 'MasterPlayer',
  group: 'Composites',
  route: '/master-player',
  order: 36,
}

const noop = () => {}

// A tiny inline cover — a warm gradient + initial — so the gallery needs no asset.
function cover(hue: string, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${hue}'/><stop offset='1' stop-color='#1c140e'/>
    </linearGradient></defs>
    <rect width='160' height='160' fill='url(#g)'/>
    <text x='50%' y='56%' font-family='sans-serif' font-size='84' font-weight='700'
      fill='rgba(255,255,255,0.92)' text-anchor='middle'>${label}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const COVER_A = cover('#e8a87c', 'G')
const COVER_B = cover('#7eb8d4', 'M')

function Box({ children, width = 360 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── States ─────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — single, paused">
        <Box>
          <MasterPlayer
            title="Golden Hour"
            subtitle="Master"
            coverSrc={COVER_A}
            isPlaying={false}
            positionSeconds={42}
            durationSeconds={194}
            onPlayPause={noop}
            onSeek={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="selected — playing, lit accent">
        <Box>
          <MasterPlayer
            title="Golden Hour"
            subtitle="Master"
            coverSrc={COVER_A}
            isPlaying
            positionSeconds={88}
            durationSeconds={194}
            onPlayPause={noop}
            onSeek={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="playlist — prev/next shown">
        <Box>
          <MasterPlayer
            title="Second Wind"
            subtitle="Lawer · Master"
            coverSrc={COVER_B}
            isPlaying
            positionSeconds={30}
            durationSeconds={156}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="playlist — head (prev disabled)">
        <Box>
          <MasterPlayer
            title="Opening Track"
            subtitle="Track 1 of 9"
            coverSrc={COVER_B}
            isPlaying={false}
            positionSeconds={0}
            durationSeconds={156}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            canPrev={false}
          />
        </Box>
      </State>

      <State label="active — playlist tail (next disabled)">
        <Box>
          <MasterPlayer
            title="Closing Track"
            subtitle="Track 9 of 9"
            coverSrc={COVER_A}
            isPlaying={false}
            positionSeconds={150}
            durationSeconds={156}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            canNext={false}
          />
        </Box>
      </State>

      <State label="loading — rendering (no duration)">
        <Box>
          <MasterPlayer
            title="Fresh Bounce"
            subtitle="Master"
            coverSrc={COVER_B}
            isPlaying={false}
            positionSeconds={0}
            durationSeconds={undefined}
            onPlayPause={noop}
            onSeek={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="error — master unavailable">
        <Box>
          <MasterPlayer
            title="Lost Take"
            subtitle="Master"
            isPlaying={false}
            positionSeconds={0}
            errorText="Master unavailable"
            onPlayPause={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="empty — nothing queued">
        <Box>
          <MasterPlayer
            title=""
            isPlaying={false}
            positionSeconds={0}
            onPlayPause={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="hover — cover affordance + thumb">
        <Box>
          <MasterPlayer
            title="Hover Me"
            subtitle="Hover the cover and the groove"
            coverSrc={COVER_A}
            isPlaying={false}
            positionSeconds={70}
            durationSeconds={194}
            onPlayPause={noop}
            onSeek={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="focus — seek ring (Tab to the groove)">
        <Box>
          <FocusedSeek />
        </Box>
      </State>

      <State label="disabled — whole player held">
        <Box>
          <MasterPlayer
            title="Golden Hour"
            subtitle="Master"
            coverSrc={COVER_A}
            isPlaying={false}
            positionSeconds={42}
            durationSeconds={194}
            disabled
            onPlayPause={noop}
            onSeek={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>

      <State label="sm size">
        <Box width={320}>
          <MasterPlayer
            title="Pocket Master"
            subtitle="Master"
            coverSrc={COVER_B}
            isPlaying
            positionSeconds={20}
            durationSeconds={120}
            size="sm"
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onCoverClick={noop}
          />
        </Box>
      </State>
    </StatesGrid>
  )
}

/** Auto-focuses the seek groove so the focus ring is visible in the static grid. */
function FocusedSeek() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-testid="masterplayer-track"]')?.focus()
  }, [])
  return (
    <div ref={ref}>
      <MasterPlayer
        title="Tab Target"
        subtitle="Master"
        coverSrc={COVER_A}
        isPlaying={false}
        positionSeconds={97}
        durationSeconds={194}
        onPlayPause={noop}
        onSeek={noop}
      />
    </div>
  )
}

// ─── Playground (dogfooded kit controls) ────────────────────────────────────────

const DURATION = 194

function PlaygroundDemo() {
  const [playing, setPlaying] = useState(false)
  const [playlist, setPlaylist] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [compact, setCompact] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [position, setPosition] = useState(42)
  const [coverB, setCoverB] = useState(false)
  const [log, setLog] = useState('idle')

  // Roll the position forward while "playing" — the host owns the clock; the
  // player only renders positionSeconds (golden rule #1: audio is native).
  useEffect(() => {
    if (!playing || rendering || disabled) return
    const id = window.setInterval(() => {
      setPosition(p => (p >= DURATION ? 0 : p + 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [playing, rendering, disabled])

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
        <Box width={440}>
          <MasterPlayer
            title="Golden Hour"
            subtitle={playlist ? 'Lawer · Master' : 'Master'}
            coverSrc={coverB ? COVER_B : COVER_A}
            isPlaying={playing}
            positionSeconds={position}
            durationSeconds={rendering ? undefined : DURATION}
            disabled={disabled}
            size={compact ? 'sm' : 'md'}
            onPlayPause={() => {
              setPlaying(p => !p)
              setLog(playing ? 'pause' : 'play')
            }}
            onSeek={s => {
              setPosition(s)
              setLog(`seek → ${s.toFixed(0)}s`)
            }}
            onPrev={playlist ? () => setLog('prev') : undefined}
            onNext={playlist ? () => setLog('next') : undefined}
            onCoverClick={() => {
              setCoverB(c => !c)
              setLog('cover')
            }}
          />
        </Box>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          last intent: {log}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={playlist} onChange={setPlaylist} aria-label="Playlist mode" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Playlist mode</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={rendering} onChange={setRendering} aria-label="Rendering" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Rendering (no duration)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={disabled} onChange={setDisabled} aria-label="Disabled" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Disabled</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Scrub position</span>
            <Fader
              value={position}
              min={0}
              max={DURATION}
              onChange={setPosition}
              orientation="horizontal"
              aria-label="Scrub position"
            />
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function MasterPlayerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
