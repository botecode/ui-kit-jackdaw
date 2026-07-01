import { useCallback, useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell }        from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }        from '../../gallery/ui/Playground'
import { TransportButton }   from '../TransportButton'
import { Fader }             from '../Fader'
import { Playhead }          from '../Playhead'
import { EditCursor }        from './EditCursor'

export const meta: DemoMeta = {
  name:  'EditCursor',
  group: 'Primitives',
  route: '/edit-cursor',
  order: 14,
}

// ─── Fixture clock ───────────────────────────────────────────────────────────
// Separate from setSeconds — the clock advances only during play.
// seedClock(s) sets the internal counter so the sweep starts from `s` on Play,
// not from 0. setSeconds is never called from inside this clock.

function useFixtureClock(playing: boolean) {
  const secondsRef = useRef(0)
  const getSeconds = useCallback(() => secondsRef.current, [])
  const seedClock  = useCallback((s: number) => { secondsRef.current = s }, [])

  useEffect(() => {
    if (!playing) return
    let raf: number
    let last = performance.now()
    function tick(now: number) {
      secondsRef.current += (now - last) / 1000
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return { getSeconds, seedClock }
}

// ─── Timeline backdrop (shared across states and playground) ─────────────────

const RULER_H     = 24
const LANE_H      = 48
const LANE_COUNT  = 3
const TOTAL_H     = RULER_H + LANE_H * LANE_COUNT
const TRACK_COLORS = ['var(--track-color-3)', 'var(--track-color-2)', 'var(--track-color-1)']
const DURATION    = 30

function TimelineBackdrop({
  width,
  pxPerSecond,
  onRulerClick,
}: {
  width: number
  pxPerSecond: number
  onRulerClick?: (s: number) => void
}) {
  const ticks = [0, 5, 10, 15, 20, 25, 30]

  return (
    <div style={{ position: 'relative', width, height: TOTAL_H, flexShrink: 0 }}>
      {/* Ruler */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: RULER_H,
          background: 'var(--rail-bg)',
          borderBottom: '1px solid var(--border)',
          cursor: onRulerClick ? 'col-resize' : 'default',
          overflow: 'hidden',
        }}
        onClick={onRulerClick
          ? (e) => {
              const x = e.clientX - e.currentTarget.getBoundingClientRect().left
              onRulerClick(Math.max(0, Math.min(x / pxPerSecond, DURATION)))
            }
          : undefined
        }
      >
        {ticks.map(s => {
          const x = s * pxPerSecond
          if (x > width) return null
          return (
            <div key={s} style={{ position: 'absolute', left: x, top: 0, bottom: 0, pointerEvents: 'none' }}>
              <div style={{ width: 1, height: 6, background: 'var(--border-strong)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginLeft: 2 }}>
                {s}s
              </span>
            </div>
          )
        })}
      </div>

      {/* Lanes */}
      {TRACK_COLORS.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: RULER_H + i * LANE_H, left: 0, right: 0, height: LANE_H,
          background: 'var(--arrange-bg)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            position: 'absolute', top: 4, left: 8,
            width: Math.min(60 + i * 50, width - 16), bottom: 4,
            borderRadius: 3,
            background: `color-mix(in srgb, ${color} 18%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 45%, transparent)`,
          }} />
        </div>
      ))}
    </div>
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  const W           = 260
  const pxPerSecond = 8
  const secondsToX  = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])

  // Cell 6: sweeping playhead (uses fixture clock)
  const [playing6, setPlaying6] = useState(true)
  const { getSeconds: getSecs6, seedClock: seed6 } = useFixtureClock(playing6)
  useEffect(() => { seed6(10) }, [seed6])  // start sweep from edit cursor at 10s

  // Cell 4: expose a ref to force the focus ring via data-focused attribute
  const cell4Ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const wrap = cell4Ref.current?.querySelector('[data-testid="edit-cursor-handle-wrap"]')
    if (wrap) (wrap as HTMLElement).setAttribute('data-focused', 'true')
  }, [])

  function cell(content: React.ReactNode) {
    return (
      <div style={{ position: 'relative', width: W, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
        {content}
      </div>
    )
  }

  return (
    <StatesGrid>
      {/* 1. At 0 */}
      <State label="at 0 — parked at start">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={0} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 2. Mid-timeline */}
      <State label="mid-timeline — ⅓ in (10s)">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 3. Near end */}
      <State label="near end (28s)">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={28} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 4. Focused — data-focused attr, not autoFocus (no scroll-yank) */}
      <State label="focused — ring visible (no autoFocus)">
        <div ref={cell4Ref}>
          {cell(<>
            <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
            <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
          </>)}
        </div>
      </State>

      {/* 5. Co-located / stopped — key legibility test */}
      <State label="co-located / stopped — two distinct markers, same x">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <Playhead seconds={10} getSeconds={() => 10} playing={false} secondsToX={secondsToX} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
      </State>

      {/* 7. Drilldown — caret head anchored to the ruler line, not floating
             over the clip. capOffset = RULER_H − handle height parks the ▽
             point at the ruler baseline over a colored clip body. */}
      <State label="drilldown — caret head at the ruler (capOffset), over a clip">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} capOffset={RULER_H - 9} />
        </>)}
      </State>

      {/* 6. Playing — play line sweeps, edit cursor stationary */}
      <State label="playing — play line sweeps from edit cursor (10s)">
        {cell(<>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} />
          <Playhead seconds={10} getSeconds={getSecs6} playing={playing6} secondsToX={secondsToX} />
          <EditCursor seconds={10} secondsToX={secondsToX} onSeek={() => {}} />
        </>)}
        <button
          type="button"
          onClick={() => {
            if (playing6) { setPlaying6(false); seed6(10) }
            else { seed6(10); setPlaying6(true) }
          }}
          style={{
            marginTop: 'var(--space-2)',
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
            background: 'none', border: '1px solid var(--border-strong)', borderRadius: 3,
            padding: '2px 8px', cursor: 'pointer',
          }}
        >
          {playing6 ? 'stop' : 'play'}
        </button>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────
//
// SPLIT-CURSOR CONTRACT:
//   - `seconds` = edit cursor position (frozen during play)
//   - On Play: seedClock(seconds) starts the clock from the edit cursor;
//     setSeconds is NEVER called from the clock
//   - On Stop: Playhead parks back to `seconds` (unchanged during play)
//   - Two readouts during play: "edit" (frozen) + "play" (live from clock)

function PlaygroundDemo() {
  const W = 440

  const [seconds,      setSeconds]      = useState(5)
  const [playing,      setPlaying]      = useState(false)
  const [pxPerSecond,  setPxPerSecond]  = useState(12)
  const [capOffset,    setCapOffset]    = useState(RULER_H)

  const secondsToX = useCallback((s: number) => s * pxPerSecond, [pxPerSecond])
  const { getSeconds, seedClock } = useFixtureClock(playing)

  // Live playhead position for the "play" readout — rAF-driven, separate from
  // `seconds` so the edit cursor state is never overwritten by the sweep.
  const [livePlaySecs, setLivePlaySecs] = useState(0)
  useEffect(() => {
    if (!playing) return
    let raf: number
    function tick() { setLivePlaySecs(getSeconds()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, getSeconds])

  function handlePlay() {
    seedClock(seconds)  // seed from edit cursor before starting sweep
    setPlaying(true)
  }

  function handleStop() {
    setPlaying(false)
    // Playhead.seconds = seconds (unchanged during play) — no explicit park needed
  }

  function handleSeek(s: number) {
    setSeconds(Math.max(0, Math.min(s, DURATION)))
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Timeline */}
        <div style={{ position: 'relative', width: W, height: TOTAL_H, overflow: 'hidden', borderRadius: 3 }}>
          <TimelineBackdrop width={W} pxPerSecond={pxPerSecond} onRulerClick={handleSeek} />
          <Playhead
            seconds={seconds}
            getSeconds={getSeconds}
            playing={playing}
            secondsToX={secondsToX}
          />
          <EditCursor
            seconds={seconds}
            secondsToX={secondsToX}
            durationSeconds={DURATION}
            onSeek={handleSeek}
            capOffset={capOffset}
          />
        </div>

        {/* Transport */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <TransportButton
            variant="play"
            playing={playing}
            onClick={playing ? handleStop : handlePlay}
          />
          <TransportButton variant="stop" onClick={handleStop} />

          {/* Two readouts — show the split during play */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              edit: <span style={{ color: 'var(--text)' }}>{seconds.toFixed(2)}s</span>
            </span>
            {playing && (
              <span style={{ color: 'var(--text-muted)' }}>
                play: <span style={{ color: 'var(--led-orange)' }}>{livePlaySecs.toFixed(2)}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Zoom fader */}
        <label style={labelStyle}>
          zoom: {pxPerSecond} px/s
          <div style={{ marginTop: 'var(--space-1)' }}>
            <Fader
              value={pxPerSecond}
              onChange={setPxPerSecond}
              min={4}
              max={40}
              orientation="horizontal"
              aria-label="Zoom px/s"
            />
          </div>
        </label>

        {/* Caret head offset — align the ▽ to the host ruler line */}
        <label style={labelStyle}>
          caret head offset: {capOffset}px
          <div style={{ marginTop: 'var(--space-1)' }}>
            <Fader
              value={capOffset}
              onChange={setCapOffset}
              min={0}
              max={40}
              orientation="horizontal"
              aria-label="Caret head offset px"
            />
          </div>
        </label>

        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Click the ruler or drag the caret to place the edit cursor.
          The cursor is orange (dashed, thin, no glow) so it stays findable over
          colored clips without clashing with the solid glowing play line.
          "Caret head offset" anchors the ▽ to the ruler line — set it to your
          host's ruler height so the head never floats down onto a clip.
          Play sweeps the play line <em>from</em> the caret; Stop returns it.
          "edit" readout stays frozen during play — "play" shows the live sweep.
          Arrow/Page keys nudge the caret while focused.
        </p>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function EditCursorDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
