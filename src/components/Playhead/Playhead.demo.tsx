// src/components/Playhead/Playhead.demo.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { TransportButton } from '../TransportButton'
import { Fader } from '../Fader'
import { Checkbox } from '../Checkbox'
import { Playhead } from './Playhead'

export const meta: DemoMeta = {
  name: 'Playhead',
  group: 'Primitives',
  route: '/playhead',
  order: 9,
}

// ─── Fixture clock hook ───────────────────────────────────────────────────────
//
// No setState inside the rAF tick — zero Playhead re-renders while playing.
// getSeconds is a stable callback (never changes reference).
// resetClock is called by the stop handler so next Play restarts from 0.

function useFixtureClock(playing: boolean, loopEnd = 30) {
  const secondsRef = useRef(0)
  const getSeconds = useCallback(() => secondsRef.current, [])
  const resetClock = useCallback(() => { secondsRef.current = 0 }, [])

  useEffect(() => {
    if (!playing) return
    let raf: number, last = performance.now()
    function tick(now: number) {
      secondsRef.current = (secondsRef.current + (now - last) / 1000) % loopEnd
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, loopEnd])

  return { getSeconds, resetClock }
}

// ─── Timeline backdrop ────────────────────────────────────────────────────────
// Fake ruler + lanes. containerWidth drives secondsToX for a 30-second project.

const RULER_H     = 24
const LANE_H      = 48
const LANE_COUNT  = 3
const TOTAL_H     = RULER_H + LANE_H * LANE_COUNT
const TRACK_COLORS = [
  'var(--track-color-3)',
  'var(--track-color-2)',
  'var(--track-color-1)',
]

function TimelineBackdrop({
  width,
  pxPerSecond,
  onSeek,
}: {
  width: number
  pxPerSecond: number
  onSeek: (s: number) => void
}) {
  const tickSeconds = [0, 4, 8, 12, 16, 20, 24, 28]

  return (
    <div
      style={{
        position: 'relative',
        width,
        height: TOTAL_H,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Ruler */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: RULER_H,
          background: 'var(--rail-bg)',
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          onSeek((e.clientX - rect.left) / pxPerSecond)
        }}
      >
        {tickSeconds.map(s => {
          const x = s * pxPerSecond
          if (x > width) return null
          return (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: x,
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                pointerEvents: 'none',
              }}
            >
              <div style={{ width: 1, height: 8, background: 'var(--border-strong)' }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-dim)',
                marginTop: 2,
                marginLeft: 2,
              }}>
                {s}s
              </span>
            </div>
          )
        })}
      </div>

      {/* Lanes */}
      {TRACK_COLORS.map((color, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: RULER_H + i * LANE_H,
            left: 0,
            right: 0,
            height: LANE_H,
            background: 'var(--arrange-bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Mock clip block */}
          <div style={{
            position: 'absolute',
            top: 4,
            left: 8,
            width: Math.min(80 + i * 40, width - 16),
            bottom: 4,
            borderRadius: 3,
            background: `color-mix(in srgb, ${color} 18%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)`,
          }} />
        </div>
      ))}
    </div>
  )
}

// ─── States: self-contained sweeping cells ────────────────────────────────────

function SweepingCell({ recording = false, label }: { recording?: boolean; label: string }) {
  const [playing, setPlaying] = useState(true)
  const { getSeconds, resetClock } = useFixtureClock(playing)
  const pxPerSecond = 14
  const secondsToX = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])

  return (
    <State label={label}>
      <div style={{ position: 'relative', width: 260, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
        <TimelineBackdrop width={260} pxPerSecond={pxPerSecond} onSeek={() => {}} />
        <Playhead
          seconds={0}
          getSeconds={getSeconds}
          playing={playing}
          recording={recording}
          secondsToX={secondsToX}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (playing) { setPlaying(false); resetClock() }
          else setPlaying(true)
        }}
        style={{
          marginTop: 'var(--space-2)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          background: 'none',
          border: '1px solid var(--border-strong)',
          borderRadius: '3px',
          padding: '2px 8px',
          cursor: 'pointer',
        }}
      >
        {playing ? 'stop' : 'play'}
      </button>
    </State>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  const pxPerSecond = 14
  const secondsToX = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])

  return (
    <StatesGrid>
      <State label="stopped — parked at 4s">
        <div style={{ position: 'relative', width: 260, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
          <TimelineBackdrop width={260} pxPerSecond={pxPerSecond} onSeek={() => {}} />
          <Playhead seconds={4} getSeconds={() => 4} playing={false} secondsToX={secondsToX} />
        </div>
      </State>

      <SweepingCell label="playing — sweeping (30s loop)" />

      <SweepingCell recording label="recording — red tint" />

      <State label="near end of project — parked at 28s">
        <div style={{ position: 'relative', width: 260, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
          <TimelineBackdrop width={260} pxPerSecond={pxPerSecond} onSeek={() => {}} />
          <Playhead seconds={28} getSeconds={() => 28} playing={false} secondsToX={secondsToX} />
        </div>
      </State>

      <SweepingCell label="reduced-motion — functional motion kept (verify in OS settings)" />
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const CONTAINER_W = 400

  const [playing, setPlaying]     = useState(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds]     = useState(0)       // park / push channel
  const [pxPerSecond, setPxPerSecond] = useState(14)

  const { getSeconds, resetClock } = useFixtureClock(playing)

  // secondsToX memoized — identity-stable so the park effect only re-fires on zoom changes,
  // not on every render. This is the required usage pattern documented in the prop JSDoc.
  const secondsToX = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])

  function handlePlay()  { setPlaying(true) }
  function handleStop()  {
    // Park channel exercised: both setSeconds(0) and resetClock() fire on Stop.
    setPlaying(false)
    setSeconds(0)
    resetClock()
  }
  function handleSeek(s: number) {
    // Works seek-while-stopped AND seek-while-playing.
    setSeconds(Math.max(0, Math.min(s, 30)))
  }

  // Display seconds — the ONE place that reads position for display, via park channel only.
  const [displaySeconds, setDisplaySeconds] = useState(0)
  useEffect(() => { setDisplaySeconds(seconds) }, [seconds])

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Timeline — ruler is clickable to seek */}
        <div style={{ position: 'relative', width: CONTAINER_W, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
          <TimelineBackdrop width={CONTAINER_W} pxPerSecond={pxPerSecond} onSeek={handleSeek} />
          <Playhead
            seconds={seconds}
            getSeconds={getSeconds}
            playing={playing}
            recording={recording}
            secondsToX={secondsToX}
          />
        </div>

        {/* Transport + readout */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <TransportButton
            variant="play"
            playing={playing}
            onClick={playing ? handleStop : handlePlay}
          />
          <TransportButton variant="stop" onClick={handleStop} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', minWidth: '6ch' }}>
            {displaySeconds.toFixed(2)}s
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Zoom fader */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label style={labelStyle}>
              zoom: {pxPerSecond} px/s
              <div style={{ marginTop: 'var(--space-1)' }}>
                <Fader
                  value={pxPerSecond}
                  onChange={setPxPerSecond}
                  min={4}
                  max={50}
                  orientation="horizontal"
                  aria-label="Zoom px/s"
                />
              </div>
            </label>
          </div>

          {/* Recording toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Checkbox
              checked={recording}
              onChange={(v) => setRecording(v)}
              size="sm"
              label="recording"
            />
          </div>
        </div>

        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Click the ruler to seek — works while stopped and while playing.
          Stop returns to 0 via the park channel. Zoom adjusts px/s projection live.
        </p>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function PlayheadDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
