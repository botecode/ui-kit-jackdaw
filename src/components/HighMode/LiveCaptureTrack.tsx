// src/components/HighMode/LiveCaptureTrack.tsx
//
// LiveCaptureTrack — the record room as one continuous, rolling take.
//
// The tape never stops while you record. Your input draws in live on a waveform
// that scrolls endlessly (a red head leads it). It does NOT reset or pause between
// ideas — that was disruptive. Instead, when you go quiet for ~3 seconds, the chunk
// you'd just been playing is marked *in place* as captured: those bars warm to
// accent, a frame brackets them, a check blooms — all while the tape keeps
// rolling. Play again and new audio simply continues; the captured chunk
// drifts left and off as the roll moves on.
//
// Signal: getSpectrum() (engine AnalyserNode / gallery mic) → a smoothed level we
// threshold. No input wired → a synth player (a phrase, then a >3s pause) so the
// room demonstrates the catch on a loop.
//
// Canvas 2D waveform (aria-hidden); a DOM HUD carries the rolling status.
// Pauses when hidden; reduced motion → a settled frame with one captured span.

import { useEffect, useRef, useState } from 'react'
import styles from './LiveCaptureTrack.module.css'

const THRESH = 0.045 // level above this counts as "playing"
const SAMPLE_DT = 0.06 // seconds of audio per waveform bar
const SLOTS = 150 // visible bars (~9s window) before the tape scrolls
const CAPTURE_GAP = 3.0 // seconds of quiet that seal the preceding chunk
const MIN_PHRASE = 0.6 // ignore sounded chunks shorter than this
const HOLD_SHOW = 0.45 // quiet beyond this reads as "holding" (vs playing jitter)
const CAUGHT_FLASH = 1.2 // how long the status reads "Take caught"
const FRESH_GLOW = 1.2 // how long a freshly-caught span glows

type TState = 'listening' | 'recording' | 'holding' | 'caught'

const STATUS_TEXT: Record<TState, string> = {
  listening: 'Listening for your idea…',
  recording: 'Rolling…',
  holding: 'Hold a moment — sealing the take',
  caught: 'Take caught ✓',
}

// Synthesised level when no input is wired: a phrase, then a >3s pause (so it
// auto-captures), looping. No randomness reaching render.
function synthLevel(t: number): number {
  const period = 9
  const tt = t % period
  if (tt < 4) {
    const env = Math.sin((tt / 4) * Math.PI)
    const wobble = 0.55 + 0.45 * Math.abs(Math.sin(tt * 6.2))
    return Math.max(0, 0.1 + env * 0.52 * wobble)
  }
  return 0.006
}

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x }
function easeOut(x: number): number { return 1 - Math.pow(1 - clamp01(x), 3) }

interface Range { a: number; b: number; t: number } // absolute sample indices + capture time

export interface LiveCaptureTrackProps {
  /** Run the loop. False (or reduced motion) → a still frame. */
  active: boolean
  /** Live spectrum 0–1 (engine AnalyserNode / mic). Omitted → a synth player. */
  getSpectrum?: () => number[]
  /** A chunk was sealed (after a 3s pause). Reports its sounded length in seconds. */
  onCapture?: (durationSeconds: number) => void
  className?: string
}

export function LiveCaptureTrack({ active, getSpectrum, onCapture, className }: LiveCaptureTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const live = useRef({ active, getSpectrum, onCapture })
  live.current = { active, getSpectrum, onCapture }

  const [status, setStatus] = useState<TState>('listening')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const cs = getComputedStyle(canvas)
    let bone = cs.getPropertyValue('--stage-text').trim() || '#FFF7EB'
    let accent = cs.getPropertyValue('--accent').trim() || '#EE5E2A'
    let rec = cs.getPropertyValue('--led-red').trim() || '#E74B37'
    let onAccent = cs.getPropertyValue('--accent-contrast').trim() || '#FFF7EB'
    const refreshColors = () => {
      bone = cs.getPropertyValue('--stage-text').trim() || '#FFF7EB'
      accent = cs.getPropertyValue('--accent').trim() || '#EE5E2A'
      rec = cs.getPropertyValue('--led-red').trim() || '#E74B37'
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

    // ── Rolling buffer + capture bookkeeping (absolute sample indices) ──────────
    const samples: number[] = []
    let totalAppended = 0
    const ranges: Range[] = []
    let segActive = false
    let segStartAbs = 0
    let lastSoundAbs = 0
    let lastSoundT = -999
    let everSounded = false
    let caughtUntil = -999
    let lvlS = 0
    let sampleAcc = 0
    let curState: TState = 'listening'

    const setStateOnce = (s: TState) => { if (s !== curState) { curState = s; setStatus(s) } }

    const readLevel = (t: number) => {
      const p = live.current
      let raw: number
      if (p.getSpectrum) {
        const s = p.getSpectrum()
        const n = s.length || 1
        let sum = 0
        for (let i = 0; i < n; i++) sum += s[i] || 0
        raw = Math.min(1, (sum / n) * 1.4)
      } else {
        raw = synthLevel(t)
      }
      lvlS += (raw - lvlS) * (raw > lvlS ? 0.5 : 0.2) // fast attack, slow release
      return lvlS
    }

    const step = (t: number, dt: number) => {
      const level = readLevel(t)
      sampleAcc += dt
      // Append at a fixed cadence so the tape rolls steadily regardless of fps.
      while (sampleAcc >= SAMPLE_DT) {
        sampleAcc -= SAMPLE_DT
        const abs = totalAppended
        samples.push(Math.max(0.04, Math.min(1, level * 1.2)))
        if (samples.length > SLOTS) samples.shift()
        totalAppended++

        const sounding = level > THRESH
        if (sounding) {
          everSounded = true
          lastSoundAbs = abs
          lastSoundT = t
          if (!segActive) { segActive = true; segStartAbs = abs }
        } else if (segActive) {
          const gap = (abs - lastSoundAbs) * SAMPLE_DT
          if (gap >= CAPTURE_GAP) {
            const segLen = (lastSoundAbs - segStartAbs) * SAMPLE_DT
            if (segLen >= MIN_PHRASE) {
              ranges.push({ a: segStartAbs, b: lastSoundAbs, t })
              caughtUntil = t + CAUGHT_FLASH
              live.current.onCapture?.(Math.round(segLen * 10) / 10)
            }
            segActive = false
          }
        }
      }
      // prune ranges fully scrolled off the left edge
      const firstVisible = totalAppended - samples.length
      for (let i = ranges.length - 1; i >= 0; i--) if (ranges[i].b < firstVisible) ranges.splice(i, 1)

      // derive HUD status (time-based, smooth)
      const sinceSound = t - lastSoundT
      let s: TState
      if (t < caughtUntil) s = 'caught'
      else if (!everSounded) s = 'listening'
      else if (segActive && sinceSound > HOLD_SHOW) s = 'holding'
      else if (segActive) s = 'recording'
      else s = 'listening'
      setStateOnce(s)
      return level
    }

    const render = (t: number, level: number) => {
      ctx.clearRect(0, 0, w, h)
      const padX = w * 0.05
      const span = w - padX * 2
      const midY = h * 0.5
      const maxAmp = Math.min(h * 0.3, midY - h * 0.18)
      const barGap = span / SLOTS
      const barW = Math.max(1.4, barGap * 0.46)
      const firstVisible = totalAppended - samples.length
      const xForJ = (j: number) => padX + (j + 0.5) * barGap
      const inRange = (abs: number) => {
        for (let i = 0; i < ranges.length; i++) if (abs >= ranges[i].a && abs <= ranges[i].b) return ranges[i]
        return null
      }

      // baseline
      ctx.globalAlpha = 0.12
      ctx.strokeStyle = bone
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(padX, midY); ctx.lineTo(w - padX, midY); ctx.stroke()

      // bars — bone, or accent where captured
      for (let j = 0; j < samples.length; j++) {
        const abs = firstVisible + j
        const r = inRange(abs)
        const amp = samples[j] * maxAmp
        const x = xForJ(j)
        ctx.globalAlpha = r ? 1 : 0.82
        ctx.fillStyle = r ? accent : bone
        const rad = Math.min(barW / 2, amp)
        roundRect(ctx, x - barW / 2, midY - amp, barW, Math.max(amp * 2, barW), rad)
        ctx.fill()
      }

      // capture frames + check badges (one per visible range)
      for (let i = 0; i < ranges.length; i++) {
        const rg = ranges[i]
        const ja = Math.max(0, rg.a - firstVisible)
        const jb = Math.min(samples.length - 1, rg.b - firstVisible)
        if (jb < ja) continue
        const x0 = xForJ(ja) - barGap
        const x1 = xForJ(jb) + barGap
        const padFrame = maxAmp * 0.32
        const top = midY - maxAmp - padFrame
        const bot = midY + maxAmp + padFrame
        const fresh = easeOut(clamp01((t - rg.t) / 0.4)) // draw-in on capture
        const glow = clamp01(1 - (t - rg.t) / FRESH_GLOW)
        ctx.save()
        ctx.globalAlpha = 0.6 * fresh
        ctx.strokeStyle = accent
        ctx.lineWidth = 1.4
        if (glow > 0) { ctx.shadowColor = accent; ctx.shadowBlur = 12 * glow }
        roundRect(ctx, x0, top, x1 - x0, bot - top, 8)
        ctx.stroke()
        ctx.restore()
        // badge
        const r = Math.min(h * 0.13, 10) * fresh
        if (r > 0.5) {
          ctx.save()
          ctx.globalAlpha = 1
          ctx.fillStyle = accent
          if (glow > 0) { ctx.shadowColor = accent; ctx.shadowBlur = 12 * glow }
          ctx.beginPath(); ctx.arc(x1, top, r, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
          ctx.strokeStyle = onAccent; ctx.lineWidth = 1.9 * fresh; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(x1 - r * 0.42, top + r * 0.02)
          ctx.lineTo(x1 - r * 0.08, top + r * 0.36)
          ctx.lineTo(x1 + r * 0.46, top - r * 0.34)
          ctx.stroke()
          ctx.restore()
        }
      }

      // holding countdown — a ring depleting at the pending segment's tail
      if (segActive && curState === 'holding') {
        const gap = t - lastSoundT
        const prog = clamp01(gap / CAPTURE_GAP)
        const jEnd = Math.min(samples.length - 1, lastSoundAbs - firstVisible)
        const x = xForJ(Math.max(0, jEnd))
        const cy = midY - maxAmp - maxAmp * 0.42
        ctx.save()
        ctx.globalAlpha = 0.85
        ctx.strokeStyle = accent
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(x, cy, 8, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // record head — pinned at the newest bar, always live while rolling
      const jHead = samples.length - 1
      if (jHead >= 0) {
        const hx = xForJ(jHead)
        ctx.save()
        ctx.globalAlpha = 0.92
        ctx.strokeStyle = rec
        ctx.lineWidth = 1.6
        ctx.shadowColor = rec
        ctx.shadowBlur = 10
        ctx.beginPath(); ctx.moveTo(hx, midY - maxAmp * 1.12); ctx.lineTo(hx, midY + maxAmp * 1.12); ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = rec
        ctx.beginPath(); ctx.arc(hx, midY - maxAmp * 1.12, 3 + level * 3, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      ctx.globalAlpha = 1
    }

    let raf = 0
    let last = performance.now()
    let t = 0
    let colorTick = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      t += dt
      if ((colorTick += dt) > 0.6) { colorTick = 0; refreshColors() }
      const level = live.current.active ? step(t, dt) : lvlS
      render(t, level)
      raf = requestAnimationFrame(frame)
    }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } }
    const onVis = () => { if (document.hidden) stop(); else if (live.current.active && !reduced) start() }
    document.addEventListener('visibilitychange', onVis)

    if (reduced || !active) {
      // Settled frame: a rolling take with one chunk already captured. When a synth
      // drives the live loop, onCapture fires per synth catch, so the parent's review
      // take-count tracks dwell time — intended self-demo behaviour.
      for (let i = 0; i < SLOTS; i++) {
        const x = i / (SLOTS - 1)
        samples.push(x > 0.62 ? 0.05 : Math.max(0.06, 0.85 * Math.sin(x / 0.62 * Math.PI)))
      }
      totalAppended = SLOTS
      ranges.push({ a: 2, b: Math.round(SLOTS * 0.55), t: -999 })
      setStatus('caught')
      render(0, 0.3)
    } else {
      start()
    }

    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [active])

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.hud}>
        <span className={styles.statusLine} data-state={status}>
          <span className={styles.statusDot} aria-hidden="true" />
          {STATUS_TEXT[status]}
        </span>
        {/* Announce only the capture milestone, not every state flip. */}
        <span className={styles.srOnly} aria-live="polite">
          {status === 'caught' ? 'Take caught' : ''}
        </span>
      </div>
    </div>
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
