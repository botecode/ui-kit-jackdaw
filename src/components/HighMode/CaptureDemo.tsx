// src/components/HighMode/CaptureDemo.tsx
//
// CaptureDemo — the "here's the magic" loop for High mode's how-it-works screen.
//
// One canvas, one rAF, a four-beat story that repeats so the core mechanic reads
// without a word:
//
//   play    — a live waveform fills in left→right, a bright head leading it
//   hold    — you stop; the head parks and a ring counts down the held beat
//   capture — a frame sweeps the played span, its bars warm bone→accent and lift
//   rest    — it sits caught and glowing, then fades and the loop restarts
//
// Decorative (aria-hidden) — the teaching copy lives in the DOM beside it. A live
// caption mirrors each beat via onCaption so the parent can voice it in an
// aria-live region. Reduced motion → a single settled "caught" frame, no rAF.
//
// Canvas 2D, colours read from CSS tokens, pauses when the tab is hidden. No library.

import { useEffect, useRef } from 'react'
import styles from './CaptureDemo.module.css'

// Beat lengths (seconds). One loop = the sum.
const PLAY = 3.0
const HOLD = 1.6
const CAP = 1.3
const REST = 1.2
const LOOP = PLAY + HOLD + CAP + REST
const TAIL = 0.32 // fade-out at the very end so the wrap isn't a hard cut
const STOP_FRAC = 0.72 // where you stop — leaves "unplayed" room on the right

// A deterministic little phrase: two swells with a groove. No randomness (so a
// settled frame is reproducible and there's no Date.now/Math.random in render).
const WAVE = ((n: number) => {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    // A substantial, always-present body (never near-silent at the edges) with a
    // mid swell, a groove, and fine detail — so the played span reads as real audio.
    const env = 0.55 + 0.45 * Math.sin(Math.PI * t) ** 0.5
    const groove = 0.6 + 0.4 * Math.abs(Math.sin(t * Math.PI * 6.5))
    const detail = 0.85 + 0.15 * Math.sin(t * Math.PI * 17)
    out.push(Math.max(0.18, Math.min(1, env * groove * detail)))
  }
  return out
})(76)

const CAPTIONS = {
  play: 'You keep playing.',
  hold: 'Like that? Just stop.',
  capture: 'High mode captures the take.',
} as const
type Beat = keyof typeof CAPTIONS

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x }
function easeOut(x: number): number { return 1 - Math.pow(1 - clamp01(x), 3) }

export interface CaptureDemoProps {
  /** Called with the caption for the current beat (only on change). */
  onCaption?: (text: string) => void
  className?: string
}

export function CaptureDemo({ onCaption, className }: CaptureDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captionRef = useRef(onCaption)
  captionRef.current = onCaption

  useEffect(() => {
    // Emit the opening caption immediately so it's deterministic (no rAF needed).
    const reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    captionRef.current?.(reduced ? CAPTIONS.capture : CAPTIONS.play)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cs = getComputedStyle(canvas)
    let bone = cs.getPropertyValue('--stage-text').trim() || '#FFF7EB'
    let accent = cs.getPropertyValue('--accent').trim() || '#EE5E2A'
    let led = cs.getPropertyValue('--led-orange').trim() || '#FA7437'
    let onAccent = cs.getPropertyValue('--accent-contrast').trim() || '#FFF7EB'
    const refreshColors = () => {
      bone = cs.getPropertyValue('--stage-text').trim() || '#FFF7EB'
      accent = cs.getPropertyValue('--accent').trim() || '#EE5E2A'
      led = cs.getPropertyValue('--led-orange').trim() || '#FA7437'
      onAccent = cs.getPropertyValue('--accent-contrast').trim() || '#FFF7EB'
    }

    let w = 0, h = 0
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)

    const n = WAVE.length
    const stopIdx = Math.round(n * STOP_FRAC)

    // mix two hex/`color()` strings isn't trivial on canvas; lean on globalAlpha +
    // layering instead. Bars draw bone, then an accent pass fades in on capture.
    const drawBars = (color: string, headPlayed: number, captured: number) => {
      const padX = w * 0.08
      const span = w - padX * 2
      const midY = h * 0.5
      const maxAmp = Math.min(h * 0.31, midY - h * 0.16)
      const barGap = span / n
      const barW = Math.max(1.5, barGap * 0.46)
      const cpE = easeOut(captured)
      const lift = cpE * h * 0.07

      for (let i = 0; i < n; i++) {
        const x = padX + (i + 0.5) * barGap
        const inSpan = i <= stopIdx
        const revealed = i <= headPlayed
        let amp: number
        let alpha: number
        if (revealed) {
          amp = WAVE[i] * maxAmp
          alpha = 1
        } else if (inSpan) {
          // not yet reached this loop — a faint stub hinting the canvas continues
          amp = WAVE[i] * maxAmp * 0.12
          alpha = 0.16
        } else {
          amp = maxAmp * 0.05
          alpha = 0.1
        }
        const y = midY - (revealed && inSpan ? lift : 0)
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        const r = Math.min(barW / 2, amp)
        roundBar(ctx, x - barW / 2, y - amp, barW, amp * 2, r)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      return { padX, span, midY, maxAmp, barGap, lift }
    }

    const render = (t: number) => {
      ctx.clearRect(0, 0, w, h)

      const tt = t % LOOP
      let beat: Beat
      let headPlayed: number
      let cp: number
      if (tt < PLAY) { beat = 'play'; headPlayed = (tt / PLAY) * stopIdx; cp = 0 }
      else if (tt < PLAY + HOLD) { beat = 'hold'; headPlayed = stopIdx; cp = 0 }
      else if (tt < PLAY + HOLD + CAP) { beat = 'capture'; headPlayed = stopIdx; cp = (tt - PLAY - HOLD) / CAP }
      else { beat = 'capture'; headPlayed = stopIdx; cp = 1 }

      let fade = 1
      if (tt > LOOP - TAIL) fade = (LOOP - tt) / TAIL
      ctx.globalAlpha = 1

      // Layer 1: the bone waveform.
      const geo = drawBars(bone, beat === 'play' ? headPlayed : stopIdx, cp)
      const { padX, barGap, midY, maxAmp, lift } = geo
      const cpE = easeOut(cp)

      // Layer 2: the accent pass over the captured span fades in on capture.
      if (cp > 0) {
        ctx.save()
        ctx.globalAlpha = fade * cpE
        drawBars(accent, stopIdx, cp)
        ctx.restore()
      }

      // The capture frame sweeps the played span, lifted with the bars.
      const x0 = padX + 0.5 * barGap - barGap * 0.5
      const xStop = padX + (stopIdx + 0.5) * barGap + barGap * 0.5
      if (cp > 0) {
        const padFrame = maxAmp * 0.3
        const top = midY - maxAmp - padFrame - lift
        const bot = midY + maxAmp + padFrame - lift
        ctx.save()
        ctx.globalAlpha = fade * cpE
        ctx.strokeStyle = accent
        ctx.lineWidth = 1.5
        roundRect(ctx, x0, top, xStop - x0, bot - top, 12)
        ctx.stroke()
        // a whisper of accent fill inside the frame
        ctx.globalAlpha = fade * cpE * 0.06
        ctx.fillStyle = accent
        roundRect(ctx, x0, top, xStop - x0, bot - top, 12)
        ctx.fill()
        ctx.restore()

        // "Caught" badge — a glowing check, pops in after the frame lands.
        const bs = easeOut(clamp01((cp - 0.4) / 0.6))
        if (bs > 0) {
          const bx = xStop
          const by = top
          const r = 12 * bs
          ctx.save()
          ctx.globalAlpha = fade
          ctx.fillStyle = accent
          ctx.shadowColor = led
          ctx.shadowBlur = 16 * bs
          ctx.beginPath()
          ctx.arc(bx, by, r, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
          // check mark — the ink that sits on accent (adapts on light/paper themes)
          ctx.strokeStyle = onAccent
          ctx.lineWidth = 2 * bs
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(bx - r * 0.42, by + r * 0.02)
          ctx.lineTo(bx - r * 0.08, by + r * 0.36)
          ctx.lineTo(bx + r * 0.46, by - r * 0.34)
          ctx.stroke()
          ctx.restore()
        }
      }

      // The playhead — a bright line leading the take while playing, parking on hold.
      if (beat === 'play' || beat === 'hold') {
        const hx = padX + (Math.min(headPlayed, stopIdx) + 0.5) * barGap
        const top = midY - maxAmp * 1.06
        const bot = midY + maxAmp * 1.06
        ctx.save()
        ctx.globalAlpha = fade * (beat === 'hold' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 4)) : 0.9)
        ctx.strokeStyle = led
        ctx.lineWidth = 1.5
        ctx.shadowColor = led
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.moveTo(hx, top)
        ctx.lineTo(hx, bot)
        ctx.stroke()
        ctx.restore()

        // Hold: a countdown ring depleting around the head → "hold for a beat".
        if (beat === 'hold') {
          const hp = (tt - PLAY) / HOLD
          ctx.save()
          ctx.globalAlpha = fade * 0.85
          ctx.strokeStyle = led
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.arc(hx, midY - maxAmp - maxAmp * 0.5, 9, -Math.PI / 2, -Math.PI / 2 + (1 - hp) * Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      }

      ctx.globalAlpha = 1
      return beat
    }

    // Caption only changes ~3× per loop — emit on transitions, not per frame.
    let lastBeat: Beat | null = reduced ? 'capture' : 'play'

    let raf = 0
    let t0 = performance.now()
    const frame = (now: number) => {
      const t = (now - t0) / 1000
      const beat = render(t)
      if (beat !== lastBeat) { lastBeat = beat; captionRef.current?.(CAPTIONS[beat]) }
      raf = requestAnimationFrame(frame)
    }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    const start = () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(frame) } }

    // No live updates under reduced motion (we render once), so don't poll colours.
    const colorTimer = reduced ? undefined : setInterval(refreshColors, 1200)

    const onVis = () => { if (document.hidden) stop(); else if (!reduced) start() }
    document.addEventListener('visibilitychange', onVis)

    if (reduced) {
      // A single settled "caught" frame.
      render(PLAY + HOLD + CAP + 0.1)
    } else {
      start()
    }

    return () => {
      stop()
      if (colorTimer) clearInterval(colorTimer)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className ? `${styles.canvas} ${className}` : styles.canvas}
      aria-hidden="true"
    />
  )
}

// ── Canvas path helpers ────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
function roundBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  roundRect(ctx, x, y, w, Math.max(h, w), r)
}
