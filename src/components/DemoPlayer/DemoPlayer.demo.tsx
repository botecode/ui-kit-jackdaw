// src/components/DemoPlayer/DemoPlayer.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { Fader } from '../Fader'
import { DemoPlayer } from './DemoPlayer'
import type { DemoPlayerProps } from './DemoPlayer'

export const meta: DemoMeta = {
  name: 'DemoPlayer',
  group: 'Composites',
  route: '/demo-player',
  order: 35,
}

// ─── Synthetic audio + matching peaks ──────────────────────────────────────────
// No bundled audio asset, so we synthesize a short tonal riff into a WAV data URI.
// Playback is REAL (a real <audio> plays it) and the peaks are derived from the
// same signal, so the waveform matches what you hear. Built once at module load.

const SAMPLE_RATE = 8000
const SECONDS = 6
const RIFF = [220, 277, 330, 277, 247, 294, 330, 392] // a wandering minor-ish run

function envelope(t: number): number {
  // gentle fade-in / fade-out so it reads as a phrase, not a buzz
  return Math.min(1, t * 5) * Math.min(1, (SECONDS - t) * 2.5)
}

function sampleAt(t: number): number {
  const note = RIFF[Math.floor(t * 2) % RIFF.length]
  const tone =
    Math.sin(2 * Math.PI * note * t) * 0.5 +
    Math.sin(2 * Math.PI * note * 2 * t) * 0.22 +
    Math.sin(2 * Math.PI * note * 3 * t) * 0.1
  return tone * envelope(t)
}

function buildDemoAudio(): string {
  const n = SAMPLE_RATE * SECONDS
  const buffer = new ArrayBuffer(44 + n * 2)
  const view = new DataView(buffer)
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + n * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, n * 2, true)
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, sampleAt(i / SAMPLE_RATE) * 0.6))
    view.setInt16(44 + i * 2, s * 32767, true)
  }
  const bytes = new Uint8Array(buffer)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(bin)
}

function buildPeaks(count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i / count) * SECONDS
    return Math.min(1, Math.abs(sampleAt(t)) * 1.4)
  })
}

const DEMO_SRC = buildDemoAudio()
const DEMO_PEAKS = buildPeaks(220)

// ─── Layout helper ──────────────────────────────────────────────────────────────

function Box({ children, width = 340 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── Pinned-status harness (gallery only) ───────────────────────────────────────
// The component is self-driving from its real <audio>, so to show transient
// states statically we reach the inner audio/well and dispatch the same DOM
// events the browser would — no contract pollution, just driving the real thing.

type Pin = 'loading' | 'playing' | 'paused' | 'scrubbing' | 'error' | 'focus'

function Pinned({ pin, ...props }: { pin: Pin } & DemoPlayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const audio = host.querySelector('audio') as HTMLAudioElement | null
    const well = host.querySelector('[data-testid="demoplayer-well"]') as HTMLElement | null
    if (!audio) return

    let ct = pin === 'playing' || pin === 'paused' ? 64 : 0
    Object.defineProperty(audio, 'duration', { configurable: true, get: () => 174 })
    Object.defineProperty(audio, 'currentTime', {
      configurable: true,
      get: () => ct,
      set: v => { ct = v },
    })
    audio.dispatchEvent(new Event('durationchange'))

    switch (pin) {
      case 'loading':
        audio.dispatchEvent(new Event('loadstart'))
        break
      case 'error':
        audio.dispatchEvent(new Event('error'))
        break
      case 'playing':
        audio.dispatchEvent(new Event('play'))
        audio.dispatchEvent(new Event('timeupdate'))
        break
      case 'paused':
        audio.dispatchEvent(new Event('play'))
        audio.dispatchEvent(new Event('timeupdate'))
        audio.dispatchEvent(new Event('pause'))
        break
      case 'focus':
        well?.focus()
        break
      case 'scrubbing':
        if (well) {
          well.getBoundingClientRect = () =>
            ({ left: 0, width: 300, top: 0, height: 56, right: 300, bottom: 56, x: 0, y: 0, toJSON() {} }) as DOMRect
          well.dispatchEvent(
            new PointerEvent('pointerdown', { clientX: 116, bubbles: true, button: 0 }),
          )
        }
        break
    }
  }, [pin])

  return (
    <div ref={ref}>
      <DemoPlayer {...props} />
    </div>
  )
}

// ─── States ─────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="idle (default)">
        <Box>
          <DemoPlayer src={DEMO_SRC} peaks={DEMO_PEAKS} label="Midnight Take" color="var(--track-color-3)" />
        </Box>
      </State>

      <State label="playing — lit (selected)">
        <Box>
          <Pinned pin="playing" src={DEMO_SRC} peaks={DEMO_PEAKS} label="Rooftop Jam" color="var(--track-color-5)" />
        </Box>
      </State>

      <State label="paused — mid-track">
        <Box>
          <Pinned pin="paused" src={DEMO_SRC} peaks={DEMO_PEAKS} label="Slow Burn" color="var(--track-color-2)" />
        </Box>
      </State>

      <State label="loading">
        <Box>
          <Pinned pin="loading" src={DEMO_SRC} peaks={DEMO_PEAKS} label="Buffering…" color="var(--track-color-4)" />
        </Box>
      </State>

      <State label="scrubbing">
        <Box>
          <Pinned pin="scrubbing" src={DEMO_SRC} peaks={DEMO_PEAKS} label="Find the Drop" color="var(--track-color-6)" />
        </Box>
      </State>

      <State label="focus — scrubber ring">
        <Box>
          <Pinned pin="focus" src={DEMO_SRC} peaks={DEMO_PEAKS} label="Tab Target" color="var(--track-color-1)" />
        </Box>
      </State>

      <State label="error">
        <Box>
          <Pinned pin="error" src="/missing.mp3" peaks={DEMO_PEAKS} label="Lost Tape" color="var(--track-color-3)" />
        </Box>
      </State>

      <State label="disabled">
        <Box>
          <DemoPlayer src={DEMO_SRC} peaks={DEMO_PEAKS} label="Locked" color="var(--track-color-5)" disabled />
        </Box>
      </State>

      <State label="empty — no peaks">
        <Box>
          <DemoPlayer src="" peaks={[]} label="No Take Yet" />
        </Box>
      </State>

      <State label="sm size">
        <Box width={300}>
          <DemoPlayer src={DEMO_SRC} peaks={DEMO_PEAKS} label="Pocket Demo" color="var(--track-color-4)" size="sm" />
        </Box>
      </State>
    </StatesGrid>
  )
}

// ─── Playground (dogfooded kit controls) ────────────────────────────────────────

function PlaygroundDemo() {
  const [compact, setCompact] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [level, setLevel] = useState(0.8)
  const hostRef = useRef<HTMLDivElement>(null)
  const [log, setLog] = useState<string>('idle')

  // The host owns output level — not part of the UI contract — so we reach the
  // real <audio> to apply it, the way a site wrapping the player would.
  useEffect(() => {
    const audio = hostRef.current?.querySelector('audio') as HTMLAudioElement | null
    if (audio) audio.volume = level
  }, [level, compact, disabled])

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
        <div ref={hostRef}>
          <Box width={420}>
            <DemoPlayer
              src={DEMO_SRC}
              peaks={DEMO_PEAKS}
              label="Live demo — synth riff"
              color="var(--track-color-5)"
              size={compact ? 'sm' : 'md'}
              disabled={disabled}
              onPlay={() => setLog('playing')}
              onPause={() => setLog('paused')}
              onSeek={s => setLog(`seek → ${s.toFixed(1)}s`)}
              onEnded={() => setLog('ended')}
            />
          </Box>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          last intent: {log}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={disabled} onChange={setDisabled} aria-label="Disabled" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Disabled</span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Output level (host)</span>
            <Fader
              value={level}
              min={0}
              max={1}
              onChange={setLevel}
              orientation="horizontal"
              aria-label="Output level"
            />
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function DemoPlayerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
