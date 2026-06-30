// src/components/FlyHighButton/CaptureTease.tsx
//
// CaptureTease — a miniature of High mode's catch, living on the Fly High doorway.
//
// The button advertises the feature by *doing* it in the corner: a gentle waveform
// plays, a head sweeps it, and every loop one span "catches" — it brightens and a
// little check badge blooms — exactly the mechanic the how-it-works screen teaches,
// shrunk to a single tasteful loop. Slow and quiet by design: it's a hero CTA, not
// a billboard. Decorative (aria-hidden); colours read from CSS so it reskins with
// the faceplate. Reduced motion → a single settled "caught" frame. Canvas 2D.

import { useEffect, useRef } from 'react'
import styles from './CaptureTease.module.css'

const PLAY = 2.4
const HOLD = 0.7
const CAP = 0.9
const REST = 0.8
const LOOP = PLAY + HOLD + CAP + REST
const TAIL = 0.3
const STOP_FRAC = 0.66

// A small, always-present phrase. No randomness → reproducible settled frame.
const WAVE = ((n: number) => {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const env = 0.55 + 0.45 * Math.sin(Math.PI * t) ** 0.5
    const groove = 0.62 + 0.38 * Math.abs(Math.sin(t * Math.PI * 5.5))
    out.push(Math.max(0.22, Math.min(1, env * groove)))
  }
  return out
})(44)

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x }
function easeOut(x: number): number { return 1 - Math.pow(1 - clamp01(x), 3) }

export interface CaptureTeaseProps {
  /** Pause the loop (e.g. while the button is in its listening state). */
  paused?: boolean
  className?: string
}

export function CaptureTease({ paused = false, className }: CaptureTeaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const cs = getComputedStyle(canvas)
    // `color` is set on the canvas via CSS to the faceplate's ink (cream on accent).
    let ink = cs.color || '#FFF7EB'
    const refreshColors = () => { ink = cs.color || '#FFF7EB' }

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

    const render = (t: number) => {
      ctx.clearRect(0, 0, w, h)

      const tt = t % LOOP
      let headPlayed: number
      let cp: number
      if (tt < PLAY) { headPlayed = (tt / PLAY) * stopIdx; cp = 0 }
      else if (tt < PLAY + HOLD) { headPlayed = stopIdx; cp = 0 }
      else if (tt < PLAY + HOLD + CAP) { headPlayed = stopIdx; cp = (tt - PLAY - HOLD) / CAP }
      else { headPlayed = stopIdx; cp = 1 }

      let fade = 1
      if (tt > LOOP - TAIL) fade = (LOOP - tt) / TAIL

      const padX = w * 0.04
      const span = w - padX * 2
      const midY = h * 0.5
      const maxAmp = Math.min(h * 0.3, midY - h * 0.16)
      const barGap = span / n
      const barW = Math.max(1.3, barGap * 0.4)
      const cpE = easeOut(cp)
      const lift = cpE * h * 0.06
      const playedTo = tt < PLAY ? headPlayed : stopIdx

      for (let i = 0; i < n; i++) {
        const x = padX + (i + 0.5) * barGap
        const inSpan = i <= stopIdx
        const revealed = i <= playedTo
        let amp: number
        let alpha: number
        if (revealed) {
          amp = WAVE[i] * maxAmp
          // caught span brightens; ambient bars stay quiet.
          alpha = inSpan ? 0.42 + 0.5 * cpE : 0.42
        } else {
          amp = WAVE[i] * maxAmp * 0.5
          alpha = 0.16
        }
        const y = midY - (revealed && inSpan ? lift : 0)
        ctx.globalAlpha = fade * alpha
        ctx.fillStyle = ink
        const r = Math.min(barW / 2, amp)
        roundRect(ctx, x - barW / 2, y - amp, barW, Math.max(amp * 2, barW), r)
        ctx.fill()
      }

      // The catch: a slim bracket + a check badge over the played span.
      if (cp > 0) {
        const x0 = padX + 0.5 * barGap - barGap * 0.5
        const xStop = padX + (stopIdx + 0.5) * barGap + barGap * 0.5
        const padFrame = maxAmp * 0.34
        const top = midY - maxAmp - padFrame - lift
        const bot = midY + maxAmp + padFrame - lift
        ctx.save()
        ctx.globalAlpha = fade * cpE * 0.55
        ctx.strokeStyle = ink
        ctx.lineWidth = 1
        roundRect(ctx, x0, top, xStop - x0, bot - top, 6)
        ctx.stroke()
        ctx.restore()

        const bs = easeOut(clamp01((cp - 0.4) / 0.6))
        if (bs > 0) {
          const r = Math.min(h * 0.16, 9) * bs
          const bx = xStop
          const by = top
          ctx.save()
          ctx.globalAlpha = fade
          ctx.fillStyle = ink
          ctx.beginPath()
          ctx.arc(bx, by, r, 0, Math.PI * 2)
          ctx.fill()
          // check punched in the faceplate colour (knockout look on cream badge)
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'
          ctx.lineWidth = 1.6 * bs
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

      // The playhead sweeping the take.
      if (tt < PLAY + HOLD && cp === 0) {
        const hx = padX + (Math.min(playedTo, stopIdx) + 0.5) * barGap
        ctx.save()
        ctx.globalAlpha = fade * 0.85
        ctx.strokeStyle = ink
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(hx, midY - maxAmp * 1.1)
        ctx.lineTo(hx, midY + maxAmp * 1.1)
        ctx.stroke()
        ctx.restore()
      }

      ctx.globalAlpha = 1
    }

    let raf = 0
    let t0 = performance.now()
    let acc = 0
    let last = t0
    const frame = (now: number) => {
      // Freeze time while paused so it resumes smoothly rather than jumping.
      if (!pausedRef.current) acc += (now - last) / 1000
      last = now
      render(acc)
      raf = requestAnimationFrame(frame)
    }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } }

    // No live updates under reduced motion (we render once), so don't poll colours.
    const colorTimer = reduced ? undefined : setInterval(refreshColors, 700)
    const onVis = () => { if (document.hidden) stop(); else if (!reduced) start() }
    document.addEventListener('visibilitychange', onVis)

    if (reduced) {
      render(PLAY + HOLD + CAP + 0.2) // a settled "caught" still
    } else {
      t0 = performance.now()
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
