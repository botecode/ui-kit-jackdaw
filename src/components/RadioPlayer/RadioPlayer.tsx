// src/components/RadioPlayer/RadioPlayer.tsx
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { SkipForward } from '@phosphor-icons/react'
import { TransportButton } from '../TransportButton'
import { layoutText, GLYPH_PLAY, GLYPH_PAUSE, GLYPH_SKIP } from './radioFont'
import styles from './RadioPlayer.module.css'

// ─── Contract ──────────────────────────────────────────────────────────────────

export interface RadioTrack {
  /** Stable id (the idea's id in the app). */
  id: string
  /** Idea title — shown in the dot-matrix readout (upper-cased). */
  title: string
  /** Total length in seconds. Optional — display shows elapsed regardless. */
  duration?: number
  /** Optional small sub-label (e.g. an idea tag). Reserved for the app surface. */
  artist?: string
}

export interface RadioPlayerProps {
  /** The rotation of ideas the station loops through. */
  tracks: RadioTrack[]
  /** Index of the idea now on air (host/store owned). */
  index: number
  /** Whether the station is rolling. */
  playing: boolean
  /** Seconds elapsed into the current idea (host clock). Default 0. */
  elapsed?: number
  size?: 'sm' | 'md'
  disabled?: boolean
  /** User pressed play/pause — receives the next desired playing state. */
  onPlayPause?: (playing: boolean) => void
  /** User pressed next — skip to the next idea. */
  onNext?: () => void
}

// ─── Readout geometry per size ───────────────────────────────────────────────────
// pitch = dot cell stride (px); dot = lit/dim dot diameter (px). The time line is
// the largest — it's the glanceable centre of the panel.

interface LineGeom { pitch: number; dot: number }
interface SizeGeom { status: LineGeom; time: LineGeom; title: LineGeom; speed: number }

const SIZES: Record<'sm' | 'md', SizeGeom> = {
  md: { status: { pitch: 3, dot: 2.2 }, time: { pitch: 4, dot: 3 }, title: { pitch: 3, dot: 2.2 }, speed: 34 },
  sm: { status: { pitch: 2.4, dot: 1.8 }, time: { pitch: 3, dot: 2.2 }, title: { pitch: 2.4, dot: 1.8 }, speed: 28 },
}

// ─── Time formatting ──────────────────────────────────────────────────────────

const NO_SIGNAL_TIME = '-:--'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── Reduced-motion (inline — the kit has no shared hook) ────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// ─── MatrixLine — one row of the LED readout, rendered as dots ───────────────────
// One SVG: a single rect painted with an off-dot <pattern> gives the full dim grid
// (1 node, perfectly aligned), lit cells ride on top in --led-green. When `fluid`
// and the content overflows the measured window, the lit group scrolls right→left
// at a constant px/sec velocity (the LED-ticker look). Reduced motion → no scroll.

function MatrixLine({
  text,
  geom,
  fluid = false,
  speed = 34,
  reduced = false,
  className,
}: {
  text: string
  geom: LineGeom
  fluid?: boolean
  speed?: number
  reduced?: boolean
  className?: string
}) {
  const rawId = useId()
  const patternId = `rp-off-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const { pitch, dot } = geom
  const { cells, cols, rows } = layoutText(text)
  const contentW = cols * pitch
  const h = rows * pitch
  const inset = (pitch - dot) / 2

  const svgRef = useRef<SVGSVGElement>(null)
  const [scroll, setScroll] = useState<{ from: number; to: number; dur: number } | null>(null)

  // Measure overflow → derive a constant-velocity loop duration. Re-measures on
  // resize where ResizeObserver exists (absent in jsdom — guarded).
  useLayoutEffect(() => {
    if (!fluid || reduced) {
      setScroll(null)
      return
    }
    const el = svgRef.current
    if (!el) return
    const measure = () => {
      const winW = el.clientWidth
      if (winW > 0 && contentW > winW + 1) {
        const distance = winW + contentW
        setScroll({ from: winW, to: -contentW, dur: distance / Math.max(1, speed) })
      } else {
        setScroll(null)
      }
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fluid, reduced, contentW, speed])

  const litStyle = scroll
    ? ({ '--rp-from': `${scroll.from}px`, '--rp-to': `${scroll.to}px`, '--rp-dur': `${scroll.dur}s` } as React.CSSProperties)
    : undefined

  return (
    <svg
      ref={svgRef}
      className={[fluid ? styles.lineFluid : styles.line, className].filter(Boolean).join(' ')}
      width={fluid ? '100%' : contentW || 1}
      height={h}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <pattern id={patternId} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <rect x={inset} y={inset} width={dot} height={dot} rx={dot / 2} className={styles.dotOff} />
        </pattern>
      </defs>

      {/* Dim off-grid — one node, fills the whole line. */}
      <rect x={0} y={0} width={fluid ? '100%' : contentW || 1} height={h} fill={`url(#${patternId})`} />

      {/* Lit cells — the message, with a group-level bloom. */}
      <g className={scroll ? styles.litScroll : styles.lit} style={litStyle}>
        {cells.map(([c, r], i) => (
          <rect
            key={i}
            x={c * pitch + inset}
            y={r * pitch + inset}
            width={dot}
            height={dot}
            rx={dot / 2}
            className={styles.dotOn}
          />
        ))}
      </g>
    </svg>
  )
}

// ─── RadioPlayer ─────────────────────────────────────────────────────────────────
//
// Why this isn't a webpage: the obvious web build is an <audio controls> bar with a
// text <span> title and a CSS spinner. This is a Walkman instead — a recessed black
// LED panel where the title, the "ON AIR" badge and the ticking time are real
// green dot-matrix (a hand-authored 5×7 font painted as dots, off-grid and all),
// long titles scroll like an LED sign, and the transport blooms the green "rolling"
// LED on incandescent timing. It carries no audio (that's DemoPlayer) — it's the
// station's *face*: a controlled now-playing view that drops onto the app store with
// zero rework and re-skins through every theme on the led-green + --stage tokens.

export function RadioPlayer({
  tracks,
  index,
  playing,
  elapsed = 0,
  size = 'md',
  disabled = false,
  onPlayPause,
  onNext,
}: RadioPlayerProps) {
  const reduced = useReducedMotion()
  const geom = SIZES[size]

  const isEmpty = tracks.length === 0
  const safeIndex = isEmpty ? -1 : ((index % tracks.length) + tracks.length) % tracks.length
  const current = safeIndex >= 0 ? tracks[safeIndex] : undefined
  const offAir = disabled || isEmpty
  const interactive = !disabled && !isEmpty

  // ── Transition flicker — fires when the idea changes (not on mount) ───────────
  const [transitioning, setTransitioning] = useState(false)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (reduced) return
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 360)
    return () => clearTimeout(t)
  }, [safeIndex, reduced])

  // ── Readout text ──────────────────────────────────────────────────────────────
  const statusText = offAir
    ? 'OFF AIR'
    : transitioning
      ? `${GLYPH_SKIP} NEXT`
      : playing
        ? `${GLYPH_PLAY} ON AIR`
        : `${GLYPH_PAUSE} PAUSED`

  const title = offAir ? 'NO SIGNAL' : (current?.title || 'UNTITLED')
  const timeText = offAir ? NO_SIGNAL_TIME : formatTime(elapsed)

  const ariaLabel = offAir
    ? 'Radio — off air'
    : `${playing ? 'On air' : 'Paused'}: ${current?.title || 'Untitled'}, ${formatTime(elapsed)}`

  function togglePlay() {
    if (!interactive) return
    onPlayPause?.(!playing)
  }
  function handleNext() {
    if (!interactive) return
    onNext?.()
  }

  return (
    <div
      className={styles.root}
      data-size={size}
      data-playing={(playing && !offAir) || undefined}
      data-transition={(transitioning && !offAir) || undefined}
      data-disabled={disabled || undefined}
      data-empty={isEmpty || undefined}
      data-testid="radioplayer-root"
    >
      {/* ── Readout panel ──────────────────────────────────────────────────────── */}
      <div
        className={styles.panel}
        data-testid="radioplayer-readout"
        role="img"
        aria-label={ariaLabel}
      >
        <span className={styles.scanline} aria-hidden="true" />

        <div className={styles.statusRow}>
          <MatrixLine text={statusText} geom={geom.status} className={styles.status} />
          <MatrixLine text={timeText} geom={geom.time} className={styles.time} />
        </div>

        <div className={styles.titleRow}>
          <MatrixLine
            text={title}
            geom={geom.title}
            fluid
            speed={geom.speed}
            reduced={reduced}
            className={styles.title}
          />
        </div>
      </div>

      {/* ── Transport ──────────────────────────────────────────────────────────── */}
      <div className={styles.transport}>
        <TransportButton
          variant="play"
          playing={playing && !offAir}
          onClick={togglePlay}
          size={size}
          disabled={!interactive}
        />

        <button
          type="button"
          className={styles.next}
          data-size={size}
          data-testid="radioplayer-next"
          aria-label="Next idea"
          disabled={!interactive}
          onClick={handleNext}
        >
          <SkipForward aria-hidden size={size === 'sm' ? 16 : 20} weight="fill" />
        </button>
      </div>
    </div>
  )
}
