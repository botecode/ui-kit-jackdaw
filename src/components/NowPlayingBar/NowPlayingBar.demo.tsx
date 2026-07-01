// src/components/NowPlayingBar/NowPlayingBar.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { Fader } from '../Fader'
import { NowPlayingBar } from './NowPlayingBar'

export const meta: DemoMeta = {
  name: 'NowPlayingBar',
  group: 'Composites',
  route: '/now-playing-bar',
  order: 37,
}

const noop = () => {}

// A tiny inline cover — a warm gradient + initial — so the gallery needs no asset.
function cover(hue: string, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${hue}'/><stop offset='1' stop-color='#1c140e'/>
    </linearGradient></defs>
    <rect width='120' height='120' fill='url(#g)'/>
    <text x='50%' y='58%' font-family='sans-serif' font-size='64' font-weight='700'
      fill='rgba(255,255,255,0.92)' text-anchor='middle'>${label}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const COVER_A = cover('#e8a87c', 'G')
const COVER_B = cover('#7eb8d4', 'S')

// The bar is meant to be pinned full-width to the app's bottom edge — the box just
// gives it a width to be robust across in the static grid.
function Box({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '100%' }}>{children}</div>
}

// ─── States ─────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — paused, full transport">
        <Box>
          <NowPlayingBar
            title="Golden Hour"
            subtitle="Lawer · Reference mix"
            coverUrl={COVER_A}
            isPlaying={false}
            positionSeconds={42}
            durationSeconds={194}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onShuffle={noop}
            onRepeat={noop}
          />
        </Box>
      </State>

      <State label="selected — playing, accent-lit deck">
        <Box>
          <NowPlayingBar
            title="Golden Hour"
            subtitle="Lawer · Reference mix"
            coverUrl={COVER_A}
            isPlaying
            positionSeconds={88}
            durationSeconds={194}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onShuffle={noop}
            onRepeat={noop}
          />
        </Box>
      </State>

      <State label="active — shuffle + repeat engaged, playing">
        <Box>
          <NowPlayingBar
            title="Second Wind"
            subtitle="Lawer"
            coverUrl={COVER_B}
            isPlaying
            positionSeconds={30}
            durationSeconds={156}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onShuffle={noop}
            isShuffling
            onRepeat={noop}
            isRepeating
          />
        </Box>
      </State>

      <State label="minimal — play + scrub only (no callbacks)">
        <Box>
          <NowPlayingBar
            title="Voice memo — bridge idea"
            coverColor="#c8794e"
            isPlaying={false}
            positionSeconds={12}
            durationSeconds={48}
            onPlayPause={noop}
            onSeek={noop}
          />
        </Box>
      </State>

      <State label="color-block cover — per-track spine, no art">
        <Box>
          <NowPlayingBar
            title="Untitled sketch 4"
            subtitle="Scratch"
            coverColor="#4e88c8"
            isPlaying
            positionSeconds={20}
            durationSeconds={73}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
          />
        </Box>
      </State>

      <State label="placeholder cover — no art, no color">
        <Box>
          <NowPlayingBar
            title="Field recording"
            subtitle="Imported"
            isPlaying={false}
            positionSeconds={5}
            durationSeconds={210}
            onPlayPause={noop}
            onSeek={noop}
            onNext={noop}
          />
        </Box>
      </State>

      <State label="loading — unknown length (streaming / resolving)">
        <Box>
          <NowPlayingBar
            title="Live jam — take 2"
            subtitle="Streaming"
            coverUrl={COVER_B}
            isPlaying
            positionSeconds={64}
            durationSeconds={undefined}
            onPlayPause={noop}
            onPrev={noop}
            onNext={noop}
          />
        </Box>
      </State>

      <State label="empty guard — blank title → Untitled">
        <Box>
          <NowPlayingBar
            title=""
            coverColor="#8a8a8a"
            isPlaying={false}
            positionSeconds={0}
            durationSeconds={120}
            onPlayPause={noop}
            onSeek={noop}
          />
        </Box>
      </State>

      <State label="hover — hover the cover, groove and skips">
        <Box>
          <NowPlayingBar
            title="Hover Me"
            subtitle="Hover the groove + the skip buttons"
            coverUrl={COVER_A}
            isPlaying={false}
            positionSeconds={70}
            durationSeconds={194}
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onShuffle={noop}
          />
        </Box>
      </State>

      <State label="focus — seek ring (Tab to the groove)">
        <Box>
          <FocusedSeek />
        </Box>
      </State>

      <State label="sm size">
        <Box>
          <NowPlayingBar
            title="Pocket Bar"
            subtitle="Lawer"
            coverUrl={COVER_B}
            isPlaying
            positionSeconds={20}
            durationSeconds={120}
            size="sm"
            onPlayPause={noop}
            onSeek={noop}
            onPrev={noop}
            onNext={noop}
            onShuffle={noop}
            isShuffling
            onRepeat={noop}
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
    ref.current?.querySelector<HTMLElement>('[data-testid="nowplayingbar-track"]')?.focus()
  }, [])
  return (
    <div ref={ref}>
      <NowPlayingBar
        title="Tab Target"
        subtitle="Lawer"
        coverUrl={COVER_A}
        isPlaying={false}
        positionSeconds={97}
        durationSeconds={194}
        onPlayPause={noop}
        onSeek={noop}
        onPrev={noop}
        onNext={noop}
      />
    </div>
  )
}

// ─── Playground (dogfooded kit controls) ────────────────────────────────────────

const DURATION = 194

function PlaygroundDemo() {
  const [playing, setPlaying] = useState(false)
  const [full, setFull] = useState(true)
  const [extras, setExtras] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [compact, setCompact] = useState(false)
  const [coverB, setCoverB] = useState(false)
  const [position, setPosition] = useState(42)
  const [shuffling, setShuffling] = useState(false)
  const [repeating, setRepeating] = useState(false)
  const [log, setLog] = useState('idle')

  // Roll the position forward while "playing" — the host owns the clock; the bar
  // only renders positionSeconds (golden rule #1: audio is native).
  useEffect(() => {
    if (!playing || streaming) return
    const id = window.setInterval(() => {
      setPosition(p => (p >= DURATION ? 0 : p + 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [playing, streaming])

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
        <div style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <NowPlayingBar
            title="Golden Hour"
            subtitle={full ? 'Lawer · Reference mix' : 'Lawer'}
            coverUrl={coverB ? COVER_B : COVER_A}
            isPlaying={playing}
            positionSeconds={position}
            durationSeconds={streaming ? undefined : DURATION}
            size={compact ? 'sm' : 'md'}
            onPlayPause={() => {
              setPlaying(p => !p)
              setLog(playing ? 'pause' : 'play')
            }}
            onSeek={s => {
              setPosition(s)
              setLog(`seek → ${s.toFixed(0)}s`)
            }}
            onPrev={full ? () => setLog('prev') : undefined}
            onNext={full ? () => setLog('next') : undefined}
            onShuffle={extras ? next => { setShuffling(next); setLog(`shuffle ${next ? 'on' : 'off'}`) } : undefined}
            isShuffling={shuffling}
            onRepeat={extras ? next => { setRepeating(next); setLog(`repeat ${next ? 'on' : 'off'}`) } : undefined}
            isRepeating={repeating}
          />
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          last intent: {log}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={full} onChange={setFull} aria-label="Prev / next" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Prev / next</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={extras} onChange={setExtras} aria-label="Shuffle + repeat" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Shuffle + repeat</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={streaming} onChange={setStreaming} aria-label="Unknown length" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Unknown length</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={coverB} onChange={setCoverB} aria-label="Swap cover" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Swap cover</span>
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

export default function NowPlayingBarDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
