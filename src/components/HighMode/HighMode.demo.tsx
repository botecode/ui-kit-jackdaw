// src/components/HighMode/HighMode.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { HighMode, type HighInstrumentFx, type HighInstrumentOption, type HighSavedIdea } from './HighMode'
import type { FxPlugin } from '../FxChip'

export const meta: DemoMeta = {
  name: 'High Mode',
  group: 'Composites',
  route: '/high-mode',
  order: 127,
}

const INSTRUMENTS: HighInstrumentOption[] = [
  { id: 'gtr', name: 'Guitar', color: 'var(--track-color-1)', input: 'In 1 · Mono' },
  { id: 'voc', name: 'Vocals', color: 'var(--track-color-3)', input: 'In 2 · Mono' },
  { id: 'keys', name: 'Keys', color: 'var(--track-color-4)', input: 'In 3 · Mono' },
  { id: 'bass', name: 'Bass', color: 'var(--track-color-2)', input: 'In 4 · Mono' },
]

// The host owns each instrument's FX chain (High mode is presentational). Guitar opens
// with a real chain wired from props; Vocals opens empty — the fresh-instrument case.
const INITIAL_FX: Record<string, HighInstrumentFx> = {
  gtr: {
    plugins: [
      { id: 'gtr-eq', name: 'EQ', enabled: true },
      { id: 'gtr-comp', name: 'Comp', enabled: true },
      { id: 'gtr-verb', name: 'Reverb', enabled: false },
    ],
    chainEnabled: true,
  },
  voc: { plugins: [], chainEnabled: true },
}

// What the host's real plugin picker hands back on "+ Add plugin…". High mode never
// fabricates this — the intent opens the picker; the result feeds back through props.
const PICKER_RESULTS = ['Saturator', 'Tape Delay', 'Chorus', 'Plate Reverb', 'Bus Comp']

// A tiny stand-in for the host: holds the chains, applies the FX intents, and simulates
// the picker feeding a real plugin back through props (never a "New FX" placeholder).
function useFxHost(initial: Record<string, HighInstrumentFx>) {
  const [fx, setFx] = useState<Record<string, HighInstrumentFx>>(initial)
  function patch(id: string, fn: (cur: HighInstrumentFx) => HighInstrumentFx) {
    setFx(prev => ({ ...prev, [id]: fn(prev[id] ?? { plugins: [], chainEnabled: true }) }))
  }
  return {
    fx,
    onFxAdd: (id: string) =>
      patch(id, cur => {
        const name = PICKER_RESULTS[cur.plugins.length % PICKER_RESULTS.length]
        const picked: FxPlugin = { id: `${id}-${cur.plugins.length + 1}`, name, enabled: true }
        return { ...cur, plugins: [...cur.plugins, picked] }
      }),
    onFxRemove: (id: string, fxId: string) =>
      patch(id, cur => ({ ...cur, plugins: cur.plugins.filter(p => p.id !== fxId) })),
    onFxTogglePlugin: (id: string, fxId: string, next: boolean) =>
      patch(id, cur => ({ ...cur, plugins: cur.plugins.map(p => (p.id === fxId ? { ...p, enabled: next } : p)) })),
    onFxToggleChain: (id: string, next: boolean) => patch(id, cur => ({ ...cur, chainEnabled: next })),
  }
}

// A device frame so the full-screen flow reads as a room inside the gallery.
function Frame({ height = 720, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        height,
        borderRadius: 'calc(var(--radius) * 2.5)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {children}
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-10)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ font: '600 var(--text-lg)/1.2 var(--font-display)', letterSpacing: '-0.01em', color: 'var(--text)' }}>{title}</h2>
        {hint && <p style={{ font: '400 var(--text-base)/1.5 var(--font-ui)', color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
      {children}
    </section>
  )
}

// Live microphone → spectrum, for testing the reactive backdrop with real input.
// Builds a Web Audio AnalyserNode and hands its FFT (0–1) to HighMode.getSpectrum —
// exactly the shape the real engine will provide. Gallery-only test aid.
function useMicSpectrum() {
  const [getSpectrum, setGetSpectrum] = useState<(() => number[]) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<{ ctx: AudioContext; stream: MediaStream } | null>(null)

  function stop() {
    ref.current?.stream.getTracks().forEach(t => t.stop())
    ref.current?.ctx.close().catch(() => {})
    ref.current = null
    setGetSpectrum(null)
  }

  async function start() {
    setError(null)
    // Insecure context / unsupported browser → no mic API. Degrade gracefully:
    // leave getSpectrum null so HighMode keeps running on its synth fallback.
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone needs a secure (https) context — the room runs on its demo signal instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctor()
      await ctx.resume()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.75
      src.connect(analyser) // analyser only — never to destination (no feedback)
      const bins = new Uint8Array(analyser.frequencyBinCount)
      ref.current = { ctx, stream }
      // Mic sits low; boost a touch and clamp to 1.
      setGetSpectrum(() => () => {
        analyser.getByteFrequencyData(bins)
        return Array.from(bins, v => Math.min(1, (v / 255) * 1.6))
      })
    } catch {
      setError('Microphone blocked or unavailable. Allow access and try again.')
    }
  }

  useEffect(() => stop, [])
  return { getSpectrum, error, on: !!getSpectrum, start, stop }
}

export default function HighModeDemo() {
  const [ideas, setIdeas] = useState<HighSavedIdea[]>([])
  const [exited, setExited] = useState<string | null>(null)
  const [renamed, setRenamed] = useState<Record<string, string>>({})
  const [runKey, setRunKey] = useState(0) // remount to replay the flow
  const mic = useMicSpectrum()
  const fxHost = useFxHost(INITIAL_FX)

  return (
    <DemoShell meta={meta}>
      <Section
        title="The flow"
        hint="Opens on the how-it-works explainer (play, pause, auto-capture). Then pick one or two instruments, start the tape, and pause to review. Trim, play, and save the keepers. Mock high.* bridge — fake silence-split takes appear on pause."
      >
        <Frame>
          <HighMode
            key={runKey}
            instruments={INSTRUMENTS}
            bpm={120}
            processingMs={1100}
            getSpectrum={mic.getSpectrum ?? undefined}
            {...fxHost}
            onSaveIdea={idea => setIdeas(prev => [...prev, idea])}
            onKeepSession={() => setExited('Session kept — the audio is tucked into the nest.')}
            onDiscardSession={() => setExited('Session discarded — travelled light.')}
            onExit={() => { /* host routes back Home */ }}
          />
        </Frame>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => { setIdeas([]); setExited(null); setRunKey(k => k + 1) }}
            style={{
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)',
              font: '500 var(--text-base)/1 var(--font-ui)', cursor: 'pointer',
            }}
          >
            Replay flow
          </button>
          <button
            type="button"
            onClick={() => (mic.on ? mic.stop() : mic.start())}
            aria-pressed={mic.on}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius)',
              border: `1px solid ${mic.on ? 'color-mix(in srgb, var(--led-cyan) 55%, transparent)' : 'var(--border)'}`,
              background: mic.on ? 'color-mix(in srgb, var(--led-cyan) 12%, transparent)' : 'var(--surface)',
              color: mic.on ? 'var(--led-cyan)' : 'var(--text)',
              font: '500 var(--text-base)/1 var(--font-ui)', cursor: 'pointer',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: mic.on ? 'var(--led-cyan)' : 'var(--text-dim)',
                boxShadow: mic.on ? '0 0 8px 1px color-mix(in srgb, var(--led-cyan) 60%, transparent)' : 'none',
              }}
            />
            {mic.on ? 'Stop microphone' : 'Use microphone'}
          </button>
          <div style={{ font: '400 var(--text-sm)/1.6 var(--font-mono)', color: 'var(--text-muted)' }}>
            <div>ideas saved → {ideas.length === 0 ? 'none yet' : ideas.map(i => i.name).join(', ')}</div>
            {mic.on && <div>mic → live · play or sing to drive the halo</div>}
            {mic.error && <div style={{ color: 'var(--danger)' }}>{mic.error}</div>}
            {exited && <div>exit → {exited}</div>}
          </div>
        </div>
      </Section>

      <Section
        title="Input setup (soundcheck)"
        hint="Between the pick and the tape: a LivingInstrumentCard per chosen instrument (max two) to set the input, shape it with the host's real FX chain, and dial the level/pan before you roll. The card name is inline-editable — rename the track before it rolls; the edit fires onInstrumentRename for the host to persist. FX is host-owned — Guitar opens with a real chain from props; Vocals opens empty. Open a chip and hit “+ Add plugin…” to fire the picker intent (the host feeds the picked plugin back through props)."
      >
        <Frame height={640}>
          <HighMode
            instruments={INSTRUMENTS}
            bpm={120}
            initialPhase="setup"
            initialSelectedIds={['gtr', 'voc']}
            onInstrumentRename={(id, name) => setRenamed(prev => ({ ...prev, [id]: name }))}
            {...fxHost}
          />
        </Frame>
        <div style={{ font: '400 var(--text-sm)/1.6 var(--font-mono)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
          renamed → {Object.keys(renamed).length === 0
            ? 'nothing yet — click a card name to rename'
            : Object.entries(renamed).map(([id, name]) => `${id}: ${name}`).join(' · ')}
        </div>
      </Section>

      <Section
        title="Record room — live capture"
        hint="The room IS the catch: your take draws in live, and a pause of a beat or two seals it in place. Turn on the mic above and play or sing — pause to watch a take get caught. Without the mic, a synthesised player auto-captures on a loop."
      >
        <Frame height={620}>
          <HighMode
            instruments={INSTRUMENTS}
            bpm={120}
            initialPhase="recording"
            initialSelectedIds={['gtr', 'voc']}
            getSpectrum={mic.getSpectrum ?? undefined}
          />
        </Frame>
      </Section>

      <Section title="Takes review (the lights come up)" hint="Play each take, trim with the grips, save to Ideas.">
        <Frame height={680}>
          <HighMode
            instruments={INSTRUMENTS}
            bpm={120}
            initialPhase="reviewing"
            initialSelectedIds={['gtr', 'voc']}
            takesSeed={4}
            onSaveIdea={idea => setIdeas(prev => [...prev, idea])}
          />
        </Frame>
      </Section>
    </DemoShell>
  )
}
